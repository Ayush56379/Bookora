// Bookora — account-scoped permanent workspace mode.
// Workspace mode is selected only from Account Settings and persists per account.
// Authentication/data syncs/routes must never silently replace the user's choice.
import { state } from './state.js';

const KEY_PREFIX = 'bookora_workspace_mode:';
const VALID = new Set(['buyer', 'seller', 'admin']);
const ROUTES = { buyer: '#/', seller: '#/creator/dashboard', admin: '#/admin' };
let internalWrite = false;
let restoring = false;
let settingsObserver = null;

function canUse(mode) {
  if (mode === 'admin') return !!state.isAdmin;
  if (mode === 'seller') return !!state.isSeller;
  return mode === 'buyer';
}

function accountId() {
  const user = state.currentUser || {};
  return String(user.uid || user.firebaseUid || user.bookoraUserId || user.email || '').trim().toLowerCase();
}

function storageKey() {
  const id = accountId();
  return id ? `${KEY_PREFIX}${encodeURIComponent(id)}` : '';
}

function readSavedMode() {
  const key = storageKey();
  if (!key) return '';
  try {
    const value = localStorage.getItem(key);
    return VALID.has(value) && canUse(value) ? value : '';
  } catch (_) {
    return '';
  }
}

function saveMode(mode) {
  if (!VALID.has(mode) || !canUse(mode)) return;
  const key = storageKey();
  if (!key) return;
  try { localStorage.setItem(key, mode); } catch (_) {}
}

function roleModes() {
  const modes = ['buyer'];
  if (state.isSeller) modes.push('seller');
  if (state.isAdmin) modes.push('admin');
  return modes;
}

function modeName(mode) {
  return mode === 'admin' ? 'Admin' : mode === 'seller' ? 'Seller' : 'Buyer';
}

function modeDescription(mode) {
  if (mode === 'admin') return 'Manage Bookora, users, sellers, books, orders and platform settings.';
  if (mode === 'seller') return 'Use Creator Studio to publish books, manage sales and creator earnings.';
  return 'Browse, buy, read and manage your personal library.';
}

function modeIcon(mode) {
  if (mode === 'admin') return '🛡️';
  if (mode === 'seller') return '✍️';
  return '👤';
}

