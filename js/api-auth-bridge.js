/* Bookora API auth bridge — permanent backend-session fix.
   Firebase is the browser identity provider, while the Python backend authorizes
   protected APIs with its own durable Bookora session token. Never send a raw
   Firebase ID token to normal backend endpoints; exchange it once at
   /api/auth/firebase and persist the returned backend token. */
(() => {
  if (window.__BOOKORA_API_AUTH_BRIDGE__) return;
  window.__BOOKORA_API_AUTH_BRIDGE__ = true;

  const API_ROOT = String(window.BOOKORA_API_URL || '').replace(/\/$/, '');
  const BACKEND_TOKEN_KEY = 'bookora_auth_token';
  const originalFetch = window.fetch.bind(window);
  let authUser = null;
  let authReadyResolve;
  let authReady = new Promise(resolve => { authReadyResolve = resolve; });
  let authReadyDone = false;
  let exchangePromise = null;

  const isBackendRequest = input => {
    const raw = typeof input === 'string' ? input : (input?.url || '');
    if (!raw) return false;
    try {
      const url = new URL(raw, location.href);
      return Boolean(API_ROOT) ? url.href.startsWith(API_ROOT + '/') || url.href === API_ROOT : url.pathname.startsWith('/api/');
    } catch (_) {
      return String(raw).startsWith(API_ROOT) || String(raw).startsWith('/api/');
    }
  };

  const pathOf = input => {
    try { return new URL(typeof input === 'string' ? input : input?.url || '', location.href).pathname; }
    catch (_) { return ''; }
  };

  const readBackendToken = () => {
    try { return String(localStorage.getItem(BACKEND_TOKEN_KEY) || '').trim(); } catch (_) { return ''; }
  };

  const writeBackendToken = token => {
    const value = String(token || '').trim();
    if (!value) return;
    try { localStorage.setItem(BACKEND_TOKEN_KEY, value); } catch (_) {}
  };

  const clearBackendToken = () => {
    try { localStorage.removeItem(BACKEND_TOKEN_KEY); } catch (_) {}
  };

  const waitForAuth = async () => {
    if (authReadyDone) return authUser;
    await Promise.race([authReady, new Promise(resolve => setTimeout(resolve, 10000))]);
    return authUser || window.firebase?.auth?.()?.currentUser || null;
  };

  const getFirebaseIdToken = async forceRefresh => {
    const user = authUser || window.firebase?.auth?.()?.currentUser || null;
    if (!user) return '';
    try {
      return await user.getIdToken(Boolean(forceRefresh));
    } catch (error) {
      console.warn('[Bookora API Auth] Firebase ID token unavailable:', error?.message || error);
      return '';
    }
  };

  const exchangeFirebaseForBackendSession = async forceRefresh => {
    if (exchangePromise) return exchangePromise;
    exchangePromise = (async () => {
      const user = await waitForAuth();
      if (!user) return '';
      const idToken = await getFirebaseIdToken(forceRefresh);
      if (!idToken) return '';

      const profile = (() => {
        try { return JSON.parse(localStorage.getItem('bookora_user_profile') || '{}'); } catch (_) { return {}; }
      })();
      const email = String(user.email || profile.email || '').trim().toLowerCase();
      const role = email === 'ayushprajpati6@gmail.com' || profile.role === 'admin' ? 'admin' : (profile.role || 'buyer');

      const response = await originalFetch(`${API_ROOT}/api/auth/firebase`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ role })
      });
      let data = {};
      try { data = await response.json(); } catch (_) {}
      if (!response.ok || !data?.success || !data?.token) {
        throw new Error(data?.error || `Backend authentication failed (${response.status})`);
      }
      writeBackendToken(data.token);
      return String(data.token);
    })().finally(() => { exchangePromise = null; });
    return exchangePromise;
  };

  const getBackendToken = async forceRefresh => {
    if (!forceRefresh) {
      const existing = readBackendToken();
      if (existing) return existing;
    }
    try { return await exchangeFirebaseForBackendSession(Boolean(forceRefresh)); }
    catch (error) {
      console.warn('[Bookora API Auth] Backend session exchange failed:', error?.message || error);
      return '';
    }
  };

  try {
    const auth = window.firebase?.auth?.();
    if (auth) {
      auth.onAuthStateChanged(user => {
        authUser = user || null;
        if (!authReadyDone) {
          authReadyDone = true;
          authReadyResolve(authUser);
        }
        if (!authUser) clearBackendToken();
      });
    } else {
      authReadyDone = true;
      authReadyResolve(null);
    }
  } catch (error) {
    console.warn('[Bookora API Auth] Firebase auth bridge unavailable:', error?.message || error);
    authReadyDone = true;
    authReadyResolve(null);
  }

  window.fetch = async (input, init = {}) => {
    if (!isBackendRequest(input)) return originalFetch(input, init);

    // The exchange endpoint must receive the Firebase ID token directly.
    // Do not recursively replace it with a Bookora session token.
    if (pathOf(input) === '/api/auth/firebase') return originalFetch(input, init);

    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    let backendToken = readBackendToken();

    // Protected endpoints need a Bookora backend session, not a Firebase JWT.
    if (!backendToken) backendToken = await getBackendToken(false);
    if (backendToken && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${backendToken}`);

    const firstInit = { ...init, headers };
    let response = await originalFetch(input, firstInit);

    // A stale/expired backend session is replaced by a newly exchanged session.
    if (response.status === 401 && authUser) {
      try {
        clearBackendToken();
        const freshBackendToken = await getBackendToken(true);
        if (freshBackendToken) {
          headers.set('Authorization', `Bearer ${freshBackendToken}`);
          response = await originalFetch(input, { ...firstInit, headers });
        }
      } catch (error) {
        console.warn('[Bookora API Auth] Backend session refresh failed:', error?.message || error);
      }
    }
    return response;
  };

  console.info('[Bookora API Auth] Firebase → Bookora backend session bridge installed.');
})();
