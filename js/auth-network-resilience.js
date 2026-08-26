// Bookora authentication network resilience layer.
// Firebase is the identity authority. Protected API routes accept the Firebase
// ID token directly, so this layer must never make a secondary auth-network
// request that can fail independently of the real Firebase session.
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

  // Compatibility response for older frontend code that still calls
  // /api/auth/firebase. No network request is made. The protected API calls
  // themselves use the real Firebase ID token through api-auth-bridge.js.
  async function localAuthResponse() {
    const user = firebaseUser();
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Firebase authentication is required.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    }
    const token = await firebaseToken(false);
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'Firebase ID token is unavailable.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      });
    }
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
    return new Response(JSON.stringify({
      success: true,
      token,
      user: mergedUser,
      is_admin: isAdmin,
      is_seller: isAdmin || profile.seller_status === 'approved' || ['creator', 'seller'].includes(String(profile.role || '').toLowerCase()),
      seller_status: profile.seller_status || 'none',
      direct_firebase_auth: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    });
  }

  window.fetch = async (input, init = {}) => {
    if (!isBackend(input)) return originalFetch(input, init);
    const path = backendPath(input);

    // Kill the old fragile session-exchange network path completely.
    if (path === AUTH_PATH) return localAuthResponse();

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

  console.info('[Bookora Auth] Direct Firebase authentication network layer installed.');
})();
