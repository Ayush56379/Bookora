/* Lightweight Firestore book-create sync bridge.
 * IMPORTANT: never scan the entire books collection during page startup.
 * Drive-ID repair is intentionally opt-in through repairExistingDriveIds().
 */
(function () {
  'use strict';
  const originalFetch = window.fetch.bind(window);

  function waitForFirebase(timeoutMs = 5000) {
    return new Promise(resolve => {
      const started = Date.now();
      const check = () => {
        try {
          if (window.firebase?.apps?.length && typeof window.firebase.auth === 'function' && typeof window.firebase.firestore === 'function') return resolve(true);
        } catch (_) {}
        if (Date.now() - started >= timeoutMs) return resolve(false);
        setTimeout(check, 100);
      };
      check();
    });
  }

  async function syncBookToFirestore(book) {
    if (!book?.id || !(await waitForFirebase())) return false;
    try {
      const user = window.firebase.auth().currentUser;
      if (!user) return false;
      const data = { ...book, id: String(book.id), firebaseUid: user.uid, creatorFirebaseUid: user.uid, sellerFirebaseUid: user.uid, backendSynced: true };
      await window.firebase.firestore().collection('books').doc(String(book.id)).set(data, { merge: true });
      return true;
    } catch (error) {
      console.warn('Bookora Firestore create-sync skipped:', error?.message || error);
      return false;
    }
  }

  // Kept as an explicit/manual repair API. It is NOT executed automatically
  // on login or page load, because a collection-wide read can block startup.
  async function repairExistingDriveIds() {
    if (!(await waitForFirebase())) return false;
    try {
      const user = window.firebase.auth().currentUser;
      if (!user) return false;
      const db = window.firebase.firestore();
      const snapshot = await db.collection('books').get();
      const updates = [];
      snapshot.forEach(doc => {
        const book = doc.data() || {};
        const pdf = String(book.pdf_file_id || book.pdfFileId || book.driveFileId || '').trim();
        const cover = String(book.cover_file_id || book.coverFileId || '').trim();
        const patch = {};
        const pdfUrl = String(book.pdf_url || book.pdfUrl || '');
        const coverUrl = String(book.cover_url || book.coverUrl || '');
        const pdfId = pdf || (pdfUrl.match(/[?&]id=([A-Za-z0-9_-]{10,})/i)?.[1] || pdfUrl.match(/\/d\/([A-Za-z0-9_-]{10,})/i)?.[1] || '');
        const coverId = cover || (coverUrl.match(/[?&]id=([A-Za-z0-9_-]{10,})/i)?.[1] || coverUrl.match(/\/d\/([A-Za-z0-9_-]{10,})/i)?.[1] || '');
        if (!pdf && pdfId) { patch.pdf_file_id = pdfId; patch.pdfFileId = pdfId; patch.driveFileId = pdfId; }
        if (!cover && coverId) { patch.cover_file_id = coverId; patch.coverFileId = coverId; }
        if (Object.keys(patch).length) updates.push(db.collection('books').doc(doc.id).set(patch, { merge: true }));
      });
      if (updates.length) await Promise.all(updates);
      return true;
    } catch (error) {
      console.warn('Bookora Drive-ID repair skipped:', error?.message || error);
      return false;
    }
  }

  window.BookoraFirestoreBookSync = { syncBookToFirestore, repairExistingDriveIds };

  // Only observe successful book-create API responses. No startup Firestore
  // collection scan and no auth-state-triggered full read.
  window.fetch = async function (...args) {
    const response = await originalFetch(...args);
    try {
      const request = args[0];
      const url = typeof request === 'string' ? request : (request?.url || '');
      if (String(url).includes('/api/books/create') && response.ok) {
        response.clone().json().then(payload => {
          if (payload?.success && payload?.book) syncBookToFirestore(payload.book);
        }).catch(() => {});
      }
    } catch (_) {}
    return response;
  };

  import('./library-identity-hotfix.js?v=20260821-2').catch(() => {});
  import('./legacy-auth-exchange-hotfix.js?v=20260821-1').catch(() => {});
})();
