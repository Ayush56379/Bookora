// UserSettingsPage Component (Buyer & General Account Settings)
import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

export function renderUserSettingsPage() {
  updateSEO({
    title: 'Account Settings & Preferences',
    description: 'Manage your profile, display preferences, notifications, and security on Bookora.'
  });

  const user = state.currentUser || {};

  return `
    <div class="user-settings-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 820px;">
        
        <!-- Header -->
        <div style="margin-bottom: 2.5rem;">
          <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">Account Center</div>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
            Account Settings
          </h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
            Manage your personal profile, reading preferences, and notification toggles.
          </p>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm);">
          <form id="user-settings-form">
            
            <!-- Profile Section -->
            <div style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem;">
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.25rem;">
                1. Personal Profile
              </h3>

              <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.5rem;">
                <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}" alt="${user.name}" style="width: 64px; height: 64px; border-radius: 99px; object-fit: cover;" />
                <div>
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.35rem;">Avatar URL</label>
                  <input type="url" id="user-set-avatar" value="${user.avatar || ''}" style="width: 320px; padding: 0.5rem 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.85rem;" />
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem;">
                <div>
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Full Name</label>
                  <input type="text" id="user-set-name" value="${user.name || ''}" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                </div>
                <div>
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Email Address</label>
                  <input type="email" id="user-set-email" value="${user.email || ''}" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                </div>
              </div>
            </div>

            <!-- Preferences -->
            <div style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem;">
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.25rem;">
                2. Display & Regional Preferences
              </h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
                <div>
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Preferred Display Currency</label>
                  <select id="user-set-currency" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; background: #FFFFFF;">
                    <option value="INR" selected>INR (₹ - Indian Rupee)</option>
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                    <option value="AED">AED (د.إ - UAE Dirham)</option>
                  </select>
                </div>
                <div>
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Language</label>
                  <select id="user-set-language" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; background: #FFFFFF;">
                    <option value="English" selected>English</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Notifications -->
            <div style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem;">
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.25rem;">
                3. Notification Preferences
              </h3>
              <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                  <span style="font-size: 0.9rem; color: var(--text-primary);">Order receipts and license delivery emails</span>
                  <input type="checkbox" id="user-notif-orders" checked style="width: 18px; height: 18px; accent-color: var(--accent);" />
                </label>
                <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                  <span style="font-size: 0.9rem; color: var(--text-primary);">Wishlist book price reductions & promotions</span>
                  <input type="checkbox" id="user-notif-wishlist" checked style="width: 18px; height: 18px; accent-color: var(--accent);" />
                </label>
                <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                  <span style="font-size: 0.9rem; color: var(--text-primary);">New releases in your followed categories</span>
                  <input type="checkbox" id="user-notif-releases" checked style="width: 18px; height: 18px; accent-color: var(--accent);" />
                </label>
              </div>
            </div>

            <!-- Submit -->
            <button type="submit" class="btn btn-primary btn-lg" style="font-weight: 700;">
              Save Account Preferences
            </button>
          </form>
        </div>

      </div>
    </div>
  `;
}

export function initUserSettingsEvents() {
  document.getElementById('user-settings-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('user-set-name')?.value.trim();
    const email = document.getElementById('user-set-email')?.value.trim();
    const avatar = document.getElementById('user-set-avatar')?.value.trim();

    if (state.currentUser) {
      state.currentUser.name = name;
      state.currentUser.email = email;
      if (avatar) state.currentUser.avatar = avatar;
      state.notify('USER_UPDATED', state.currentUser);
    }
    Toast.show('Account preferences saved successfully!', 'success');
  });
}
