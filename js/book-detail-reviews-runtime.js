// Bookora — Firebase-first review hydration runtime.
// Reviews collection is the source of truth for the visible review list,
// average rating and review count. Book-level cached review_count/rating values
// are never allowed to override the Firebase result.
import { state } from './state.js';
import { formatDate, renderStars } from './utils/formatters.js';

(() => {
  'use strict';

  const loaded = new Map();
  let requestId = 0;
  let unsubscribe = null;

  const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
  }[c]));

  function bookIdFromHash() {
    const path = (location.hash || '').split('?')[0];
    return path.startsWith('#/book/') ? decodeURIComponent(path.slice(7)).trim() : '';
  }

  function getBook() {
    const id = bookIdFromHash();
    return id ? state.getBookBySlug(id) : null;
  }

  function normaliseBookId(value) {
    return String(value ?? '').trim();
  }

  function reviewBelongsToBook(review, key) {
    return normaliseBookId(review.book_id ?? review.bookId ?? review.bookID) === key;
  }

  function dedupeReviews(reviews) {
    const seen = new Set();
    return reviews.filter(review => {
      const id = String(review.id ?? review.review_id ?? '');
      const fallback = [review.user_id ?? review.userId ?? '', review.book_id ?? review.bookId ?? '', review.createdAt ?? review.created_at ?? review.date ?? '', review.comment ?? ''].join('|');
      const key = id || fallback;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function renderList(reviews) {
    const list = document.getElementById('review-list');
    if (list) {
      list.innerHTML = reviews.length ? reviews.map(review => `
        <article class="bd-review">
          <div class="bd-review-top">
            <div>
              <div class="bd-rating-stars">${renderStars(Number(review.rating || 0))}</div>
              <div class="bd-review-title">${esc(review.title || 'Reader review')}</div>
            </div>
            <span class="bd-review-meta">${esc(formatDate(review.date || review.created_at || review.createdAt || ''))}</span>
          </div>
          <p class="bd-review-comment">${esc(review.comment || '')}</p>
          <div class="bd-review-meta">${esc(review.user_name || review.userName || 'Bookora Reader')} ${review.verified_purchase ? '<span class="bd-verified">• ✓ Verified Purchase</span>' : ''}</div>
        </article>`).join('')
        : '<div class="bd-empty">No customer reviews yet. Be the first verified reader to share your feedback.</div>';
    }

    const count = reviews.length;
    const average = count ? reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / count : 0;
    const score = document.querySelector('.bd-score-number');
    const scoreStars = document.querySelector('.bd-score .bd-rating-stars');
    const scoreText = document.querySelector('.bd-score small');

    if (score) score.textContent = count ? average.toFixed(1) : '—';
    if (scoreStars) scoreStars.innerHTML = renderStars(average);
    if (scoreText) scoreText.textContent = `${count} verified reader ${count === 1 ? 'review' : 'reviews'}`;

    document.querySelectorAll('.bd-tab[data-tab="reviews"]').forEach(tab => {
      tab.textContent = `Reviews (${count})`;
    });

    // Keep any review-count elements rendered by the book detail/catalog UI in
    // sync with the same Firebase-derived value.
    document.querySelectorAll('[data-review-count], .bd-review-count').forEach(el => {
      el.textContent = String(count);
    });
  }

  async function fetchReviews(key) {
    if (!window.firebase?.apps?.length || !key) return null;
    const db = window.firebase.firestore();
    const snapshot = await db.collection('reviews').where('book_id', '==', key).get();
    return dedupeReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }

  function applyReviews(key, reviews) {
    const book = getBook();
    if (!book || normaliseBookId(book.id) !== key) return;

    const clean = dedupeReviews(reviews.filter(review => reviewBelongsToBook(review, key)));
    const others = Array.isArray(state.reviews)
      ? state.reviews.filter(item => !reviewBelongsToBook(item, key))
      : [];
    state.reviews = [...others, ...clean];
    loaded.set(key, clean);
    renderList(clean);
  }

  function stopListener() {
    if (typeof unsubscribe === 'function') unsubscribe();
    unsubscribe = null;
  }

  async function hydrate() {
    const book = getBook();
    if (!book || !window.firebase?.apps?.length) return;

    const key = normaliseBookId(book.id);
    if (!key) return;
    const id = ++requestId;

    try {
      const reviews = await fetchReviews(key);
      if (id !== requestId || !getBook() || normaliseBookId(getBook().id) !== key) return;
      applyReviews(key, reviews || []);
    } catch (error) {
      console.warn('Bookora Firebase review hydration:', error?.message || error);
      // Do not replace a previously loaded Firebase result with a stale cached
      // book.review_count value merely because a transient read failed.
      const cached = loaded.get(key);
      if (cached) renderList(cached);
    }
  }

  function watchCurrentBook() {
    stopListener();
    const book = getBook();
    if (!book || !window.firebase?.apps?.length) return;

    const key = normaliseBookId(book.id);
    if (!key) return;

    // Initial read guarantees correct state even when the realtime listener is
    // attached after the page has already rendered.
    hydrate();

    try {
      const db = window.firebase.firestore();
      unsubscribe = db.collection('reviews')
        .where('book_id', '==', key)
        .onSnapshot(snapshot => {
          if (!getBook() || normaliseBookId(getBook().id) !== key) return;
          const reviews = dedupeReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          applyReviews(key, reviews);
        }, error => {
          console.warn('Bookora Firebase review listener:', error?.message || error);
        });
    } catch (error) {
      console.warn('Bookora Firebase review listener setup:', error?.message || error);
    }
  }

  function scheduleWatch() {
    setTimeout(watchCurrentBook, 0);
    setTimeout(watchCurrentBook, 250);
    setTimeout(watchCurrentBook, 1000);
  }

  window.addEventListener('hashchange', event => {
    if (!event.isTrusted && bookIdFromHash() && document.querySelector('.bd-page')) {
      event.stopImmediatePropagation();
    }
    scheduleWatch();
  }, true);

  window.addEventListener('load', scheduleWatch);

  state.subscribe(event => {
    if (event === 'DATA_SYNCED' || event === 'USER_LOGGED_IN') scheduleWatch();
  });

  scheduleWatch();
})();
