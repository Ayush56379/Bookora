// Bookora external protected-API session bridge.
// The backend's protected routes use the existing Bookora session token.
// Firebase ID tokens are exchanged only when an external protected request
// is about to be sent, so the existing Firebase authentication architecture
// remains authoritative without changing payment/order routes.
(() => {
  const SESSION_KEY = 'bookora_auth_token';
  const UID_KEY = 'bookora_auth_session_uid';
  const API_BASE = String(window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com').replace(/\/$/, '');
  const PROTECTED_EXTERNAL = [
    '/api/external/',
    '/api/publish/external',
    '/api/books/upload-files'
  ];

  if (window.__BOOKORA_EXTERNAL_SESSION_BRIDGE__) return;
  window.__BOOKORA_EXTERNAL_SESSION_BRIDGE__ = true;

  const originalFetch = window.fetch.bind(window);
  let exchangePromise = null;

  const isProtectedExternal = input => {
    const raw = typeof input === 'string' ? input : (input?.url || '');
    let path = '';
    try { path = new URL(raw, window.location.href).pathname; } catch (_) { path = raw; }
    return PROTECTED_EXTERNAL.some(prefix => path === prefix || path.startsWith(prefix));
  };

  const isFirebaseJwt = token => {
    const value = String(token || '').trim();
    return value.split('.').length === 3 && value.length > 200;
  };

  const getStoredSession = () => {
    try {
      const token = String(localStorage.getItem(SESSION_KEY) || '').trim();
      const uid = String(localStorage.getItem(UID_KEY) || '').trim();
      return token ? { token, uid } : null;
    } catch (_) { return null; }
  };

  const storeSession = (token, uid = '') => {
    const value = String(token || '').trim();
    if (!value) return;
    try {
      localStorage.setItem(SESSION_KEY, value);
      if (uid) localStorage.setItem(UID_KEY, String(uid));
    } catch (_) {}
  };

  const getFirebaseUser = () => {
    try { return window.firebase?.auth?.()?.currentUser || null; } catch (_) { return null; }
  };

  async function exchangeFirebaseToken(firebaseToken, forceRefresh = false) {
    if (exchangePromise && !forceRefresh) return exchangePromise;
    exchangePromise = (async () => {
      let token = String(firebaseToken || '').trim();
      const user = getFirebaseUser();
      if (user && forceRefresh) token = await user.getIdToken(true);
      if (!token) throw new Error('Firebase authentication token is unavailable.');

      const response = await originalFetch(`${API_BASE}/api/auth/firebase`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: 'seller' })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success || !data?.token) {
        throw new Error(data?.error || 'Bookora authentication session could not be established.');
      }
      storeSession(data.token, user?.uid || data.user?.uid || data.user?.firebaseUid || '');
      return data.token;
    })();
    try { return await exchangePromise; }
    finally { exchangePromise = null; }
  }

  async function resolveBackendSession(firebaseToken) {
    const stored = getStoredSession();
    if (stored?.token) return stored.token;
    return exchangeFirebaseToken(firebaseToken, false);
  }

  window.fetch = async function externalSessionFetch(input, init = {}) {
    if (!isProtectedExternal(input)) return originalFetch(input, init);

    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    const authorization = String(headers.get('Authorization') || '').trim();
    if (!authorization.toLowerCase().startsWith('bearer ')) return originalFetch(input, init);

    const suppliedToken = authorization.slice(7).trim();
    if (!isFirebaseJwt(suppliedToken)) return originalFetch(input, init);

    let backendToken = '';
    try {
      backendToken = await resolveBackendSession(suppliedToken);
    } catch (error) {
      const user = getFirebaseUser();
      if (user) {
        try { backendToken = await exchangeFirebaseToken(await user.getIdToken(true), true); }
        catch (refreshError) { console.warn('[Bookora External Session] Firebase exchange failed:', refreshError?.message || refreshError); }
      }
    }

    if (!backendToken) return originalFetch(input, init);
    headers.set('Authorization', `Bearer ${backendToken}`);
    return originalFetch(input, { ...init, headers });
  };
})();
