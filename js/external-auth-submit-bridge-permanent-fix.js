// Bookora external publish authentication compatibility bridge.
// Supports the existing Bookora backend session token and Firebase Auth.
// This file is intentionally standalone so external publishing can recover
// authentication even when Firebase persistence has not restored currentUser.
import { state } from './state.js';

const BACKEND_TOKEN_KEY = 'bookora_auth_token';

function storedBackendToken() {
  try { return String(localStorage.getItem(BACKEND_TOKEN_KEY) || '').trim(); } catch (_) { return ''; }
}

async function prepareExternalPublishAuth() {
  try {
    const backendSession = window.BookoraBackendSession;
    if (backendSession?.ensureBackendSession) {
      const token = await backendSession.ensureBackendSession(false);
      if (token) {
        state.token = token;
        state.isAuthenticated = true;
        return token;
      }
    }
  } catch (_) {}

  const stored = storedBackendToken();
  if (stored) {
    state.token = stored;
    state.isAuthenticated = true;
    return stored;
  }

  try {
    const auth = window.firebase?.auth?.();
    const user = auth?.currentUser;
    if (user) {
      const token = await user.getIdToken(true);
      if (token) {
        state.token = token;
        state.isAuthenticated = true;
        return token;
      }
    }
  } catch (error) {
    console.warn('[External Publish Auth] Firebase fallback failed:', error?.message || error);
  }

  return '';
}

window.BookoraExternalPublishAuth = window.BookoraExternalPublishAuth || {};
window.BookoraExternalPublishAuth.prepare = prepareExternalPublishAuth;

void prepareExternalPublishAuth();

export { prepareExternalPublishAuth };
