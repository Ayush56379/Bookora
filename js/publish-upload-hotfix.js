import { state } from './state.js';

const API_BASE_URL = window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com';
const PDF_MAX = 100 * 1024 * 1024;
const COVER_MAX = 5 * 1024 * 1024;

function el(id) {
  return document.getElementById(id);
}

function value(id, fallback = '') {
  return el(id)?.value?.trim() || fallback;
}

function numberValue(id) {
  const n = Number(el(id)?.value);
  return Number.isFinite(n) ? n : 0;
}

function showProgress() {
  let box = el('bookora-upload-progress');
  if (box) return box;

  box = document.createElement('div');
  box.id = 'bookora-upload-progress';
  box.style.cssText = [
    'margin:16px 0 0;padding:16px 18px;border:1px solid #dbe4f0;border-radius:14px;',
    'background:#f8fafc;box-shadow:0 4px 16px rgba(15,23,42,.06);'
  ].join('');
  box.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:8px;">
      <strong id="bookora-upload-status">Preparing upload…</strong>
      <strong id="bookora-upload-percent">0%</strong>
    </div>
    <div style="height:10px;background:#e2e8f0;border-radius:999px;overflow:hidden;">
      <div id="bookora-upload-bar" style="height:100%;width:0%;background:var(--accent,#2563eb);border-radius:999px;transition:width .15s ease;"></div>
    </div>
    <div id="bookora-upload-detail" style="margin-top:8px;color:#64748b;font-size:.82rem;">Starting…</div>
  `;

  const submit = el('submit-pub-btn');
  submit?.parentElement?.insertBefore(box, submit);
  return box;
}

function setProgress(percent, status, detail = '') {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  showProgress();
  const bar = el('bookora-upload-bar');
  const pct = el('bookora-upload-percent');
  const statusEl = el('bookora-upload-status');
  const detailEl = el('bookora-upload-detail');
  if (bar) bar.style.width = `${p}%`;
  if (pct) pct.textContent = `${p}%`;
  if (statusEl) statusEl.textContent = status;
  if (detailEl) detailEl.textContent = detail;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 2 : 0)} ${units[i]}`;
}

function fileToBase64WithProgress(file, start, end, label) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = event => {
      if (event.lengthComputable) {
        const ratio = event.loaded / event.total;
        setProgress(start + (end - start) * ratio, `Preparing ${label}…`, `${formatBytes(event.loaded)} of ${formatBytes(event.total)} read`);
      }
    };
    reader.onload = () => {
      try {
        const result = String(reader.result || '');
        const comma = result.indexOf(',');
        resolve(comma >= 0 ? result.slice(comma + 1) : result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error(`Unable to read ${label}.`));
    reader.readAsDataURL(file);
  });
}

function xhrJsonUpload(url, body, token, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.upload.onprogress = event => {
      if (event.lengthComputable) onProgress(event.loaded, event.total);
    };
    xhr.onerror = () => reject(new Error('Network error while uploading files. Please try again.'));
    xhr.ontimeout = () => reject(new Error('Upload timed out. Please try again with a smaller file.'));
    xhr.timeout = 10 * 60 * 1000;
    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText || '{}'); } catch (_) {}
      if (xhr.status >= 200 && xhr.status < 300 && data.success) {
        resolve(data);
      } else {
        const message = data.error || data.message || `Upload failed (HTTP ${xhr.status}).`;
        const error = new Error(message);
        error.status = xhr.status;
        error.response = data;
        reject(error);
      }
    };
    xhr.send(JSON.stringify(body));
  });
}

async function getBackendSession() {
  if (state.token) return state.token;

  const firebaseUser = window.firebase?.auth?.()?.currentUser;
  if (!firebaseUser) throw new Error('Your Firebase login session is not ready. Please sign in again.');

  const firebaseIdToken = await firebaseUser.getIdToken(true);
  const response = await fetch(`${API_BASE_URL}/api/auth/firebase`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${firebaseIdToken}`
    },
    body: JSON.stringify({ id_token: firebaseIdToken })
  });

  let data = {};
  try { data = await response.json(); } catch (_) {}
  if (!response.ok || !data.success || !data.token) {
    throw new Error(data.error || `Backend authentication failed (HTTP ${response.status}).`);
  }

  state.token = data.token;
  localStorage.setItem('bookora_auth_token', data.token);
  if (data.user) {
    state.currentUser = data.user;
    state.isAuthenticated = true;
    state.isAdmin = Boolean(data.is_admin);
    state.isSeller = Boolean(data.is_seller);
    localStorage.setItem('bookora_user_profile', JSON.stringify(data.user));
  }
  return data.token;
}

async function verifyServerSession(token) {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` }
  });
  let data = {};
  try { data = await response.json(); } catch (_) {}
  if (!response.ok || !data.authenticated) {
    state.token = '';
    localStorage.removeItem('bookora_auth_token');
    throw new Error('Your Bookora session expired. Please sign in again.');
  }
  if (!data.is_seller && !data.is_admin) {
    throw new Error(data.seller_status === 'pending'
      ? 'Seller approval is still pending. You cannot publish yet.'
      : 'Seller authorization is required before publishing.');
  }
  return data;
}

