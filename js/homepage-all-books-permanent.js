// Bookora homepage — backend-precomputed Smart Trending eBooks.
// IMPORTANT: the homepage must never block on Firebase/backend trending generation.
// The backend calculates and persists the daily Top-6. The frontend renders the
// already-loaded approved catalog immediately, then silently replaces it with
// the authoritative backend snapshot when available.
(() => {
  if (window.__BOOKORA_SMART_TRENDING__) return;
  window.__BOOKORA_SMART_TRENDING__ = true;

  const SECTION_ID = 'bookora-smart-trending';
  let busy = false;
  let unsubscribe = null;

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

  function key(book) { return String(book?.id || book?.bookId || book?.book_id || ''); }

  function resolveBooks(catalog, items) {
    return (Array.isArray(items) ? items : []).slice(0, 6).map(item => {
      const id = String(item?.bookId || item?.id || '');
      const slug = String(item?.slug || '').toLowerCase();
      return catalog.find(book => key(book) === id)
        || catalog.find(book => slug && String(book?.slug || '').toLowerCase() === slug);
    }).filter(Boolean).slice(0, 6);
  }

  function localTrending(state, catalog) {
    // Never wait for Firebase. Prefer any ranking already calculated by the
    // existing state engine; otherwise use the first approved catalog items
    // so the section is populated immediately while the backend syncs silently.
    try {
      const existing = state?.getFeaturedTrendingBooks?.(6) || state?.getTrendingBooks?.()?.slice(0, 6) || [];
      const resolved = resolveBooks(catalog, existing);
      if (resolved.length) return resolved;
    } catch (_) {}
    return catalog.slice(0, 6);
  }

  async function readBackendTrending() {
    try {
      const base = String(window.BOOKORA_API_BASE || window.BOOKORA_BACKEND_URL || 'https://bookora-backend-x08l.onrender.com').replace(/\/$/, '');
      const response = await fetch(`${base}/api/trending?limit=6`, { method: 'GET', cache: 'no-store', credentials: 'omit' });
      if (!response.ok) return null;
      const payload = await response.json();
      return Array.isArray(payload?.books) ? payload.books.slice(0, 6) : null;
    } catch (error) {
      console.warn('[Bookora Trending] silent backend refresh skipped:', error?.message || error);
      return null;
    }
  }

  function renderBooks(root, books, subtitle) {
    if (!books.length) return;
    import('./components/BookCard.js').then(({ renderBookCard }) => {
      const cards = books.map(book => `<div class="kdp-book-item">${renderBookCard(book)}</div>`).join('');
      root.innerHTML = `<div class="kdp-catalog-container"><div class="kdp-section-head"><div><span class="kdp-kicker">BOOKORA STORE</span><h2>Trending eBooks</h2><p>${subtitle}</p></div></div><div id="home-live-catalog"><div class="kdp-book-grid">${cards}</div></div></div>`;
    }).catch(error => console.warn('[Bookora Trending] card render failed:', error?.message || error));
  }

  async function render() {
    if (busy) return;
    busy = true;
    try {
      const main = document.querySelector('#main-content');
      if (!main || !main.querySelector('.bookora-home-clean')) return;
      const section = main.querySelector('.kdp-catalog-section');
      if (!section) return;
      section.id = SECTION_ID;
      const root = section;
      const state = await getState();
      if (!state) return;

      const catalog = approvedBooks(state);
      if (!catalog.length) return;

      // FIRST PAINT: render immediately from already loaded frontend data.
      // No Firebase/backend request is allowed to delay or replace this paint.
      const initial = localTrending(state, catalog);
      renderBooks(root, initial, 'Updated automatically from Bookora\'s daily ranking.');

      // BACKGROUND: ask backend for the authoritative precomputed Top-6.
      // This happens after the section is already visible.
      const backendItems = await readBackendTrending();
      if (backendItems?.length) {
        const authoritative = resolveBooks(catalog, backendItems);
        if (authoritative.length) {
          renderBooks(root, authoritative, 'Updated automatically from sales, ratings, reviews and fresh activity.');
        }
      }
    } finally { busy = false; }
  }

  function startFirebaseListener() {
    // Firebase is only a silent refresh signal. It must never be the source of
    // a blocking loading state on the homepage.
    try {
      if (!window.firebase?.apps?.length) return;
      const db = window.firebase.firestore();
      if (typeof unsubscribe === 'function') unsubscribe();
      unsubscribe = db.collection('trending_ebooks').doc('current').onSnapshot(() => {
        window.dispatchEvent(new CustomEvent('bookora:firebase-trending-updated'));
      }, error => console.warn('[Bookora Trending] listener skipped:', error?.message || error));
    } catch (_) {}
  }

  const start = () => { render(); startFirebaseListener(); };
  window.addEventListener('bookora:firebase-trending-updated', () => setTimeout(render, 0));
  window.addEventListener('bookora:fast-catalog', () => setTimeout(render, 20));
  window.addEventListener('bookora:catalog-updated', () => setTimeout(render, 20));
  window.addEventListener('hashchange', () => {
    if (typeof unsubscribe === 'function') unsubscribe();
    unsubscribe = null;
    setTimeout(start, 50);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
