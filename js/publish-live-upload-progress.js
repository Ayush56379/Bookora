// BOOKORA LIVE UPLOAD PROGRESS + DIRECT DRIVE MB PROGRESS + STEP 5 SPACING + PUBLISH SUCCESS + AI PRECHECK REMOVAL
(() => {
  const MB = 1024 * 1024;
  const sessions = new Map();
  const totals = { pdf: 0, cover: 0 };
  const completed = { pdf: 0, cover: 0 };
  let lastPercent = -1;
  let publishFinalized = false;
  let directCurrent = null;

  const isPublish = () => {
    const r = (window.location.hash || '').split('?')[0];
    return r === '#/publish' || r === '#/publish/';
  };

  const selectedFile = id => document.getElementById(id)?.files?.[0] || null;
  const fileSize = id => Number(selectedFile(id)?.size || 0);
  const fmtMB = bytes => `${(Math.max(0, Number(bytes) || 0) / MB).toFixed(2)} MB`;

  // The direct uploader and this progress runtime both update Step 5. The direct
  // runtime can briefly replace the PDF row with 0/0 while preparing the cover.
  // Always recover the real selected file sizes from the browser File objects.
  function preserveSelectedFileSizes() {
    if (!isPublish()) return;
    const pdfSize = fileSize('pub-pdf');
    const coverSize = fileSize('pub-cover');
    if (!pdfSize && !coverSize) return;

    if (pdfSize) totals.pdf = pdfSize;
    if (coverSize) totals.cover = coverSize;

    const details = document.getElementById('upload-live-details');
    if (details) {
      const rows = details.querySelectorAll(':scope > div');
      const pdfRow = rows[0];
      const coverRow = rows[2];
      const totalRow = rows[4];

      const preserveLoaded = (strong, total) => {
        if (!strong || !total) return;
        const text = String(strong.textContent || '');
        const match = text.match(/^([0-9.]+\s*MB)\s*\//i);
        strong.textContent = `${match ? match[1] : '0.00 MB'} / ${fmtMB(total)}`;
      };
      preserveLoaded(pdfRow?.querySelector('strong'), pdfSize);
      preserveLoaded(coverRow?.querySelector('strong'), coverSize);
      preserveLoaded(totalRow?.querySelector('strong'), pdfSize + coverSize);
    }

    const button = document.getElementById('submit-pub-btn');
    const label = document.getElementById('upload-progress-label');
    const buttonText = button?.textContent || '';
    if (pdfSize && /Preparing cover upload/i.test(buttonText) && !/Uploading/i.test(buttonText)) {
      if (button) button.textContent = 'Preparing eBook upload…';
      if (label) label.innerHTML = `<strong>Preparing eBook upload…</strong><span style="display:block;color:#64748b;font-size:.8rem;margin-top:4px;">PDF: ${fmtMB(pdfSize)} · Cover: ${coverSize ? fmtMB(coverSize) : '—'}</span>`;
    }
  }

  function ensureUI() {
    const step = document.getElementById('step-5');
    if (!step) return null;
    let box = document.getElementById('bookora-live-upload-progress');
    if (!box) {
      box = document.createElement('div');
      box.id = 'bookora-live-upload-progress';
      box.style.cssText = 'display:none;margin:1.25rem 0 1.5rem;padding:1rem 1.1rem;border:1px solid #dbe4f0;border-radius:14px;background:#f8fafc;box-sizing:border-box;width:100%;overflow:hidden;';
      box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;"><strong id="bookora-upload-progress-title" style="font-size:.95rem;color:#0f172a;">Upload progress</strong><strong id="bookora-upload-progress-percent" style="font-size:.95rem;color:#2563eb;">0%</strong></div><div style="height:10px;width:100%;background:#e2e8f0;border-radius:999px;overflow:hidden;"><div id="bookora-upload-progress-fill" style="height:100%;width:0%;border-radius:999px;background:#2563eb;transition:width .2s ease;"></div></div><div id="bookora-upload-progress-bytes" style="margin-top:8px;font-size:.84rem;color:#64748b;line-height:1.45;">0 MB / 0 MB uploaded</div><div id="bookora-upload-success-note" style="display:none;margin-top:10px;font-weight:700;color:#15803d;">✓ eBook uploaded successfully and submitted for admin review.</div>';
      const submit = document.getElementById('submit-pub-btn');
      const actions = submit?.closest('div');
      if (actions && actions.parentElement === step) step.insertBefore(box, actions);
      else step.appendChild(box);
    }
    const submit = document.getElementById('submit-pub-btn');
    const back = step.querySelector('.prev-step-btn');
    const actions = submit?.closest('div');
    if (actions) {
      actions.style.display = 'flex'; actions.style.flexWrap = 'wrap'; actions.style.justifyContent = 'space-between';
      actions.style.alignItems = 'center'; actions.style.gap = '16px'; actions.style.marginTop = '20px'; actions.style.paddingTop = '4px'; actions.style.width = '100%'; actions.style.boxSizing = 'border-box';
    }
    [back, submit].forEach(button => { if (!button) return; button.style.margin = '0'; button.style.boxSizing = 'border-box'; button.style.minHeight = '48px'; button.style.flexShrink = '0'; });
    if (submit) submit.style.marginLeft = 'auto';
    if (publishFinalized && submit) { submit.disabled = true; submit.textContent = 'Upload Successful ✓'; submit.style.opacity = '1'; submit.style.cursor = 'default'; }
    preserveSelectedFileSizes();
    return box;
  }

  function setProgress(title, percent, uploaded, total) {
    const box = ensureUI(); if (!box) return;
    preserveSelectedFileSizes();
    const selectedTotal = fileSize('pub-pdf') + fileSize('pub-cover');
    if (selectedTotal > 0) total = Math.max(Number(total) || 0, selectedTotal);
    const p = Math.max(0, Math.min(100, Math.round(percent)));
    box.style.display = 'block';
    const titleEl = document.getElementById('bookora-upload-progress-title');
    const percentEl = document.getElementById('bookora-upload-progress-percent');
    const fill = document.getElementById('bookora-upload-progress-fill');
    const bytes = document.getElementById('bookora-upload-progress-bytes');
    if (titleEl) titleEl.textContent = title || 'Upload progress';
    if (percentEl) percentEl.textContent = `${p}%`;
    if (fill) fill.style.width = `${p}%`;
    if (bytes) bytes.textContent = `${(Math.max(0, uploaded) / MB).toFixed(2)} MB / ${(Math.max(0, total) / MB).toFixed(2)} MB uploaded`;
    lastPercent = p;
  }

  function showPublishSuccess() {
    publishFinalized = true;
    const total = totals.pdf + totals.cover;
    const uploaded = total || (completed.pdf + completed.cover);
    setProgress('Upload successful ✓', 100, uploaded, total || uploaded);
    const note = document.getElementById('bookora-upload-success-note'); if (note) note.style.display = 'block';
    const submit = document.getElementById('submit-pub-btn');
    if (submit) { submit.disabled = true; submit.textContent = 'Upload Successful ✓'; submit.style.cursor = 'default'; submit.style.opacity = '1'; }
  }

  function parseBody(body) { if (typeof body !== 'string') return null; try { return JSON.parse(body); } catch (_) { return null; } }

  function directDrivePutWithProgress(url, init, total, kind) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url, true);
      const headers = new Headers(init.headers || {});
      headers.forEach((value, key) => xhr.setRequestHeader(key, value));
      const body = init.body;
      const size = Number(total || body?.size || 0);
      setProgress('Uploading ' + (kind === 'cover' ? 'cover' : 'PDF') + ' directly to Drive...', 0, 0, size);
      xhr.upload.onprogress = e => {
        const loaded = e.lengthComputable ? e.loaded : 0;
        if (size > 0) setProgress('Uploading ' + (kind === 'cover' ? 'cover' : 'PDF') + ' directly to Drive...', loaded / size * 100, loaded, size);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          if (size > 0) setProgress((kind === 'cover' ? 'Cover' : 'PDF') + ' uploaded ✓', 100, size, size);
          resolve(new Response(xhr.responseText || '', { status: xhr.status, statusText: xhr.statusText }));
        } else reject(new Error('Google Drive upload failed (' + xhr.status + ').'));
      };
      xhr.onerror = () => reject(new Error('Google Drive upload network error.'));
      xhr.onabort = () => reject(new Error('Upload cancelled.'));
      xhr.send(body);
    });
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = async function(input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url || '';
    const body = init?.body;
    let path = url;
    try { path = new URL(url, location.href).pathname; } catch (_) {}

    if (isPublish() && String(init?.method || '').toUpperCase() === 'PUT' && /googleapis\.com|googleusercontent\.com/i.test(url) && body instanceof Blob && directCurrent) {
      const current = directCurrent;
      directCurrent = null;
      return directDrivePutWithProgress(url, init, current.size, current.kind);
    }

    if (!isPublish() || (!path.includes('/api/books/upload-session/') && !path.includes('/api/books/upload-direct-session/') && !path.endsWith('/api/books/create'))) {
      return originalFetch(input, init);
    }

    const payload = parseBody(body);
    const result = await originalFetch(input, init);

    try {
      if (path.endsWith('/api/books/create')) {
        const data = await result.clone().json().catch(() => ({}));
        if (result.ok && data?.success === true) showPublishSuccess();
      } else if (path.endsWith('/upload-direct-session/start') && payload?.kind && Number(payload.size) > 0) {
        const data = await result.clone().json().catch(() => ({}));
        if (result.ok && data?.upload_url) {
          const kind = String(payload.kind).toLowerCase() === 'cover' ? 'cover' : 'pdf';
          directCurrent = { kind, size: Number(payload.size), uploadUrl: String(data.upload_url) };
          totals[kind] = Number(payload.size);
          setProgress('Preparing direct upload...', 0, 0, totals.pdf + totals.cover || Number(payload.size));
        }
      } else if (path.endsWith('/start') && payload?.kind && Number(payload.size) > 0) {
        const data = await result.clone().json().catch(() => ({}));
        const token = String(data.upload_token || '').trim();
        if (token) {
          const kind = String(payload.kind).toLowerCase() === 'cover' ? 'cover' : 'pdf';
          sessions.set(token, { kind, size: Number(payload.size), completed: Number(data.next_offset) || 0 });
          totals[kind] = Number(payload.size); completed[kind] = Number(data.next_offset) || 0; render();
        }
      } else if (path.endsWith('/chunk') && payload?.upload_token) {
        const session = sessions.get(String(payload.upload_token));
        if (session) {
          const data = await result.clone().json().catch(() => ({})); const next = Number(data.next_offset);
          if (result.ok && Number.isFinite(next)) { session.completed = Math.max(session.completed, Math.min(session.size, next)); completed[session.kind] = session.completed; render(); }
        }
      } else if (path.endsWith('/status') && payload?.upload_token) {
        const session = sessions.get(String(payload.upload_token));
        if (session) {
          const data = await result.clone().json().catch(() => ({}));
          if (data.done) { session.completed = session.size; completed[session.kind] = session.size; render(); }
        }
      }
    } catch (error) { console.warn('[Bookora upload progress]', error); }
    return result;
  };

  function render() {
    preserveSelectedFileSizes();
    const selectedTotal = fileSize('pub-pdf') + fileSize('pub-cover');
    const total = Math.max(totals.pdf + totals.cover, selectedTotal);
    if (!total || publishFinalized) return;
    const pdfTotal = Math.max(totals.pdf, fileSize('pub-pdf'));
    const coverTotal = Math.max(totals.cover, fileSize('pub-cover'));
    const uploaded = Math.min(pdfTotal, completed.pdf) + Math.min(coverTotal, completed.cover);
    const percent = uploaded / total * 100;
    const title = completed.pdf < pdfTotal ? 'Preparing PDF upload...' : completed.cover < coverTotal ? 'Preparing cover upload...' : 'Files uploaded ✓';
    setProgress(title, percent, uploaded, total);
  }

  function watch() {
    ensureUI();
    const observer = new MutationObserver(() => {
      ensureUI(); preserveSelectedFileSizes();
      if (publishFinalized) return;
      const button = document.getElementById('submit-pub-btn'); const text = button?.textContent || '';
      if (/Uploading PDF|Uploading cover/i.test(text) && totals.pdf + totals.cover > 0 && lastPercent < 0) setProgress(text, 0, 0, totals.pdf + totals.cover);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    window.addEventListener('hashchange', () => setTimeout(ensureUI, 50));
    setInterval(preserveSelectedFileSizes, 500);
  }

  document.addEventListener('submit', event => {
    if (!isPublish()) return;
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== 'publish-wizard-form') return;
    form.dataset.allowOriginalSubmit = '1';
  }, true);

  const cleanStaleAiNotice = () => {
    if (!isPublish()) return;
    document.querySelectorAll('[role="alert"], [role="status"], .toast, .toast-container, [class*="toast"], [class*="notification"]').forEach(el => {
      const text = String(el.textContent || '').toLowerCase();
      if (text.includes('ai precheck') || text.includes('ai checking book')) el.remove();
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { watch(); cleanStaleAiNotice(); }, { once: true });
  else { watch(); cleanStaleAiNotice(); }
  new MutationObserver(cleanStaleAiNotice).observe(document.documentElement, { childList: true, subtree: true });
})();
