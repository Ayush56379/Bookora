// User Dashboard & Profile Page
import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

export function renderDashboardPage() {
  updateSEO({
    title: 'Account Dashboard & Settings',
    description: 'Manage your profile and reading preferences on Bookora.'
  });

  const user = state.currentUser || { name: 'User', email: '', avatar: '', role: 'buyer' };

  return `
    <div class="user-dashboard animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 780px;">
        
        <div style="margin-bottom: 2.5rem;">
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
            Account Dashboard
          </h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
            Manage your personal profile, credentials, and notifications.
          </p>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm);">
          
          <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem;">
            <img src="${user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}" alt="${user.name}" style="width: 72px; height: 72px; border-radius: 99px; object-fit: cover;" />
            <div>
              <h2 style="font-size: 1.3rem; font-weight: 800; color: var(--text-primary);">${user.name}</h2>
              <div style="font-size: 0.85rem; color: var(--text-muted);">${user.email}</div>
              <span class="badge badge-bookora" style="font-size: 0.7rem; margin-top: 4px;">Role: ${user.role.toUpperCase()}</span>
            </div>
          </div>

          <form id="profile-edit-form">
            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Display Name</label>
              <input type="text" id="profile-name" value="${user.name}" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
            </div>

            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Email Address</label>
              <input type="email" id="profile-email" value="${user.email}" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
            </div>

            <button type="submit" class="btn btn-primary">
              Save Profile Changes
            </button>
          </form>

        </div>

      </div>
    </div>
  `;
}

export function initDashboardEvents() {
  document.getElementById('profile-edit-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('profile-name').value.trim();
    const email = document.getElementById('profile-email').value.trim();
    state.currentUser.name = name;
    state.currentUser.email = email;
    state.notify('USER_UPDATED', state.currentUser);
    Toast.show('Profile updated successfully!', 'success');
  });
}
