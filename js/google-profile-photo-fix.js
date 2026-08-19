// Bookora Google profile photo bridge.
// Firebase Auth is the source of truth for a Google account's profile image.
// Keep the image on the Bookora user object even if backend/Firestore user
// records do not yet contain an avatar field.
import { state } from './state.js';

(() => {
  'use strict';

  function applyGooglePhoto(firebaseUser) {
    const photoURL = String(firebaseUser?.photoURL || '').trim();
    if (!photoURL || !state.currentUser) return false;

    const sameAccount =
      String(state.currentUser.uid || '') === String(firebaseUser.uid || '') ||
      String(state.currentUser.email || '').toLowerCase() === String(firebaseUser.email || '').toLowerCase();

    if (!sameAccount) return false;

    const changed = state.currentUser.avatar !== photoURL || state.currentUser.photoURL !== photoURL;
    state.currentUser.avatar = photoURL;
    state.currentUser.photoURL = photoURL;

    try {
      localStorage.setItem('bookora_user_profile', JSON.stringify(state.currentUser));
    } catch (_) {}

    if (changed) state.notify('USER_PROFILE_PHOTO_UPDATED', state.currentUser);
    return changed;
  }

  function syncFromFirebase() {
    try {
      const auth = window.firebase?.auth?.();
      const firebaseUser = auth?.currentUser;
      if (firebaseUser) applyGooglePhoto(firebaseUser);
    } catch (_) {}
  }

  function install() {
    try {
      if (!window.firebase?.auth) return false;
      const auth = window.firebase.auth();
      auth.onAuthStateChanged(firebaseUser => {
        if (!firebaseUser) return;
        // Firebase has the Google photo immediately; wait a tick so the
        // backend-authenticated Bookora user object has also been created.
        setTimeout(() => applyGooglePhoto(firebaseUser), 0);
        setTimeout(() => applyGooglePhoto(firebaseUser), 500);
        setTimeout(() => applyGooglePhoto(firebaseUser), 1500);
      });
      syncFromFirebase();
      return true;
    } catch (error) {
      console.warn('Google profile photo bridge waiting:', error);
      return false;
    }
  }

  // The backend/Firebase sync can finish after this bridge. Re-apply the
  // Firebase photo whenever user data is refreshed so it cannot be replaced
  // by an empty backend avatar.
  state.subscribe(event => {
    if (event === 'USER_LOGGED_IN' || event === 'DATA_SYNCED' || event === 'USER_PROFILE_PHOTO_UPDATED') {
      setTimeout(syncFromFirebase, 0);
      setTimeout(syncFromFirebase, 300);
    }
  });

  if (!install()) {
    const timer = setInterval(() => {
      if (install()) clearInterval(timer);
    }, 500);
    setTimeout(() => clearInterval(timer), 15000);
  }
})();
