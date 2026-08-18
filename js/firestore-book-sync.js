/* Bookora Firestore book sync bridge.
 * The upload API stores the canonical record in the backend/Drive database.
 * This bridge mirrors the successful /api/books/create response into the
 * Firestore `books` collection so the existing public pages can discover it.
 */
(function () {
  'use strict';

  const originalFetch = window.fetch.bind(window);

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function waitForFirebase(maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i += 1) {
      try {
        if (
          window.firebase &&
          window.firebase.apps &&
          window.firebase.apps.length &&
          typeof window.firebase.auth === 'function' &&
          typeof window.firebase.firestore === 'function'
        ) {
          return true;
        }
      } catch (_) {}
      await sleep(250);
    }
    return false;
  }

  function normalizeBook(book) {
    if (!book || !book.id) return null;

    const now = new Date().toISOString();
    const createdAt = book.createdAt || book.created_at || now;
    const updatedAt = book.updatedAt || book.updated_at || now;

    return {
      id: String(book.id),
      slug: book.slug || '',
      title: book.title || '',
      subtitle: book.subtitle || '',
      description: book.description || '',
      author: book.author || '',
      category: book.category || 'Other',
      tags: Array.isArray(book.tags) ? book.tags : [],
      pages: Number(book.pages || 0),
      format: book.format || 'PDF',
      language: book.language || 'English',
      price: Number(book.price || 0),
      salePrice: book.sale_price ?? book.salePrice ?? null,
      sale_price: book.sale_price ?? book.salePrice ?? null,
      coverUrl: book.cover_url || book.coverUrl || '',
      cover_url: book.cover_url || book.coverUrl || '',
      coverFileId: book.cover_file_id || book.coverFileId || '',
      cover_file_id: book.cover_file_id || book.coverFileId || '',
      pdfUrl: book.pdf_url || book.pdfUrl || '',
      pdf_url: book.pdf_url || book.pdfUrl || '',
      pdfFileId: book.pdf_file_id || book.pdfFileId || '',
      pdf_file_id: book.pdf_file_id || book.pdfFileId || '',
      driveFileId: book.pdf_file_id || book.pdfFileId || '',
      sourceType: book.source_type || book.sourceType || 'internal',
      source_type: book.source_type || book.sourceType || 'internal',
      creatorId: book.creator_id || book.creatorId || '',
      creator_id: book.creator_id || book.creatorId || '',
      sellerId: book.seller_id || book.sellerId || '',
      seller_id: book.seller_id || book.sellerId || '',
      sellerName: book.seller_name || book.sellerName || book.author || '',
      seller_name: book.seller_name || book.sellerName || book.author || '',
      status: String(book.status || 'pending').toLowerCase(),
      isFeatured: Boolean(book.is_featured ?? book.isFeatured),
      is_featured: Boolean(book.is_featured ?? book.isFeatured),
      isTrending: Boolean(book.is_trending ?? book.isTrending),
      is_trending: Boolean(book.is_trending ?? book.isTrending),
      isBestseller: Boolean(book.is_bestseller ?? book.isBestseller),
      is_bestseller: Boolean(book.is_bestseller ?? book.isBestseller),
      isNew: book.is_new ?? book.isNew ?? true,
      is_new: book.is_new ?? book.isNew ?? true,
      rating: Number(book.rating || 0),
      reviewCount: Number(book.review_count ?? book.reviewCount ?? 0),
      review_count: Number(book.review_count ?? book.reviewCount ?? 0),
      createdAt,
      created_at: createdAt,
      updatedAt,
      updated_at: updatedAt,
      backendSynced: true,
      backendBookId: String(book.id)
    };
  }

  async function syncBookToFirestore(book) {
    const normalized = normalizeBook(book);
    if (!normalized) return false;

    const ready = await waitForFirebase();
    if (!ready) {
      console.warn('Bookora Firestore sync: Firebase did not initialize in time.');
      return false;
    }

    const auth = window.firebase.auth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn('Bookora Firestore sync: no Firebase user is signed in.');
      return false;
    }

    const db = window.firebase.firestore();

    // Keep the Firebase UID available for rules/admin tools even though the
    // backend also stores its own local seller/user ID.
    normalized.firebaseUid = currentUser.uid;
    normalized.creatorFirebaseUid = currentUser.uid;
    normalized.sellerFirebaseUid = currentUser.uid;

    await db.collection('books').doc(normalized.id).set(normalized, { merge: true });
    console.info('Bookora Firestore sync: book saved:', normalized.id);
    return true;
  }

  window.BookoraFirestoreBookSync = { syncBookToFirestore };

  window.fetch = async function (...args) {
    const response = await originalFetch(...args);

    try {
      const request = args[0];
      const url = typeof request === 'string'
        ? request
        : (request && request.url) || '';

      if (String(url).includes('/api/books/create') && response.ok) {
        const clone = response.clone();
        clone.json()
          .then(async payload => {
            if (!payload || !payload.success || !payload.book) return;
            try {
              await syncBookToFirestore(payload.book);
            } catch (error) {
              console.error('Bookora Firestore sync failed:', error);
            }
          })
          .catch(error => console.warn('Bookora Firestore response parse failed:', error));
      }
    } catch (error) {
      console.warn('Bookora Firestore fetch bridge error:', error);
    }

    return response;
  };
})();
