// Bookora homepage catalog rules — keep the existing card design untouched.
// Trending: ONLY Firebase books explicitly marked as trending, maximum 6.
// All eBooks: latest approved Firebase books, maximum 60.
import { state } from './state.js';
import { renderBookCard } from './components/BookCard.js';

const isApproved = book => String(book?.status || '').toLowerCase() === 'approved';
const normalize = book => { try { return state.normalizeBook(book); } catch (_) { return book; } };
const approvedBooks = () => (state.getApprovedBooks?.() || []).map(normalize).filter(Boolean).filter(isApproved);
const createdTime = book => Date.parse(book?.createdAt || book?.created_at || book?.publishedAt || book?.published_at || '') || 0;
const isTrending = book => book?.is_trending === true || book?.is_trending === 'true' || book?.isTrending === true || book?.isTrending === 'true';

function grid(books) {
  return `<div class="home-catalog-grid">${books.map(book => `<div class="home-catalog-item">${renderBookCard(book)}</div>`).join('')}</div>`;
}

function applyExactCatalog() {
  const root = document.getElementById('home-live-catalog');
  if (!root) return false;
  const books = approvedBooks();
  const trending = books.filter(isTrending).slice(0, 6);
  const all = [...books].sort((a, b) => createdTime(b) - createdTime(a)).slice(0, 60);
  const trendingBlock = root.querySelector('.home-catalog-block:not(.home-all-books-block)');
  const allBlock = root.querySelector('.home-all-books-block');
  if (trendingBlock) {
    const old = trendingBlock.querySelector('.home-catalog-grid');
    if (trending.length) {
      const html = grid(trending);
      if (!old || old.outerHTML !== html) {
        const holder = old || trendingBlock.querySelector('.home-catalog-loading');
        if (holder) holder.outerHTML = html;
      }
    }
  }
  if (allBlock) {
    const old = allBlock.querySelector('.home-catalog-grid');
    if (all.length) {
      const html = grid(all);
      if (!old || old.children.length !== all.length) {
        const holder = old || allBlock.querySelector('.home-catalog-loading');
        if (holder) holder.outerHTML = html;
      }
    }
  }
  return true;
}

function boot() {
  const observer = new MutationObserver(() => applyExactCatalog());
  const watch = () => {
    const root = document.getElementById('home-live-catalog');
    if (root && !root.dataset.exactCatalogObserver) {
      root.dataset.exactCatalogObserver = '1';
      observer.observe(root, { childList: true, subtree: true });
      applyExactCatalog();
    }
  };
  watch();
  window.addEventListener('bookora:fast-catalog', applyExactCatalog);
  window.addEventListener('bookora:catalog-updated', applyExactCatalog);
  window.addEventListener('hashchange', () => setTimeout(watch, 0));
  setInterval(watch, 500);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
