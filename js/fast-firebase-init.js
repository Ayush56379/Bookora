/* Bookora fast Firebase bootstrap.
   Performance-safe bootstrap: Firebase work must never monopolize the
   homepage main thread or block clicks/navigation. */
(() => {
  const CATALOG_CACHE_KEY = 'bookora_public_catalog_v2';
  const FAST_CATALOG_LIMIT = 40;
  let modeSyncScheduled = false;

  const syncMobileMenuMode = state => {
    const drawer = document.getElementById('mobile-nav-drawer');
    if (!drawer || !state) return;
    const mode = state.activeMode || 'buyer';
    const links = drawer.querySelectorAll('.mobile-drawer-link');
    links.forEach(link => {
      const href = String(link.getAttribute('href') || '');
      let visible = true;
      if (mode === 'admin') visible = ['#/admin', '#/library', '#/orders', '#/profile'].includes(href);
      else if (mode === 'seller') visible = ['#/seller/dashboard', '#/publish', '#/publish/external', '#/seller/wallet', '#/explore', '#/library', '#/orders', '#/profile'].includes(href);
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
    } else if (empty) empty.remove();
  };

  const scheduleModeSync = state => {
    if (modeSyncScheduled) return;
    modeSyncScheduled = true;
    const run = () => { modeSyncScheduled = false; syncMobileMenuMode(state); };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
    else setTimeout(run, 0);
  };

  const init = () => {
    try {
      if (!window.firebase?.initializeApp) return false;
      if (!window.firebase.apps?.length) {
        window.firebase.initializeApp({
          apiKey: 'AIzaSyDgPa6d8gxRhrJEaPyKuki2hbTbSfAU-94',
          authDomain: 'bookora-676bf.firebaseapp.com',
          projectId: 'bookora-676bf',
          storageBucket: 'bookora-676bf.firebasestorage.app',
          messagingSenderId: '520063789526',
          appId: '1:520063789526:web:e85773de48d2a56034dc77',
          measurementId: 'G-JB9D643JNT'
        });
      }
      const db = window.firebase.firestore();
      try { db.settings({ cacheSizeBytes: 256 * 1024 * 1024 }); } catch (_) {}
      db.enablePersistence({ synchronizeTabs: true }).catch(error => {
        if (!['failed-precondition', 'unimplemented'].includes(error?.code)) console.info('[Bookora Firestore] persistence:', error?.message || error);
      });

      if (!window.__BOOKORA_APPROVED_BOOKS_LISTENER__) {
        window.__BOOKORA_APPROVED_BOOKS_LISTENER__ = true;
        const query = db.collection('books').where('status', '==', 'approved').limit(FAST_CATALOG_LIMIT);
        query.onSnapshot(
          { includeMetadataChanges: false },
          snapshot => {
            // Keep the fast homepage payload bounded. Full catalogs are loaded by
            // their dedicated pages and must not be serialized during homepage boot.
            const books = snapshot.docs.map(doc => ({ id: String(doc.id), ...doc.data() }));
            window.__BOOKORA_FAST_BOOKS__ = books;
            // Do not stringify the full Firestore snapshot on the main thread.
            // A small bounded cache is enough for instant homepage paint.
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
            const allowed = savedMode === 'buyer' || (savedMode === 'seller' && state.isSeller) || (savedMode === 'admin' && state.isAdmin);
            if (allowed && state.activeMode !== savedMode) {
              state.setActiveMode(savedMode);
              window.__BOOKORA_APP_INSTANCE__?.route(true, false);
            }
          }
          scheduleModeSync(state);
          state.subscribe(event => {
            if (event === 'MODE_CHANGED' || event === 'USER_LOGGED_IN' || event === 'USER_LOGGED_OUT') scheduleModeSync(state);
          });

          // Observe only the header/drawer area. Observing the entire body made
          // every homepage catalog mutation trigger synchronous DOM work.
          const headerObserverTarget = document.getElementById('header-container') || document.body;
          const observer = new MutationObserver(() => scheduleModeSync(state));
          observer.observe(headerObserverTarget, { childList: true, subtree: true });
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
