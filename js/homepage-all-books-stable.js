// Bookora homepage catalog stability runtime.
// Enforces the homepage contract: Trending = 6, All eBooks = up to 60.
// Uses the same approved Firebase/Bookora state and BookCard renderer.
(() => {
  if (window.__BOOKORA_HOME_CATALOG_STABLE__) return;
  window.__BOOKORA_HOME_CATALOG_STABLE__ = true;

  const ALL_ID = 'bookora-all-ebooks-section';
  const TRENDING_ID = 'bookora-home-trending-section';
  let timer = null;
  let running = false;

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

  function trendingBooks(state, books) {
    const firebase = window.__BOOKORA_FIREBASE_TRENDING__;
    const snapshot = Array.isArray(firebase?.books) ? firebase.books.slice(0, 6) : [];
    if (snapshot.length) {
      const byId = new Map(books.map(book => [String(book.id || book.bookId || ''), book]));
      return snapshot.map(item => {
        const id = String(item.id || item.bookId || '');
        return byId.get(id) || state.normalizeBook(item);
      }).filter(Boolean).slice(0, 6);
    }
    if (typeof state?.getFeaturedTrendingBooks === 'function') return state.getFeaturedTrendingBooks(6).slice(0, 6);
    const flagged = books.filter(book => book.is_trending || book.isTrending);
    return (flagged.length ? flagged : books).slice(0, 6);
  }

  function cardGrid(books, renderBookCard) {
    return `<div class="kdp-book-grid">${books.map(book => `<div class="kdp-book-item">${renderBookCard(book)}</div>`).join('')}</div>`;
  }

  async function render() {
    if (running || !isHome()) return;
    running = true;
    try {
      const state = await getState();
      if (!state) return;
      const books = approvedBooks(state);
      const { renderBookCard } = await import('./components/BookCard.js');
      const trending = trendingBooks(state, books);

      const homeCatalog = document.getElementById('home-live-catalog');
      const originalSection = homeCatalog?.closest('.kdp-catalog-section');
      if (originalSection) {
        originalSection.id = TRENDING_ID;
        const heading = originalSection.querySelector('.kdp-section-head h2');
        const description = originalSection.querySelector('.kdp-section-head p');
        const tab = originalSection.querySelector('.kdp-tab.active');
        if (heading) heading.textContent = trending.length ? 'Trending eBooks' : 'Trending eBooks';
        if (description) description.textContent = 'Popular eBooks selected from Bookora activity, ratings, reviews, and freshness.';
        if (tab) tab.textContent = 'Trending';
        if (homeCatalog) homeCatalog.innerHTML = trending.length
          ? cardGrid(trending.slice(0, 6), renderBookCard)
          : '<div class="kdp-loading-state"><strong>Loading Trending eBooks…</strong><span>Connecting to the Bookora catalog</span></div>';
      }

      let all = document.getElementById(ALL_ID);
      if (!all) {
        all = document.createElement('section');
        all.id = ALL_ID;
        all.className = 'kdp-catalog-section bookora-all-ebooks-section';
      }
      const anchor = document.getElementById(TRENDING_ID) || originalSection;
      if (anchor && all.previousElementSibling !== anchor) anchor.insertAdjacentElement('afterend', all);

      const allBooks = books.slice(0, 60);
      all.innerHTML = `<div class="kdp-catalog-container"><div class="kdp-section-head"><div><span class="kdp-kicker">BOOKORA STORE</span><h2>All eBooks</h2><p>Showing ${allBooks.length} approved eBooks.</p></div><a href="#/explore" class="kdp-view-all">View all <span>→</span></a></div>${allBooks.length ? `<div class="bookora-all-ebooks-grid kdp-book-grid">${allBooks.map(book => `<div class="kdp-book-item">${renderBookCard(book)}</div>`).join('')}</div>` : '<div class="kdp-loading-state"><strong>Loading eBooks…</strong><span>Connecting to the Bookora catalog</span></div>'}</div>`;
    } finally {
      running = false;
    }
  }

  function schedule(delay = 60) {
    clearTimeout(timer);
    timer = setTimeout(() => { timer = null; render(); }, delay);
  }

  function start() {
    if (!isHome()) return;
    schedule(0);
    window.addEventListener('bookora:fast-catalog', () => schedule(20));
    window.addEventListener('bookora:catalog-updated', () => schedule(50));
    window.addEventListener('bookora:firebase-trending-updated', () => schedule(20));
  }

  const observer = new MutationObserver(() => {
    if (isHome() && !document.getElementById(ALL_ID)) schedule(30);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();

  if (!document.getElementById('bookora-home-catalog-stable-styles')) {
    const style = document.createElement('style');
    style.id = 'bookora-home-catalog-stable-styles';
    style.textContent = `
      #${TRENDING_ID} .kdp-book-grid,#${ALL_ID} .bookora-all-ebooks-grid{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:22px!important;width:100%!important}
      #${TRENDING_ID} .kdp-book-item,#${ALL_ID} .kdp-book-item{display:block!important;width:100%!important;min-width:0!important;max-width:none!important}
      @media(max-width:1100px){#${TRENDING_ID} .kdp-book-grid,#${ALL_ID} .bookora-all-ebooks-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:14px!important}}
      @media(max-width:800px){#${TRENDING_ID} .kdp-book-grid,#${ALL_ID} .bookora-all-ebooks-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important}}
      @media(max-width:560px){#${TRENDING_ID} .kdp-book-grid,#${ALL_ID} .bookora-all-ebooks-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}}
    `;
    document.head.appendChild(style);
  }
})();
