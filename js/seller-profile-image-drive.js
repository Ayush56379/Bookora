/* Bookora seller profile image: Google Drive storage + backend/Firestore record sync.
 * Adds drag/drop UI to Seller Apply without replacing the core seller form.
 * The existing /api/books/upload-session/* backend stores the binary in Drive;
 * /api/seller/apply remains the source of truth for the Firebase/Firestore record.
 */
import { state } from './state.js';
import { Toast } from './components/Toast.js';

(() => {
  'use strict';

  const API_ROOT = String(window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com').replace(/\/$/, '');
  const MAX_BYTES = 5 * 1024 * 1024;
  const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);
  let selectedFile = null;
  let uploadedMeta = null;
  let uploadPromise = null;

  function authHeaders(extra = {}) {
    const out = { ...extra };
    if (state.token) out.Authorization = `Bearer ${state.token}`;
    return out;
  }

  async function json(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data.error || `Request failed (HTTP ${response.status})`);
    return data;
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
      reader.onerror = () => reject(new Error('Could not read the profile image.'));
      reader.readAsDataURL(file);
    });
  }

  function setStatus(text, kind = 'info') {
    const el = document.getElementById('seller-profile-image-status');
    if (!el) return;
    el.textContent = text;
    el.dataset.kind = kind;
  }

  function renderPreview(meta, file) {
    const img = document.getElementById('seller-profile-image-preview');
    const placeholder = document.getElementById('seller-profile-image-placeholder');
    const remove = document.getElementById('seller-profile-image-remove');
    if (!img || !placeholder) return;
    const src = file ? URL.createObjectURL(file) : (meta?.url || '');
    if (src) {
      img.src = src;
      img.hidden = false;
      placeholder.hidden = true;
      if (remove) remove.hidden = false;
    } else {
      img.removeAttribute('src');
      img.hidden = true;
      placeholder.hidden = false;
      if (remove) remove.hidden = true;
    }
  }

  function validateFile(file) {
    if (!file) throw new Error('Please choose a profile image.');
    if (!ALLOWED.has(file.type)) throw new Error('Profile image must be JPG, PNG, or WebP.');
    if (file.size > MAX_BYTES) throw new Error('Profile image must be 5 MB or smaller.');
  }

  async function uploadToDrive(file) {
    validateFile(file);
    if (uploadedMeta?.localKey === `${file.name}:${file.size}:${file.lastModified}`) return uploadedMeta;
    if (uploadPromise) return uploadPromise;

    uploadPromise = (async () => {
      setStatus('Uploading profile image to Google Drive…', 'loading');
      await fileToBase64(file);
      const startRes = await fetch(`${API_ROOT}/api/books/upload-session/start`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ name: file.name, mimeType: file.type, size: file.size, kind: 'profile_image' })
      });
      const started = await json(startRes);
      const token = started.upload_token;
      const chunkBytes = Math.max(256 * 1024, Math.min(Number(started.chunk_size) || 4 * 1024 * 1024, 4 * 1024 * 1024));
      let offset = Number(started.next_offset || 0);

      while (offset < file.size) {
        const end = Math.min(file.size, offset + chunkBytes);
        const bytes = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(new Uint8Array(reader.result));
          reader.onerror = () => reject(new Error('Could not read an upload chunk.'));
          reader.readAsArrayBuffer(file.slice(offset, end));
        });
        let binary = '';
        for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + 0x8000, bytes.length)));
        const chunkRes = await fetch(`${API_ROOT}/api/books/upload-session/chunk`, {
          method: 'POST',
          headers: authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ upload_token: token, offset, data: btoa(binary) })
        });
        const result = await json(chunkRes);
        offset = Number(result.next_offset || end);
        setStatus(`Uploading profile image… ${Math.round((offset / file.size) * 100)}%`, 'loading');
      }

      const statusRes = await fetch(`${API_ROOT}/api/books/upload-session/status`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ upload_token: token })
      });
      const status = await json(statusRes);
      if (!status.file?.file_id) throw new Error('Google Drive upload completed without a file ID.');
      uploadedMeta = {
        fileId: status.file.file_id,
        url: status.file.url || '',
        name: file.name,
        mimeType: file.type,
        size: file.size,
        localKey: `${file.name}:${file.size}:${file.lastModified}`
      };
      setStatus('Profile image uploaded. It will be saved with your seller record.', 'success');
      return uploadedMeta;
    })().finally(() => { uploadPromise = null; });

    return uploadPromise;
  }

  function injectUI() {
    const form = document.getElementById('seller-apply-form');
    if (!form || document.getElementById('seller-profile-image-field')) return false;
    const firstSection = form.querySelector('.seller-section');
    if (!firstSection) return false;
    const heading = firstSection.querySelector('.seller-section-heading');
    if (!heading) return false;

    const wrap = document.createElement('div');
    wrap.id = 'seller-profile-image-field';
    wrap.className = 'seller-profile-image-field';
    wrap.innerHTML = `
      <div class="seller-field">
        <label>Profile Image <span class="seller-profile-optional">(optional)</span></label>
        <div id="seller-profile-image-drop" class="seller-profile-image-drop" tabindex="0" role="button" aria-label="Upload profile image">
          <div class="seller-profile-image-preview-wrap">
            <img id="seller-profile-image-preview" alt="Profile preview" hidden>
            <div id="seller-profile-image-placeholder" class="seller-profile-image-placeholder">+</div>
          </div>
          <div class="seller-profile-image-copy">
            <strong>Drag & drop your profile image here</strong>
            <span>or click to browse • JPG, PNG, WebP • max 5 MB</span>
            <small id="seller-profile-image-status">Image will be securely stored in Google Drive.</small>
          </div>
          <button id="seller-profile-image-remove" type="button" hidden>Remove</button>
          <input id="seller-profile-image-input" type="file" accept="image/jpeg,image/png,image/webp" hidden>
        </div>
      </div>`;
    heading.insertAdjacentElement('afterend', wrap);

    const drop = document.getElementById('seller-profile-image-drop');
    const input = document.getElementById('seller-profile-image-input');
    const remove = document.getElementById('seller-profile-image-remove');
    const choose = file => {
      try {
        validateFile(file);
        selectedFile = file;
        uploadedMeta = null;
        renderPreview(null, file);
        setStatus('Image selected. It will upload to Google Drive when you submit.', 'info');
      } catch (error) {
        selectedFile = null;
        renderPreview(null, null);
        setStatus(error.message, 'error');
        Toast.show(error.message, 'warning');
      }
    };
    drop.addEventListener('click', event => { if (event.target !== remove) input.click(); });
    drop.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); input.click(); } });
    input.addEventListener('change', () => choose(input.files?.[0]));
    ['dragenter', 'dragover'].forEach(type => drop.addEventListener(type, event => { event.preventDefault(); drop.classList.add('is-dragging'); }));
    ['dragleave', 'drop'].forEach(type => drop.addEventListener(type, event => { event.preventDefault(); drop.classList.remove('is-dragging'); }));
    drop.addEventListener('drop', event => choose(event.dataTransfer?.files?.[0]));
    remove.addEventListener('click', event => {
      event.stopPropagation();
      selectedFile = null;
      uploadedMeta = null;
      input.value = '';
      renderPreview(null, null);
      setStatus('No profile image selected.', 'info');
    });
    return true;
  }

  async function loadExisting() {
    if (!state.token || !document.getElementById('seller-apply-form')) return;
    try {
      const res = await fetch(`${API_ROOT}/api/seller/application`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const app = data.application || {};
      const meta = app.profileImage || {};
      const url = meta.url || app.profileImageUrl || app.avatarUrl || '';
      const fileId = meta.fileId || app.profileImageFileId || app.profileImageDriveFileId || '';
      if (!url && !fileId) return;
      uploadedMeta = { fileId, url, name: meta.name || 'profile-image', mimeType: meta.mimeType || '', size: Number(meta.size || 0), localKey: '' };
      renderPreview(uploadedMeta, null);
      setStatus('Profile image loaded from your saved seller record.', 'success');
    } catch (error) {
      console.warn('Seller profile image load skipped:', error);
    }
  }

  function patchSellerApplyFetch() {
    if (window.__BOOKORA_PROFILE_IMAGE_FETCH_PATCHED__) return;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async function profileImageSellerApplyFetch(input, init = {}) {
      const url = typeof input === 'string' ? input : input?.url || '';
      if (!String(url).includes('/api/seller/apply') || !selectedFile) return originalFetch(input, init);
      let payload;
      try { payload = typeof init.body === 'string' ? JSON.parse(init.body) : null; } catch (_) { payload = null; }
      if (!payload) return originalFetch(input, init);
      try {
        const meta = await uploadToDrive(selectedFile);
        payload.profileImage = { fileId: meta.fileId, url: meta.url, name: meta.name, mimeType: meta.mimeType, size: meta.size, storage: 'google_drive' };
        payload.profileImageFileId = meta.fileId;
        payload.profileImageUrl = meta.url;
        payload.profileImageDriveFileId = meta.fileId;
        init = { ...init, body: JSON.stringify(payload), headers: authHeaders(init.headers || {}) };
      } catch (error) {
        Toast.show(error.message || 'Profile image upload failed. Application was not submitted.', 'error');
        throw error;
      }
      return originalFetch(input, init);
    };
    window.__BOOKORA_PROFILE_IMAGE_FETCH_PATCHED__ = true;
  }

  function addStyles() {
    if (document.getElementById('seller-profile-image-styles')) return;
    const style = document.createElement('style');
    style.id = 'seller-profile-image-styles';
    style.textContent = `
      .seller-profile-image-field{margin:0 0 1.25rem}
      .seller-profile-optional{font-weight:500;color:#64748b;font-size:.75rem}
      .seller-profile-image-drop{display:flex;align-items:center;gap:1rem;padding:1rem;border:1.5px dashed #cbd5e1;border-radius:14px;background:#f8fafc;cursor:pointer;transition:.18s ease}
      .seller-profile-image-drop:hover,.seller-profile-image-drop.is-dragging{border-color:var(--accent);background:#faf7ff}
      .seller-profile-image-preview-wrap{width:72px;height:72px;flex:none;border-radius:50%;overflow:hidden;border:1px solid #e2e8f0;background:#fff;display:grid;place-items:center}
      .seller-profile-image-preview-wrap img{width:100%;height:100%;object-fit:cover}
      .seller-profile-image-placeholder{font-size:2rem;color:#94a3b8;line-height:1}
      .seller-profile-image-copy{display:flex;flex-direction:column;gap:.2rem;min-width:0}
      .seller-profile-image-copy strong{color:#0f172a;font-size:.86rem}.seller-profile-image-copy span{color:#64748b;font-size:.74rem}.seller-profile-image-copy small{color:#64748b;font-size:.7rem}
      .seller-profile-image-copy small[data-kind="success"]{color:#047857}.seller-profile-image-copy small[data-kind="error"]{color:#b91c1c}
      #seller-profile-image-remove{margin-left:auto;border:0;background:transparent;color:#b91c1c;font-weight:700;cursor:pointer;padding:.5rem}
      @media(max-width:700px){.seller-profile-image-drop{align-items:flex-start;flex-wrap:wrap}.seller-profile-image-copy{flex:1 1 180px}#seller-profile-image-remove{margin-left:72px}}
    `;
    document.head.appendChild(style);
  }

  function boot() {
    addStyles();
    patchSellerApplyFetch();
    if (injectUI()) loadExisting();
  }

  const observer = new MutationObserver(() => {
    if (location.hash.includes('/seller/apply')) boot();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('hashchange', () => setTimeout(boot, 0));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
