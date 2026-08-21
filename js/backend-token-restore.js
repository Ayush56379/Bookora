// Bookora backend-session bridge.
// Firebase Auth is the identity layer. Protected Render APIs accept the
// verified Firebase ID token directly; no page-load /api/auth/firebase
// exchange is performed here.
import { state } from './state.js';

const TOKEN_KEY = 'bookora_auth_token';

function restore() {
  try {
    const token = String(localStorage.getItem(TOKEN_KEY) || '').trim();
    if (token) {
      state.token = token;
      state.isAuthenticated = true;
      return token;
    }
  } catch (_) {}
  return '';
}

async function ensureBackendSession(forceRefresh = false) {
  const firebaseUser = window.firebase?.auth?.()?.currentUser;
  if (!firebaseUser) {
    const restored = restore();
    if (restored) return restored;
    throw new Error('Please sign in to continue.');
  }

  // Prefer a current Firebase ID token. The backend verifies it server-side
  // and maps it to the existing Bookora identity/permissions.
  const token = await firebaseUser.getIdToken(!!forceRefresh);
  if (!token) throw new Error('Firebase authentication token is unavailable.');
  state.token = token;
  state.isAuthenticated = true;
  return token;
}

restore();
window.BookoraBackendSession = { restore, ensureBackendSession };
