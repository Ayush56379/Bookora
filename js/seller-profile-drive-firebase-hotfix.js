// Bookora seller profile image: fast direct Firebase Storage upload.
// Profile-image bytes bypass the Render/Drive proxy for a much faster upload.
(() => {
  if (window.__BOOKORA_SELLER_PROFILE_FAST_FIREBASE__) return;
  window.__BOOKORA_SELLER_PROFILE_FAST_FIREBASE__ = true;

  const originalFetch = window.fetch.bind(window);
  const API_PROGRESS = '/api/seller/application-progress';
  const API_UPLOAD_START = '/api/books/upload-session/start';
  const API_UPLOAD_CHUNK = '/api/books/upload-session/chunk';
  const API_UPLOAD_STATUS = '/api/books/upload-session/status';
  const SENSITIVE = new Set(['accountNumber', 'pan']);
  const sessions = new Map();
  let previewUrl = '';
  let pickerOpened = false;

  const jsonResponse = (payload, status = 200) => new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

  const getCtx = () => {
    try {
      const auth = window.firebase?.auth?.();
      const db = window.firebase?.firestore?.();
      const storage = window.firebase?.storage?.();
      const user = auth?.currentUser;
      if (!user || !db || !storage) return null;
      return { auth, db, storage, user };
    } catch (_) { return null; }
  };

  const safeProgress = payload => {
    const out = { ...(payload || {}) };
    SENSITIVE.forEach(key => delete out[key]);
    return out;
  };

  async function writeProgress(payload) {
    const ctx = getCtx();
    if (!ctx) throw new Error('Firebase authentication is not ready.');
    const ref = ctx.db.collection('sellers').doc(ctx.user.uid);
    const clean = safeProgress(payload);
    const now = window.firebase.firestore.FieldValue.serverTimestamp();
    const existing = await ref.get();
    const data = {
      ...clean,
      user_id: ctx.user.uid,
      uid: ctx.user.uid,
      firebaseUid: ctx.user.uid,
      email: clean.email || ctx.user.email || '',
      updatedAt: now,
      updated_at: now
    };
    if (!existing.exists) {
      data.status = 'draft';
      data.sellerStatus = 'inactive';
      data.createdAt = now;
    }
    await ref.set(data, { merge: true });
  }

  async function readProgress() {
    const ctx = getCtx();
    if (!ctx) throw new Error('Firebase authentication is not ready.');
    const snap = await ctx.db.collection('sellers').doc(ctx.user.uid).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : {};
  }

  async function optimize(file) {
    if (!file || file.size <= 1024 * 1024) return file;
    try {
      const bitmap = await createImageBitmap(file);
      const maxSide = 1600;
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close?.();
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82));
      if (!blob || blob.size >= file.size) return file;
      return new File([blob], file.name.replace(/\.[^.]+$/i, '.jpg'), { type: 'image/jpeg', lastModified: Date.now() });
    } catch (_) { return file; }
  }

  async function directFirebaseUpload(file) {
    const ctx = getCtx();
    if (!ctx) throw new Error('Firebase Storage is not ready. Please wait a moment and try again.');
    const optimized = await optimize(file);
    if (optimized.size > 5 * 1024 * 1024) throw new Error('Profile image must be 5 MB or smaller.');
    const safeName = optimized.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80) || 'profile.jpg';
    const randomId = (crypto.randomUUID && crypto.randomUUID()) || Math.random().toString(36).slice(2);
    const path = `seller-profiles/${ctx.user.uid}/${Date.now()}-${randomId}-${safeName}`;
    const ref = ctx.storage.ref().child(path);
    const task = ref.put(optimized, { contentType: optimized.type, customMetadata: { uid: ctx.user.uid, kind: 'seller-profile' } });
    const result = await new Promise((resolve, reject) => {
      task.on('state_changed', snap => {
        const pct = snap.totalBytes ? Math.round((snap.bytesTransferred / snap.totalBytes) * 100) : 0;
        const status = document.getElementById('profile-status');
        if (status) status.textContent = `Uploading profile image… ${pct}%`;
      }, reject, async () => {
        try { resolve(await task.snapshot.ref.getDownloadURL()); } catch (e) { reject(e); }
      });
    });
    return { url: result, id: path, size: optimized.size };
  }

  async function interceptUploadStart(init) {
    let body = {};
    try { body = JSON.parse(String(init?.body || '{}')); } catch (_) {}
    if (String(body.kind || '').toLowerCase() !== 'profile') return null;
    const input = document.getElementById('profile-file');
    const file = input?.files?.[0];
    if (!file) return jsonResponse({ success: false, error: 'Profile image file is no longer available. Please choose it again.' }, 400);
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return jsonResponse({ success: false, error: 'Profile image must be 5 MB or smaller.' }, 413);
    const token = `firebase-profile-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const uploadPromise = directFirebaseUpload(file);
    sessions.set(token, { promise: uploadPromise, size: Number(body.size || file.size) });
    return jsonResponse({ success: true, upload_token: token, chunk_size: Math.max(256 * 1024, Number(body.size || file.size)), next_offset: 0 });
  }

  async function interceptUploadChunk(init) {
    let body = {};
    try { body = JSON.parse(String(init?.body || '{}')); } catch (_) {}
    const token = String(body.upload_token || '');
    const session = sessions.get(token);
    if (!session) return null;
    try {
      const file = await session.promise;
      sessions.delete(token);
      return jsonResponse({ success: true, done: true, next_offset: session.size, uploaded_bytes: session.size, total_bytes: session.size, file: { url: file.url, id: file.id, fileUrl: file.url, fileId: file.id } });
    } catch (error) {
      sessions.delete(token);
      return jsonResponse({ success: false, error: error?.message || 'Profile image upload failed.' }, 500);
    }
  }

  async function interceptStatus(init) {
    let body = {};
    try { body = JSON.parse(String(init?.body || '{}')); } catch (_) {}
    const token = String(body.upload_token || '');
    const session = sessions.get(token);
    if (!session) return null;
    return jsonResponse({ success: true, done: false, next_offset: 0, file: null });
  }

  window.fetch = async function(input, init = {}) {
    let url = '';
    try { url = typeof input === 'string' ? input : String(input?.url || ''); } catch (_) {}
    const method = String(init?.method || input?.method || 'GET').toUpperCase();
    if (url.includes(API_UPLOAD_START) && method === 'POST') {
      const response = await interceptUploadStart(init);
      if (response) return response;
    }
    if (url.includes(API_UPLOAD_CHUNK) && method === 'POST') {
      const response = await interceptUploadChunk(init);
      if (response) return response;
    }
    if (url.includes(API_UPLOAD_STATUS) && method === 'POST') {
      const response = await interceptStatus(init);
      if (response) return response;
    }
    if (!url.includes(API_PROGRESS)) return originalFetch(input, init);
    try {
      if (method === 'GET') return jsonResponse({ success: true, application: await readProgress() });
      if (method === 'POST') {
        let payload = {};
        try {
          const raw = init?.body ?? (input instanceof Request ? await input.clone().text() : '');
          payload = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
        } catch (_) {}
        await writeProgress(payload);
        return jsonResponse({ success: true, firebase: true, application: payload });
      }
    } catch (error) {
      console.error('[Bookora seller Firebase progress fallback]', error);
      return jsonResponse({ success: false, error: error?.message || 'Firebase save failed' }, 503);
    }
    return originalFetch(input, init);
  };

  function bindPicker() {
    const input = document.getElementById('profile-file');
    const browse = document.getElementById('profile-browse');
    const drop = document.getElementById('profile-drop');
    if (!input || !browse || !drop || browse.dataset.fastPicker === '1') return;
    browse.dataset.fastPicker = '1';
    browse.addEventListener('pointerdown', event => {
      event.preventDefault(); event.stopPropagation(); pickerOpened = true;
      try { if (typeof input.showPicker === 'function') input.showPicker(); else input.click(); } catch (_) { input.click(); }
    }, true);
    browse.addEventListener('click', event => {
      event.preventDefault(); event.stopImmediatePropagation();
      if (pickerOpened) { pickerOpened = false; return; }
      try { if (typeof input.showPicker === 'function') input.showPicker(); else input.click(); } catch (_) { input.click(); }
    }, true);
    input.addEventListener('change', () => {
      pickerOpened = false;
      const file = input.files?.[0];
      if (!file) return;
      if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) return;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(file);
      const box = document.getElementById('profile-preview');
      if (box) box.innerHTML = `<img src="${previewUrl}" alt="Profile image preview" loading="eager">`;
      const status = document.getElementById('profile-status');
      if (status) status.textContent = 'Image selected ✓ Starting fast Firebase upload…';
    }, true);
  }

  const observer = new MutationObserver(bindPicker);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  [0, 100, 500, 1200, 2500].forEach(delay => setTimeout(bindPicker, delay));
  window.addEventListener('hashchange', () => setTimeout(bindPicker, 50));
  console.log('[Bookora] Fast seller profile Firebase upload installed.');
})();
