// SellerSettingsPage Component (Store Profile & Bank Payouts)
import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

export function renderSellerSettingsPage() {
  updateSEO({
    title: 'Seller Store Settings & Payouts',
    description: 'Configure your author store branding and verified bank payout information.'
  });

  const user = state.currentUser || {};

  return `
    <div class="seller-settings-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 820px;">
        
        <!-- Header -->
        <div style="margin-bottom: 2.5rem;">
          <div class="badge badge-external" style="margin-bottom: 0.5rem;">Seller Studio</div>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
            Author & Store Settings
          </h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
            Manage public author details and secure Cashfree bank payout credentials.
          </p>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm);">
          <form id="seller-settings-form">
            
            <!-- Store Profile -->
            <div style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem;">
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.25rem;">
                1. Author & Store Branding
              </h3>

              <div style="margin-bottom: 1.25rem;">
                <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Store / Publisher Name</label>
                <input type="text" id="seller-set-storename" value="${user.store_name || user.name + ' Publications'}" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
              </div>

              <div style="margin-bottom: 1.25rem;">
                <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Author Bio & Credentials</label>
                <textarea id="seller-set-bio" rows="3" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;">${user.bio || 'Bookora Verified Author'}</textarea>
              </div>
            </div>

            <!-- Payout Information -->
            <div style="margin-bottom: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem;">
              <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">
                2. Cashfree Payout Bank Account
              </h3>
              <p style="font-size: 0.825rem; color: var(--text-muted); margin-bottom: 1.25rem;">
                Your 85% royalties will be deposited directly into this account via Cashfree Payouts.
              </p>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem;">
                <div>
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Bank Name</label>
                  <input type="text" id="seller-set-bankname" placeholder="e.g. HDFC Bank, SBI, ICICI" value="${user.payout_bank || ''}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                </div>
                <div>
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Account Number</label>
                  <input type="text" id="seller-set-accnum" placeholder="Account Number" value="${user.payout_account || ''}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; font-family: monospace;" />
                </div>
              </div>
            </div>

            <!-- Submit -->
            <button type="submit" class="btn btn-primary btn-lg" style="font-weight: 700;">
              Save Store & Payout Details
            </button>
          </form>
        </div>

      </div>
    </div>
  `;
}

export function initSellerSettingsEvents() {
  document.getElementById('seller-settings-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const storeName = document.getElementById('seller-set-storename')?.value.trim();
    const bio = document.getElementById('seller-set-bio')?.value.trim();
    const bank = document.getElementById('seller-set-bankname')?.value.trim();
    const acc = document.getElementById('seller-set-accnum')?.value.trim();

    if (state.currentUser) {
      state.currentUser.store_name = storeName;
      state.currentUser.bio = bio;
      state.currentUser.payout_bank = bank;
      state.currentUser.payout_account = acc;
      state.notify('USER_UPDATED', state.currentUser);
    }
    Toast.show('Author store & payout settings saved successfully!', 'success');
  });
}
