// ModeSwitcher Component (Buyer, Seller, Admin)
import { state } from '../state.js';
import { Toast } from './Toast.js';

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
}
