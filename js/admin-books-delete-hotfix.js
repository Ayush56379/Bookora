import { apiFetch, waitForAuthenticatedFirebaseUser } from './config.js';
import { state } from './state.js';
import { Toast } from './components/Toast.js';

let observerStarted = false;
let resolving = false;
let bookCache = [];

async function ensureAdminToken() {
  const firebaseUser = await waitForAuthenticatedFirebaseUser();
  if (!firebaseUser) throw new Error('Administrator Firebase session is not ready.');
  const firebaseToken = await firebaseUser.getIdToken(false);
  if (!firebaseToken) throw new Error('Administrator Firebase token is unavailable.');
  const current = String(state.token || '');
  if (current && !current.split('.')[0].includes('ey')) return current;
  const res = await apiFetch('/api/auth/firebase', {
    method: 'POST',
    headers: { Authorization: `Bearer ${firebaseToken}`, 'Content-Type': 'application/json' },
    body: '{}'
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success || !data.token || data.is_admin !== true) throw new Error(data.error || 'Admin session verification failed.');
  state.token = data.token;
  state.currentUser = data.user || state.currentUser;
  state.isAdmin = true;
  state.isAuthenticated = true;
  return data.token;
}

function key(book) {
  return [book.title || '', book.author || '', book.created_at || book.createdAt || ''].join('|').toLowerCase();
}

async function refreshCache() {
  if (resolving) return;
  resolving = true;
  try {
    const token = await ensureAdminToken();
    const res = await apiFetch('/api/admin/books', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json().catch(() => ({}));
    if (res.ok) bookCache = Array.isArray(data.books) ? data.books : [];
  } finally {
    resolving = false;
  }
}

function decorateRemovedRows() {
  const tbody = document.getElementById('ab-list');
  if (!tbody) return;
  [...tbody.querySelectorAll('tr')].forEach(row => {
    if (row.dataset.abDeleteDecorated === '1') return;
    const cells = row.querySelectorAll('td');
    if (cells.length < 7) return;
    const status = String(cells[4]?.textContent || '').trim().toLowerCase();
    if (status !== 'removed') return;
    const title = String(cells[0]?.querySelector('b')?.textContent || '').trim();
    const author = String(cells[0]?.querySelector('div')?.textContent || '').trim();
    const created = String(cells[5]?.textContent || '').trim();
    const book = bookCache.find(b => key(b) === [title, author, created].join('|').toLowerCase())
      || bookCache.find(b => String(b.title || '').trim() === title && String(b.author || '').trim() === author);
    if (!book?.id) return;
    const actions = cells[6];
    actions.querySelectorAll('[data-ab-delete-hotfix],[data-ab-restore-hotfix]').forEach(x => x.remove());
    const restore = document.createElement('button');
    restore.className = 'ab-btn';
    restore.style.cssText = 'background:#dcfce7;color:#166534';
    restore.textContent = 'Restore';
    restore.dataset.abRestoreHotfix = book.id;
    restore.title = 'Restore this eBook as approved';
    const del = document.createElement('button');
    del.className = 'ab-btn';
    del.style.cssText = 'background:#b91c1c;color:#fff';
    del.textContent = 'Delete';
    del.dataset.abDeleteHotfix = book.id;
    del.title = 'Permanently delete this eBook from Firebase and Bookora database';
    actions.append(restore, del);
    row.dataset.abDeleteDecorated = '1';
  });
}

async function handleDelete(id, button) {
  const book = bookCache.find(b => String(b.id) === String(id));
  if (!book) throw new Error('Book record could not be resolved. Refresh the page and try again.');
  if (!window.confirm(`Permanently delete "${book.title || 'this eBook'}"?\n\nThis will delete the book document from Firebase/Firestore and remove the same book from Bookora's database. This cannot be undone.`)) return;
  button.disabled = true;
  button.textContent = 'Deleting…';
  const token = await ensureAdminToken();
  const res = await apiFetch(`/api/admin/books/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.error || 'Permanent eBook deletion failed.');
  Toast.show('eBook permanently deleted from Firebase and Bookora.', 'success');
  window.dispatchEvent(new Event('hashchange'));
}

async function handleRestore(id, button) {
  button.disabled = true;
  button.textContent = 'Restoring…';
  const token = await ensureAdminToken();
  const res = await apiFetch(`/api/admin/books/${encodeURIComponent(id)}/status`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'approved' })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.error || 'Restore failed.');
  Toast.show('eBook restored and Firebase status set to approved.', 'success');
  window.dispatchEvent(new Event('hashchange'));
}

export function initAdminBooksDeleteHotfix() {
  if (observerStarted) return;
  observerStarted = true;
  const start = async () => {
    await refreshCache().catch(() => {});
    decorateRemovedRows();
    const tbody = document.getElementById('ab-list');
    if (tbody) {
      const observer = new MutationObserver(() => decorateRemovedRows());
      observer.observe(tbody, { childList: true, subtree: true });
    }
  };
  start();
  document.addEventListener('click', async event => {
    const deleteBtn = event.target instanceof Element ? event.target.closest('[data-ab-delete-hotfix]') : null;
    const restoreBtn = event.target instanceof Element ? event.target.closest('[data-ab-restore-hotfix]') : null;
    if (!deleteBtn && !restoreBtn) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try {
      if (deleteBtn) await handleDelete(deleteBtn.dataset.abDeleteHotfix, deleteBtn);
      else await handleRestore(restoreBtn.dataset.abRestoreHotfix, restoreBtn);
    } catch (error) {
      Toast.show(error?.message || 'Admin Books action failed.', 'error');
      if (deleteBtn) { deleteBtn.disabled = false; deleteBtn.textContent = 'Delete'; }
      if (restoreBtn) { restoreBtn.disabled = false; restoreBtn.textContent = 'Restore'; }
    }
  }, true);
}
