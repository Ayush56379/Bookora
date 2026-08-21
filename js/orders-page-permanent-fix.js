/* Bookora Order History - production loader.
 * Primary source: existing authenticated backend /api/orders (authoritative JSON/Drive DB).
 * Compatibility source: Firestore orders/{bookoraOrderId} mirror.
 * The two sources are merged by Bookora Order ID and never expose another user's order.
 */
import { state } from './state.js';

let loading = false;
let refreshTimer = null;

function getFirebaseUser() {
  try { return window.firebase?.auth?.()?.currentUser || null; } catch (_) { return null; }
}

function clean(value) {
  return String(value ?? '').trim();
}

function normalizeStatus(value) {
  const s = clean(value).toUpperCase().replace(/[\s-]+/g, '_');
  if (['PAID','SUCCESS','SUCCESSFUL','COMPLETED','FULFILLED'].includes(s)) return s === 'FULFILLED' ? 'FULFILLED' : 'PAID';
  if (['FAILED','FAILURE','PAYMENT_FAILED','TERMINATED'].includes(s)) return 'FAILED';
  if (['CANCELLED','CANCELED','USER_DROPPED','USER_CANCELLED'].includes(s)) return 'CANCELLED';
  if (['REFUNDED','REFUND'].includes(s)) return 'REFUNDED';
  if (['EXPIRED','PAYMENT_EXPIRED'].includes(s)) return 'EXPIRED';
  if (['PENDING','ACTIVE','NOT_ATTEMPTED','INCOMPLETE','PROCESSING','CREATED','PAYMENT_PENDING'].includes(s)) return 'PENDING';
  return '';
}

function normalize(raw, id) {
  const d = raw || {};
  const paymentStatus = normalizeStatus(d.paymentStatus || d.payment_status || d.payment_state || d.payment?.payment_status);
  const orderStatus = normalizeStatus(d.orderStatus || d.order_status || d.order?.order_status || d.status);
  const fulfillmentStatus = clean(d.fulfillmentStatus || d.fulfillment_status || d.fulfillment?.status).toUpperCase();
  const status = paymentStatus || orderStatus || (fulfillmentStatus === 'FULFILLED' ? 'FULFILLED' : 'PENDING');
  const rawId = id || d.bookoraOrderId || d.bookora_order_id || d.orderId || d.order_id || d.id;
  const amount = Number(d.finalAmount ?? d.final_amount ?? d.amount ?? d.orderAmount ?? d.order_amount ?? d.payment?.payment_amount ?? 0) || 0;
  return {
    id: clean(rawId),
    book_id: clean(d.productId || d.product_id || d.bookId || d.book_id || d.book?.id),
    book_title: clean(d.productTitle || d.product_title || d.bookTitle || d.book_title || d.book?.title) || 'eBook Purchase',
    amount,
    date: d.paidAt || d.paid_at || d.createdAt || d.created_at || d.orderDate || d.order_date || d.updatedAt || d.updated_at || null,
    transaction_id: clean(d.cashfreePaymentId || d.cashfree_payment_id || d.payment_id || d.bankReference || d.bank_reference),
    status,
    paymentStatus: paymentStatus || 'PENDING',
    orderStatus: orderStatus || 'PENDING',
    fulfillmentStatus,
    cashfreeOrderId: clean(d.cashfreeOrderId || d.cashfree_order_id || d.cashfree?.order_id || d.order?.cf_order_id),
    cashfreePaymentId: clean(d.cashfreePaymentId || d.cashfree_payment_id || d.payment_id || d.cashfree?.payment?.cf_payment_id),
    currency: clean(d.currency || d.payment?.payment_currency) || 'INR',
    originalAmount: d.originalAmount ?? d.original_amount,
    discountAmount: d.discountAmount ?? d.discount_amount,
    couponCode: clean(d.couponCode || d.coupon_code),
    orderType: clean(d.orderType || d.order_type || d.purchaseType || d.purchase_type || d.fulfillment_type),
    commission: d.commission,
    sellerAmount: d.sellerAmount ?? d.seller_amount,
    raw: d
  };
}

function normalizePayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.orders)) return payload.orders;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.orders)) return payload.data.orders;
  if (Array.isArray(payload?.results)) return payload.results;
  return null;
}

