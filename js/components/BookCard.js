// BookCard Component — fast premium marketplace card
import { state } from '../state.js';
import { formatPrice, renderStars } from '../utils/formatters.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

export function getCoverUrl(book) {
  const candidates = [book?.cover_file_id,book?.coverFileId,book?.cover_url,book?.coverUrl,book?.cover_image_url,book?.coverImageUrl,book?.front_cover_url,book?.frontCoverUrl,book?.cover_image,book?.coverImage,book?.front_cover,book?.frontCover,book?.cover,book?.thumbnail,book?.image_url,book?.image,book?.thumbnail_url];
  const value = candidates.find(v => typeof v === 'string' && v.trim());
  if (!value) return '';
  const raw = value.trim();
  if (/^[a-zA-Z0-9_-]{20,}$/.test(raw)) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(raw)}&sz=w1600`;
  const idMatch = raw.match(/[?&]id=([a-zA-Z0-9_-]{10,})/i) || raw.match(/\/d\/([a-zA-Z0-9_-]{10,})/i);
  if (/drive\.google\.com/i.test(raw) && idMatch?.[1]) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(idMatch[1])}&sz=w1600`;
  if (/^(https?:\/\/|data:image\/|blob:)/i.test(raw)) return raw;
  return '';
}

function ratingMarkup(book) {
  const rating = Number(book?.rating || 0);
  const count = Number(book?.review_count ?? book?.reviewCount ?? book?.reviews_count ?? 0);
  return `<span class="book-rating-stars" data-book-rating-stars aria-label="${rating > 0 ? `${rating.toFixed(1)} out of 5 stars` : 'No ratings yet'}">${renderStars(rating)}</span><span class="book-rating-value" data-book-rating-value>${rating > 0 ? rating.toFixed(1) : '—'}</span><span class="book-rating-count" data-book-rating-count>${count > 0 ? `(${count})` : ''}</span>`;
}

export function renderBookCard(book) {
  if (!book) return '';
  const id = String(book.id ?? '');
  const isWish = state.isInWishlist(id) || state.isInWishlist(book.id);
  const isInternal = String(book.source_type || book.sourceType || 'internal').toLowerCase() === 'internal';
  const hasPurchased = state.hasPurchased(id) || state.hasPurchased(book.id);
  const coverUrl = getCoverUrl(book);
  const title = escapeHtml(book.title || 'Untitled Book');
  const author = escapeHtml(book.author || book.seller_name || 'Unknown Author');
  const category = escapeHtml(book.category || 'eBook');
  const subtitle = escapeHtml(book.subtitle || '');
  const format = escapeHtml(book.format || 'PDF');
  const fallbackGradient = book.cover_gradient || 'linear-gradient(145deg,#172554 0%,#2563EB 55%,#60A5FA 100%)';
  const detailHref = `#/book/${encodeURIComponent(book.slug || id)}`;
  const sourceCurrency = String(book.currency || book.currency_code || 'INR').toUpperCase();
  const saleAmount = Number(book.sale_price || book.salePrice || book.price || 0);
  const originalAmount = Number(book.price || 0);
  return `
    <article class="book-card book-card-premium animate-fade-in" data-book-id="${escapeHtml(id)}" tabindex="0" role="link" aria-label="Open ${title}">
      <div class="book-cover-container book-cover-premium" style="background:${fallbackGradient};">
        ${coverUrl ? `<img class="book-cover-image" src="${escapeHtml(coverUrl)}" alt="Cover of ${title}" loading="lazy" decoding="async" fetchpriority="auto" onerror="this.style.display='none';this.parentElement.classList.add('cover-image-failed');" />` : ''}
        <div class="book-cover-fallback" aria-hidden="true"><span class="book-cover-fallback-category">${category}</span><strong>${title}</strong>${subtitle ? `<small>${subtitle}</small>` : ''}<span class="book-cover-fallback-author">${author}</span></div>
        <div class="book-cover-shade"></div><div class="book-cover-spine"></div>
        <div class="book-cover-content"><div class="book-cover-topline">${category}</div><h4>${title}</h4>${subtitle ? `<p>${subtitle}</p>` : ''}<div class="book-cover-meta"><span>${author}</span><span class="book-format-pill">${format}</span></div></div>
        <button type="button" class="book-wishlist-btn ${isWish ? 'active' : ''}" data-id="${escapeHtml(id)}" title="${isWish ? 'Remove from Wishlist' : 'Add to Wishlist'}" aria-label="${isWish ? 'Remove from Wishlist' : 'Add to Wishlist'}"><svg width="17" height="17" viewBox="0 0 24 24" fill="${isWish ? '#E11D48' : 'none'}" stroke="currentColor" stroke-width="2.2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg></button>
      </div>
      <div class="book-card-info">
        <div class="book-card-meta-row"><span class="badge ${isInternal ? 'badge-bookora' : 'badge-external'}">${isInternal ? 'BOOKORA' : 'EXTERNAL'}</span><span class="book-pages">${book.pages ? `${escapeHtml(book.pages)} pages` : escapeHtml(book.source_domain || 'Web')}</span></div>
        <a href="${detailHref}" class="book-card-title-link"><h3>${title}</h3></a>
        <p class="book-card-author">by <span>${author}</span></p>
        <div class="book-card-rating" data-book-rating="${escapeHtml(id)}">${ratingMarkup(book)}</div>
        <div class="book-card-price-row"><div><div class="book-card-price">${formatPrice(saleAmount, sourceCurrency)}</div>${book.discount > 0 ? `<div class="book-card-old-price">${formatPrice(originalAmount, sourceCurrency)}</div>` : ''}</div>${isInternal ? (hasPurchased ? `<a href="#/library" class="btn btn-secondary btn-sm book-buy-btn">Read</a>` : `<a href="#/checkout/${encodeURIComponent(book.slug || id)}" class="btn btn-primary btn-sm book-buy-btn">Buy Now</a>`) : `<a href="${escapeHtml(book.buy_url || book.source_url || '#')}" target="_blank" rel="noopener noreferrer" class="btn btn-external btn-sm book-buy-btn">View &amp; Buy ↗</a>`}</div>
      </div>
    </article>
  `;
}

