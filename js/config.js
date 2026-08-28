// Bookora frontend API configuration
// Firebase Auth is the browser authentication authority for protected APIs.
export const API_BASE_URL = 'https://bookora-backend-x08l.onrender.com';

const endpointMap = {
  '/api/auth/me': '/api/auth/me',
  '/api/auth/logout': '/api/auth/logout',
  '/api/books': '/api/books',
  '/api/categories': '/api/categories',
  '/api/settings/public': '/api/settings/public',
  '/api/library': '/api/library',
  '/api/wishlist': '/api/wishlist',
  '/api/cart': '/api/cart',
  '/api/orders': '/api/orders',
  '/api/admin/stats': '/api/admin/overview',
  '/api/ai/chat': '/api/ai/chat',
  '/api/books/upload-files': '/api/books/upload-files',
  '/api/books/create': '/api/books/create',
  '/api/admin/books': '/api/admin/books',
  '/api/admin/users': '/api/admin/users',
  '/api/admin/settings': '/api/admin/settings',
  '/api/cashfree/create-order': '/api/cashfree/create-order',
  '/api/cashfree/verify-order': '/api/cashfree/verify-order'
};

function getFirebaseAuth() {
  try {
    if (!window.firebase?.apps?.length || typeof window.firebase.auth !== 'function') return null;
    return window.firebase.auth();
  } catch (_) {
    return null;
  }
}

let authReadyPromise = null;
function waitForFirebaseAuthResolution(auth, timeoutMs = 7000) {
  if (!auth) return Promise.resolve(null);
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  if (authReadyPromise) return authReadyPromise;

  authReadyPromise = new Promise(resolve => {
    let settled = false;
    let unsubscribe = null;
    const finish = user => {
      if (settled) return;
      settled = true;
      try { unsubscribe?.(); } catch (_) {}
      clearTimeout(timer);
      authReadyPromise = null;
      resolve(user || null);
    };
    const timer = setTimeout(() => finish(auth.currentUser || null), timeoutMs);
    try {
      unsubscribe = auth.onAuthStateChanged(user => finish(user));
    } catch (_) {
      finish(auth.currentUser || null);
    }
  });
  return authReadyPromise;
}

async function getFreshFirebaseIdToken(forceRefresh = false) {
  const auth = getFirebaseAuth();
  if (!auth) return '';
  let user = auth.currentUser;
  if (!user) user = await waitForFirebaseAuthResolution(auth);
  if (!user) return '';
  try { return await user.getIdToken(!!forceRefresh); } catch (_) { return ''; }
}

export async function waitForAuthenticatedFirebaseUser() {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  return auth.currentUser || await waitForFirebaseAuthResolution(auth);
}

// Do not block Firebase sign-in on the Render auth bridge.
function immediateFirebaseAuthResponse(headers, options) {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  const authHeader = String(headers.get('Authorization') || '');
  const firebaseToken = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';
  if (!user || !firebaseToken) return null;

  let cached = {};
  try { cached = JSON.parse(localStorage.getItem('bookora_user_profile') || '{}') || {}; } catch (_) {}
  const email = String(user.email || cached.email || '').trim();
  const isMasterAdmin = email.toLowerCase() === 'ayushprajpati6@gmail.com';
  const localUser = {
    ...cached,
    uid: user.uid,
    firebaseUid: user.uid,
    email,
    name: user.displayName || cached.name || email.split('@')[0] || 'Bookora User',
    photoURL: user.photoURL || cached.photoURL || '',
    role: isMasterAdmin ? 'admin' : (cached.role || 'buyer'),
    status: cached.status || 'active',
    seller_status: cached.seller_status || 'none',
    isMasterAdmin
  };

  try {
    const backgroundHeaders = new Headers(options.headers || {});
    backgroundHeaders.set('Authorization', `Bearer ${firebaseToken}`);
    backgroundHeaders.set('Accept', 'application/json');
    void fetch(`${API_BASE_URL}/api/auth/firebase`, { ...options, headers: backgroundHeaders }).catch(() => {});
  } catch (_) {}

  return new Response(JSON.stringify({
    success: true,
    token: firebaseToken,
    user: localUser,
    is_admin: isMasterAdmin || localUser.role === 'admin',
    is_seller: isMasterAdmin || localUser.seller_status === 'approved' || ['creator', 'seller'].includes(localUser.role),
    seller_status: localUser.seller_status
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function apiFetch(endpoint, options = {}) {
  const path = endpointMap[endpoint] || endpoint;
  const method = String(options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  // Keep the established Bookora session token when the caller already has one.
  // The backend authenticates protected routes against its server session store.
  if (!headers.has('Authorization')) {
    const firebaseToken = await getFreshFirebaseIdToken(false);
    if (firebaseToken) headers.set('Authorization', `Bearer ${firebaseToken}`);
  }

  if (method !== 'GET' && method !== 'HEAD' && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (path === '/api/auth/firebase') {
    const immediate = immediateFirebaseAuthResponse(headers, options);
    if (immediate) return immediate;
  }

  let response = await fetch(`${API_BASE_URL}${path}`, { ...options, method, headers });
  if (response.status === 401) {
    const explicitAuth = headers.has('Authorization') && !String(headers.get('Authorization') || '').toLowerCase().startsWith('bearer ey');
    if (!explicitAuth) {
      const refreshedToken = await getFreshFirebaseIdToken(true);
      if (refreshedToken) {
        const retryHeaders = new Headers(headers);
        retryHeaders.set('Authorization', `Bearer ${refreshedToken}`);
        response = await fetch(`${API_BASE_URL}${path}`, { ...options, method, headers: retryHeaders });
      }
    }
  }
  return response;
}

export function apiUrl(path = '') { return `${API_BASE_URL}${path}`; }
