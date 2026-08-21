// Bookora Firebase identity bridge.
// Firebase ID tokens are used only when no Bookora backend session token exists.
// The Render backend verifies Firebase tokens server-side before allowing protected actions.
import { state } from './state.js';

const BACKEND_TOKEN_KEY = 'bookora_auth_token';

function hasBackendSession() {
  try {
    return !!String(localStorage.getItem(BACKEND_TOKEN_KEY) || '').trim();
  } catch (_) {
    return false;
  }
}

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

async function syncFirebaseToken(forceRefresh = false) {
  // Prefer the normal Bookora session whenever one exists.
  if (hasBackendSession()) return '';
  const token = await getFirebaseIdToken(forceRefresh);
  if (token) {
    state.token = token;
    state.isAuthenticated = true;
  }
  return token;
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
    auth.onAuthStateChanged(async user => {
      if (!user) return;
      await syncFirebaseToken(false);

      // Firebase ID tokens are short-lived. Keep the protected API token fresh
      // while the user remains signed in. Never overwrite an existing Bookora
      // backend session token.
      try {
        user.getIdToken().then(token => {
          if (token && !hasBackendSession()) state.token = token;
        }).catch(() => {});
      } catch (_) {}
    });

    // Keep Firebase token state current without forcing a refresh on every request.
    setInterval(() => {
      if (auth.currentUser && !hasBackendSession()) syncFirebaseToken(true).catch(() => {});
    }, 45 * 60 * 1000);
  } catch (error) {
    console.warn('[Auth Token Bridge] Startup failed:', error?.message || error);
  }
}

start();

export { getFirebaseIdToken, syncFirebaseToken };
