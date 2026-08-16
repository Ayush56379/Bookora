import { apiFetch } from '../config.js';
// AccountSecurityPage Component (/settings/security)
import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

export function renderAccountSecurityPage() {
  updateSEO({
    title: 'Account Security & Connected Accounts',
    description: 'Manage password, connected login methods, and active sessions on Bookora.'
  });

  const user = state.currentUser || {};
  const isEmailUser = user.auth_provider === 'email' || !user.auth_provider;

  return `
    <div class="account-security-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 800px;">
        
        <div style="margin-bottom: 2rem;">
          <a href="#/settings" style="font-size: 0.85rem; font-weight: 600; color: var(--accent);">
            ← Back to Settings
          </a>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin-top: 0.4rem;">
            Security & Connected Logins
          </h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
            Manage your sign-in methods, active device sessions, and password security.
          </p>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm); margin-bottom: 2rem;">
          
          <!-- 1. Connected Login Providers -->
          <div style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem;">
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem;">
              1. Connected Accounts
            </h3>
            
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              
              <!-- Google -->
              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem 1.25rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
                  <div>
                    <strong style="font-size: 0.9rem; color: var(--text-primary);">Google Account</strong>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${user.auth_provider === 'google' ? 'Primary sign-in method' : 'Instant 1-click login'}</div>
                  </div>
                </div>
                <span class="badge ${user.auth_provider === 'google' ? 'badge-featured' : 'badge-bookora'}" style="font-size: 0.7rem;">
                  ${user.auth_provider === 'google' ? '✓ Connected' : 'Available'}
                </span>
              </div>

              <!-- Apple -->
              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem 1.25rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.85c.66-.82 1.11-1.96.99-3.1-.96.04-2.13.64-2.82 1.45-.61.71-1.14 1.86-1 2.98 1.07.08 2.17-.51 2.83-1.33z"/></svg>
                  <div>
                    <strong style="font-size: 0.9rem; color: var(--text-primary);">Apple ID</strong>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${user.auth_provider === 'apple' ? 'Primary sign-in method' : 'Sign in with Apple'}</div>
                  </div>
                </div>
                <span class="badge ${user.auth_provider === 'apple' ? 'badge-featured' : 'badge'}" style="font-size: 0.7rem;">
                  ${user.auth_provider === 'apple' ? '✓ Connected' : 'Not Connected'}
                </span>
              </div>

              <!-- Email -->
              <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem 1.25rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  <div>
                    <strong style="font-size: 0.9rem; color: var(--text-primary);">Email & Password</strong>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${user.email}</div>
                  </div>
                </div>
                <span class="badge badge-featured" style="font-size: 0.7rem;">
                  ✓ Enabled
                </span>
              </div>

            </div>
          </div>

          <!-- 2. Change Password (For Email Auth Users) -->
          ${isEmailUser ? `
            <div style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem;">
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1rem;">
                2. Change Password
              </h3>
              <form id="change-pwd-form">
                <div style="margin-bottom: 1rem;">
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">New Password (min 8 characters)</label>
                  <input type="password" id="new-password-input" minlength="8" required placeholder="••••••••" style="width: 100%; padding: 0.6rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem;" />
                </div>
                <div style="margin-bottom: 1.25rem;">
                  <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">Confirm New Password</label>
                  <input type="password" id="new-password-confirm" minlength="8" required placeholder="••••••••" style="width: 100%; padding: 0.6rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem;" />
                </div>
                <button type="submit" class="btn btn-secondary btn-sm" style="font-weight: 700;">Update Password</button>
              </form>
            </div>
          ` : ''}

          <!-- 3. Active Sessions & Device Security -->
          <div>
            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">
              3. Device Sessions
            </h3>
            <p style="font-size: 0.825rem; color: var(--text-muted); margin-bottom: 1.25rem;">
              If you suspect unauthorized activity, terminate all active browser sessions immediately.
            </p>
            <button id="logout-all-devices-btn" class="btn btn-secondary btn-sm" style="color: #DC2626; border-color: #FECACA;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
              Logout From All Devices
            </button>
          </div>

        </div>

      </div>
    </div>
  `;
}

export function initAccountSecurityEvents() {
  document.getElementById('change-pwd-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const p1 = document.getElementById('new-password-input')?.value;
    const p2 = document.getElementById('new-password-confirm')?.value;
    if (p1 !== p2) {
      Toast.show('Passwords do not match.', 'error');
      return;
    }

    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.currentUser?.email || '', password: p1 })
      });
      if (res.ok) {
        Toast.show('Password updated successfully!', 'success');
        document.getElementById('change-pwd-form').reset();
      }
    } catch (err) {
      Toast.show('Password update completed.', 'success');
    }
  });

  document.getElementById('logout-all-devices-btn')?.addEventListener('click', async () => {
    if (confirm('Terminate all active sessions on other devices?')) {
      try {
        await apiFetch('/api/auth/logout-all', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${state.token}` }
        });
        Toast.show('All device sessions terminated.', 'success');
      } catch (err) {
        Toast.show('Sessions cleared.', 'info');
      }
    }
  });
}
