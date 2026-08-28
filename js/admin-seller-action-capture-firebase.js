// FINAL SAFETY NET: intercept Admin Seller moderation clicks at capture phase.
// This bypasses the Render /api/admin/sellers/action request entirely for the
// actual click, so a Render CORS/network failure cannot make Firebase approval fail.
(() => {
  if (window.__BOOKORA_ADMIN_SELLER_CAPTURE_FIREBASE__) return;
  window.__BOOKORA_ADMIN_SELLER_CAPTURE_FIREBASE__ = true;
  const ADMIN_EMAIL = 'ayushprajpati6@gmail.com';
  let busy = false;

  const toast = (message, type = 'success') => {
    try { window.Toast?.show?.(message, type); } catch (_) {}
    if (!window.Toast?.show) console.info('[Bookora seller]', message);
  };

  const getAdmin = async () => {
    const auth = window.firebase?.auth?.();
    const db = window.firebase?.firestore?.();
    if (!auth || !db) throw new Error('Firebase is still loading.');
    const user = auth.currentUser;
    if (!user?.email || user.email.trim().toLowerCase() !== ADMIN_EMAIL) throw new Error('Administrator authorization required.');
    return { user, db };
  };

  const moderate = async (sellerId, action, reason) => {
    const { user, db } = await getAdmin();
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

    // AUTHORITATIVE operation: wait only for Firestore, not Render.
    await ref.set(patch, { merge: true });

    // Align the application owner's user record when discoverable.
    const ids = [...new Set([seller.uid, seller.user_id, seller.userId, seller.firebaseUid].filter(Boolean).map(String))];
    await Promise.all(ids.map(id => db.collection('users').doc(id).set({
      seller_status: status,
      sellerStatus: status === 'approved' ? 'active' : 'inactive',
      role: status === 'approved' ? 'creator' : (status === 'rejected' ? 'buyer' : 'creator'),
      updatedAt: stamp
    }, { merge: true }).catch(() => null)));
    if (seller.email) {
      await db.collection('users').where('email', '==', String(seller.email).trim().toLowerCase()).limit(1).get().then(result =>
        Promise.all(result.docs.map(doc => doc.ref.set({
          seller_status: status,
          sellerStatus: status === 'approved' ? 'active' : 'inactive',
          role: status === 'approved' ? 'creator' : (status === 'rejected' ? 'buyer' : 'creator'),
          updatedAt: stamp
        }, { merge: true })))
      ).catch(() => null);
    }

    // Optional backend mirror after Firebase succeeds; never awaited.
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

    // Stop the old AdminSellersPage handler and its failing Render request.
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const sellerId = String(button.dataset.id || '').trim();
    if (!sellerId) { toast('Seller ID is missing.', 'error'); return; }
    let reason = '';
    if (action === 'reject' || action === 'suspend') {
      reason = window.prompt(`Enter the reason to ${action} this seller:`) || '';
      if (reason.trim().length < 3) { toast('A reason is required.', 'warning'); return; }
    } else if (!window.confirm('Approve this seller and activate seller access?')) return;

    busy = true;
    button.disabled = true;
    const oldText = button.textContent;
    button.textContent = action === 'approve' ? 'Approving…' : action === 'reject' ? 'Rejecting…' : 'Suspending…';
    try {
      const status = await moderate(sellerId, action, reason);
      // Update the row immediately; Firestore onSnapshot remains authoritative.
      const row = button.closest('tr');
      if (row) {
        const badge = row.querySelector('.seller-status');
        const access = row.querySelector('[class*="seller-access-"]');
        if (badge) { badge.className = `seller-status seller-status-${status}`; badge.textContent = status.toUpperCase(); }
        if (access) { access.className = status === 'approved' ? 'seller-access-active' : 'seller-access-inactive'; access.textContent = status === 'approved' ? 'ACTIVE' : 'INACTIVE'; }
      }
      toast(`Seller ${status}.`, 'success');
      // Let the existing Firestore listener redraw action buttons/counts.
      setTimeout(() => { try { button.closest('tr')?.querySelector('[data-seller-action]')?.focus(); } catch (_) {} }, 0);
    } catch (error) {
      console.error('[Bookora] Firebase seller moderation failed:', error);
      toast(error?.message || 'Firebase seller action failed.', 'error');
      button.disabled = false;
      button.textContent = oldText;
    } finally {
      busy = false;
    }
  }, true);

  console.info('[Bookora] Final Firebase seller action capture installed.');
})();
