// Bookora — permanent review/rating projection for every shared ebook card.
// Detail pages can calculate reviews independently; this bridge makes the same
// live Firestore review data visible anywhere the shared BookCard is rendered.
(() => {
  if (window.__BOOKORA_EBOOK_RATING_SYNC__) return;
  window.__BOOKORA_EBOOK_RATING_SYNC__ = true;

  const num = value => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const idOf = value => String(value ?? '').trim();

  function reviewBookId(review) {
    return idOf(
      review?.bookId ?? review?.book_id ?? review?.bookoraBookId ?? review?.bookora_book_id ??
      review?.ebookId ?? review?.ebook_id ?? review?.publicationId ?? review?.publication_id
    );
  }

  function reviewRating(review) {
    return num(review?.rating ?? review?.stars ?? review?.reviewRating ?? review?.review_rating);
  }

  function isUsableReview(review) {
    const status = idOf(review?.status || review?.reviewStatus || review?.review_status).toLowerCase();
    if (['rejected', 'deleted', 'hidden', 'pending'].includes(status)) return false;
    return reviewRating(review) >= 1 && reviewRating(review) <= 5;
  }

  function calculate(book, reviews) {
    const bookId = idOf(book?.id ?? book?.bookId ?? book?.book_id);
    const slug = idOf(book?.slug);
    const title = idOf(book?.title).toLowerCase();
    const matched = (Array.isArray(reviews) ? reviews : []).filter(review => {
      if (!isUsableReview(review)) return false;
      const rid = reviewBookId(review);
      if (rid && bookId && rid === bookId) return true;
      if (rid && slug && rid === slug) return true;
      const reviewSlug = idOf(review?.bookSlug ?? review?.book_slug).toLowerCase();
      if (reviewSlug && slug && reviewSlug === slug.toLowerCase()) return true;
      const reviewTitle = idOf(review?.bookTitle ?? review?.book_title ?? review?.title).toLowerCase();
      return !!title && !!reviewTitle && reviewTitle === title;
    });

    if (matched.length) {
      const total = matched.reduce((sum, review) => sum + reviewRating(review), 0);
      return { rating: total / matched.length, count: matched.length };
    }

    const fallbackRating = num(book?.rating ?? book?.averageRating ?? book?.average_rating);
    const fallbackCount = num(book?.review_count ?? book?.reviewCount ?? book?.reviews_count ?? book?.reviewsCount);
    return { rating: fallbackRating, count: fallbackCount };
  }

  function stars(rating) {
    if (!rating) return 'No ratings yet';
    const rounded = Math.max(0, Math.min(5, rating));
    const full = Math.floor(rounded);
    const half = rounded - full >= 0.4;
    let out = '';
    for (let i = 0; i < 5; i++) out += i < full ? '★' : (i === full && half ? '★' : '☆');
    return out;
  }

  function findBook(state, card) {
    const id = idOf(card?.dataset?.bookId);
    const slug = idOf(card?.dataset?.bookSlug);
    const books = state?.getApprovedBooks?.() || state?.books || [];
    return books.find(book => idOf(book?.id ?? book?.bookId) === id) ||
      books.find(book => idOf(book?.slug) === slug) ||
      { id, slug };
  }

  function update(state) {
    const cards = document.querySelectorAll('.book-card[data-book-id]');
    if (!cards.length) return;
    cards.forEach(card => {
      const book = findBook(state, card);
      const result = calculate(book, state?.reviews || []);
      const rating = Math.round(result.rating * 10) / 10;
      const ratingNode = card.querySelector('.book-card-rating');
      if (!ratingNode) return;
      ratingNode.innerHTML = `
        <span class="book-rating-stars" aria-label="${rating > 0 ? `${rating.toFixed(1)} out of 5 stars` : 'No ratings yet'}">${stars(rating)}</span>
        <span class="book-rating-value">${rating > 0 ? rating.toFixed(1) : '—'}</span>
        ${result.count > 0 ? `<span class="book-rating-count">(${result.count})</span>` : ''}`;
      ratingNode.dataset.reviewSynced = '1';
    });
  }

  async function start() {
    try {
      const { state } = await import('./state.js');
      const run = () => update(state);
      run();
      state?.subscribe?.(() => setTimeout(run, 0));
      window.addEventListener('hashchange', () => setTimeout(run, 0));
      window.addEventListener('bookora:catalog-updated', () => setTimeout(run, 0));
      window.addEventListener('bookora:firebase-trending-updated', () => setTimeout(run, 0));
      // Cards may be inserted later by route/catalog rendering. This observer
      // only reads/updates rating nodes; it never rebuilds or mutates card DOM.
      const observer = new MutationObserver(() => {
        if (document.querySelector('.book-card[data-book-id] .book-card-rating:not([data-review-synced])')) run();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    } catch (error) {
      console.warn('[Bookora Ratings] sync unavailable:', error?.message || error);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
