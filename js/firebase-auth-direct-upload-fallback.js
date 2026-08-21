// Bookora upload auth fallback.
// If the short-lived /api/auth/firebase session exchange returns 401/403,
// keep the verified Firebase ID token as the bearer token. The backend now
// verifies that Firebase token directly for protected endpoints, so a seller
// does not get a false "sign in again" error while already signed in.
const BOOKORA_DIRECT_AUTH_API = 'https://bookora-backend-x08l.onrender.com';

if (!window.__bookoraDirectUploadAuthFallback) {
  window.__bookoraDirectUploadAuthFallback = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async function(input, init = {}) {
    const url = typeof input === 'string' ? input : (input?.url || '');
    if (!String(url).startsWith(`${BOOKORA_DIRECT_AUTH_API}/api/auth/firebase`)) {
      return originalFetch(input, init);
    }

    const response = await originalFetch(input, init);
    if (response.ok) return response;

    if (response.status !== 401 && response.status !== 403) return response;

    try {
      const auth = window.firebase?.auth?.();
      const user = auth?.currentUser;
      if (!user) return response;
      const idToken = await user.getIdToken(true);
      return new Response(JSON.stringify({
        success: true,
        token: idToken,
        firebase_direct: true,
        user: {
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || ''
        },
        is_admin: false,
        is_seller: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (_) {
      return response;
    }
  };
}
