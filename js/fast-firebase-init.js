/* Bookora fast Firebase bootstrap.
   Performance-safe bootstrap: Firebase work must never monopolize the
   homepage main thread or block clicks/navigation. */
(() => {
  const CATALOG_CACHE_KEY = 'bookora_public_catalog_v2';
  let modeSyncScheduled = false;
  let catalogStateHydration = null;

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

  // Hydrate the canonical BookoraState from the realtime Firebase catalog.
  // The previous fast listener only stored data on window.__BOOKORA_FAST_BOOKS__,
  // leaving Explore's canonical state empty and causing "Showing 0 eBooks".
  const hydrateCatalogState = books => {
    const apply = ({ state }) => {
      try {
        const normalized = (Array.isArray(books) ? books : [])
          .map(book => typeof state.normalizeBook === 'function' ? state.normalizeBook(book) : book)
          .filter(Boolean)
          .filter(book => String(book.status || '').toLowerCase() === 'approved');
        state.books = normalized;
        state.booksLoaded = true;
        state.booksLoading = false;
        if (typeof state.persistCatalogCache === 'function') state.persistCatalogCache(normalized);
        if (typeof state.notify === 'function') state.notify('DATA_SYNCED');
        window.__BOOKORA_FIREBASE_CATALOG_READY__ = true;
        window.dispatchEvent(new CustomEvent('bookora:catalog-updated', { detail: { books: normalized, source: 'firebase-realtime' } }));
      } catch (error) {
        console.warn('[Bookora Firebase] catalog state hydration failed:', error?.message || error);
      }
    };
    try {
      if (window.__BOOKORA_STATE_MODULE__) {
        apply(window.__BOOKORA_STATE_MODULE__);
        return;
      }
      if (!catalogStateHydration) catalogStateHydration = import('./state.js').then(mod => {
        window.__BOOKORA_STATE_MODULE__ = mod;
        return mod;
      });
      catalogStateHydration.then(apply).catch(error => console.warn('[Bookora Firebase] state import failed:', error?.message || error));
    } catch (error) {
      console.warn('[Bookora Firebase] state hydration scheduling failed:', error?.message || error);
    }
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

      // Keep Firebase Authentication and the Firestore `users` profile collection
      // in sync. Only create the document when it is genuinely missing; existing
      // user profiles are never overwritten or modified by this repair layer.
      const ensureUserProfile = async firebaseUser => {
        if (!firebaseUser?.uid) return;
        try {
          const userRef = db.collection('users').doc(String(firebaseUser.uid));
          const existing = await userRef.get();
          if (existing.exists) return;

          const profile = {
            id: String(firebaseUser.uid),
            uid: String(firebaseUser.uid),
            firebaseUid: String(firebaseUser.uid),
            name: firebaseUser.displayName || 'Bookora User',
            email: firebaseUser.email || '',
            role: 'buyer',
            avatar: firebaseUser.photoURL || '',
            photoURL: firebaseUser.photoURL || '',
            status: 'active',
            seller_status: 'none',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          const serverTimestamp = window.firebase?.firestore?.FieldValue?.serverTimestamp;
          if (serverTimestamp) {
            profile.createdAt = serverTimestamp();
            profile.updatedAt = serverTimestamp();
          }
          await userRef.set(profile, { merge: false });
          console.log('✓ Firebase user profile created in Cloud Firestore:', firebaseUser.uid);
        } catch (error) {
          // A Firestore permission/network issue must never block authentication.
          console.warn('[Bookora Firestore] user profile sync:', error?.message || error);
        }
      };

      if (!window.__BOOKORA_FIREBASE_USER_PROFILE_SYNC__) {
        window.__BOOKORA_FIREBASE_USER_PROFILE_SYNC__ = true;
        window.firebase.auth().onAuthStateChanged(firebaseUser => {
          if (firebaseUser) void ensureUserProfile(firebaseUser);
        });
      }

      if (!window.__BOOKORA_APPROVED_BOOKS_LISTENER__) {
        window.__BOOKORA_APPROVED_BOOKS_LISTENER__ = true;
        // No artificial limit: Explore must receive every approved eBook in Firebase.
        const query = db.collection('books').where('status', '==', 'approved');
        query.onSnapshot(
          { includeMetadataChanges: false },
          snapshot => {
            const books = snapshot.docs.map(doc => ({ id: String(doc.id), ...doc.data() }));
            window.__BOOKORA_FAST_BOOKS__ = books;
            hydrateCatalogState(books);
            // Keep a complete approved catalog cache for fast reloads.
            try {
              localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), books }));
            } catch (error) {
              // Quota errors must never break the page; Firebase remains source of truth.
              console.info('[Bookora Firestore] catalog cache skipped:', error?.message || error);
            }
            window.dispatchEvent(new CustomEvent('bookora:fast-catalog', {
              detail: { books, fromCache: Boolean(snapshot.metadata?.fromCache) }
            }));
          },
          error => {
            console.warn('[Bookora Firestore] approved-books listener:', error?.message || error);
            window.__BOOKORA_APPROVED_BOOKS_LISTENER__ = false;
            window.dispatchEvent(new CustomEvent('bookora:catalog-error', { detail: { error } }));
          }
        );
      }

      window.addEventListener('load', async () => {
        try {
          const { state } = await import('./state.js');
          window.__BOOKORA_STATE_MODULE__ = { state };
          const savedMode = localStorage.getItem('bookora_active_mode');
          if (savedMode) {
            const allowed = savedMode === 'buyer' || (savedMode === 'seller' && state.isSeller) || (savedMode === 'admin' && state.isAdmin);
            if (allowed && state.activeMode !== savedMode) {
              state.setActiveMode(savedMode);
              window.__BOOKORA_APP_INSTANCE__?.route(true, false);
            }
          }
          // If the realtime snapshot arrived before state.js finished loading,
          // hydrate it now from the in-memory Firebase payload.
          if (Array.isArray(window.__BOOKORA_FAST_BOOKS__)) hydrateCatalogState(window.__BOOKORA_FAST_BOOKS__);
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