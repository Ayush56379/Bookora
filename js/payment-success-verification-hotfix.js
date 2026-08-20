// Payment-success verification compatibility bootstrap.
// The page module owns the actual state machine. This file only starts it once
// after the SPA has rendered; it intentionally does NOT use MutationObserver,
// because DOM mutations caused by the payment result must never start a second
// verification request that can overwrite the result.
import { initPaymentSuccessEvents } from './pages/PaymentSuccessPage.js';

let startedOrderId = '';
let scheduled = false;

function isPaymentSuccessRoute() {
  return (window.location.hash || '').split('?')[0] === '#/payment/success';
}

function startVerification() {
  scheduled = false;
  if (!isPaymentSuccessRoute()) return;
  const main = document.getElementById('main-content');
  if (!main) return;
  const orderId = new URLSearchParams((window.location.hash || '').split('?')[1] || '').get('order_id') || '';
  if (!orderId || startedOrderId === orderId) return;
  startedOrderId = orderId;
  try { initPaymentSuccessEvents(); } catch (error) { console.error('Payment verification bootstrap failed:', error); }
}

function scheduleStart() {
  if (scheduled) return;
  scheduled = true;
  setTimeout(startVerification, 0);
}

window.addEventListener('load', scheduleStart);
window.addEventListener('hashchange', () => {
  if (!isPaymentSuccessRoute()) startedOrderId = '';
  scheduleStart();
});
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleStart, { once: true });
else scheduleStart();
