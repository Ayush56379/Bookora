// Bookora external publish authentication bridge.
// The external publish form must use the same Firebase Auth session as the header.
// This bridge waits for Firebase session restoration and obtains a fresh ID token
// before the existing publish handler is allowed to continue.
import { state } from './state.js';

const TOKEN_KEY = 'bookora_auth_token';
const WRAPPED_LISTENERS = new WeakMap();

function restoreBackendSession() {
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

function getFirebaseAuth() {
  try {
    if (!window.firebase?.apps?.length || typeof window.firebase.auth !== 'function') return null;
    return window.firebase.auth();
  } catch (_) {
    return null;
  }
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

    try {
      unsubscribe = auth.onAuthStateChanged(finish);
    } catch (_) {
      finish(null);
      return;
    }

    timer = setTimeout(() => finish(auth.currentUser || null), timeoutMs);
  });
}

async function prepareExternalPublishAuth() {
  const user = await waitForFirebaseUser();
  if (!user) return restoreBackendSession();

  try {
    // Refresh only for this protected write operation. The token is never
    // logged or persisted by this bridge.
    const token = await user.getIdToken(true);
    if (!token) return restoreBackendSession();

    state.token = token;
    state.isAuthenticated = true;

    if (!state.currentUser || String(state.currentUser.uid || '') !== String(user.uid)) {
      state.currentUser = {
        ...(state.currentUser || {}),
        uid: user.uid,
        firebaseUid: user.uid,
        email: user.email || state.currentUser?.email || '',
        name: user.displayName || state.currentUser?.name || user.email?.split('@')[0] || 'Bookora User',
        photoURL: user.photoURL || state.currentUser?.photoURL || ''
      };
    }

    return token;
  } catch (error) {
    console.warn('[External Publish Auth] Firebase token preparation failed:', error?.message || error);
    return restoreBackendSession();
  }
}

function installSubmitGuard() {
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  if (originalAddEventListener.__bookoraExternalAuthPatched) return;

  function patchedAddEventListener(type, listener, options) {
    const isExternalForm = type === 'submit'
      && this instanceof HTMLFormElement
      && this.id === 'ext-submit-form'
      && typeof listener === 'function';

    if (!isExternalForm) return originalAddEventListener.call(this, type, listener, options);

    let wrapped = WRAPPED_LISTENERS.get(listener);
    if (!wrapped) {
      wrapped = async function externalPublishSubmitGuard(event) {
        // Stop native form navigation while Firebase Auth is being restored.
        event.preventDefault();
        try {
          await prepareExternalPublishAuth();
        } finally {
          // Keep the existing PublishExternalPage submit logic unchanged.
          return listener.call(this, event);
        }
      };
      WRAPPED_LISTENERS.set(listener, wrapped);
    }

    return originalAddEventListener.call(this, type, wrapped, options);
  }

  patchedAddEventListener.__bookoraExternalAuthPatched = true;
  EventTarget.prototype.addEventListener = patchedAddEventListener;
}

restoreBackendSession();
installSubmitGuard();
void prepareExternalPublishAuth();

export { prepareExternalPublishAuth, waitForFirebaseUser };
