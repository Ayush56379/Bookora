// Bookora authentication session bridge.
// Keeps the SPA state aligned with the real Firebase session before any
// wishlist click or protected-route navigation is processed.
// Library identity is resolved directly from Firebase/Firestore; it does not
// depend on the Render /api/auth/firebase exchange.
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
    bookoraUserId: user.bookoraUserId || user.userId || user.user_id || user.bookora_user_id || user.id || null,
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

async function getFirebaseClaimedIdentity(firebaseUser) {
  try {
    const result = await firebaseUser.getIdTokenResult(false);
    const claims = result?.claims || {};
    return {
      bookoraUserId: claims.bookoraUserId || claims.bookora_user_id || claims.userId || claims.user_id || '',
      role: claims.role || '',
      claims
    };
  } catch (_) {
    return { bookoraUserId: '', role: '', claims: {} };
  }
}

async function resolveLibraryIdentity(db, firebaseUser, mapped) {
  const candidates = [];
  const addCandidate = value => {
    const id = String(value || '').trim();
    if (id && !candidates.includes(id)) candidates.push(id);
  };

  addCandidate(mapped.bookoraUserId);
  addCandidate(mapped.userId);
  addCandidate(mapped.user_id);
  addCandidate(mapped.bookora_user_id);
  addCandidate(mapped.id);
  addCandidate(firebaseUser.uid);

  // First, use any candidate that actually owns an active Firestore library
  // entitlement. This handles legacy accounts where the users document ID,
  // Bookora user ID and Firebase UID are different values.
  for (const candidate of candidates) {
    try {
      const snapshot = await db.collection('library').where('userId', '==', candidate).limit(1).get();
      if (!snapshot.empty) {
        const record = snapshot.docs[0].data() || {};
        if (String(record.accessStatus || 'active').toLowerCase() === 'active') {
          return candidate;
        }
      }
    } catch (error) {
      console.warn('[Bookora Auth Bridge] Library identity candidate lookup skipped:', error?.message || error);
    }
  }

  // Some newer entitlement records also carry Firebase identity fields. Use
  // those as a direct bridge when available.
  const identityQueries = [
    ['firebaseUid', firebaseUser.uid],
    ['uid', firebaseUser.uid],
    ['email', String(firebaseUser.email || '').trim().toLowerCase()]
  ];

  for (const [field, value] of identityQueries) {
    if (!value) continue;
    try {
      const snapshot = await db.collection('library').where(field, '==', value).limit(1).get();
      if (!snapshot.empty) {
        const record = snapshot.docs[0].data() || {};
        const userId = String(record.userId || record.bookoraUserId || record.user_id || '').trim();
        if (userId && String(record.accessStatus || 'active').toLowerCase() === 'active') return userId;
      }
    } catch (error) {
      console.warn(`[Bookora Auth Bridge] Library ${field} lookup skipped:`, error?.message || error);
    }
  }

  return mapped.bookoraUserId || '';
}

async function hydrateFromFirebaseUser(firebaseUser) {
  if (!firebaseUser) return false;
  const cached = cachedProfile();
  const sameUser = !cached.uid || String(cached.uid) === String(firebaseUser.uid);
  const claimed = await getFirebaseClaimedIdentity(firebaseUser);
  let mapped = {
    ...(sameUser ? cached : {}),
    uid: firebaseUser.uid,
    email: firebaseUser.email || (sameUser ? cached.email : '') || '',
    name: (sameUser ? cached.name : '') || firebaseUser.displayName || '',
    photoURL: (sameUser ? cached.photoURL : '') || firebaseUser.photoURL || '',
    avatar: (sameUser ? cached.avatar : '') || firebaseUser.photoURL || '',
    bookoraUserId: claimed.bookoraUserId || (sameUser ? cached.bookoraUserId : '') || '',
    role: claimed.role || (sameUser ? cached.role : '') || ''
  };

  // Resolve the canonical Bookora internal ID from the existing users record.
  // This does not create or mutate a second user record.
  try {
    const db = window.firebase?.firestore?.();
    if (db) {
      let snapshot = await db.collection('users').doc(firebaseUser.uid).get();
      if (!snapshot.exists && firebaseUser.email) {
        const normalizedEmail = String(firebaseUser.email).trim().toLowerCase();
        try {
          const byEmail = await db.collection('users').where('email', '==', normalizedEmail).limit(1).get();
          if (!byEmail.empty) snapshot = byEmail.docs[0];
        } catch (_) {}
      }

      if (snapshot.exists) {
        const profile = snapshot.data() || {};
        mapped = {
          ...mapped,
          ...profile,
          uid: firebaseUser.uid,
          email: firebaseUser.email || profile.email || mapped.email,
          bookoraUserId: profile.bookoraUserId || profile.userId || profile.user_id || profile.bookora_user_id || profile.id || mapped.bookoraUserId || null,
          firebaseUid: firebaseUser.uid
        };
      }

      // Legacy Firestore user records may have generated document IDs. Try the
      // explicit Firebase identity fields before falling back to email scanning.
      if (!mapped.bookoraUserId) {
        for (const field of ['firebaseUid', 'uid']) {
          try {
            const byFirebaseUid = await db.collection('users').where(field, '==', firebaseUser.uid).limit(1).get();
            if (!byFirebaseUid.empty) {
              const profile = byFirebaseUid.docs[0].data() || {};
              mapped = {
                ...mapped,
                ...profile,
                uid: firebaseUser.uid,
                email: firebaseUser.email || profile.email || mapped.email,
                bookoraUserId: profile.bookoraUserId || profile.userId || profile.user_id || profile.bookora_user_id || profile.id || byFirebaseUid.docs[0].id,
                firebaseUid: firebaseUser.uid
              };
              break;
            }
          } catch (_) {}
        }
      }

      if (!mapped.bookoraUserId && firebaseUser.email) {
        try {
          const allUsers = await db.collection('users').limit(100).get();
          const normalizedEmail = String(firebaseUser.email).trim().toLowerCase();
          const match = allUsers.docs.find(doc => String(doc.data()?.email || '').trim().toLowerCase() === normalizedEmail);
          if (match) {
            const profile = match.data() || {};
            mapped = {
              ...mapped,
              ...profile,
              uid: firebaseUser.uid,
              email: firebaseUser.email || profile.email || mapped.email,
              bookoraUserId: profile.bookoraUserId || profile.userId || profile.user_id || profile.bookora_user_id || profile.id || match.id,
              firebaseUid: firebaseUser.uid
            };
          }
        } catch (_) {}
      }

      // Final identity bridge for Library: use the identifier that actually
      // owns a Firestore library entitlement. No Render/API authentication
      // exchange is used here.
      const libraryUserId = await resolveLibraryIdentity(db, firebaseUser, mapped);
      if (libraryUserId) mapped.bookoraUserId = libraryUserId;
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
