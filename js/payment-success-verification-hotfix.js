// Payment-success verification bootstrap.
// PaymentSuccessPage.js is the single owner of payment result state.
import { initPaymentSuccessEvents } from './pages/PaymentSuccessPage.js?v=20260821-7';

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
