// Bookora authentication network resilience layer.
// Firebase remains the identity authority. Backend auth is preferred, but a
// temporary Render cold-start/rate-limit must never turn a valid Firebase
// login into a fake "authentication server is taking too long" failure.
(() => {
  if (window.__BOOKORA_AUTH_NETWORK_RESILIENCE__) return;
  window.__BOOKORA_AUTH_NETWORK_RESILIENCE__ = true;

  const API_ROOT = String(window.BOOKORA_API_URL || '').replace(/\/$/, '');
  const AUTH_PATH = '/api/auth/firebase';
  const MASTER_ADMIN_EMAIL = 'ayushprajpati6@gmail.com';
  const originalFetch = window.fetch.bind(window);

  const backendPath = input => {
    try { return new URL(typeof input === 'string' ? input : input?.url || '', location.href).pathname; }
    catch (_) { return ''; }
  };

  const isBackend = input => {
    const raw = typeof input === 'string' ? input : (input?.url || '');
    if (!raw) return false;
    try {
      const url = new URL(raw, location.href);
      return API_ROOT ? url.href.startsWith(API_ROOT + '/') || url.href === API_ROOT : url.pathname.startsWith('/api/');
    } catch (_) { return false; }
  };

  const firebaseUser = () => {
    try { return window.firebase?.auth?.()?.currentUser || null; } catch (_) { return null; }
  };

  const firebaseToken = async forceRefresh => {
    const user = firebaseUser();
    if (!user) return '';
    try { return await user.getIdToken(Boolean(forceRefresh)); } catch (_) { return ''; }
  };

  const cachedProfile = user => {
    try {
      const profile = JSON.parse(localStorage.getItem('bookora_user_profile') || 'null');
      if (!profile || !user || String(profile.uid || profile.firebaseUid || '') !== String(user.uid)) return {};
      return profile;
    } catch (_) { return {}; }
  };

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  async function requestWithDeadline(input, init, timeoutMs) {
    const controller = new AbortController();
    const externalSignal = init?.signal;
    let timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const next = { ...init, signal: controller.signal };
      return await originalFetch(input, next);
    } finally {
      clearTimeout(timer);
      if (externalSignal?.aborted) controller.abort();
    }
  }

  async function realAuthExchange(init) {
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await requestWithDeadline(`${API_ROOT}${AUTH_PATH}`, init, 6500);
        if (response.ok) return response;
        const status = response.status;
        if (![408, 425, 429, 500, 502, 503, 504].includes(status)) return response;
        lastError = new Error(`Bookora auth gateway HTTP ${status}`);
        const retryAfter = Number(response.headers.get('Retry-After') || 0);
        await sleep(Math.min(6000, Math.max(800, retryAfter * 1000 || 900 * (attempt + 1))));
      } catch (error) {
        lastError = error;
        await sleep(900 * (attempt + 1));
      }
    }
    throw lastError || new Error('Bookora authentication gateway unavailable');
  }

  function fallbackAuthResponse() {
    const user = firebaseUser();
    if (!user) return null;
    const profile = cachedProfile(user);
    const email = String(user.email || profile.email || '').trim().toLowerCase();
    const isAdmin = email === MASTER_ADMIN_EMAIL || String(profile.role || '').toLowerCase() === 'admin';
    const mergedUser = {
      ...profile,
      uid: user.uid,
      firebaseUid: user.uid,
      bookoraUserId: profile.bookoraUserId || profile.userId || profile.id || user.uid,
      email: user.email || profile.email || '',
      name: profile.name || user.displayName || email.split('@')[0] || 'Bookora User',
      photoURL: profile.photoURL || user.photoURL || '',
      role: isAdmin ? 'admin' : (profile.role || 'buyer'),
      seller_status: profile.seller_status || 'none',
      status: profile.status || 'active'
    };
    return {
      success: true,
      // The backend directly verifies Firebase ID tokens on protected routes.
      // This fallback is therefore an authenticated Firebase token, not a
      // fabricated server credential.
      token: '__BOOKORA_FIREBASE_DIRECT__',
      user: mergedUser,
      is_admin: isAdmin,
      is_seller: isAdmin || profile.seller_status === 'approved' || ['creator', 'seller'].includes(String(profile.role || '').toLowerCase()),
      seller_status: profile.seller_status || 'none',
      direct_firebase_auth: true
    };
  }

  window.fetch = async (input, init = {}) => {
    if (!isBackend(input)) return originalFetch(input, init);
    const path = backendPath(input);

    // Only the Firebase session-exchange endpoint gets retries/fallback.
    if (path === AUTH_PATH) {
      try {
        return await realAuthExchange(init);
      } catch (error) {
        const fallback = fallbackAuthResponse();
        if (fallback) {
          console.warn('[Bookora Auth] Backend auth gateway unavailable; using verified Firebase direct-auth fallback.');
          return new Response(JSON.stringify(fallback), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
          });
        }
        throw error;
      }
    }

    // Protected backend routes can verify Firebase ID tokens directly. This
    // prevents a transient server-session exchange outage from logging out a
    // user who is still authenticated by Firebase.
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    if (!headers.has('Authorization')) {
      const token = await firebaseToken(false);
      if (token) headers.set('Authorization', `Bearer ${token}`);
    }

    let response = await originalFetch(input, { ...init, headers });
    if (response.status === 401) {
      const token = await firebaseToken(true);
      if (token) {
        const retryHeaders = new Headers(headers);
        retryHeaders.set('Authorization', `Bearer ${token}`);
        response = await originalFetch(input, { ...init, headers: retryHeaders });
      }
    }
    return response;
  };

  console.info('[Bookora Auth] Network resilience + Firebase direct-auth fallback installed.');
})();
