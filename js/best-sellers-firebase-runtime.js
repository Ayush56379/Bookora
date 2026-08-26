// Bookora Best Sellers - Firebase PAID-orders ranking.
// Public users use the secure backend aggregation; admins can aggregate directly
// from their authorized Firestore orders collection for a fast UI response.
import { state } from './state.js';
import { apiUrl } from './config.js';

const CACHE_TTL = 60 * 1000;
const REQUEST_TIMEOUT = 5000;
let lastHydratedAt = 0;
let hydrationPromise = null;
let pendingRefresh = false;

function idOf(book) {
  return String(book?.id || book?.bookId || book?.book_id || book?.bookoraLibraryId || '').trim();
}

function normalizeStatus(value) {
  return String(value || '').trim().toUpperCase();
}

function orderBookId(order) {
  return String(order?.productId || order?.bookId || order?.book_id || order?.bookoraLibraryId || order?.bookoraLibraryID || '').trim();
}

function isPaidOrder(order) {
  const status = normalizeStatus(order?.paymentStatus || order?.payment_status || order?.status);
  return status === 'PAID';
}

function normalizeRanking(items) {
  const counts = new Map();
  for (const item of items || []) {
    const id = String(item?.bookId || item?.productId || item?.book_id || '').trim();
    if (!id) continue;
    const count = Number(item?.salesCount ?? item?.count ?? 0);
    if (Number.isFinite(count) && count > 0) counts.set(id, (counts.get(id) || 0) + count);
  }
  return [...counts.entries()].map(([bookId, salesCount]) => ({ bookId, salesCount }))
    .sort((a, b) => b.salesCount - a.salesCount || a.bookId.localeCompare(b.bookId));
}

async function fetchBackendRanking() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const response = await fetch(apiUrl('/api/books/bestseller-rankings'), {
      method: 'GET', headers: { Accept: 'application/json' }, credentials: 'omit', cache: 'no-store', signal: controller.signal
    });
    if (!response.ok) throw new Error(`Firebase bestseller endpoint HTTP ${response.status}`);
    const payload = await response.json();
    if (payload?.source !== 'firebase.orders' || payload?.paymentStatus !== 'PAID' || !Array.isArray(payload?.ranking)) {
      throw new Error('Best Seller source verification failed.');
    }
    return payload.ranking;
  } finally { clearTimeout(timer); }
}

async function fetchAuthorizedFirebaseRanking() {
  // Admins already have authorized access to Firestore orders. Use Firebase
  // directly so the Best Sellers page does not wait for the backend scan.
  if (!state.isAdmin) return null;
  const { db } = await state.getFirebase();
  const snapshot = await db.collection('orders').where('paymentStatus', '==', 'PAID').get();
  return normalizeRanking(snapshot.docs.map(doc => doc.data()).filter(isPaidOrder).map(order => ({
    bookId: orderBookId(order), salesCount: 1
  })));
}

async function waitForCatalog() {
  if (state.booksLoaded || state.getApprovedBooks().length > 0) return;
  await new Promise(resolve => {
    let done = false;
    const finish = () => { if (done) return; done = true; clearTimeout(timer); unsubscribe?.(); resolve(); };
    const unsubscribe = state.subscribe(event => { if (event === 'DATA_SYNCED') finish(); });
    const timer = setTimeout(finish, 2500);
  });
}

async function hydrateBestSellerOrder(force = false) {
  if (hydrationPromise && !force) return hydrationPromise;
  if (!force && Date.now() - lastHydratedAt < CACHE_TTL && Array.isArray(state.__bestSellerRanked)) return state.__bestSellerRanked;

  state.__bestSellerLoading = true;
  state.__bestSellerError = '';
  state.__bestSellerRanked = null;

  hydrationPromise = (async () => {
    await waitForCatalog();
    const approved = state.getApprovedBooks();
    const byId = new Map(approved.map(book => [idOf(book), book]).filter(([id]) => id));

    let ranking;
    try {
      ranking = await fetchAuthorizedFirebaseRanking();
      if (!ranking) ranking = await fetchBackendRanking();
    } catch (firebaseError) {
      // Admin direct-Firebase access can fail because of rules/indexes; public
      // users always use the secure backend. Do not fail the page just because
      // the optional direct path is unavailable.
      if (state.isAdmin) ranking = await fetchBackendRanking();
      else throw firebaseError;
    }

    const ranked = [];
    const salesByBook = new Map();
    const seen = new Set();
    for (const item of ranking || []) {
      const id = String(item?.bookId || item?.productId || item?.book_id || '').trim();
      const salesCount = Number(item?.salesCount || 0);
      if (!id || !Number.isFinite(salesCount) || salesCount <= 0 || seen.has(id)) continue;
      const book = byId.get(id);
      if (!book) continue;
      seen.add(id);
      salesByBook.set(id, salesCount);
      ranked.push(book);
    }

    ranked.sort((a, b) => (salesByBook.get(idOf(b)) || 0) - (salesByBook.get(idOf(a)) || 0));
    state.__bestSellerRanked = ranked.slice(0, 24);
    state.__bestSellerSales = salesByBook;
    state.__bestSellerLoading = false;
    state.__bestSellerError = '';
    lastHydratedAt = Date.now();
    console.info('[Best Sellers] Firebase PAID ranking loaded:', state.__bestSellerRanked.length, 'books');
    return state.__bestSellerRanked;
  })().catch(error => {
    state.__bestSellerRanked = [];
    state.__bestSellerSales = new Map();
    state.__bestSellerLoading = false;
    state.__bestSellerError = error?.name === 'AbortError' ? 'Best Sellers request timed out.' : (error?.message || 'Unable to load Best Sellers.');
    console.error('[Best Sellers] Firebase PAID ranking failed:', error);
    return [];
  }).finally(() => { hydrationPromise = null; });

  return hydrationPromise;
}

function rerenderBestSellers() {
  if ((window.location.hash || '').split('?')[0] !== '#/best-sellers') return;
  const app = window.__BOOKORA_APP_INSTANCE__;
  if (app?.requestRoute) app.requestRoute(true, false);
}

if (!state.__bestSellersRuntimeInstalled) {
  state.getBestSellers = function getBestSellersFirebasePaidOrders() {
    if (!Array.isArray(this.__bestSellerRanked)) return [];
    return this.__bestSellerRanked.slice(0, 24);
  };
  state.__bestSellersRuntimeInstalled = true;
  state.__hydrateBestSellers = () => hydrateBestSellerOrder(true);

  state.subscribe(event => {
    if (event !== 'DATA_SYNCED' || pendingRefresh) return;
    pendingRefresh = true;
    setTimeout(() => {
      pendingRefresh = false;
      if (!Array.isArray(state.__bestSellerRanked)) {
        hydrateBestSellerOrder(true).then(rerenderBestSellers);
      }
    }, 0);
  });

  window.addEventListener('bookora:catalog-updated', () => {
    state.__bestSellerRanked = null;
    hydrateBestSellerOrder(true).then(rerenderBestSellers);
  });

  hydrateBestSellerOrder(false).then(rerenderBestSellers);
}

export { hydrateBestSellerOrder };
