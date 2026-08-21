// Bookora payment result page.
// The backend/Cashfree order status is authoritative. This module is the ONLY
// owner of the browser-side payment result state machine.
import { state } from '../state.js';
import { apiUrl } from '../config.js';

const flows = new Map();
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function params() { return new URLSearchParams((window.location.hash || '').split('?')[1] || ''); }
function getOrderId() { return String(params().get('order_id') || '').trim(); }

function normalizeStatus(value) {
  const s = String(value ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (['PAID','SUCCESS','SUCCESSFUL','COMPLETED','PAYMENT_SUCCESS'].includes(s)) return 'PAID';
  if (['FAILED','FAILURE','PAYMENT_FAILED','TERMINATED'].includes(s)) return 'FAILED';
  if (['CANCELLED','CANCELED','USER_DROPPED','USER_CANCELLED'].includes(s)) return 'CANCELLED';
  if (['EXPIRED','PAYMENT_EXPIRED'].includes(s)) return 'EXPIRED';
  if (['PENDING','ACTIVE','NOT_ATTEMPTED','INCOMPLETE','PROCESSING','CREATED'].includes(s)) return 'PENDING';
  return '';
}

function extractStatus(data) {
  const values = [
    data?.payment_state, data?.payment_status, data?.order_status, data?.status,
    data?.order?.payment_state, data?.order?.payment_status,
    data?.order?.order_status, data?.order?.status
  ];
  for (const value of values) {
    const normalized = normalizeStatus(value);
    if (normalized) return normalized;
  }
  if (data?.paid === true || data?.is_paid === true || data?.payment?.paid === true) return 'PAID';
  return 'PENDING';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[c]));
}
function render(markup) { const el = document.getElementById('main-content'); if (el) el.innerHTML = markup; }

function shell(icon, title, text, actions = '') {
  return `<div class="payment-result-page" style="background:var(--bg-secondary);min-height:85vh;padding:4rem 1rem;display:flex;align-items:center;justify-content:center"><div class="container" style="max-width:620px;width:100%"><div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:3rem 2.5rem;text-align:center;box-shadow:var(--shadow-lg)"><div style="width:72px;height:72px;border-radius:999px;background:#F8FAFC;border:2px solid #E2E8F0;color:#0F172A;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;font-size:32px">${icon}</div><h1 style="font-family:var(--font-display);font-size:2rem;font-weight:800;margin:0 0 .75rem">${title}</h1><p style="color:var(--text-secondary);line-height:1.6;margin:0">${text}</p>${actions ? `<div style="display:flex;justify-content:center;gap:1rem;flex-wrap:wrap;margin-top:1.8rem">${actions}</div>` : ''}</div></div></div>`;
}
function loadingMarkup() { return shell('◷','Verifying Payment','Please wait while we securely confirm your payment.'); }
function pendingMarkup() { return shell('◷','Payment Pending','Cashfree has not confirmed this payment yet. We will keep checking the transaction status.'); }
function cancelledMarkup() { return shell('×','Payment Cancelled','Your payment was cancelled. Your eBook has not been unlocked.','<a href="#/orders" class="btn btn-secondary btn-lg">My Orders</a><a href="#/explore" class="btn btn-primary btn-lg">Try Again</a>'); }
function failedMarkup() { return shell('!','Payment Failed','Your payment was not completed. Your eBook has not been unlocked.','<a href="#/orders" class="btn btn-secondary btn-lg">My Orders</a><a href="#/explore" class="btn btn-primary btn-lg">Try Again</a>'); }
function expiredMarkup() { return shell('⌛','Payment Expired','This payment session has expired. Your eBook has not been unlocked.','<a href="#/orders" class="btn btn-secondary btn-lg">My Orders</a><a href="#/explore" class="btn btn-primary btn-lg">Try Again</a>'); }
function errorMarkup(message) { return shell('!','Payment Status Unavailable',escapeHtml(message || 'We could not confirm the payment right now. Your eBook remains locked until the payment is confirmed.'),'<button id="payment-refresh-status" class="btn btn-primary btn-lg">Refresh Status</button><a href="#/orders" class="btn btn-secondary btn-lg">My Orders</a>'); }

