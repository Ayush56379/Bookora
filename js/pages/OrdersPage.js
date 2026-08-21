// OrdersPage Component
import { state } from '../state.js';
import { formatPrice, formatDate } from '../utils/formatters.js';
import { updateSEO } from '../utils/seo.js';

function esc(value) {
  return String(value ?? '').replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[c]));
}

function statusMeta(order) {
  const raw = String(order?.status || order?.paymentStatus || 'PENDING').toUpperCase();
  if (['PAID', 'SUCCESS', 'FULFILLED', 'COMPLETED'].includes(raw)) return { label: raw, cls: 'badge-featured', icon: '✓' };
  if (raw === 'FAILED') return { label: 'FAILED', cls: 'badge-bookora', icon: '×' };
  if (raw === 'CANCELLED') return { label: 'CANCELLED', cls: 'badge-bookora', icon: '×' };
  if (raw === 'REFUNDED') return { label: 'REFUNDED', cls: 'badge-bookora', icon: '↩' };
  if (raw === 'EXPIRED') return { label: 'EXPIRED', cls: 'badge-bookora', icon: '⌛' };
  return { label: 'PENDING', cls: 'badge-bookora', icon: '◷' };
}

function actionMarkup(order) {
  const status = String(order?.status || '').toUpperCase();
  const fulfilled = String(order?.fulfillmentStatus || '').toUpperCase() === 'FULFILLED';
  if (['PAID', 'FULFILLED', 'COMPLETED'].includes(status) && fulfilled) return `<a href="#/library" class="btn btn-primary btn-sm" style="font-size:.75rem;padding:4px 10px;">Read / Download</a>`;
  return `<span style="font-size:.75rem;color:var(--text-muted);">No access</span>`;
}

function orderRow(order) {
  const meta = statusMeta(order);
  const transaction = order.cashfreePaymentId || order.transaction_id || '—';
  const gatewayOrder = order.cashfreeOrderId || '—';
  const type = order.orderType || 'Digital eBook';
  return `<tr style="border-bottom:1px solid var(--border-subtle);">
    <td style="padding:1.1rem 1.25rem;font-family:monospace;font-weight:700;color:var(--text-primary);white-space:nowrap;">${esc(order.id)}</td>
    <td style="padding:1.1rem 1.25rem;min-width:220px;"><strong style="color:var(--text-primary);display:block;">${esc(order.book_title)}</strong><span style="font-size:.72rem;color:var(--text-muted);display:block;margin-top:4px;">Payment: ${esc(transaction)}</span><span style="font-size:.72rem;color:var(--text-muted);display:block;margin-top:2px;">Cashfree Order: ${esc(gatewayOrder)}</span></td>
    <td style="padding:1.1rem 1.25rem;color:var(--text-secondary);white-space:nowrap;">${esc(formatDate(order.date))}</td>
    <td style="padding:1.1rem 1.25rem;font-weight:700;color:var(--text-primary);white-space:nowrap;">${esc(formatPrice(order.amount))}</td>
    <td style="padding:1.1rem 1.25rem;"><span class="badge badge-bookora" style="font-size:.65rem;">Cashfree</span><span style="display:block;font-size:.7rem;color:var(--text-muted);margin-top:5px;">${esc(type)}</span></td>
    <td style="padding:1.1rem 1.25rem;white-space:nowrap;"><span class="badge ${meta.cls}" style="font-size:.65rem;">${meta.icon} ${esc(meta.label)}</span>${order.fulfillmentStatus ? `<span style="display:block;font-size:.68rem;color:var(--text-muted);margin-top:5px;">Fulfillment: ${esc(order.fulfillmentStatus)}</span>` : ''}</td>
    <td style="padding:1.1rem 1.25rem;text-align:right;white-space:nowrap;">${actionMarkup(order)}</td>
  </tr>`;
}

export function renderOrdersPage() {
  updateSEO({ title: 'Order History & Receipts', description: 'View your verified Bookora purchases and Cashfree transaction details.' });
  const orders = Array.isArray(state.orders) ? state.orders : [];
  const loading = state.ordersLoading === true;
  const loaded = state.ordersLoaded === true;
  const error = String(state.ordersLoadError || '').trim();
  let body;
  if (loading && !loaded) {
    body = `<div style="padding:4rem 2rem;text-align:center;"><div style="width:44px;height:44px;border:3px solid var(--border-subtle);border-top-color:var(--accent);border-radius:50%;margin:0 auto 1rem;animation:spin 1s linear infinite;"></div><p style="color:var(--text-secondary);">Loading your orders...</p></div>`;
  } else if (error && !loaded) {
    body = `<div style="padding:4rem 2rem;text-align:center;"><div style="font-size:2rem;margin-bottom:.75rem;">!</div><h3 style="font-size:1.1rem;font-weight:800;color:var(--text-primary);margin-bottom:.5rem;">Unable to load your orders</h3><p style="color:var(--text-secondary);margin-bottom:1.25rem;">${esc(error)}</p><button type="button" class="btn btn-primary btn-sm orders-retry-btn">Retry</button></div>`;
  } else if (orders.length === 0) {
    body = `<div style="padding:4rem 2rem;text-align:center;"><p style="color:var(--text-muted);margin-bottom:1rem;">No transactions found in this account.</p><a href="#/explore" class="btn btn-primary btn-sm">Explore Catalog</a></div>`;
  } else {
    body = `<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;text-align:left;font-size:.9rem;min-width:980px;"><thead><tr style="background:var(--bg-secondary);border-bottom:1px solid var(--border-subtle);color:var(--text-muted);font-size:.72rem;text-transform:uppercase;font-weight:700;"><th style="padding:1rem 1.25rem;">Order ID</th><th style="padding:1rem 1.25rem;">Publication</th><th style="padding:1rem 1.25rem;">Date</th><th style="padding:1rem 1.25rem;">Amount</th><th style="padding:1rem 1.25rem;">Gateway / Type</th><th style="padding:1rem 1.25rem;">Status</th><th style="padding:1rem 1.25rem;text-align:right;">Action</th></tr></thead><tbody>${orders.map(orderRow).join('')}</tbody></table></div>`;
  }
  return `<div class="orders-page animate-fade-in" style="background:var(--bg-secondary);min-height:85vh;padding:3.5rem 0 5rem;"><div class="container" style="max-width:1100px;"><div style="margin-bottom:2.5rem;display:flex;justify-content:space-between;align-items:flex-end;gap:1rem;flex-wrap:wrap;"><div><div class="badge badge-bookora" style="margin-bottom:.5rem;">Billing History</div><h1 style="font-family:var(--font-display);font-size:2.2rem;font-weight:800;color:var(--text-primary);">Order History</h1><p style="font-size:.95rem;color:var(--text-secondary);margin-top:.25rem;">Review your receipts, order IDs, and verified Cashfree transaction details.</p></div>${loaded && !error ? `<button type="button" class="btn btn-secondary btn-sm orders-retry-btn">Refresh</button>` : ''}</div><div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-sm);">${body}</div></div></div>`;
}
