// Bookora Firebase -> API auth bridge
// Keeps state.token synchronized with the currently signed-in Firebase user so
// protected upload/publish endpoints receive a real Firebase ID token.
import { state } from './state.js';

async function syncFirebaseToken(forceRefresh = false) {
  try {
    if (!window.firebase || !window.firebase.apps?.length || typeof window.firebase.auth !== 'function') return '';
    const user = window.firebase.auth().currentUser;
    if (!user) {
      state.token = '';
      return '';
    }
    const token = await user.getIdToken(forceRefresh);
    if (token) state.token = token;
    return token || '';
  } catch (error) {
    console.warn('[Auth Token Bridge] Firebase ID token sync failed:', error?.message || error);
    return '';
  }
}

async function start() {
  let attempts = 0;
  while (attempts < 40) {
    attempts += 1;
    try {
      if (window.firebase?.apps?.length && typeof window.firebase.auth === 'function') break;
    } catch (_) {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  if (!window.firebase?.apps?.length || typeof window.firebase.auth !== 'function') return;

  try {
    const auth = window.firebase.auth();
    auth.onAuthStateChanged(async user => {
      if (!user) {
        state.token = '';
        return;
      }
      await syncFirebaseToken(false);
    });
    await syncFirebaseToken(false);
    setInterval(() => { if (auth.currentUser) syncFirebaseToken(false); }, 10 * 60 * 1000);
  } catch (error) {
    console.warn('[Auth Token Bridge] Startup failed:', error?.message || error);
  }
}

start();

export { syncFirebaseToken };
