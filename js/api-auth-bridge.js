/* Bookora API auth bridge — permanent Firebase session fix.
   Protected backend requests wait for Firebase Auth to settle, attach a fresh
   Firebase ID token, and retry one time after a 401 with a refreshed token.
   This fixes the race where the UI restores a cached profile before the
   backend Authorization header has been populated. */
(() => {
  if (window.__BOOKORA_API_AUTH_BRIDGE__) return;
  window.__BOOKORA_API_AUTH_BRIDGE__ = true;

  const API_ROOT = String(window.BOOKORA_API_URL || '').replace(/\/$/, '');
  const originalFetch = window.fetch.bind(window);
  let authUser = null;
  let authReadyResolve;
  let authReady = new Promise(resolve => { authReadyResolve = resolve; });
  let authReadyDone = false;

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

  const waitForAuth = async () => {
    if (authReadyDone) return authUser;
    await Promise.race([authReady, new Promise(resolve => setTimeout(resolve, 5000))]);
    return authUser;
  };

  const getToken = async forceRefresh => {
    const user = authUser || window.firebase?.auth?.()?.currentUser || null;
    if (!user) return '';
    try {
      const token = await user.getIdToken(Boolean(forceRefresh));
      return token || '';
    } catch (error) {
      console.warn('[Bookora API Auth] Unable to obtain Firebase ID token:', error?.message || error);
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

    await waitForAuth();
    const token = await getToken(false);
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);

    const firstInit = { ...init, headers };
    let response = await originalFetch(input, firstInit);

    // A cached/older token can expire between page load and a button click.
    // Refresh once and replay the request; never loop indefinitely.
    if (response.status === 401 && authUser) {
      try {
        const freshToken = await getToken(true);
        if (freshToken) {
          headers.set('Authorization', `Bearer ${freshToken}`);
          response = await originalFetch(input, { ...firstInit, headers });
        }
      } catch (error) {
        console.warn('[Bookora API Auth] 401 refresh failed:', error?.message || error);
      }
    }
    return response;
  };

  console.info('[Bookora API Auth] Firebase token bridge installed.');
})();
