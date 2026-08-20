// PaymentSuccessPage Component
import { state } from '../state.js';
import { apiUrl } from '../config.js';
import { formatPrice } from '../utils/formatters.js';
import { ReaderModal } from '../components/ReaderModal.js';
import { downloadEBook } from '../utils/pdfDownloader.js';

function getOrderId() {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  return String(params.get('order_id') || '').trim();
}

function getBookForOrder(order) {
  if (!order) return null;
  const byId = state.books.find(book => String(book.id) === String(order.book_id));
  if (byId) return byId;
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const slug = params.get('book_slug') || '';
  return slug ? state.getBookBySlug(slug) : null;
}

async function ensureBackendSession() {
  if (state.token) return true;
  if (window.BookoraPurchaseAccess?.ensureBackendSession) {
    try {
      await window.BookoraPurchaseAccess.ensureBackendSession(false);
    } catch (error) {
      console.warn('Backend session refresh failed:', error);
    }
  }
  return !!state.token;
}

async function fetchVerifiedOrder(orderId) {
  if (!orderId) throw new Error('Payment order ID is missing.');
  await ensureBackendSession();
  if (!state.token) throw new Error('Please sign in again to verify this payment.');

  const response = await fetch(apiUrl(`/api/orders/${encodeURIComponent(orderId)}/status`), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${state.token}`
    },
    cache: 'no-store'
  });

  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && window.BookoraPurchaseAccess?.ensureBackendSession) {
    await window.BookoraPurchaseAccess.ensureBackendSession(true);
    if (state.token) return fetchVerifiedOrder(orderId);
  }
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Unable to verify payment status.');
  }
  return data;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

function loadingMarkup(message = 'Verifying your payment securely…') {
  return `
    <div class="payment-success-page" style="background:var(--bg-secondary);min-height:85vh;padding:4rem 0 6rem;display:flex;align-items:center;">
      <div class="container" style="max-width:680px;">
        <div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:3rem 2.5rem;text-align:center;box-shadow:var(--shadow-lg);">
          <div style="width:72px;height:72px;border-radius:99px;background:#EFF6FF;border:2px solid #BFDBFE;color:#2563EB;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
          </div>
          <h1 style="font-family:var(--font-display);font-size:2rem;font-weight:800;color:var(--text-primary);margin-bottom:.6rem;">Verifying Payment</h1>
          <p style="font-size:1rem;color:var(--text-secondary);line-height:1.6;margin:0;">${escapeHtml(message)}</p>
        </div>
      </div>
    </div>`;
}

function successMarkup(order, book) {
  const title = order.book_title || book?.title || 'your eBook';
  const amount = order.amount ?? book?.sale_price ?? book?.price ?? 0;
  const safeTitle = escapeHtml(title);
  const safeOrderId = escapeHtml(order.id || order.cashfree_order_id || '');
  return `
    <div class="payment-success-page animate-fade-in" style="background:var(--bg-secondary);min-height:85vh;padding:4rem 0 6rem;display:flex;align-items:center;">
      <div class="container" style="max-width:680px;">
        <div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:3rem 2.5rem;text-align:center;box-shadow:var(--shadow-lg);">
          <div style="width:72px;height:72px;border-radius:99px;background:#ECFDF5;border:2px solid #A7F3D0;color:#059669;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h1 style="font-family:var(--font-display);font-size:2.2rem;font-weight:800;color:var(--text-primary);margin-bottom:.5rem;">Payment Successful!</h1>
          <p style="font-size:1.05rem;color:var(--text-secondary);line-height:1.5;margin-bottom:2rem;">Thank you for your purchase. Your digital edition of <strong>${safeTitle}</strong> has been unlocked and added to your permanent library.</p>
          <div style="background:var(--bg-secondary);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);padding:1.25rem;text-align:left;margin-bottom:2.25rem;font-size:.875rem;">
            <div style="display:flex;justify-content:space-between;margin-bottom:.5rem;"><span style="color:var(--text-muted);">Order ID:</span><strong style="color:var(--text-primary);font-family:monospace;">${safeOrderId}</strong></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:.5rem;"><span style="color:var(--text-muted);">Payment Gateway:</span><strong style="color:#1E3A8A;">Cashfree (Verified)</strong></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:.5rem;"><span style="color:var(--text-muted);">Purchaser Account:</span><span style="color:var(--text-primary);">${escapeHtml(state.currentUser?.email || 'your email')}</span></div>
            <div style="display:flex;justify-content:space-between;"><span style="color:var(--text-muted);">Amount Paid:</span><strong style="color:var(--accent);">${formatPrice(amount)}</strong></div>
          </div>
          <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:1rem;">
            ${book ? `<button id="success-read-btn" class="btn btn-primary btn-lg" style="padding:.85rem 2rem;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 6.5 2z"/></svg> Read eBook Now</button>` : ''}
            ${book ? `<button id="success-download-btn" class="btn btn-secondary btn-lg"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download PDF Edition</button>` : ''}
            <a href="#/library" class="btn btn-ghost btn-lg">Go to My Library →</a>
          </div>
        </div>
      </div>
    </div>`;
}

function failedMarkup(order, message = 'Your payment was cancelled or failed. The eBook has not been unlocked.') {
  const orderId = escapeHtml(order?.id || order?.cashfree_order_id || getOrderId());
  return `
    <div class="payment-failed-page animate-fade-in" style="background:var(--bg-secondary);min-height:80vh;display:flex;align-items:center;justify-content:center;padding:4rem 0;">
      <div class="container" style="max-width:560px;text-align:center;">
        <div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:3rem 2rem;box-shadow:var(--shadow-sm);">
          <div style="width:64px;height:64px;border-radius:99px;background:#FEF2F2;color:#DC2626;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <h2 style="font-family:var(--font-display);font-size:1.8rem;font-weight:800;color:var(--text-primary);margin-bottom:.5rem;">Payment Not Completed</h2>
          <p style="font-size:.95rem;color:var(--text-secondary);line-height:1.5;margin-bottom:1rem;">${escapeHtml(message)}</p>
          ${orderId ? `<p style="font-size:.8rem;color:var(--text-muted);margin-bottom:2rem;">Order ID: <strong>${orderId}</strong></p>` : ''}
          <div style="display:flex;justify-content:center;gap:1rem;flex-wrap:wrap;">
            <a href="#/orders" class="btn btn-primary btn-lg">Go to My Orders</a>
            <a href="#/explore" class="btn btn-secondary btn-lg">Browse Catalog</a>
          </div>
        </div>
      </div>
    </div>`;
}

function pendingMarkup(order, message = 'Cashfree has not confirmed a successful payment yet. Your book remains locked.') {
  return `
    <div class="payment-success-page animate-fade-in" style="background:var(--bg-secondary);min-height:85vh;padding:4rem 0 6rem;display:flex;align-items:center;">
      <div class="container" style="max-width:620px;">
        <div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:3rem 2.5rem;text-align:center;box-shadow:var(--shadow-lg);">
          <div style="width:72px;height:72px;border-radius:99px;background:#FFF7ED;border:2px solid #FED7AA;color:#EA580C;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
          </div>
          <h1 style="font-family:var(--font-display);font-size:2rem;font-weight:800;color:var(--text-primary);margin-bottom:.6rem;">Payment Verification Pending</h1>
          <p style="font-size:1rem;color:var(--text-secondary);line-height:1.6;margin-bottom:1.8rem;">${escapeHtml(message)}</p>
          <div style="display:flex;justify-content:center;gap:1rem;flex-wrap:wrap;">
            <button id="payment-refresh-status" class="btn btn-primary btn-lg">Refresh Status</button>
            <a href="#/orders" class="btn btn-secondary btn-lg">Go to My Orders</a>
          </div>
        </div>
      </div>
    </div>`;
}

export function renderPaymentSuccessPage() {
  return loadingMarkup();
}

export function initPaymentSuccessEvents() {
  const orderId = getOrderId();
  let latestOrder = null;
  let latestBook = null;
  let checking = false;
  let pollTimer = null;
  let attempts = 0;

  const renderIntoPage = markup => {
    const main = document.getElementById('main-content');
    if (main) main.innerHTML = markup;
  };

  const bindSuccessEvents = () => {
    document.getElementById('success-read-btn')?.addEventListener('click', () => {
      if (latestBook) ReaderModal.open(latestBook, false);
    });
    document.getElementById('success-download-btn')?.addEventListener('click', () => {
      if (latestBook) downloadEBook(latestBook, state.currentUser);
    });
  };

  const verify = async () => {
    if (checking) return;
    checking = true;
    try {
      const result = await fetchVerifiedOrder(orderId);
      latestOrder = result.order || null;
      latestBook = getBookForOrder(latestOrder);
      const paymentState = String(result.payment_state || '').toUpperCase();

      if (paymentState === 'PAID') {
        clearTimeout(pollTimer);
        renderIntoPage(successMarkup(latestOrder, latestBook));
        bindSuccessEvents();
        return;
      }

      if (paymentState === 'FAILED') {
        clearTimeout(pollTimer);
        const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const bookSlug = latestBook?.slug || params.get('book_slug') || '';
        const target = `#/payment/failed?order_id=${encodeURIComponent(orderId)}${bookSlug ? `&book_slug=${encodeURIComponent(bookSlug)}` : ''}`;
        window.location.hash = target;
        return;
      }

      attempts += 1;
      renderIntoPage(pendingMarkup(latestOrder));
      document.getElementById('payment-refresh-status')?.addEventListener('click', verify);
      if (attempts < 5) pollTimer = setTimeout(verify, 2500);
    } catch (error) {
      console.error('Payment verification:', error);
      renderIntoPage(pendingMarkup(latestOrder, error.message || 'We could not verify the payment yet. Please refresh the status.'));
      document.getElementById('payment-refresh-status')?.addEventListener('click', verify);
    } finally {
      checking = false;
    }
  };

  verify();
}
