// Bookora Admin Books: Firebase-first Reject + Remove actions.
// Keeps the existing table/edit UI intact. Only handles Reject/Remove clicks.
(() => {
  'use strict';
  if (window.__BOOKORA_ADMIN_BOOKS_ACTIONS_FIREBASE_FIRST__) return;
  window.__BOOKORA_ADMIN_BOOKS_ACTIONS_FIREBASE_FIRST__ = true;

  const isBooksRoute = () => String(location.hash || '').split('?')[0] === '#/admin/books';
  const getDb = () => {
    try { return window.firebase?.firestore ? window.firebase.firestore() : null; }
    catch (_) { return null; }
  };

  const waitForAuth = (timeout = 15000) => new Promise(resolve => {
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

  const getId = button => String(button?.dataset?.abId || button?.dataset?.abRemoveId || '').trim();

  const setBusy = (button, text) => {
    if (!button) return;
    button.disabled = true;
    button.dataset.bookoraActionBusy = '1';
    button.dataset.bookoraOriginalText = button.textContent || '';
    button.textContent = text;
  };

  const restoreButton = button => {
    if (!button) return;
    button.disabled = false;
    delete button.dataset.bookoraActionBusy;
    if (button.dataset.bookoraOriginalText) button.textContent = button.dataset.bookoraOriginalText;
  };

  const refreshRow = (button, status) => {
    const row = button?.closest?.('tr');
    if (!row) return;
    const cells = row.querySelectorAll('td');
    if (cells[4]) {
      cells[4].innerHTML = `<b style="color:${status === 'rejected' ? '#b91c1c' : '#64748b'}">${status.toUpperCase()}</b>`;
    }
    const actionCell = cells[6];
    if (actionCell) {
      actionCell.querySelectorAll('[data-ab-action],[data-ab-remove-id]').forEach(node => {
        if (node !== button) node.remove();
      });
      button.textContent = status === 'rejected' ? 'Rejected' : 'Removed';
      button.disabled = true;
    }
  };

  const updateStatus = async (button, status) => {
    if (!isBooksRoute() || button?.dataset?.bookoraActionBusy === '1') return;
    const id = getId(button);
    if (!id) return;
    const db = getDb();
    if (!db) { alert('Firebase is not ready. Please wait a moment and try again.'); return; }

    setBusy(button, status === 'rejected' ? 'Rejecting…' : 'Removing…');
    try {
      const user = await waitForAuth();
      if (!user) throw new Error('Administrator Firebase session is not ready. Please sign in again.');
      const now = new Date().toISOString();
      const patch = { status, updated_at: now, updatedAt: now };
      await db.collection('books').doc(id).update(patch);
      refreshRow(button, status);
      window.dispatchEvent(new CustomEvent('bookora:admin-book-status-updated', { detail: { id, status, patch } }));
    } catch (error) {
      console.error('[Bookora Admin Books Firebase action]', error);
      restoreButton(button);
      alert(error?.message || `Unable to ${status === 'rejected' ? 'reject' : 'remove'} this eBook.`);
    }
  };

  // Capture before legacy/delegated handlers so the Firebase write happens first.
  document.addEventListener('click', event => {
    if (!isBooksRoute()) return;
    const target = event.target?.closest?.('[data-ab-action],[data-ab-remove-id]');
    if (!target) return;
    const action = target.dataset.abAction;
    const status = action === 'rejected' ? 'rejected' : (target.dataset.abRemoveId ? 'removed' : '');
    if (!status) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void updateStatus(target, status);
  }, true);
})();
