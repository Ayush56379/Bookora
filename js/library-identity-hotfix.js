// Bookora library identity hotfix.
// Resolves legacy user-document IDs by verifying them against an active
// Firestore library entitlement. It never trusts an ID without entitlement.
(function () {
  'use strict';

  const PROFILE_KEY = 'bookora_user_profile';

  function saveProfile(patch) {
    try {
      const current = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
      const next = { ...current, ...patch };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
      return next;
    } catch (_) { return null; }
  }

  function active(record) {
    return String(record?.accessStatus || record?.access_status || 'active').trim().toLowerCase() === 'active';
  }

  async function hasEntitlement(db, id) {
    const value = String(id || '').trim();
    if (!value) return null;
    for (const field of ['userId', 'bookoraUserId', 'bookora_user_id', 'user_id']) {
      try {
        const snap = await db.collection('library').where(field, '==', value).get();
        const records = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(active);
        if (records.length) return { id: value, field, records };
      } catch (error) {
        console.debug('[Library Identity Hotfix] entitlement lookup skipped:', field, error?.message || error);
      }
    }
    return null;
  }

  async function resolve() {
    const auth = window.firebase?.auth?.();
    const db = window.firebase?.firestore?.();
    const user = auth?.currentUser;
    if (!user || !db) return;

    const candidates = [];
    const add = (id, source) => {
      const value = String(id || '').trim();
      if (value && !candidates.some(x => x.id === value)) candidates.push({ id: value, source });
    };

    try {
      const cached = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
      add(cached.bookoraUserId, 'cached.bookoraUserId');
      add(cached.userId, 'cached.userId');
      add(cached.user_id, 'cached.user_id');
      add(cached.id, 'cached.id');
    } catch (_) {}

    // Firebase UID can itself be the Bookora ID in newer records.
    add(user.uid, 'firebase.uid');

    const docs = [];
    const push = (doc, source) => { if (doc?.exists) docs.push({ doc, source }); };

    try { push(await db.collection('users').doc(user.uid).get(), 'users/firebase-uid'); } catch (_) {}
    for (const field of ['firebaseUid', 'firebase_uid', 'uid', 'auth_uid', 'authUid']) {
      try {
        const snap = await db.collection('users').where(field, '==', user.uid).limit(5).get();
        snap.forEach(doc => push(doc, `users/${field}`));
      } catch (_) {}
    }
    if (user.email) {
      try {
        const snap = await db.collection('users').where('email', '==', user.email).limit(10).get();
        snap.forEach(doc => push(doc, 'users/email'));
      } catch (_) {}
    }

    for (const item of docs) {
      const data = item.doc.data() || {};
      add(data.bookoraUserId, `${item.source}:bookoraUserId`);
      add(data.bookora_user_id, `${item.source}:bookora_user_id`);
      add(data.userId, `${item.source}:userId`);
      add(data.user_id, `${item.source}:user_id`);
      // IMPORTANT: generated/legacy document IDs are valid candidates too.
      // We verify them against the library entitlement before using them.
      add(item.doc.id, `${item.source}:docId`);
    }

    console.info('[Library Identity Hotfix] candidates:', candidates);
    for (const candidate of candidates) {
      const match = await hasEntitlement(db, candidate.id);
      if (!match) continue;
      const profile = saveProfile({
        uid: user.uid,
        firebaseUid: user.uid,
        email: user.email || '',
        bookoraUserId: match.id,
        libraryIdentitySource: candidate.source,
        libraryQueryField: match.field
      });
      console.info('[Library Identity Hotfix] verified:', match.id, 'via', candidate.source, 'field', match.field);
      try {
        const state = window.BookoraStateInstance;
        if (state) state.currentUser = { ...(state.currentUser || {}), ...(profile || {}), bookoraUserId: match.id, uid: user.uid, firebaseUid: user.uid };
      } catch (_) {}
      return;
    }

    console.warn('[Library Identity Hotfix] no active entitlement matched the signed-in account.');
  }

  function start() {
    const auth = window.firebase?.auth?.();
    if (!auth) return setTimeout(start, 500);
    void resolve();
    auth.onAuthStateChanged(user => { if (user) void resolve(); });
  }

  start();
})();
