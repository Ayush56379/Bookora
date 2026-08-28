// Bookora Admin Sellers — Firebase-first moderation actions.
// Approve/reject/suspend/reactivate write directly to the same Firestore
// `sellers` document used by the Admin Sellers realtime listener, so the
// decision is persisted immediately and the UI updates through onSnapshot.
(() => {
  if (window.__BOOKORA_ADMIN_SELLER_ACTIONS_FIREBASE_FIRST__) return;
  window.__BOOKORA_ADMIN_SELLER_ACTIONS_FIREBASE_FIRST__ = true;

  const ACTION_PATH = '/api/admin/sellers/action';
  const ADMIN_EMAIL = 'ayushprajpati6@gmail.com';
  const originalFetch = window.fetch.bind(window);

  const parseBody = init => {
    try { return JSON.parse(String(init?.body || '{}')); } catch (_) { return {}; }
  };

  const getFirebaseAdmin = async () => {
    const auth = window.firebase?.auth?.();
    const db = window.firebase?.firestore?.();
    if (!auth || !db) throw new Error('Firebase is still loading. Please try again.');
    const user = auth.currentUser || await new Promise(resolve => {
      let done = false;
      let unsubscribe = null;
      const finish = value => {
        if (done) return;
        done = true;
        try { unsubscribe?.(); } catch (_) {}
        clearTimeout(timer);
        resolve(value || null);
      };
      const timer = setTimeout(() => finish(auth.currentUser || null), 2500);
      try { unsubscribe = auth.onAuthStateChanged(finish); } catch (_) { finish(auth.currentUser || null); }
    });
    if (!user?.email || user.email.toLowerCase() !== ADMIN_EMAIL) {
      throw new Error('Administrator authorization required.');
    }
    return { user, db };
  };

  const now = () => window.firebase.firestore.FieldValue.serverTimestamp();

  const syncBackendBestEffort = async (input, init) => {
    try {
      const headers = new Headers(init?.headers || {});
      const auth = window.firebase?.auth?.();
      const user = auth?.currentUser;
      const token = await user?.getIdToken?.(false);
      if (token) headers.set('Authorization', `Bearer ${token}`);
      headers.set('Content-Type', 'application/json');
      const raw = typeof input === 'string' ? input : String(input?.url || '');
      const url = new URL(raw, location.href).toString();
      await originalFetch(url, { ...init, headers }).catch(() => null);
    } catch (_) {}
  };

  window.fetch = async function(input, init = {}) {
    const raw = typeof input === 'string' ? input : String(input?.url || '');
    let pathname = raw;
    try { pathname = new URL(raw, location.href).pathname; } catch (_) { pathname = raw.split('?')[0]; }
    const method = String(init?.method || (typeof input !== 'string' ? input?.method : 'GET') || 'GET').toUpperCase();

    if (pathname !== ACTION_PATH || method !== 'POST') {
      return originalFetch(input, init);
    }

    const payload = parseBody(init);
    const sellerId = String(payload.sellerId || payload.id || '').trim();
    const action = String(payload.action || '').trim().toLowerCase();
    const reason = String(payload.reason || '').trim();
    if (!sellerId) return new Response(JSON.stringify({ success: false, error: 'Seller ID is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    if (!['approve', 'reject', 'suspend'].includes(action)) return new Response(JSON.stringify({ success: false, error: 'Invalid seller action.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    if ((action === 'reject' || action === 'suspend') && reason.length < 3) return new Response(JSON.stringify({ success: false, error: 'A reason is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    try {
      const { user, db } = await getFirebaseAdmin();
      const ref = db.collection('sellers').doc(sellerId);
      const snap = await ref.get();
      if (!snap.exists) throw new Error('Seller application not found in Firebase.');
      const seller = snap.data() || {};
      const approved = action === 'approve';
      const status = approved ? 'approved' : action === 'reject' ? 'rejected' : 'suspended';
      const access = approved ? 'active' : 'inactive';

      const update = {
        status,
        sellerStatus: access,
        seller_status: status,
        access,
        reviewedAt: now(),
        reviewedBy: user.email.toLowerCase(),
        updatedAt: now()
      };
      if (approved) {
        update.approvedAt = now();
        update.rejectionReason = null;
        update.suspensionReason = null;
      } else if (action === 'reject') {
        update.rejectionReason = reason;
        update.suspensionReason = null;
      } else {
        update.suspensionReason = reason;
      }

      await ref.set(update, { merge: true });

      // Keep the Firebase users document aligned when a matching user document exists.
      // Missing/permission-denied user docs must not block the authoritative seller write.
      const userIds = [seller.uid, seller.user_id, seller.userId, seller.firebaseUid].filter(Boolean).map(String);
      const userWrites = [];
      for (const id of [...new Set(userIds)]) {
        userWrites.push(db.collection('users').doc(id).set({
          seller_status: status,
          sellerStatus: access,
          role: approved ? 'creator' : (status === 'rejected' ? 'buyer' : 'creator'),
          updatedAt: now()
        }, { merge: true }).catch(() => null));
      }
      if (seller.email) {
        userWrites.push(db.collection('users').where('email', '==', String(seller.email).trim().toLowerCase()).limit(1).get()
          .then(result => Promise.all(result.docs.map(doc => doc.ref.set({
            seller_status: status,
            sellerStatus: access,
            role: approved ? 'creator' : (status === 'rejected' ? 'buyer' : 'creator'),
            updatedAt: now()
          }, { merge: true }))).catch(() => null));
      }
      await Promise.all(userWrites);

      // Server sync is best-effort; Firebase remains the primary moderation store.
      void syncBackendBestEffort(input, init);

      return new Response(JSON.stringify({ success: true, status, source: 'firebase' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
      console.error('[Bookora Admin Sellers] Firebase action failed:', error);
      return new Response(JSON.stringify({ success: false, error: error?.message || 'Seller action failed in Firebase.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  };

  console.info('[Bookora] Firebase-first Admin seller actions installed.');
})();