async function handlePublishSubmit(event) {
  const form = event.target;
  if (!(form instanceof HTMLFormElement) || form.id !== 'publish-wizard-form') return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  const pdf = el('pub-pdf')?.files?.[0];
  const cover = el('pub-cover')?.files?.[0];
  const pages = numberValue('pub-pages');
  const price = numberValue('pub-price');
  const saleRaw = value('pub-saleprice');
  const salePrice = saleRaw === '' ? 0 : Number(saleRaw);

  if (!value('pub-title') || value('pub-title').length < 3) return alert('Please enter a valid eBook title.');
  if (!value('pub-author')) return alert('Please enter the author name.');
  if (!value('pub-category')) return alert('Please select a category.');
  if (value('pub-description').length < 20) return alert('Description must contain at least 20 characters.');
  if (!pdf) return alert('Please select your PDF eBook.');
  if (pdf.size > PDF_MAX) return alert('PDF must be 100 MB or smaller.');
  if (!cover) return alert('Please select the eBook cover image.');
  if (cover.size > COVER_MAX) return alert('Cover must be 5 MB or smaller.');
  if (!pages || pages < 1) return alert('PDF page count is required.');
  if (!price || price <= 0) return alert('Please enter a valid list price.');
  if (!Number.isFinite(salePrice) || salePrice < 0 || salePrice > price) return alert('Please enter a valid sale price.');

  const button = el('submit-pub-btn');
  if (button) {
    button.disabled = true;
    button.textContent = 'Connecting…';
  }

  showProgress();
  setProgress(2, 'Connecting to Bookora…', 'Securely checking your seller session');

  try {
    const token = await getBackendSession();
    await verifyServerSession(token);

    setProgress(5, 'Preparing PDF…', `${formatBytes(pdf.size)} file`);
    const pdfBase64 = await fileToBase64WithProgress(pdf, 5, 22, 'PDF');
    setProgress(23, 'Preparing cover…', `${formatBytes(cover.size)} file`);
    const coverBase64 = await fileToBase64WithProgress(cover, 23, 30, 'cover');

    if (button) button.textContent = 'Uploading…';
    setProgress(30, 'Uploading to Drive…', '0% of upload request sent');

    const uploadData = await xhrJsonUpload(
      `${API_BASE_URL}/api/books/upload-files`,
      {
        action: 'uploadBookFiles',
        pdf: { name: pdf.name, mimeType: 'application/pdf', data: pdfBase64 },
        cover: { name: cover.name, mimeType: cover.type, data: coverBase64 }
      },
      token,
      (loaded, total) => {
        const ratio = total ? loaded / total : 0;
        setProgress(30 + ratio * 55, 'Uploading to Drive…', `${formatBytes(loaded)} of ${formatBytes(total)} sent`);
      }
    );

    setProgress(87, 'Creating book listing…', 'Files uploaded successfully');
    if (button) button.textContent = 'Creating listing…';

    const bookResponse = await fetch(`${API_BASE_URL}/api/books/create`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        action: 'createBook',
        title: value('pub-title'),
        subtitle: value('pub-subtitle'),
        author: value('pub-author'),
        category: value('pub-category'),
        description: value('pub-description'),
        tags: value('pub-tags').split(',').map(x => x.trim()).filter(Boolean),
        pages,
        format: 'PDF',
        price,
        sale_price: salePrice || null,
        cover_url: uploadData.cover_url || '',
        pdf_url: uploadData.pdf_url || '',
        cover_file_id: uploadData.cover_file_id || '',
        pdf_file_id: uploadData.pdf_file_id || '',
        status: 'pending'
      })
    });

    let bookData = {};
    try { bookData = await bookResponse.json(); } catch (_) {}
    if (!bookResponse.ok || !bookData.success) {
      throw new Error(bookData.error || `Book creation failed (HTTP ${bookResponse.status}).`);
    }

    setProgress(100, 'Upload complete ✓', 'Your eBook was submitted for admin review.');
    if (button) button.textContent = 'Submitted ✓';

    try { window.dispatchEvent(new CustomEvent('bookora:publish-success', { detail: bookData })); } catch (_) {}

    setTimeout(() => {
      window.location.hash = '#/creator/dashboard';
    }, 1000);
  } catch (error) {
    console.error('Bookora publish hotfix error:', error);
    setProgress(0, 'Upload failed', error?.message || 'Unable to upload the eBook.');
    const status = el('bookora-upload-status');
    if (status) status.style.color = '#b91c1c';
    if (button) {
      button.disabled = false;
      button.textContent = 'Upload & Submit 🚀';
    }
  }
}

document.addEventListener('submit', handlePublishSubmit, true);
