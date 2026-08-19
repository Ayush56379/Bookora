// Bookora — detail-page reliability runtime.
// The BookDetailPage component owns its interactions. This file only keeps
// direct/deep links resilient when the catalog is still loading.
import { state } from './state.js';

(() => {
  'use strict';
  let running = false;
  let finishedForHash = '';

  function currentSlug() {
    const path = (location.hash || '').split('?')[0];
    return path.startsWith('#/book/') ? decodeURIComponent(path.slice(7)).trim() : '';
  }

  function currentBook() {
    const slug = currentSlug();
    return slug ? state.getBookBySlug(slug) : null;
  }

  async function recover() {
    const slug = currentSlug();
    if (!slug || running || finishedForHash === slug) return;
    if (currentBook()) { finishedForHash = slug; return; }
    running = true;
    try {
      if (!state.booksLoaded) await new Promise(resolve => setTimeout(resolve, 300));
      if (!currentBook()) {
        const books = await state.fetchBooksFromBackend();
        if (Array.isArray(books) && books.length) {
          const merged = new Map((state.books || []).map(book => [String(book.id), book]));
          books.forEach(book => merged.set(String(book.id), book));
          state.books = [...merged.values()];
          state.booksLoaded = true;
        }
      }
      finishedForHash = slug;
      if (currentBook()) window.dispatchEvent(new Event('hashchange'));
    } catch (error) {
      console.warn('Bookora detail recovery:', error?.message || error);
      finishedForHash = slug;
    } finally {
      running = false;
    }
  }

  function run() {
    if (currentSlug() && !currentBook()) recover();
  }

  window.addEventListener('load', run);
  window.addEventListener('hashchange', () => { finishedForHash = ''; setTimeout(run, 50); });
  state.subscribe(event => {
    if (event === 'DATA_SYNCED' && currentSlug() && !currentBook()) setTimeout(run, 0);
  });
  setTimeout(run, 0);
})();
