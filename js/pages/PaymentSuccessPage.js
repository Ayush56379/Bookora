// Bookora payment result page.
// Cashfree/backend status is authoritative. The result page stays visible
after verification so the customer can clearly see what happened.
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
  const values = [data?.payment_state, data?.payment_status, data?.order_status, data?.status, data?.order?.payment_state, data?.order?.payment_status, data?.order?.order_status, data?.order?.status];
  for (const value of values) {
    const normalized = normalizeStatus(value);
    if (normalized) return normalized;
  }
  if (data?.paid === true || data?.is_paid === true || data?.payment?.paid === true) return 'PAID';
  return 'PENDING';
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'\"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;' }[c]));
}
function render(markup) { const el = document.getElementById('main-content'); if (el) el.innerHTML = markup; }

function details(orderId, data) {
  const order = data?.order || {};
  const amount = Number(order?.order_amount ?? order?.amount ?? 0);
  const amountText = Number.isFinite(amount) && amount > 0 ? `₹${amount.toFixed(2)}` : '—';
  const gatewayId = order?.cf_order_id || order?.order_id || orderId;
  return `<div style="margin-top:1.6rem;background:var(--bg-secondary);border:1px solid var(--border-subtle);border-radius:14px;padding:1rem;text-align:left;font-size:.9rem"><div style="display:flex;justify-content:space-between;gap:1rem;padding:.45rem 0"><span style="color:var(--text-secondary)">Order ID</span><strong style="font-family:monospace;word-break:break-all">${escapeHtml(orderId)}</strong></div><div style="display:flex;justify-content:space-between;gap:1rem;padding:.45rem 0"><span style="color:var(--text-secondary)">Amount</span><strong>${amountText}</strong></div><div style="display:flex;justify-content:space-between;gap:1rem;padding:.45rem 0"><span style="color:var(--text-secondary)">Cashfree Order</span><strong style="font-family:monospace;word-break:break-all">${escapeHtml(gatewayId)}</strong></div></div>`;
}

function shell(icon, title, text, actions = '', extra = '') {
  return `<div class="payment-result-page" style="background:var(--bg-secondary);min-height:85vh;padding:4rem 1rem;display:flex;align-items:center;justify-content:center"><div class="container" style="max-width:650px;width:100%"><div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:3rem 2.5rem;text-align:center;box-shadow:var(--shadow-lg)"><div style="width:72px;height:72px;border-radius:999px;background:#F8FAFC;border:2px solid #E2E8F0;color:#0F172A;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;font-size:32px">${icon}</div><h1 style="font-family:var(--font-display);font-size:2rem;font-weight:800;margin:0 0 .75rem">${title}</h1><p style="color:var(--text-secondary);line-height:1.6;margin:0">${text}</p>${extra}${actions ? `<div style="display:flex;justify-content:center;gap:1rem;flex-wrap:wrap;margin-top:1.8rem">${actions}</div>` : ''}</div></div></div>`;
}

