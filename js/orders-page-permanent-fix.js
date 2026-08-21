/* Bookora Orders permanent data bridge.
 * The normal global sync hydrates catalog/library data, but historically did not
 * hydrate a buyer's Firestore orders. This bridge loads only the signed-in
 * user's own orders and feeds them into state.orders.
 */
import { state } from './state.js';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let running = false;
let lastUid = '';

function currentUser() {
  try { return window.firebase?.auth?.()?.currentUser || null; } catch (_) { return null; }
}

function normalize(raw, id) {
  const d = raw || {};
  const amount = d.finalAmount ?? d.amount ?? d.orderAmount ?? d.order_amount ?? d.totalAmount ?? 0;
  const statusRaw = d.paymentStatus || d.payment_status || d.orderStatus || d.order_status || d.status || 'PENDING';
  const status = String(statusRaw).toUpperCase();
  const bookTitle = d.bookTitle || d.book_title || d.title || d.productTitle || d.product_title || 'eBook Purchase';
  const date = d.paidAt || d.paid_at || d.paymentTime || d.payment_time || d.createdAt || d.created_at || d.updatedAt || d.updated_at || null;
  const transaction = d.cashfreePaymentId || d.cashfree_payment_id || d.bankReference || d.bank_reference || d.cashfreeOrderId || d.cashfree_order_id || d.transaction_id || '';
  return {
    id: String(id || d.bookoraOrderId || d.bookora_order_id || d.orderId || d.order_id || ''),
    book_id: String(d.bookId || d.book_id || d.productId || d.product_id || ''),
    book_title: String(bookTitle),
    amount: Number(amount) || 0,
    date,
    transaction_id: String(transaction),
    status,
    paymentStatus: status,
    orderStatus: String(d.orderStatus || d.order_status || status),
    fulfillmentStatus: String(d.fulfillmentStatus || d.fulfillment_status || ''),
    cashfreeOrderId: String(d.cashfreeOrderId || d.cashfree_order_id || ''),
    cashfreePaymentId: String(d.cashfreePaymentId || d.cashfree_payment_id || ''),
    currency: d.currency || 'INR',
    originalAmount: d.originalAmount,
    discountAmount: d.discountAmount,
    couponCode: d.couponCode || d.coupon_code || '',
    commission: d.commission,
    sellerAmount: d.sellerAmount,
    raw: d
  };
}

async function loadOrders() {
  if (running) return;
  const user = currentUser();
  const uid = String(user?.uid || state.currentUser?.uid || '');
  if (!uid || !window.firebase?.firestore) return;
  if (lastUid === uid && Array.isArray(state.orders) && state.orders.length) return;
  running = true;
  try {
    const db = window.firebase.firestore();
    const queries = [
      ['userId', uid],
      ['buyerId', uid],
      ['user_id', uid],
      ['buyer_id', uid]
    ];
    const found = new Map();
    for (const [field, value] of queries) {
      try {
        const snap = await db.collection('orders').where(field, '==', value).get({ source: 'server' });
        snap.forEach(doc => found.set(doc.id, normalize(doc.data(), doc.id)));
        if (found.size) break;
      } catch (error) {
        console.warn(`Bookora orders query ${field} skipped:`, error.message);
      }
    }

    // Some older orders use email ownership instead of uid ownership.
    if (!found.size && user.email) {
      for (const field of ['userEmail', 'buyerEmail', 'user_email', 'buyer_email']) {
        try {
          const snap = await db.collection('orders').where(field, '==', user.email).get({ source: 'server' });
          snap.forEach(doc => found.set(doc.id, normalize(doc.data(), doc.id)));
          if (found.size) break;
        } catch (error) {
          console.warn(`Bookora orders email query ${field} skipped:`, error.message);
        }
      }
    }

    const orders = [...found.values()].filter(order => order.id);
    orders.sort((a, b) => {
      const at = new Date(a.date || 0).getTime() || 0;
      const bt = new Date(b.date || 0).getTime() || 0;
      return bt - at;
    });
    state.orders = orders;
    lastUid = uid;
    if (window.location.hash.split('?')[0] === '#/orders') {
      state.notify('DATA_SYNCED');
    }
  } catch (error) {
    console.warn('Bookora buyer order history sync failed:', error);
  } finally {
    running = false;
  }
}

function boot() {
  loadOrders();
  state.subscribe((event) => {
    if (event === 'USER_LOGGED_IN' || event === 'AUTH_STATE_CHANGED' || event === 'DATA_SYNCED') {
      window.setTimeout(loadOrders, 150);
    }
  });
  window.addEventListener('hashchange', () => {
    if (window.location.hash.split('?')[0] === '#/orders') loadOrders();
  });
  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    loadOrders();
    if (attempts >= 40) window.clearInterval(timer);
  }, 500);
}

boot();
