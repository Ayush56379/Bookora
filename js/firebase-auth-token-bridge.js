// Bookora Firebase identity bridge.
// IMPORTANT: Firebase ID tokens and Bookora backend session tokens are different.
// Never place a Firebase ID token into state.token because protected Render APIs
// expect the Bookora session token returned by /api/auth/firebase.
import { state } from './state.js';

async function getFirebaseIdToken(forceRefresh = false) {
  try {
    const user = window.firebase?.auth?.()?.currentUser;
    if (!user) return '';
    return await user.getIdToken(forceRefresh);
  } catch (error) {
    console.warn('[Auth Token Bridge] Firebase ID token read failed:', error?.message || error);
    return '';
  }
}

async function start() {
  let attempts = 0;
  while (attempts < 40) {
    attempts += 1;
    if (window.firebase?.apps?.length && typeof window.firebase.auth === 'function') break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (!window.firebase?.apps?.length || typeof window.firebase.auth !== 'function') return;

  try {
    const auth = window.firebase.auth();
    auth.onAuthStateChanged(() => {
      // Restore only an existing Bookora API session. Do not overwrite it with
      // the Firebase ID token.
      try {
        const backendToken = String(localStorage.getItem('bookora_auth_token') || '').trim();
        if (backendToken) state.token = backendToken;
      } catch (_) {}
    });
  } catch (error) {
    console.warn('[Auth Token Bridge] Startup failed:', error?.message || error);
  }
}

start();

export { getFirebaseIdToken };
