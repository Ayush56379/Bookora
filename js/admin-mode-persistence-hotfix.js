// Bookora — persistent admin buyer/seller mode
// Keeps the administrator's explicitly selected mode stable across route changes,
// data syncs, page renders and reloads. It never grants a mode the account cannot use.
import { state } from './state.js';

const KEY = 'bookora_active_mode';
const VALID = new Set(['admin', 'seller', 'buyer']);
let restoring = false;

function canUse(mode) {
  if (mode === 'admin') return !!state.isAdmin;
  if (mode === 'seller') return !!state.isSeller;
  return true;
}

function storedMode() {
  try {
    const mode = localStorage.getItem(KEY);
    return VALID.has(mode) ? mode : '';
  } catch (_) {
    return '';
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

// Restore immediately when this hotfix loads.
restoreSelectedMode();

state.subscribe((event) => {
  // Authentication/data synchronization must not silently reset the user's
  // selected admin mode. Re-apply the last explicit selection after sync.
  if (event === 'USER_LOGGED_IN' || event === 'DATA_SYNCED' || event === 'AUTH_STATE_CHANGED') {
    setTimeout(restoreSelectedMode, 0);
  }

  // MODE_CHANGED is an intentional user selection. Keep it persisted and do
  // not overwrite it from profile role changes during normal navigation.
  if (event === 'MODE_CHANGED') {
    try {
      const mode = state.activeMode;
      if (VALID.has(mode) && canUse(mode)) localStorage.setItem(KEY, mode);
    } catch (_) {}
  }
});

// A route render should never be allowed to replace the selected mode.
window.addEventListener('hashchange', () => setTimeout(restoreSelectedMode, 0));
window.addEventListener('pageshow', () => setTimeout(restoreSelectedMode, 0));
