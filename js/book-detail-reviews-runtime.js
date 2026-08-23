// Bookora — lightweight Firebase-first review hydration runtime.
// Firebase reviews are the source of truth for visible review list, average and count.
import { state } from './state.js';
import { formatDate, renderStars } from './utils/formatters.js';

(() => {
  'use strict';

  const loaded = new Map();
  let unsubscribe = null;
  let activeKey = '';
  let watchTimer = null;
  let retryTimer = null;

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

  const normaliseBookId = value => String(value ?? '').trim();

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
        : '<div class="bd-empty">No customer reviews yet. Be the first reader to share your feedback.</div>';
    }

    const count = reviews.length;
    const average = count ? reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / count : 0;
    const score = document.querySelector('.bd-score-number');
    const scoreStars = document.querySelector('.bd-score .bd-rating-stars');
    const scoreText = document.querySelector('.bd-score small');

    if (score) score.textContent = count ? average.toFixed(1) : '—';
    if (scoreStars) scoreStars.innerHTML = renderStars(average);
    if (scoreText) scoreText.textContent = `${count} ${count === 1 ? 'reader review' : 'reader reviews'}`;

    document.querySelectorAll('.bd-tab[data-tab="reviews"]').forEach(tab => {
      tab.textContent = `Reviews (${count})`;
    });
    document.querySelectorAll('[data-review-count], .bd-review-count').forEach(el => {
      el.textContent = String(count);
    });
  }

  function applyReviews(key, reviews) {
    const book = getBook();
    if (!book || normaliseBookId(book.id) !== key) return;

    const clean = dedupeReviews((reviews || []).filter(review => reviewBelongsToBook(review, key)));
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
    activeKey = '';
  }

  function attachForBook(key) {
    if (!window.firebase?.apps?.length || !key) return false;
    if (activeKey === key && unsubscribe) return true;

    stopListener();
    activeKey = key;

    try {
      const db = window.firebase.firestore();
      // onSnapshot performs the initial read and then remains live. There is no
      // extra .get() request, which prevents duplicate Firestore work during startup.
      unsubscribe = db.collection('reviews')
        .where('book_id', '==', key)
        .onSnapshot(snapshot => {
          if (!getBook() || normaliseBookId(getBook().id) !== key) return;
          applyReviews(key, dedupeReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
        }, error => {
          console.warn('Bookora Firebase review listener:', error?.message || error);
        });
      return true;
    } catch (error) {
      console.warn('Bookora Firebase review listener setup:', error?.message || error);
      return false;
    }
  }

  function watchCurrentBook() {
    const book = getBook();
    if (!book || !window.firebase?.apps?.length) {
      if (retryTimer) clearTimeout(retryTimer);
      retryTimer = setTimeout(() => {
        retryTimer = null;
        watchCurrentBook();
      }, 1500);
      return;
    }

    const key = normaliseBookId(book.id);
    if (!key) return;
    attachForBook(key);
  }

  function scheduleWatch(delay = 50) {
    if (watchTimer) clearTimeout(watchTimer);
    watchTimer = setTimeout(() => {
      watchTimer = null;
      watchCurrentBook();
    }, delay);
  }

  window.addEventListener('hashchange', () => scheduleWatch(50));
  window.addEventListener('load', () => scheduleWatch(100));

  // DATA_SYNCED can fire during catalog hydration. Debounce it so it never
  // repeatedly tears down/recreates the Firestore listener during page startup.
  state.subscribe(event => {
    if (event === 'DATA_SYNCED' || event === 'USER_LOGGED_IN') scheduleWatch(100);
  });

  scheduleWatch(100);
})();