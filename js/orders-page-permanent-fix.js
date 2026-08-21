/* Bookora Order History - authoritative Firestore loader.
 * Orders are mirrored with the Bookora application user id (usr-xxxx), while
 * Firebase Auth uses a different uid. Resolve the application user from the
 * backend Firebase session first, then query Firestore orders by that id.
 */
import { state } from './state.js';

let loading = false;
let refreshTimer = null;

function getFirebaseUser() {
  try { return window.firebase?.auth?.()?.currentUser || null; } catch (_) { return null; }
}

function normalize(raw, id) {
  const d = raw || {};
  const paymentStatus = String(d.paymentStatus || d.payment_status || '').toUpperCase();
  const orderStatus = String(d.orderStatus || d.order_status || '').toUpperCase();
  const fulfillmentStatus = String(d.fulfillmentStatus || d.fulfillment_status || '').toUpperCase();
  const status = paymentStatus === 'PAID' && ['FULFILLED','COMPLETED'].includes(fulfillmentStatus || orderStatus)
    ? 'COMPLETED' : (paymentStatus || orderStatus || 'PENDING');
  return {
    id: String(id || d.bookoraOrderId || d.bookora_order_id || d.orderId || ''),
    book_id: String(d.productId || d.product_id || d.bookId || d.book_id || ''),
    book_title: String(d.productTitle || d.product_title || d.bookTitle || d.book_title || 'eBook Purchase'),
    amount: Number(d.finalAmount ?? d.amount ?? d.orderAmount ?? 0) || 0,
    date: d.paidAt || d.paid_at || d.createdAt || d.created_at || d.updatedAt || d.updated_at || null,
    transaction_id: String(d.cashfreePaymentId || d.cashfree_payment_id || d.bankReference || d.bank_reference || ''),
    status,
    paymentStatus: paymentStatus || 'PENDING',
    orderStatus: orderStatus || status,
    fulfillmentStatus: fulfillmentStatus || '',
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

function publish(found) {
  const orders = [...found.values()].filter(o => o.id);
  orders.sort((a,b) => (new Date(b.date || 0).getTime() || 0) - (new Date(a.date || 0).getTime() || 0));
  state.orders = orders;
  state.ordersLoading = false;
  state.ordersLoaded = true;
  state.notify('ORDERS_SYNCED', orders);
  window.dispatchEvent(new CustomEvent('bookora-orders-updated', { detail: orders }));
}

async function getBackendUser(firebaseUser) {
  const api = String(window.BOOKORA_API_URL || '').replace(/\/$/, '');
  if (!api || !firebaseUser) return null;
  try {
    const token = await firebaseUser.getIdToken(false);
    const response = await fetch(`${api}/api/auth/firebase`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: state.currentUser?.role || 'buyer' }),
      cache: 'no-store'
    });
    if (!response.ok) return null;
    const payload = await response.json().catch(() => ({}));
    return payload?.user || null;
  } catch (error) {
    console.warn('[Bookora Orders] backend identity lookup failed:', error?.message || error);
    return null;
  }
}

async function query(db, field, value, found) {
  if (value == null || String(value).trim() === '') return;
  try {
    const snap = await db.collection('orders').where(field, '==', value).get({ source: 'server' });
    snap.forEach(doc => found.set(doc.id, normalize(doc.data(), doc.id)));
  } catch (error) {
    console.warn(`[Bookora Orders] ${field} query skipped:`, error?.message || error);
  }
}

async function loadOrders() {
  if (loading) return;
  const firebaseUser = getFirebaseUser();
  if (!firebaseUser || !window.firebase?.firestore) return;

  loading = true;
  state.ordersLoading = true;
  try {
    const db = window.firebase.firestore();
    const found = new Map();
    const backendUser = await getBackendUser(firebaseUser);
    const appIds = new Set();

    for (const value of [backendUser?.id, backendUser?.userId, backendUser?.bookoraUserId,
      state.currentUser?.id, state.currentUser?.userId, state.currentUser?.bookoraUserId]) {
      if (value != null && String(value).trim()) appIds.add(String(value).trim());
    }

    try {
      const cached = JSON.parse(localStorage.getItem('bookora_user_profile') || 'null');
      for (const value of [cached?.id, cached?.userId, cached?.bookoraUserId]) {
        if (value != null && String(value).trim()) appIds.add(String(value).trim());
      }
    } catch (_) {}

    try {
      const profile = await db.collection('users').doc(firebaseUser.uid).get({ source: 'server' });
      if (profile.exists) {
        const p = profile.data() || {};
        for (const value of [p.id, p.userId, p.bookoraUserId, p.appUserId]) {
          if (value != null && String(value).trim()) appIds.add(String(value).trim());
        }
      }
    } catch (_) {}

    // Authoritative production schema: orders.userId = Bookora application user id.
    for (const id of appIds) await query(db, 'userId', id, found);

    // Backward compatibility with older order documents.
    await query(db, 'userId', firebaseUser.uid, found);
    await query(db, 'buyerId', firebaseUser.uid, found);
    await query(db, 'user_id', firebaseUser.uid, found);
    await query(db, 'buyer_id', firebaseUser.uid, found);
    if (firebaseUser.email) {
      await query(db, 'userEmail', firebaseUser.email, found);
      await query(db, 'buyerEmail', firebaseUser.email, found);
    }

    publish(found);
    console.info('[Bookora Orders] Firestore orders loaded:', [...found.values()].map(o => ({ id:o.id, title:o.book_title, amount:o.amount, status:o.status })));
  } catch (error) {
    state.ordersLoading = false;
    state.ordersLoaded = false;
    console.error('[Bookora Orders] loader failed:', error);
  } finally {
    loading = false;
  }
}

function boot() {
  state.ordersLoading = true;
  state.ordersLoaded = false;
  loadOrders();

  try {
    const auth = window.firebase?.auth?.();
    if (auth) auth.onAuthStateChanged(() => window.setTimeout(loadOrders, 150));
  } catch (_) {}

  state.subscribe(event => {
    if (event === 'USER_LOGGED_IN' || event === 'AUTH_STATE_CHANGED' || event === 'DATA_SYNCED') window.setTimeout(loadOrders, 150);
  });

  window.addEventListener('hashchange', () => {
    if ((window.location.hash || '').split('?')[0] === '#/orders') window.setTimeout(loadOrders, 50);
  });

  let attempts = 0;
  refreshTimer = window.setInterval(() => {
    attempts += 1;
    if (getFirebaseUser()) loadOrders();
    if (attempts >= 40) window.clearInterval(refreshTimer);
  }, 1000);
}

boot();
