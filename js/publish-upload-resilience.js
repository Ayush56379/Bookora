// BOOKORA_PUBLISH_UPLOAD_RESILIENCE_V1
// Permanent large-file upload recovery layer.
// - Retries transient chunk/network failures.
// - Reconciles the real Google Drive offset after a dropped connection.
// - Keeps the signed resumable session so a Render restart does not force a 0% restart.
// - Does not duplicate a chunk: server offset is authoritative.
(() => {
  if (window.__BOOKORA_PUBLISH_UPLOAD_RESILIENCE__) return;
  window.__BOOKORA_PUBLISH_UPLOAD_RESILIENCE__ = true;

  const ORIGINAL_FETCH = window.fetch.bind(window);
  const CHUNK_PATH = '/api/books/upload-session/chunk';
  const STATUS_PATH = '/api/books/upload-session/status';
  const START_PATH = '/api/books/upload-session/start';
  const MAX_ATTEMPTS = 5;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  const getUrl = input => {
    try { return new URL(typeof input === 'string' ? input : input?.url || '', location.href); }
    catch (_) { return null; }
  };

  const jsonBody = init => {
    try { return typeof init?.body === 'string' ? JSON.parse(init.body) : null; }
    catch (_) { return null; }
  };

  const responseJson = async response => {
    try { return await response.clone().json(); } catch (_) { return {}; }
  };

  const waitForRetry = attempt => sleep(Math.min(8000, 700 * (2 ** Math.max(0, attempt - 1))));

  async function statusRequest(token) {
    if (!token) throw new Error('Upload session is missing.');
    let lastError = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        const response = await ORIGINAL_FETCH(STATUS_PATH, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ upload_token: token }),
          cache: 'no-store'
        });
        const data = await responseJson(response);
        if (response.ok && data?.success) return data;
        lastError = new Error(data?.error || `Upload status failed (HTTP ${response.status}).`);
      } catch (error) { lastError = error; }
      if (attempt < MAX_ATTEMPTS) await waitForRetry(attempt);
    }
    throw lastError || new Error('Could not recover the upload session.');
  }

  const syntheticResponse = data => new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

  async function resilientChunk(input, init) {
    const originalBody = jsonBody(init);
    const token = String(originalBody?.upload_token || '');
    if (!token) return ORIGINAL_FETCH(input, init);

    let lastError = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        const response = await ORIGINAL_FETCH(input, init);
        if (response.ok) return response;

        const data = await responseJson(response);
        // 409 means the server has a different authoritative offset. Reconcile
        // instead of restarting the entire 80–100 MB file.
        if (response.status === 409) {
          const status = await statusRequest(token);
          return syntheticResponse({
            success: true,
            done: !!status.done,
            next_offset: Number(status.next_offset || 0),
            file: status.file || null
          });
        }

        if (![408, 429, 500, 502, 503, 504].includes(response.status)) return response;
        lastError = new Error(data?.error || `Chunk upload failed (HTTP ${response.status}).`);
      } catch (error) {
        lastError = error;

        // The request may have reached Render/Drive even when the browser lost
        // the response. Ask the server for the real offset before resending.
        try {
          const status = await statusRequest(token);
          return syntheticResponse({
            success: true,
            done: !!status.done,
            next_offset: Number(status.next_offset || 0),
            file: status.file || null
          });
        } catch (_) {}
      }
      if (attempt < MAX_ATTEMPTS) await waitForRetry(attempt);
    }
    throw lastError || new Error('Large-file chunk upload failed after retries.');
  }

  window.fetch = async function(input, init = {}) {
    const url = getUrl(input);
    const path = url?.pathname || '';
    if (path.endsWith(CHUNK_PATH)) return resilientChunk(input, init);
    return ORIGINAL_FETCH(input, init);
  };
})();
