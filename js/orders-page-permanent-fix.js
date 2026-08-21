/* Bookora Orders permanent data bridge.
 * Orders are owned by the Bookora application user id (usr-xxxx), while
 * Firebase Auth uses a different uid. Resolve the application id first and
 * query Firestore orders by that id. Keep Firebase/email fallbacks for older
 * records. Never use a broad orders read because that would expose other
 * buyers' transactions.
 */
import { state } from './state.js';

let running = false;
let unsubscribeAuth = null;

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

function addCandidate(list, value) {
  if (value != null && String(value).trim()) list.push(String(value).trim());
}

async function resolveBookoraUserIds(db, authUser) {
  const candidates = [];
  const stateUser = state.currentUser || {};

  // Cached/session profile can already contain the application identity.
  addCandidate(candidates, stateUser.id);
  addCandidate(candidates, stateUser.userId);
  addCandidate(candidates, stateUser.bookoraUserId);
  addCandidate(candidates, stateUser.bookora_user_id);

  const inspectProfile = (profile, docId = '') => {
    const p = profile || {};
    addCandidate(candidates, p.id);
    addCandidate(candidates, p.userId);
    addCandidate(candidates, p.bookoraUserId);
    addCandidate(candidates, p.bookora_user_id);
    addCandidate(candidates, p.applicationUserId);
    addCandidate(candidates, p.application_user_id);
    // Only use the document id if the document explicitly represents this
    // Firebase user. A Firebase uid itself must never be treated as usr-xxxx.
    if (p.firebaseUid === authUser.uid || p.firebase_uid === authUser.uid || p.authUid === authUser.uid || p.auth_uid === authUser.uid) {
      addCandidate(candidates, docId);
    }
  };

  // Normal Firebase layout: users/{firebaseUid}.
  try {
    const byUid = await db.collection('users').doc(authUser.uid).get({ source: 'server' });
    if (byUid.exists) inspectProfile(byUid.data(), byUid.id);
  } catch (error) {
    console.warn('[Bookora Orders] users/{uid} lookup skipped:', error.message);
  }

  // Some Bookora user records store the Firebase identity in a field instead
  // of using it as the document id. Support all known variants.
  for (const field of ['uid', 'firebaseUid', 'firebase_uid', 'authUid', 'auth_uid']) {
    try {
      const snap = await db.collection('users').where(field, '==', authUser.uid).limit(10).get({ source: 'server' });
      snap.forEach(doc => inspectProfile(doc.data(), doc.id));
    } catch (error) {
      console.warn(`[Bookora Orders] users.${field} lookup skipped:`, error.message);
    }
  }

  if (authUser.email) {
    for (const field of ['email', 'userEmail', 'user_email']) {
      try {
        const snap = await db.collection('users').where(field, '==', authUser.email).limit(10).get({ source: 'server' });
        snap.forEach(doc => inspectProfile(doc.data(), doc.id));
      } catch (error) {
        console.warn(`[Bookora Orders] users.${field} lookup skipped:`, error.message);
      }
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
    console.warn(`[Bookora Orders] query ${field}=${value} skipped:`, error.message);
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
    const appUserIds = await resolveBookoraUserIds(db, authUser);

    // PRIMARY: the production order shown by the user has userId=usr-077055af.
    // Resolve that Bookora id and query it directly.
    for (const appUserId of appUserIds) {
      await queryOrders(db, 'userId', appUserId, found);
      await queryOrders(db, 'user_id', appUserId, found);
      await queryOrders(db, 'buyerId', appUserId, found);
      await queryOrders(db, 'buyer_id', appUserId, found);
    }

    // Legacy ownership formats.
    await queryOrders(db, 'userId', authUser.uid, found);
    await queryOrders(db, 'user_id', authUser.uid, found);
    await queryOrders(db, 'buyerId', authUser.uid, found);
    await queryOrders(db, 'buyer_id', authUser.uid, found);

    if (authUser.email) {
      await queryOrders(db, 'userEmail', authUser.email, found);
      await queryOrders(db, 'buyerEmail', authUser.email, found);
      await queryOrders(db, 'user_email', authUser.email, found);
      await queryOrders(db, 'buyer_email', authUser.email, found);
    }

    setOrders(found);
  } catch (error) {
    console.warn('[Bookora Orders] Firestore order history failed:', error);
  } finally {
    running = false;
  }
}

function boot() {
  loadOrders();

  state.subscribe((event) => {
    if (event === 'USER_LOGGED_IN' || event === 'AUTH_STATE_CHANGED' || event === 'DATA_SYNCED' || event === 'ORDERS_SYNCED') {
      window.setTimeout(loadOrders, 100);
    }
  });

  try {
    if (window.firebase?.auth) {
      unsubscribeAuth = window.firebase.auth().onAuthStateChanged(() => window.setTimeout(loadOrders, 100));
    }
  } catch (_) {}

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
