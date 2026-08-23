/* Bookora fast Firebase bootstrap.
   Initializes Firebase + durable Firestore cache before SPA/state boot,
   streams approved books immediately, and keeps the shared header/mobile
   navigation aligned with the active Buyer/Seller/Admin mode. */
(() => {
  const CATALOG_CACHE_KEY = 'bookora_public_catalog_v2';

  const syncMobileMenuMode = state => {
    const drawer = document.getElementById('mobile-nav-drawer');
    if (!drawer || !state) return;

    const mode = state.activeMode || 'buyer';
    const links = drawer.querySelectorAll('.mobile-drawer-link');
    links.forEach(link => {
      const href = String(link.getAttribute('href') || '');
      let visible = true;

      if (mode === 'admin') {
        visible = ['#/admin', '#/library', '#/orders', '#/profile'].includes(href);
      } else if (mode === 'seller') {
        visible = ['#/seller/dashboard', '#/publish', '#/publish/external', '#/seller/wallet', '#/explore', '#/library', '#/orders', '#/profile'].includes(href);
      }

      link.style.display = visible ? '' : 'none';
    });

    const visibleLinks = Array.from(links).filter(link => link.style.display !== 'none');
    const empty = drawer.querySelector('[data-bookora-mobile-mode-empty]');
    if (!visibleLinks.length) {
      if (!empty) {
        const note = document.createElement('div');
        note.dataset.bookoraMobileModeEmpty = '1';
        note.style.cssText = 'padding:14px;color:#64748b;font-size:.82rem;text-align:center;';
        note.textContent = `${mode.charAt(0).toUpperCase() + mode.slice(1)} menu`;
        drawer.querySelector('div[style*="flex-direction: column"]')?.appendChild(note);
      }
    } else if (empty) {
      empty.remove();
    }
  };

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
      try { db.settings({ cacheSizeBytes: window.firebase.firestore.CACHE_SIZE_UNLIMITED }); } catch (_) {}

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
              if (books.length) localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), books }));
            } catch (_) {}
            window.dispatchEvent(new CustomEvent('bookora:fast-catalog', {
              detail: { books, fromCache: Boolean(snapshot.metadata?.fromCache) }
            }));
          },
          error => {
            console.warn('[Bookora Firestore] approved-books listener:', error?.message || error);
            window.__BOOKORA_APPROVED_BOOKS_LISTENER__ = false;
          }
        );
      }

      window.addEventListener('load', async () => {
        try {
          const { state } = await import('./state.js');
          const savedMode = localStorage.getItem('bookora_active_mode');
          if (savedMode) {
            const allowed = savedMode === 'buyer' ||
              (savedMode === 'seller' && state.isSeller) ||
              (savedMode === 'admin' && state.isAdmin);
            if (allowed && state.activeMode !== savedMode) {
              state.setActiveMode(savedMode);
              window.__BOOKORA_APP_INSTANCE__?.route(true, false);
            }
          }

          syncMobileMenuMode(state);
          state.subscribe(event => {
            if (event === 'MODE_CHANGED' || event === 'USER_LOGGED_IN' || event === 'USER_LOGGED_OUT') {
              syncMobileMenuMode(state);
            }
          });

          const observer = new MutationObserver(() => syncMobileMenuMode(state));
          observer.observe(document.body, { childList: true, subtree: true });
          window.__BOOKORA_HEADER_MODE_OBSERVER__ = observer;
        } catch (error) {
          console.info('[Bookora mode/mobile sync]', error?.message || error);
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
