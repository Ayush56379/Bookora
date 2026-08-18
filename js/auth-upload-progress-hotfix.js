import { state } from './state.js';

const API = 'https://bookora-backend-x08l.onrender.com';
const UPLOAD_PATH = '/api/books/upload-files';
const CHUNK_BYTES = 2359296; // 2.25 MiB = 9 x 256 KiB, also divisible by 3 for base64 slicing.
let authPromise = null;

async function exchangeFirebaseSession(forceRefresh = true) {
  if (authPromise) return authPromise;
  authPromise = (async () => {
    if (!window.firebase?.auth) return '';
    const user = window.firebase.auth().currentUser;
    if (!user) return '';
    const idToken = await user.getIdToken(forceRefresh);
    const response = await fetch(`${API}/api/auth/firebase`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id_token: idToken })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success || !data.token) throw new Error(data.error || 'Bookora authentication session could not be created.');
    state.token = data.token; state.isAuthenticated = true; state.isAdmin = !!data.is_admin; state.isSeller = !!data.is_seller;
    if (data.user) { state.currentUser = data.user; try { localStorage.setItem('bookora_user_profile', JSON.stringify(data.user)); } catch (_) {} }
    try { localStorage.setItem('bookora_auth_token', data.token); } catch (_) {}
    return data.token;
  })().finally(() => { authPromise = null; });
  return authPromise;
}

function installAuthRefresh() {
  const start = () => {
    try {
      const auth = window.firebase?.auth?.();
      if (!auth) return false;
      auth.onAuthStateChanged(user => { if (user) exchangeFirebaseSession(true).catch(() => {}); });
      if (auth.currentUser) exchangeFirebaseSession(true).catch(() => {});
      return true;
    } catch (_) { return false; }
  };
  if (!start()) {
    let tries = 0;
    const timer = setInterval(() => { if (start() || ++tries > 40) clearInterval(timer); }, 250);
  }
}

function createProgressUI() {
  if (document.getElementById('bookora-upload-progress')) return;
  const box = document.createElement('div');
  box.id = 'bookora-upload-progress';
  box.innerHTML = `<div class="bookora-upload-progress-card">
    <div class="bookora-upload-progress-top"><div><strong id="bookora-upload-progress-title">Uploading eBook</strong><div id="bookora-upload-progress-status">Preparing upload…</div></div><strong id="bookora-upload-progress-percent">0%</strong></div>
    <div class="bookora-upload-progress-track"><div id="bookora-upload-progress-fill"></div></div>
    <div class="bookora-upload-progress-meta"><span id="bookora-upload-progress-detail">Starting…</span><span>Do not close this page</span></div>
  </div>`;
  document.body.appendChild(box);
}

function updateProgress(percent, status, detail) {
  createProgressUI();
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  document.getElementById('bookora-upload-progress-fill')?.style.setProperty('width', `${p}%`);
  const pct = document.getElementById('bookora-upload-progress-percent'); if (pct) pct.textContent = `${p}%`;
  const statusEl = document.getElementById('bookora-upload-progress-status'); if (statusEl) statusEl.textContent = status || '';
  const detailEl = document.getElementById('bookora-upload-progress-detail'); if (detailEl) detailEl.textContent = detail || '';
}

function finishProgress(success, message) {
  updateProgress(success ? 100 : 0, success ? 'Upload complete' : 'Upload failed', message);
  const box = document.getElementById('bookora-upload-progress');
  if (box) box.classList.toggle('success', !!success), box.classList.toggle('error', !success);
  if (success) setTimeout(() => box?.remove(), 1800);
}

