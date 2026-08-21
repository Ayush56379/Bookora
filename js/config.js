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

async function getFreshFirebaseIdToken(forceRefresh = false) {
  const auth = getFirebaseAuth();
  if (!auth) return '';
  let user = auth.currentUser;
  if (!user && window.BookoraFirebaseAuth?.waitForAuth) user = await window.BookoraFirebaseAuth.waitForAuth();
  if (!user) return '';
  try { return await user.getIdToken(!!forceRefresh); } catch (_) { return ''; }
}

export async function apiFetch(endpoint, options = {}) {
  const path = endpointMap[endpoint] || endpoint;
  const method = String(options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  // Explicit caller headers remain supported, but Firebase is authoritative
  // whenever a signed-in Firebase user exists. Never use localStorage tokens.
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
