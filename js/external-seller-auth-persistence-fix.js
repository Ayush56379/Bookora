// External seller authentication/session bridge.
// Firebase is the identity authority, while the existing Bookora backend
// protected routes use the server-issued Bookora session token. This runtime
// bridges the two only for external seller/publish endpoints and never trusts
// cached profile data as authentication.
import { state } from './state.js';
import { getFreshFirebaseIdToken } from './firebase-authenticated-fetch.js?v=20260823-3';

const TOKEN_KEY = 'bookora_auth_token';
const UID_KEY = 'bookora_auth_session_uid';
const API_BASE = String(window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com').replace(/\/$/, '');
const PROTECTED_EXTERNAL = ['/api/external/', '/api/publish/external', '/api/books/upload-files'];

function getStoredToken() {
  try { return String(localStorage.getItem(TOKEN_KEY) || '').trim(); } catch (_) { return ''; }
}

function persistToken(token, uid = '') {
  const value = String(token || '').trim();
  if (!value) return;
  state.token = value;
  state.isAuthenticated = true;
  try {
    localStorage.setItem(TOKEN_KEY, value);
    if (uid) localStorage.setItem(UID_KEY, String(uid));
  } catch (_) {}
}

function getFirebaseUser() {
  try { return window.firebase?.auth?.()?.currentUser || null; } catch (_) { return null; }
}

function isFirebaseJwt(token) {
  const value = String(token || '').trim();
  return value.split('.').length === 3 && value.length > 200;
}

function isExternalProtectedRequest(input) {
  const raw = typeof input === 'string' ? input : (input?.url || '');
  let pathname = '';
  try { pathname = new URL(raw, window.location.href).pathname; } catch (_) { pathname = raw; }
  return PROTECTED_EXTERNAL.some(prefix => pathname === prefix || pathname.startsWith(prefix));
}

let exchangePromise = null;

async function exchangeFirebaseForBookoraSession(firebaseToken, forceRefresh = false) {
  if (exchangePromise && !forceRefresh) return exchangePromise;
  exchangePromise = (async () => {
    const user = getFirebaseUser();
    let token = String(firebaseToken || '').trim();
    if (user && forceRefresh) token = await user.getIdToken(true);
    if (!token) throw new Error('Firebase authentication token is unavailable.');

    const response = await fetch(`${API_BASE}/api/auth/firebase`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: 'seller' })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.success || !data?.token) {
      throw new Error(data?.error || 'Bookora authentication session could not be established.');
    }
    persistToken(data.token, user?.uid || data.user?.uid || data.user?.firebaseUid || '');
    return data.token;
  })();
  try { return await exchangePromise; } finally { exchangePromise = null; }
}

async function persistVerifiedToken(forceRefresh = false) {
  try {
    const firebaseToken = await getFreshFirebaseIdToken(forceRefresh);
    if (!firebaseToken) return getStoredToken();
    return await exchangeFirebaseForBookoraSession(firebaseToken, forceRefresh);
  } catch (error) {
    console.warn('[External Seller Auth] session exchange skipped:', error?.message || error);
    return getStoredToken();
  }
}

if (!window.__BOOKORA_EXTERNAL_SELLER_SESSION_BRIDGE__) {
  window.__BOOKORA_EXTERNAL_SELLER_SESSION_BRIDGE__ = true;

  // Convert explicit Firebase Authorization headers into the backend session
  // token immediately before protected external requests are sent.
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function externalSellerSessionFetch(input, init = {}) {
    if (!isExternalProtectedRequest(input)) return originalFetch(input, init);

    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    const authorization = String(headers.get('Authorization') || '').trim();
    if (!authorization.toLowerCase().startsWith('bearer ')) return originalFetch(input, init);

    const suppliedToken = authorization.slice(7).trim();
    if (!isFirebaseJwt(suppliedToken)) return originalFetch(input, init);

    let backendToken = '';
    try {
      // Prefer the already-issued Bookora session. This avoids an exchange on
      // every request after the first successful authentication bridge.
      backendToken = getStoredToken();
      if (!backendToken) backendToken = await exchangeFirebaseForBookoraSession(suppliedToken, false);
    } catch (error) {
      try { backendToken = await exchangeFirebaseForBookoraSession(suppliedToken, true); }
      catch (refreshError) { console.warn('[External Seller Auth] Firebase→Bookora exchange failed:', refreshError?.message || refreshError); }
    }

    if (!backendToken) return originalFetch(input, init);
    headers.set('Authorization', `Bearer ${backendToken}`);
    return originalFetch(input, { ...init, headers });
  };

  // Warm the session after Firebase restoration. A cached profile alone never
  // authenticates the user; a real Firebase user is required for this step.
  void persistVerifiedToken(false);

  state.subscribe(event => {
    if (event === 'USER_LOGGED_IN') void persistVerifiedToken(false);
    if (event === 'AUTH_STATE_CHANGED' && getFirebaseUser()) void persistVerifiedToken(false);
    if (event === 'USER_LOGGED_OUT') {
      try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(UID_KEY); } catch (_) {}
    }
  });
}

window.BookoraExternalSellerAuth = window.BookoraExternalSellerAuth || {};
window.BookoraExternalSellerAuth.refresh = () => persistVerifiedToken(true);
