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

export async function apiFetch(endpoint, options = {}) {
  const path = endpointMap[endpoint] || endpoint;
  const method = String(options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  // An explicit Authorization header is authoritative for callers that have
  // already exchanged Firebase identity for a Bookora server session. Never
  // overwrite that session with a Firebase JWT.
  if (!headers.has('Authorization')) {
    const firebaseToken = await getFreshFirebaseIdToken(false);
    if (firebaseToken) headers.set('Authorization', `Bearer ${firebaseToken}`);
  }

  if (method !== 'GET' && method !== 'HEAD' && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response = await fetch(`${API_BASE_URL}${path}`, { ...options, method, headers });
  if (response.status === 401) {
    // Only refresh/retry when this request is actually using Firebase auth.
    // Explicit Bookora session failures must be surfaced to the caller instead
    // of silently replacing a valid session with an unrelated JWT.
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
