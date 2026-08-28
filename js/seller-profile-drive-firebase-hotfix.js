// Bookora seller profile image / Firebase hotfix.
// The profile image is uploaded through the existing authenticated Drive upload
// session. After Drive returns the file URL/ID, seller application progress is
// persisted directly to the seller Firestore document so a Render CORS failure
// cannot break the image-selection flow.
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
    // Never mirror raw payout credentials into Firestore from this client-side
    // fallback. The protected backend remains authoritative for those fields.
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

  console.log('[Bookora] Seller profile Drive → Firebase fallback enabled.');
})();
