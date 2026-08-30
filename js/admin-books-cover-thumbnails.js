// Bookora Admin Books — Firebase cover thumbnails.
// Presentation-only enhancement: keeps the existing admin books data/actions intact
// and decorates each rendered book row with its Firebase cover image.
(() => {
  'use strict';
  if (window.__BOOKORA_ADMIN_BOOK_COVER_THUMBNAILS__) return;
  window.__BOOKORA_ADMIN_BOOK_COVER_THUMBNAILS__ = true;

  let booksById = new Map();
  let booksByTitle = new Map();
  let observer = null;
  let retryTimer = null;
  let listenerStarted = false;

  const isBooksRoute = () => String(location.hash || '').split('?')[0].replace(/\/+$/, '') === '#/admin/books';
  const clean = value => String(value || '').trim().toLowerCase();
  const escapeAttr = value => String(value ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const coverUrl = book => String(book?.cover_url || book?.coverUrl || book?.cover_image_url || book?.coverImageUrl || '').trim();

  const injectStyles = () => {
    if (document.getElementById('bookora-admin-book-cover-thumb-css')) return;
    const style = document.createElement('style');
    style.id = 'bookora-admin-book-cover-thumb-css';
    style.textContent = `
      #ab-list .bookora-admin-book-cell{display:flex;align-items:center;gap:12px;min-width:0}
      #ab-list .bookora-admin-book-cover{width:44px;height:62px;flex:0 0 44px;object-fit:cover;border-radius:7px;border:1px solid #e2e8f0;background:#f8fafc;box-shadow:0 2px 7px rgba(15,23,42,.10);display:block}
      #ab-list .bookora-admin-book-cover-fallback{width:44px;height:62px;flex:0 0 44px;border-radius:7px;border:1px solid #e2e8f0;background:#f8fafc;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:18px;font-weight:800;box-sizing:border-box}
      #ab-list .bookora-admin-book-meta{min-width:0}
      #ab-list .bookora-admin-book-meta b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    `;
    document.head.appendChild(style);
  };

  const findBook = row => {
    const id = clean(row?.dataset?.bookId || row?.dataset?.id || '');
    if (id && booksById.has(id)) return booksById.get(id);
    const title = clean(row?.querySelector('td:first-child b')?.textContent || '');
    return title ? booksByTitle.get(title) : null;
  };

  const decorate = () => {
    if (!isBooksRoute()) return;
    const tbody = document.getElementById('ab-list');
    if (!tbody) return;
    injectStyles();
    tbody.querySelectorAll('tr').forEach(row => {
      if (row.dataset.bookoraCoverDecorated === '1') return;
      const cell = row.querySelector('td:first-child');
      if (!cell || !cell.querySelector('b')) return;
      const book = findBook(row);
      if (!book) return;

      const title = cell.querySelector('b');
      const cover = coverUrl(book);
      const meta = document.createElement('div');
      meta.className = 'bookora-admin-book-meta';
      while (cell.firstChild) meta.appendChild(cell.firstChild);

      let visual;
      if (cover) {
        visual = document.createElement('img');
        visual.className = 'bookora-admin-book-cover';
        visual.loading = 'lazy';
        visual.alt = `${String(book.title || 'eBook')} cover`;
        visual.src = cover;
        visual.addEventListener('error', () => {
          const fallback = document.createElement('div');
          fallback.className = 'bookora-admin-book-cover-fallback';
          fallback.setAttribute('aria-hidden', 'true');
          fallback.textContent = '▤';
          visual.replaceWith(fallback);
        }, { once: true });
      } else {
        visual = document.createElement('div');
        visual.className = 'bookora-admin-book-cover-fallback';
        visual.setAttribute('aria-hidden', 'true');
        visual.textContent = '▤';
      }
      cell.className = `${cell.className || ''} bookora-admin-book-cell`.trim();
      cell.append(visual, meta);
      row.dataset.bookoraCoverDecorated = '1';
    });
  };

  const startListener = () => {
    if (!isBooksRoute()) return;
    if (listenerStarted) { decorate(); return; }
    if (!window.firebase?.firestore) {
      clearTimeout(retryTimer);
      retryTimer = setTimeout(startListener, 500);
      return;
    }
    listenerStarted = true;
    try {
      const db = window.firebase.firestore();
      db.collection('books').onSnapshot(snapshot => {
        booksById = new Map();
        booksByTitle = new Map();
        snapshot.docs.forEach(doc => {
          const book = { id:String(doc.id), ...doc.data() };
          booksById.set(clean(book.id), book);
          const title = clean(book.title);
          if (title) booksByTitle.set(title, book);
        });
        decorate();
      }, error => {
        console.warn('[Bookora Admin Books Covers] Firebase listener:', error?.message || error);
      });
    } catch (error) {
      listenerStarted = false;
      console.warn('[Bookora Admin Books Covers] Firebase init:', error?.message || error);
      clearTimeout(retryTimer);
      retryTimer = setTimeout(startListener, 1000);
    }
  };

  const bindRoute = () => {
    if (!isBooksRoute()) return;
    injectStyles();
    startListener();
    const tbody = document.getElementById('ab-list');
    if (tbody && !observer) {
      observer = new MutationObserver(() => decorate());
      observer.observe(tbody, { childList:true, subtree:true });
    }
    decorate();
  };

  window.addEventListener('hashchange', () => setTimeout(bindRoute, 80));
  window.addEventListener('bookora:route-ready', () => setTimeout(bindRoute, 0));
  document.addEventListener('DOMContentLoaded', () => setTimeout(bindRoute, 100), { once:true });
  [250, 750, 1500, 3000].forEach(delay => setTimeout(bindRoute, delay));
  bindRoute();
})();