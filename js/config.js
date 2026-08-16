// Centralized Bookora Frontend Configuration (Connected to live Render Backend)
const customApiUrl = window.BOOKORA_API_URL || localStorage.getItem('bookora_api_url') || '';

export const API_BASE_URL = customApiUrl
  ? customApiUrl.replace(/\/+$/, '')
  : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? (['8080', '10000', '3000'].includes(window.location.port) ? '' : 'http://localhost:10000')
    : 'https://bookora-backend-x081.onrender.com';

// Unified API fetch wrapper
export async function apiFetch(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${cleanEndpoint}`;

  const defaultHeaders = {
    'Accept': 'application/json'
  };

  if (options.body && typeof options.body === 'string' && !options.headers?.['Content-Type']) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const mergedOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {})
    }
  };

  try {
    return await fetch(url, mergedOptions);
  } catch (err) {
    if (url.includes('localhost:10000') || url.includes('127.0.0.1:10000')) {
      const fallbackUrl = url.replace('10000', '3000');
      try {
        return await fetch(fallbackUrl, mergedOptions);
      } catch (fallbackErr) {
        throw err;
      }
    }
    throw err;
  }
}
