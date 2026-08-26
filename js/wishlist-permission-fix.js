// Bookora — Wishlist persistence bridge.
// Firebase Auth remains the identity authority. Wishlist writes/reads go through
// the authenticated Bookora backend, which owns the server-side Firestore write.
// This avoids browser Firestore permission failures while keeping Firebase data
// as the persistent source of truth.
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

async function addWishlist(bookId) {
  const id = String(bookId);
  const attempts = [
    { bookId: id },
    { book_id: id }
  ];
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

async function removeWishlist(bookId) {
  const response = await apiFetch(`/api/wishlist/${encodeURIComponent(String(bookId))}`, { method: 'DELETE' });
  if (response.ok || response.status === 204 || response.status === 404) return true;
  throw new Error(`Wishlist DELETE HTTP ${response.status}`);
}

state.toggleWishlist = async function(bookId) {
  const normalizedId = String(bookId || '').trim();
  if (!normalizedId) throw new Error('BOOK_ID_MISSING');
  if (!this.isAuthenticated || !this.currentUser?.uid) throw new Error('Please login first.');

  const isAdded = !this.wishlist.has(normalizedId);
  if (isAdded) await addWishlist(normalizedId);
  else await removeWishlist(normalizedId);

  // Optimistic in-memory state is updated only after the server confirms the
  // operation. The server authenticates with Firebase and persists the record.
  if (isAdded) this.wishlist.add(normalizedId);
  else this.wishlist.delete(normalizedId);
  this.notify('WISHLIST_UPDATED', {
    bookId: normalizedId,
    isAdded,
    persistence: 'firebase-backend'
  });
  rerenderWishlist();
  return isAdded;
};

async function reconcile() {
  try {
    await loadWishlistFromBackend();
  } catch (error) {
    console.warn('[Bookora Wishlist] Backend sync skipped:', error?.message || error);
  }
}

state.subscribe(event => {
  if (event === 'USER_LOGGED_IN' || event === 'AUTH_STATE_CHANGED' || event === 'DATA_SYNCED') reconcile();
  if (event === 'WISHLIST_UPDATED' || event === 'WISHLIST_SYNCED') rerenderWishlist();
});

reconcile();
