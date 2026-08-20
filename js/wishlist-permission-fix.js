// Bookora wishlist resilience fix.
// Firestore rules can temporarily reject the client-side wishlist document.
// Keep the wishlist interaction usable with a per-account local fallback instead
// of surfacing a raw "Missing or insufficient permissions" error to the buyer.
import { state } from './state.js';

const PREFIX = 'bookora_wishlist_v1:';

function storageKey() {
  const uid = String(state.currentUser?.uid || '').trim();
  return uid ? PREFIX + uid : '';
}

function readLocal() {
  const key = storageKey();
  if (!key) return new Set();
  try {
    const raw = localStorage.getItem(key);
    const ids = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(ids) ? ids.map(String).filter(Boolean) : []);
  } catch (_) {
    return new Set();
  }
}

function writeLocal(ids) {
  const key = storageKey();
  if (!key) return;
  try { localStorage.setItem(key, JSON.stringify([...ids])); }
  catch (_) { /* storage can be unavailable in private/restricted browsers */ }
}

function hydrate() {
  if (!state.isAuthenticated || !state.currentUser?.uid) return;
  const local = readLocal();
  if (!local.size) return;
  local.forEach(id => state.wishlist.add(id));
}

const originalToggle = state.toggleWishlist.bind(state);

state.toggleWishlist = async function(bookId) {
  const normalizedId = String(bookId || '').trim();
  if (!normalizedId) throw new Error('BOOK_ID_MISSING');
  if (!this.isAuthenticated || !this.currentUser?.uid) throw new Error('Please login first.');

  const local = readLocal();
  try {
    const result = await originalToggle(normalizedId);
    const next = new Set(local);
    if (result) next.add(normalizedId); else next.delete(normalizedId);
    writeLocal(next);
    return result;
  } catch (error) {
    const message = String(error?.message || error || '');
    const permissionDenied = /permission|insufficient|unauthenticated|missing or insufficient/i.test(message);
    if (!permissionDenied) throw error;

    const next = new Set(local);
    const wasAdded = !next.has(normalizedId);
    if (wasAdded) next.add(normalizedId); else next.delete(normalizedId);
    writeLocal(next);

    if (wasAdded) this.wishlist.add(normalizedId);
    else this.wishlist.delete(normalizedId);
    this.notify('WISHLIST_UPDATED', {
      bookId: normalizedId,
      isAdded: wasAdded,
      persistence: 'local-fallback'
    });
    console.warn('[Bookora Wishlist] Firestore permission denied; using local account fallback.');
    return wasAdded;
  }
};

state.subscribe(event => {
  if (event === 'USER_LOGGED_IN' || event === 'AUTH_STATE_CHANGED' || event === 'DATA_SYNCED') hydrate();
});

hydrate();
