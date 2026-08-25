// Bookora homepage — Firebase-backed Smart Trending eBooks engine.
// The final Top-6 list comes from Firestore: trending_ebooks/current.
(() => {
  if (window.__BOOKORA_SMART_TRENDING__) return;
  window.__BOOKORA_SMART_TRENDING__ = true;

  const SECTION_ID = 'bookora-smart-trending';
  let busy = false;
  let unsubscribe = null;
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

  function key(book) { return String(book?.id || book?.bookId || book?.book_id || ''); }

  function resolveBooks(catalog, items) {
    return (Array.isArray(items) ? items : []).slice(0, 6).map(item => {
      const id = String(item?.bookId || item?.id || '');
      const slug = String(item?.slug || '').toLowerCase();
      return catalog.find(book => key(book) === id)
        || catalog.find(book => slug && String(book?.slug || '').toLowerCase() === slug);
    }).filter(Boolean).slice(0, 6);
  }

  async function readCurrentTrending() {
    try {
      if (!window.firebase?.apps?.length) return null;
      const db = window.firebase.firestore();
      const snap = await db.collection('trending_ebooks').doc('current').get();
      if (!snap.exists) return null;
      const data = snap.data() || {};
      return Array.isArray(data.books) ? data.books.slice(0, 6) : [];
    } catch (error) {
      console.warn('[Bookora Trending] Firebase read failed:', error?.message || error);
      return null;
    }
  }

  function loading(root) {
    root.innerHTML = `<div class="kdp-catalog-container"><div class="kdp-section-head"><div><span class="kdp-kicker">BOOKORA STORE</span><h2>Trending eBooks</h2><p>Loading today's ranking from Bookora Firebase.</p></div></div><div class="kdp-loading-state"><strong>Loading trending eBooks…</strong><span>Reading the latest Top 6 from Firebase</span></div></div>`;
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
      if (!renderBookCard) renderBookCard = (await import('./components/BookCard.js')).renderBookCard;

      const firebaseItems = await readCurrentTrending();
      if (firebaseItems === null) {
        loading(root);
        return;
      }

      const books = resolveBooks(approvedBooks(state), firebaseItems);
      const cards = books.map(book => `<div class="kdp-book-item">${renderBookCard(book)}</div>`).join('');
      root.innerHTML = `<div class="kdp-catalog-container"><div class="kdp-section-head"><div><span class="kdp-kicker">BOOKORA STORE</span><h2>Trending eBooks</h2><p>Updated automatically from sales, ratings, reviews and fresh activity.</p></div></div><div id="home-live-catalog">${books.length ? `<div class="kdp-book-grid">${cards}</div>` : `<div class="kdp-loading-state"><strong>No trending eBooks yet</strong><span>The Firebase ranking is waiting for today's snapshot.</span></div>`}</div></div>`;
    } finally { busy = false; }
  }

  function startFirebaseListener() {
    try {
      if (!window.firebase?.apps?.length) return;
      const db = window.firebase.firestore();
      if (typeof unsubscribe === 'function') unsubscribe();
      unsubscribe = db.collection('trending_ebooks').doc('current').onSnapshot(() => setTimeout(render, 0), error => console.warn('[Bookora Trending] Firebase listener failed:', error?.message || error));
    } catch (error) { console.warn('[Bookora Trending] Firebase listener unavailable:', error?.message || error); }
  }

  const start = () => { render(); startFirebaseListener(); };
  window.addEventListener('bookora:fast-catalog', () => setTimeout(render, 20));
  window.addEventListener('bookora:catalog-updated', () => setTimeout(render, 20));
  window.addEventListener('hashchange', () => { if (typeof unsubscribe === 'function') unsubscribe(); unsubscribe = null; setTimeout(start, 50); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
