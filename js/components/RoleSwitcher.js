// Account Profile Switcher Bar
import { state } from '../state.js';
import { Toast } from './Toast.js';

export function renderRoleSwitcher() {
  const currentRole = state.currentUser?.role || 'buyer';

  return `
    <div id="role-switcher-floating" style="position: fixed; bottom: 1.25rem; left: 1.25rem; z-index: 90; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px); border: 1px solid var(--border-medium); border-radius: var(--radius-full); box-shadow: var(--shadow-lg); padding: 5px 8px; display: flex; align-items: center; gap: 6px;">
      <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; padding-left: 6px; padding-right: 2px;">
        Account:
      </span>
      <button class="role-pill-btn ${currentRole === 'buyer' ? 'active' : ''}" data-role="buyer" style="padding: 4px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; ${currentRole === 'buyer' ? 'background: var(--accent); color: #fff;' : 'background: var(--bg-secondary); color: var(--text-secondary);'}">
        👤 Reader
      </button>
      <button class="role-pill-btn ${currentRole === 'creator' ? 'active' : ''}" data-role="creator" style="padding: 4px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; ${currentRole === 'creator' ? 'background: #6D28D9; color: #fff;' : 'background: var(--bg-secondary); color: var(--text-secondary);'}">
        ✍️ Author
      </button>
      <button class="role-pill-btn ${currentRole === 'admin' ? 'active' : ''}" data-role="admin" style="padding: 4px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; ${currentRole === 'admin' ? 'background: #0F172A; color: #fff;' : 'background: var(--bg-secondary); color: var(--text-secondary);'}">
        🛡️ Admin
      </button>
    </div>
  `;
}

export function initRoleSwitcherEvents() {
  document.querySelectorAll('.role-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.role;
      state.switchUser(role);
      Toast.show(`Switched active account to ${role.toUpperCase()}`, 'info');
      window.dispatchEvent(new Event('hashchange'));
    });
  });
}
