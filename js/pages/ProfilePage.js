// ProfilePage Component (/profile)
import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

export function renderProfilePage() {
  updateSEO({
    title: 'My Profile & Account',
    description: 'View your Bookora identity, reading credentials, and author status.'
  });

  const user = state.currentUser || {};
  const isAdmin = state.isAdmin;
  const isSeller = state.isSeller;
  const firebasePhotoURL = (() => {
    try { return String(window.firebase?.auth?.()?.currentUser?.photoURL || '').trim(); } catch (_) { return ''; }
  })();
  // Firebase Auth photo is authoritative for Google accounts. Never use a random image.
  const profilePhotoURL = String(firebasePhotoURL || user.photoURL || '').trim();

  return `
    <div class="profile-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 780px;">
        
        <!-- Header -->
        <div style="margin-bottom: 2.5rem;">
          <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">User Profile</div>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
            My Profile
          </h1>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm); margin-bottom: 2rem;">
          
          <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 2rem;">
            <img src="${profilePhotoURL}" alt="${user.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" style="width: 80px; height: 80px; border-radius: 99px; object-fit: cover; border: 3px solid #EFF6FF; ${profilePhotoURL ? '' : 'display:none;'}" />
            <div class="profile-avatar-fallback" style="width:80px;height:80px;border-radius:99px;border:3px solid #EFF6FF;display:${profilePhotoURL ? 'none' : 'flex'};align-items:center;justify-content:center;background:var(--bg-secondary);color:var(--text-secondary);font-weight:800;font-size:1.2rem;">${String(user.name || 'U').trim().charAt(0).toUpperCase()}</div>
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary);">${user.name}</h2>
                <span class="badge ${isAdmin ? 'badge-bookora' : isSeller ? 'badge-external' : 'badge-new'}" style="font-size: 0.7rem;">
                  ${isAdmin ? 'ADMIN' : isSeller ? 'SELLER' : 'BUYER'}
                </span>
              </div>
              <div style="font-size: 0.9rem; color: var(--text-muted);">${user.email}</div>
              <div style="font-size: 0.75rem; color: #16A34A; font-weight: 600; margin-top: 4px;">✓ Email Verified</div>
            </div>
          </div>

          <!-- Account Overview Cards -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 2rem;">
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Authentication Method</div>
              <strong style="font-size: 1rem; color: var(--text-primary); text-transform: capitalize;">${user.auth_provider || 'Email + Password'}</strong>
            </div>
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Creator Privilege</div>
              <strong style="font-size: 1rem; color: ${isSeller ? '#6D28D9' : 'var(--text-secondary)'}; text-transform: capitalize;">
                ${isSeller ? 'Verified Author' : user.seller_status === 'pending' ? 'Application Under Review' : 'Reader (Apply below)'}
              </strong>
            </div>
          </div>

          <!-- Actions -->
          <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
            <a href="#/settings" class="btn btn-primary btn-sm">Edit Profile & Preferences</a>
            <a href="#/settings/security" class="btn btn-secondary btn-sm">Security & Connected Accounts</a>
            ${!isSeller && !isAdmin ? `
              <a href="#/seller/apply" class="btn btn-external btn-sm">+ Apply to Become a Seller</a>
            ` : ''}
          </div>

        </div>

      </div>
    </div>
  `;
}
