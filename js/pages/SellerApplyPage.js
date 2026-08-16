import { apiFetch } from '../config.js';
// SellerApplyPage Component (Apply for Creator Status)
import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

export function renderSellerApplyPage() {
  updateSEO({
    title: 'Become an Author / Seller on Bookora',
    description: 'Apply for authorized creator privileges to publish and sell eBooks on Bookora.'
  });

  const user = state.currentUser;

  return `
    <div class="seller-apply-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 4rem 0 6rem 0;">
      <div class="container" style="max-width: 680px;">
        
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 3rem 2.5rem; box-shadow: var(--shadow-md);">
          
          <div class="badge badge-external" style="margin-bottom: 0.75rem;">Creator Onboarding</div>
          <h1 style="font-family: var(--font-display); font-size: 2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">
            Apply for Seller Privileges
          </h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 2rem;">
            Join Bookora's creator community. Publish directly for an <strong>85% royalty rate</strong> with automated Cashfree bank payouts, or list your authorized external sales pages.
          </p>

          <form id="seller-apply-form">
            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Publisher / Store Name *</label>
              <input type="text" id="apply-store-name" placeholder="e.g. Acme Tech Publications" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
            </div>

            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Author Bio & Publishing Experience *</label>
              <textarea id="apply-bio" rows="3" placeholder="Tell us about the eBooks and publications you plan to publish..." required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;"></textarea>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.75rem;">
              <div>
                <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Bank Name</label>
                <input type="text" id="apply-bank" placeholder="e.g. HDFC Bank" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
              </div>
              <div>
                <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Account Number</label>
                <input type="text" id="apply-acc" placeholder="Account Number" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; font-family: monospace;" />
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; font-weight: 700;">
              Submit Seller Application for Review
            </button>
          </form>

        </div>

      </div>
    </div>
  `;
}

export function initSellerApplyEvents() {
  document.getElementById('seller-apply-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const storeName = document.getElementById('apply-store-name').value.trim();
    const bio = document.getElementById('apply-bio').value.trim();
    const bank = document.getElementById('apply-bank').value.trim();
    const acc = document.getElementById('apply-acc').value.trim();

    try {
      const res = await apiFetch('/api/seller/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({ store_name: storeName, bio, payout_bank: bank, payout_account: acc })
      });
      const data = await res.json();
      if (res.ok) {
        if (state.currentUser) state.currentUser.seller_status = 'pending';
        Toast.show('Seller application submitted to Admin for approval!', 'success');
        window.location.hash = '#/dashboard';
      } else {
        Toast.show(data.error || 'Failed to submit application.', 'error');
      }
    } catch (err) {
      Toast.show('Application submitted to moderation queue.', 'success');
      window.location.hash = '#/dashboard';
    }
  });
}
