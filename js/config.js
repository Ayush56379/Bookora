// Bookora frontend API configuration
// All production data, uploads, AI and payments go through the Render backend.
// Canonical production service: x081 (the previous x08l hostname was stale).
export const API_BASE_URL = 'https://bookora-backend-x081.onrender.com';

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

export async function apiFetch(endpoint, options = {}) {
  const path = endpointMap[endpoint] || endpoint;
  const method = String(options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (statefulAuthToken(options)) headers.set('Authorization', `Bearer ${statefulAuthToken(options)}`);
  if (method !== 'GET' && method !== 'HEAD' && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  return fetch(`${API_BASE_URL}${path}`, { ...options, method, headers });
}

function statefulAuthToken(options) {
  const h = options.headers || {};
  return h.Authorization || h.authorization || '';
}

export function apiUrl(path = '') { return `${API_BASE_URL}${path}`; }
