/* Bookora canonical publish upload transport.
 * Browser -> Bookora backend -> private Google Drive.
 * The browser never contacts Google Drive directly.
 */
(() => {
  const ORIGINAL_FETCH = window.fetch.bind(window);
  const API_ROOT = String(window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com').replace(/\/$/, '');
  const RETRIES = 5;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function headersObject(headers) {
    const out = {};
    if (headers instanceof Headers) headers.forEach((v, k) => { out[k] = v; });
    else if (headers && typeof headers === 'object') Object.assign(out, headers);
    return out;
  }

  function jsonHeaders(headers) {
    const out = headersObject(headers);
    out['Content-Type'] = 'application/json';
    return out;
  }

  function progress(value, label) {
    const pct = Math.max(0, Math.min(100, Math.round(value)));
    document.querySelectorAll('progress').forEach(p => { p.max = 100; p.value = pct; });
    document.querySelectorAll('[role="progressbar"], .progress-bar, .upload-progress-fill').forEach(el => {
      el.style.width = `${pct}%`;
      if (el.getAttribute('role') === 'progressbar') el.setAttribute('aria-valuenow', String(pct));
    });
    if (label) {
      for (const el of document.querySelectorAll('*')) {
        if (el.children.length === 0 && /(Uploading|Starting|Drive|Retry|complete|failed)/i.test(el.textContent || '')) {
          if ((el.textContent || '').trim().length < 180) { el.textContent = label; break; }
        }
      }
    }
  }

  function base64Size(raw) {
    const text = String(raw || '').replace(/^data:[^,]*,/, '');
    if (!text) return 0;
    const padding = text.endsWith('==') ? 2 : text.endsWith('=') ? 1 : 0;
    return Math.floor(text.length * 3 / 4) - padding;
  }

  function base64ToBlob(raw, mime) {
    const text = String(raw || '').replace(/^data:[^,]*,/, '');
    if (!text) throw new Error('Selected file data is empty.');
    const parts = [];
    const CHARS = 4 * 1024 * 1024;
    for (let start = 0; start < text.length; start += CHARS) {
      let end = Math.min(text.length, start + CHARS);
      end -= end % 4;
      if (end <= start) end = Math.min(text.length, start + CHARS);
      const binary = atob(text.slice(start, end));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      parts.push(bytes);
    }
    return new Blob(parts, { type: mime || 'application/octet-stream' });
  }

  async function requestWithRetry(url, init, label) {
    let last;
    for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
      try {
        const response = await ORIGINAL_FETCH(url, init);
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.success === false) {
          const error = new Error(data.error || `Upload request failed (HTTP ${response.status}).`);
          error.status = response.status;
          error.payload = data;
          throw error;
        }
        return data;
      } catch (error) {
        last = error;
        if (attempt === RETRIES) break;
        progress(0, `${label || 'Upload'} — retrying (${attempt}/${RETRIES - 1})...`);
        await sleep(Math.min(1500 * attempt, 6000));
      }
    }
    throw last || new Error('Upload request failed.');
  }

  async function startDirect(file, kind, authHeaders) {
    const raw = String(file.data || '');
    const size = base64Size(raw);
    if (!size) throw new Error(`${kind} file is empty.`);
    if (kind === 'pdf' && size > 100 * 1024 * 1024) throw new Error('PDF must be 100 MB or smaller.');

    const data = await requestWithRetry(
      `${API_ROOT}/api/books/upload-direct-session/start`,
      {
        method: 'POST',
        headers: jsonHeaders(authHeaders),
        body: JSON.stringify({
          name: file.name || (kind === 'pdf' ? 'book.pdf' : 'cover.jpg'),
          mimeType: file.mimeType || (kind === 'pdf' ? 'application/pdf' : 'image/jpeg'),
          size,
          kind
        })
      },
      `Starting ${kind} upload`
    );
    if (!data.upload_url || !data.file_id) throw new Error(`${kind} upload session was not created.`);
    return { ...data, size };
  }

  async function uploadDirect(file, kind, authHeaders, startPct, weight) {
    const session = await startDirect(file, kind, authHeaders);
    const blob = base64ToBlob(file.data, file.mimeType || (kind === 'pdf' ? 'application/pdf' : 'image/jpeg'));
    if (blob.size !== session.size) throw new Error(`${kind} file size changed before upload.`);

    // POST with text/plain is intentionally a CORS-simple request. The short-lived
    // capability token in upload_url authorizes the binary transfer, so no
    // Authorization header is sent on this request and no browser preflight occurs.
    progress(startPct, `Uploading ${kind === 'pdf' ? 'eBook PDF' : 'cover'} — 0%`);
    const result = await requestWithRetry(
      session.upload_url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: blob
      },
      `Uploading ${kind}`
    );
    progress(startPct + weight, `${kind === 'pdf' ? 'eBook PDF' : 'cover'} uploaded — ${startPct + weight}%`);
    if (!result.file) throw new Error(`${kind} upload completed without file metadata.`);
    return result.file;
  }

  window.fetch = async function bookoraPublishFetch(input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url || '';
    const urlText = String(url);

    if (urlText.includes('/api/books/create')) {
      let payload;
      try { payload = typeof init.body === 'string' ? JSON.parse(init.body) : null; } catch (_) { payload = null; }
      const key = String(window.__BOOKORA_LAST_PUBLISH_IDEMPOTENCY_KEY || sessionStorage.getItem('bookora_publish_idempotency_key') || '').trim();
      if (key && payload && !payload.idempotency_key && !payload.publish_idempotency_key) {
        const nextInit = { ...init, body: JSON.stringify({ ...payload, idempotency_key: key }), headers: jsonHeaders(init.headers || {}) };
        return ORIGINAL_FETCH(input, nextInit);
      }
      return ORIGINAL_FETCH(input, init);
    }

    if (!urlText.includes('/api/books/upload-files')) return ORIGINAL_FETCH(input, init);

    let payload = {};
    try { payload = typeof init.body === 'string' ? JSON.parse(init.body) : {}; } catch (_) { return ORIGINAL_FETCH(input, init); }
    if (!payload?.pdf?.data) return ORIGINAL_FETCH(input, init);

    const authHeaders = init.headers || {};
    const publishKey = (crypto?.randomUUID ? crypto.randomUUID() : `bookora-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    window.__BOOKORA_LAST_PUBLISH_IDEMPOTENCY_KEY = publishKey;
    try { sessionStorage.setItem('bookora_publish_idempotency_key', publishKey); } catch (_) {}

    try {
      progress(0, 'Starting eBook upload...');
      const pdf = await uploadDirect(payload.pdf, 'pdf', authHeaders, 0, 95);
      let cover = null;
      if (payload.cover?.data) cover = await uploadDirect(payload.cover, 'cover', authHeaders, 95, 5);
      progress(100, 'Upload complete — creating book listing...');
      return new Response(JSON.stringify({
        success: true,
        pdf_file_id: pdf.id || pdf.file_id || '',
        pdf_url: pdf.url || pdf.webViewLink || '',
        cover_file_id: cover?.id || cover?.file_id || '',
        cover_url: cover?.url || cover?.webViewLink || '',
        idempotency_key: publishKey
      }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
      progress(0, `Upload failed — ${error?.message || 'Please retry'}`);
      throw error;
    }
  };
})();
