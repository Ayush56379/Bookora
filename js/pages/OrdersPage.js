// OrdersPage Component
import { state } from '../state.js';
import { formatPrice, formatDate } from '../utils/formatters.js';
import { updateSEO } from '../utils/seo.js';

function esc(value) {
  return String(value ?? '').replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[c]));
}

function statusMeta(order) {
  const raw = String(order?.status || order?.paymentStatus || order?.payment_status || 'PENDING').toUpperCase();
  if (['PAID', 'SUCCESS', 'FULFILLED', 'COMPLETED'].includes(raw)) return { label: 'PAID', cls: 'badge-featured', icon: '✓' };
  if (raw === 'FAILED') return { label: 'FAILED', cls: 'badge-bookora', icon: '×' };
  if (raw === 'CANCELLED' || raw === 'CANCELED') return { label: 'CANCELLED', cls: 'badge-bookora', icon: '×' };
  if (raw === 'REFUNDED') return { label: 'REFUNDED', cls: 'badge-bookora', icon: '↩' };
  if (raw === 'EXPIRED') return { label: 'EXPIRED', cls: 'badge-bookora', icon: '⌛' };
  return { label: 'PENDING', cls: 'badge-bookora', icon: '◷' };
}

function actionMarkup(order) {
  const status = String(order?.status || order?.paymentStatus || order?.payment_status || '').toUpperCase();
  const fulfilled = String(order?.fulfillmentStatus || order?.fulfillment_status || '').toUpperCase() === 'FULFILLED';
  if (['PAID', 'FULFILLED', 'COMPLETED', 'SUCCESS'].includes(status) && fulfilled) return `<a href="#/library" class="btn btn-primary btn-sm">Read / Download</a>`;
  return `<span class="orders-no-access">No access</span>`;
}

function normalizedOrder(order) {
  return {
    id: order?.id || order?.orderId || order?.bookoraOrderId || '—',
    title: order?.book_title || order?.bookTitle || order?.product_title || order?.productTitle || 'Bookora eBook',
    date: order?.date || order?.created_at || order?.createdAt || order?.order_date || '',
    amount: order?.amount ?? order?.total_amount ?? order?.totalAmount ?? 0,
    transaction: order?.cashfreePaymentId || order?.cashfree_payment_id || order?.payment_id || order?.transaction_id || '—',
    gatewayOrder: order?.cashfreeOrderId || order?.cashfree_order_id || '—',
    type: order?.orderType || order?.order_type || 'Digital eBook',
    fulfillment: order?.fulfillmentStatus || order?.fulfillment_status || ''
  };
}

function orderRow(order) {
  const o = normalizedOrder(order);
  const meta = statusMeta(order);
  return `<tr class="orders-row">
    <td class="orders-td orders-id">${esc(o.id)}</td>
    <td class="orders-td orders-publication"><strong class="orders-book-title">${esc(o.title)}</strong><span class="orders-subline">Payment: ${esc(o.transaction)}</span><span class="orders-subline">Cashfree Order: ${esc(o.gatewayOrder)}</span></td>
    <td class="orders-td orders-date">${esc(formatDate(o.date))}</td>
    <td class="orders-td orders-amount">${esc(formatPrice(o.amount))}</td>
    <td class="orders-td"><span class="badge badge-bookora orders-gateway-badge">Cashfree</span><span class="orders-type">${esc(o.type)}</span></td>
    <td class="orders-td"><span class="badge ${meta.cls} orders-status">${meta.icon} ${esc(meta.label)}</span>${o.fulfillment ? `<span class="orders-fulfillment">Fulfillment: ${esc(o.fulfillment)}</span>` : ''}</td>
    <td class="orders-td orders-action-cell">${actionMarkup(order)}</td>
  </tr>`;
}

function mobileOrderCard(order) {
  const o = normalizedOrder(order);
  const meta = statusMeta(order);
  return `<article class="orders-mobile-item">
    <div class="orders-mobile-top">
      <div class="orders-mobile-book-wrap"><div class="orders-mobile-book-title">${esc(o.title)}</div><div class="orders-mobile-order-id">${esc(o.id)}</div></div>
      <span class="badge ${meta.cls} orders-status">${meta.icon} ${esc(meta.label)}</span>
    </div>
    <div class="orders-mobile-grid">
      <div class="orders-mobile-label">Date</div><div class="orders-mobile-value">${esc(formatDate(o.date))}</div>
      <div class="orders-mobile-label">Amount</div><div class="orders-mobile-value orders-mobile-amount">${esc(formatPrice(o.amount))}</div>
      <div class="orders-mobile-label">Payment ID</div><div class="orders-mobile-value orders-mobile-mono">${esc(o.transaction)}</div>
      <div class="orders-mobile-label">Cashfree Order</div><div class="orders-mobile-value orders-mobile-mono">${esc(o.gatewayOrder)}</div>
      <div class="orders-mobile-label">Type</div><div class="orders-mobile-value">${esc(o.type)}</div>
      ${o.fulfillment ? `<div class="orders-mobile-label">Fulfillment</div><div class="orders-mobile-value">${esc(o.fulfillment)}</div>` : ''}
    </div>
    <div class="orders-mobile-action">${actionMarkup(order)}</div>
  </article>`;
}

export function renderOrdersPage() {
  updateSEO({ title: 'Order History & Receipts', description: 'View your verified Bookora purchases and Cashfree transaction details.' });
  const orders = Array.isArray(state.orders) ? state.orders : [];
  const loading = state.ordersLoading === true;
  const loaded = state.ordersLoaded === true;
  const error = String(state.ordersLoadError || '').trim();
  let body;

  if (loading && !loaded) {
    body = `<div class="orders-state"><div class="orders-spinner"></div><p>Loading your orders...</p></div>`;
  } else if (error && !loaded) {
    body = `<div class="orders-state"><div class="orders-error-icon">!</div><h3>Unable to load your orders</h3><p>${esc(error)}</p><button type="button" class="btn btn-primary btn-sm orders-retry-btn">Retry</button></div>`;
  } else if (orders.length === 0) {
    body = `<div class="orders-state"><p>No transactions found in this account.</p><a href="#/explore" class="btn btn-primary btn-sm">Explore Catalog</a></div>`;
  } else {
    body = `<div class="orders-table-wrap"><table class="orders-table"><thead><tr><th>Order ID</th><th>Publication</th><th>Date</th><th>Amount</th><th>Gateway / Type</th><th>Status</th><th class="orders-action-head">Action</th></tr></thead><tbody>${orders.map(orderRow).join('')}</tbody></table></div><div class="orders-mobile-list">${orders.map(mobileOrderCard).join('')}</div>`;
  }

  return `<div class="orders-page animate-fade-in"><div class="container orders-shell"><div class="orders-heading"><div><div class="badge badge-bookora orders-label">Billing History</div><h1>Order History</h1><p>Review your receipts, order IDs, and verified Cashfree transaction details.</p></div>${loaded && !error ? `<button type="button" class="btn btn-secondary btn-sm orders-retry-btn orders-refresh-btn">Refresh</button>` : ''}</div><div class="orders-card">${body}</div></div></div>`;
}
