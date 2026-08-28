/* Bookora publish concurrency/idempotency guard.
 * Additive runtime only: keeps the existing publish UI and upload protocol.
 * A fresh key is created for each new PDF upload and attached to the final
 * /api/books/create request. If the browser retries that request, the backend
 * returns the already-created book instead of creating another one.
 */
(() => {
  if (window.__BOOKORA_PUBLISH_CONCURRENCY_SAFETY__) return;
  window.__BOOKORA_PUBLISH_CONCURRENCY_SAFETY__ = true;

  const ORIGINAL_FETCH = window.fetch.bind(window);
  let publishKey = '';

  const makeKey = () => {
    try { if (crypto?.randomUUID) return crypto.randomUUID(); } catch (_) {}
    return `bookora-publish-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  };

  const isBookoraApi = url => String(url || '').includes('/api/');

  window.fetch = async function publishSafetyFetch(input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url || '';
    const text = String(url);

    if (isBookoraApi(text) && text.includes('/api/books/upload-session/start')) {
      let body = {};
      try { body = typeof init.body === 'string' ? JSON.parse(init.body) : {}; } catch (_) {}
      if (String(body?.kind || '').toLowerCase() === 'pdf') {
        publishKey = makeKey();
        try { sessionStorage.setItem('bookora_publish_idempotency_key', publishKey); } catch (_) {}
      }
      return ORIGINAL_FETCH(input, init);
    }

    if (isBookoraApi(text) && text.includes('/api/books/create')) {
      let body = {};
      try { body = typeof init.body === 'string' ? JSON.parse(init.body) : {}; } catch (_) { return ORIGINAL_FETCH(input, init); }
      const key = publishKey || (() => { try { return sessionStorage.getItem('bookora_publish_idempotency_key') || ''; } catch (_) { return ''; } })();
      if (key && body && typeof body === 'object' && !body.idempotency_key && !body.publish_idempotency_key) {
        body.idempotency_key = key;
        return ORIGINAL_FETCH(input, { ...init, body: JSON.stringify(body) });
      }
    }

    return ORIGINAL_FETCH(input, init);
  };
})();
