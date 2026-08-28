// Bookora homepage — stable All eBooks section.
// This section is independent of Trending. It must never depend on another
// homepage runtime being present before it can render.
(() => {
  if (window.__BOOKORA_ALL_EBOOKS_PERMANENT__) return;
  window.__BOOKORA_ALL_EBOOKS_PERMANENT__ = true;

  const LIMIT = 60;
  let busy = false;
  let timer = null;

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

  function schedule(delay = 80) {
    clearTimeout(timer);
    timer = setTimeout(() => { timer = null; render(); }, delay);
  }

  async function render() {
    if (busy || !isHome()) return;
    busy = true;
    try {
      const main = document.querySelector('#main-content');
      if (!main) return;
      let section = document.getElementById('bookora-all-ebooks-section');
      if (!section) {
        section = document.createElement('section');
        section.id = 'bookora-all-ebooks-section';
        section.className = 'kdp-catalog-section bookora-all-ebooks-section';
        // Insert after the core Featured section, not after Trending.
        const featured = main.querySelector('.kdp-catalog-section');
        const trust = main.querySelector('.home-trust-clean');
        if (featured) featured.insertAdjacentElement('afterend', section);
        else if (trust) trust.insertAdjacentElement('beforebegin', section);
        else main.appendChild(section);
      }

      const state = await getState();
      if (!state) return;
      const allBooks = getBooks(state);
      if (!allBooks.length) {
        section.innerHTML = `<div class="kdp-catalog-container"><div class="kdp-section-head"><div><span class="kdp-kicker">BOOKORA STORE</span><h2>All eBooks</h2><p>Loading approved eBooks from Bookora.</p></div></div><div class="kdp-loading-state"><strong>Loading eBooks…</strong><span>Connecting to the Bookora catalog</span></div></div>`;
        return;
      }

      const books = allBooks.slice(0, LIMIT);
      const { renderBookCard } = await import('./components/BookCard.js');
      const cards = books.map(book => `<div class="kdp-book-item">${renderBookCard(book)}</div>`).join('');
      section.innerHTML = `<div class="kdp-catalog-container"><div class="kdp-section-head"><div><span class="kdp-kicker">BOOKORA STORE</span><h2>All eBooks</h2><p>Showing ${books.length} approved eBooks. More are available in Explore.</p></div><a href="#/explore" class="kdp-view-all">View all <span>→</span></a></div><div class="bookora-all-ebooks-grid">${cards}</div></div>`;
    } finally { busy = false; }
  }

  window.addEventListener('bookora:fast-catalog', () => schedule(30));
  window.addEventListener('bookora:catalog-updated', () => schedule(80));
  window.addEventListener('hashchange', () => schedule(100));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => schedule(0), { once: true });
  else schedule(0);
})();

if (!document.getElementById('bookora-all-ebooks-stable-styles')) {
  const style = document.createElement('style');
  style.id = 'bookora-all-ebooks-stable-styles';
  style.textContent = `
    #bookora-all-ebooks-section{width:100%!important;box-sizing:border-box!important;border-top:1px solid var(--border-subtle,#e2e8f0);padding-top:52px}
    #bookora-all-ebooks-section .kdp-catalog-container{width:min(1240px,calc(100% - 40px));margin-inline:auto;box-sizing:border-box}
    #bookora-all-ebooks-section .bookora-all-ebooks-grid{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:22px!important;width:100%!important;box-sizing:border-box}
    #bookora-all-ebooks-section .kdp-book-item{width:100%!important;min-width:0!important}
    @media(max-width:1100px){#bookora-all-ebooks-section .bookora-all-ebooks-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:14px!important}}
    @media(max-width:800px){#bookora-all-ebooks-section .kdp-catalog-container{width:min(100% - 28px,1240px)}#bookora-all-ebooks-section .bookora-all-ebooks-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important}}
    @media(max-width:560px){#bookora-all-ebooks-section .bookora-all-ebooks-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}}
  `;
  document.head.appendChild(style);
}
