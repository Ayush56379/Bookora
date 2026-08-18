import { state } from './state.js';

const API = 'https://bookora-backend-x08l.onrender.com';
const UPLOAD_PATH = '/api/books/upload-files';
let authPromise = null;

async function exchangeFirebaseSession() {
  if (state.token) return state.token;
  if (authPromise) return authPromise;

  authPromise = (async () => {
    if (!window.firebase || !window.firebase.auth) return '';
    const user = window.firebase.auth().currentUser;
    if (!user) return '';

    const idToken = await user.getIdToken(true);
    const response = await fetch(`${API}/api/auth/firebase`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ id_token: idToken })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success || !data.token) {
      throw new Error(data.error || 'Bookora authentication session could not be created.');
    }

    state.token = data.token;
    try { localStorage.setItem('bookora_auth_token', data.token); } catch (_) {}
    if (data.user) {
      state.currentUser = data.user;
      state.isAuthenticated = true;
      state.isAdmin = !!data.is_admin;
      state.isSeller = !!data.is_seller;
      try { localStorage.setItem('bookora_user_profile', JSON.stringify(data.user)); } catch (_) {}
    }
    return data.token;
  })().finally(() => { authPromise = null; });

  return authPromise;
}

async function ensureSession() {
  if (state.token) return state.token;
  return exchangeFirebaseSession();
}

function installAuthRefresh() {
  const start = () => {
    try {
      const auth = window.firebase?.auth?.();
      if (!auth) return false;
      auth.onAuthStateChanged(async user => {
        if (!user) return;
        try { await exchangeFirebaseSession(); } catch (error) {
          console.warn('Bookora backend session sync:', error.message);
        }
      });
      if (auth.currentUser) exchangeFirebaseSession().catch(() => {});
      return true;
    } catch (_) { return false; }
  };

  if (!start()) {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (start() || tries > 40) clearInterval(timer);
    }, 250);
  }
}

function createProgressUI() {
  if (document.getElementById('bookora-upload-progress')) return;
  const box = document.createElement('div');
  box.id = 'bookora-upload-progress';
  box.innerHTML = `
    <div class="bookora-upload-progress-card">
      <div class="bookora-upload-progress-top">
        <div>
          <strong id="bookora-upload-progress-title">Uploading eBook</strong>
          <div id="bookora-upload-progress-status">Preparing upload…</div>
        </div>
        <strong id="bookora-upload-progress-percent">0%</strong>
      </div>
      <div class="bookora-upload-progress-track"><div id="bookora-upload-progress-fill"></div></div>
      <div class="bookora-upload-progress-meta"><span id="bookora-upload-progress-detail">Starting…</span><span>Do not close this page</span></div>
    </div>`;
  document.body.appendChild(box);
}

function updateProgress(percent, status, detail) {
  createProgressUI();
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  const fill = document.getElementById('bookora-upload-progress-fill');
  const pct = document.getElementById('bookora-upload-progress-percent');
  const statusEl = document.getElementById('bookora-upload-progress-status');
  const detailEl = document.getElementById('bookora-upload-progress-detail');
  if (fill) fill.style.width = `${p}%`;
  if (pct) pct.textContent = `${p}%`;
  if (statusEl) statusEl.textContent = status || '';
  if (detailEl) detailEl.textContent = detail || '';
}

function finishProgress(success, message) {
  updateProgress(success ? 100 : 0, success ? 'Upload complete' : 'Upload failed', message);
  const box = document.getElementById('bookora-upload-progress');
  if (box) {
    box.classList.toggle('success', !!success);
    if (!success) box.classList.add('error');
  }
  if (success) setTimeout(() => box?.remove(), 1800);
}

function patchUploadFetch() {
  if (window.__bookoraUploadFetchPatched) return;
  window.__bookoraUploadFetchPatched = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async function(input, init = {}) {
    const url = typeof input === 'string' ? input : (input?.url || '');
    if (!String(url).includes(UPLOAD_PATH)) return originalFetch(input, init);

    try {
      const token = await ensureSession();
      if (!token) throw new Error('Your login session is not ready. Please wait a moment and try again.');

      let body = init.body;
      if (body == null && typeof input !== 'string' && input?.body) body = input.body;
      if (body instanceof FormData || body instanceof Blob || typeof body !== 'string') {
        return originalFetch(input, init);
      }

      createProgressUI();
      updateProgress(2, 'Preparing upload', 'Connecting to Bookora server…');

      return await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(String(init.method || 'POST'), String(url), true);
        xhr.responseType = 'text';
        const headers = new Headers(init.headers || {});
        headers.set('Authorization', `Bearer ${token}`);
        headers.set('Accept', 'application/json');
        headers.set('Content-Type', 'application/json');
        headers.forEach((value, key) => xhr.setRequestHeader(key, value));

        xhr.upload.onprogress = event => {
          if (!event.lengthComputable) {
            updateProgress(10, 'Uploading eBook', 'Sending files to server…');
            return;
          }
          const p = Math.min(95, Math.round((event.loaded / event.total) * 95));
          const mbLoaded = (event.loaded / 1048576).toFixed(1);
          const mbTotal = (event.total / 1048576).toFixed(1);
          updateProgress(p, 'Uploading eBook', `${mbLoaded} MB of ${mbTotal} MB sent`);
        };
        xhr.upload.onloadstart = () => updateProgress(3, 'Uploading eBook', 'Starting file transfer…');
        xhr.upload.onload = () => updateProgress(95, 'Processing upload', 'Files received. Verifying and saving…');
        xhr.onerror = () => { finishProgress(false, 'Network error while uploading.'); reject(new Error('Network error while uploading the eBook.')); };
        xhr.ontimeout = () => { finishProgress(false, 'The upload timed out.'); reject(new Error('The upload timed out. Please try again.')); };
        xhr.onload = () => {
          const text = xhr.responseText || '';
          let data = {};
          try { data = JSON.parse(text); } catch (_) {}
          if (xhr.status >= 200 && xhr.status < 300) {
            finishProgress(true, 'Files uploaded successfully.');
            resolve(new Response(text, {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: { 'Content-Type': xhr.getResponseHeader('Content-Type') || 'application/json' }
            }));
          } else {
            finishProgress(false, data.error || `Server returned ${xhr.status}.`);
            resolve(new Response(text || JSON.stringify({ error: data.error || `Upload failed (${xhr.status})` }), {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: { 'Content-Type': 'application/json' }
            }));
          }
        };
        xhr.send(body);
      });
    } catch (error) {
      finishProgress(false, error.message || 'Upload could not be started.');
      throw error;
    }
  };
}

function installProgressTrigger() {
  document.addEventListener('click', event => {
    const button = event.target?.closest?.('#submit-pub-btn');
    if (!button) return;
    createProgressUI();
    updateProgress(1, 'Preparing upload', 'Checking your secure session…');
    ensureSession().catch(error => {
      updateProgress(0, 'Authentication error', error.message);
    });
  }, true);
}

installAuthRefresh();
patchUploadFetch();
installProgressTrigger();
