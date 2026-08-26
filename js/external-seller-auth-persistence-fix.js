// External seller authentication/session bridge.
// Firebase is the identity authority, while existing Bookora backend protected
// routes use the server-issued Bookora session token.
import { state } from './state.js';
import { getFreshFirebaseIdToken } from './firebase-authenticated-fetch.js?v=20260823-3';

const TOKEN_KEY = 'bookora_auth_token';
const UID_KEY = 'bookora_auth_session_uid';
const API_BASE = String(window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com').replace(/\/$/, '');
const PROTECTED_EXTERNAL = ['/api/external/', '/api/publish/external', '/api/books/upload-files'];

function getFirebaseUser() {
  try { return window.firebase?.auth?.()?.currentUser || null; } catch (_) { return null; }
}

function isFirebaseJwt(token) {
  const value = String(token || '').trim();
  return value.split('.').length === 3 && value.length > 200;
}

function getStoredToken() {
  try {
    const token = String(localStorage.getItem(TOKEN_KEY) || '').trim();
    if (!token || isFirebaseJwt(token)) return '';
    const storedUid = String(localStorage.getItem(UID_KEY) || '').trim();
    const currentUid = String(getFirebaseUser()?.uid || '').trim();
    if (currentUid && storedUid && currentUid !== storedUid) return '';
    return token;
  } catch (_) { return ''; }
}

function persistToken(token, uid = '') {
  const value = String(token || '').trim();
  if (!value || isFirebaseJwt(value)) return;
  state.token = value;
  state.isAuthenticated = true;
  try {
    localStorage.setItem(TOKEN_KEY, value);
    if (uid) localStorage.setItem(UID_KEY, String(uid));
  } catch (_) {}
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
      const retryAfter = response.headers.get('Retry-After');
      throw new Error(data?.error || `Bookora session exchange failed (${response.status})${retryAfter ? `; retry after ${retryAfter}s` : ''}`);
    }
    persistToken(data.token, user?.uid || data.user?.uid || data.user?.firebaseUid || '');
    return data.token;
  })();
  try { return await exchangePromise; } finally { exchangePromise = null; }
}

async function persistVerifiedToken(forceRefresh = false) {
  const existing = getStoredToken();
  if (existing && !forceRefresh) return existing;
  try {
    const firebaseToken = await getFreshFirebaseIdToken(forceRefresh);
    if (!firebaseToken) return existing;
    return await exchangeFirebaseForBookoraSession(firebaseToken, forceRefresh);
  } catch (error) {
    console.warn('[External Seller Auth] lazy session exchange skipped:', error?.message || error);
    return getStoredToken();
  }
}

if (!window.__BOOKORA_EXTERNAL_SELLER_SESSION_BRIDGE__) {
  window.__BOOKORA_EXTERNAL_SELLER_SESSION_BRIDGE__ = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async function externalSellerSessionFetch(input, init = {}) {
    if (!isExternalProtectedRequest(input)) return originalFetch(input, init);
    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    const authorization = String(headers.get('Authorization') || '').trim();
    if (!authorization.toLowerCase().startsWith('bearer ')) return originalFetch(input, init);
    const suppliedToken = authorization.slice(7).trim();
    if (!isFirebaseJwt(suppliedToken)) return originalFetch(input, init);

    let backendToken = getStoredToken();
    if (!backendToken) {
      try { backendToken = await exchangeFirebaseForBookoraSession(suppliedToken, false); }
      catch (error) { console.warn('[External Seller Auth] lazy exchange failed:', error?.message || error); }
    }
    if (!backendToken) return originalFetch(input, init);
    headers.set('Authorization', `Bearer ${backendToken}`);
    return originalFetch(input, { ...init, headers });
  };

  // Do not warm the backend session here. api-auth-bridge.js is the single
  // owner of normal Firebase→Bookora session establishment. A second warm-up
  // request during startup caused duplicate /api/auth/firebase calls and 429s.
  state.subscribe(event => {
    if (event === 'USER_LOGGED_OUT') {
      try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(UID_KEY); } catch (_) {}
    }
  });
}

window.BookoraExternalSellerAuth = window.BookoraExternalSellerAuth || {};
window.BookoraExternalSellerAuth.refresh = () => persistVerifiedToken(true);