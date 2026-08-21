// Bookora payment-success page. Server verification is authoritative.
import { state } from '../state.js';
import { apiUrl } from '../config.js';
import { formatPrice } from '../utils/formatters.js';
import { ReaderModal } from '../components/ReaderModal.js';
import { downloadEBook } from '../utils/pdfDownloader.js';

const paymentFlows = new Map();
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function params() {
  return new URLSearchParams((window.location.hash || '').split('?')[1] || '');
}
function getOrderId() { return String(params().get('order_id') || '').trim(); }
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
function getBookForOrder(order) {
  if (!order) return null;
  const book = state.books.find(b => String(b.id) === String(order.book_id));
  if (book) return book;
  const slug = params().get('book_slug') || '';
  return slug ? state.getBookBySlug(slug) : null;
}

async function waitForFirebaseUser(timeoutMs = 15000) {
  try {
    const auth = window.firebase?.auth?.();
    if (!auth) return null;
    if (auth.currentUser) return auth.currentUser;
    return await new Promise(resolve => {
      let done = false;
      let unsubscribe = null;
      const finish = user => {
        if (done) return;
        done = true;
        try { unsubscribe?.(); } catch (_) {}
        resolve(user || null);
      };
      unsubscribe = auth.onAuthStateChanged(finish);
      setTimeout(() => finish(auth.currentUser || null), timeoutMs);
    });
  } catch (_) {
    return null;
  }
}

async function ensureBackendSession(force = false) {
  if (!force && state.token) return true;
  const firebaseUser = await waitForFirebaseUser();
  if (!firebaseUser) return false;
  try {
    const firebaseIdToken = await firebaseUser.getIdToken(!!force);
    const api = String(window.BOOKORA_API_URL || apiUrl('')).replace(/\/$/, '');
    const response = await fetch(`${api}/api/auth/firebase`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${firebaseIdToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: state.currentUser?.role || 'buyer' }),
      cache: 'no-store'
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.token) throw new Error(data.error || 'Secure session creation failed.');
    state.token = data.token;
    state.isAuthenticated = true;
    if (data.user) state.currentUser = { ...(state.currentUser || {}), ...data.user };
    try { localStorage.setItem('bookora_auth_token', data.token); } catch (_) {}
    return true;
  } catch (error) {
    console.warn('Bookora payment session exchange failed:', error);
    return false;
  }
}

async function verifyOrder(orderId) {
  let lastError = null;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const ready = await ensureBackendSession(attempt > 0);
    if (!ready || !state.token) {
      lastError = new Error('Please wait while your account session is restored.');
      await sleep(500);
      continue;
    }
    try {
      const response = await fetch(apiUrl(`/api/cashfree/verify-order?order_id=${encodeURIComponent(orderId)}`), {
        method: 'GET',
        headers: { Accept: 'application/json', Authorization: `Bearer ${state.token}` },
        cache: 'no-store'
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) return data;
      lastError = new Error(data.error || `Payment verification failed (${response.status}).`);
      if (response.status === 401) {
        state.token = '';
        try { localStorage.removeItem('bookora_auth_token'); } catch (_) {}
        await sleep(300);
        continue;
      }
      break;
    } catch (e) {
      lastError = e;
    }
    await sleep(400);
  }
  throw lastError || new Error('Unable to verify payment status.');
}

