/* Bookora Home catalog layout fix
   HOME ONLY — never runs on Explore or any other route.
   - Trending: exactly 6 cards
   - All eBooks: up to 60 cards
   - Desktop: exactly 6 cards per row
   - Removes Featured/tabs presentation from homepage
   - Reuses existing BookCard/Firebase/wishlist behavior
*/
import { state } from './state.js';
import { renderBookCard } from './components/BookCard.js';

(() => {
  'use strict';

  const isHome = () => {
    const path = String(window.location.hash || '#/').split('?')[0].replace(/\/+$/, '');
    return path === '#' || path === '#/';
  };

  const normalize = (books) => (Array.isArray(books) ? books : [])
    .map(b => { try { return state.normalizeBook(b); } catch (_) { return b; } })
    .filter(Boolean)
    .filter(b => String(b.status || '').toLowerCase() === 'approved');

  const approvedBooks = () => {
    try {
      const live = normalize(state.getApprovedBooks());
      if (live.length) return live;
    } catch (_) {}
    return normalize(window.__BOOKORA_FAST_BOOKS__);
  };

  const newestFirst = books => [...books].sort((a, b) => {
    const da = new Date(a?.createdAt || a?.created_at || a?.publishedAt || 0).getTime() || 0;
    const db = new Date(b?.createdAt || b?.created_at || b?.publishedAt || 0).getTime() || 0;
    return db - da;
  });

  const truthy = value => value === true || String(value || '').toLowerCase() === 'true' || value === 1;

  const unique = books => [...new Map(books.map(b => [b.id || b.slug || b.title, b])).values()];

  const trendingFirst = books => {
    const trending = books.filter(b => truthy(b?.is_trending) || truthy(b?.isTrending));
    const best = books.filter(b => truthy(b?.is_bestseller) || truthy(b?.isBestseller));
    // Prefer explicit trending flags, then bestseller flags, then newest approved books
    // only when the catalog has fewer than six explicit candidates.
    return newestFirst(unique([...trending, ...best, ...newestFirst(books)])).slice(0, 6);
  };

  const cardGrid = books => books.length
    ? `<div class="kdp-book-grid home-fixed-six-grid">${books.map(book => `<div class="kdp-book-item">${renderBookCard(book)}</div>`).join('')}</div>`
    : `<div class="kdp-loading-state"><strong>No eBooks available yet.</strong></div>`;

  const injectHomeGridCSS = () => {
    if (document.getElementById('bookora-home-six-grid-fix')) return;
    const style = document.createElement('style');
    style.id = 'bookora-home-six-grid-fix';
    style.textContent = `
      .kdp-catalog-section .home-fixed-six-grid,
      .kdp-catalog-section .home-six-grid {
        display:grid!important;
        grid-template-columns:repeat(6,minmax(0,1fr))!important;
        gap:18px!important;
        width:100%!important;
        align-items:stretch!important;
      }
      .kdp-catalog-section .home-fixed-six-grid .kdp-book-item,
      .kdp-catalog-section .home-six-grid .kdp-book-item { min-width:0!important;width:100%!important;max-width:none!important; }
      .kdp-catalog-section .home-fixed-six-grid .kdp-book-item>.book-card,
      .kdp-catalog-section .home-six-grid .kdp-book-item>.book-card { width:100%!important;max-width:none!important;min-width:0!important; }
      .kdp-catalog-section .home-all-books-section { margin-top:64px; padding-top:8px; }
      .kdp-catalog-section .home-all-books-head { display:flex;justify-content:space-between;align-items:flex-end;gap:1.5rem;margin-bottom:28px; }
      @media(max-width:1200px){.kdp-catalog-section .home-fixed-six-grid,.kdp-catalog-section .home-six-grid{grid-template-columns:repeat(5,minmax(0,1fr))!important}}
      @media(max-width:1000px){.kdp-catalog-section .home-fixed-six-grid,.kdp-catalog-section .home-six-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important}}
      @media(max-width:800px){.kdp-catalog-section .home-fixed-six-grid,.kdp-catalog-section .home-six-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:14px!important}}
      @media(max-width:560px){.kdp-catalog-section .home-fixed-six-grid,.kdp-catalog-section .home-six-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}}
    `;
    document.head.appendChild(style);
  };

  const apply = () => {
    if (!isHome()) return;
    const section = document.querySelector('.kdp-catalog-section');
    if (!section) return;
    const container = section.querySelector('.kdp-catalog-container');
    const target = container?.querySelector('#home-live-catalog');
    if (!container || !target) return;

    injectHomeGridCSS();

    const books = approvedBooks();
    if (!books.length) return;

    const trending = trendingFirst(books);
    const all = newestFirst(books).slice(0, 60);

    const head = container.querySelector('.kdp-section-head');
    if (head) {
      head.innerHTML = `
        <div>
          <span class="kdp-kicker">BOOKORA STORE</span>
          <h2>Trending eBooks</h2>
          <p>Discover what readers are exploring on Bookora.</p>
        </div>
        <a href="#/explore" class="kdp-view-all">View all <span>→</span></a>`;
    }

    // Featured / Best Sellers / New Releases tabs must never appear on the homepage.
    const tabs = container.querySelector('.kdp-tabs');
    if (tabs) tabs.remove();

    target.innerHTML = `
      ${cardGrid(trending)}
      <section class="home-all-books-section" aria-label="All eBooks">
        <div class="home-all-books-head">
          <div>
            <span class="kdp-kicker">BOOKORA CATALOG</span>
            <h2>All eBooks</h2>
            <p>Browse the latest approved eBooks on Bookora.</p>
          </div>
          <a href="#/explore" class="kdp-view-all">View all <span>→</span></a>
        </div>
        ${cardGrid(all)}
      </section>`;
  };

  let queued = false;
  const schedule = () => {
    if (!isHome() || queued) return;
    queued = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      queued = false;
      apply();
    }));
  };

  window.addEventListener('hashchange', schedule);
  window.addEventListener('bookora:fast-catalog', schedule);
  window.addEventListener('bookora:catalog-updated', schedule);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once:true });
  else schedule();

  const observer = new MutationObserver(() => { if (isHome()) schedule(); });
  observer.observe(document.body, { childList:true, subtree:true });
})();
