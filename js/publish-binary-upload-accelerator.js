/* BOOKORA PUBLISH UPLOAD ACCELERATOR
 * Converts the existing JSON/base64 resumable chunk requests into binary chunk
 * requests without changing the publish page UI or its upload state machine.
 * The backend's binary endpoint forwards bytes directly to Google Drive.
 * This avoids base64 expansion and an extra encode/decode pass for large PDFs.
 */
(() => {
  if (window.__BOOKORA_BINARY_UPLOAD_ACCELERATOR__) return;
  window.__BOOKORA_BINARY_UPLOAD_ACCELERATOR__ = true;

  const originalFetch = window.fetch.bind(window);
  const decoder = new TextDecoder();

  function base64ToBlob(base64, type = 'application/octet-stream') {
    const clean = String(base64 || '').replace(/\s+/g, '');
    const binary = atob(clean);
    const chunk = 0x8000;
    const parts = [];
    for (let i = 0; i < binary.length; i += chunk) {
      const bytes = new Uint8Array(Math.min(chunk, binary.length - i));
      for (let j = 0; j < bytes.length; j += 1) bytes[j] = binary.charCodeAt(i + j);
      parts.push(bytes);
    }
    return new Blob(parts, { type });
  }

  window.fetch = async function(input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url || '';
    const method = String(init?.method || (typeof input !== 'string' ? input?.method : 'GET') || 'GET').toUpperCase();
    const path = (() => { try { return new URL(url, window.location.href).pathname; } catch (_) { return url; } })();

    if (method === 'POST' && path.endsWith('/api/books/upload-session/chunk')) {
      let payload = null;
      try {
        payload = typeof init.body === 'string' ? JSON.parse(init.body) : null;
      } catch (_) {}

      if (payload?.upload_token && payload?.data) {
        const headers = new Headers(init.headers || {});
        headers.set('X-Bookora-Upload-Token', String(payload.upload_token));
        headers.set('X-Bookora-Offset', String(Number(payload.offset) || 0));
        headers.delete('Content-Type');
        headers.set('Accept', 'application/json');

        const binaryBody = base64ToBlob(payload.data, 'application/octet-stream');
        const binaryUrl = url.replace(/\/api\/books\/upload-session\/chunk(?:\?.*)?$/, '/api/books/upload-session/chunk-binary');

        return originalFetch(binaryUrl, { ...init, method: 'POST', headers, body: binaryBody });
      }
    }

    return originalFetch(input, init);
  };

  // Keep the patch observable for diagnostics without logging file contents.
  window.__BOOKORA_BINARY_UPLOAD_STATUS__ = () => ({ enabled: true, endpoint: '/api/books/upload-session/chunk-binary' });
})();