// Guard the mutable state field. Auth/profile hydration can assign activeMode directly;
// after a preference exists, those assignments are ignored unless they come through
// the explicit setActiveMode() API used by Account Settings.
let activeModeValue = VALID.has(state.activeMode) ? state.activeMode : 'buyer';
try {
  Object.defineProperty(state, 'activeMode', {
    configurable: true,
    enumerable: true,
    get() { return activeModeValue; },
    set(value) {
      const next = VALID.has(value) && canUse(value) ? value : 'buyer';
      if (internalWrite) {
        activeModeValue = next;
        return;
      }
      if (state.isAuthenticated) {
        const saved = readSavedMode();
        if (saved) {
          activeModeValue = saved;
          return;
        }
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
    if (!VALID.has(mode) || !canUse(mode)) return false;
    internalWrite = true;
    try {
      originalSetActiveMode(mode);
      activeModeValue = mode;
    } finally {
      internalWrite = false;
    }
    saveMode(mode);
    return true;
  };
}

function restoreMode() {
  if (restoring || !state.isAuthenticated) return;
  const saved = readSavedMode();
  const modes = roleModes();
  const mode = saved && modes.includes(saved)
    ? saved
    : (modes.includes(state.activeMode) ? state.activeMode : 'buyer');
  if (!mode) return;

  restoring = true;
  try {
    if (originalSetActiveMode) state.setActiveMode(mode);
    else {
      internalWrite = true;
      activeModeValue = mode;
      internalWrite = false;
    }
    saveMode(mode);
  } finally {
    restoring = false;
  }
}

function settingsPanelHtml() {
  const modes = roleModes();
  const active = modes.includes(state.activeMode) ? state.activeMode : modes[0];
  return `
    <section id="bookora-account-mode-settings" aria-labelledby="bookora-account-mode-title"
      style="margin:0 0 2rem 0;background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:2rem;box-shadow:var(--shadow-sm);">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1.25rem;">
        <div>
          <div class="badge badge-bookora" style="margin-bottom:.5rem;">Workspace</div>
          <h2 id="bookora-account-mode-title" style="font-size:1.25rem;font-weight:800;color:var(--text-primary);margin:0;">Default Workspace</h2>
          <p style="font-size:.9rem;color:var(--text-secondary);margin:.4rem 0 0;line-height:1.55;">
            Choose where Bookora should open after login and refresh. This choice is saved permanently for this account and will not be changed automatically.
          </p>
        </div>
        <span style="font-size:.75rem;font-weight:800;color:#16A34A;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:999px;padding:.35rem .65rem;white-space:nowrap;">Account saved</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:.8rem;">
        ${modes.map(mode => {
          const selected = active === mode;
          return `
            <button type="button" data-account-mode="${mode}" ${selected ? 'aria-pressed="true"' : 'aria-pressed="false"'}
              style="text-align:left;padding:1rem;border:1px solid ${selected ? '#2563EB' : '#E2E8F0'};border-radius:14px;background:${selected ? '#EFF6FF' : '#fff'};cursor:${selected ? 'default' : 'pointer'};transition:.15s;">
              <div style="display:flex;align-items:center;gap:.55rem;margin-bottom:.45rem;">
                <span style="font-size:1.1rem;">${modeIcon(mode)}</span>
                <strong style="font-size:.95rem;color:#0F172A;">${modeName(mode)}</strong>
                ${selected ? '<span style="margin-left:auto;font-size:.72rem;font-weight:800;color:#2563EB;">ACTIVE ✓</span>' : ''}
              </div>
              <span style="display:block;font-size:.78rem;line-height:1.45;color:#64748B;">${modeDescription(mode)}</span>
            </button>
          `;
        }).join('')}
      </div>
      ${modes.length === 1 ? '<p style="margin:.9rem 0 0;font-size:.78rem;color:#64748B;">Only Buyer access is currently available. Seller and Admin appear here only when this account is authorized for those roles.</p>' : ''}
    </section>
  `;
}

function injectSettingsPanel() {
  if (!state.isAuthenticated || !document.querySelector('.user-settings-page')) return;
  const container = document.querySelector('.user-settings-page .container');
  if (!container) return;

  const existing = document.getElementById('bookora-account-mode-settings');
  if (existing) {
    existing.outerHTML = settingsPanelHtml();
    return;
  }

  const header = container.firstElementChild;
  if (header) header.insertAdjacentHTML('afterend', settingsPanelHtml());
  else container.insertAdjacentHTML('afterbegin', settingsPanelHtml());
}

function startSettingsObserver() {
  if (settingsObserver || !document.body) return;
  settingsObserver = new MutationObserver(() => {
    clearTimeout(window.__BOOKORA_MODE_SETTINGS_TIMER);
    window.__BOOKORA_MODE_SETTINGS_TIMER = setTimeout(injectSettingsPanel, 0);
  });
  settingsObserver.observe(document.body, { childList: true, subtree: true });
  injectSettingsPanel();
}

// One delegated handler means the settings cards continue working after SPA renders.
document.addEventListener('click', event => {
  const button = event.target instanceof Element ? event.target.closest('[data-account-mode]') : null;
  if (!button) return;
  event.preventDefault();
  const mode = button.dataset.accountMode;
  if (!VALID.has(mode) || !canUse(mode)) return;
  if (mode === state.activeMode) return;

  const changed = state.setActiveMode(mode);
  if (changed === false) return;
  setTimeout(injectSettingsPanel, 0);
  window.location.hash = ROUTES[mode];
});

state.subscribe((event) => {
  if (event === 'MODE_CHANGED') {
    saveMode(state.activeMode);
    setTimeout(injectSettingsPanel, 0);
    return;
  }
  if (event === 'USER_LOGGED_IN' || event === 'AUTH_STATE_CHANGED' || event === 'DATA_SYNCED') {
    setTimeout(restoreMode, 0);
    setTimeout(restoreMode, 100);
    setTimeout(injectSettingsPanel, 150);
  }
});

window.addEventListener('hashchange', () => {
  setTimeout(restoreMode, 0);
  setTimeout(injectSettingsPanel, 50);
});
window.addEventListener('pageshow', () => setTimeout(restoreMode, 0));

// Legacy global storage could make different accounts inherit one another's mode.
// Remove it; only the account-scoped key above is authoritative now.
try { localStorage.removeItem('bookora_active_mode'); } catch (_) {}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startSettingsObserver, { once: true });
} else {
  startSettingsObserver();
}
