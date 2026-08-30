// Bookora publish upload transport hardening.
// 1) Binary PUT -> CORS-simple POST so the browser does not preflight the large upload.
// 2) Retry the authenticated start/finalize requests when Render is waking the free instance.
(() => {
  if (window.__BOOKORA_PUBLISH_UPLOAD_TRANSPORT_FIX_V2__) return;
  window.__BOOKORA_PUBLISH_UPLOAD_TRANSPORT_FIX_V2__ = true;

  const originalFetch = window.fetch.bind(window);
  const RETRIES = 12;

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  async function retryRequest(url, init) {
    let lastError;
    for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
      if (init?.signal?.aborted) throw new DOMException('The request was aborted.', 'AbortError');
      try {
        return await originalFetch(url, init);
      } catch (error) {
        lastError = error;
        if (attempt >= RETRIES) throw error;
        console.warn(`[Bookora upload] backend request retry ${attempt}/${RETRIES - 1}`, error);
        await sleep(Math.min(2500 * attempt, 8000));
      }
    }
    throw lastError || new TypeError('Failed to fetch');
  }

  window.fetch = function(input, init = {}) {
    try {
      const url = typeof input === 'string' ? input : input?.url || '';
      const parsed = new URL(url, window.location.href);
      const path = parsed.pathname;
      const method = String(init?.method || (typeof input !== 'string' ? input?.method : '') || 'GET').toUpperCase();

      // Render can take a while to wake the free backend. A browser CORS
      // TypeError during that window is retried automatically instead of
      // immediately becoming the seller-facing "Failed to fetch" error.
      if (path === '/api/books/upload-direct-session/start' ||
          path === '/api/books/upload-direct-session/finalize') {
        return retryRequest(url, init);
      }

      // The capability token in the upload URL authorizes this short-lived
      // binary transfer. Do not send Firebase Authorization on the binary
      // request. text/plain is CORS-safelisted, so no PUT preflight occurs.
      const isUpload = path === '/api/books/upload-direct-session/proxy' ||
                       path === '/api/books/upload-direct-session/upload';
      if (isUpload && method === 'PUT') {
        const headers = new Headers(init?.headers || (typeof input !== 'string' ? input?.headers : undefined));
        headers.delete('Authorization');
        headers.delete('X-User-Token');
        headers.delete('X-Upload-Token');
        headers.delete('X-Upload-Session');
        headers.set('Content-Type', 'text/plain');
        const next = { ...init, method: 'POST', headers };
        return retryRequest(url, next);
      }
    } catch (error) {
      console.warn('[Bookora upload transport fix]', error);
    }
    return originalFetch(input, init);
  };
})();
