// Bookora — review hydration runtime.
// Prevents the detail page from re-rendering itself when reviews arrive and
// updates the visible review list in place.
import { state } from './state.js';
import { formatDate, renderStars } from './utils/formatters.js';

(() => {
  'use strict';
  const loaded = new Set();
  let requestId = 0;

  const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));

  function bookIdFromHash() {
    const path = (location.hash || '').split('?')[0];
    return path.startsWith('#/book/') ? decodeURIComponent(path.slice(7)).trim() : '';
  }

  function getBook() {
    const id = bookIdFromHash();
    return id ? state.getBookBySlug(id) : null;
  }

  function renderList(reviews) {
    const list = document.getElementById('review-list');
    if (!list) return;
    list.innerHTML = reviews.length ? reviews.map(review => `
      <article class="bd-review">
        <div class="bd-review-top">
          <div><div class="bd-rating-stars">${renderStars(Number(review.rating || 0))}</div><div class="bd-review-title">${esc(review.title || 'Reader review')}</div></div>
          <span class="bd-review-meta">${esc(formatDate(review.date || review.created_at || review.createdAt || ''))}</span>
        </div>
        <p class="bd-review-comment">${esc(review.comment || '')}</p>
        <div class="bd-review-meta">${esc(review.user_name || review.userName || 'Bookora Reader')} ${review.verified_purchase ? '<span class="bd-verified">• ✓ Verified Purchase</span>' : ''}</div>
      </article>`).join('') : '<div class="bd-empty">No customer reviews yet. Be the first verified reader to share your feedback.</div>';

    const average = reviews.length ? reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length : 0;
    const score = document.querySelector('.bd-score-number');
    const scoreStars = document.querySelector('.bd-score .bd-rating-stars');
    const scoreText = document.querySelector('.bd-score small');
    if (score) score.textContent = average ? average.toFixed(1) : '—';
    if (scoreStars) scoreStars.innerHTML = renderStars(average);
    if (scoreText) scoreText.textContent = `${reviews.length} verified reader ${reviews.length === 1 ? 'review' : 'reviews'}`;
    document.querySelectorAll('.bd-tab[data-tab="reviews"]').forEach(tab => { tab.textContent = `Reviews (${reviews.length})`; });
  }

  async function hydrate() {
    const book = getBook();
    if (!book || !window.firebase?.apps?.length) return;
    const key = String(book.id);
    if (loaded.has(key)) return;
    const id = ++requestId;
    try {
      const db = window.firebase.firestore();
      const snapshot = await db.collection('reviews').where('book_id', '==', key).get();
      if (id !== requestId || !getBook() || String(getBook().id) !== key) return;
      const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      state.reviews = [...(Array.isArray(state.reviews) ? state.reviews.filter(item => String(item.book_id) !== key) : []), ...reviews];
      loaded.add(key);
      renderList(reviews);
    } catch (error) {
      console.warn('Bookora review hydration:', error?.message || error);
    }
  }

  // The legacy page loader dispatches a synthetic hashchange after reviews
  // arrive. A capture listener prevents that event from rebuilding the page;
  // this runtime updates only the review section instead.
  window.addEventListener('hashchange', event => {
    if (!event.isTrusted && bookIdFromHash() && document.querySelector('.bd-page')) {
      event.stopImmediatePropagation();
      setTimeout(hydrate, 0);
    } else {
      setTimeout(hydrate, 50);
    }
  }, true);

  window.addEventListener('load', () => setTimeout(hydrate, 100));
  state.subscribe(event => {
    if (event === 'DATA_SYNCED' || event === 'USER_LOGGED_IN') setTimeout(hydrate, 50);
  });
  setTimeout(hydrate, 250);
})();
