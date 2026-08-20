// Bookora checkout authentication bridge.
// Ensures the payment runtime always has a real backend session token,
// even when Firebase restores the UI user before the backend session is ready.
import { state } from './state.js';

const API = String(window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com').replace(/\/$/, '');
let exchangePromise = null;

async function exchangeFirebaseSession(force = false) {
  if (!force && state.token) return state.token;
  if (exchangePromise) return exchangePromise;

  exchangePromise = (async () => {
    try {
      let firebaseUser = null;
      try {
        firebaseUser = window.firebase?.auth?.()?.currentUser || null;
      } catch (_) {}

      if (!firebaseUser) {
        const cached = localStorage.getItem('bookora_user_profile');
        if (cached) {
          try {
            const profile = JSON.parse(cached);
            if (profile?.uid && window.firebase?.auth) {
              firebaseUser = window.firebase.auth().currentUser || null;
            }
          } catch (_) {}
        }
      }

      if (!firebaseUser) {
        throw new Error('Please sign in to complete purchase.');
      }

      const firebaseIdToken = await firebaseUser.getIdToken(force);
      const response = await fetch(`${API}/api/auth/firebase`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${firebaseIdToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: state.currentUser?.role || 'buyer' }),
        cache: 'no-store'
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.token) {
        throw new Error(data.error || 'Could not create a secure Bookora session.');
      }

      state.token = data.token;
      if (data.user) {
        state.currentUser = { ...(state.currentUser || {}), ...data.user };
      }
      state.isAuthenticated = true;
      localStorage.setItem('bookora_auth_token', data.token);
      return data.token;
    } finally {
      exchangePromise = null;
    }
  })();

  return exchangePromise;
}

const previous = window.BookoraPurchaseAccess?.ensureBackendSession;
window.BookoraPurchaseAccess = window.BookoraPurchaseAccess || {};
window.BookoraPurchaseAccess.ensureBackendSession = async function(force = false) {
  try {
    if (!force && state.token) return state.token;
    return await exchangeFirebaseSession(force);
  } catch (error) {
    if (previous) {
      try {
        return await previous(force);
      } catch (_) {}
    }
    throw error;
  }
};

// Also repair a stale Firebase ID token that was accidentally stored as the
// Bookora backend token by older auth-listener code.
try {
  const cachedToken = localStorage.getItem('bookora_auth_token') || '';
  if (cachedToken && cachedToken.split('.').length === 3) {
    state.token = '';
    localStorage.removeItem('bookora_auth_token');
  }
} catch (_) {}
