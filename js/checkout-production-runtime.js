// Bookora production checkout runtime.
// Must load before payment-runtime.js so it owns checkout/coupon clicks.
import { state } from './state.js';
import { Toast } from './components/Toast.js';

const API = (window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com').replace(/\/$/, '');

async function backend(path, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) };
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(`${API}${path}`, { ...options, headers, cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Backend request failed.');
  return data;
}

function bookFromCheckout() {
  const match = (location.hash || '').match(/^#\/checkout\/([^?]+)/);
  if (!match) return null;
  try { return state.getBookBySlug(decodeURIComponent(match[1])); } catch (_) { return null; }
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(-10);
  return digits.length === 10 ? digits : '';
}

function ensureCheckoutPhoneField() {
  if (!location.hash.startsWith('#/checkout/')) return;
  const email = document.getElementById('checkout-email');
  if (!email || document.getElementById('checkout-phone-wrap')) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'checkout-phone-wrap';
  wrapper.style.cssText = 'margin-bottom:1.25rem;';
  const initialPhone = normalizePhone(
    state.currentUser?.phone || state.currentUser?.phoneNumber || state.currentUser?.mobile || ''
  );
  wrapper.innerHTML = `
    <label for="checkout-phone" style="display:block;font-size:.825rem;font-weight:600;color:var(--text-secondary);margin-bottom:.4rem;">
      Mobile Number <span style="color:#DC2626;">*</span>
    </label>
    <input type="tel" id="checkout-phone" inputmode="numeric" autocomplete="tel" maxlength="10"
      value="${initialPhone}"
      placeholder="Enter 10-digit mobile number"
      aria-describedby="checkout-phone-help"
      style="width:100%;padding:.65rem .85rem;border-radius:var(--radius-md);border:1px solid var(--border-medium);font-size:.9rem;box-sizing:border-box;" />
    <div id="checkout-phone-help" style="font-size:.75rem;color:var(--text-muted);margin-top:.35rem;">
      This number will be used for your Cashfree payment and order confirmation.
    </div>
  `;
  email.parentElement?.insertAdjacentElement('afterend', wrapper);
}

function getCheckoutPhone() {
  ensureCheckoutPhoneField();
  return normalizePhone(document.getElementById('checkout-phone')?.value || '');
}

function setCheckoutTotals(data) {
  const subtotal = document.getElementById('checkout-subtotal-price');
  const discount = document.getElementById('discount-amount');
  const total = document.getElementById('checkout-total-price');
  const row = document.getElementById('discount-row');
  const message = document.getElementById('coupon-message');
  const fmt = n => `₹${Number(n || 0).toFixed(2)}`;
  if (subtotal) subtotal.textContent = fmt(data.subtotal);
  if (discount) discount.textContent = `-${fmt(data.discount)}`;
  if (total) total.textContent = fmt(data.total);
  if (row) row.style.display = Number(data.discount) > 0 ? 'flex' : 'none';
  if (message) {
    message.textContent = data.coupon_message || '';
    message.style.color = data.coupon_valid ? '#059669' : '#DC2626';
  }
  window.__bookoraCheckoutBasePrice = Number(data.subtotal || 0);
  window.__bookoraCheckoutFinalPrice = Number(data.total || 0);
  window.__bookoraCheckoutCoupon = data.coupon_valid ? String(data.coupon_code || '').toUpperCase() : '';
}

async function applyCoupon(button) {
  const book = bookFromCheckout();
  const input = document.getElementById('coupon-input');
  const code = String(input?.value || '').trim().toUpperCase();
  if (!book) return;
  if (!code) {
    Toast.show('Enter a coupon code first.', 'info');
    return;
  }
  button.disabled = true;
  const old = button.textContent;
  button.textContent = 'Checking...';
  try {
    const result = await backend('/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ book_id: book.id, coupon_code: code })
    });
    setCheckoutTotals(result);
    Toast.show(result.coupon_message || 'Coupon checked.', result.coupon_valid ? 'success' : 'error');
  } catch (error) {
    const message = document.getElementById('coupon-message');
    if (message) { message.textContent = error.message; message.style.color = '#DC2626'; }
    Toast.show(error.message || 'Coupon could not be validated.', 'error');
  } finally {
    button.disabled = false;
    button.textContent = old;
  }
}

async function startCheckout(button) {
  const book = bookFromCheckout();
  if (!book) { Toast.show('Book information could not be found. Please reopen checkout.', 'error'); return; }
  ensureCheckoutPhoneField();
  if (!state.token) { Toast.show('Please sign in to continue.', 'info'); return; }

  const phone = getCheckoutPhone();
  if (!phone) {
    const input = document.getElementById('checkout-phone');
    input?.focus();
    if (input) input.style.borderColor = '#DC2626';
    Toast.show('Please enter a valid 10-digit mobile number.', 'error');
    return;
  }
  const phoneInput = document.getElementById('checkout-phone');
  if (phoneInput) phoneInput.style.borderColor = 'var(--border-medium)';

  button.disabled = true;
  const old = button.textContent;
  button.textContent = 'Creating secure payment...';
  try {
    const coupon = String(window.__bookoraCheckoutCoupon || document.getElementById('coupon-input')?.value || '').trim().toUpperCase();
    const created = await backend('/api/cashfree/create-order', {
      method: 'POST',
      body: JSON.stringify({
        book_id: book.id,
        coupon_code: coupon,
        phone
      })
    });
    if (!created.payment_session_id) throw new Error('Cashfree payment session was not returned.');
    window.__bookoraPendingOrderId = created.cashfree_order_id || created.order?.cashfree_order_id || created.order?.id || '';
    const loadSdk = () => new Promise((resolve, reject) => {
      if (window.Cashfree) return resolve(window.Cashfree);
      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      script.onload = () => window.Cashfree ? resolve(window.Cashfree) : reject(new Error('Cashfree SDK unavailable.'));
      script.onerror = () => reject(new Error('Unable to load Cashfree SDK.'));
      document.head.appendChild(script);
    });
    const Cashfree = await loadSdk();
    const mode = String(created.environment || '').toUpperCase() === 'PRODUCTION' ? 'production' : 'sandbox';
    await Cashfree({ mode }).checkout({ paymentSessionId: created.payment_session_id, redirectTarget: '_top' });
  } catch (error) {
    console.error('Bookora secure checkout:', error);
    Toast.show(error.message || 'Payment could not be started.', 'error');
    button.disabled = false;
    button.textContent = old;
  }
}

// The checkout page is rendered dynamically by the SPA. Keep the phone field
// attached whenever the checkout route appears, including after hash changes.
function installCheckoutPhoneObserver() {
  const run = () => ensureCheckoutPhoneField();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
  window.addEventListener('hashchange', run, { passive: true });
  if (document.body) {
    const observer = new MutationObserver(run);
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
installCheckoutPhoneObserver();

// Capture phase + stopImmediatePropagation prevents the older payment-runtime
// handler from creating a second/fake session.
document.addEventListener('click', event => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  const couponButton = target.closest('#apply-coupon-btn');
  if (couponButton) {
    event.preventDefault(); event.stopImmediatePropagation();
    applyCoupon(couponButton);
    return;
  }
  const checkoutButton = target.closest('#trigger-cashfree-btn, #cf-pay-btn');
  if (checkoutButton) {
    event.preventDefault(); event.stopImmediatePropagation();
    startCheckout(checkoutButton);
  }
}, true);

async function verifySuccessPage() {
  const match = (location.hash || '').match(/^#\/payment\/success(?:\?.*?order_id=([^&]+))?/);
  if (!match) return;
  const orderId = match[1] ? decodeURIComponent(match[1]) : '';
  if (!orderId) return;
  const app = document.getElementById('app');
  if (app) app.insertAdjacentHTML('afterbegin', '<div id="bookora-payment-verifying" style="position:fixed;inset:0;z-index:99999;background:rgba(248,250,252,.96);display:grid;place-items:center;font:700 16px Inter,system-ui;color:#0f172a">Payment verification in progress…</div>');
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      const result = await backend(`/api/orders/${encodeURIComponent(orderId)}/status`);
      const status = String(result.order?.order_status || '').toLowerCase();
      if (status === 'fulfilled' || String(result.order?.payment_status || '').toUpperCase() === 'PAID') {
        const overlay = document.getElementById('bookora-payment-verifying'); overlay?.remove();
        setTimeout(() => { location.hash = '#/payment/success?order_id=' + encodeURIComponent(orderId) + '&verified=1'; }, 0);
        return;
      }
      if (['failed', 'cancelled', 'expired'].includes(status)) {
        location.hash = '#/payment/failed?order_id=' + encodeURIComponent(orderId);
        return;
      }
    } catch (error) { console.warn('Payment verification retry:', error); }
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  const overlay = document.getElementById('bookora-payment-verifying'); overlay?.remove();
}

window.addEventListener('hashchange', () => setTimeout(verifySuccessPage, 100));
setTimeout(verifySuccessPage, 300);
