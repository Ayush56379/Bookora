// SellerPages Component (/seller/*)
import { state } from '../state.js';
import { formatPrice, formatDate } from '../utils/formatters.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

export function renderSellerWalletPage() {
  updateSEO({ title: 'Seller Wallet & Payouts', description: 'Track your earnings and request bank withdrawals.' });
  const user = state.currentUser || {};

  return `
    <div class="seller-wallet-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 840px;">
        <div style="margin-bottom: 2.5rem;">
          <a href="#/creator/dashboard" style="font-size: 0.85rem; font-weight: 600; color: var(--accent);">← Back to Studio</a>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin-top: 0.4rem;">
            Earnings & Wallet
          </h1>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm); margin-bottom: 2rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
            <div>
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Available Balance</span>
              <div style="font-size: 2.4rem; font-weight: 900; color: #16A34A; font-family: var(--font-display);">₹0.00</div>
            </div>
            <button id="withdraw-btn" class="btn btn-primary btn-lg" style="font-weight: 700;">Request Payout</button>
          </div>

          <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">
            Payouts are processed daily via Cashfree Direct Bank Settlement. Minimum withdrawal threshold is ₹100.00.
          </div>
        </div>
      </div>
    </div>
  `;
}

export function initSellerWalletEvents() {
  document.getElementById('withdraw-btn')?.addEventListener('click', () => {
    Toast.show('Available balance is ₹0.00. Payouts unlock upon completed sales.', 'info');
  });
}
