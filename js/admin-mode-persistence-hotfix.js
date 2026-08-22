// Bookora — hard-locked persistent buyer/seller/admin mode.
// The selected mode belongs to the current account and MUST NOT be silently
// replaced by Firebase profile hydration, DATA_SYNCED, route renders, or reloads.
import { state } from './state.js';

const GLOBAL_KEY = 'bookora_active_mode';
const VALID = new Set(['admin', 'seller', 'buyer']);
let internalWrite = false;
let restoring = false;

function canUse(mode) {
  if (mode === 'admin') return !!state.isAdmin;
  if (mode === 'seller') return !!state.isSeller;
  return mode === 'buyer';
}

function userKey() {
  const user = state.currentUser || {};
  const id = String(user.uid || user.firebaseUid || user.bookoraUserId || user.email || '').trim().toLowerCase();
  return id ? `${GLOBAL_KEY}:${encodeURIComponent(id)}` : '';
}

function read(key) {
  try {
    const value = localStorage.getItem(key);
    return VALID.has(value) ? value : '';
  } catch (_) {
    return '';
  }
}

function storedMode() {
  const key = userKey();
  if (key) {
    const perUser = read(key);
    if (perUser && canUse(perUser)) return perUser;
  }
  const legacy = read(GLOBAL_KEY);
  return legacy && canUse(legacy) ? legacy : '';
}

function persistMode(mode) {
  if (!VALID.has(mode) || !canUse(mode)) return;
  try { localStorage.setItem(GLOBAL_KEY, mode); } catch (_) {}
  const key = userKey();
  if (key) {
    try { localStorage.setItem(key, mode); } catch (_) {}
  }
}

// The state module currently assigns activeMode directly during authentication.
// Replace that mutable field with a guarded accessor: internal/auth code cannot
// overwrite an already selected user preference. Only setActiveMode() can do it.
const initialMode = VALID.has(state.activeMode) ? state.activeMode : 'buyer';
let activeModeValue = initialMode;
try {
  Object.defineProperty(state, 'activeMode', {
    configurable: true,
    enumerable: true,
    get() { return activeModeValue; },
    set(value) {
      const next = VALID.has(value) ? value : 'buyer';
      if (internalWrite) {
        activeModeValue = next;
        return;
      }
      const preferred = storedMode();
      // Once a valid preference exists for this account, direct assignments
      // from auth/data-sync code are ignored.
      if (state.isAuthenticated && preferred && canUse(preferred)) {
        activeModeValue = preferred;
        return;
      }
      activeModeValue = next;
    }
  });
} catch (_) {}

const originalSetActiveMode = typeof state.setActiveMode === 'function'
  ? state.setActiveMode.bind(state)
  : null;

if (originalSetActiveMode) {
  state.setActiveMode = function(mode) {
    if (!VALID.has(mode)) return;
    if (!canUse(mode)) return;
    internalWrite = true;
    try {
      originalSetActiveMode(mode);
      activeModeValue = mode;
    } finally {
      internalWrite = false;
    }
    persistMode(mode);
  };
}

function restoreSelectedMode() {
  if (restoring || !state.isAuthenticated) return;
  const mode = storedMode();
  if (!mode || state.activeMode === mode) return;
  restoring = true;
  try {
    if (originalSetActiveMode) state.setActiveMode(mode);
    else {
      internalWrite = true;
      activeModeValue = mode;
      internalWrite = false;
    }
  } finally {
    restoring = false;
  }
}

// If the current account has no preference yet, preserve the role-derived mode
// only as the initial default. As soon as the user changes it, it is locked.
if (state.isAuthenticated) {
  const saved = storedMode();
  if (saved) restoreSelectedMode();
  else persistMode(state.activeMode);
}

state.subscribe((event) => {
  if (event === 'MODE_CHANGED') {
    persistMode(state.activeMode);
    return;
  }
  if (event === 'USER_LOGGED_IN' || event === 'DATA_SYNCED' || event === 'AUTH_STATE_CHANGED') {
    setTimeout(restoreSelectedMode, 0);
    setTimeout(restoreSelectedMode, 50);
    setTimeout(restoreSelectedMode, 300);
  }
});

window.addEventListener('hashchange', () => setTimeout(restoreSelectedMode, 0));
window.addEventListener('pageshow', () => setTimeout(restoreSelectedMode, 0));
