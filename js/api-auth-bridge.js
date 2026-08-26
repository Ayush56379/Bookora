/* Bookora API auth bridge — Firebase identity -> persistent Bookora backend session. */
(() => {
  if (window.__BOOKORA_API_AUTH_BRIDGE__) return;
  window.__BOOKORA_API_AUTH_BRIDGE__ = true;

  const API_ROOT = String(window.BOOKORA_API_URL || '').replace(/\/$/, '');
  const BACKEND_TOKEN_KEY = 'bookora_auth_token';
  const BACKEND_UID_KEY = 'bookora_auth_session_uid';
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
      return Boolean(API_ROOT) ? (url.href.startsWith(API_ROOT + '/') || url.href === API_ROOT) : url.pathname.startsWith('/api/');
    } catch (_) { return String(raw).startsWith(API_ROOT) || String(raw).startsWith('/api/'); }
  };
  const pathOf = input => { try { return new URL(typeof input === 'string' ? input : input?.url || '', location.href).pathname; } catch (_) { return ''; } };
  const readBackendToken = () => {
    try {
      const token = String(localStorage.getItem(BACKEND_TOKEN_KEY) || '').trim();
      const uid = String(localStorage.getItem(BACKEND_UID_KEY) || '').trim();
      if (uid && authUser?.uid && uid !== authUser.uid) return '';
      return token;
    } catch (_) { return ''; }
  };
  const persistBackendToken = (token, uid = '') => {
    const value = String(token || '').trim();
    if (!value || value.split('.').length === 3) return;
    try { localStorage.setItem(BACKEND_TOKEN_KEY, value); if (uid) localStorage.setItem(BACKEND_UID_KEY, String(uid)); } catch (_) {}
  };
  const clearBackendToken = () => { try { localStorage.removeItem(BACKEND_TOKEN_KEY); localStorage.removeItem(BACKEND_UID_KEY); } catch (_) {} };
  const getAuthInstance = () => {
    try { if (auth) return auth; if (window.firebase?.auth) { auth = window.firebase.auth(); return auth; } } catch (_) {}
    return null;
  };
  const markAuthResolved = () => { if (firebaseAuthResolved) return; firebaseAuthResolved = true; try { firebaseAuthResolve(); } catch (_) {} };
  const installAuthListener = () => {
    if (authListenerInstalled) return true;
    const instance = getAuthInstance();
    if (!instance?.onAuthStateChanged) return false;
    authListenerInstalled = true;
    instance.onAuthStateChanged(user => { authUser = user || null; markAuthResolved(); if (!authUser) clearBackendToken(); else void getAuthToken(false); });
    return true;
  };
  const waitForFirebaseAuth = async () => {
    for (let i = 0; i < 60; i++) {
      installAuthListener();
      const instance = getAuthInstance();
      const user = authUser || instance?.currentUser || null;
      if (user) { authUser = user; return user; }
      if (firebaseAuthResolved) return null;
      await Promise.race([firebaseAuthReady, new Promise(resolve => setTimeout(resolve, 250))]);
    }
    return authUser || getAuthInstance()?.currentUser || null;
  };
  const getFirebaseIdToken = async forceRefresh => {
    const user = authUser || getAuthInstance()?.currentUser || null;
    if (!user) return '';
    try { return await user.getIdToken(Boolean(forceRefresh)); } catch (error) { console.warn('[Bookora API Auth] Firebase ID token unavailable:', error?.message || error); return ''; }
  };
  const exchangeFirebaseForSession = async (firebaseToken, forceRefresh = false) => {
    const user = authUser || getAuthInstance()?.currentUser || null;
    if (!firebaseToken || !API_ROOT) return '';
    let token = firebaseToken;
    if (forceRefresh && user) token = await user.getIdToken(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await originalFetch(`${API_ROOT}/api/auth/firebase`, {
        method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: 'buyer' }), signal: controller.signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success || !data?.token) throw new Error(data?.error || `Bookora session exchange failed (${response.status})`);
      persistBackendToken(data.token, user?.uid || data.user?.uid || '');
      return String(data.token);
    } catch (error) {
      console.warn('[Bookora API Auth] Firebase→Bookora session exchange unavailable; using Firebase direct auth:', error?.message || error);
      return '';
    } finally { clearTimeout(timer); }
  };
  const getAuthToken = async forceRefresh => {
    const user = await waitForFirebaseAuth();
    if (user) {
      if (tokenPromise && !forceRefresh) return tokenPromise;
      tokenPromise = (async () => {
        const existing = forceRefresh ? '' : readBackendToken();
        if (existing) return existing;
        const firebaseToken = await getFirebaseIdToken(Boolean(forceRefresh));
        if (!firebaseToken) return '';
        const backendToken = await exchangeFirebaseForSession(firebaseToken, Boolean(forceRefresh));
        return backendToken || firebaseToken;
      })().finally(() => { tokenPromise = null; });
      const result = await tokenPromise;
      if (result) return result;
    }
    return readBackendToken();
  };
  installAuthListener();
  const firebaseBootstrapTimer = setInterval(() => { if (installAuthListener()) clearInterval(firebaseBootstrapTimer); }, 250);
  setTimeout(() => { clearInterval(firebaseBootstrapTimer); markAuthResolved(); }, 15000);

  window.fetch = async (input, init = {}) => {
    if (!isBackendRequest(input)) return originalFetch(input, init);
    if (pathOf(input) === '/api/auth/firebase') return originalFetch(input, init);
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    const token = await getAuthToken(false);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    let response = await originalFetch(input, { ...init, headers });
    if (response.status === 401 && authUser) {
      try {
        const freshFirebaseToken = await getFirebaseIdToken(true);
        const freshBackendToken = await exchangeFirebaseForSession(freshFirebaseToken, true);
        headers.set('Authorization', `Bearer ${freshBackendToken || freshFirebaseToken}`);
        response = await originalFetch(input, { ...init, headers });
      } catch (error) { console.warn('[Bookora API Auth] Session refresh failed:', error?.message || error); }
    }
    return response;
  };
  console.info('[Bookora API Auth] Persistent Firebase→Bookora session bridge installed.');
})();
