// PaymentFailedPage Component
import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';

export function renderPaymentFailedPage() {
  updateSEO({
    title: 'Payment Incomplete',
    description: 'The transaction could not be completed.'
  });

  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const bookSlug = urlParams.get('book_slug') || '';
  const book = state.getBookBySlug(bookSlug) || state.books[0];

  return `
    <div class="payment-failed-page animate-fade-in" style="background: var(--bg-secondary); min-height: 80vh; display: flex; align-items: center; justify-content: center; padding: 4rem 0;">
      <div class="container" style="max-width: 540px; text-align: center;">
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 3rem 2rem; box-shadow: var(--shadow-sm);">
          <div style="width: 64px; height: 64px; border-radius: 99px; background: #FEF2F2; color: #DC2626; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <h2 style="font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">
            Payment Incomplete
          </h2>
          <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 2rem;">
            We could not complete your transaction on Cashfree. No charges were made to your account.
          </p>
          <div style="display: flex; justify-content: center; gap: 1rem;">
            <a href="#/checkout/${book.slug || book.id}" class="btn btn-primary btn-lg">Try Checkout Again</a>
            <a href="#/explore" class="btn btn-secondary btn-lg">Browse Catalog</a>
          </div>
        </div>
      </div>
    </div>
  `;
}
