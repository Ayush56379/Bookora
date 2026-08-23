// External seller authentication persistence bridge.
// Keeps the existing authenticated Firebase/backend session available after SPA
// route changes or reloads. It never creates authentication from cached profile data.
import { state } from './state.js';
import { getFreshFirebaseIdToken } from './firebase-authenticated-fetch.js?v=20260823-3';

const TOKEN_KEY = 'bookora_auth_token';

async function persistVerifiedToken(forceRefresh = false) {
  try {
    const token = await getFreshFirebaseIdToken(forceRefresh);
    if (!token) return '';
    state.token = token;
    state.isAuthenticated = true;
    try { localStorage.setItem(TOKEN_KEY, token); } catch (_) {}
    return token;
  } catch (error) {
    console.warn('[External Seller Auth] token persistence skipped:', error?.message || error);
    return '';
  }
}

// Firebase is the source of truth. A cached profile alone never creates a token.
void persistVerifiedToken(false);

if (!window.__BOOKORA_EXTERNAL_SELLER_AUTH_PERSISTENCE__) {
  window.__BOOKORA_EXTERNAL_SELLER_AUTH_PERSISTENCE__ = true;
  state.subscribe(event => {
    if (event === 'USER_LOGGED_IN') void persistVerifiedToken(false);
    if (event === 'AUTH_STATE_CHANGED' && window.firebase?.auth?.()?.currentUser) {
      void persistVerifiedToken(false);
    }
  });
}

window.BookoraExternalSellerAuth = window.BookoraExternalSellerAuth || {};
window.BookoraExternalSellerAuth.refresh = () => persistVerifiedToken(true);
