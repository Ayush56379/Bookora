// Centralized Bookora Frontend Configuration
// When deploying frontend to GitHub Pages or static host, set API_BASE_URL to your backend hosting URL.
export const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? (window.location.port === '3000' ? '' : 'http://localhost:3000')
  : (window.BOOKORA_API_URL || 'https://api.your-bookora-domain.com');

// Helper wrapper for API requests
export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  return fetch(url, options);
}
