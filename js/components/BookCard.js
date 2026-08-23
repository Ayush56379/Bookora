// BookCard Component — fast premium marketplace card
import { state } from '../state.js';
import { formatPrice, renderStars } from '../utils/formatters.js';

const esc = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

export function getCoverUrl(book) {
  const candidates = [book?.cover_file_id,book?.coverFileId,book?.cover_url,book?.coverUrl,book?.cover_image_url,book?.coverImageUrl,book?.front_cover_url,book?.frontCoverUrl,book?.cover_image,book?.coverImage,book?.front_cover,book?.frontCover,book?.cover,book?.thumbnail,book?.image_url,book?.image,book?.thumbnail_url];
  const value = candidates.find(v => typeof v === 'string' && v.trim());
  if (!value) return '';
  const raw = value.trim();
  if (/^[a-zA-Z0-9_-]{20,}$/.test(raw)) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(raw)}&sz=w1600`;
  const idMatch = raw.match(/[?&]id=([a-zA-Z0-9_-]{10,})/i) || raw.match(/\/d\/([a-zA-Z0-9_-]{10,})/i);
  if (/drive\.google\.com/i.test(raw) && idMatch?.[1]) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(idMatch[1])}&sz=w1600`;
  return /^(https?:\/\/|data:image\/|blob:)/i.test(raw) ? raw : '';
}

function ratingMarkup(book) {
  const rating = Number(book?.rating || 0);
  const count = Number(book?.review_count ?? book?.reviewCount ?? book?.reviews_count ?? 0);
  return `<span class="book-rating-stars" aria-label="${rating > 0 ? `${rating.toFixed(1)} out of 5 stars` : 'No ratings yet'}">${renderStars(rating)}</span><span class="book-rating-value">${rating > 0 ? rating.toFixed(1) : '—'}</span><span class="book-rating-count">${count > 0 ? `(${count})` : ''}</span>`;
}

export function renderBookCard(book) {
  if (!book) return '';
  const id = String(book.id ?? '');
  const internal = String(book.source_type || book.sourceType || 'internal').toLowerCase() === 'internal';
  const wish = state.isInWishlist(id);
  const purchased = state.hasPurchased(id);
  const cover = getCoverUrl(book);
  const title = esc(book.title || 'Untitled Book');
  const author = esc(book.author || book.seller_name || 'Unknown Author');
  const category = esc(book.category || 'eBook');
  const subtitle = esc(book.subtitle || '');
  const format = esc(book.format || 'PDF');
  const slug = encodeURIComponent(book.slug || id);
  const currency = String(book.currency || book.currency_code || 'INR').toUpperCase();
  const sale = Number(book.sale_price || book.salePrice || book.price || 0);
  const original = Number(book.price || 0);
  const gradient = book.cover_gradient || 'linear-gradient(145deg,#172554 0%,#2563EB 55%,#60A5FA 100%)';
  return `<article class="book-card book-card-premium animate-fade-in" data-book-id="${esc(id)}" tabindex="0" role="link" aria-label="Open ${title}">
    <div class="book-cover-container book-cover-premium" style="background:${gradient}">
      ${cover ? `<img class="book-cover-image" src="${esc(cover)}" alt="Cover of ${title}" loading="lazy" decoding="async" onerror="this.style.display='none';this.parentElement.classList.add('cover-image-failed')">` : ''}
      <div class="book-cover-fallback"><span>${category}</span><strong>${title}</strong>${subtitle ? `<small>${subtitle}</small>` : ''}<small>${author}</small></div>
      <div class="book-cover-shade"></div><div class="book-cover-spine"></div>
      <div class="book-cover-content"><div class="book-cover-topline">${category}</div><h4>${title}</h4>${subtitle ? `<p>${subtitle}</p>` : ''}<div class="book-cover-meta"><span>${author}</span><span class="book-format-pill">${format}</span></div></div>
      <button type="button" class="book-wishlist-btn ${wish ? 'active' : ''}" data-id="${esc(id)}" aria-label="${wish ? 'Remove from Wishlist' : 'Add to Wishlist'}">${wish ? '♥' : '♡'}</button>
    </div>
    <div class="book-card-info">
      <div class="book-card-meta-row"><span class="badge ${internal ? 'badge-bookora' : 'badge-external'}">${internal ? 'BOOKORA' : 'EXTERNAL'}</span><span class="book-pages">${book.pages ? `${esc(book.pages)} pages` : esc(book.source_domain || 'Web')}</span></div>
      <a href="#/book/${slug}" class="book-card-title-link"><h3>${title}</h3></a>
      <p class="book-card-author">by <span>${author}</span></p>
      <div class="book-card-rating">${ratingMarkup(book)}</div>
      <div class="book-card-price-row"><div><div class="book-card-price">${formatPrice(sale,currency)}</div>${book.discount > 0 ? `<div class="book-card-old-price">${formatPrice(original,currency)}</div>` : ''}</div>${internal ? (purchased ? `<a href="#/library" class="btn btn-secondary btn-sm book-buy-btn">Read</a>` : `<a href="#/checkout/${slug}" class="btn btn-primary btn-sm book-buy-btn">Buy Now</a>`) : `<a href="${esc(book.buy_url || book.source_url || '#')}" target="_blank" rel="noopener noreferrer" class="btn btn-external btn-sm book-buy-btn">View &amp; Buy ↗</a>`}</div>
    </div>
  </article>`;
}

