// Bookora seller profile image / Firebase save fallback.
// IMPORTANT: image bytes must go directly to the existing authenticated Drive
// upload flow. This fallback only persists returned Drive metadata in Firebase.
(() => {
  if (window.__BOOKORA_SELLER_PROFILE_DRIVE_FIREBASE_HOTFIX__) return;
  window.__BOOKORA_SELLER_PROFILE_DRIVE_FIREBASE_HOTFIX__ = true;

  const originalFetch = window.fetch.bind(window);
  const API_PATH = '/api/seller/application-progress';
  const SENSITIVE = new Set(['accountNumber', 'pan']);

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
    } catch (_) {
      return null;
    }
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

  // Only application-progress is intercepted. Drive/file requests are left
  // completely untouched so the selected, already-compressed image travels
  // directly from the browser to Drive without Firebase/Render as a middleman.
  window.fetch = async function(input, init = {}) {
    let url = '';
    try { url = typeof input === 'string' ? input : String(input?.url || ''); } catch (_) {}
    if (!url.includes(API_PATH)) return originalFetch(input, init);

    const method = String(init?.method || input?.method || 'GET').toUpperCase();
    try {
      if (method === 'GET') {
        return jsonResponse({ success: true, application: await readProgress() });
      }
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
      console.error('[Bookora seller Firebase fallback]', error);
      return new Response(JSON.stringify({ success: false, error: error.message || 'Firebase save failed' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return originalFetch(input, init);
  };

  console.log('[Bookora] Seller image: direct-to-Drive upload preserved; Firebase stores metadata only.');
})();
