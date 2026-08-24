/* Bookora API auth bridge — Firebase -> Bookora backend authentication. */
(() => {
  if (window.__BOOKORA_API_AUTH_BRIDGE__) return;
  window.__BOOKORA_API_AUTH_BRIDGE__ = true;

  const API_ROOT = String(window.BOOKORA_API_URL || '').replace(/\/$/, '');
  const BACKEND_TOKEN_KEY = 'bookora_auth_token';
  const originalFetch = window.fetch.bind(window);
  let authUser = null;
  let auth = null;
  let authListenerInstalled = false;
  let firebaseAuthResolved = false;
  let firebaseAuthResolve = null;
  let firebaseAuthReady = new Promise(resolve => { firebaseAuthResolve = resolve; });
  let tokenPromise = null;

  const isBackendRequest = input => {
    const raw = typeof input === 'string' ? input : (input?.url || '');
    if (!raw) return false;
    try {
      const url = new URL(raw, location.href);
      return Boolean(API_ROOT)
        ? (url.href.startsWith(API_ROOT + '/') || url.href === API_ROOT)
        : url.pathname.startsWith('/api/');
    } catch (_) {
      return String(raw).startsWith(API_ROOT) || String(raw).startsWith('/api/');
    }
  };

  const pathOf = input => {
    try { return new URL(typeof input === 'string' ? input : input?.url || '', location.href).pathname; }
    catch (_) { return ''; }
  };

  const readBackendToken = () => {
    try { return String(localStorage.getItem(BACKEND_TOKEN_KEY) || '').trim(); }
    catch (_) { return ''; }
  };

  const clearBackendToken = () => {
    try { localStorage.removeItem(BACKEND_TOKEN_KEY); } catch (_) {}
  };

  const getAuthInstance = () => {
    try {
      if (auth) return auth;
      if (window.firebase?.auth) {
        auth = window.firebase.auth();
        return auth;
      }
    } catch (_) {}
    return null;
  };

  const markAuthResolved = () => {
    if (firebaseAuthResolved) return;
    firebaseAuthResolved = true;
    try { firebaseAuthResolve(); } catch (_) {}
  };

  const installAuthListener = () => {
    if (authListenerInstalled) return true;
    const instance = getAuthInstance();
    if (!instance?.onAuthStateChanged) return false;
    authListenerInstalled = true;
    instance.onAuthStateChanged(user => {
      authUser = user || null;
      markAuthResolved();
      if (!authUser) clearBackendToken();
      else getFirebaseIdToken(false).catch(() => {});
    });
    return true;
  };

  const waitForFirebaseAuth = async () => {
    for (let i = 0; i < 40; i++) {
      installAuthListener();
      const instance = getAuthInstance();
      const user = authUser || instance?.currentUser || null;
      if (user) {
        authUser = user;
        return user;
      }
      if (firebaseAuthResolved) return null;
      await Promise.race([
        firebaseAuthReady,
        new Promise(resolve => setTimeout(resolve, 250))
      ]);
    }
    return authUser || getAuthInstance()?.currentUser || null;
  };

  const getFirebaseIdToken = async forceRefresh => {
    const user = authUser || getAuthInstance()?.currentUser || null;
    if (!user) return '';
    try { return await user.getIdToken(Boolean(forceRefresh)); }
    catch (error) {
      console.warn('[Bookora API Auth] Firebase ID token unavailable:', error?.message || error);
      return '';
    }
  };

  const getAuthToken = async forceRefresh => {
    const user = await waitForFirebaseAuth();
    if (user) {
      if (tokenPromise && !forceRefresh) return tokenPromise;
      tokenPromise = getFirebaseIdToken(Boolean(forceRefresh)).finally(() => { tokenPromise = null; });
      const firebaseToken = await tokenPromise;
      if (firebaseToken) return firebaseToken;
    }
    // Preserve legacy email/password sessions for flows that do not use Firebase Auth.
    return readBackendToken();
  };

  installAuthListener();
  const firebaseBootstrapTimer = setInterval(() => {
    if (installAuthListener()) clearInterval(firebaseBootstrapTimer);
  }, 250);
  setTimeout(() => { clearInterval(firebaseBootstrapTimer); markAuthResolved(); }, 15000);

  window.fetch = async (input, init = {}) => {
    if (!isBackendRequest(input)) return originalFetch(input, init);
    // The Firebase exchange endpoint already receives the raw Firebase ID token.
    if (pathOf(input) === '/api/auth/firebase') return originalFetch(input, init);

    const headers = new Headers(
      init?.headers || (input instanceof Request ? input.headers : undefined)
    );

    const token = await getAuthToken(false);
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const firstInit = { ...init, headers };
    let response = await originalFetch(input, firstInit);

    // Refresh Firebase ID token exactly once after a 401, then retry exactly once.
    if (response.status === 401 && authUser) {
      try {
        const freshFirebaseToken = await getAuthToken(true);
        if (freshFirebaseToken) {
          headers.set('Authorization', `Bearer ${freshFirebaseToken}`);
          response = await originalFetch(input, { ...firstInit, headers });
        }
      } catch (error) {
        console.warn('[Bookora API Auth] Firebase token refresh failed:', error?.message || error);
      }
    }
    return response;
  };

  console.info('[Bookora API Auth] Firebase ID-token bridge installed.');
})();
