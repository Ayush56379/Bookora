/* Bookora support payment runtime fix.
   Keeps the existing review/support UI and Firebase auth untouched.
   Intercepts only the support button so Cashfree opens in the current tab,
   then verifies the order after Cashfree returns to Bookora. */
(() => {
  const API = window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com';
  let busy = false;

  const getAuthToken = async () => {
    try {
      const auth = window.firebase?.auth?.();
      const user = auth?.currentUser;
      return user ? await user.getIdToken(false) : '';
    } catch (_) { return ''; }
  };

  const api = async (path, options = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set('Accept', 'application/json');
    if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');
    const token = await getAuthToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(`${API}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Payment request failed (${response.status})`);
    return data;
  };

  const message = text => {
    const el = document.getElementById('rs-donate-msg');
    if (el) el.textContent = text;
  };

  const readOrderId = () => {
    try {
      const url = new URL(window.location.href);
      const direct = url.searchParams.get('order_id');
      if (direct) return direct;
      const hash = url.hash || '';
      const q = hash.indexOf('?');
      return q >= 0 ? new URLSearchParams(hash.slice(q + 1)).get('order_id') : '';
    } catch (_) { return ''; }
  };

  async function verifyReturnedOrder() {
    const orderId = readOrderId();
    if (!orderId || !document.getElementById('rs-donate-msg')) return;
    message('Verifying Cashfree payment…');
    try {
      let result = null;
      for (let i = 0; i < 8; i++) {
        result = await api(`/api/support/verify?order_id=${encodeURIComponent(orderId)}`);
        if (result.paid) break;
        if (i < 7) await new Promise(r => setTimeout(r, 1500));
      }
      if (result?.paid) {
        message(`Payment successful. Thank you for supporting Bookora. Transaction: ${orderId}`);
      } else {
        message(`Cashfree returned to Bookora, but the payment is still ${String(result?.status || 'PENDING')}. You can refresh shortly to verify again.`);
      }
    } catch (error) {
      message(error.message || 'Unable to verify the Cashfree payment yet.');
    }
  }

  async function startSupportPayment(button) {
    if (busy) return;
    const amount = Number(document.getElementById('rs-amount')?.value || 0);
    const phone = String(document.getElementById('rs-phone')?.value || '').replace(/\D/g, '');
    if (amount < 1 || amount > 100000) return message('Please enter an amount between ₹1 and ₹1,00,000.');
    if (!/^\d{10}$/.test(phone)) return message('Please enter a valid 10-digit phone number.');

    busy = true;
    if (button) button.disabled = true;
    message('Creating secure Cashfree payment…');
    try {
      const order = await api('/api/support/create-order', {
        method: 'POST',
        body: JSON.stringify({ amount, phone })
      });
      if (!order.payment_session_id) throw new Error('Cashfree payment session was not created.');

      if (!window.Cashfree) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
          script.onload = resolve;
          script.onerror = () => reject(new Error('Cashfree checkout could not be loaded.'));
          document.head.appendChild(script);
        });
      }

      const mode = String(order.environment || 'SANDBOX').toUpperCase() === 'PRODUCTION' ? 'production' : 'sandbox';
      const cashfree = window.Cashfree({ mode });
      message('Opening Cashfree payment…');
      const result = await cashfree.checkout({
        paymentSessionId: order.payment_session_id,
        redirectTarget: '_self'
      });
      if (result?.error) throw new Error(result.error.message || 'Cashfree checkout could not be opened.');
    } catch (error) {
      message(error.message || 'Unable to start Cashfree payment.');
      busy = false;
      if (button) button.disabled = false;
    }
  }

  document.addEventListener('click', event => {
    const button = event.target?.closest?.('#rs-donate-btn');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    startSupportPayment(button);
  }, true);

  const boot = () => verifyReturnedOrder();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();

  new MutationObserver(() => {
    if (document.getElementById('rs-donate-msg')) verifyReturnedOrder();
  }).observe(document.body, { childList: true, subtree: true });
})();
