// CheckoutPage Component
import { state } from '../state.js';
import { formatPrice } from '../utils/formatters.js';
import { updateSEO } from '../utils/seo.js';
import { CashfreeModal } from '../components/CashfreeModal.js';
import { Toast } from '../components/Toast.js';

export function renderCheckoutPage(slug) {
  const book = state.getBookBySlug(slug);
  if (!book) {
    return `<div class="container" style="padding: 5rem 0; text-align: center;"><h2>eBook Not Found</h2><a href="#/explore" class="btn btn-primary">Browse Catalog</a></div>`;
  }

  updateSEO({
    title: `Checkout: ${book.title}`,
    description: `Secure checkout for ${book.title} on Bookora.`
  });

  const basePrice = book.sale_price || book.price;

  return `
    <div class="checkout-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 980px;">
        
        <div style="margin-bottom: 2rem;">
          <a href="#/book/${book.slug || book.id}" style="font-size: 0.85rem; font-weight: 600; color: var(--accent);">
            ← Back to Product Page
          </a>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin-top: 0.5rem;">
            Secure Checkout
          </h1>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 380px; gap: 2.5rem; align-items: start;" class="checkout-layout">
          
          <!-- LEFT: Billing & Contact Details Form -->
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2rem; box-shadow: var(--shadow-sm);">
            
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1.25rem;">
              1. Customer & License Information
            </h3>

            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.825rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.4rem;">Full Name</label>
              <input type="text" id="checkout-name" value="${state.currentUser?.name || ''}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem;" />
            </div>

            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.825rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.4rem;">Email Address (eBook delivery & license)</label>
              <input type="email" id="checkout-email" value="${state.currentUser?.email || ''}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem;" />
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
                Your unique cryptographic license key and download link will be registered to this email.
              </div>
            </div>

            <div style="margin-bottom: 2rem;">
              <label style="display: block; font-size: 0.825rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.4rem;">Country / Region</label>
              <select style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem; background: #FFFFFF;">
                <option value="US">United States</option>
                <option value="IN" selected>India</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="DE">Germany</option>
              </select>
            </div>

            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1rem;">
              2. Payment Processor
            </h3>

            <div style="background: var(--bg-secondary); border: 2px solid var(--accent); border-radius: var(--radius-lg); padding: 1.25rem; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 0.85rem;">
                <div style="width: 40px; height: 40px; border-radius: 8px; background: #1E3A8A; color: #FFFFFF; font-weight: 900; font-size: 0.75rem; display: flex; align-items: center; justify-content: center;">
                  CF
                </div>
                <div>
                  <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">Cashfree Payment Gateway</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">UPI, Cards, NetBanking & Wallets</div>
                </div>
              </div>
              <span class="badge badge-featured" style="font-size: 0.7rem;">Verified SSL</span>
            </div>

          </div>

          <!-- RIGHT: Order Summary Card -->
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2rem; box-shadow: var(--shadow-sm); position: sticky; top: 90px;">
            
            <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
              Order Summary
            </h3>

            <!-- Book Snippet -->
            <div style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
              <div style="width: 52px; height: 70px; border-radius: 6px; background: ${book.cover_gradient}; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.15);"></div>
              <div>
                <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); line-height: 1.3;">${book.title}</h4>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">by ${book.author}</div>
                <div style="font-size: 0.75rem; font-weight: 600; color: var(--accent); margin-top: 4px;">${book.format || 'PDF + EPUB'}</div>
              </div>
            </div>

            <!-- Coupon Code Form -->
            <div style="margin-bottom: 1.5rem;">
              <div style="display: flex; gap: 0.5rem;">
                <input type="text" id="coupon-input" placeholder="Promo code (e.g. BOOKORA20)" style="flex: 1; padding: 0.5rem 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.85rem;" />
                <button type="button" id="apply-coupon-btn" class="btn btn-secondary btn-sm" style="font-weight: 700;">Apply</button>
              </div>
              <div id="coupon-message" style="font-size: 0.75rem; margin-top: 4px;"></div>
            </div>

            <!-- Calculations -->
            <div style="display: flex; flex-direction: column; gap: 0.65rem; border-top: 1px solid var(--border-subtle); padding-top: 1rem; margin-bottom: 1.5rem; font-size: 0.9rem;">
              <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
                <span>Subtotal</span>
                <span>${formatPrice(basePrice)}</span>
              </div>
              <div id="discount-row" style="display: none; justify-content: space-between; color: #059669; font-weight: 600;">
                <span>Promo Discount (20%)</span>
                <span id="discount-amount">-$0.00</span>
              </div>
              <div style="display: flex; justify-content: space-between; color: var(--text-secondary);">
                <span>Digital VAT / GST</span>
                <span style="color: #059669; font-weight: 600;">Included ($0.00)</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1.25rem; color: var(--text-primary); border-top: 1px solid var(--border-subtle); padding-top: 0.75rem;">
                <span>Total Due</span>
                <span id="checkout-total-price" style="color: var(--accent);">${formatPrice(basePrice)}</span>
              </div>
            </div>

            <!-- Cashfree Checkout Button -->
            <button id="trigger-cashfree-btn" class="btn btn-primary btn-lg" style="width: 100%; padding: 0.85rem; font-weight: 800; font-size: 1rem;">
              Proceed to Cashfree Pay
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </button>

            <div style="text-align: center; margin-top: 1rem; font-size: 0.72rem; color: var(--text-muted);">
              Instant library delivery immediately upon verified transaction.
            </div>

          </div>

        </div>

      </div>
    </div>
  `;
}

export function initCheckoutEvents(slug) {
  const book = state.getBookBySlug(slug);
  if (!book) return;

  let currentTotal = book.sale_price || book.price;
  let discountApplied = false;

  const couponBtn = document.getElementById('apply-coupon-btn');
  const couponInput = document.getElementById('coupon-input');
  const couponMsg = document.getElementById('coupon-message');
  const discountRow = document.getElementById('discount-row');
  const discountAmt = document.getElementById('discount-amount');
  const totalLabel = document.getElementById('checkout-total-price');

  couponBtn?.addEventListener('click', () => {
    const code = (couponInput?.value || '').trim().toUpperCase();
    if (code === 'BOOKORA20') {
      discountApplied = true;
      const discount = currentTotal * 0.20;
      const finalPrice = currentTotal - discount;

      if (discountRow) discountRow.style.display = 'flex';
      if (discountAmt) discountAmt.textContent = `-${formatPrice(discount)}`;
      if (totalLabel) totalLabel.textContent = formatPrice(finalPrice);
      if (couponMsg) {
        couponMsg.style.color = '#059669';
        couponMsg.textContent = '✓ 20% discount coupon applied successfully!';
      }
      Toast.show('Promo code BOOKORA20 applied: 20% OFF!', 'success');
    } else {
      if (couponMsg) {
        couponMsg.style.color = '#DC2626';
        couponMsg.textContent = 'Invalid promo code. Try "BOOKORA20"';
      }
    }
  });

  document.getElementById('trigger-cashfree-btn')?.addEventListener('click', () => {
    CashfreeModal.open(book);
  });
}