function render(markup) { const el = document.getElementById('main-content'); if (el) el.innerHTML = markup; }
function loadingMarkup() {
  return `<div class="payment-success-page" style="background:var(--bg-secondary);min-height:85vh;padding:4rem 0;display:flex;align-items:center"><div class="container" style="max-width:680px"><div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:3rem 2.5rem;text-align:center;box-shadow:var(--shadow-lg)"><div style="font-size:42px;margin-bottom:16px">◷</div><h1 style="font-family:var(--font-display);font-size:2rem;font-weight:800">Verifying Payment</h1><p style="color:var(--text-secondary)">Please wait while we securely confirm your payment.</p></div></div></div>`;
}
function pendingMarkup(message) {
  return `<div class="payment-success-page" style="background:var(--bg-secondary);min-height:85vh;padding:4rem 0;display:flex;align-items:center"><div class="container" style="max-width:620px"><div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:3rem 2.5rem;text-align:center;box-shadow:var(--shadow-lg)"><div style="width:72px;height:72px;border-radius:99px;background:#FFF7ED;border:2px solid #FED7AA;color:#EA580C;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;font-size:32px">◷</div><h1 style="font-family:var(--font-display);font-size:2rem;font-weight:800">Payment Verification Pending</h1><p style="color:var(--text-secondary);line-height:1.6">${escapeHtml(message || 'Cashfree has not confirmed a successful payment yet. Your book remains locked.')}</p><div style="display:flex;justify-content:center;gap:1rem;flex-wrap:wrap;margin-top:1.8rem"><button id="payment-refresh-status" class="btn btn-primary btn-lg">Refresh Status</button><a href="#/orders" class="btn btn-secondary btn-lg">Go to My Orders</a></div></div></div></div>`;
}
function failedMarkup() {
  return `<div class="payment-success-page" style="background:var(--bg-secondary);min-height:85vh;padding:4rem 0;display:flex;align-items:center"><div class="container" style="max-width:620px"><div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:3rem 2.5rem;text-align:center;box-shadow:var(--shadow-lg)"><div style="font-size:42px;color:#DC2626;margin-bottom:16px">✕</div><h1 style="font-family:var(--font-display);font-size:2rem;font-weight:800">Payment Not Completed</h1><p style="color:var(--text-secondary);line-height:1.6">Your payment was cancelled or failed. The eBook has not been unlocked.</p><a href="#/orders" class="btn btn-primary btn-lg" style="margin-top:1.5rem">Go to My Orders</a></div></div></div>`;
}
function successMarkup(order, book) {
  const title = escapeHtml(order?.book_title || book?.title || 'your eBook');
  const id = escapeHtml(order?.id || order?.cashfree_order_id || getOrderId());
  const amount = order?.amount ?? book?.sale_price ?? book?.price ?? 0;
  return `<div class="payment-success-page" style="background:var(--bg-secondary);min-height:85vh;padding:4rem 0;display:flex;align-items:center"><div class="container" style="max-width:680px"><div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:3rem 2.5rem;text-align:center;box-shadow:var(--shadow-lg)"><div style="width:72px;height:72px;border-radius:99px;background:#ECFDF5;border:2px solid #A7F3D0;color:#059669;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;font-size:36px">✓</div><h1 style="font-family:var(--font-display);font-size:2.2rem;font-weight:800">Payment Successful!</h1><p style="font-size:1.05rem;color:var(--text-secondary);line-height:1.5;margin-bottom:2rem">Your payment has been verified. <strong>${title}</strong> is now unlocked and available in your permanent library.</p><div style="background:var(--bg-secondary);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);padding:1.25rem;text-align:left;margin-bottom:2rem;font-size:.875rem"><div style="display:flex;justify-content:space-between;margin:.45rem 0"><span>Order ID:</span><strong>${id}</strong></div><div style="display:flex;justify-content:space-between;margin:.45rem 0"><span>Payment Gateway:</span><strong style="color:#1E3A8A">Cashfree (Verified)</strong></div><div style="display:flex;justify-content:space-between;margin:.45rem 0"><span>Amount Paid:</span><strong style="color:var(--accent)">${formatPrice(amount)}</strong></div></div><div style="display:flex;justify-content:center;gap:1rem;flex-wrap:wrap">${book ? '<button id="success-read-btn" class="btn btn-primary btn-lg">📖 Read eBook Now</button><button id="success-download-btn" class="btn btn-secondary btn-lg">⇩ Download PDF Edition</button>' : ''}<a href="#/library" class="btn btn-ghost btn-lg">Go to My Library →</a></div></div></div></div>`;
}
function bindSuccess(book) {
  document.getElementById('success-read-btn')?.addEventListener('click', () => book && ReaderModal.open(book, false));
  document.getElementById('success-download-btn')?.addEventListener('click', () => book && downloadEBook(book, state.currentUser));
}

// The SPA router previously rendered this page but did not register an init
// callback for it. Start verification after the router inserts #main-content.
// This makes the payment-success route self-starting and removes the dependency
// on a separately loaded bootstrap script.
export function renderPaymentSuccessPage() {
  const orderId = getOrderId();
  if (orderId) {
    setTimeout(() => {
      try { initPaymentSuccessEvents(); } catch (error) { console.error('Payment verification start failed:', error); }
    }, 0);
  }
  return loadingMarkup();
}

export function initPaymentSuccessEvents() {
  const orderId = getOrderId();
  if (!orderId) return;
  const existing = paymentFlows.get(orderId);
  if (existing?.state === 'PAID') return;
  if (existing?.started) return;

  const flow = { started: true, state: 'VERIFYING' };
  paymentFlows.set(orderId, flow);
  render(loadingMarkup());

  (async () => {
    try {
      const result = await verifyOrder(orderId);
      if (paymentFlows.get(orderId) !== flow || flow.state === 'PAID') return;

      const stateValue = String(result.payment_state || '').toUpperCase();
      const order = result.order || {};
      const book = getBookForOrder(order);

      if (stateValue === 'PAID' || result.paid === true) {
        flow.state = 'PAID';
        paymentFlows.set(orderId, flow);
        render(successMarkup(order, book));
        bindSuccess(book);
        return;
      }
      if (stateValue === 'FAILED' || stateValue === 'EXPIRED') {
        flow.state = 'FAILED';
        render(failedMarkup());
        return;
      }
      flow.state = 'PENDING';
      render(pendingMarkup());
      document.getElementById('payment-refresh-status')?.addEventListener('click', () => {
        if (flow.state === 'PAID') return;
        flow.started = false;
        flow.state = 'VERIFYING';
        initPaymentSuccessEvents();
      }, { once: true });
    } catch (error) {
      if (paymentFlows.get(orderId) !== flow || flow.state === 'PAID') return;
      console.error('Payment verification:', error);
      flow.state = 'PENDING';
      render(pendingMarkup('We are still confirming your payment. Please refresh the status in a moment.'));
      document.getElementById('payment-refresh-status')?.addEventListener('click', () => {
        if (flow.state === 'PAID') return;
        flow.started = false;
        flow.state = 'VERIFYING';
        initPaymentSuccessEvents();
      }, { once: true });
    }
  })();
}
