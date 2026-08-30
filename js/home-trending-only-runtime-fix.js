/* Bookora Home catalog layout fix
   - Trending: exactly 6 approved/trending books
   - All eBooks: up to 60 approved books below Trending
   - Desktop: 6 cards per row
   - Keeps existing BookCard, Firebase/state data and wishlist behavior intact
   - Does not modify Explore, Trending, All Books routes or other pages
*/
import { state } from './state.js';
import { renderBookCard } from './components/BookCard.js';

(() => {
  'use strict';

  const isHome = () => {
    const path = String(window.location.hash || '#/').split('?')[0].replace(/\/+$/, '');
    return path === '#' || path === '#/';
  };

  const approvedBooks = () => {
    try {
      const live = state.getApprovedBooks();
      if (Array.isArray(live) && live.length) return live.map(b => state.normalizeBook(b)).filter(Boolean).filter(b => b.status === 'approved');
    } catch (_) {}

    const fast = Array.isArray(window.__BOOKORA_FAST_BOOKS__) ? window.__BOOKORA_FAST_BOOKS__ : [];
    return fast.map(b => state.normalizeBook(b)).filter(Boolean).filter(b => b.status === 'approved');
  };

  const newestFirst = books => [...books].sort((a, b) => {
    const da = new Date(a?.createdAt || a?.created_at || a?.publishedAt || 0).getTime() || 0;
    const db = new Date(b?.createdAt || b?.created_at || b?.publishedAt || 0).getTime() || 0;
    return db - da;
  });

  const trendingFirst = books => {
    const trending = books.filter(b => b?.is_trending === true || b?.isTrending === true || String(b?.is_trending || '').toLowerCase() === 'true');
    const fallback = books.filter(b => b?.is_bestseller === true || b?.isBestseller === true || String(b?.is_bestseller || '').toLowerCase() === 'true');
    return newestFirst(trending.length >= 6 ? trending : [...trending, ...fallback, ...newestFirst(books)]);
  };

  const cardGrid = (books, emptyText) => books.length
    ? `<div class="kdp-book-grid home-fixed-six-grid">${books.map(book => `<div class="kdp-book-item">${renderBookCard(book)}</div>`).join('')}</div>`
    : `<div class="kdp-loading-state"><strong>${emptyText}</strong></div>`;

  const apply = () => {
    if (!isHome()) return;
    const section = document.querySelector('.kdp-catalog-section');
    if (!section) return;
    if (section.dataset.homeFixedCatalog === '1') return;

    const container = section.querySelector('.kdp-catalog-container');
    if (!container) return;

    const books = approvedBooks();
    if (!books.length) return;

    const trending = trendingFirst(books).slice(0, 6);
    const all = newestFirst(books).slice(0, 60);

    const oldHead = container.querySelector('.kdp-section-head');
    const oldTabs = container.querySelector('.kdp-tabs');
    const oldCatalog = container.querySelector('#home-live-catalog');
    if (!oldHead || !oldCatalog) return;

    section.dataset.homeFixedCatalog = '1';
    oldHead.innerHTML = `
      <div>
        <span class="kdp-kicker">BOOKORA STORE</span>
        <h2>Trending eBooks</h2>
        <p>Discover what readers are exploring on Bookora.</p>
      </div>
      <a href="#/explore" class="kdp-view-all">View all <span>→</span></a>`;

    if (oldTabs) oldTabs.remove();

    oldCatalog.innerHTML = `
      ${cardGrid(trending, 'No trending eBooks available yet.')}
      <section class="home-all-books-section" aria-label="All eBooks">
        <div class="home-all-books-head">
          <div>
            <span class="kdp-kicker">BOOKORA CATALOG</span>
            <h2>All eBooks</h2>
            <p>Browse the latest approved eBooks on Bookora.</p>
          </div>
          <a href="#/explore" class="kdp-view-all">View all <span>→</span></a>
        </div>
        ${cardGrid(all, 'No eBooks available yet.')}
      </section>`;
  };

  const resetAndApply = () => {
    if (!isHome()) return;
    const section = document.querySelector('.kdp-catalog-section');
    if (section) section.dataset.homeFixedCatalog = '0';
    requestAnimationFrame(() => requestAnimationFrame(apply));
  };

  window.addEventListener('hashchange', resetAndApply);
  window.addEventListener('bookora:fast-catalog', resetAndApply);
  window.addEventListener('bookora:catalog-updated', resetAndApply);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', resetAndApply, { once: true });
  } else {
    resetAndApply();
  }

  const observer = new MutationObserver(() => {
    if (!isHome()) return;
    const section = document.querySelector('.kdp-catalog-section');
    if (section && section.dataset.homeFixedCatalog !== '1') resetAndApply();
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
