/* Bookora Google Drive resumable upload bridge.
 * Keeps the existing publish flow/API contract, but uploads large PDFs in
 * resumable chunks handled by the backend. Expired Drive sessions are now
 * recreated automatically and the file is resumed from byte 0 instead of
 * surfacing "Upload session expired" to the seller.
 */
(() => {
  const ORIGINAL_FETCH = window.fetch.bind(window);
  const API_ROOT = String(window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com').replace(/\/$/, '');
  const MAX_CHUNK = 4 * 1024 * 1024;
  const MAX_SESSION_RESTARTS = 4;
  const MAX_CHUNK_RETRIES = 5;

  const jsonHeaders = (headers) => {
    const out = {};
    if (headers instanceof Headers) headers.forEach((v, k) => { out[k] = v; });
    else if (headers && typeof headers === 'object') Object.assign(out, headers);
    out['Content-Type'] = 'application/json';
    return out;
  };

  async function readJson(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) {
      const error = new Error(data.error || `Upload request failed (HTTP ${response.status}).`);
      error.status = response.status;
      error.payload = data;
      throw error;
    }
    return data;
  }

  function isExpiredSessionError(error) {
    const text = String(error?.message || '').toLowerCase();
    return text.includes('upload session expired') ||
      text.includes('session expired') ||
      text.includes('resumable session') ||
      Number(error?.status) === 404 || Number(error?.status) === 410;
  }

  function isTransientError(error) {
    const status = Number(error?.status || 0);
    return !status || status === 408 || status === 425 || status === 429 || status >= 500;
  }

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function base64ToBytes(text, start, end) {
    const part = text.slice(start, end);
    const binary = atob(part);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function bytesToBase64(bytes) {
    let binary = '';
    const BLOCK = 0x8000;
    for (let i = 0; i < bytes.length; i += BLOCK) {
      binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + BLOCK, bytes.length)));
    }
    return btoa(binary);
  }

  function makeIdempotencyKey() {
    try { if (crypto?.randomUUID) return crypto.randomUUID(); } catch (_) {}
    return `bookora-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }

  function setProgress(percent, label) {
    const value = Math.max(0, Math.min(100, Math.round(percent)));
    document.querySelectorAll('*').forEach((el) => {
      if (el.children.length === 0 && /^\d{1,3}%$/.test((el.textContent || '').trim())) el.textContent = `${value}%`;
    });
    const progress = document.querySelector('progress');
    if (progress) { progress.max = 100; progress.value = value; }
    const bars = document.querySelectorAll('[role="progressbar"], .progress-bar, .upload-progress-fill');
    bars.forEach((bar) => {
      bar.style.width = `${value}%`;
      if (bar.getAttribute('role') === 'progressbar') bar.setAttribute('aria-valuenow', String(value));
    });
    if (label) {
      for (const el of document.querySelectorAll('*')) {
        if (el.children.length === 0 && /Uploading eBook|Starting resumable upload|Uploading to Drive|Restarting upload/i.test(el.textContent || '')) {
          el.textContent = label;
          break;
        }
      }
    }
  }

  async function startSession(file, kind, authHeaders) {
    const raw = String(file.data || '');
    const size = Math.floor(raw.length * 3 / 4) - (raw.endsWith('==') ? 2 : raw.endsWith('=') ? 1 : 0);
    if (!size || size < 1) throw new Error(`${kind} file data is empty.`);
    const response = await ORIGINAL_FETCH(`${API_ROOT}/api/books/upload-session/start`, {
      method: 'POST',
      headers: jsonHeaders(authHeaders),
      body: JSON.stringify({
        name: file.name || (kind === 'pdf' ? 'book.pdf' : 'cover.jpg'),
        mimeType: file.mimeType || (kind === 'pdf' ? 'application/pdf' : 'image/jpeg'),
        size,
        kind
      })
    });
    const started = await readJson(response);
    if (!started.upload_token) throw new Error('Upload session was not created.');
    return {
      token: started.upload_token,
      chunkBytes: Math.max(256 * 1024, Math.min(Number(started.chunk_size) || MAX_CHUNK, MAX_CHUNK)),
      offset: Number(started.next_offset || 0),
      size
    };
  }

  async function uploadOne(file, kind, authHeaders, overallStart, overallWeight) {
    const raw = String(file.data || '');
    if (!raw) throw new Error(`${kind} data is missing.`);

    let sessionRestart = 0;
    let session = await startSession(file, kind, authHeaders);
    const { size } = session;

    while (sessionRestart <= MAX_SESSION_RESTARTS) {
      try {
        while (session.offset < size) {
          const offset = session.offset;
          const bytesLeft = size - offset;
          const wanted = Math.min(session.chunkBytes, bytesLeft);
          const charStart = Math.floor(offset / 3) * 4;
          const charEnd = Math.min(raw.length, charStart + Math.ceil(wanted / 3) * 4);
          const bytes = base64ToBytes(raw, charStart, charEnd);
          const actual = Math.min(bytes.length, wanted);
          const chunk = actual === bytes.length ? bytes : bytes.subarray(0, actual);
          const encoded = bytesToBase64(chunk);

          let result = null;
          for (let attempt = 1; attempt <= MAX_CHUNK_RETRIES; attempt += 1) {
            try {
              const chunkResponse = await ORIGINAL_FETCH(`${API_ROOT}/api/books/upload-session/chunk`, {
                method: 'POST',
                headers: jsonHeaders(authHeaders),
                body: JSON.stringify({ upload_token: session.token, offset, data: encoded })
              });
              result = await readJson(chunkResponse);
              break;
            } catch (error) {
              if (isExpiredSessionError(error)) throw error;
              if (!isTransientError(error) || attempt === MAX_CHUNK_RETRIES) throw error;
              await sleep(Math.min(1500 * attempt, 6000));
            }
          }

          session.offset = Number(result.next_offset || (offset + actual));
          if (session.offset <= offset) throw new Error('Upload server did not advance the upload offset.');
          const percent = overallStart + (session.offset / size) * overallWeight;
          setProgress(percent, `${kind === 'pdf' ? 'Uploading eBook' : 'Uploading cover'} — ${Math.round(percent)}%`);
        }

        let status;
        for (let attempt = 1; attempt <= MAX_CHUNK_RETRIES; attempt += 1) {
          try {
            const statusResponse = await ORIGINAL_FETCH(`${API_ROOT}/api/books/upload-session/status`, {
              method: 'POST',
              headers: jsonHeaders(authHeaders),
              body: JSON.stringify({ upload_token: session.token })
            });
            status = await readJson(statusResponse);
            break;
          } catch (error) {
            if (isExpiredSessionError(error)) throw error;
            if (!isTransientError(error) || attempt === MAX_CHUNK_RETRIES) throw error;
            await sleep(Math.min(1500 * attempt, 6000));
          }
        }
        if (!status?.file?.file_id) throw new Error(`${kind} upload completed without a Google Drive file ID.`);
        return status.file;
      } catch (error) {
        if (!isExpiredSessionError(error) || sessionRestart >= MAX_SESSION_RESTARTS) throw error;
        sessionRestart += 1;
        setProgress(overallStart, `Upload session expired — restarting ${kind} upload (${sessionRestart}/${MAX_SESSION_RESTARTS})...`);
        await sleep(700 * sessionRestart);
        session = await startSession(file, kind, authHeaders);
      }
    }
    throw new Error(`${kind} upload could not be completed after automatic session recovery.`);
  }

  window.fetch = async function patchedBookoraFetch(input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url || '';
    const urlText = String(url);

    if (urlText.includes('/api/books/create')) {
      let payload = {};
      try { payload = typeof init.body === 'string' ? JSON.parse(init.body) : {}; } catch (_) { return ORIGINAL_FETCH(input, init); }
      const key = String(window.__BOOKORA_LAST_PUBLISH_IDEMPOTENCY_KEY || sessionStorage.getItem('bookora_publish_idempotency_key') || '').trim();
      if (key && payload && typeof payload === 'object' && !payload.idempotency_key && !payload.publish_idempotency_key) {
        payload.idempotency_key = key;
        const nextInit = { ...init, body: JSON.stringify(payload), headers: jsonHeaders(init.headers || {}) };
        return ORIGINAL_FETCH(input, nextInit);
      }
      return ORIGINAL_FETCH(input, init);
    }

    if (!urlText.includes('/api/books/upload-files')) return ORIGINAL_FETCH(input, init);

    let payload = {};
    try { payload = typeof init.body === 'string' ? JSON.parse(init.body) : {}; } catch (_) { return ORIGINAL_FETCH(input, init); }
    if (!payload?.pdf?.data) return ORIGINAL_FETCH(input, init);

    const authHeaders = init.headers || {};
    const publishKey = makeIdempotencyKey();
    window.__BOOKORA_LAST_PUBLISH_IDEMPOTENCY_KEY = publishKey;
    try { sessionStorage.setItem('bookora_publish_idempotency_key', publishKey); } catch (_) {}
    setProgress(0, 'Starting resumable upload...');

    try {
      const pdf = await uploadOne(payload.pdf, 'pdf', authHeaders, 0, 95);
      setProgress(95, 'Uploading cover...');
      const cover = payload.cover?.data ? await uploadOne(payload.cover, 'cover', authHeaders, 95, 5) : null;
      setProgress(100, 'Upload complete — creating book listing...');
      const result = {
        success: true,
        pdf_file_id: pdf.file_id || '',
        pdf_url: pdf.url || '',
        cover_file_id: cover?.file_id || '',
        cover_url: cover?.url || '',
        idempotency_key: publishKey
      };
      return new Response(JSON.stringify(result), { status: 201, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
      setProgress(0, 'Upload failed');
      throw error;
    }
  };
})();
