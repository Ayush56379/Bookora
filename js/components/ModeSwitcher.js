// ModeSwitcher Component (Buyer, Seller, Admin)
import { state } from '../state.js';
import { Toast } from './Toast.js';

const MODE_KEY = 'bookora_active_mode';
const VALID_MODES = new Set(['buyer', 'seller', 'admin']);
let restoringMode = false;

function canUseMode(mode) {
  if (mode === 'admin') return !!state.isAdmin;
  if (mode === 'seller') return !!state.isSeller;
  return true;
}

function getSavedMode() {
  try {
    const mode = localStorage.getItem(MODE_KEY);
    return VALID_MODES.has(mode) ? mode : '';
  } catch (_) {
    return '';
  }
}

function restoreSavedMode() {
  if (restoringMode || !state.isAuthenticated) return;
  const saved = getSavedMode();
  if (!saved || !canUseMode(saved) || state.activeMode === saved) return;

  restoringMode = true;
  try {
    state.setActiveMode(saved);
  } finally {
    restoringMode = false;
  }
}

// Firebase auth/data sync can recalculate activeMode from the user's role.
// For an admin, the last explicit Buyer/Seller/Admin selection must win.
state.subscribe((event) => {
  if (event === 'USER_LOGGED_IN' || event === 'DATA_SYNCED' || event === 'AUTH_STATE_CHANGED') {
    setTimeout(restoreSavedMode, 0);
  }
  if (event === 'MODE_CHANGED') {
    try {
      const mode = state.activeMode;
      if (VALID_MODES.has(mode) && canUseMode(mode)) {
        localStorage.setItem(MODE_KEY, mode);
      }
    } catch (_) {}
  }
});

window.addEventListener('hashchange', () => setTimeout(restoreSavedMode, 0));
window.addEventListener('pageshow', () => setTimeout(restoreSavedMode, 0));

export function renderModeSwitcher() {
  const user = state.currentUser;
  const isAuth = state.isAuthenticated;
  const isAdmin = state.isAdmin;
  const isSeller = state.isSeller;
  const activeMode = state.activeMode; // 'buyer', 'seller', 'admin'

  if (!isAuth) return '';

  return `
    <div class="mode-switcher-container" style="display: flex; align-items: center; background: #F1F5F9; border: 1px solid var(--border-medium); border-radius: var(--radius-full); padding: 3px;">
      
      <!-- Buyer Mode Button -->
      <button class="mode-btn ${activeMode === 'buyer' ? 'active' : ''}" data-mode="buyer" style="padding: 4px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; transition: all 0.2s; ${activeMode === 'buyer' ? 'background: #FFFFFF; color: var(--accent); box-shadow: var(--shadow-sm);' : 'color: var(--text-secondary);'}">
        👤 Buyer
      </button>

      ${isSeller ? `
        <!-- Seller Mode Button -->
        <button class="mode-btn ${activeMode === 'seller' ? 'active' : ''}" data-mode="seller" style="padding: 4px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; transition: all 0.2s; ${activeMode === 'seller' ? 'background: #6D28D9; color: #FFFFFF; box-shadow: var(--shadow-sm);' : 'color: var(--text-secondary);'}">
          ✍️ Seller
        </button>
      ` : ''}

      ${isAdmin ? `
        <!-- Admin Mode Button (Only shown to verified Admin) -->
        <button class="mode-btn ${activeMode === 'admin' ? 'active' : ''}" data-mode="admin" style="padding: 4px 12px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; transition: all 0.2s; ${activeMode === 'admin' ? 'background: #0F172A; color: #FFFFFF; box-shadow: var(--shadow-sm);' : 'color: var(--text-secondary);'}">
          🛡️ Admin
        </button>
      ` : ''}

    </div>
  `;
}

export function initModeSwitcherEvents() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetMode = btn.dataset.mode;
      if (!VALID_MODES.has(targetMode) || !canUseMode(targetMode)) return;

      // Persist the user's explicit selection before navigation. This prevents
      // Firebase's next auth/data sync from immediately switching it back.
      try { localStorage.setItem(MODE_KEY, targetMode); } catch (_) {}
      state.setActiveMode(targetMode);
      Toast.show(`Switched to ${targetMode.toUpperCase()} Mode`, 'info');
      
      if (targetMode === 'admin') {
        window.location.hash = '#/admin';
      } else if (targetMode === 'seller') {
        window.location.hash = '#/creator/dashboard';
      } else {
        window.location.hash = '#/';
      }
    });
  });

  // In case the header was rendered while Firebase was still syncing.
  setTimeout(restoreSavedMode, 0);
}
