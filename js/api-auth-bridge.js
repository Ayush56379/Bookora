/* Bookora API auth bridge — Firebase identity -> server-issued backend session. */
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
  let firebaseTokenPromise = null;
  let backendSessionPromise = null;

  const PUBLIC_GET_PATHS = new Set(['/api/books','/api/fx/rates','/api/trending','/api/bestsellers','/api/new-releases','/api/categories']);
  const SESSION_EXCHANGE_PATH = '/api/auth/firebase';
  const DIRECT_FIREBASE_SECURITY_PATH = '/api/auth/security-event';

  const normalizeInput = input => {
    if (typeof input === 'string') return normalizeBackendUrl(input);
    if (typeof Request !== 'undefined' && input instanceof Request) {
      const normalizedUrl = normalizeBackendUrl(input.url);
      if (normalizedUrl !== input.url) return new Request(normalizedUrl, input);
    }
    return input;
  };

  const pathOf = input => {
    try { return new URL(normalizeBackendUrl(typeof input === 'string' ? input : input?.url || ''), location.href).pathname; }
    catch (_) { return ''; }
  };

  const isBackendRequest = input => {
    const raw = typeof input === 'string' ? input : (input?.url || '');
    if (!raw) return false;
    try {
      const url = new URL(normalizeBackendUrl(raw), location.href);
      return url.href === API_ROOT || url.href.startsWith(API_ROOT + '/');
    } catch (_) { return String(normalizeBackendUrl(raw)).startsWith(API_ROOT); }
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

  const getFirebaseToken = async forceRefresh => {
    if (firebaseTokenPromise && !forceRefresh) return firebaseTokenPromise;
    firebaseTokenPromise = getFirebaseIdToken(Boolean(forceRefresh)).finally(() => { firebaseTokenPromise = null; });
    return firebaseTokenPromise;
  };

  const getStoredBackendToken = () => {
    try { return String(localStorage.getItem('bookora_auth_token') || '').trim(); } catch (_) { return ''; }
  };

  const setStoredBackendToken = token => {
    try { if (token) localStorage.setItem('bookora_auth_token', token); else localStorage.removeItem('bookora_auth_token'); } catch (_) {}
  };

  const exchangeFirebaseForBackendSession = async forceRefresh => {
    const user = await waitForFirebaseAuth();
    if (!user) return '';
    if (backendSessionPromise && !forceRefresh) return backendSessionPromise;
    backendSessionPromise = (async () => {
      const firebaseToken = await getFirebaseToken(Boolean(forceRefresh));
      if (!firebaseToken) return '';
      const headers = new Headers({ Authorization: `Bearer ${firebaseToken}`, Accept: 'application/json', 'Content-Type': 'application/json' });
      const response = await originalFetch(`${API_ROOT}${SESSION_EXCHANGE_PATH}`, {
        method: 'POST', headers,
        body: JSON.stringify({ name: user.displayName || '', avatar: user.photoURL || '', role: 'buyer' })
      });
      let data = {};
      try { data = await response.json(); } catch (_) {}
      if (!response.ok || !data?.token) {
        const error = new Error(data?.error || 'Bookora authentication session could not be established.');
        error.status = response.status;
        throw error;
      }
      setStoredBackendToken(data.token);
      window.__BOOKORA_BACKEND_USER__ = data.user || null;
      return data.token;
    })().finally(() => { backendSessionPromise = null; });
    return backendSessionPromise;
  };

  const getBackendToken = async forceRefresh => {
    const stored = getStoredBackendToken();
    if (stored && !forceRefresh) return stored;
    return exchangeFirebaseForBackendSession(Boolean(forceRefresh));
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

    // These endpoints must receive the Firebase ID token unchanged. They are
    // security-sensitive identity events, not ordinary backend-session calls.
    if (path === SESSION_EXCHANGE_PATH || path === DIRECT_FIREBASE_SECURITY_PATH) return originalFetch(normalizedInput, init);

    const isPublicGet = method === 'GET' && PUBLIC_GET_PATHS.has(path);
    if (isPublicGet) return originalFetch(normalizedInput, { ...init, headers });

    let sessionToken = '';
    try { sessionToken = await getBackendToken(false); } catch (error) { console.warn('[Bookora API Auth] Backend session exchange failed:', error?.message || error); }
    if (sessionToken) headers.set('Authorization', `Bearer ${sessionToken}`);

    let response = await originalFetch(normalizedInput, { ...init, headers });
    if (response.status === 401) {
      try {
        setStoredBackendToken('');
        const freshSessionToken = await getBackendToken(true);
        if (freshSessionToken) {
          headers.set('Authorization', `Bearer ${freshSessionToken}`);
          response = await originalFetch(normalizedInput, { ...init, headers });
        }
      } catch (error) { console.warn('[Bookora API Auth] Backend session refresh failed:', error?.message || error); }
    }
    return response;
  };

  console.info('[Bookora API Auth] Firebase -> server session bridge installed. Current backend:', CURRENT_API_ROOT);
})();
