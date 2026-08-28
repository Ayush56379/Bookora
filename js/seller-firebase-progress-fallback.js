/* Bookora seller onboarding: Firebase-first progress persistence.
 * Save & Continue must never wait on the Render backend. Firestore is the
 * primary checkpoint store for onboarding; Render synchronization is best-effort
 * in the background. This keeps the UI fast and removes CORS/network stalls.
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
        const timer = setTimeout(() => finish(auth.currentUser || null), 3000);
        try { unsubscribe = auth.onAuthStateChanged(finish); } catch (_) { finish(auth.currentUser || null); }
      });
    } catch (_) {
      return null;
    }
  };

  const withTimeout = (promise, ms) => Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase checkpoint timeout')), ms))
  ]);

  const parsePayload = init => {
    try { return JSON.parse(String(init?.body || '{}')); } catch (_) { return {}; }
  };

  const sanitize = (payload, user) => {
    const blocked = new Set([
      'accountNumber', 'account_number', 'payout_account', 'bankAccount',
      'pan', 'PAN', 'password', 'secret', 'accessToken', 'token'
    ]);
    const safe = {};
    Object.entries(payload || {}).forEach(([key, value]) => {
      if (!blocked.has(key)) safe[key] = value;
    });
    const step = Number(payload?.step || safe.onboardingStep || 1);
    delete safe.step;
    safe.onboardingStep = Number.isFinite(step) && step > 0 ? step : 1;
    safe.email = String(user?.email || safe.email || '').trim().toLowerCase();
    safe.uid = String(user?.uid || '').trim();
    safe.updatedAt = window.firebase.firestore.FieldValue.serverTimestamp();
    safe.progressSource = 'firebase';
    return safe;
  };

  const syncRenderInBackground = (input, init) => {
    try {
      const headers = new Headers(init?.headers || {});
      headers.set('Accept', 'application/json');
      void originalFetch(input, { ...init, headers }).catch(error => {
        console.info('[Bookora seller] Background Render sync skipped:', error?.message || error);
      });
    } catch (_) {}
  };

  const firebaseFirst = async (input, init, method) => {
    const user = await getAuthUser();
    const uid = String(user?.uid || '').trim();
    const db = window.firebase?.firestore?.();
    if (!uid || !db) throw new Error('Firebase authentication/database is not ready.');

    const ref = db.collection('sellers').doc(uid);

    if (method === 'GET') {
      const snap = await withTimeout(ref.get(), 5000);
      return new Response(JSON.stringify({
        success: true,
        application: snap.exists ? { uid, ...snap.data() } : null,
        source: 'firebase'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const payload = parsePayload(init);
    const safe = sanitize(payload, user);

    // Firestore is the authoritative fast checkpoint. Wait for this write,
    // then immediately release the UI. Do not await Render/CORS synchronization.
    await withTimeout(ref.set(safe, { merge: true }), 5000);

    // Keep the existing backend/database synchronized without making the seller
    // wait for Render cold-starts, CORS, or network failures.
    syncRenderInBackground(input, init);

    return new Response(JSON.stringify({
      success: true,
      application: { ...safe, uid },
      source: 'firebase'
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
        // Firebase-first: Save & Continue is never blocked by Render.
        return await firebaseFirst(input, init, method);
      } catch (error) {
        console.warn('[Bookora seller] Firebase-first checkpoint failed; trying Render once.', error?.message || error);
        try {
          return await originalFetch(input, init);
        } catch (renderError) {
          throw new Error('Seller progress could not be saved. Please check Firebase login/network and retry.');
        }
      }
    }
    return originalFetch(input, init);
  };
})();
