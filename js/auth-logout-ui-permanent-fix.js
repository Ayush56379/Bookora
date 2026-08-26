// Bookora permanent logout consistency fix.
// A logout must clear the local UI session BEFORE navigation so a stale
// admin/buyer header can never survive on the public login page. It also
// prevents an in-flight Firebase session hydration from restoring the user
// after logout has already started.
(() => {
  if (window.__BOOKORA_LOGOUT_UI_PERMANENT_FIX__) return;
  window.__BOOKORA_LOGOUT_UI_PERMANENT_FIX__ = true;

  import('./state.js').then(({ state }) => {
    let logoutEpoch = 0;
    let logoutInProgress = false;

    const clearEverythingLocal = () => {
      try { state.clearLocalSession(); } catch (_) {}
      try {
        localStorage.removeItem('bookora_auth_token');
        localStorage.removeItem('bookora_auth_session_uid');
        localStorage.removeItem('bookora_user_profile');
        localStorage.removeItem('bookora_active_mode');
      } catch (_) {}
      state.token = '';
      state.currentUser = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.isSeller = false;
      state.activeMode = 'buyer';
      state.library = new Set();
      state.wishlist = new Set();
    };

    // Guard any async Firebase profile hydration that was already in flight.
    const originalLoadAuthenticatedUser = state.loadAuthenticatedUser.bind(state);
    state.loadAuthenticatedUser = async firebaseUser => {
      const epochAtStart = logoutEpoch;
      if (logoutInProgress) return;
      await originalLoadAuthenticatedUser(firebaseUser);
      if (logoutInProgress || epochAtStart !== logoutEpoch) {
        clearEverythingLocal();
        state.notify('USER_LOGGED_OUT');
      }
    };

    // Make logout atomic from the UI's perspective: clear first, then revoke
    // Firebase credentials. This removes the stale profile before hash routing.
    state.logout = async () => {
      logoutEpoch += 1;
      logoutInProgress = true;
      clearEverythingLocal();
      state.notify('USER_LOGGED_OUT');

      try {
        if (window.firebase?.apps?.length) {
          const auth = window.firebase.auth();
          if (auth.currentUser) await auth.signOut();
        }
      } catch (error) {
        console.warn('[Bookora Logout] Firebase signOut failed after local cleanup:', error);
      } finally {
        clearEverythingLocal();
        state.notify('USER_LOGGED_OUT');
        logoutInProgress = false;
      }

      // Always land on a genuinely guest-rendered login page.
      if (!String(window.location.hash || '').startsWith('#/login')) {
        window.location.hash = '#/login';
      }
      return true;
    };

    // If another module or Firebase emits the logout event, force the visible
    // header to be rebuilt from the now-empty state instead of leaving stale
    // authenticated DOM behind.
    state.subscribe((event) => {
      if (event !== 'USER_LOGGED_OUT') return;
      clearEverythingLocal();
      const app = window.__BOOKORA_APP_INSTANCE__;
      if (app && typeof app.route === 'function') {
        queueMicrotask(() => {
          try { app.route(true, false); } catch (_) {}
        });
      }
    });

    console.info('[Bookora Logout] Permanent local-session cleanup + stale-header protection installed.');
  }).catch(error => {
    console.warn('[Bookora Logout] Permanent fix could not initialize:', error);
  });
})();
