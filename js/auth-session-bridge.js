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

function hydrateFromFirebaseUser(firebaseUser) {
  if (!firebaseUser) return false;

  const cached = cachedProfile();
  const sameUser = !cached.uid || String(cached.uid) === String(firebaseUser.uid);
  const email = firebaseUser.email || (sameUser ? cached.email : '') || '';
  const isMasterAdmin = String(email).toLowerCase() === 'ayushprajpati6@gmail.com';
  const user = {
    ...(sameUser ? cached : {}),
    uid: firebaseUser.uid,
    email,
    name: (sameUser ? cached.name : '') || firebaseUser.displayName || email.split('@')[0] || 'Bookora User',
    photoURL: (sameUser ? cached.photoURL : '') || firebaseUser.photoURL || '',
    avatar: (sameUser ? cached.avatar : '') || firebaseUser.photoURL || '',
    role: isMasterAdmin ? 'admin' : ((sameUser ? cached.role : '') || 'buyer'),
    status: (sameUser ? cached.status : '') || 'active',
    seller_status: (sameUser ? cached.seller_status : '') || 'none',
    isMasterAdmin
  };

  state.currentUser = user;
  state.isAuthenticated = true;
  state.isAdmin = isMasterAdmin || user.role === 'admin' || user.isMasterAdmin === true;
  state.isSeller = state.isAdmin || user.seller_status === 'approved' || user.role === 'creator' || user.role === 'seller';
  state.activeMode = state.isAdmin ? 'admin' : state.isSeller ? 'seller' : 'buyer';

  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(user));
    localStorage.setItem('bookora_active_mode', state.activeMode);
  } catch (_) {}

  return true;
}

function hydrateNow() {
  try {
    const auth = window.firebase?.auth?.();
    const user = auth?.currentUser;
    return hydrateFromFirebaseUser(user);
  } catch (_) {
    return false;
  }
}

function install() {
  try {
    const auth = window.firebase?.auth?.();
    if (!auth) return false;

    // Important: hydrate synchronously before the SPA handles wishlist links.
    hydrateFromFirebaseUser(auth.currentUser);

    auth.onAuthStateChanged(firebaseUser => {
      if (firebaseUser) hydrateFromFirebaseUser(firebaseUser);
    });

    return true;
  } catch (error) {
    console.warn('[Bookora Auth Bridge] Firebase session bridge waiting:', error);
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
// so protected-route checks see the real Firebase session first.
window.addEventListener('hashchange', hydrateNow, { passive: true });

if (!install()) {
  let tries = 0;
  const timer = setInterval(() => {
    if (install() || ++tries >= 40) clearInterval(timer);
  }, 250);
}
