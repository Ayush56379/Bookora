// Bookora authenticated fetch runtime.
// Firebase Auth is the browser authentication authority when available.
// Existing Bookora backend sessions remain valid during Firebase restoration.
import { state } from './state.js';

const BACKEND_ORIGIN = 'https://bookora-backend-x08l.onrender.com';
const BACKEND_TOKEN_KEY = 'bookora_auth_token';
const PROTECTED_PATHS = [
  '/api/profile', '/api/auth/me', '/api/orders', '/api/library', '/api/wishlist', '/api/cart',
  '/api/books/upload-files', '/api/books/create', '/api/publish/', '/api/admin/', '/api/cashfree/'
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

function storedBackendToken() {
  try { return String(localStorage.getItem(BACKEND_TOKEN_KEY) || '').trim(); } catch (_) { return ''; }
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
  const auth = firebaseAuth();
  if (auth) {
    const user = auth.currentUser || await waitForAuthRestoration();
    if (user) {
      try {
        const token = await user.getIdToken(!!forceRefresh);
        if (token) {
          state.token = token;
          state.isAuthenticated = true;
          if (!state.currentUser) {
            state.currentUser = {
              uid: user.uid,
              firebaseUid: user.uid,
              email: user.email || '',
              name: user.displayName || user.email?.split('@')[0] || 'Bookora User',
              photoURL: user.photoURL || ''
            };
          }
          return token;
        }
      } catch (error) {
        console.warn('[Firebase Auth] ID token unavailable:', error?.message || error);
      }
    }
  }

  // Compatibility path for a valid older Bookora backend session while Firebase
  // is restoring. Firebase is always preferred when a real user is available.
  const backendToken = storedBackendToken() || String(state.token || '').trim();
  if (backendToken) {
    state.token = backendToken;
    state.isAuthenticated = true;
    return backendToken;
  }
  return '';
}

async function withFirebaseAuth(input, init = {}, forceRefresh = false) {
  const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
  const token = await getFreshFirebaseIdToken(forceRefresh);
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
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

(async function bootstrapRestoredSession() {
  const auth = firebaseAuth();
  if (auth) {
    try {
      const user = auth.currentUser || await waitForAuthRestoration(10000);
      if (user) await getFreshFirebaseIdToken(false);
    } catch (error) {
      console.warn('[Firebase Auth] Session bootstrap skipped:', error?.message || error);
    }
  }

  const backendToken = storedBackendToken();
  if (backendToken && !state.token) {
    state.token = backendToken;
    state.isAuthenticated = true;
  }
})();

window.BookoraFirebaseAuth = window.BookoraFirebaseAuth || {};
window.BookoraFirebaseAuth.getFreshIdToken = getFreshFirebaseIdToken;
window.BookoraFirebaseAuth.waitForAuth = waitForAuthRestoration;

export { getFreshFirebaseIdToken, waitForAuthRestoration };
