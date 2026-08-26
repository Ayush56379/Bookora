// Bookora Best Sellers - Firebase-backed catalog + authoritative bestseller ordering
// Keeps book-card metadata sourced from Firestore while using the existing secure
// public catalog API's bestselling sort for sales-derived ordering.
import { state } from './state.js';
import { apiUrl } from './config.js';

const CACHE_TTL = 60 * 1000;
let lastHydratedAt = 0;
let hydrationPromise = null;

function idOf(book) {
  return String(book?.id || book?.bookId || book?.book_id || book?.bookoraLibraryId || '').trim();
}

function extractBooks(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.books)) return payload.books;
  if (Array.isArray(payload?.data?.books)) return payload.data.books;
  return [];
}

function fallbackSalesCount(book) {
  const candidates = [
    book?.salesCount,
    book?.sales_count,
    book?.totalSales,
    book?.total_sales,
    book?.purchaseCount,
    book?.purchase_count,
    book?.orderCount,
    book?.order_count,
    book?.soldCount,
    book?.sold_count
  ];
  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function sortFromFirebaseFields(books) {
  const approved = Array.isArray(books) ? books.filter(book => book?.status === 'approved') : [];
  const hasSalesField = approved.some(book => fallbackSalesCount(book) > 0);
  if (!hasSalesField) return [];
  return [...approved].sort((a, b) => {
    const salesDiff = fallbackSalesCount(b) - fallbackSalesCount(a);
    if (salesDiff) return salesDiff;
    return (Date.parse(b?.created_at || b?.createdAt || '') || 0) - (Date.parse(a?.created_at || a?.createdAt || '') || 0);
  });
}

async function hydrateBestSellerOrder(force = false) {
  if (hydrationPromise && !force) return hydrationPromise;
  if (!force && Date.now() - lastHydratedAt < CACHE_TTL && Array.isArray(state.__bestSellerRanked)) return state.__bestSellerRanked;

  hydrationPromise = (async () => {
    const approved = state.getApprovedBooks();
    const byId = new Map(approved.map(book => [idOf(book), book]).filter(([id]) => id));
    let ranked = [];

    // The backend bestseller query is the secure sales-derived source. We do not
    // read buyer order documents in the browser. The returned IDs are mapped back
    // to the current Firestore-approved catalog so card metadata stays Firebase-backed.
    try {
      const response = await fetch(apiUrl('/api/books?sort=bestselling'), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'omit',
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`Bestseller API HTTP ${response.status}`);
      const payload = await response.json();
      const ordered = extractBooks(payload);
      const seen = new Set();
      ranked = ordered.map(item => byId.get(idOf(item))).filter(book => {
        const id = idOf(book);
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    } catch (error) {
      console.warn('[Best Sellers] sales-derived ordering unavailable:', error.message);
    }

    // Safe fallback: use actual sales aggregate fields already present on the
    // Firestore book documents. Never invent a sales count or promote by creation date.
    if (!ranked.length) ranked = sortFromFirebaseFields(approved);

    // Last-resort compatibility for existing admin-curated bestseller flags. This
    // keeps the page usable when the production API is temporarily unavailable.
    if (!ranked.length) ranked = approved.filter(book => book?.is_bestseller === true || book?.is_bestseller === 'true');

    state.__bestSellerRanked = ranked.slice(0, 24);
    state.__bestSellerSales = new Map();
    lastHydratedAt = Date.now();
    return state.__bestSellerRanked;
  })().finally(() => {
    hydrationPromise = null;
  });

  return hydrationPromise;
}

if (!state.__bestSellersRuntimeInstalled) {
  const originalGetBestSellers = state.getBestSellers.bind(state);
  state.getBestSellers = function getBestSellersFirebaseBacked() {
    if (Array.isArray(this.__bestSellerRanked)) return this.__bestSellerRanked.slice(0, 24);
    return originalGetBestSellers().slice(0, 24);
  };
  state.__bestSellersRuntimeInstalled = true;

  state.__hydrateBestSellers = () => hydrateBestSellerOrder(true);

  window.addEventListener('bookora:catalog-updated', () => {
    state.__bestSellerRanked = null;
    hydrateBestSellerOrder(false).then(() => {
      if ((window.location.hash || '').split('?')[0] === '#/best-sellers') {
        const app = window.__BOOKORA_APP_INSTANCE__;
        if (app?.requestRoute) app.requestRoute(true, false);
      }
    }).catch(error => console.warn('[Best Sellers] hydration after catalog sync failed:', error));
  });

  // Start immediately so the first route can replace the initial fallback as soon
  // as the authoritative ordering is available.
  hydrateBestSellerOrder(false).then(() => {
    if ((window.location.hash || '').split('?')[0] === '#/best-sellers') {
      const app = window.__BOOKORA_APP_INSTANCE__;
      if (app?.requestRoute) app.requestRoute(true, false);
    }
  }).catch(error => console.warn('[Best Sellers] initial hydration failed:', error));
}

export { hydrateBestSellerOrder };
