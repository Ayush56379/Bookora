// Bookora Best Sellers - Firebase PAID-orders ranking.
// Firebase orders are the single source of truth for bestseller ranking.
import { state } from './state.js';
import { apiUrl } from './config.js';

const CACHE_TTL = 60 * 1000;
const REQUEST_TIMEOUT = 8000;
let lastHydratedAt = 0;
let hydrationPromise = null;

function idOf(book) { return String(book?.id || book?.bookId || book?.book_id || book?.bookoraLibraryId || book?.bookora_library_id || book?.libraryId || book?.library_id || '').trim(); }
function aliasesOf(book) {
  return [book?.id, book?.bookId, book?.book_id, book?.bookoraLibraryId, book?.bookora_library_id, book?.libraryId, book?.library_id, book?.canonicalBookId, book?.canonical_book_id]
    .map(v => String(v || '').trim()).filter(Boolean);
}
function statusOf(value) { return String(value || '').trim().toUpperCase(); }
function isAdminSession() {
  if (state.isAdmin) return true;
  try {
    const u = JSON.parse(localStorage.getItem('bookora_user_profile') || '{}');
    return String(u?.email || '').trim().toLowerCase() === 'ayushprajpati6@gmail.com' || u?.role === 'admin' || u?.isMasterAdmin === true;
  } catch (_) { return false; }
}
function orderBookId(order) { return String(order?.productId || order?.bookId || order?.book_id || order?.bookoraLibraryId || order?.bookoraLibraryID || order?.bookora_library_id || '').trim(); }
function isPaid(order) {
  return statusOf(order?.paymentStatus || order?.payment_status) === 'PAID' && !new Set(['REFUNDED','CANCELLED','FAILED','EXPIRED']).has(statusOf(order?.orderStatus));
}
function countRanking(orders) {
  const counts = new Map();
  const latest = new Map();
  for (const order of orders || []) {
    if (!isPaid(order)) continue;
    const id = orderBookId(order);
    if (!id) continue;
    counts.set(id, (counts.get(id) || 0) + 1);
    const raw = order?.paidAt || order?.paymentCompletedAt || order?.completedAt || order?.purchasedAt || order?.orderDate || order?.createdAt || order?.created_at || '';
    const ms = raw?.toDate instanceof Function ? (() => { try { return raw.toDate().getTime(); } catch (_) { return 0; } })() : Date.parse(String(raw || '')) || Number(raw) || 0;
    latest.set(id, Math.max(latest.get(id) || 0, ms));
  }
  return [...counts.entries()].map(([bookId, salesCount]) => ({ bookId, salesCount, latestPurchaseAt: latest.get(bookId) || 0 }))
    .sort((a,b) => b.salesCount - a.salesCount || b.latestPurchaseAt - a.latestPurchaseAt || a.bookId.localeCompare(b.bookId));
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
  const byAlias = new Map();
  for (const book of books || []) for (const alias of aliasesOf(book)) byAlias.set(alias, book);
  const sales = new Map();
  const latest = new Map();
  const ranked = [];
  for (const item of ranking || []) {
    const id = String(item?.bookId || item?.productId || item?.book_id || item?.bookoraLibraryId || '').trim();
    const salesCount = Number(item?.salesCount || item?.count || 0);
    const book = byAlias.get(id);
    if (!id || !book || !Number.isFinite(salesCount) || salesCount <= 0) continue;
    const canonicalId = idOf(book);
    if (!canonicalId || sales.has(canonicalId)) continue;
    sales.set(canonicalId, salesCount);
    latest.set(canonicalId, Number(item?.latestPurchaseAt || 0));
    ranked.push(book);
  }
  ranked.sort((a,b) => (sales.get(idOf(b)) || 0) - (sales.get(idOf(a)) || 0) || (latest.get(idOf(b)) || 0) - (latest.get(idOf(a)) || 0) || idOf(a).localeCompare(idOf(b)));
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
