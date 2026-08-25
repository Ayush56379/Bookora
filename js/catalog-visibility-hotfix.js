// Bookora catalog visibility + fast catalog hotfix
import { state } from './state.js';

function normalizeBook(book) {
  if (!book || typeof book !== 'object') return null;
  const b = { ...book };
  b.status = String(b.status ?? '').toLowerCase();
  b.source_type = b.source_type || b.sourceType || 'internal';
  b.category = b.category || 'Other';
  b.title = b.title || 'Untitled eBook';
  b.author = b.author || b.seller_name || b.sellerName || 'Bookora Creator';
  b.description = b.description || '';
  b.created_at = b.created_at || b.createdAt || b.updated_at || b.updatedAt || '';
  b.is_new = Boolean(b.is_new ?? b.isNew);
  b.is_trending = Boolean(b.is_trending ?? b.isTrending);
  b.is_bestseller = Boolean(b.is_bestseller ?? b.isBestseller);
  b.cover_url = b.cover_url || b.coverUrl || '';
  b.coverUrl = b.coverUrl || b.cover_url || '';
  b.price = Number(b.price || 0);
  return b;
}

state.getApprovedBooks = function () {
  const source = Array.isArray(state.books) ? state.books : [];
  return source.map(normalizeBook).filter(Boolean).filter(book => book.status === 'approved');
};

function newest(books) {
  return [...books].sort((a, b) => (Date.parse(b.created_at || '') || 0) - (Date.parse(a.created_at || '') || 0));
}

state.getNewReleases = function () {
  const books = state.getApprovedBooks();
  const flagged = books.filter(book => book.is_new);
  return newest(flagged.length ? flagged : books);
};

state.getTrendingBooks = function () {
  const books = state.getApprovedBooks();
  const flagged = books.filter(book => book.is_trending);
  return newest(flagged.length ? flagged : books).slice(0, 24);
};

state.getBestSellers = function () {
  const books = state.getApprovedBooks();
  const flagged = books.filter(book => book.is_bestseller);
  return newest(flagged.length ? flagged : books).slice(0, 24);
};

state.getExternalBooks = function () {
  return state.getApprovedBooks().filter(book => book.source_type === 'external');
};

function fixExplorePriceFilter() {
  const slider = document.getElementById('filter-price-slider');
  if (!slider) return;
  let changed = false;
  if (Number(slider.max || 0) < 10000) { slider.max = '10000'; changed = true; }
  if (Number(slider.value || 0) < 10000) { slider.value = '10000'; changed = true; }
  const label = document.getElementById('price-val-label');
  if (label && label.textContent !== '₹10,000') label.textContent = '₹10,000';
  if (changed) slider.dispatchEvent(new Event('input', { bubbles: true }));
}

function isPublicCatalogRoute() {
  const route = (window.location.hash || '#/').split('?')[0].toLowerCase();
  return !route.startsWith('#/admin') && !route.startsWith('#/creator') && !route.startsWith('#/dashboard') && !route.startsWith('#/settings');
}

let syncInFlight = false;
let lastSyncAt = 0;

async function refreshPublicCatalog(force = false) {
  if (!isPublicCatalogRoute() || syncInFlight) return;
  const now = Date.now();
  if (!force && now - lastSyncAt < 5000) return;
  syncInFlight = true;
  try {
    await state.syncData();
    lastSyncAt = Date.now();
    requestAnimationFrame(refreshCatalogUI);
  } catch (error) {
    console.warn('[Bookora public catalog refresh]', error?.message || error);
  } finally {
    syncInFlight = false;
  }
}

function refreshCatalogUI() {
  const route = (window.location.hash || '#/').split('?')[0];
  if (route === '#/explore') requestAnimationFrame(fixExplorePriceFilter);
}

window.addEventListener('hashchange', () => {
  refreshCatalogUI();
  refreshPublicCatalog(true);
});
window.addEventListener('DOMContentLoaded', () => {
  refreshCatalogUI();
  refreshPublicCatalog(true);
});

const observer = new MutationObserver(() => {
  if (document.getElementById('filter-price-slider')) requestAnimationFrame(fixExplorePriceFilter);
});
observer.observe(document.documentElement, { childList: true, subtree: true });

state.subscribe(event => {
  if (event === 'DATA_SYNCED') requestAnimationFrame(refreshCatalogUI);
});

// Keep another already-open public tab reasonably fresh without creating a
// refresh loop. This only syncs data; it never reloads the page.
setInterval(() => refreshPublicCatalog(false), 60000);
