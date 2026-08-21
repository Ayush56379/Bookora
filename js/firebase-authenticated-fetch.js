// Bookora authenticated fetch runtime.
// Firebase Auth is the single browser authentication authority.
// Protected backend requests receive a fresh Firebase ID token in memory.
// No UID/email is trusted from the caller and no token is persisted here.
import { state } from './state.js';

const BACKEND_ORIGIN = 'https://bookora-backend-x08l.onrender.com';
const PROTECTED_PATHS = [
  '/api/auth/me', '/api/orders', '/api/library', '/api/wishlist', '/api/cart',
  '/api/books/upload-files', '/api/books/create', '/api/publish/',
  '/api/admin/', '/api/cashfree/'
];

let authWaitPromise = null;
let installed = false;

function firebaseAuth() {
  try {
    if (!window.firebase?.apps?.length || typeof window.firebase.auth !== 'function') return null;
    return window.firebase.auth();
  } catch (_) {
    return null;
  }
}

function isBackendRequest(input) {
  const raw = typeof input === 'string' ? input : input?.url || '';
  try { return new URL(raw, window.location.href).origin === BACKEND_ORIGIN; } catch (_) { return String(raw).includes(BACKEND_ORIGIN); }
}

function isProtectedRequest(input) {
  if (!isBackendRequest(input)) return false;
  const raw = typeof input === 'string' ? input : input?.url || '';
  let pathname = '';
  try { pathname = new URL(raw, window.location.href).pathname; } catch (_) { pathname = raw; }
  return PROTECTED_PATHS.some(prefix => pathname === prefix || pathname.startsWith(prefix));
}

function waitForAuthRestoration(timeoutMs = 10000) {
  const auth = firebaseAuth();
  if (!auth) return Promise.resolve(null);
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  if (authWaitPromise) return authWaitPromise;

  authWaitPromise = new Promise(resolve => {
    let settled = false;
    let timer = null;
    let unsubscribe = null;
    const finish = user => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      try { unsubscribe?.(); } catch (_) {}
      authWaitPromise = null;
      resolve(user || null);
    };
    try { unsubscribe = auth.onAuthStateChanged(finish); } catch (_) { finish(null); return; }
    timer = setTimeout(() => finish(auth.currentUser || null), timeoutMs);
  });
  return authWaitPromise;
}

async function getFreshFirebaseIdToken(forceRefresh = false) {
  let auth = firebaseAuth();
  if (!auth) return '';
  const user = auth.currentUser || await waitForAuthRestoration();
  if (!user) return '';
  const token = await user.getIdToken(!!forceRefresh);
  if (token) {
    // Compatibility only: callers that still inspect state.token see the same
    // fresh Firebase token. It is never persisted as an authentication authority.
    state.token = token;
    state.isAuthenticated = true;
  }
  return token;
}

async function withFirebaseAuth(input, init = {}, forceRefresh = false) {
  const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
  const token = await getFreshFirebaseIdToken(forceRefresh);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return { ...init, headers };
}

function install() {
  if (installed || typeof window.fetch !== 'function') return;
  installed = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async function authenticatedFetch(input, init = {}) {
    if (!isProtectedRequest(input)) return originalFetch(input, init);

    const requestInit = await withFirebaseAuth(input, init, false);
    let response = await originalFetch(input, requestInit);

    if (response.status === 401) {
      const auth = firebaseAuth();
      const user = auth?.currentUser || await waitForAuthRestoration(5000);
      if (user) {
        const retryInit = await withFirebaseAuth(input, init, true);
        response = await originalFetch(input, retryInit);
      }
    }
    return response;
  };
}

install();

window.BookoraFirebaseAuth = window.BookoraFirebaseAuth || {};
window.BookoraFirebaseAuth.getFreshIdToken = getFreshFirebaseIdToken;
window.BookoraFirebaseAuth.waitForAuth = waitForAuthRestoration;

export { getFreshFirebaseIdToken, waitForAuthRestoration };