function publish(found) {
  const orders = [...found.values()].filter(o => o.id);
  orders.sort((a, b) => (new Date(b.date || 0).getTime() || 0) - (new Date(a.date || 0).getTime() || 0));
  state.orders = orders;
  state.ordersLoading = false;
  state.ordersLoaded = true;
  state.ordersLoadError = '';
  state.notify('ORDERS_SYNCED', orders);
  window.dispatchEvent(new CustomEvent('bookora-orders-updated', { detail: orders }));
  console.info('[Orders] Parsed orders:', orders.map(o => ({ id: o.id, status: o.status, amount: o.amount })));
}

function fail(message) {
  state.ordersLoading = false;
  state.ordersLoaded = false;
  state.ordersLoadError = clean(message) || 'Unable to load your orders. Please try again.';
  state.notify('ORDERS_LOAD_ERROR', state.ordersLoadError);
  window.dispatchEvent(new CustomEvent('bookora-orders-error', { detail: state.ordersLoadError }));
}

async function establishBackendSession(firebaseUser, forceRefresh = false) {
  const api = clean(window.BOOKORA_API_URL || '').replace(/\/$/, '');
  if (!api || !firebaseUser) return null;
  try {
    const idToken = await firebaseUser.getIdToken(forceRefresh);
    const response = await fetch(`${api}/api/auth/firebase`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: state.currentUser?.role || 'buyer' }),
      cache: 'no-store'
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.token) throw new Error(payload?.error || `Authentication HTTP ${response.status}`);
    state.token = payload.token;
    state.isAuthenticated = true;
    if (payload.user) state.currentUser = { ...(state.currentUser || {}), ...payload.user };
    try { localStorage.setItem('bookora_auth_token', payload.token); } catch (_) {}
    return payload.user || state.currentUser;
  } catch (error) {
    console.warn('[Orders] backend authentication mapping failed:', error?.message || error);
    return null;
  }
}

async function fetchBackendOrders(firebaseUser, found) {
  const api = clean(window.BOOKORA_API_URL || '').replace(/\/$/, '');
  if (!api) throw new Error('Bookora backend URL is not configured.');
  let sessionReady = !!clean(state.token);
  if (!sessionReady) sessionReady = !!(await establishBackendSession(firebaseUser, false));
  if (!sessionReady) throw new Error('Authenticated Bookora backend session is not ready.');

  let response = await fetch(`${api}/api/orders`, {
    method: 'GET',
    headers: { Accept: 'application/json', Authorization: `Bearer ${state.token}` },
    cache: 'no-store'
  });
  if (response.status === 401) {
    state.token = '';
    try { localStorage.removeItem('bookora_auth_token'); } catch (_) {}
    if (!await establishBackendSession(firebaseUser, true)) throw new Error('Your secure session expired. Please sign in again.');
    response = await fetch(`${api}/api/orders`, {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: `Bearer ${state.token}` },
      cache: 'no-store'
    });
  }
  const payload = await response.json().catch(() => ({}));
  console.info('[Orders] API response:', { status: response.status, ok: response.ok, shape: Array.isArray(payload) ? 'array' : Object.keys(payload || {}) });
  if (!response.ok) throw new Error(payload?.error || `Orders API HTTP ${response.status}`);
  const list = normalizePayload(payload);
  if (!list) throw new Error('Orders API returned an unsupported response structure.');
  list.forEach(order => {
    const normalized = normalize(order);
    if (normalized.id) found.set(normalized.id, normalized);
  });
  console.info('[Orders] Backend orders found:', list.length);
  return list.length;
}

async function queryFirestore(db, field, value, found) {
  if (!value || !String(value).trim()) return;
  try {
    const snap = await db.collection('orders').where(field, '==', value).get({ source: 'server' });
    snap.forEach(doc => {
      const normalized = normalize(doc.data(), doc.id);
      if (normalized.id) found.set(normalized.id, normalized);
    });
  } catch (error) {
    console.warn(`[Orders] Firestore ${field} query skipped:`, error?.message || error);
  }
}

