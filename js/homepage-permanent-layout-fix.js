// Bookora homepage permanent layout/reliability fix.
// 1) Keeps book cards readable on every mobile width.
// 2) Keeps Trending limited to six when rendered on the homepage.
// 3) Keeps All eBooks permanently present directly after Trending.
(() => {
  if (window.__BOOKORA_HOME_PERMANENT_LAYOUT_FIX__) return;
  window.__BOOKORA_HOME_PERMANENT_LAYOUT_FIX__ = true;

  const ALL_ID = 'bookora-all-ebooks-section';
  const MAX_ALL = 60;
  let renderTimer = 0;
  let rendering = false;

  const isHome = () => !!document.querySelector('#main-content .bookora-home-clean');

  async function getState() {
    try { return (await import('./state.js')).state; } catch (_) { return null; }
  }

  function approvedBooks(state) {
    const live = state?.getApprovedBooks?.() || [];
    const fast = Array.isArray(window.__BOOKORA_FAST_BOOKS__)
      ? window.__BOOKORA_FAST_BOOKS__.map(book => state.normalizeBook(book)).filter(Boolean)
      : [];
    const map = new Map();
    for (const book of [...live, ...fast]) {
      if (!book || String(book.status || '').toLowerCase() !== 'approved') continue;
      const key = String(book.id || book.bookId || book.slug || book.title || '');
      if (key) map.set(key, book);
    }
    return [...map.values()];
  }

  function findTrendingSection() {
    const candidates = [...document.querySelectorAll('#main-content section, #main-content .kdp-catalog-section')];
    for (const section of candidates) {
      const heading = section.querySelector('h1,h2,h3');
      const text = String(heading?.textContent || '').trim().replace(/\s+/g, ' ');
      if (/^trending(?:\s+ebooks?)?$/i.test(text) || /^trending\s+ebooks/i.test(text)) return section;
    }
    return candidates.find(section => /\bTrending\s+eBooks?\b/i.test(String(section.textContent || '')))?.closest('section') || null;
  }

  function fallbackAnchor() {
    const homeCatalog = document.querySelector('#home-live-catalog')?.closest('.kdp-catalog-section');
    return homeCatalog || document.querySelector('#main-content .kdp-catalog-section');
  }

  function ensureSection() {
    let section = document.getElementById(ALL_ID);
    if (!section) {
      section = document.createElement('section');
      section.id = ALL_ID;
      section.className = 'kdp-catalog-section bookora-all-ebooks-section';
      section.innerHTML = '<div class="kdp-catalog-container"><div class="kdp-section-head"><div><span class="kdp-kicker">BOOKORA STORE</span><h2>All eBooks</h2><p>Loading approved eBooks…</p></div><a href="#/explore" class="kdp-view-all">View all <span>→</span></a></div><div class="kdp-loading-state"><strong>Loading eBooks…</strong><span>Connecting to the Bookora catalog</span></div></div>';
    }

    const trending = findTrendingSection();
    const anchor = trending || fallbackAnchor();
    if (anchor && section.previousElementSibling !== anchor) anchor.insertAdjacentElement('afterend', section);
    return section;
  }

  async function render() {
    if (rendering || !isHome()) return;
    rendering = true;
    try {
      const section = ensureSection();
      const state = await getState();
      if (!state || !section) return;
      const books = approvedBooks(state).slice(0, MAX_ALL);
      if (!books.length) {
        section.querySelector('.kdp-section-head p')?.replaceChildren(document.createTextNode('No approved eBooks are available yet.'));
        return;
      }
      const { renderBookCard } = await import('./components/BookCard.js');
      const cards = books.map(book => `<div class="kdp-book-item">${renderBookCard(book)}</div>`).join('');
      section.innerHTML = `<div class="kdp-catalog-container"><div class="kdp-section-head"><div><span class="kdp-kicker">BOOKORA STORE</span><h2>All eBooks</h2><p>Showing ${books.length} approved eBooks. More are available in Explore.</p></div><a href="#/explore" class="kdp-view-all">View all <span>→</span></a></div><div class="bookora-all-ebooks-grid kdp-book-grid">${cards}</div></div>`;
      ensureSection();
    } finally {
      rendering = false;
    }
  }

  function schedule(delay = 80) {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => { renderTimer = 0; render(); }, delay);
  }

  function enforceTrendingSix() {
    if (!isHome()) return;
    const trending = findTrendingSection();
    if (!trending) return;
    const grid = trending.querySelector('.kdp-book-grid, .bookora-all-ebooks-grid, [class*="book-grid"]');
    if (!grid) return;
    const items = [...grid.querySelectorAll(':scope > .kdp-book-item, :scope > *')];
    if (items.length > 6) items.slice(6).forEach(item => item.remove());
  }

  function watchDom() {
    const root = document.querySelector('#main-content');
    if (!root || root.__bookoraPermanentObserver) return;
    const observer = new MutationObserver(() => {
      if (!isHome()) return;
      enforceTrendingSix();
      const all = document.getElementById(ALL_ID);
      const trending = findTrendingSection();
      if (!all || (trending && all.previousElementSibling !== trending)) schedule(20);
    });
    observer.observe(root, { childList: true, subtree: true });
    root.__bookoraPermanentObserver = observer;
  }

  function start() {
    if (!isHome()) return;
    watchDom();
    enforceTrendingSix();
    ensureSection();
    schedule(0);
    window.addEventListener('bookora:fast-catalog', () => schedule(30));
    window.addEventListener('bookora:catalog-updated', () => schedule(80));
    window.addEventListener('bookora:firebase-trending-updated', () => { enforceTrendingSix(); schedule(20); });
    window.addEventListener('hashchange', () => setTimeout(start, 120));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  const style = document.createElement('style');
  style.id = 'bookora-permanent-layout-fix-styles';
  style.textContent = `
    #${ALL_ID}{width:100%!important;box-sizing:border-box!important;border-top:1px solid var(--border-subtle,#e2e8f0)!important}
    #${ALL_ID} .kdp-catalog-container{width:min(1240px,calc(100% - 40px));margin-inline:auto;box-sizing:border-box}
    #${ALL_ID} .bookora-all-ebooks-grid{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:22px!important;width:100%!important;align-items:stretch!important}
    #${ALL_ID} .kdp-book-item{display:block!important;width:100%!important;min-width:0!important;max-width:none!important}
    #${ALL_ID} .book-card{width:100%!important;min-width:0!important;max-width:none!important}
    @media(max-width:1100px){#${ALL_ID} .bookora-all-ebooks-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:14px!important}}
    @media(max-width:800px){#${ALL_ID} .kdp-catalog-container{width:min(100% - 28px,1240px)}#${ALL_ID} .bookora-all-ebooks-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important}}
    @media(max-width:560px){#${ALL_ID} .bookora-all-ebooks-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}}
    @media(max-width:560px){
      .bookora-home-clean .kdp-book-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;width:100%!important}
      .bookora-home-clean .kdp-book-item{width:100%!important;min-width:0!important;max-width:none!important}
      .bookora-home-clean .book-card-premium{width:100%!important;min-width:0!important;max-width:none!important;overflow:hidden!important}
      .bookora-home-clean .book-card-info{min-width:0!important;width:100%!important;box-sizing:border-box!important;padding:.62rem!important}
      .bookora-home-clean .book-card-meta-row{min-width:0!important;width:100%!important}
      .bookora-home-clean .book-card-meta-row .badge{flex:0 1 auto!important;min-width:0!important;white-space:nowrap!important}
      .bookora-home-clean .book-pages{min-width:0!important;max-width:48%!important}
      .bookora-home-clean .book-card-title-link,.bookora-home-clean .book-card-title-link h3,.bookora-home-clean .book-card-author{min-width:0!important;max-width:100%!important;overflow:hidden!important}
      .bookora-home-clean .book-card-title-link h3{font-size:.86rem!important;line-height:1.28!important;min-height:2.2rem!important;overflow-wrap:normal!important;word-break:normal!important}
      .bookora-home-clean .book-card-author{white-space:nowrap!important;text-overflow:ellipsis!important;overflow:hidden!important}
      .bookora-home-clean .book-card-rating{min-width:0!important;white-space:nowrap!important;overflow:hidden!important}
      .bookora-home-clean .book-card-price-row{min-width:0!important;align-items:center!important;gap:.35rem!important}
      .bookora-home-clean .book-card-price-row>div:first-child{min-width:0!important;flex:1 1 auto!important}
      .bookora-home-clean .book-card-price{font-size:.9rem!important;line-height:1.1!important;white-space:nowrap!important;word-break:keep-all!important}
      .bookora-home-clean .book-card-old-price{white-space:nowrap!important}
      .bookora-home-clean .book-buy-btn{flex:0 0 auto!important;white-space:nowrap!important;font-size:.65rem!important;padding:.38rem .55rem!important}
      .bookora-home-clean .book-card-premium .book-wishlist-btn{width:32px!important;height:32px!important}
    }
  `;
  document.head.appendChild(style);
})();
