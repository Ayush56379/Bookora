/* Bookora API auth bridge — Firebase identity -> direct authenticated backend requests. */
(() => {
  if (window.__BOOKORA_API_AUTH_BRIDGE__) return;
  window.__BOOKORA_API_AUTH_BRIDGE__ = true;

  const RETIRED_API_ROOT = 'https://bookora-backend-x081.onrender.com';
  const CURRENT_API_ROOT = 'https://bookora-backend-x08l.onrender.com';
  const API_ROOT = CURRENT_API_ROOT;
  const normalizeBackendUrl = raw => String(raw || '').replace(RETIRED_API_ROOT, CURRENT_API_ROOT);
  const originalFetch = window.fetch.bind(window);
  let authUser = null;
  let auth = null;
  let authListenerInstalled = false;
  let firebaseAuthResolved = false;
  let firebaseAuthResolve = null;
  let firebaseAuthReady = new Promise(resolve => { firebaseAuthResolve = resolve; });
  let tokenPromise = null;

  const PUBLIC_GET_PATHS = new Set(['/api/books','/api/fx/rates','/api/trending','/api/bestsellers','/api/new-releases','/api/categories']);

  const normalizeInput = input => {
    if (typeof input === 'string') return normalizeBackendUrl(input);
    if (typeof Request !== 'undefined' && input instanceof Request) {
      const normalizedUrl = normalizeBackendUrl(input.url);
      if (normalizedUrl !== input.url) return new Request(normalizedUrl, input);
    }
    return input;
  };

  const isBackendRequest = input => {
    const raw = typeof input === 'string' ? input : (input?.url || '');
    if (!raw) return false;
    try {
      const url = new URL(normalizeBackendUrl(raw), location.href);
      return url.href === API_ROOT || url.href.startsWith(API_ROOT + '/');
    } catch (_) { return String(normalizeBackendUrl(raw)).startsWith(API_ROOT); }
  };

  const pathOf = input => {
    try { return new URL(normalizeBackendUrl(typeof input === 'string' ? input : input?.url || ''), location.href).pathname; }
    catch (_) { return ''; }
  };

  const getAuthInstance = () => {
    try {
      if (auth) return auth;
      if (window.firebase?.auth) { auth = window.firebase.auth(); return auth; }
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
    instance.onAuthStateChanged(user => { authUser = user || null; markAuthResolved(); });
    return true;
  };

  const waitForFirebaseAuth = async () => {
    for (let i = 0; i < 20; i++) {
      installAuthListener();
      const instance = getAuthInstance();
      const user = authUser || instance?.currentUser || null;
      if (user) { authUser = user; return user; }
      if (firebaseAuthResolved) return null;
      await Promise.race([firebaseAuthReady, new Promise(resolve => setTimeout(resolve, 150))]);
    }
    return authUser || getAuthInstance()?.currentUser || null;
  };

  const getFirebaseIdToken = async forceRefresh => {
    const user = authUser || getAuthInstance()?.currentUser || null;
    if (!user) return '';
    try { return await user.getIdToken(Boolean(forceRefresh)); }
    catch (error) { console.warn('[Bookora API Auth] Firebase ID token unavailable:', error?.message || error); return ''; }
  };

  const getAuthToken = async forceRefresh => {
    const user = await waitForFirebaseAuth();
    if (!user) return '';
    if (tokenPromise && !forceRefresh) return tokenPromise;
    tokenPromise = getFirebaseIdToken(Boolean(forceRefresh)).finally(() => { tokenPromise = null; });
    return await tokenPromise;
  };

  installAuthListener();
  const firebaseBootstrapTimer = setInterval(() => { if (installAuthListener()) clearInterval(firebaseBootstrapTimer); }, 500);
  setTimeout(() => { clearInterval(firebaseBootstrapTimer); markAuthResolved(); }, 5000);

  window.fetch = async (input, init = {}) => {
    const normalizedInput = normalizeInput(input);
    if (!isBackendRequest(normalizedInput)) return originalFetch(normalizedInput, init);
    const path = pathOf(normalizedInput);
    const method = String(init?.method || (normalizedInput instanceof Request ? normalizedInput.method : 'GET')).toUpperCase();
    const headers = new Headers(init?.headers || (normalizedInput instanceof Request ? normalizedInput.headers : undefined));
    if (path === '/api/auth/firebase') return originalFetch(normalizedInput, init);

    // Public GETs must never wait for Firebase auth hydration. This keeps the
    // homepage/catalog/navigation responsive on a cold browser session.
    const isPublicGet = method === 'GET' && PUBLIC_GET_PATHS.has(path);
    if (!isPublicGet) {
      const token = await getAuthToken(false);
      if (token) headers.set('Authorization', `Bearer ${token}`);
    } else if (authUser) {
      // Optional token only; never delay the public request for it.
      getFirebaseIdToken(false).then(token => { if (token) headers.set('Authorization', `Bearer ${token}`); }).catch(() => {});
    }

    let response = await originalFetch(normalizedInput, { ...init, headers });
    if (response.status === 401 && authUser) {
      try {
        const freshFirebaseToken = await getAuthToken(true);
        if (freshFirebaseToken) { headers.set('Authorization', `Bearer ${freshFirebaseToken}`); response = await originalFetch(normalizedInput, { ...init, headers }); }
      } catch (error) { console.warn('[Bookora API Auth] Firebase token refresh failed:', error?.message || error); }
    }
    return response;
  };

  console.info('[Bookora API Auth] Non-blocking Firebase auth bridge installed. Current backend:', CURRENT_API_ROOT);
})();