function renderLiveRatingStars(value) {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));
  return Array.from({length:5}, (_, index) => `<span aria-hidden="true">${index + 1 <= Math.round(rating) ? '★' : '☆'}</span>`).join('');
}

function applyLiveBookRating(bookId) {
  const key = String(bookId);
  const summary = window.__BOOKORA_REVIEW_SUMMARIES?.[key];
  const count = Number(summary?.count || 0);
  const average = Number(summary?.average || 0);
  document.querySelectorAll(`[data-book-rating="${CSS.escape(key)}"]`).forEach(container => {
    const stars = container.querySelector('[data-book-rating-stars]');
    const value = container.querySelector('[data-book-rating-value]');
    const countEl = container.querySelector('[data-book-rating-count]');
    if (stars) {
      stars.innerHTML = renderLiveRatingStars(average);
      stars.setAttribute('aria-label', count ? `${average.toFixed(1)} out of 5 stars` : 'No ratings yet');
    }
    if (value) value.textContent = count ? average.toFixed(1) : '—';
    if (countEl) countEl.textContent = count ? `(${count})` : '';
    container.classList.toggle('has-live-rating', count > 0);
  });
}

function applyAllLiveRatings() {
  document.querySelectorAll('[data-book-rating]').forEach(container => applyLiveBookRating(container.getAttribute('data-book-rating') || ''));
}

function initGlobalBookRatings() {
  if (window.__BOOKORA_GLOBAL_RATINGS_STARTED) return;
  window.__BOOKORA_GLOBAL_RATINGS_STARTED = true;
  window.__BOOKORA_REVIEW_SUMMARIES = window.__BOOKORA_REVIEW_SUMMARIES || {};

  const start = () => {
    const firebase = window.firebase;
    if (!firebase?.apps?.length || typeof firebase.firestore !== 'function') return false;
    try {
      firebase.firestore().collection('reviews').onSnapshot(snapshot => {
        const grouped = new Map();
        snapshot.docs.forEach(doc => {
          const review = doc.data() || {};
          const key = String(review.book_id ?? review.bookId ?? review.bookID ?? '');
          const rating = Number(review.rating || 0);
          if (!key || rating <= 0) return;
          if (!grouped.has(key)) grouped.set(key, {sum:0,count:0});
          const item = grouped.get(key);
          item.sum += rating;
          item.count += 1;
        });
        window.__BOOKORA_REVIEW_SUMMARIES = {};
        grouped.forEach((item, key) => {
          window.__BOOKORA_REVIEW_SUMMARIES[key] = { average:item.count ? item.sum / item.count : 0, count:item.count };
        });
        applyAllLiveRatings();
        window.dispatchEvent(new CustomEvent('bookora:ratings-updated'));
      }, error => console.warn('[BookCard] global review listener unavailable:', error?.message || error));
      return true;
    } catch (error) {
      console.warn('[BookCard] global review listener setup failed:', error?.message || error);
      return false;
    }
  };

  if (!start()) {
    let attempts = 0;
    const retry = setInterval(() => {
      attempts += 1;
      if (start() || attempts >= 20) clearInterval(retry);
    }, 500);
  }

  const observer = new MutationObserver(() => {
    applyAllLiveRatings();
  });
  observer.observe(document.body, { childList:true, subtree:true });
  window.addEventListener('hashchange', applyAllLiveRatings);
}

function bootLiveRatings() {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initGlobalBookRatings, { once:true });
  else initGlobalBookRatings();
}

bootLiveRatings();

