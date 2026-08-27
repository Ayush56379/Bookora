// Bookora Explore — stable catalog refresh + rating filter/UI bridge.
(() => {
  'use strict';
  if (window.__BOOKORA_EXPLORE_STABLE_REFRESH_V5__) return;
  window.__BOOKORA_EXPLORE_STABLE_REFRESH_V5__ = true;

  const page = () => document.querySelector('.explore-page');

  const numericRating = book => {
    const values = [book?.rating, book?.averageRating, book?.average_rating, book?.avgRating, book?.ratingValue, book?.reviewRating, book?.review_rating];
    for (const value of values) {
      if (value === null || value === undefined || value === '') continue;
      const n = Number(String(value).replace(/[^0-9.\-]/g, ''));
      if (Number.isFinite(n)) return Math.max(0, Math.min(5, n));
    }
    return 0;
  };

  const normalizeCatalogRatings = () => {
    try {
      const current = window.BookoraState || window.state;
      const books = typeof current?.getApprovedBooks === 'function' ? current.getApprovedBooks() : [];
      if (!Array.isArray(books)) return;
      books.forEach(book => {
        const rating = numericRating(book);
        if (rating > 0 || book.rating === undefined || book.rating === null) book.rating = rating;
        if (book.review_count === undefined && book.reviewCount !== undefined) book.review_count = Number(book.reviewCount) || 0;
      });
    } catch (error) {
      console.warn('[Bookora ratings] normalization skipped:', error?.message || error);
    }
  };

  const styleRatingFilter = () => {
    const p = page();
    if (!p) return;
    if (!document.getElementById('bookora-explore-rating-ui-v5')) {
      const style = document.createElement('style');
      style.id = 'bookora-explore-rating-ui-v5';
      style.textContent = `
        .explore-page .filter-rating-row{display:grid!important;grid-template-columns:20px minmax(0,1fr)!important;align-items:center!important;gap:8px!important;min-height:42px!important;padding:7px 8px!important;border:1px solid transparent!important;border-radius:10px!important;color:#334155!important;font-size:12px!important;font-weight:650!important;line-height:1.2!important;transition:background .15s ease,border-color .15s ease!important}
        .explore-page .filter-rating-row:hover{background:#faf5ff!important;border-color:#ede9fe!important}
        .explore-page .filter-rating-row input{width:16px!important;height:16px!important;margin:0!important;accent-color:#7c3aed!important}
        .explore-page .filter-rating-row>span{min-width:0!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
        .explore-page .filter-rating-row .rating-option-content{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;width:100%!important}
        .explore-page .filter-rating-row .rating-stars-text{color:#f59e0b!important;letter-spacing:1px!important;font-size:12px!important;flex:0 0 auto!important}
        .explore-page .filter-rating-row .rating-threshold{color:#475569!important;font-weight:700!important;white-space:nowrap!important}
        .explore-page .filter-rating-row .rating-all-label{color:#475569!important;font-weight:700!important}
        .explore-page .book-card-rating{display:flex!important;align-items:center!important;min-height:22px!important;gap:5px!important;padding:2px 0!important}
        .explore-page .book-card-rating .book-rating-stars{display:inline-flex!important;align-items:center!important;gap:1px!important;line-height:1!important}
        .explore-page .book-card-rating .book-rating-stars svg{width:14px!important;height:14px!important;display:block!important}
        .explore-page .book-card-rating .book-rating-value{font-size:12px!important;font-weight:800!important;color:#334155!important}
        .explore-page .book-card-rating .book-rating-count{font-size:11px!important;color:#64748b!important}
        @media(max-width:900px){.explore-page .filter-rating-row{min-height:40px!important;padding:6px!important}}
      `;
      document.head.appendChild(style);
    }

    p.querySelectorAll('.filter-rating-row').forEach(row => {
      const input = row.querySelector('input[name="filter-rating"]');
      if (!input || row.dataset.ratingUiVersion === '5') return;
      const value = Number(input.value || 0);
      let content = row.querySelector('.rating-option-content');
      if (!content) {
        const old = row.querySelector(':scope > span');
        content = document.createElement('span');
        content.className = 'rating-option-content';
        row.appendChild(content);
        old?.remove();
      }
      if (value === 0) content.innerHTML = '<span class="rating-all-label">All ratings</span>';
      else {
        const stars = value >= 4.5 ? '★★★★★' : value >= 4 ? '★★★★☆' : '★★★☆☆';
        content.innerHTML = `<span class="rating-stars-text">${stars}</span><span class="rating-threshold">${value.toFixed(1)} &amp; up</span>`;
      }
      row.dataset.ratingUiVersion = '5';
    });
  };

  const refreshFromCatalog = () => {
    normalizeCatalogRatings();
    const p = page();
    if (!p) return;
    styleRatingFilter();
    const sort = p.querySelector('#catalog-sort-select');
    if (sort) sort.dispatchEvent(new Event('change', { bubbles: true }));
    setTimeout(styleRatingFilter, 0);
  };

  window.addEventListener('bookora:catalog-updated', () => requestAnimationFrame(refreshFromCatalog), { passive: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(refreshFromCatalog, 0), { once: true });
  else setTimeout(refreshFromCatalog, 0);

  const observer = new MutationObserver(() => {
    const p = page();
    if (p?.querySelector('#explore-books-grid')) styleRatingFilter();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  import('./public-category-data-runtime-fix.js?v=20260826-3').catch(error => console.warn('[Bookora categories] runtime load failed:', error?.message || error));
})();
