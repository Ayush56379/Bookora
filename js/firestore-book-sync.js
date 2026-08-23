/* Bookora Firestore book sync helper.
 * IMPORTANT: this file must never override window.fetch, scan Firestore, or
 * run work automatically during page startup. The public site must remain
 * independent of this optional synchronization helper.
 */
(function () {
  'use strict';

  function waitForFirebase(timeoutMs = 5000) {
    return new Promise(resolve => {
      const started = Date.now();
      const check = () => {
        try {
          if (window.firebase?.apps?.length &&
              typeof window.firebase.auth === 'function' &&
              typeof window.firebase.firestore === 'function') {
            resolve(true);
            return;
          }
        } catch (_) {}
        if (Date.now() - started >= timeoutMs) {
          resolve(false);
          return;
        }
        setTimeout(check, 100);
      };
      check();
    });
  }

  async function syncBookToFirestore(book) {
    if (!book?.id) return false;
    if (!(await waitForFirebase())) return false;
    try {
      const user = window.firebase.auth().currentUser;
      if (!user) return false;
      const id = String(book.id);
      const data = {
        ...book,
        id,
        firebaseUid: user.uid,
        creatorFirebaseUid: user.uid,
        sellerFirebaseUid: user.uid,
        backendSynced: true
      };
      await window.firebase.firestore().collection('books').doc(id).set(data, { merge: true });
      return true;
    } catch (error) {
      console.warn('Bookora Firestore sync skipped:', error?.message || error);
      return false;
    }
  }

  async function repairExistingDriveIds() {
    if (!(await waitForFirebase())) return false;
    try {
      const user = window.firebase.auth().currentUser;
      if (!user) return false;
      const db = window.firebase.firestore();
      const snapshot = await db.collection('books').get();
      const writes = [];

      snapshot.forEach(doc => {
        const book = doc.data() || {};
        const pdf = String(book.pdf_file_id || book.pdfFileId || book.driveFileId || '').trim();
        const cover = String(book.cover_file_id || book.coverFileId || '').trim();
        const pdfUrl = String(book.pdf_url || book.pdfUrl || '');
        const coverUrl = String(book.cover_url || book.coverUrl || '');
        const pdfId = pdf || (pdfUrl.match(/[?&]id=([A-Za-z0-9_-]{10,})/i)?.[1] || pdfUrl.match(/\/d\/([A-Za-z0-9_-]{10,})/i)?.[1] || '');
        const coverId = cover || (coverUrl.match(/[?&]id=([A-Za-z0-9_-]{10,})/i)?.[1] || coverUrl.match(/\/d\/([A-Za-z0-9_-]{10,})/i)?.[1] || '');
        const patch = {};
        if (!pdf && pdfId) {
          patch.pdf_file_id = pdfId;
          patch.pdfFileId = pdfId;
          patch.driveFileId = pdfId;
        }
        if (!cover && coverId) {
          patch.cover_file_id = coverId;
          patch.coverFileId = coverId;
        }
        if (Object.keys(patch).length) {
          writes.push(db.collection('books').doc(doc.id).set(patch, { merge: true }));
        }
      });

      if (writes.length) await Promise.all(writes);
      console.info('Bookora Drive-ID repair complete:', writes.length, 'book(s).');
      return true;
    } catch (error) {
      console.warn('Bookora Drive-ID repair skipped:', error?.message || error);
      return false;
    }
  }

  window.BookoraFirestoreBookSync = {
    syncBookToFirestore,
    repairExistingDriveIds
  };
})();
