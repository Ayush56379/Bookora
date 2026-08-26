// Restore the user's selected header mode after every SPA boot/refresh.
// This is intentionally isolated from routing, wallet, payments and publishing.
import { state } from './state.js';

const KEY = 'bookora_active_mode';
const VALID = new Set(['buyer', 'seller', 'admin']);

function restoreSelectedMode() {
  try {
    const saved = String(localStorage.getItem(KEY) || '').toLowerCase();
    if (!VALID.has(saved)) return;
    if (saved === 'admin' && !state.isAdmin) return;
    if (saved === 'seller' && !state.isSeller) return;
    if (state.activeMode === saved) return;
    state.setActiveMode(saved);
  } catch (error) {
    console.warn('[Bookora] Active mode restore skipped:', error);
  }
}

// Run after the current state/auth snapshot exists, then re-apply after
// authentication/profile synchronization so refreshes cannot reset the mode.
restoreSelectedMode();
state.subscribe((event) => {
  if (event === 'USER_LOGGED_IN' || event === 'DATA_SYNCED' || event === 'AUTH_STATE_CHANGED') {
    restoreSelectedMode();
  }
});
