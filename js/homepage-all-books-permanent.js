// Bookora homepage — Smart Trending eBooks engine.
// Replaces the old Featured section with exactly 6 dynamically ranked trending books.
// Ranking uses sales/purchases, ratings, review volume, freshness and a small daily
// exploration factor so the six-book set can naturally change from day to day.
(() => {
  if (window.__BOOKORA_SMART_TRENDING__) return;
  window.__BOOKORA_SMART_TRENDING__ = true;

  const SECTION_ID = 'bookora-smart-trending';
  let busy = false;
  let lastSignature = '';
  let renderBookCard = null;

  async function getState() {
    try { return (await import('./state.js')).state; } catch (_) { return null; }
  }

  function approvedBooks(state) {
    const live = state?.getApprovedBooks?.() || [];
    const fast = Array.isArray(window.__BOOKORA_FAST_BOOKS__)
      ? window.__BOOKORA_FAST_BOOKS__.map(book => state.normalizeBook(book)).filter(Boolean)
      : [];
    const map = new Map();
    [...live, ...fast].forEach(book => {
      if (book && String(book.status || '').toLowerCase() === 'approved') {
        const key = String(book.id || book.bookId || book.slug || book.title || '');
        if (key) map.set(key, book);
      }
    });
    return [...map.values()];
  }

  function num(value) {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  function sales(book) {
    const fields = ['purchaseCount','purchase_count','purchases','salesCount','sales_count','soldCount','sold_count','totalSales','total_sales','ordersCount','orders_count','orderCount','order_count','buyCount','buy_count','unitsSold','units_sold'];
    return Math.max(0, ...fields.map(key => num(book?.[key])));
  }

  function reviewStats(state, book) {
    const ids = new Set([String(book?.id || ''), String(book?.bookId || ''), String(book?.book_id || ''), String(book?.bookoraId || ''), String(book?.bookora_id || '')].filter(Boolean));
    const reviews = Array.isArray(state?.reviews) ? state.reviews.filter(r => ids.has(String(r?.bookId || r?.book_id || r?.bookoraBookId || r?.bookora_book_id || r?.productId || ''))) : [];
    const directRating = num(book?.rating ?? book?.averageRating ?? book?.average_rating);
    const directCount = num(book?.review_count ?? book?.reviewCount ?? book?.reviews_count ?? book?.reviewsCount);
    const ratings = reviews.map(r => num(r?.rating ?? r?.stars)).filter(r => r >= 1 && r <= 5);
    const avg = ratings.length ? ratings.reduce((a,b) => a + b, 0) / ratings.length : 0;
    return { rating: Math.min(5, Math.max(0, directRating || avg)), count: Math.max(directCount, ratings.length) };
  }

  function freshness(book) {
    const created = Date.parse(book?.createdAt || book?.created_at || book?.publishedAt || book?.published_at || '') || 0;
    if (!created) return 0;
    const ageDays = Math.max(0, (Date.now() - created) / 86400000);
    return Math.max(0, 18 - Math.min(18, ageDays / 14));
  }

  function dailyBoost(book) {
    const day = new Date().toISOString().slice(0, 10);
    const raw = String(book?.id || book?.bookId || book?.slug || book?.title || '') + ':' + day;
    let hash = 2166136261;
    for (let i = 0; i < raw.length; i++) { hash ^= raw.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return ((hash >>> 0) % 1000) / 1000 * 7;
  }

  function rank(state, books) {
    return books.map(book => {
      const s = sales(book);
      const { rating, count } = reviewStats(state, book);
      const score =
        (s > 0 ? Math.log1p(s) * 18 : 0) +
        rating * 9 +
        Math.log1p(count) * 4 +
        freshness(book) +
        (book?.is_bestseller ? 8 : 0) +
        (book?.is_trending ? 5 : 0) +
        dailyBoost(book);
      return { book, score, s, rating, count };
    }).sort((a,b) => b.score - a.score || b.s - a.s || b.rating - a.rating || b.count - a.count).slice(0, 6).map(x => ({ ...x.book, is_trending: true }));
  }

  async function render() {
    if (busy) return;
    busy = true;
    try {
      const main = document.querySelector('#main-content');
      if (!main || !main.querySelector('.bookora-home-clean')) return;
      const featured = main.querySelector('.kdp-catalog-section');
      if (!featured) return;

      let root = document.getElementById(SECTION_ID);
      if (!root) {
        root = featured;
        root.id = SECTION_ID;
      }

      const state = await getState();
      if (!state) return;
      if (!renderBookCard) renderBookCard = (await import('./components/BookCard.js')).renderBookCard;

      const books = rank(state, approvedBooks(state));
      const signature = books.map(b => String(b.id || b.bookId || b.slug || b.title)).join('|') + ':' + new Date().toISOString().slice(0,10);
      if (signature === lastSignature) return;
      lastSignature = signature;

      const cards = books.map(book => `<div class="kdp-book-item">${renderBookCard(book)}</div>`).join('');
      root.innerHTML = `
        <div class="kdp-catalog-container">
          <div class="kdp-section-head">
            <div>
              <span class="kdp-kicker">BOOKORA STORE</span>
              <h2>Trending eBooks</h2>
              <p>Updated automatically from sales, ratings, reviews and fresh activity.</p>
            </div>
            <a href="#/explore" class="kdp-view-all">View all <span>→</span></a>
          </div>
          <div class="kdp-tabs">
            <button class="kdp-tab active" type="button">Trending</button>
            <a class="kdp-tab" href="#/best-sellers">Best Sellers</a>
            <a class="kdp-tab" href="#/new-releases">New Releases</a>
          </div>
          <div id="home-live-catalog">
            ${books.length ? `<div class="kdp-book-grid">${cards}</div>` : `<div class="kdp-loading-state"><strong>Loading trending eBooks…</strong><span>Connecting to the Bookora catalog</span></div>`}
          </div>
        </div>`;
    } finally {
      busy = false;
    }
  }

  const refresh = () => { lastSignature = ''; setTimeout(render, 20); };
  const observer = new MutationObserver(() => {
    if (document.querySelector('#main-content .bookora-home-clean')) setTimeout(render, 0);
  });

  const start = () => {
    const app = document.getElementById('app');
    if (app) observer.observe(app, { childList: true, subtree: true });
    render();
  };

  window.addEventListener('bookora:fast-catalog', refresh);
  window.addEventListener('bookora:catalog-updated', refresh);
  window.addEventListener('hashchange', () => { lastSignature = ''; setTimeout(render, 50); });

  getState().then(state => {
    try { state?.subscribe?.(() => refresh()); } catch (_) {}
  });

  // Recalculate periodically and immediately after the calendar day changes.
  setInterval(refresh, 60 * 60 * 1000);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