function loadingMarkup() { return shell('◷','Checking Payment','Please wait while Bookora securely confirms the Cashfree payment.'); }
function pendingMarkup(orderId, data) { return shell('◷','Payment Pending','Cashfree has not confirmed a completed payment yet. Your eBook remains locked until Bookora receives a verified successful payment.', '', details(orderId, data) + '<div style="margin-top:1rem;color:var(--text-muted);font-size:.85rem">We will keep checking automatically.</div>'); }
function pendingFinalMarkup(orderId, data) { return shell('◷','Payment Still Pending','We could not confirm a completed payment yet. Please do not pay again until you check My Orders. If your bank shows a debit, allow the gateway/bank time to update the final status.', '<button id="payment-refresh-status" class="btn btn-primary btn-lg">Check Again</button><a href="#/orders" class="btn btn-secondary btn-lg">My Orders</a><a href="#/explore" class="btn btn-secondary btn-lg">Continue Shopping</a>', details(orderId, data)); }
function successMarkup(orderId, data) { return shell('✓','Payment Successful','Your payment has been verified by Bookora. Your eBook access is now unlocked and the purchase has been added to your Library.', '<a href="#/library" class="btn btn-primary btn-lg">Open My Library</a><a href="#/orders" class="btn btn-secondary btn-lg">View Order</a><a href="#/explore" class="btn btn-secondary btn-lg">Continue Shopping</a>', details(orderId, data)); }
function cancelledMarkup(orderId, data) { return shell('×','Payment Cancelled','The Cashfree payment was cancelled. No eBook was unlocked and no seller earning was created for this order.', '<a href="#/orders" class="btn btn-secondary btn-lg">My Orders</a><a href="#/explore" class="btn btn-primary btn-lg">Try Again</a>', details(orderId, data)); }
function failedMarkup(orderId, data) { return shell('!','Payment Failed','Cashfree did not confirm this payment. Your eBook remains locked and the order has not been fulfilled. You can safely try the purchase again.', '<a href="#/orders" class="btn btn-secondary btn-lg">My Orders</a><a href="#/explore" class="btn btn-primary btn-lg">Try Again</a>', details(orderId, data)); }
function expiredMarkup(orderId, data) { return shell('⌛','Payment Expired','This Cashfree payment session expired before Bookora received a successful payment. Your eBook remains locked.', '<a href="#/orders" class="btn btn-secondary btn-lg">My Orders</a><a href="#/explore" class="btn btn-primary btn-lg">Try Again</a>', details(orderId, data)); }
function errorMarkup(message) { return shell('!','We Couldn’t Check the Payment',escapeHtml(message || 'We could not check the payment right now. Your eBook remains locked until the payment is confirmed.'),'<button id="payment-refresh-status" class="btn btn-primary btn-lg">Check Again</button><a href="#/orders" class="btn btn-secondary btn-lg">My Orders</a>'); }

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
    if (response.status === 404) return { success:true, payment_state:'PENDING', order_not_found:true };
    if (!response.ok) throw new Error(data.error || `Payment verification failed (${response.status}).`);
    return data;
  }
  throw new Error('Unable to restore the secure payment session.');
}

function attachRefresh(flow) {
  document.getElementById('payment-refresh-status')?.addEventListener('click', () => {
    flow.polls = 0; flow.running = false; flow.done = false; runFlow(flow.orderId, true);
  }, { once:true });
}

async function runFlow(orderId, immediate = false) {
  const flow = flows.get(orderId);
  if (!flow || flow.running || flow.done) return;
  flow.running = true;
  try {
    // Do not re-render the loading screen on every polling cycle.
    // This prevents the visible Checking Payment -> Pending -> Checking loop.
    const data = await verifyOrder(orderId);
    const status = extractStatus(data);
    flow.status = status;
    flow.data = data;

    if (status === 'PAID') { flow.done = true; render(successMarkup(orderId, data)); return; }
    if (status === 'CANCELLED') { flow.done = true; render(cancelledMarkup(orderId, data)); return; }
    if (status === 'FAILED') { flow.done = true; render(failedMarkup(orderId, data)); return; }
    if (status === 'EXPIRED') { flow.done = true; render(expiredMarkup(orderId, data)); return; }

    flow.running = false;
    if (flow.polls >= 30) { flow.done = true; render(pendingFinalMarkup(orderId, data)); attachRefresh(flow); return; }
    render(pendingMarkup(orderId, data));
    flow.polls += 1;
    window.setTimeout(() => runFlow(orderId), 2000);
  } catch (error) {
    console.error('Bookora payment verification:', error);
    flow.running = false;
    render(errorMarkup(error?.message));
    attachRefresh(flow);
  }
}

export function renderPaymentSuccessPage() {
  window.setTimeout(() => initPaymentSuccessEvents(), 0);
  return loadingMarkup();
}

export function initPaymentSuccessEvents() {
  const orderId = getOrderId();
  if (!orderId) { render(errorMarkup('No payment order was supplied. Please return to My Orders and try again.')); return; }
  const existing = flows.get(orderId);
  if (existing?.done || existing?.running) return;
  const flow = existing || { orderId, status:'PENDING', polls:0, running:false, done:false };
  flows.set(orderId, flow);
  runFlow(orderId);
}