if (!document.getElementById('bookora-book-card-premium-styles')) {
  const style = document.createElement('style'); style.id = 'bookora-book-card-premium-styles'; style.textContent = `.book-card-premium{min-width:0;overflow:hidden;background:#fff;border:1px solid var(--border-subtle);border-radius:16px;box-shadow:0 3px 14px rgba(15,23,42,.06);cursor:pointer;}.book-card-premium:focus-visible{outline:3px solid rgba(37,99,235,.25);outline-offset:3px;}.book-cover-premium{position:relative;width:100%;aspect-ratio:2/3;min-height:0;height:auto;overflow:hidden;background:#172554;}.book-cover-image{position:absolute!important;inset:0;width:100%!important;height:100%!important;max-width:none!important;object-fit:cover!important;object-position:center center!important;z-index:1;display:block;transition:transform .35s ease;image-rendering:auto;}.book-card-premium:hover .book-cover-image{transform:scale(1.015);}.book-cover-fallback{position:absolute;inset:0;z-index:0;padding:1rem;display:flex;flex-direction:column;justify-content:space-between;color:#fff;text-align:left;}.book-cover-fallback-category{font-size:.62rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.9;}.book-cover-fallback strong{font-family:var(--font-display);font-size:1.05rem;line-height:1.25;}.book-cover-fallback small{font-size:.7rem;opacity:.85;line-height:1.3;}.book-cover-fallback-author{font-size:.68rem;font-weight:600;opacity:.9;}.book-cover-image~.book-cover-fallback{display:none;}.book-cover-container.cover-image-failed .book-cover-fallback{display:flex;}.book-cover-container.cover-image-failed .book-cover-content{display:none;}.book-cover-shade{position:absolute;inset:0;z-index:2;background:linear-gradient(to bottom,rgba(2,6,23,.03) 0%,transparent 48%,rgba(2,6,23,.72) 100%);pointer-events:none;}.book-cover-spine{position:absolute;z-index:3;left:0;top:0;bottom:0;width:4px;background:linear-gradient(to right,rgba(0,0,0,.25),rgba(255,255,255,.12),rgba(0,0,0,.12));pointer-events:none;}.book-cover-content{position:absolute;z-index:4;left:.9rem;right:.9rem;bottom:.75rem;color:#fff;pointer-events:none;}.book-cover-topline{font-size:.58rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;opacity:.9;margin-bottom:.25rem;}.book-cover-content h4{font-family:var(--font-display);font-size:.98rem;font-weight:800;line-height:1.22;text-shadow:0 2px 7px rgba(0,0,0,.4);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}.book-cover-content p{font-size:.66rem;opacity:.88;margin-top:.2rem;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;}.book-cover-meta{border-top:1px solid rgba(255,255,255,.25);margin-top:.4rem;padding-top:.35rem;display:flex;align-items:center;justify-content:space-between;gap:.4rem;font-size:.63rem;font-weight:600;}.book-format-pill{background:rgba(255,255,255,.2);padding:2px 6px;border-radius:4px;flex:0 0 auto;}.book-card-premium .book-wishlist-btn{position:absolute;z-index:8;top:.6rem;right:.6rem;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.75);border-radius:50%;background:rgba(255,255,255,.96);color:#334155;box-shadow:0 3px 10px rgba(15,23,42,.14);cursor:pointer;transition:transform .15s ease,background .15s ease,color .15s ease;}.book-card-premium .book-wishlist-btn:hover{transform:scale(1.06);}.book-card-premium .book-wishlist-btn.active{color:#E11D48;}.book-card-info{display:flex;flex-direction:column;min-width:0;padding:.75rem .85rem .75rem;}.book-card-meta-row{display:flex;align-items:center;justify-content:space-between;gap:.4rem;margin-bottom:.35rem;min-width:0;}.book-pages{font-size:.68rem;color:var(--text-muted);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.book-card-title-link{display:block;margin-bottom:.05rem;min-width:0;}.book-card-title-link h3{font-size:.93rem;font-weight:800;color:var(--text-primary);line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.42rem;}.book-card-author{font-size:.74rem;color:var(--text-secondary);margin-bottom:.3rem;}.book-card-author span{font-weight:700;color:var(--text-primary);}.book-card-rating{min-height:1rem;margin-top:auto;margin-bottom:.4rem;display:flex;align-items:center;gap:.28rem;white-space:nowrap;}.book-rating-stars{display:inline-flex;gap:1px;font-size:.82rem;line-height:1;letter-spacing:-.08em;}.book-rating-stars span{display:inline-block;}.book-rating-value{font-size:.7rem;font-weight:800;color:var(--text-primary);}.book-rating-count{font-size:.68rem;color:var(--text-muted);font-weight:600;}.book-card-price-row{border-top:1px solid var(--border-subtle);padding-top:.5rem;display:flex;align-items:center;justify-content:space-between;gap:.5rem;min-width:0;}.book-card-price{font-weight:800;font-size:1rem;color:var(--text-primary);}.book-card-old-price{font-size:.65rem;color:var(--text-muted);text-decoration:line-through;}.book-buy-btn{flex:0 0 auto;font-size:.72rem!important;padding:.38rem .65rem!important;}@media(max-width:700px){.book-cover-premium{aspect-ratio:2/3;}.book-card-info{padding:.7rem .75rem;}}@media(max-width:420px){.book-cover-premium{aspect-ratio:2/3;}}`; document.head.appendChild(style);
}