async function apiJSON(path, body, token, attempts = 3) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(`${API}${path}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) return data;
      const error = new Error(data.error || `Server returned ${response.status}.`);
      error.status = response.status; error.data = data;
      if (response.status === 401 && i === 0) { token = await exchangeFirebaseSession(true); continue; }
      if (response.status >= 500 && i < attempts - 1) { last = error; await new Promise(r => setTimeout(r, 800 * (i + 1))); continue; }
      throw error;
    } catch (error) {
      last = error;
      if (i < attempts - 1 && (!error.status || error.status >= 500)) { await new Promise(r => setTimeout(r, 800 * (i + 1))); continue; }
      throw error;
    }
  }
  throw last || new Error('Upload request failed.');
}

function base64ChunkChars() { return Math.floor(CHUNK_BYTES / 3) * 4; }

async function uploadBase64File(file, kind, token, completedBefore, totalUploadBytes) {
  const size = Math.round((String(file.data || '').length * 3) / 4) - (String(file.data || '').endsWith('==') ? 2 : String(file.data || '').endsWith('=') ? 1 : 0);
  if (!size) throw new Error(`${kind === 'pdf' ? 'PDF' : 'Cover'} data is empty.`);

  const start = await apiJSON('/api/books/upload-session/start', { name: file.name, mimeType: file.mimeType, size, kind }, token);
  const uploadToken = start.upload_token;
  let offset = 0;
  const encoded = String(file.data);
  const chars = base64ChunkChars();

  while (offset < size) {
    const bytesRemaining = size - offset;
    const bytesThisChunk = Math.min(CHUNK_BYTES, bytesRemaining);
    const charStart = Math.floor(offset / 3) * 4;
    const charEnd = bytesThisChunk === bytesRemaining ? encoded.length : charStart + Math.floor(bytesThisChunk / 3) * 4;
    const chunk = encoded.slice(charStart, charEnd);

    let result;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        result = await apiJSON('/api/books/upload-session/chunk', { upload_token: uploadToken, offset, data: chunk }, token, 2);
        break;
      } catch (error) {
        if (error.status === 409 && error.data?.next_offset != null) {
          offset = Number(error.data.next_offset);
          break;
        }
        if (attempt === 2) {
          const status = await apiJSON('/api/books/upload-session/status', { upload_token: uploadToken }, token, 2);
          offset = Number(status.next_offset || 0);
          if (status.done) return status.file;
          if (offset >= size) break;
          continue;
        }
        await new Promise(r => setTimeout(r, 900 * (attempt + 1)));
      }
    }

    if (!result) continue;
    offset = Number(result.next_offset || (offset + bytesThisChunk));
    const overall = completedBefore + offset;
    const pct = 5 + (overall / totalUploadBytes) * 90;
    updateProgress(pct, `Uploading ${kind === 'pdf' ? 'eBook PDF' : 'cover'}`, `${(overall / 1048576).toFixed(1)} MB of ${(totalUploadBytes / 1048576).toFixed(1)} MB uploaded`);
    if (result.done) return result.file;
  }

  const status = await apiJSON('/api/books/upload-session/status', { upload_token: uploadToken }, token, 2);
  if (!status.done) throw new Error(`Drive did not confirm completion of the ${kind === 'pdf' ? 'PDF' : 'cover'} upload.`);
  return status.file;
}

async function resumableUpload(payload, token) {
  const pdf = payload.pdf || {};
  const cover = payload.cover || {};
  const pdfSize = Math.round((String(pdf.data || '').length * 3) / 4) - (String(pdf.data || '').endsWith('==') ? 2 : String(pdf.data || '').endsWith('=') ? 1 : 0);
  const coverSize = cover.data ? Math.round((String(cover.data).length * 3) / 4) - (String(cover.data).endsWith('==') ? 2 : String(cover.data).endsWith('=') ? 1 : 0) : 0;
  const total = pdfSize + coverSize;
  if (!pdf.data) throw new Error('PDF file is required.');

  updateProgress(3, 'Starting resumable upload', 'Creating a secure Google Drive upload session…');
  const pdfFile = await uploadBase64File(pdf, 'pdf', token, 0, total);
  const coverFile = cover.data ? await uploadBase64File(cover, 'cover', token, pdfSize, total) : null;
  updateProgress(96, 'Finalizing', 'Drive confirmed the files. Creating the Bookora listing…');

  return {
    success: true,
    pdf_file_id: pdfFile?.id || '',
    pdf_url: pdfFile?.url || '',
    pdf_name: pdfFile?.name || '',
    pdf_size: pdfFile?.size || pdfSize,
    cover_file_id: coverFile?.id || '',
    cover_url: coverFile?.url || '',
    cover_name: coverFile?.name || ''
  };
}

function patchUploadFetch() {
  if (window.__bookoraUploadFetchPatched) return;
  window.__bookoraUploadFetchPatched = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async function(input, init = {}) {
    const url = typeof input === 'string' ? input : (input?.url || '');
    if (!String(url).includes(UPLOAD_PATH)) return originalFetch(input, init);

    try {
      const token = await exchangeFirebaseSession(true);
      if (!token) throw new Error('Your Firebase login session is not ready. Please sign in again.');
      let body = init.body;
      if (body == null && typeof input !== 'string' && input?.body) body = input.body;
      if (typeof body !== 'string') return originalFetch(input, init);

      let payload;
      try { payload = JSON.parse(body); } catch (_) { return originalFetch(input, init); }
      createProgressUI();
      const data = await resumableUpload(payload, token);
      finishProgress(true, 'Files uploaded successfully to Google Drive.');
      return new Response(JSON.stringify(data), { status: 201, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
      finishProgress(false, error?.message || 'Resumable upload failed.');
      return new Response(JSON.stringify({ success: false, error: error?.message || 'Upload failed.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  };
}

function installProgressTrigger() {
  document.addEventListener('click', event => {
    if (!event.target?.closest?.('#submit-pub-btn')) return;
    createProgressUI();
    updateProgress(1, 'Preparing upload', 'Refreshing secure Firebase session…');
    exchangeFirebaseSession(true).catch(error => updateProgress(0, 'Authentication error', error.message));
  }, true);
}

installAuthRefresh();
patchUploadFetch();
installProgressTrigger();