async function fetchFirestoreFallback(firebaseUser, backendUser, found) {
  if (!window.firebase?.firestore || !firebaseUser) return 0;
  const db = window.firebase.firestore();
  const ids = new Set();
  for (const value of [
    backendUser?.id, backendUser?.userId, backendUser?.bookoraUserId,
    state.currentUser?.id, state.currentUser?.userId, state.currentUser?.bookoraUserId,
    firebaseUser.uid
  ]) {
    if (value && String(value).trim()) ids.add(String(value).trim());
  }
  const emails = new Set();
  for (const value of [firebaseUser.email, backendUser?.email, state.currentUser?.email]) {
    if (value && String(value).trim()) emails.add(String(value).trim().toLowerCase());
  }
  try {
    const profile = await db.collection('users').doc(firebaseUser.uid).get({ source: 'server' });
    if (profile.exists) {
      const p = profile.data() || {};
      for (const value of [p.id, p.userId, p.bookoraUserId, p.appUserId]) if (value && String(value).trim()) ids.add(String(value).trim());
      for (const value of [p.email, p.userEmail, p.buyerEmail]) if (value && String(value).trim()) emails.add(String(value).trim().toLowerCase());
    }
  } catch (_) {}

  for (const id of ids) {
    await queryFirestore(db, 'userId', id, found);
    await queryFirestore(db, 'user_id', id, found);
    await queryFirestore(db, 'buyerId', id, found);
    await queryFirestore(db, 'buyer_id', id, found);
    await queryFirestore(db, 'firebaseUid', id, found);
    await queryFirestore(db, 'uid', id, found);
  }
  for (const email of emails) {
    await queryFirestore(db, 'userEmail', email, found);
    await queryFirestore(db, 'buyerEmail', email, found);
    await queryFirestore(db, 'customerEmail', email, found);
  }
  return found.size;
}

async function loadOrders(force = false) {
  if (loading && !force) return;
  const firebaseUser = getFirebaseUser();
  if (!firebaseUser) {
    state.ordersLoading = false;
    state.ordersLoaded = false;
    state.ordersLoadError = '';
    return;
  }
  loading = true;
  state.ordersLoading = true;
  state.ordersLoadError = '';
  try {
    const found = new Map();
    let backendCount = 0;
    let backendError = null;
    try {
      const backendUser = await establishBackendSession(firebaseUser, false);
      backendCount = await fetchBackendOrders(firebaseUser, found);
      console.info('[Orders] Current user mapping:', { id: backendUser?.id || state.currentUser?.id || '', email: backendUser?.email || firebaseUser.email || '' });
    } catch (error) {
      backendError = error;
      console.warn('[Orders] Backend order fetch failed:', error?.message || error);
    }

    // Firestore is a compatibility mirror, never the only source.
    try {
      const backendUser = state.currentUser || {};
      await fetchFirestoreFallback(firebaseUser, backendUser, found);
    } catch (error) {
      console.warn('[Orders] Firestore compatibility fallback failed:', error?.message || error);
    }

    if (found.size > 0) {
      publish(found);
      return;
    }
    if (backendError && backendCount === 0) {
      fail(backendError.message || 'Unable to load your orders. Please try again.');
      return;
    }
    publish(found);
  } catch (error) {
    console.error('[Orders] loader failed:', error);
    fail(error?.message || 'Unable to load your orders. Please try again.');
  } finally {
    loading = false;
  }
}

window.BookoraOrders = window.BookoraOrders || {};
window.BookoraOrders.refresh = () => loadOrders(true);
window.BookoraOrders.getCurrentUser = getFirebaseUser;

function boot() {
  state.ordersLoading = true;
  state.ordersLoaded = false;
  state.ordersLoadError = '';
  loadOrders();

  try {
    const auth = window.firebase?.auth?.();
    if (auth) auth.onAuthStateChanged(() => window.setTimeout(() => loadOrders(true), 150));
  } catch (_) {}

  state.subscribe(event => {
    if (event === 'USER_LOGGED_IN' || event === 'AUTH_STATE_CHANGED' || event === 'DATA_SYNCED') window.setTimeout(() => loadOrders(true), 150);
  });

  window.addEventListener('hashchange', () => {
    if ((window.location.hash || '').split('?')[0] === '#/orders') window.setTimeout(() => loadOrders(true), 50);
  });

  let attempts = 0;
  refreshTimer = window.setInterval(() => {
    attempts += 1;
    if (getFirebaseUser() && (state.ordersLoading || !state.ordersLoaded)) loadOrders(true);
    if (attempts >= 40) window.clearInterval(refreshTimer);
  }, 1000);
}

boot();
