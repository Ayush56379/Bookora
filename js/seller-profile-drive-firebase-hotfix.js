// Bookora seller profile image / Firebase save fallback.
// IMPORTANT: image bytes must go directly to the existing authenticated Drive
// upload flow. This fallback only persists returned Drive metadata in Firebase.
(() => {
  if (window.__BOOKORA_SELLER_PROFILE_DRIVE_FIREBASE_HOTFIX__) return;
  window.__BOOKORA_SELLER_PROFILE_DRIVE_FIREBASE_HOTFIX__ = true;

  const originalFetch = window.fetch.bind(window);
  const API_PATH = '/api/seller/application-progress';
  const SENSITIVE = new Set(['accountNumber', 'pan']);
  let pickerOpened = false;
  let previewUrl = '';

  const jsonResponse = payload => new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

  const getDbAndUser = () => {
    try {
      const auth = window.firebase?.auth?.();
      const db = window.firebase?.firestore?.();
      const user = auth?.currentUser;
      if (!db || !user) return null;
      return { db, user };
    } catch (_) { return null; }
  };

  const safeProgress = payload => {
    const out = { ...(payload || {}) };
    SENSITIVE.forEach(key => delete out[key]);
    return out;
  };

  async function writeProgress(payload) {
    const ctx = getDbAndUser();
    if (!ctx) throw new Error('Firebase authentication is not ready.');
    const ref = ctx.db.collection('sellers').doc(ctx.user.uid);
    const clean = safeProgress(payload);
    const now = window.firebase.firestore.FieldValue.serverTimestamp();
    const data = {
      ...clean,
      user_id: ctx.user.uid,
      uid: ctx.user.uid,
      firebaseUid: ctx.user.uid,
      email: clean.email || ctx.user.email || '',
      updatedAt: now,
      updated_at: now
    };
    if (!existingSafe(ref)) {
      data.status = 'draft';
      data.sellerStatus = 'inactive';
      data.createdAt = now;
    }
    await ref.set(data, { merge: true });
    return ref;
  }

  function existingSafe(ref) {
    // The caller previously checked existence. This helper intentionally keeps
    // the write path simple; actual existence is handled below.
    return true;
  }

  async function writeProgressSafe(payload) {
    const ctx = getDbAndUser();
    if (!ctx) throw new Error('Firebase authentication is not ready.');
    const ref = ctx.db.collection('sellers').doc(ctx.user.uid);
    const clean = safeProgress(payload);
    const existing = await ref.get();
    const now = window.firebase.firestore.FieldValue.serverTimestamp();
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
    return ref;
  }

  async function readProgress() {
    const ctx = getDbAndUser();
    if (!ctx) throw new Error('Firebase authentication is not ready.');
    const snap = await ctx.db.collection('sellers').doc(ctx.user.uid).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : {};
  }

  // Make the native file picker reliable. The upload itself remains the
  // existing SellerApplyQuickPage authenticated Drive upload listener.
  function bindProfilePicker() {
    const input = document.getElementById('profile-file');
    const browse = document.getElementById('profile-browse');
    const drop = document.getElementById('profile-drop');
    if (!input || !browse || !drop) return;
    if (browse.dataset.pickerFixed === '1') return;
    browse.dataset.pickerFixed = '1';

    browse.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      pickerOpened = true;
      try {
        if (typeof input.showPicker === 'function') input.showPicker();
        else input.click();
      } catch (_) { input.click(); }
    }, true);

    browse.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (pickerOpened) {
        pickerOpened = false;
        return;
      }
      try {
        if (typeof input.showPicker === 'function') input.showPicker();
        else input.click();
      } catch (_) { input.click(); }
    }, true);

    input.addEventListener('change', () => {
      pickerOpened = false;
      const file = input.files?.[0];
      if (!file) return;
      if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) return;
      const box = document.getElementById('profile-preview');
      if (!box) return;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(file);
      box.innerHTML = `<img src="${previewUrl}" alt="Profile image preview" loading="eager">`;
      const status = document.getElementById('profile-status');
      if (status) status.textContent = 'Image selected ✓ Uploading to Drive…';
    }, true);
  }

  function watchProfilePicker() {
    bindProfilePicker();
  }

  // Only application-progress is intercepted. Drive/file requests are left
  // completely untouched so the selected image uses the existing upload path.
  window.fetch = async function(input, init = {}) {
    let url = '';
    try { url = typeof input === 'string' ? input : String(input?.url || ''); } catch (_) {}
    if (!url.includes(API_PATH)) return originalFetch(input, init);
    const method = String(init?.method || input?.method || 'GET').toUpperCase();
    try {
      if (method === 'GET') return jsonResponse({ success: true, application: await readProgress() });
      if (method === 'POST') {
        let payload = {};
        try {
          const raw = init?.body ?? (input instanceof Request ? await input.clone().text() : '');
          payload = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
        } catch (_) {}
        await writeProgressSafe(payload);
        return jsonResponse({ success: true, firebase: true, application: payload });
      }
    } catch (error) {
      console.error('[Bookora seller Firebase fallback]', error);
      return new Response(JSON.stringify({ success: false, error: error.message || 'Firebase save failed' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    }
    return originalFetch(input, init);
  };

  const observer = new MutationObserver(watchProfilePicker);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('hashchange', () => setTimeout(watchProfilePicker, 50));
  [0, 100, 500, 1200, 2500].forEach(delay => setTimeout(watchProfilePicker, delay));
  console.log('[Bookora] Seller image picker fixed; existing direct-to-Drive upload preserved.');
})();