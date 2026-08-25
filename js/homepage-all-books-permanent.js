// Bookora permanent homepage catalog.
// Owns one stable All eBooks section so it never competes with Featured eBooks.
(() => {
  if (window.__BOOKORA_PERMANENT_ALL_BOOKS__) return;
  window.__BOOKORA_PERMANENT_ALL_BOOKS__ = true;

  const SECTION_ID = 'bookora-home-all-books';
  let busy = false;
  let lastHtml = '';
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
        const key = String(book.id || book.bookId || book.slug || book.title || Math.random());
        map.set(key, book);
      }
    });
    return [...map.values()];
  }

  async function ensureCardRenderer() {
    if (renderBookCard) return renderBookCard;
    const mod = await import('./components/BookCard.js');
    renderBookCard = mod.renderBookCard;
    return renderBookCard;
  }

  async function render() {
    if (busy) return;
    busy = true;
    try {
      const main = document.querySelector('#main-content');
      if (!main || !main.querySelector('.bookora-home-clean')) return;

      let root = document.getElementById(SECTION_ID);
      if (!root) {
        const featured = main.querySelector('.kdp-catalog-section');
        if (!featured) return;
        root = document.createElement('section');
        root.id = SECTION_ID;
        root.className = 'kdp-catalog-section bookora-home-all-books-section';
        featured.insertAdjacentElement('afterend', root);
      }

      const state = await getState();
      if (!state) return;
      const card = await ensureCardRenderer();
      const books = approvedBooks(state);
      const cards = books.map(book => `<div class="kdp-book-item">${card(book)}</div>`).join('');
      const html = `
        <div class="kdp-catalog-container">
          <div class="kdp-section-head">
            <div>
              <span class="kdp-kicker">BOOKORA LIBRARY</span>
              <h2>All eBooks</h2>
              <p>Every approved eBook currently available on Bookora.</p>
            </div>
            <span class="bookora-all-books-count">${books.length} ${books.length === 1 ? 'book' : 'books'}</span>
          </div>
          <div class="kdp-book-grid">
            ${books.length ? cards : '<div class="bookora-all-books-empty">No approved eBooks available yet.</div>'}
          </div>
        </div>`;
      if (html !== lastHtml) {
        root.innerHTML = html;
        lastHtml = html;
      }
    } finally {
      busy = false;
    }
  }

  const observer = new MutationObserver(() => {
    if (!document.querySelector('#main-content .bookora-home-clean')) return;
    if (!document.getElementById(SECTION_ID)) setTimeout(render, 0);
  });

  const start = () => {
    const app = document.getElementById('app');
    if (app) observer.observe(app, { childList: true, subtree: true });
    render();
  };

  window.addEventListener('hashchange', () => {
    lastHtml = '';
    setTimeout(render, 30);
  });
  window.addEventListener('bookora:fast-catalog', () => { lastHtml = ''; render(); });
  window.addEventListener('bookora:catalog-updated', () => { lastHtml = ''; render(); });

  getState().then(state => {
    try { state?.subscribe?.(() => { lastHtml = ''; render(); }); } catch (_) {}
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
