// Bookora Admin Books: Firebase-first Approve action.
// Only intercepts Approve clicks on the Admin Books page. Existing UI and
// Reject/Remove handlers remain untouched.
(() => {
  'use strict';
  if (window.__BOOKORA_ADMIN_BOOKS_APPROVE_FIREBASE_FIRST__) return;
  window.__BOOKORA_ADMIN_BOOKS_APPROVE_FIREBASE_FIRST__ = true;

  const API = window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com';
  const ADMIN_EMAIL = 'ayushprajpati6@gmail.com';
  const isBooksRoute = () => String(location.hash || '').split('?')[0] === '#/admin/books';

  const waitForAuth = (timeout = 7000) => new Promise(resolve => {
    const auth = window.firebase?.auth?.();
    if (!auth) return resolve(null);
    if (auth.currentUser) return resolve(auth.currentUser);
    let done = false;
    let unsubscribe = null;
    const finish = user => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { unsubscribe?.(); } catch (_) {}
      resolve(user || null);
    };
    const timer = setTimeout(() => finish(auth.currentUser || null), timeout);
    try { unsubscribe = auth.onAuthStateChanged(finish); } catch (_) { finish(auth.currentUser || null); }
  });

  const getId = button => String(button?.dataset?.abId || '').trim();
  const setBusy = (button, text) => {
    button.disabled = true;
    button.dataset.bookoraApproveBusy = '1';
    button.dataset.bookoraOriginalText = button.textContent || '';
    button.textContent = text;
  };
  const restore = button => {
    button.disabled = false;
    delete button.dataset.bookoraApproveBusy;
    if (button.dataset.bookoraOriginalText) button.textContent = button.dataset.bookoraOriginalText;
  };

  const updateRow = (button, book) => {
    const row = button.closest('tr');
    if (!row) return;
    const cells = row.querySelectorAll('td');
    if (cells[4]) cells[4].innerHTML = '<b style="color:#15803d">APPROVED</b>';
    const actionCell = cells[6];
    if (actionCell) {
      actionCell.querySelectorAll('[data-ab-action]').forEach(node => node.remove());
      const remove = actionCell.querySelector('[data-ab-remove-id]');
      if (remove) remove.disabled = false;
    }
    button.textContent = 'Approved';
    button.disabled = true;
    window.dispatchEvent(new CustomEvent('bookora:admin-book-status-updated', {
      detail: { id: getId(button), status: 'approved', book: book || null }
    }));
  };

  const firebaseFallback = async (id, user) => {
    const db = window.firebase?.firestore?.();
    if (!db) throw new Error('Firebase is not ready. Please wait a moment and try again.');
    const now = new Date().toISOString();
    await db.collection('books').doc(id).update({
      status: 'approved',
      removed: false,
      updatedAt: now,
      updated_at: now,
      restoredAt: now,
      adminUpdatedBy: String(user.email || ADMIN_EMAIL).toLowerCase()
    });
    return { id, status: 'approved', updatedAt: now, updated_at: now, removed: false };
  };

  const approve = async button => {
    if (!isBooksRoute() || button.dataset.bookoraApproveBusy === '1') return;
    const id = getId(button);
    if (!id) return;
    setBusy(button, 'Approving…');
    try {
      const user = await waitForAuth();
      const email = String(user?.email || '').trim().toLowerCase();
      if (!user || email !== ADMIN_EMAIL) throw new Error('Administrator Firebase session is not ready. Please sign in again.');

      let book = null;
      let serverWorked = false;
      try {
        // Directly send the Firebase ID token to the already server-verified
        // Admin Books endpoint. This avoids the separate /api/auth/firebase
        // session-exchange step that was timing out.
        const token = await user.getIdToken(false);
        if (!token) throw new Error('Firebase administrator token is unavailable.');
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6000);
        try {
          const response = await fetch(`${API}/api/admin/books/${encodeURIComponent(id)}/status`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify({ status: 'approved' }),
            cache: 'no-store',
            signal: controller.signal
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok || !data?.success) throw new Error(data?.error || `Approve failed (${response.status}).`);
          book = data.book || null;
          serverWorked = true;
        } finally {
          clearTimeout(timer);
        }
      } catch (serverError) {
        console.warn('[Bookora Admin Books] direct server approve fallback:', serverError?.message || serverError);
      }

      if (!serverWorked) book = await firebaseFallback(id, user);
      updateRow(button, book);

      // Keep the visible counters immediately consistent without triggering the
      // old server-session refresh path.
      const pending = document.getElementById('ab-pending');
      const approved = document.getElementById('ab-approved');
      if (pending) pending.textContent = String(Math.max(0, Number(pending.textContent || 0) - 1));
      if (approved) approved.textContent = String(Number(approved.textContent || 0) + 1);

      try {
        const toast = window.Toast;
        if (toast?.show) toast.show('Book approved successfully.', 'success');
      } catch (_) {}
    } catch (error) {
      console.error('[Bookora Admin Books Approve]', error);
      restore(button);
      alert(error?.message || 'Unable to approve this eBook.');
    }
  };

  // Capture phase runs before the existing delegated click handler, so the
  // broken session-exchange path is not invoked for Approve.
  document.addEventListener('click', event => {
    if (!isBooksRoute()) return;
    const button = event.target?.closest?.('[data-ab-action="approved"]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void approve(button);
  }, true);
})();
