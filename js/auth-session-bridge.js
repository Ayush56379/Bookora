// Bookora authentication session bridge.
// Keeps the SPA state aligned with the real Firebase session before any
// wishlist click or protected-route navigation is processed.
import { state } from './state.js';

const PROFILE_KEY = 'bookora_user_profile';
let resolveAuthReady;
let authReadyResolved = false;
window.BookoraAuthReady = window.BookoraAuthReady || new Promise(resolve => { resolveAuthReady = resolve; });

function markAuthReady(firebaseUser) {
  if (authReadyResolved) return;
  authReadyResolved = true;
  try { resolveAuthReady?.(firebaseUser || null); } catch (_) {}
}

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
    bookoraUserId: user.bookoraUserId || user.userId || user.user_id || user.id || null,
    firebaseUid: user.firebaseUid || user.uid,
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

async function hydrateFromFirebaseUser(firebaseUser) {
  if (!firebaseUser) return false;
  const cached = cachedProfile();
  const sameUser = !cached.uid || String(cached.uid) === String(firebaseUser.uid);
  let mapped = {
    ...(sameUser ? cached : {}),
    uid: firebaseUser.uid,
    email: firebaseUser.email || (sameUser ? cached.email : '') || '',
    name: (sameUser ? cached.name : '') || firebaseUser.displayName || '',
    photoURL: (sameUser ? cached.photoURL : '') || firebaseUser.photoURL || '',
    avatar: (sameUser ? cached.avatar : '') || firebaseUser.photoURL || ''
  };

  // Resolve the canonical Bookora internal ID from the existing users record.
  // This does not create or mutate a second user record.
  try {
    const db = window.firebase?.firestore?.();
    if (db) {
      let snapshot = await db.collection('users').doc(firebaseUser.uid).get();
      if (!snapshot.exists && firebaseUser.email) {
        const byEmail = await db.collection('users').where('email', '==', String(firebaseUser.email).trim().toLowerCase()).limit(1).get();
        if (!byEmail.empty) snapshot = byEmail.docs[0];
      }
      if (snapshot.exists) {
        const profile = snapshot.data() || {};
        mapped = {
          ...mapped,
          ...profile,
          uid: firebaseUser.uid,
          email: firebaseUser.email || profile.email || mapped.email,
          bookoraUserId: profile.bookoraUserId || profile.userId || profile.user_id || profile.id || mapped.bookoraUserId || null,
          firebaseUid: firebaseUser.uid
        };
      }
    }
  } catch (error) {
    console.warn('[Bookora Auth Bridge] Bookora user mapping skipped:', error?.message || error);
  }

  const applied = applyUser(mapped);
  if (applied) {
    console.log('[Library] Firebase UID:', firebaseUser.uid);
    console.log('[Library] Firebase email:', firebaseUser.email || '');
    console.log('[Library] Resolved Bookora user ID:', state.currentUser?.bookoraUserId || '(missing)');
  }
  markAuthReady(firebaseUser);
  return applied;
}

function hydrateFromCachedProfile() {
  const cached = cachedProfile();
  return cached.uid ? applyUser(cached) : false;
}

function hydrateNow() {
  try {
    const auth = window.firebase?.auth?.();
    if (auth?.currentUser) {
      void hydrateFromFirebaseUser(auth.currentUser);
      return true;
    }
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

    hydrateNow();

    auth.onAuthStateChanged(firebaseUser => {
      if (firebaseUser) {
        void hydrateFromFirebaseUser(firebaseUser);
      } else {
        markAuthReady(null);
        if (!state.currentUser) hydrateFromCachedProfile();
      }
    });

    return true;
  } catch (error) {
    console.warn('[Bookora Auth Bridge] Firebase session bridge waiting:', error);
    hydrateFromCachedProfile();
    return false;
  }
}

document.addEventListener('click', event => {
  const element = event.target instanceof Element ? event.target : null;
  if (!element) return;
  if (element.closest('.book-wishlist-btn') || element.closest('a[href="#/wishlist"]')) hydrateNow();
}, true);

window.addEventListener('hashchange', hydrateNow, { passive: true });

if (!install()) {
  let tries = 0;
  const timer = setInterval(() => {
    if (install() || ++tries >= 40) {
      if (tries >= 40 && !authReadyResolved) markAuthReady(window.firebase?.auth?.()?.currentUser || null);
      clearInterval(timer);
    }
  }, 250);
}
