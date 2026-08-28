// Bookora seller profile image: use the authenticated Bookora account photo directly.
// No Drive or Storage upload is required for seller onboarding profile images.
(() => {
  if (window.__BOOKORA_SELLER_PROFILE_ACCOUNT_PHOTO__) return;
  window.__BOOKORA_SELLER_PROFILE_ACCOUNT_PHOTO__ = true;

  const originalFetch = window.fetch.bind(window);
  const API_PROGRESS = '/api/seller/application-progress';
  const SENSITIVE = new Set(['accountNumber', 'pan']);

  const jsonResponse = (payload, status = 200) => new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

  const getCtx = () => {
    try {
      const auth = window.firebase?.auth?.();
      const db = window.firebase?.firestore?.();
      const user = auth?.currentUser;
      if (!user || !db) return null;
      return { auth, db, user };
    } catch (_) { return null; }
  };

  const accountPhoto = ctx => String(ctx?.user?.photoURL || '').trim();

  const safeProgress = payload => {
    const out = { ...(payload || {}) };
    SENSITIVE.forEach(key => delete out[key]);
    const ctx = getCtx();
    if (!out.profileImageUrl && accountPhoto(ctx)) out.profileImageUrl = accountPhoto(ctx);
    out.profileImageSource = 'bookora-account';
    return out;
  };

  async function writeProgress(payload) {
    const ctx = getCtx();
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
  }

  async function readProgress() {
    const ctx = getCtx();
    if (!ctx) throw new Error('Firebase authentication is not ready.');
    const snap = await ctx.db.collection('sellers').doc(ctx.user.uid).get();
    const application = snap.exists ? { id: snap.id, ...snap.data() } : {};
    if (!application.profileImageUrl && accountPhoto(ctx)) {
      application.profileImageUrl = accountPhoto(ctx);
      application.profileImageSource = 'bookora-account';
    }
    return application;
  }

  // Only seller application progress is intercepted. All other Bookora APIs,
  // including ebook uploads, continue through their existing code paths.
  window.fetch = async function(input, init = {}) {
    let url = '';
    try { url = typeof input === 'string' ? input : String(input?.url || ''); } catch (_) {}
    if (!url.includes(API_PROGRESS)) return originalFetch(input, init);
    const method = String(init?.method || input?.method || 'GET').toUpperCase();
    try {
      if (method === 'GET') return jsonResponse({ success: true, application: await readProgress() });
      if (method === 'POST') {
        let payload = {};
        try {
          const raw = init?.body ?? (input instanceof Request ? await input.clone().text() : '');
          payload = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
        } catch (_) {}
        const clean = safeProgress(payload);
        await writeProgress(clean);
        return jsonResponse({ success: true, firebase: true, application: clean });
      }
    } catch (error) {
      console.error('[Bookora seller Firebase progress]', error);
      return jsonResponse({ success: false, error: error?.message || 'Firebase save failed' }, 503);
    }
    return originalFetch(input, init);
  };

  function applyAccountPhotoUI() {
    const ctx = getCtx();
    const photo = accountPhoto(ctx);
    const input = document.getElementById('profile-file');
    const browse = document.getElementById('profile-browse');
    const drop = document.getElementById('profile-drop');
    const preview = document.getElementById('profile-preview');
    const status = document.getElementById('profile-status');
    if (!drop || !preview) return;

    // No picker: the seller's existing Bookora account photo is reused.
    if (input) input.style.display = 'none';
    if (browse) browse.style.display = 'none';
    drop.style.cursor = 'default';
    drop.setAttribute('data-account-photo', 'true');

    if (photo) {
      const safe = photo.replace(/\"/g, '&quot;');
      preview.innerHTML = `<img src="${safe}" alt="Bookora profile photo" loading="eager">`;
      if (status) status.textContent = 'Using your Bookora account profile photo ✓';
    } else if (status) {
      status.textContent = 'No separate profile upload is required.';
    }

    if (drop.dataset.accountPhotoGuard !== '1') {
      drop.dataset.accountPhotoGuard = '1';
      const blockPicker = event => {
        event.preventDefault();
        event.stopImmediatePropagation();
      };
      drop.addEventListener('click', blockPicker, true);
      drop.addEventListener('pointerdown', blockPicker, true);
    }
  }

  const observer = new MutationObserver(applyAccountPhotoUI);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('hashchange', () => setTimeout(applyAccountPhotoUI, 50));
  [0, 50, 150, 400, 1000, 2000].forEach(delay => setTimeout(applyAccountPhotoUI, delay));
  console.log('[Bookora] Seller profile uses the authenticated Bookora account photo directly.');
})();
