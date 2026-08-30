// Bookora Admin Books: Firebase-first Reject + Remove actions.
// Keeps the existing table/edit UI intact. Only handles Reject/Remove clicks.
(() => {
  'use strict';
  if (window.__BOOKORA_ADMIN_BOOKS_ACTIONS_FIREBASE_FIRST__) return;
  window.__BOOKORA_ADMIN_BOOKS_ACTIONS_FIREBASE_FIRST__ = true;

  const PROJECT_ID = 'bookora-676bf';
  const isBooksRoute = () => String(location.hash || '').split('?')[0] === '#/admin/books';
  const getDb = () => {
    try { return window.firebase?.firestore ? window.firebase.firestore() : null; }
    catch (_) { return null; }
  };

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

  const getCachedIdToken = async user => {
    // Firebase Auth can report auth/network-request-failed while its cached
    // session is still usable. Prefer the locally held access token first so
    // the Firestore REST fallback does not trigger another auth refresh.
    const cached = String(user?.stsTokenManager?.accessToken || '').trim();
    if (cached) return cached;
    try { return String(await user.getIdToken(false) || '').trim(); } catch (_) { return ''; }
  };

  const restUpdate = async (id, patch, user) => {
    const token = await getCachedIdToken(user);
    if (!token) throw new Error('Firebase administrator token is unavailable. Please sign in again.');
    const url = new URL(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/books/${encodeURIComponent(id)}`);
    Object.keys(patch).forEach(field => url.searchParams.append('updateMask.fieldPaths', field));
    const body = { fields: {} };
    for (const [field, value] of Object.entries(patch)) {
      body.fields[field] = { stringValue: String(value) };
    }
    const response = await fetch(url.toString(), {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.error?.message || `Firestore update failed (${response.status}).`);
    }
  };

  const updateStatus = async (button, status) => {
    if (!isBooksRoute() || button?.dataset?.bookoraActionBusy === '1') return;
    const id = getId(button);
    if (!id) return;
    const db = getDb();
    if (!db) { alert('Firebase is not ready. Please wait a moment and try again.'); return; }

    setBusy(button, status === 'rejected' ? 'Rejecting…' : 'Removing…');
    const user = await waitForAuth();
    if (!user) {
      restoreButton(button);
      alert('Administrator Firebase session is not ready. Please sign in again.');
      return;
    }

    const now = new Date().toISOString();
    const patch = { status, updated_at: now, updatedAt: now };
    try {
      try {
        await db.collection('books').doc(id).update(patch);
      } catch (primaryError) {
        const code = String(primaryError?.code || '').toLowerCase();
        // If the SDK auth channel is the part that failed, retry the exact same
        // Firebase document update through Firestore's REST API with the cached
        // Firebase ID token. This still enforces the Firestore security rules.
        if (code === 'auth/network-request-failed' || code.includes('network-request-failed') || code === 'unavailable') {
          await restUpdate(id, patch, user);
        } else {
          throw primaryError;
        }
      }
      refreshRow(button, status);
      window.dispatchEvent(new CustomEvent('bookora:admin-book-status-updated', { detail: { id, status, patch } }));
    } catch (error) {
      console.error('[Bookora Admin Books Firebase action]', error);
      restoreButton(button);
      alert(error?.message || `Unable to ${status === 'rejected' ? 'reject' : 'remove'} this eBook.`);
    }
  };

  // Capture before legacy/delegated handlers so only this Firebase-first action
  // executes for Reject/Remove clicks.
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
