/* Bookora API auth bridge — Firebase -> durable Bookora backend session. */
(() => {
  if (window.__BOOKORA_API_AUTH_BRIDGE__) return;
  window.__BOOKORA_API_AUTH_BRIDGE__ = true;

  const API_ROOT = String(window.BOOKORA_API_URL || '').replace(/\/$/, '');
  const BACKEND_TOKEN_KEY = 'bookora_auth_token';
  const originalFetch = window.fetch.bind(window);
  let authUser = null;
  let auth = null;
  let exchangePromise = null;
  let authListenerInstalled = false;

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

  const writeBackendToken = token => {
    const value = String(token || '').trim();
    if (!value) return;
    try { localStorage.setItem(BACKEND_TOKEN_KEY, value); } catch (_) {}
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

  const installAuthListener = () => {
    if (authListenerInstalled) return true;
    const instance = getAuthInstance();
    if (!instance?.onAuthStateChanged) return false;
    authListenerInstalled = true;
    instance.onAuthStateChanged(user => {
      authUser = user || null;
      if (!authUser) clearBackendToken();
      else {
        // Keep the backend session synchronized as soon as Firebase auth becomes available.
        exchangeFirebaseForBackendSession(false).catch(error =>
          console.warn('[Bookora API Auth] Initial backend session sync failed:', error?.message || error)
        );
      }
    });
    return true;
  };

  const waitForFirebaseAuth = async () => {
    // Firebase can load after this bridge script. Retry discovery instead of permanently
    // deciding that authentication is unavailable.
    for (let i = 0; i < 40; i++) {
      installAuthListener();
      const instance = getAuthInstance();
      const user = authUser || instance?.currentUser || null;
      if (user) {
        authUser = user;
        return user;
      }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    return null;
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

  const exchangeFirebaseForBackendSession = async forceRefresh => {
    if (exchangePromise) return exchangePromise;
    exchangePromise = (async () => {
      const user = await waitForFirebaseAuth();
      if (!user) return '';

      const idToken = await getFirebaseIdToken(forceRefresh);
      if (!idToken) return '';

      const profile = (() => {
        try { return JSON.parse(localStorage.getItem('bookora_user_profile') || '{}'); }
        catch (_) { return {}; }
      })();
      const email = String(user.email || profile.email || '').trim().toLowerCase();
      const role = email === 'ayushprajpati6@gmail.com' || profile.role === 'admin'
        ? 'admin'
        : (profile.role || 'buyer');

      const response = await originalFetch(`${API_ROOT}/api/auth/firebase`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
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

  // Firebase may not yet exist when this script is parsed. Poll briefly and then
  // keep the fetch interceptor capable of discovering it later.
  installAuthListener();
  const firebaseBootstrapTimer = setInterval(() => {
    if (installAuthListener()) clearInterval(firebaseBootstrapTimer);
  }, 250);
  setTimeout(() => clearInterval(firebaseBootstrapTimer), 15000);

  window.fetch = async (input, init = {}) => {
    if (!isBackendRequest(input)) return originalFetch(input, init);

    // Firebase -> backend exchange must receive the Firebase ID token directly.
    if (pathOf(input) === '/api/auth/firebase') return originalFetch(input, init);

    const headers = new Headers(
      init?.headers || (input instanceof Request ? input.headers : undefined)
    );

    let backendToken = readBackendToken();
    if (!backendToken) backendToken = await getBackendToken(false);
    if (backendToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${backendToken}`);
    }

    const firstInit = { ...init, headers };
    let response = await originalFetch(input, firstInit);

    // Retry every protected 401 after obtaining the current Firebase user, even if
    // the auth listener was installed late. This fixes stale/missing sessions on
    // admin settings, orders, library and other protected APIs.
    if (response.status === 401) {
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
