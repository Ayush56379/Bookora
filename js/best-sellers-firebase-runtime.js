// Bookora Best Sellers - Firebase PAID-orders ranking.
// Admins read Firestore directly for the fastest result; public users use the secure aggregation endpoint.
import { state } from './state.js';
import { apiUrl } from './config.js';

const CACHE_TTL = 60 * 1000;
const REQUEST_TIMEOUT = 5000;
let lastHydratedAt = 0;
let hydrationPromise = null;

function idOf(book) { return String(book?.id || book?.bookId || book?.book_id || book?.bookoraLibraryId || '').trim(); }
function statusOf(value) { return String(value || '').trim().toUpperCase(); }
function isAdminSession() {
  if (state.isAdmin) return true;
  try {
    const u = JSON.parse(localStorage.getItem('bookora_user_profile') || '{}');
    return String(u?.email || '').trim().toLowerCase() === 'ayushprajpati6@gmail.com' || u?.role === 'admin' || u?.isMasterAdmin === true;
  } catch (_) { return false; }
}
function orderBookId(order) { return String(order?.productId || order?.bookId || order?.book_id || order?.bookoraLibraryId || order?.bookoraLibraryID || '').trim(); }
function isPaid(order) {
  return statusOf(order?.paymentStatus || order?.payment_status) === 'PAID' && !new Set(['REFUNDED','CANCELLED','FAILED','EXPIRED']).has(statusOf(order?.orderStatus));
}
function countRanking(orders) {
  const counts = new Map();
  for (const order of orders || []) {
    if (!isPaid(order)) continue;
    const id = orderBookId(order);
    if (id) counts.set(id, (counts.get(id) || 0) + 1);
  }
  return [...counts.entries()].map(([bookId, salesCount]) => ({ bookId, salesCount })).sort((a,b) => b.salesCount - a.salesCount || a.bookId.localeCompare(b.bookId));
}
async function getAdminFirebaseData() {
  const { db } = await state.getFirebase();
  const [booksSnapshot, ordersSnapshot] = await Promise.all([
    db.collection('books').where('status', '==', 'approved').get(),
    db.collection('orders').get()
  ]);
  const books = booksSnapshot.docs.map(doc => ({ id: String(doc.id), ...doc.data() })).map(b => state.normalizeBook(b)).filter(Boolean).filter(b => b.status === 'approved');
  const ranking = countRanking(ordersSnapshot.docs.map(doc => doc.data()));
  return { books, ranking };
}
async function getPublicRanking() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const response = await fetch(apiUrl('/api/books/bestseller-rankings'), { method:'GET', headers:{Accept:'application/json'}, credentials:'omit', cache:'no-store', signal:controller.signal });
    if (!response.ok) throw new Error(`Best Seller endpoint HTTP ${response.status}`);
    const payload = await response.json();
    if (payload?.source !== 'firebase.orders' || payload?.paymentStatus !== 'PAID' || !Array.isArray(payload?.ranking)) throw new Error('Invalid Firebase Best Sellers response.');
    return payload.ranking;
  } finally { clearTimeout(timer); }
}
function finish(ranking, books) {
  const byId = new Map((books || []).map(book => [idOf(book), book]).filter(([id]) => id));
  const sales = new Map();
  const ranked = [];
  for (const item of ranking || []) {
    const id = String(item?.bookId || item?.productId || item?.book_id || '').trim();
    const salesCount = Number(item?.salesCount || item?.count || 0);
    const book = byId.get(id);
    if (!id || !book || !Number.isFinite(salesCount) || salesCount <= 0 || sales.has(id)) continue;
    sales.set(id, salesCount); ranked.push(book);
  }
  ranked.sort((a,b) => (sales.get(idOf(b)) || 0) - (sales.get(idOf(a)) || 0));
  state.__bestSellerSales = sales;
  state.__bestSellerRanked = ranked.slice(0,24);
  state.__bestSellerLoading = false;
  state.__bestSellerError = '';
  lastHydratedAt = Date.now();
  console.info('[Best Sellers] Firebase PAID ranking loaded:', state.__bestSellerRanked.length, 'books');
  return state.__bestSellerRanked;
}
async function hydrateBestSellerOrder(force = false) {
  if (hydrationPromise && !force) return hydrationPromise;
  if (!force && Array.isArray(state.__bestSellerRanked) && Date.now() - lastHydratedAt < CACHE_TTL) return state.__bestSellerRanked;
  state.__bestSellerLoading = true;
  state.__bestSellerError = '';
  state.__bestSellerRanked = null;
  hydrationPromise = (async () => {
    if (isAdminSession()) {
      const data = await getAdminFirebaseData();
      return finish(data.ranking, data.books);
    }
    const books = state.getApprovedBooks();
    const ranking = await getPublicRanking();
    return finish(ranking, books);
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
function rerender() {
  if ((window.location.hash || '').split('?')[0] !== '#/best-sellers') return;
  window.__BOOKORA_APP_INSTANCE__?.requestRoute?.(true, false);
}
if (!state.__bestSellersRuntimeInstalled) {
  state.getBestSellers = function() { return Array.isArray(this.__bestSellerRanked) ? this.__bestSellerRanked.slice(0,24) : []; };
  state.__bestSellersRuntimeInstalled = true;
  state.__hydrateBestSellers = () => hydrateBestSellerOrder(true);
  state.subscribe(event => {
    if (event === 'DATA_SYNCED' || event === 'USER_LOGGED_IN') setTimeout(() => hydrateBestSellerOrder(true).then(rerender), 0);
  });
  window.addEventListener('bookora:catalog-updated', () => hydrateBestSellerOrder(true).then(rerender));
  const start = () => hydrateBestSellerOrder(false).then(rerender);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true }); else setTimeout(start, 0);
}
export { hydrateBestSellerOrder };
