// Bookora Best Sellers - 100% Firebase PAID-orders ranking.
// Book metadata is read from the existing Firestore-approved catalog in state.
// Sales ranking comes exclusively from the secure backend endpoint that reads
// Firestore `orders` where paymentStatus == PAID.
import { state } from './state.js';
import { apiUrl } from './config.js';

const CACHE_TTL = 60 * 1000;
let lastHydratedAt = 0;
let hydrationPromise = null;

function idOf(book) {
  return String(book?.id || book?.bookId || book?.book_id || book?.bookoraLibraryId || '').trim();
}

function extractRanking(payload) {
  if (Array.isArray(payload?.ranking)) return payload.ranking;
  if (Array.isArray(payload?.data?.ranking)) return payload.data.ranking;
  return [];
}

async function hydrateBestSellerOrder(force = false) {
  if (hydrationPromise && !force) return hydrationPromise;
  if (!force && Date.now() - lastHydratedAt < CACHE_TTL && Array.isArray(state.__bestSellerRanked)) {
    return state.__bestSellerRanked;
  }

  state.__bestSellerLoading = true;
  state.__bestSellerError = '';
  state.__bestSellerRanked = null;

  hydrationPromise = (async () => {
    const approved = state.getApprovedBooks();
    const byId = new Map(approved.map(book => [idOf(book), book]).filter(([id]) => id));

    const response = await fetch(apiUrl('/api/books/bestseller-rankings'), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'omit',
      cache: 'no-store'
    });

    if (!response.ok) {
      let detail = '';
      try { detail = String((await response.json())?.error || ''); } catch (_) {}
      throw new Error(`Firebase bestseller endpoint HTTP ${response.status}${detail ? `: ${detail}` : ''}`);
    }

    const payload = await response.json();
    if (payload?.source !== 'firebase.orders' || payload?.paymentStatus !== 'PAID' || !Array.isArray(payload?.ranking)) {
      throw new Error('Best Seller source verification failed: expected Firebase orders with paymentStatus=PAID.');
    }

    const ranked = [];
    const salesByBook = new Map();
    const seen = new Set();

    for (const item of payload.ranking) {
      const id = String(item?.bookId || item?.productId || item?.book_id || '').trim();
      const salesCount = Number(item?.salesCount || 0);
      if (!id || !Number.isFinite(salesCount) || salesCount <= 0 || seen.has(id)) continue;
      const book = byId.get(id);
      if (!book) {
        console.warn('[Best Sellers] paid-order book ID not found in approved catalog:', id);
        continue;
      }
      seen.add(id);
      salesByBook.set(id, salesCount);
      ranked.push(book);
    }

    ranked.sort((a, b) => {
      const diff = (salesByBook.get(idOf(b)) || 0) - (salesByBook.get(idOf(a)) || 0);
      return diff || idOf(a).localeCompare(idOf(b));
    });

    state.__bestSellerRanked = ranked.slice(0, 24);
    state.__bestSellerSales = salesByBook;
    state.__bestSellerLoading = false;
    state.__bestSellerError = '';
    lastHydratedAt = Date.now();
    console.info('[Best Sellers] Firebase ranking loaded:', state.__bestSellerRanked.length, 'books');
    if (state.__bestSellerRanked[0]) {
      const firstId = idOf(state.__bestSellerRanked[0]);
      console.info('[Best Sellers] #1:', firstId, 'salesCount:', salesByBook.get(firstId) || 0);
    }
    return state.__bestSellerRanked;
  })().catch(error => {
    state.__bestSellerRanked = [];
    state.__bestSellerSales = new Map();
    state.__bestSellerLoading = false;
    state.__bestSellerError = error?.message || 'Unable to load Best Sellers.';
    console.error('[Best Sellers] Firebase PAID-order ranking failed:', error);
    throw error;
  }).finally(() => {
    hydrationPromise = null;
  });

  return hydrationPromise;
}

if (!state.__bestSellersRuntimeInstalled) {
  state.getBestSellers = function getBestSellersFirebasePaidOrders() {
    // CRITICAL: never fall back to the normal catalog. Before Firebase resolves,
    // return an empty list so the page can render its loading state instead.
    if (!Array.isArray(this.__bestSellerRanked)) return [];
    return this.__bestSellerRanked.slice(0, 24);
  };

  state.__bestSellersRuntimeInstalled = true;
  state.__hydrateBestSellers = () => hydrateBestSellerOrder(true);

  window.addEventListener('bookora:catalog-updated', () => {
    state.__bestSellerRanked = null;
    hydrateBestSellerOrder(true).then(() => {
      if ((window.location.hash || '').split('?')[0] === '#/best-sellers') {
        const app = window.__BOOKORA_APP_INSTANCE__;
        if (app?.requestRoute) app.requestRoute(true, false);
      }
    }).catch(() => {
      if ((window.location.hash || '').split('?')[0] === '#/best-sellers') {
        const app = window.__BOOKORA_APP_INSTANCE__;
        if (app?.requestRoute) app.requestRoute(true, false);
      }
    });
  });

  hydrateBestSellerOrder(false).then(() => {
    if ((window.location.hash || '').split('?')[0] === '#/best-sellers') {
      const app = window.__BOOKORA_APP_INSTANCE__;
      if (app?.requestRoute) app.requestRoute(true, false);
    }
  }).catch(() => {
    if ((window.location.hash || '').split('?')[0] === '#/best-sellers') {
      const app = window.__BOOKORA_APP_INSTANCE__;
      if (app?.requestRoute) app.requestRoute(true, false);
    }
  });
}

export { hydrateBestSellerOrder };
