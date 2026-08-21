/* Bookora Orders permanent data bridge.
 * The payment backend stores orders against the Bookora application user id
 * (order.user_id), not necessarily the Firebase Auth uid. Resolve that id from
 * the authenticated Firestore user profile and load the real orders collection.
 */
import { state } from './state.js';

let running = false;
let lastSignature = '';
let unsubscribeOrders = null;

function firebaseAuthUser() {
  try { return window.firebase?.auth?.()?.currentUser || null; } catch (_) { return null; }
}

function normalize(raw, id) {
  const d = raw || {};
  const amount = d.finalAmount ?? d.amount ?? d.orderAmount ?? d.order_amount ?? d.totalAmount ?? 0;
  const paymentStatus = String(d.paymentStatus || d.payment_status || d.orderStatus || d.order_status || d.status || 'PENDING').toUpperCase();
  const fulfillmentStatus = String(d.fulfillmentStatus || d.fulfillment_status || '').toUpperCase();
  const bookTitle = d.productTitle || d.product_title || d.bookTitle || d.book_title || d.title || 'eBook Purchase';
  const date = d.paidAt || d.paid_at || d.paymentTime || d.payment_time || d.createdAt || d.created_at || d.updatedAt || d.updated_at || null;
  const transaction = d.cashfreePaymentId || d.cashfree_payment_id || d.bankReference || d.bank_reference || d.cashfreeOrderId || d.cashfree_order_id || d.transaction_id || '';
  const finalStatus = fulfillmentStatus === 'FULFILLED' && paymentStatus === 'PAID' ? 'COMPLETED' : paymentStatus;
  return {
    id: String(id || d.bookoraOrderId || d.bookora_order_id || d.orderId || d.order_id || ''),
    book_id: String(d.productId || d.product_id || d.bookId || d.book_id || ''),
    book_title: String(bookTitle),
    amount: Number(amount) || 0,
    date,
    transaction_id: String(transaction),
    status: finalStatus,
    paymentStatus,
    orderStatus: String(d.orderStatus || d.order_status || finalStatus).toUpperCase(),
    fulfillmentStatus,
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

function setOrders(found) {
  const orders = [...found.values()].filter(order => order.id);
  orders.sort((a, b) => {
    const at = new Date(a.date || 0).getTime() || 0;
    const bt = new Date(b.date || 0).getTime() || 0;
    return bt - at;
  });
  state.orders = orders;
  state.notify('ORDERS_SYNCED', orders);
}

async function resolveBookoraUserId(db, authUser) {
  const candidates = [];
  const stateUser = state.currentUser || {};
  for (const value of [stateUser.id, stateUser.userId, stateUser.bookoraUserId]) {
    if (value != null && String(value).trim()) candidates.push(String(value).trim());
  }

  // The backend creates orders with user.get("id"), which is the Bookora
  // application user id (usr-xxxx), not Firebase's uid. Resolve it from the
  // Firestore users profile when the cached state does not contain it.
  if (authUser?.email) {
    try {
      const byUid = await db.collection('users').doc(authUser.uid).get({ source: 'server' });
      if (byUid.exists) {
        const profile = byUid.data() || {};
        for (const value of [profile.id, profile.userId, profile.bookoraUserId]) {
          if (value != null && String(value).trim()) candidates.push(String(value).trim());
        }
      }
    } catch (error) {
      console.warn('[Bookora Orders] user profile lookup skipped:', error.message);
    }

    try {
      const byEmail = await db.collection('users').where('email', '==', authUser.email).limit(5).get({ source: 'server' });
      byEmail.forEach(doc => {
        const profile = doc.data() || {};
        for (const value of [profile.id, profile.userId, profile.bookoraUserId, doc.id]) {
          if (value != null && String(value).trim()) candidates.push(String(value).trim());
        }
      });
    } catch (error) {
      console.warn('[Bookora Orders] email user lookup skipped:', error.message);
    }
  }

  return [...new Set(candidates)];
}

async function queryOrders(db, field, value, found) {
  if (value == null || !String(value).trim()) return;
  try {
    const snap = await db.collection('orders').where(field, '==', value).get({ source: 'server' });
    snap.forEach(doc => found.set(doc.id, normalize(doc.data(), doc.id)));
  } catch (error) {
    console.warn(`[Bookora Orders] query ${field} skipped:`, error.message);
  }
}

async function loadOrders() {
  if (running) return;
  const authUser = firebaseAuthUser();
  if (!authUser || !window.firebase?.firestore) return;

  running = true;
  try {
    const db = window.firebase.firestore();
    const found = new Map();
    const appUserIds = await resolveBookoraUserId(db, authUser);

    // IMPORTANT: production checkout stores order.user_id = Bookora user's
    // application id. Query that first, then retain Firebase/email fallbacks
    // for older orders.
    for (const id of appUserIds) await queryOrders(db, 'userId', id, found);
    await queryOrders(db, 'userId', authUser.uid, found);
    await queryOrders(db, 'buyerId', authUser.uid, found);
    await queryOrders(db, 'user_id', authUser.uid, found);
    await queryOrders(db, 'buyer_id', authUser.uid, found);

    if (authUser.email) {
      await queryOrders(db, 'userEmail', authUser.email, found);
      await queryOrders(db, 'buyerEmail', authUser.email, found);
      await queryOrders(db, 'user_email', authUser.email, found);
      await queryOrders(db, 'buyer_email', authUser.email, found);
    }

    setOrders(found);
    lastSignature = `${authUser.uid}:${appUserIds.join(',')}:${found.size}`;
  } catch (error) {
    console.warn('[Bookora Orders] Firestore order history failed:', error);
  } finally {
    running = false;
  }
}

function attachRealtimeListener() {
  try {
    const authUser = firebaseAuthUser();
    if (!authUser || !window.firebase?.firestore) return;
    if (unsubscribeOrders) { unsubscribeOrders(); unsubscribeOrders = null; }
    // A lightweight refresh listener is used instead of a broad collection
    // listener because the backend ownership id can differ from Firebase uid.
    unsubscribeOrders = window.firebase.auth().onAuthStateChanged(() => {
      window.setTimeout(loadOrders, 100);
    });
  } catch (_) {}
}

function boot() {
  loadOrders();
  attachRealtimeListener();
  state.subscribe((event) => {
    if (event === 'USER_LOGGED_IN' || event === 'AUTH_STATE_CHANGED' || event === 'DATA_SYNCED' || event === 'ORDERS_SYNCED') {
      window.setTimeout(loadOrders, 100);
    }
  });
  window.addEventListener('hashchange', () => {
    if (window.location.hash.split('?')[0] === '#/orders') loadOrders();
  });
  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    loadOrders();
    if (attempts >= 60) window.clearInterval(timer);
  }, 500);
}

boot();
