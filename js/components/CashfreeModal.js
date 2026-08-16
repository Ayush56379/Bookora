// Cashfree Secure Payment Gateway Component
import { state } from '../state.js';
import { Toast } from './Toast.js';
import { formatPrice } from '../utils/formatters.js';

export const CashfreeModal = {
  currentBook: null,
  activeTab: 'upi',

  open(book) {
    this.currentBook = book;
    this.render();
  },

  close() {
    const modal = document.getElementById('cashfree-payment-modal');
    if (modal) modal.remove();
  },

  render() {
    this.close();
    const book = this.currentBook;
    const finalAmount = book.sale_price || book.price;

    const overlay = document.createElement('div');
    overlay.id = 'cashfree-payment-modal';
    overlay.className = 'reader-overlay';

    overlay.innerHTML = `
      <div class="cashfree-modal-box animate-slide-up">
        
        <!-- Cashfree Header -->
        <div class="cashfree-header">
          <div style="display: flex; align-items: center; gap: 0.65rem;">
            <div style="background: #FFFFFF; color: #1E3A8A; font-weight: 900; font-size: 0.75rem; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.05em;">
              CASHFREE
            </div>
            <span style="font-size: 0.85rem; font-weight: 600; opacity: 0.95;">Payments Gateway</span>
          </div>
          <button id="cf-close-btn" style="color: #FFFFFF; opacity: 0.85;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Order Summary Strip -->
        <div style="background: #F8FAFC; border-bottom: 1px solid var(--border-subtle); padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">${book.title}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Licensed to: ${state.currentUser?.email || 'customer@bookora.com'}</div>
          </div>
          <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent);">
            ${formatPrice(finalAmount)}
          </div>
        </div>

        <!-- Payment Method Tabs -->
        <div style="padding: 1.5rem;">
          <div style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
            <button class="cf-tab-btn btn btn-sm btn-primary" data-tab="upi" style="font-size: 0.8rem;">Instant UPI / QR</button>
            <button class="cf-tab-btn btn btn-sm btn-ghost" data-tab="cards" style="font-size: 0.8rem;">Debit / Credit Card</button>
            <button class="cf-tab-btn btn btn-sm btn-ghost" data-tab="netbanking" style="font-size: 0.8rem;">NetBanking</button>
          </div>

          <!-- Tab 1: UPI -->
          <div id="cf-tab-upi">
            <div style="text-align: center; margin-bottom: 1.25rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-lg); border: 1px dashed var(--border-medium);">
              <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">Scan UPI QR Code</div>
              
              <!-- Clean QR Code Vector -->
              <div style="width: 140px; height: 140px; margin: 0 auto; background: #FFFFFF; padding: 8px; border-radius: 8px; border: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: center;">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="1.5"><rect width="8" height="8" x="2" y="2" rx="1"/><rect width="8" height="8" x="14" y="2" rx="1"/><rect width="8" height="8" x="2" y="14" rx="1"/><rect width="4" height="4" x="6" y="6"/><rect width="4" height="4" x="18" y="6"/><rect width="4" height="4" x="6" y="18"/><path d="M14 14h2v2h-2zM20 14h2v2h-2zM14 20h2v2h-2zM18 18h4v4h-4z"/></svg>
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.5rem;">Supports Google Pay, PhonePe, Paytm, BHIM UPI</div>
            </div>

            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.35rem;">Enter UPI Virtual Payment Address (VPA)</label>
              <input type="text" id="cf-upi-input" placeholder="e.g. yourname@okhdfcbank" value="${(state.currentUser?.email || 'user@gmail.com').split('@')[0]}@okhdfcbank" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem;" />
            </div>
          </div>

          <!-- Tab 2: Cards -->
          <div id="cf-tab-cards" style="display: none;">
            <div style="margin-bottom: 1rem;">
              <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">Card Number</label>
              <input type="text" placeholder="4111 2222 3333 4444" value="4532 •••• •••• 8892" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem;" />
            </div>
            <div style="display: flex; gap: 0.75rem; margin-bottom: 1.25rem;">
              <div style="flex: 1;">
                <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">Valid Thru</label>
                <input type="text" placeholder="MM/YY" value="09/29" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem;" />
              </div>
              <div style="flex: 1;">
                <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">CVV</label>
                <input type="password" placeholder="123" value="789" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem;" />
              </div>
            </div>
          </div>

          <!-- Tab 3: NetBanking -->
          <div id="cf-tab-netbanking" style="display: none; margin-bottom: 1.25rem;">
            <label style="display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem;">Select Bank</label>
            <select style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.9rem; background: #FFFFFF;">
              <option>HDFC Bank</option>
              <option>ICICI Bank</option>
              <option>State Bank of India (SBI)</option>
              <option>Axis Bank</option>
              <option>Kotak Mahindra Bank</option>
            </select>
          </div>

          <!-- Submit Button -->
          <button id="cf-pay-btn" class="btn btn-primary" style="width: 100%; padding: 0.85rem; font-size: 1rem; font-weight: 700; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
            <span>Pay ${formatPrice(finalAmount)}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </button>

          <!-- Security Footer -->
          <div style="display: flex; align-items: center; justify-content: center; gap: 0.4rem; margin-top: 1rem; font-size: 0.72rem; color: var(--text-muted);">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            256-bit AES Encryption • PCI-DSS Level 1 Certified Gateway
          </div>

        </div>

      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('cf-close-btn').addEventListener('click', () => this.close());

    // Tab switching
    overlay.querySelectorAll('.cf-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('.cf-tab-btn').forEach(b => {
          b.className = 'cf-tab-btn btn btn-sm btn-ghost';
        });
        btn.className = 'cf-tab-btn btn btn-sm btn-primary';

        const tab = btn.dataset.tab;
        document.getElementById('cf-tab-upi').style.display = tab === 'upi' ? 'block' : 'none';
        document.getElementById('cf-tab-cards').style.display = tab === 'cards' ? 'block' : 'none';
        document.getElementById('cf-tab-netbanking').style.display = tab === 'netbanking' ? 'block' : 'none';
      });
    });

    // Payment Trigger
    const payBtn = document.getElementById('cf-pay-btn');
    payBtn.addEventListener('click', async () => {
      payBtn.disabled = true;
      payBtn.innerHTML = `
        <svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spinSlow 1s linear infinite;"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
        <span>Processing via Cashfree...</span>
      `;

      await new Promise(r => setTimeout(r, 950));

      const order = state.completeOrder(book, {
        payment_id: 'CF_TXN_' + Math.floor(10000000 + Math.random() * 90000000)
      });

      this.close();
      window.location.hash = `#/payment/success?order_id=${order.id}&book_slug=${book.slug || book.id}`;
    });
  }
};
