/* Bookora Firestore book sync bridge.
 * Preserves the canonical backend record and safely derives Drive file IDs
 * from existing PDF/cover URLs when an API response omitted the ID fields.
 */
(function () {
  'use strict';

  const originalFetch = window.fetch.bind(window);

  function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  async function waitForFirebase(maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i += 1) {
      try {
        if (window.firebase && window.firebase.apps && window.firebase.apps.length && typeof window.firebase.auth === 'function' && typeof window.firebase.firestore === 'function') return true;
      } catch (_) {}
      await sleep(250);
    }
    return false;
  }

  function driveFileId(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^[A-Za-z0-9_-]{20,}$/.test(raw)) return raw;
    for (const pattern of [/[?&]id=([A-Za-z0-9_-]{10,})/i, /\/d\/([A-Za-z0-9_-]{10,})/i, /\/file\/d\/([A-Za-z0-9_-]{10,})/i]) {
      const match = raw.match(pattern);
      if (match?.[1]) return match[1];
    }
    return '';
  }

  function firstValue(book, keys) {
    for (const key of keys) {
      const value = String(book?.[key] || '').trim();
      if (value) return value;
    }
    return '';
  }

  function normalizeBook(book) {
    if (!book || !book.id) return null;
    const now = new Date().toISOString();
    const createdAt = book.createdAt || book.created_at || now;
    const updatedAt = book.updatedAt || book.updated_at || now;
    const pdfUrl = firstValue(book, ['pdf_url', 'pdfUrl', 'file_url', 'fileUrl', 'pdf_download_url', 'pdfDownloadUrl']);
    const coverUrl = firstValue(book, ['cover_url', 'coverUrl', 'front_cover_url', 'frontCoverUrl', 'cover_image_url', 'coverImageUrl']);
    const pdfFileId = firstValue(book, ['pdf_file_id', 'pdfFileId', 'driveFileId', 'drive_file_id']) || driveFileId(pdfUrl);
    const coverFileId = firstValue(book, ['cover_file_id', 'coverFileId']) || driveFileId(coverUrl);
    return {
      id: String(book.id), slug: book.slug || '', title: book.title || '', subtitle: book.subtitle || '', description: book.description || '', author: book.author || '', category: book.category || 'Other', tags: Array.isArray(book.tags) ? book.tags : [], pages: Number(book.pages || 0), format: book.format || 'PDF', language: book.language || 'English', price: Number(book.price || 0), salePrice: book.sale_price ?? book.salePrice ?? null, sale_price: book.sale_price ?? book.salePrice ?? null,
      coverUrl, cover_url: coverUrl, coverFileId, cover_file_id: coverFileId, pdfUrl, pdf_url: pdfUrl, pdfFileId, pdf_file_id: pdfFileId, driveFileId: pdfFileId,
      sourceType: book.source_type || book.sourceType || 'internal', source_type: book.source_type || book.sourceType || 'internal', creatorId: book.creator_id || book.creatorId || '', creator_id: book.creator_id || book.creatorId || '', sellerId: book.seller_id || book.sellerId || '', seller_id: book.seller_id || book.sellerId || '', sellerName: book.seller_name || book.sellerName || book.author || '', seller_name: book.seller_name || book.sellerName || book.author || '', status: String(book.status || 'pending').toLowerCase(),
      isFeatured: Boolean(book.is_featured ?? book.isFeatured), is_featured: Boolean(book.is_featured ?? book.isFeatured), isTrending: Boolean(book.is_trending ?? book.isTrending), is_trending: Boolean(book.is_trending ?? book.isTrending), isBestseller: Boolean(book.is_bestseller ?? book.isBestseller), is_bestseller: Boolean(book.is_bestseller ?? book.isBestseller), isNew: book.is_new ?? book.isNew ?? true, is_new: book.is_new ?? book.isNew ?? true,
      rating: Number(book.rating || 0), reviewCount: Number(book.review_count ?? book.reviewCount ?? 0), review_count: Number(book.review_count ?? book.reviewCount ?? 0), createdAt, created_at: createdAt, updatedAt, updated_at: updatedAt, backendSynced: true, backendBookId: String(book.id)
    };
  }

  async function syncBookToFirestore(book) {
    const normalized = normalizeBook(book);
    if (!normalized) return false;
    if (!await waitForFirebase()) return false;
    const currentUser = window.firebase.auth().currentUser;
    if (!currentUser) return false;
    const db = window.firebase.firestore();
    normalized.firebaseUid = currentUser.uid;
    normalized.creatorFirebaseUid = currentUser.uid;
    normalized.sellerFirebaseUid = currentUser.uid;
    await db.collection('books').doc(normalized.id).set(normalized, { merge: true });
    console.info('Bookora Firestore sync: book saved:', normalized.id, 'pdfFileId:', normalized.pdf_file_id || '(none)');
    return true;
  }

  async function repairExistingDriveIds() {
    if (!await waitForFirebase()) return;
    try {
      const user = window.firebase.auth().currentUser;
      if (!user) return;
      const db = window.firebase.firestore();
      const snapshot = await db.collection('books').get();
      const updates = [];
      snapshot.forEach(doc => {
        const book = doc.data() || {};
        const existingPdfId = String(book.pdf_file_id || book.pdfFileId || book.driveFileId || '').trim();
        const existingCoverId = String(book.cover_file_id || book.coverFileId || '').trim();
        const pdfId = existingPdfId || driveFileId(book.pdf_url || book.pdfUrl || '');
        const coverId = existingCoverId || driveFileId(book.cover_url || book.coverUrl || '');
        const patch = {};
        if (!existingPdfId && pdfId) { patch.pdf_file_id = pdfId; patch.pdfFileId = pdfId; patch.driveFileId = pdfId; }
        if (!existingCoverId && coverId) { patch.cover_file_id = coverId; patch.coverFileId = coverId; }
        if (Object.keys(patch).length) updates.push(db.collection('books').doc(doc.id).set(patch, { merge: true }));
      });
      if (updates.length) await Promise.all(updates);
      console.info('Bookora Firestore Drive-ID repair complete:', updates.length, 'book(s).');
    } catch (error) { console.warn('Bookora Drive-ID repair skipped:', error?.message || error); }
  }

  window.BookoraFirestoreBookSync = { syncBookToFirestore, repairExistingDriveIds };

  (async () => {
    if (!await waitForFirebase()) return;
    try { window.firebase.auth().onAuthStateChanged(user => { if (user) repairExistingDriveIds(); }); } catch (_) {}
  })();

  window.fetch = async function (...args) {
    const response = await originalFetch(...args);
    try {
      const request = args[0];
      const url = typeof request === 'string' ? request : (request && request.url) || '';
      if (String(url).includes('/api/books/create') && response.ok) {
        const clone = response.clone();
        clone.json().then(async payload => {
          if (!payload?.success || !payload?.book) return;
          try { await syncBookToFirestore(payload.book); } catch (error) { console.error('Bookora Firestore sync failed:', error); }
        }).catch(error => console.warn('Bookora Firestore response parse failed:', error));
      }
    } catch (error) { console.warn('Bookora Firestore fetch bridge error:', error); }
    return response;
  };

  import('./library-identity-hotfix.js?v=20260821-2').catch(error => console.warn('[Library Identity Hotfix] load failed:', error));
  import('./legacy-auth-exchange-hotfix.js?v=20260821-1').catch(error => console.warn('[Auth Hotfix] load failed:', error));
})();