async function ensureSession(force = false) {
  if (window.BookoraPurchaseAccess?.ensureBackendSession) return !!(await window.BookoraPurchaseAccess.ensureBackendSession(force));
  if (!force && state.token) return true;
  const auth = window.firebase?.auth?.();
  const user = auth?.currentUser;
  if (!user) return false;
  const idToken = await user.getIdToken(force);
  const api = String(window.BOOKORA_API_URL || apiUrl('')).replace(/\/$/, '');
  const response = await fetch(`${api}/api/auth/firebase`, { method:'POST', headers:{ Authorization:`Bearer ${idToken}`, Accept:'application/json','Content-Type':'application/json' }, body:JSON.stringify({ role:state.currentUser?.role || 'buyer' }), cache:'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.token) return false;
  state.token = data.token; state.isAuthenticated = true;
  if (data.user) state.currentUser = { ...(state.currentUser || {}), ...data.user };
  try { localStorage.setItem('bookora_auth_token', data.token); } catch (_) {}
  return true;
}

async function verifyOrder(orderId) {
  const api = String(window.BOOKORA_API_URL || apiUrl('')).replace(/\/$/, '');
  for (let attempt = 0; attempt < 3; attempt += 1) {
    if (!(await ensureSession(attempt > 0))) { await sleep(500); continue; }
    const response = await fetch(`${api}/api/cashfree/verify-order?order_id=${encodeURIComponent(orderId)}`, { method:'GET', headers:{ Accept:'application/json', Authorization:`Bearer ${state.token}` }, cache:'no-store' });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) { state.token = ''; try { localStorage.removeItem('bookora_auth_token'); } catch (_) {} continue; }
    if (!response.ok) throw new Error(data.error || `Payment verification failed (${response.status}).`);
    return data;
  }
  throw new Error('Unable to restore the secure payment session.');
}

async function syncLibrary() {
  if (window.BookoraPurchaseAccess?.syncPurchasedLibrary) return await window.BookoraPurchaseAccess.syncPurchasedLibrary();
  const api = String(window.BOOKORA_API_URL || apiUrl('')).replace(/\/$/, '');
  const response = await fetch(`${api}/api/library`, { headers:{ Accept:'application/json', Authorization:`Bearer ${state.token}` }, cache:'no-store' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Unable to sync your library.');
  return Array.isArray(data) ? data : (Array.isArray(data.books) ? data.books : []);
}

async function redirectToLibrary() {
  try { await syncLibrary(); } catch (error) { console.warn('Library sync after payment:', error); }
  await sleep(150);
  if ((window.location.hash || '').split('?')[0] === '#/payment/success') window.location.hash = '#/library';
}

function attachRefresh(flow) {
  document.getElementById('payment-refresh-status')?.addEventListener('click', () => { flow.polls = 0; flow.running = false; runFlow(flow.orderId, true); }, { once:true });
}

async function runFlow(orderId, immediate = false) {
  const flow = flows.get(orderId);
  if (!flow || flow.running || flow.done) return;
  flow.running = true;
  try {
    if (!immediate) render(loadingMarkup());
    const data = await verifyOrder(orderId);
    const status = extractStatus(data);
    flow.status = status;

    if (status === 'PAID') {
      flow.done = true;
      render(shell('✓','Payment Successful','Your payment has been verified. Redirecting you to your permanent Bookora Library…'));
      await redirectToLibrary();
      return;
    }
    if (status === 'CANCELLED') { flow.done = true; render(cancelledMarkup()); return; }
    if (status === 'FAILED') { flow.done = true; render(failedMarkup()); return; }
    if (status === 'EXPIRED') { flow.done = true; render(expiredMarkup()); return; }

    flow.running = false;
    render(pendingMarkup());
    if (flow.polls < 30) {
      flow.polls += 1;
      window.setTimeout(() => runFlow(orderId), 2000);
    } else attachRefresh(flow);
  } catch (error) {
    console.error('Bookora payment verification:', error);
    flow.running = false;
    render(errorMarkup(error?.message));
    attachRefresh(flow);
  }
}

export function renderPaymentSuccessPage() { return loadingMarkup(); }

export function initPaymentSuccessEvents() {
  const orderId = getOrderId();
  if (!orderId) { render(errorMarkup('No Cashfree order ID was supplied.')); return; }
  const existing = flows.get(orderId);
  if (existing?.done || existing?.running) return;
  const flow = existing || { orderId, status:'PENDING', polls:0, running:false, done:false };
  flows.set(orderId, flow);
  runFlow(orderId);
}
