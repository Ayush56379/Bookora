// Bookora publish upload transport fix.
// Convert the browser's cross-origin PUT upload into a CORS-simple POST.
// The backend upload capability in the URL is the authorization for this
// short-lived upload operation, so the Firebase Authorization header is not
// needed for the binary transfer itself.
(() => {
  if (window.__BOOKORA_PUBLISH_UPLOAD_TRANSPORT_FIX__) return;
  window.__BOOKORA_PUBLISH_UPLOAD_TRANSPORT_FIX__ = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = function(input, init = {}) {
    try {
      const url = typeof input === 'string' ? input : input?.url || '';
      const parsed = new URL(url, window.location.href);
      const isUpload = parsed.pathname === '/api/books/upload-direct-session/proxy'
        || parsed.pathname === '/api/books/upload-direct-session/upload';
      const method = String(init?.method || (typeof input !== 'string' ? input?.method : '') || 'GET').toUpperCase();

      if (isUpload && method === 'PUT') {
        const headers = new Headers(init?.headers || (typeof input !== 'string' ? input?.headers : undefined));
        headers.delete('Authorization');
        headers.set('Content-Type', 'text/plain');

        const next = { ...init, method: 'POST', headers };
        return originalFetch(url, next);
      }
    } catch (error) {
      console.warn('[Bookora upload transport fix]', error);
    }
    return originalFetch(input, init);
  };
})();
