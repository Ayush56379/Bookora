// Bookora Admin Sellers — Firebase-first click handler.
// Capture-phase interception prevents the old Render CORS request from running.
(() => {
  if (window.__BOOKORA_ADMIN_SELLER_CLICK_SYNC__) return;
  window.__BOOKORA_ADMIN_SELLER_CLICK_SYNC__ = true;
  const ADMIN_EMAIL = 'ayushprajpati6@gmail.com';
  let busy = false;

  const show = (message, type = 'success') => {
    try { window.Toast?.show?.(message, type); } catch (_) {}
    if (!window.Toast?.show) console.info('[Bookora seller]', message);
  };

  const moderate = async (sellerId, action, reason) => {
    const auth = window.firebase?.auth?.();
    const db = window.firebase?.firestore?.();
    const user = auth?.currentUser;
    if (!db || !user) throw new Error('Firebase authentication/database is not ready.');
    if (String(user.email || '').trim().toLowerCase() !== ADMIN_EMAIL) throw new Error('Administrator authorization required.');

    const ref = db.collection('sellers').doc(String(sellerId));
    const snap = await ref.get();
    if (!snap.exists) throw new Error('Seller application not found in Firebase.');
    const seller = snap.data() || {};
    const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'suspend' ? 'suspended' : null;
    if (!status) throw new Error('Invalid seller action.');
    if ((action === 'reject' || action === 'suspend') && String(reason || '').trim().length < 3) throw new Error('A reason is required.');

    const stamp = window.firebase.firestore.FieldValue.serverTimestamp();
    const patch = {
      status,
      seller_status: status,
      sellerStatus: status === 'approved' ? 'active' : 'inactive',
      access: status === 'approved' ? 'active' : 'inactive',
      reviewedAt: stamp,
      reviewedBy: user.email.toLowerCase(),
      updatedAt: stamp
    };
    if (status === 'approved') { patch.approvedAt = stamp; patch.rejectionReason = null; patch.suspensionReason = null; }
    if (status === 'rejected') { patch.rejectionReason = String(reason).trim(); patch.suspensionReason = null; }
    if (status === 'suspended') patch.suspensionReason = String(reason).trim();

    // Firebase is the authoritative operation. Render is never awaited.
    await ref.set(patch, { merge: true });

    // Sync the owner user record if it is available.
    const ids = [...new Set([seller.uid, seller.user_id, seller.userId, seller.firebaseUid].filter(Boolean).map(String))];
    await Promise.all(ids.map(id => db.collection('users').doc(id).set({
      seller_status: status,
      sellerStatus: status === 'approved' ? 'active' : 'inactive',
      role: status === 'approved' ? 'creator' : (status === 'rejected' ? 'buyer' : 'creator'),
      updatedAt: stamp
    }, { merge: true }).catch(() => null)));
    if (seller.email) {
      await db.collection('users').where('email', '==', String(seller.email).trim().toLowerCase()).limit(1).get().then(result => Promise.all(result.docs.map(doc => doc.ref.set({
        seller_status: status,
        sellerStatus: status === 'approved' ? 'active' : 'inactive',
        role: status === 'approved' ? 'creator' : (status === 'rejected' ? 'buyer' : 'creator'),
        updatedAt: stamp
      }, { merge: true })))).catch(() => null);
    }

    // Optional backend mirror. A CORS/network failure here cannot affect Firebase.
    try {
      const token = await user.getIdToken(false);
      fetch(`${window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com'}/api/admin/sellers/action`, {
        method: 'POST', keepalive: true,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sellerId: String(sellerId), action, reason })
      }).catch(() => null);
    } catch (_) {}
    return status;
  };

  document.addEventListener('click', async event => {
    const button = event.target?.closest?.('[data-seller-action]');
    if (!button || busy) return;
    const action = String(button.dataset.sellerAction || '').toLowerCase();
    if (!['approve', 'reject', 'suspend'].includes(action)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const sellerId = String(button.dataset.id || '').trim();
    if (!sellerId) { show('Seller ID is missing.', 'error'); return; }
    let reason = '';
    if (action === 'reject' || action === 'suspend') {
      reason = window.prompt(`Enter the reason to ${action} this seller:`) || '';
      if (reason.trim().length < 3) { show('A reason is required.', 'warning'); return; }
    } else if (!window.confirm('Approve this seller and activate seller access?')) return;

    busy = true;
    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = action === 'approve' ? 'Approving…' : action === 'reject' ? 'Rejecting…' : 'Suspending…';
    try {
      const status = await moderate(sellerId, action, reason);
      show(`Seller ${status}.`, 'success');
      // The page's Firestore onSnapshot will redraw the complete row.
      const row = button.closest('tr');
      if (row) {
        const badge = row.querySelector('.seller-status');
        const access = row.querySelector('[class*="seller-access-"]');
        if (badge) { badge.className = `seller-status seller-status-${status}`; badge.textContent = status.toUpperCase(); }
        if (access) { access.className = status === 'approved' ? 'seller-access-active' : 'seller-access-inactive'; access.textContent = status === 'approved' ? 'ACTIVE' : 'INACTIVE'; }
      }
    } catch (error) {
      console.error('[Bookora Admin Sellers] Firebase action failed:', error);
      show(error?.message || 'Firebase seller action failed.', 'error');
      button.disabled = false;
      button.textContent = oldText;
    } finally { busy = false; }
  }, true);

  console.info('[Bookora] Firebase-first seller click handler installed.');
})();
