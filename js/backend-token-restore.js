// Bookora backend-session restore bridge.
// Firebase auth is the identity layer; protected Render APIs use the Bookora
// session token created during the normal sign-in flow. Restore that token
// before protected actions instead of exchanging Firebase on every page load.
import { state } from './state.js';

const TOKEN_KEY = 'bookora_auth_token';
const API = String(window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com').replace(/\/$/, '');

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

async function ensureBackendSession() {
  const existing = restore();
  if (existing) return existing;

  const firebaseUser = window.firebase?.auth?.()?.currentUser;
  if (!firebaseUser) throw new Error('Please sign in to continue.');

  const idToken = await firebaseUser.getIdToken(false);
  const response = await fetch(`${API}/api/auth/firebase`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ role: state.currentUser?.role === 'creator' ? 'creator' : 'buyer' }),
    cache: 'no-store'
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success || !data.token) {
    throw new Error(data.error || `Bookora authentication failed (${response.status}).`);
  }

  state.token = String(data.token);
  state.isAuthenticated = true;
  if (data.user) state.currentUser = { ...(state.currentUser || {}), ...data.user };
  try {
    localStorage.setItem(TOKEN_KEY, state.token);
    localStorage.setItem('bookora_user_profile', JSON.stringify(state.currentUser || {}));
  } catch (_) {}
  return state.token;
}

restore();
window.BookoraBackendSession = { restore, ensureBackendSession };
