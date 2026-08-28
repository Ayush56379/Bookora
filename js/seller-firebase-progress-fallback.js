/* Bookora seller onboarding: Firebase-first progress fallback.
 * If the Render progress endpoint is temporarily unavailable or blocked by CORS,
 * keep Save & Continue working by checkpointing the non-sensitive onboarding data
 * directly in Firestore under sellers/{uid}. The normal backend path remains the
 * first choice, so this does not replace the server-side application flow.
 */
(() => {
  if (window.__BOOKORA_SELLER_FIREBASE_PROGRESS_FALLBACK__) return;
  window.__BOOKORA_SELLER_FIREBASE_PROGRESS_FALLBACK__ = true;

  const TARGET = '/api/seller/application-progress';
  const originalFetch = window.fetch.bind(window);

  const getAuthUser = async () => {
    try {
      const auth = window.firebase?.auth?.();
      if (!auth) return null;
      if (auth.currentUser) return auth.currentUser;
      return await new Promise(resolve => {
        let done = false;
        let unsubscribe = null;
        const finish = user => {
          if (done) return;
          done = true;
          try { unsubscribe?.(); } catch (_) {}
          clearTimeout(timer);
          resolve(user || null);
        };
        const timer = setTimeout(() => finish(auth.currentUser || null), 4000);
        try { unsubscribe = auth.onAuthStateChanged(finish); } catch (_) { finish(auth.currentUser || null); }
      });
    } catch (_) {
      return null;
    }
  };

  const fallback = async (input, init, method) => {
    const user = await getAuthUser();
    const uid = String(user?.uid || '').trim();
    const db = window.firebase?.firestore?.();
    if (!uid || !db) throw new Error('Firebase authentication/database is not ready.');

    const ref = db.collection('sellers').doc(uid);
    if (method === 'GET') {
      const snap = await ref.get();
      return new Response(JSON.stringify({
        success: true,
        application: snap.exists ? { uid, ...snap.data() } : null,
        source: 'firebase-fallback'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    let payload = {};
    try { payload = JSON.parse(String(init?.body || '{}')); } catch (_) {}

    // Progress checkpoints must never contain raw payout secrets.
    const blocked = new Set(['accountNumber', 'account_number', 'payout_account', 'bankAccount', 'pan', 'PAN', 'password', 'secret', 'accessToken', 'token']);
    const safe = {};
    Object.entries(payload || {}).forEach(([key, value]) => {
      if (!blocked.has(key)) safe[key] = value;
    });
    delete safe.step;
    safe.onboardingStep = Number(payload?.step || safe.onboardingStep || 1);
    safe.email = String(user.email || safe.email || '').trim().toLowerCase();
    safe.updatedAt = window.firebase.firestore.FieldValue.serverTimestamp();
    safe.progressSource = 'firebase-fallback';
    safe.uid = uid;

    await ref.set(safe, { merge: true });
    return new Response(JSON.stringify({
      success: true,
      application: { ...safe, uid },
      source: 'firebase-fallback'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  window.fetch = async function(input, init = {}) {
    const url = typeof input === 'string' ? input : String(input?.url || '');
    const path = (() => {
      try { return new URL(url, location.href).pathname; } catch (_) { return url.split('?')[0]; }
    })();
    const method = String(init?.method || (typeof input !== 'string' ? input?.method : 'GET') || 'GET').toUpperCase();

    if (path === TARGET && (method === 'GET' || method === 'POST')) {
      try {
        return await originalFetch(input, init);
      } catch (error) {
        console.warn('[Bookora seller] Render progress request failed; using Firebase checkpoint fallback.', error?.message || error);
        return fallback(input, init, method);
      }
    }
    return originalFetch(input, init);
  };
})();
