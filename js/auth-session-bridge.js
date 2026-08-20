// Bookora authentication session bridge.
// Keeps the SPA state aligned with the real Firebase session before any
// wishlist click or protected-route navigation is processed.
import { state } from './state.js';

const PROFILE_KEY = 'bookora_user_profile';

function cachedProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw || raw === 'undefined') return {};
    const value = JSON.parse(raw);
    return value && typeof value === 'object' ? value : {};
  } catch (_) {
    return {};
  }
}

function applyUser(user) {
  if (!user || !user.uid) return false;
  const email = String(user.email || '').trim();
  const isMasterAdmin = email.toLowerCase() === 'ayushprajpati6@gmail.com';

  state.currentUser = {
    ...user,
    email,
    name: user.name || email.split('@')[0] || 'Bookora User',
    photoURL: user.photoURL || user.avatar || '',
    avatar: user.avatar || user.photoURL || '',
    role: isMasterAdmin ? 'admin' : (user.role || 'buyer'),
    status: user.status || 'active',
    seller_status: user.seller_status || 'none',
    isMasterAdmin
  };
  state.isAuthenticated = true;
  state.isAdmin = isMasterAdmin || state.currentUser.role === 'admin' || state.currentUser.isMasterAdmin === true;
  state.isSeller = state.isAdmin || state.currentUser.seller_status === 'approved' || state.currentUser.role === 'creator' || state.currentUser.role === 'seller';
  state.activeMode = state.isAdmin ? 'admin' : state.isSeller ? 'seller' : 'buyer';

  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(state.currentUser));
    localStorage.setItem('bookora_active_mode', state.activeMode);
  } catch (_) {}
  return true;
}

function hydrateFromFirebaseUser(firebaseUser) {
  if (!firebaseUser) return false;
  const cached = cachedProfile();
  const sameUser = !cached.uid || String(cached.uid) === String(firebaseUser.uid);
  return applyUser({
    ...(sameUser ? cached : {}),
    uid: firebaseUser.uid,
    email: firebaseUser.email || (sameUser ? cached.email : '') || '',
    name: (sameUser ? cached.name : '') || firebaseUser.displayName || '',
    photoURL: (sameUser ? cached.photoURL : '') || firebaseUser.photoURL || '',
    avatar: (sameUser ? cached.avatar : '') || firebaseUser.photoURL || ''
  });
}

function hydrateFromCachedProfile() {
  const cached = cachedProfile();
  // Logout removes this key, so a remaining valid profile represents the
  // existing Bookora session when Firebase is restoring slowly/unavailable.
  return cached.uid ? applyUser(cached) : false;
}

function hydrateNow() {
  try {
    const auth = window.firebase?.auth?.();
    if (auth?.currentUser && hydrateFromFirebaseUser(auth.currentUser)) return true;
  } catch (_) {}
  return hydrateFromCachedProfile();
}

function install() {
  try {
    const auth = window.firebase?.auth?.();
    if (!auth) {
      hydrateFromCachedProfile();
      return false;
    }

    // Important: hydrate synchronously before the SPA handles wishlist links.
    hydrateNow();

    auth.onAuthStateChanged(firebaseUser => {
      if (firebaseUser) hydrateFromFirebaseUser(firebaseUser);
      else if (!state.currentUser) hydrateFromCachedProfile();
    });

    return true;
  } catch (error) {
    console.warn('[Bookora Auth Bridge] Firebase session bridge waiting:', error);
    hydrateFromCachedProfile();
    return false;
  }
}

// Capture phase runs before app.js's document click handler.
document.addEventListener('click', event => {
  const element = event.target instanceof Element ? event.target : null;
  if (!element) return;
  if (element.closest('.book-wishlist-btn') || element.closest('a[href="#/wishlist"]')) {
    hydrateNow();
  }
}, true);

// This listener is intentionally installed before app.js through index.html,
// so protected-route checks see the real Firebase/session state first.
window.addEventListener('hashchange', hydrateNow, { passive: true });

if (!install()) {
  let tries = 0;
  const timer = setInterval(() => {
    if (install() || ++tries >= 40) clearInterval(timer);
  }, 250);
}
