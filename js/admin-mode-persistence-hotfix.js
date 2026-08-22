// Bookora — persistent buyer/seller/admin mode
// Keeps each user's explicitly selected mode stable across route changes,
// data syncs, page renders and reloads. It never grants a mode the account cannot use.
import { state } from './state.js';

const GLOBAL_KEY = 'bookora_active_mode';
const VALID = new Set(['admin', 'seller', 'buyer']);
let restoring = false;

function canUse(mode) {
  if (mode === 'admin') return !!state.isAdmin;
  if (mode === 'seller') return !!state.isSeller;
  return true;
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
  const perUser = key ? read(key) : '';
  if (perUser) return perUser;

  // Migrate the old global preference once for the current authenticated user.
  const legacy = read(GLOBAL_KEY);
  if (legacy && key) {
    try { localStorage.setItem(key, legacy); } catch (_) {}
  }
  return legacy;
}

function persistMode(mode) {
  if (!VALID.has(mode) || !canUse(mode)) return;
  try { localStorage.setItem(GLOBAL_KEY, mode); } catch (_) {}
  const key = userKey();
  if (key) {
    try { localStorage.setItem(key, mode); } catch (_) {}
  }
}

function restoreSelectedMode() {
  if (restoring || !state.isAuthenticated) return;
  const mode = storedMode();
  if (!mode || !canUse(mode) || state.activeMode === mode) return;

  restoring = true;
  try {
    state.setActiveMode(mode);
  } finally {
    restoring = false;
  }
}

// Restore as early as possible before the first route/header render.
restoreSelectedMode();

state.subscribe((event) => {
  if (event === 'USER_LOGGED_IN' || event === 'DATA_SYNCED' || event === 'AUTH_STATE_CHANGED') {
    setTimeout(restoreSelectedMode, 0);
    setTimeout(restoreSelectedMode, 50);
  }

  if (event === 'MODE_CHANGED') {
    persistMode(state.activeMode);
  }
});

window.addEventListener('hashchange', () => setTimeout(restoreSelectedMode, 0));
window.addEventListener('pageshow', () => setTimeout(restoreSelectedMode, 0));
