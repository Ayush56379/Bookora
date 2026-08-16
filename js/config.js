// Bookora - Google Apps Script API

export const API_BASE_URL =
  'https://script.google.com/macros/s/AKfycbzUu9SstSp1ONdUOLb6hAeCtDzlxrvymtf_y2c5ISacPNRYXaJThewGzqbIO0vzQqYfnw/exec';


// ---------------------------------------------------------
// Apps Script API helper
// ---------------------------------------------------------

export async function apiFetch(endpoint, options = {}) {

  let action = '';

  const map = {

    '/api/auth/me': 'me',
    '/api/auth/logout': 'logout',

    '/api/books': 'books',
    '/api/categories': 'categories',

    '/api/settings/public': 'settings',

    '/api/library': 'myLibrary',
    '/api/wishlist': 'getWishlist',

    '/api/cart': 'getCart',
    '/api/orders': 'myOrders',

    '/api/admin/stats': 'adminStats'

  };


  action = map[endpoint] || endpoint;


  // GET request
  if (!options.method || options.method.toUpperCase() === 'GET') {

    const url =
      `${API_BASE_URL}?action=${encodeURIComponent(action)}`;


    return fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    });
  }


  // POST request
  let payload = {};

  if (options.body) {

    try {

      payload =
        typeof options.body === 'string'
          ? JSON.parse(options.body)
          : options.body;

    } catch (_) {

      payload = {};
    }
  }


  payload.action =
    payload.action || action;


  const headers = {
    Accept: 'application/json',
    'Content-Type': 'text/plain;charset=utf-8'
  };


  // Authorization token
  const authHeader =
    options.headers?.Authorization ||
    options.headers?.authorization;


  if (authHeader) {

    payload.token =
      authHeader.replace(/^Bearer\s+/i, '');
  }


  return fetch(API_BASE_URL, {

    method: 'POST',

    headers,

    body: JSON.stringify(payload)

  });
}
