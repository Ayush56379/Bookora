/* Bookora fast Firebase bootstrap.
   Initializes Firebase + durable Firestore cache before SPA/state boot,
   then keeps a lightweight approved-books listener so the homepage can
   render catalog data as soon as Firestore has it. */
(() => {
  const MASTER_ADMIN_EMAIL = 'ayushprajpati6@gmail.com';
  const CATALOG_CACHE_KEY = 'bookora_public_catalog_v2';

  const init = () => {
    try {
      if (!window.firebase?.initializeApp) return false;
      if (!window.firebase.apps?.length) {
        window.firebase.initializeApp({
          apiKey: 'AIzaSyDgPa6d8gxRhrJEaPyKuki2hbSfAU-94',
          authDomain: 'bookora-676bf.firebaseapp.com',
          projectId: 'bookora-676bf',
          storageBucket: 'bookora-676bf.firebasestorage.app',
          messagingSenderId: '520063789526',
          appId: '1:520063789526:web:e85773de48d2a56034dc77',
          measurementId: 'G-JB9D643JNT'
        });
      }

      const db = window.firebase.firestore();
      try {
        db.settings({ cacheSizeBytes: window.firebase.firestore.CACHE_SIZE_UNLIMITED });
      } catch (_) {}

      db.enablePersistence({ synchronizeTabs: true }).catch(error => {
        if (!['failed-precondition', 'unimplemented'].includes(error?.code)) {
          console.info('[Bookora Firestore] persistence:', error?.message || error);
        }
      });

      if (!window.__BOOKORA_APPROVED_BOOKS_LISTENER__) {
        window.__BOOKORA_APPROVED_BOOKS_LISTENER__ = true;
        const query = db.collection('books').where('status', '==', 'approved');

        query.onSnapshot(
          { includeMetadataChanges: true },
          snapshot => {
            const books = snapshot.docs.map(doc => ({ id: String(doc.id), ...doc.data() }));
            window.__BOOKORA_FAST_BOOKS__ = books;

            try {
              if (books.length) {
                localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({
                  savedAt: Date.now(),
                  books
                }));
              }
            } catch (_) {}

            window.dispatchEvent(new CustomEvent('bookora:fast-catalog', {
              detail: {
                books,
                fromCache: Boolean(snapshot.metadata?.fromCache)
              }
            }));
          },
          error => {
            console.warn('[Bookora Firestore] approved-books listener:', error?.message || error);
            window.__BOOKORA_APPROVED_BOOKS_LISTENER__ = false;
          }
        );
      }

      // Restore the user's last allowed mode after state.js has initialized.
      // The normal role-derived mode remains the fallback for new sessions.
      window.addEventListener('load', async () => {
        try {
          const savedMode = localStorage.getItem('bookora_active_mode');
          if (!savedMode) return;
          const { state } = await import('./state.js');
          const allowed = savedMode === 'buyer' ||
            (savedMode === 'seller' && state.isSeller) ||
            (savedMode === 'admin' && state.isAdmin);
          if (allowed && state.activeMode !== savedMode) {
            state.setActiveMode(savedMode);
            window.__BOOKORA_APP_INSTANCE__?.route(true, false);
          }
        } catch (error) {
          console.info('[Bookora mode restore]', error?.message || error);
        }
      }, { once: true });

      return true;
    } catch (error) {
      console.warn('[Bookora Firebase bootstrap]', error);
      return false;
    }
  };

  if (!init()) {
    const retry = () => {
      if (init()) window.removeEventListener('load', retry);
    };
    window.addEventListener('load', retry, { once: true });
  }
})();
