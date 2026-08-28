// Bookora homepage — performance-safe All eBooks section.
// Full catalog stays in Firebase/backend; homepage renders at most 60 cards.
(() => {
  if (window.__BOOKORA_ALL_EBOOKS_STABLE_V2__) return;
  window.__BOOKORA_ALL_EBOOKS_STABLE_V2__ = true;

  const HOMEPAGE_BOOK_LIMIT = 60;
  let busy = false;
  let timer = null;
  let stableCatalogShown = false;

  async function getState() {
    try { return (await import('./state.js')).state; } catch (_) { return null; }
  }

  function getBooks(state) {
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

  function isHome() { return !!document.querySelector('#main-content .bookora-home-clean'); }
  function schedule(delay = 100) {
    if (stableCatalogShown) return;
    clearTimeout(timer);
    timer = setTimeout(() => { timer = null; render(); }, delay);
  }

  async function render() {
    if (busy || stableCatalogShown || !isHome()) return;
    busy = true;
    try {
      const main = document.querySelector('#main-content');
      const trending = document.getElementById('bookora-smart-trending');
      if (!main || !trending) return;
      let section = document.getElementById('bookora-all-ebooks-section');
      if (!section) {
        section = document.createElement('section');
        section.id = 'bookora-all-ebooks-section';
        section.className = 'kdp-catalog-section bookora-all-ebooks-section';
        trending.insertAdjacentElement('afterend', section);
      }
      const state = await getState();
      if (!state) return;
      const allBooks = getBooks(state);
      if (!allBooks.length) {
        if (!section.querySelector('.bookora-all-ebooks-grid')) {
          section.innerHTML = '<div class="kdp-catalog-container"><div class="kdp-section-head"><div><span class="kdp-kicker">BOOKORA STORE</span><h2>All eBooks</h2><p>Explore approved eBooks available in the Bookora store.</p></div></div><div class="bookora-all-ebooks-grid"><div class="kdp-loading-state"><strong>Loading eBooks…</strong><span>Connecting to the Bookora catalog</span></div></div></div>';
        }
        return;
      }

      // Keep the full Firebase/backend catalog untouched, but render only 60
      // cards on Home so the browser never has to build an unbounded DOM tree.
      const books = allBooks.slice(0, HOMEPAGE_BOOK_LIMIT);
      const { renderBookCard } = await import('./components/BookCard.js');
      const cards = books.map(book => `<div class="kdp-book-item">${renderBookCard(book)}</div>`).join('');
      section.innerHTML = `<div class="kdp-catalog-container"><div class="kdp-section-head"><div><span class="kdp-kicker">BOOKORA STORE</span><h2>All eBooks</h2><p>Showing ${books.length} approved eBooks on the homepage.</p></div><a href="#/explore" class="kdp-view-all">View all <span>→</span></a></div><div class="bookora-all-ebooks-grid">${cards}</div></div>`;
      stableCatalogShown = true;
    } finally { busy = false; }
  }

  window.addEventListener('bookora:fast-catalog', () => schedule(80));
  window.addEventListener('bookora:catalog-updated', () => schedule(100));
  window.addEventListener('bookora:firebase-trending-updated', () => schedule(120));
  window.addEventListener('hashchange', () => schedule(120));
  getState().then(state => { try { state?.subscribe?.(() => schedule(150)); } catch (_) {} });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => schedule(0), { once: true });
  else schedule(0);
})();

if (!document.getElementById('bookora-all-ebooks-stable-styles')) {
  const style = document.createElement('style');
  style.id = 'bookora-all-ebooks-stable-styles';
  style.textContent = `
    #bookora-all-ebooks-section{width:100%!important;max-width:none!important;box-sizing:border-box!important;border-top:1px solid var(--border-subtle,#e2e8f0);padding-top:52px}
    #bookora-all-ebooks-section .kdp-catalog-container{width:100%!important;max-width:2400px!important;margin-inline:auto!important;padding-inline:clamp(12px,2.4vw,48px)!important;box-sizing:border-box!important}
    #bookora-all-ebooks-section .bookora-all-ebooks-grid{display:grid!important;width:100%!important;min-width:0!important;max-width:none!important;box-sizing:border-box!important;grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:clamp(10px,1.25vw,22px)!important;align-items:stretch!important}
    #bookora-all-ebooks-section .bookora-all-ebooks-grid .kdp-book-item{width:100%!important;min-width:0!important;max-width:250px!important;box-sizing:border-box!important;display:flex!important;justify-content:stretch!important}
    #bookora-all-ebooks-section .bookora-all-ebooks-grid .book-card,#bookora-all-ebooks-section .bookora-all-ebooks-grid .book-card-premium{width:100%!important;min-width:0!important;max-width:250px!important;box-sizing:border-box!important}
    #bookora-all-ebooks-section .bookora-all-ebooks-grid .book-cover-container,#bookora-all-ebooks-section .bookora-all-ebooks-grid .book-cover-premium{width:100%!important;height:auto!important;aspect-ratio:2/3!important;min-height:0!important;box-sizing:border-box!important}
    @media(max-width:767px){#bookora-all-ebooks-section .kdp-catalog-container{padding-inline:10px!important}#bookora-all-ebooks-section .bookora-all-ebooks-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}#bookora-all-ebooks-section .bookora-all-ebooks-grid .kdp-book-item,#bookora-all-ebooks-section .bookora-all-ebooks-grid .book-card,#bookora-all-ebooks-section .bookora-all-ebooks-grid .book-card-premium{max-width:none!important}}
    @media(min-width:768px) and (max-width:1099px){#bookora-all-ebooks-section .bookora-all-ebooks-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:14px!important}}
    @media(min-width:1100px) and (max-width:1599px){#bookora-all-ebooks-section .bookora-all-ebooks-grid{grid-template-columns:repeat(6,minmax(0,1fr))!important}}
    @media(min-width:1600px) and (max-width:2199px){#bookora-all-ebooks-section .bookora-all-ebooks-grid{grid-template-columns:repeat(7,minmax(0,1fr))!important}}
    @media(min-width:2200px) and (max-width:3199px){#bookora-all-ebooks-section .bookora-all-ebooks-grid{grid-template-columns:repeat(9,minmax(0,1fr))!important}}
    @media(min-width:3200px){#bookora-all-ebooks-section .bookora-all-ebooks-grid{grid-template-columns:repeat(10,minmax(0,1fr))!important}}
  `;
  document.head.appendChild(style);
}
