// Ensures the payment-success route always runs server-side verification after SPA renders.
import { initPaymentSuccessEvents } from './pages/PaymentSuccessPage.js';

function isPaymentSuccessRoute() {
  return (window.location.hash || '').split('?')[0] === '#/payment/success';
}

function startVerification() {
  if (!isPaymentSuccessRoute()) return;
  const main = document.getElementById('main-content');
  if (!main) return;
  const orderId = new URLSearchParams((window.location.hash || '').split('?')[1] || '').get('order_id') || '';
  if (!orderId || main.dataset.paymentVerificationOrder === orderId) return;
  main.dataset.paymentVerificationOrder = orderId;
  try { initPaymentSuccessEvents(); } catch (error) { console.error('Payment verification bootstrap failed:', error); }
}

function scheduleStart() {
  setTimeout(startVerification, 0);
}

window.addEventListener('load', scheduleStart);
window.addEventListener('hashchange', scheduleStart);

const observer = new MutationObserver(() => {
  if (isPaymentSuccessRoute()) scheduleStart();
});

function observe() {
  const app = document.getElementById('app');
  if (app) observer.observe(app, { childList: true, subtree: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, { once: true });
else observe();

scheduleStart();
