// Prevent the legacy Firebase -> Render auth exchange from running during
// normal SPA identity hydration. Protected PDF actions still create a backend
// session explicitly inside purchase-access-runtime.js.
import { state } from './state.js';

const original = state.resolveBookoraUser.bind(state);

state.resolveBookoraUser = async function (firebaseUser, db) {
  if (!firebaseUser) return null;
  const email = String(firebaseUser.email || '').trim();
  const normalizedEmail = email.toLowerCase();
  let profile = {};
  let source = '';

  try {
    const cached = this.currentUser || JSON.parse(localStorage.getItem('bookora_user_profile') || '{}');
    if (cached && String(cached.firebaseUid || cached.uid || '') === String(firebaseUser.uid)) {
      profile = { ...cached };
      source = 'cached-profile';
    }
  } catch (_) {}

  const addDoc = (snapshot, label) => {
    if (!snapshot?.exists) return false;
    profile = { ...(snapshot.data() || {}), id: snapshot.id, ...profile };
    source = label;
    return true;
  };

  if (!profile.bookoraUserId) {
    try { addDoc(await db.collection('users').doc(firebaseUser.uid).get(), 'users/firebase-uid'); } catch (_) {}
  }

  if (!profile.bookoraUserId) {
    for (const field of ['firebaseUid', 'firebase_uid', 'uid', 'auth_uid', 'authUid']) {
      try {
        const snap = await db.collection('users').where(field, '==', firebaseUser.uid).limit(1).get();
        if (!snap.empty) { addDoc(snap.docs[0], `users/${field}`); break; }
      } catch (_) {}
    }
  }

  if (!profile.bookoraUserId && email) {
    try {
      const snap = await db.collection('users').where('email', '==', email).limit(5).get();
      const match = snap.docs.find(doc => String(doc.data()?.email || '').trim().toLowerCase() === normalizedEmail);
      if (match) addDoc(match, 'users/email');
    } catch (_) {}
  }

  const bookoraUserId = String(
    profile.bookoraUserId || profile.userId || profile.user_id || profile.bookora_user_id || profile.id || ''
  ).trim();

  console.log('[Auth Hotfix] Firebase UID:', firebaseUser.uid);
  console.log('[Auth Hotfix] Firebase email:', email);
  console.log('[Auth Hotfix] Resolved Bookora user ID:', bookoraUserId || '(missing)');
  console.log('[Auth Hotfix] Identity source:', source || '(not found)');

  // Keep the original method available for debugging/rollback, but do not call
  // it here because it contains the legacy /api/auth/firebase exchange.
  state._legacyResolveBookoraUser = original;

  return {
    ...profile,
    uid: firebaseUser.uid,
    firebaseUid: firebaseUser.uid,
    email: email || profile.email || '',
    bookoraUserId: bookoraUserId || null
  };
};

console.info('[Auth Hotfix] Legacy /api/auth/firebase identity fallback disabled during SPA hydration.');
