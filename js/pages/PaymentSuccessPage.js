// PaymentSuccessPage Component
import { state } from '../state.js';
import { formatPrice } from '../utils/formatters.js';
import { ReaderModal } from '../components/ReaderModal.js';
import { downloadEBook } from '../utils/pdfDownloader.js';

export function renderPaymentSuccessPage() {
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const orderId = urlParams.get('order_id') || 'ORD-' + Math.floor(100000 + Math.random() * 900000);
  const bookSlug = urlParams.get('book_slug') || 'the-30-day-productivity-reset';
  const book = state.getBookBySlug(bookSlug) || state.books[0];

  return `
    <div class="payment-success-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 4rem 0 6rem 0; display: flex; align-items: center;">
      <div class="container" style="max-width: 680px;">
        
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 3rem 2.5rem; text-align: center; box-shadow: var(--shadow-lg);">
          
          <!-- Animated Checkmark Icon -->
          <div style="width: 72px; height: 72px; border-radius: 99px; background: #ECFDF5; border: 2px solid #A7F3D0; color: #059669; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>

          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">
            Payment Successful!
          </h1>
          <p style="font-size: 1.05rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 2rem;">
            Thank you for your purchase. Your digital edition of <strong>${book.title}</strong> has been unlocked and added to your permanent library.
          </p>

          <!-- Receipt Details Strip -->
          <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.25rem; text-align: left; margin-bottom: 2.25rem; font-size: 0.875rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="color: var(--text-muted);">Order ID:</span>
              <strong style="color: var(--text-primary); font-family: monospace;">${orderId}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="color: var(--text-muted);">Payment Gateway:</span>
              <strong style="color: #1E3A8A;">Cashfree (Verified)</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <span style="color: var(--text-muted);">Purchaser Account:</span>
              <span style="color: var(--text-primary);">${state.currentUser?.email || 'your email'}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-muted);">Amount Paid:</span>
              <strong style="color: var(--accent);">${formatPrice(book.sale_price || book.price)}</strong>
            </div>
          </div>

          <!-- Actions -->
          <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem;">
            <button id="success-read-btn" class="btn btn-primary btn-lg" style="padding: 0.85rem 2rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              Read eBook Now
            </button>
            <button id="success-download-btn" class="btn btn-secondary btn-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download PDF Edition
            </button>
            <a href="#/library" class="btn btn-ghost btn-lg">
              Go to My Library →
            </a>
          </div>

        </div>

      </div>
    </div>
  `;
}

export function initPaymentSuccessEvents() {
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const bookSlug = urlParams.get('book_slug') || 'the-30-day-productivity-reset';
  const book = state.getBookBySlug(bookSlug) || state.books[0];

  document.getElementById('success-read-btn')?.addEventListener('click', () => {
    ReaderModal.open(book, false);
  });

  document.getElementById('success-download-btn')?.addEventListener('click', () => {
    downloadEBook(book, state.currentUser);
  });
}
