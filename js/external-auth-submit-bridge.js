// Bookora external publish authentication bridge.
// The external publish form uses the same Bookora session as the header.
// Firebase Auth is preferred because it produces a fresh, server-verifiable ID token.
import { state } from './state.js';

const WRAPPED_LISTENERS = new WeakMap();
const BACKEND_TOKEN_KEY = 'bookora_auth_token';

function getFirebaseAuth() {
  try {
    if (!window.firebase?.apps?.length || typeof window.firebase.auth !== 'function') return null;
    return window.firebase.auth();
  } catch (_) { return null; }
}

function getStoredBackendToken() {
  try { return String(localStorage.getItem(BACKEND_TOKEN_KEY) || '').trim(); } catch (_) { return ''; }
}

function waitForFirebaseUser(timeoutMs = 12000) {
  const auth = getFirebaseAuth();
  if (!auth) return Promise.resolve(null);
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  return new Promise(resolve => {
    let settled = false;
    let timer = null;
    let unsubscribe = null;
    const finish = user => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      try { unsubscribe?.(); } catch (_) {}
      resolve(user || null);
    };
    try { unsubscribe = auth.onAuthStateChanged(finish); } catch (_) { finish(null); return; }
    timer = setTimeout(() => finish(auth.currentUser || null), timeoutMs);
  });
}

async function prepareExternalPublishAuth() {
  // 1. Always prefer a real Firebase user and a fresh ID token.
  const user = await waitForFirebaseUser();
  if (user) {
    try {
      const token = await user.getIdToken(true);
      if (!token) throw new Error('Firebase authentication token is unavailable.');
      state.token = token;
      state.isAuthenticated = true;
      if (!state.currentUser || String(state.currentUser.uid || '') !== String(user.uid)) {
        state.currentUser = {
          ...(state.currentUser || {}), uid: user.uid, firebaseUid: user.uid,
          email: user.email || state.currentUser?.email || '',
          name: user.displayName || state.currentUser?.name || user.email?.split('@')[0] || 'Bookora User',
          photoURL: user.photoURL || state.currentUser?.photoURL || ''
        };
      }
      return token;
    } catch (error) {
      console.warn('[External Publish Auth] Firebase token preparation failed:', error?.message || error);
    }
  }

  // 2. Compatibility fallback only when Firebase has no current user.
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

  const storedToken = getStoredBackendToken();
  if (storedToken) {
    state.token = storedToken;
    state.isAuthenticated = true;
    return storedToken;
  }

  return '';
}

function installSubmitGuard() {
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  if (originalAddEventListener.__bookoraExternalAuthPatched) return;
  function patchedAddEventListener(type, listener, options) {
    const isExternalForm = type === 'submit' && this instanceof HTMLFormElement && this.id === 'ext-submit-form' && typeof listener === 'function';
    if (!isExternalForm) return originalAddEventListener.call(this, type, listener, options);
    let wrapped = WRAPPED_LISTENERS.get(listener);
    if (!wrapped) {
      wrapped = async function externalPublishSubmitGuard(event) {
        event.preventDefault();
        const token = await prepareExternalPublishAuth();
        if (!token) {
          console.warn('[External Publish Auth] No authenticated Bookora session available.');
          return;
        }
        return listener.call(this, event);
      };
      WRAPPED_LISTENERS.set(listener, wrapped);
    }
    return originalAddEventListener.call(this, type, wrapped, options);
  }
  patchedAddEventListener.__bookoraExternalAuthPatched = true;
  EventTarget.prototype.addEventListener = patchedAddEventListener;
}

installSubmitGuard();
void prepareExternalPublishAuth();

export { prepareExternalPublishAuth, waitForFirebaseUser };