// Ratings are rendered from the book catalog fields. Reviews are loaded only by pages that need them;
// never attach a global real-time listener to the entire reviews collection from every book card.

if (!document.getElementById('bookora-book-card-premium-styles')) {
  const style = document.createElement('style');
  style.id = 'bookora-book-card-premium-styles';
  style.textContent = `.book-card-premium{min-width:0;overflow:hidden;background:#fff;border:1px solid var(--border-subtle);border-radius:16px;box-shadow:0 3px 14px rgba(15,23,42,.06);cursor:pointer}.book-card-premium:focus-visible{outline:3px solid rgba(37,99,235,.25);outline-offset:3px}.book-cover-premium{position:relative;width:100%;aspect-ratio:2/3;overflow:hidden;background:#172554}.book-cover-image{position:absolute!important;inset:0;width:100%!important;height:100%!important;object-fit:cover!important;z-index:1;display:block;transition:transform .35s ease}.book-card-premium:hover .book-cover-image{transform:scale(1.015)}.book-cover-fallback{position:absolute;inset:0;z-index:0;padding:1rem;display:flex;flex-direction:column;justify-content:space-between;color:#fff}.book-cover-fallback strong{font-family:var(--font-display);font-size:1.05rem;line-height:1.25}.book-cover-fallback span,.book-cover-fallback small{font-size:.68rem;opacity:.9}.book-cover-image~.book-cover-fallback{display:none}.book-cover-container.cover-image-failed .book-cover-fallback{display:flex}.book-cover-shade{position:absolute;inset:0;z-index:2;background:linear-gradient(to bottom,rgba(2,6,23,.03),transparent 48%,rgba(2,6,23,.72));pointer-events:none}.book-cover-spine{position:absolute;z-index:3;left:0;top:0;bottom:0;width:4px;background:rgba(255,255,255,.12)}.book-cover-content{position:absolute;z-index:4;left:.9rem;right:.9rem;bottom:.75rem;color:#fff;pointer-events:none}.book-cover-topline{font-size:.58rem;font-weight:800;text-transform:uppercase;opacity:.9}.book-cover-content h4{font-family:var(--font-display);font-size:.98rem;font-weight:800;line-height:1.22;text-shadow:0 2px 7px rgba(0,0,0,.4);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.book-cover-content p{font-size:.66rem;opacity:.88}.book-cover-meta{border-top:1px solid rgba(255,255,255,.25);margin-top:.4rem;padding-top:.35rem;display:flex;justify-content:space-between;gap:.4rem;font-size:.63rem;font-weight:600}.book-format-pill{background:rgba(255,255,255,.2);padding:2px 6px;border-radius:4px}.book-card-premium .book-wishlist-btn{position:absolute;z-index:8;top:.6rem;right:.6rem;width:36px;height:36px;border:1px solid rgba(255,255,255,.75);border-radius:50%;background:rgba(255,255,255,.96);color:#334155;box-shadow:0 3px 10px rgba(15,23,42,.14);cursor:pointer}.book-card-premium .book-wishlist-btn.active{color:#E11D48}.book-card-info{display:flex;flex-direction:column;min-width:0;padding:.75rem .85rem}.book-card-meta-row{display:flex;align-items:center;justify-content:space-between;gap:.4rem;margin-bottom:.35rem}.book-pages{font-size:.68rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.book-card-title-link{display:block;min-width:0}.book-card-title-link h3{font-size:.93rem;font-weight:800;color:var(--text-primary);line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.42rem}.book-card-author{font-size:.74rem;color:var(--text-secondary);margin-bottom:.3rem}.book-card-author span{font-weight:700;color:var(--text-primary)}.book-card-rating{min-height:1rem;margin-top:auto;margin-bottom:.4rem;display:flex;align-items:center;gap:.28rem}.book-rating-stars{display:inline-flex;gap:1px;font-size:.82rem}.book-rating-value{font-size:.7rem;font-weight:800}.book-rating-count{font-size:.68rem;color:var(--text-muted)}.book-card-price-row{border-top:1px solid var(--border-subtle);padding-top:.5rem;display:flex;align-items:center;justify-content:space-between;gap:.5rem}.book-card-price{font-weight:800;font-size:1rem}.book-card-old-price{font-size:.65rem;color:var(--text-muted);text-decoration:line-through}.book-buy-btn{flex:0 0 auto;font-size:.72rem!important;padding:.38rem .65rem!important}@media(max-width:700px){.book-card-info{padding:.7rem .75rem}}`;
  document.head.appendChild(style);
}
