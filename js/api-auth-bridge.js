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
  let backendSessionUid = '';
  let firebaseAuthResolved = false;
  let firebaseAuthResolve = null;
  const firebaseAuthReady = new Promise(resolve => { firebaseAuthResolve = resolve; });

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

  const writeBackendToken = (token, uid = '') => {
    const value = String(token || '').trim();
    if (!value) return;
    try { localStorage.setItem(BACKEND_TOKEN_KEY, value); } catch (_) {}
    backendSessionUid = String(uid || '');
  };

  const clearBackendToken = () => {
    try { localStorage.removeItem(BACKEND_TOKEN_KEY); } catch (_) {}
    backendSessionUid = '';
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
      if (!authUser) {
        clearBackendToken();
        return;
      }
      // Do not trust a stale localStorage session when Firebase has just changed users.
      if (backendSessionUid && backendSessionUid !== String(authUser.uid || '')) clearBackendToken();
      exchangeFirebaseForBackendSession(false).catch(error =>
        console.warn('[Bookora API Auth] Initial backend session sync failed:', error?.message || error)
      );
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

  const exchangeFirebaseForBackendSession = async forceRefresh => {
    if (exchangePromise) return exchangePromise;
    exchangePromise = (async () => {
      const user = await waitForFirebaseAuth();
      if (!user) return '';
      const uid = String(user.uid || '');

      if (!forceRefresh && backendSessionUid === uid) {
        const existing = readBackendToken();
        if (existing) return existing;
      }

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
      writeBackendToken(data.token, uid);
      return String(data.token);
    })().finally(() => { exchangePromise = null; });
    return exchangePromise;
  };

  const getBackendToken = async forceRefresh => {
    const user = await waitForFirebaseAuth();
    if (!user) return '';
    const uid = String(user.uid || '');
    if (!forceRefresh && backendSessionUid === uid) {
      const existing = readBackendToken();
      if (existing) return existing;
    }
    try { return await exchangeFirebaseForBackendSession(Boolean(forceRefresh)); }
    catch (error) {
      console.warn('[Bookora API Auth] Backend session exchange failed:', error?.message || error);
      return '';
    }
  };

  installAuthListener();
  const firebaseBootstrapTimer = setInterval(() => {
    if (installAuthListener()) clearInterval(firebaseBootstrapTimer);
  }, 250);
  setTimeout(() => { clearInterval(firebaseBootstrapTimer); markAuthResolved(); }, 15000);

  window.fetch = async (input, init = {}) => {
    if (!isBackendRequest(input)) return originalFetch(input, init);
    if (pathOf(input) === '/api/auth/firebase') return originalFetch(input, init);

    const headers = new Headers(
      init?.headers || (input instanceof Request ? input.headers : undefined)
    );

    let backendToken = await getBackendToken(false);
    if (backendToken) headers.set('Authorization', `Bearer ${backendToken}`);

    const firstInit = { ...init, headers };
    let response = await originalFetch(input, firstInit);

    // Refresh Firebase/backend session exactly once on 401, then retry once.
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

  console.info('[Bookora API Auth] Firebase -> Bookora backend session bridge installed.');
})();
