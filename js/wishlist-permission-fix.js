// Bookora — Wishlist persistence bridge.
// Firebase Auth remains the identity authority. Wishlist writes/reads go through
// the authenticated Bookora backend, which owns the server-side Firestore write.
// This bridge is intentionally optimistic so the heart responds immediately.
import { state } from './state.js';
import { apiFetch } from './config.js';

const rerenderWishlist = () => {
  try {
    const path = String(window.location.hash || '#/').split('?')[0].replace(/^#/, '') || '/';
    if (path === '/wishlist') {
      const app = window.__BOOKORA_APP_INSTANCE__;
      if (app?.route) setTimeout(() => app.route(true, false), 0);
    }
  } catch (error) {
    console.warn('[Bookora Wishlist] UI refresh skipped:', error?.message || error);
  }
};

function extractWishlistIds(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload.map(item => typeof item === 'object' ? (item.bookId ?? item.book_id ?? item.id) : item).filter(Boolean).map(String);
  const candidates = [payload.bookIds, payload.book_ids, payload.wishlistIds, payload.wishlist_ids, payload.items, payload.wishlist, payload.data, payload.books];
  for (const value of candidates) {
    if (Array.isArray(value)) return value.map(item => typeof item === 'object' ? (item.bookId ?? item.book_id ?? item.id) : item).filter(Boolean).map(String);
  }
  return [];
}

async function loadWishlistFromBackend() {
  if (!state.isAuthenticated || !state.currentUser?.uid) return;
  const response = await apiFetch('/api/wishlist', { method: 'GET', cache: 'no-store' });
  if (!response.ok) throw new Error(`Wishlist GET HTTP ${response.status}`);
  const payload = await response.json();
  state.wishlist = new Set(extractWishlistIds(payload));
  state.notify('WISHLIST_SYNCED', { persistence: 'firebase-backend' });
  rerenderWishlist();
}

async function persistAdd(bookId) {
  const id = String(bookId);
  const attempts = [{ bookId: id }, { book_id: id }];
  let lastError = null;
  for (const body of attempts) {
    try {
      const response = await apiFetch('/api/wishlist', { method: 'POST', body: JSON.stringify(body) });
      if (response.ok) return true;
      lastError = new Error(`Wishlist POST HTTP ${response.status}`);
      if (![400, 404, 405, 422].includes(response.status)) break;
    } catch (error) { lastError = error; }
  }
  throw lastError || new Error('Wishlist add failed.');
}

async function persistRemove(bookId) {
  const response = await apiFetch(`/api/wishlist/${encodeURIComponent(String(bookId))}`, { method: 'DELETE' });
  if (response.ok || response.status === 204 || response.status === 404) return true;
  throw new Error(`Wishlist DELETE HTTP ${response.status}`);
}

function notifyChanged(bookId, isAdded) {
  try { state.notify('WISHLIST_UPDATED', { bookId, isAdded, persistence: 'firebase-backend' }); } catch (_) {}
  rerenderWishlist();
}

state.toggleWishlist = function(bookId) {
  const normalizedId = String(bookId || '').trim();
  if (!normalizedId) throw new Error('BOOK_ID_MISSING');
  if (!this.isAuthenticated || !this.currentUser?.uid) throw new Error('Please login first.');

  const isAdded = !this.wishlist.has(normalizedId);
  if (isAdded) this.wishlist.add(normalizedId);
  else this.wishlist.delete(normalizedId);
  notifyChanged(normalizedId, isAdded);

  // Persist in the background so the heart fills instantly and never waits on
  // network latency. If persistence fails, roll the in-memory state back.
  const persist = (async () => {
    if (isAdded) await persistAdd(normalizedId);
    else await persistRemove(normalizedId);
  })().catch(async error => {
    const stillSameIntent = this.wishlist.has(normalizedId) === isAdded;
    if (stillSameIntent) {
      if (isAdded) this.wishlist.delete(normalizedId);
      else this.wishlist.add(normalizedId);
      notifyChanged(normalizedId, !isAdded);
    }
    console.error('[Bookora Wishlist] persistence failed:', error);
    try {
      const { Toast } = await import('./components/Toast.js');
      Toast.show('Wishlist save failed. Please try again.', 'error');
    } catch (_) {}
  });
  this.__wishlistLastWrite = persist;
  return isAdded;
};

async function reconcile() {
  try { await loadWishlistFromBackend(); }
  catch (error) { console.warn('[Bookora Wishlist] Backend sync skipped:', error?.message || error); }
}

state.subscribe(event => {
  if (event === 'USER_LOGGED_IN' || event === 'AUTH_STATE_CHANGED' || event === 'DATA_SYNCED') reconcile();
  if (event === 'WISHLIST_UPDATED' || event === 'WISHLIST_SYNCED') rerenderWishlist();
});

reconcile();

if (!document.getElementById('bookora-wishlist-fill-style')) {
  const style = document.createElement('style');
  style.id = 'bookora-wishlist-fill-style';
  style.textContent = `
    .book-card .book-wishlist-btn.active{background:#E11D48!important;border-color:#E11D48!important;color:#fff!important;box-shadow:0 5px 14px rgba(225,29,72,.28)!important;transform:scale(1.04)}
    .book-card .book-wishlist-btn.active:hover{background:#BE123C!important;border-color:#BE123C!important;color:#fff!important}
    .bd-wish.active{background:#E11D48!important;border-color:#E11D48!important;color:#fff!important}
  `;
  document.head.appendChild(style);
}
