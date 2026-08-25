// Bookora — complete All eBooks section below Trending.
// Keeps the 6-book Trending section intact and renders every approved ebook below it.
(() => {
  if (window.__BOOKORA_ALL_EBOOKS_SECTION__) return;
  window.__BOOKORA_ALL_EBOOKS_SECTION__ = true;

  let busy = false;

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

  async function render() {
    if (busy) return;
    busy = true;
    try {
      const main = document.querySelector('#main-content');
      if (!main || !main.querySelector('.bookora-home-clean')) return;
      const trending = document.getElementById('bookora-smart-trending');
      if (!trending) return;

      let section = document.getElementById('bookora-all-ebooks-section');
      if (!section) {
        section = document.createElement('section');
        section.id = 'bookora-all-ebooks-section';
        section.className = 'kdp-catalog-section bookora-all-ebooks-section';
        trending.insertAdjacentElement('afterend', section);
      }

      const state = await getState();
      if (!state) return;
      const { renderBookCard } = await import('./components/BookCard.js');
      const books = getBooks(state);

      section.innerHTML = `
        <div class="kdp-catalog-container">
          <div class="kdp-section-head">
            <div>
              <span class="kdp-kicker">BOOKORA STORE</span>
              <h2>All eBooks</h2>
              <p>Explore every approved eBook available in the Bookora store.</p>
            </div>
          </div>
          <div class="bookora-all-ebooks-grid">
            ${books.length
              ? books.map(book => `<div class="kdp-book-item">${renderBookCard(book)}</div>`).join('')
              : `<div class="kdp-loading-state"><strong>Loading eBooks…</strong><span>Connecting to the Bookora catalog</span></div>`}
          </div>
        </div>`;
    } finally {
      busy = false;
    }
  }

  const refresh = () => setTimeout(render, 80);
  window.addEventListener('bookora:fast-catalog', refresh);
  window.addEventListener('bookora:catalog-updated', refresh);
  window.addEventListener('hashchange', () => setTimeout(render, 100));

  const observer = new MutationObserver(() => {
    if (document.querySelector('#main-content .bookora-home-clean')) setTimeout(render, 0);
  });

  const start = () => {
    const app = document.getElementById('app');
    if (app) observer.observe(app, { childList: true, subtree: true });
    render();
  };

  getState().then(state => {
    try { state?.subscribe?.(() => refresh()); } catch (_) {}
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();

if (!document.getElementById('bookora-all-ebooks-styles')) {
  const style = document.createElement('style');
  style.id = 'bookora-all-ebooks-styles';
  style.textContent = `
    #bookora-all-ebooks-section{border-top:1px solid var(--border-subtle,#e2e8f0);padding-top:52px}
    .bookora-all-ebooks-grid{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:22px!important;width:100%!important;align-items:stretch!important}
    .bookora-all-ebooks-grid .kdp-book-item{min-width:0!important;width:100%!important}
    @media(max-width:1100px){.bookora-all-ebooks-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important}}
    @media(max-width:800px){.bookora-all-ebooks-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:14px!important}}
    @media(max-width:560px){.bookora-all-ebooks-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}}
  `;
  document.head.appendChild(style);
}
