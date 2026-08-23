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

// Firebase can take a short moment to restore the persisted session. During that
// window auth.currentUser is null even though the user is actually signed in.
// Protected API calls must wait for that first auth resolution instead of sending
// a request without Authorization and incorrectly showing "Sign in required".
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

// Exposed for pages that need to perform an authenticated action before the
// global state has finished hydrating. It resolves the real Firebase user, not
// a localStorage-only cached profile.
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

  // Firebase is authoritative whenever a real signed-in Firebase user exists.
  // Never use a stale/localStorage token.
  const firebaseToken = await getFreshFirebaseIdToken(false);
  if (firebaseToken) headers.set('Authorization', `Bearer ${firebaseToken}`);

  if (method !== 'GET' && method !== 'HEAD' && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response = await fetch(`${API_BASE_URL}${path}`, { ...options, method, headers });
  if (response.status === 401) {
    const refreshedToken = await getFreshFirebaseIdToken(true);
    if (refreshedToken) {
      const retryHeaders = new Headers(headers);
      retryHeaders.set('Authorization', `Bearer ${refreshedToken}`);
      response = await fetch(`${API_BASE_URL}${path}`, { ...options, method, headers: retryHeaders });
    }
  }
  return response;
}

export function apiUrl(path = '') { return `${API_BASE_URL}${path}`; }
