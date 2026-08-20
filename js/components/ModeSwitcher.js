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

// Firebase auth/data sync must not overwrite the user's explicit mode choice.
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

function modeLabel(mode) {
  if (mode === 'seller') return 'Seller';
  if (mode === 'admin') return 'Admin';
  return 'Buyer';
}

function modeIcon(mode) {
  if (mode === 'seller') {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>';
  }
  if (mode === 'admin') {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6Z"/><path d="m9 12 2 2 4-4"/></svg>';
  }
  return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
}

export function renderModeSwitcher() {
  const isAuth = state.isAuthenticated;
  const isAdmin = state.isAdmin;
  const isSeller = state.isSeller;
  const activeMode = state.activeMode;

  if (!isAuth) return '';

  const availableModes = ['buyer', ...(isSeller ? ['seller'] : []), ...(isAdmin ? ['admin'] : [])];

  return `
    <div class="mode-switcher" data-mode-switcher style="position:relative;display:inline-flex;">
      <button type="button" class="mode-switcher-trigger" data-mode-trigger aria-haspopup="true" aria-expanded="false"
        style="display:flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid var(--border-medium);border-radius:999px;background:#F8FAFC;color:#0F172A;font-size:.72rem;font-weight:700;cursor:pointer;white-space:nowrap;">
        ${modeIcon(activeMode)}
        <span>${modeLabel(activeMode)}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="mode-switcher-menu" data-mode-menu role="menu"
        style="display:none;position:absolute;right:0;top:calc(100% + 7px);min-width:150px;padding:6px;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;box-shadow:0 14px 35px rgba(15,23,42,.14);z-index:1000;">
        ${availableModes.map(mode => `
          <button type="button" class="mode-option ${activeMode === mode ? 'active' : ''}" data-mode="${mode}" role="menuitem"
            style="width:100%;display:flex;align-items:center;gap:9px;padding:9px 10px;border:0;border-radius:9px;background:${activeMode === mode ? '#F1F5F9' : 'transparent'};color:${mode === 'admin' ? '#0F172A' : mode === 'seller' ? '#6D28D9' : '#2563EB'};font-size:.78rem;font-weight:700;text-align:left;cursor:pointer;">
            ${modeIcon(mode)}
            <span style="flex:1;">${modeLabel(mode)}</span>
            ${activeMode === mode ? '<span aria-hidden="true">✓</span>' : ''}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

export function initModeSwitcherEvents() {
  document.querySelectorAll('[data-mode-switcher]').forEach(switcher => {
    const trigger = switcher.querySelector('[data-mode-trigger]');
    const menu = switcher.querySelector('[data-mode-menu]');
    if (!trigger || !menu) return;

    // Prevent duplicate listeners when the header is re-rendered.
    if (switcher.dataset.modeInitialized === 'true') return;
    switcher.dataset.modeInitialized = 'true';

    const close = () => {
      menu.style.display = 'none';
      trigger.setAttribute('aria-expanded', 'false');
    };

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.style.display === 'block';
      document.querySelectorAll('[data-mode-menu]').forEach(other => { other.style.display = 'none'; });
      document.querySelectorAll('[data-mode-trigger]').forEach(other => { other.setAttribute('aria-expanded', 'false'); });
      menu.style.display = open ? 'none' : 'block';
      trigger.setAttribute('aria-expanded', open ? 'false' : 'true');
    });

    menu.querySelectorAll('.mode-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetMode = btn.dataset.mode;
        if (!VALID_MODES.has(targetMode) || !canUseMode(targetMode)) return;

        try { localStorage.setItem(MODE_KEY, targetMode); } catch (_) {}
        state.setActiveMode(targetMode);
        close();
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

    document.addEventListener('click', close);
    window.addEventListener('resize', close);
  });

  setTimeout(restoreSavedMode, 0);
}
