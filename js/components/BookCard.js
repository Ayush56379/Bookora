// BookCard Component — Amazon/KDP-style responsive marketplace card
import { state } from '../state.js';
import { formatPrice, renderStars } from '../utils/formatters.js';

const esc = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

export function getCoverUrl(book) {
  const candidates = [book?.cover_file_id,book?.coverFileId,book?.cover_url,book?.coverUrl,book?.cover_image_url,book?.coverImageUrl,book?.front_cover_url,book?.frontCoverUrl,book?.cover_image,book?.coverImage,book?.front_cover,book?.frontCover,book?.cover,book?.thumbnail,book?.image_url,book?.image,book?.thumbnail_url];
  const value = candidates.find(v => typeof v === 'string' && v.trim());
  if (!value) return '';
  const raw = value.trim();
  if (/^[a-zA-Z0-9_-]{20,}$/.test(raw)) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(raw)}&sz=w600`;
  const idMatch = raw.match(/[?&]id=([a-zA-Z0-9_-]{10,})/i) || raw.match(/\/d\/([a-zA-Z0-9_-]{10,})/i);
  if (/drive\.google\.com/i.test(raw) && idMatch?.[1]) return `https://drive.google.com/thumbnail?id=${encodeURIComponent(idMatch[1])}&sz=w600`;
  return /^(https?:\/\/|data:image\/|blob:)/i.test(raw) ? raw : '';
}

function ratingMarkup(book) {
  const rating = Number(book?.rating || 0);
  const count = Number(book?.review_count ?? book?.reviewCount ?? book?.reviews_count ?? 0);
  return `<span class="book-rating-stars" aria-label="${rating > 0 ? `${rating.toFixed(1)} out of 5 stars` : 'No ratings yet'}">${renderStars(rating)}</span><span class="book-rating-value">${rating > 0 ? rating.toFixed(1) : '—'}</span>${count > 0 ? `<span class="book-rating-count">(${count})</span>` : ''}`;
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
  const discount = Number(book.discount || 0);
  const gradient = book.cover_gradient || 'linear-gradient(145deg,#172554 0%,#2563EB 55%,#60A5FA 100%)';
  return `<article class="book-card book-card-premium" data-book-id="${esc(id)}" tabindex="0" role="link" aria-label="Open ${title}">
    <div class="book-cover-container book-cover-premium" style="background:${gradient}">
      ${cover ? `<img class="book-cover-image" src="${esc(cover)}" alt="Cover of ${title}" loading="eager" fetchpriority="high" decoding="async" onerror="this.style.display='none';this.parentElement.classList.add('cover-image-failed')">` : ''}
      <div class="book-cover-fallback"><span>${category}</span><strong>${title}</strong>${subtitle ? `<small>${subtitle}</small>` : ''}<small>${author}</small></div>
      <div class="book-cover-shade"></div><div class="book-cover-spine"></div>
      <div class="book-cover-content"><div class="book-cover-topline">${category}</div><h4>${title}</h4>${subtitle ? `<p>${subtitle}</p>` : ''}<div class="book-cover-meta"><span>${author}</span><span class="book-format-pill">${format}</span></div></div>
      <button type="button" class="book-wishlist-btn ${wish ? 'active' : ''}" data-id="${esc(id)}" aria-label="${wish ? 'Remove from Wishlist' : 'Add to Wishlist'}">${wish ? '♥' : '♡'}</button>
    </div>
    <div class="book-card-info">
      <div class="book-card-meta-row"><span class="badge ${internal ? 'badge-bookora' : 'badge-external'}">${internal ? 'BOOKORA' : 'EXTERNAL'}</span><span class="book-pages">${book.pages ? `${esc(book.pages)} pages` : esc(book.source_domain || 'eBook')}</span></div>
      <a href="#/book/${slug}" class="book-card-title-link"><h3>${title}</h3></a>
      <p class="book-card-author">by <span>${author}</span></p>
      <div class="book-card-rating">${ratingMarkup(book)}</div>
      <div class="book-card-price-row"><div><div class="book-card-price">${formatPrice(sale,currency)}</div>${(discount > 0 || original > sale) ? `<div class="book-card-old-price">${formatPrice(original,currency)}</div>` : ''}</div>${internal ? (purchased ? `<a href="#/library" class="btn btn-secondary btn-sm book-buy-btn">Read</a>` : `<a href="#/checkout/${slug}" class="btn btn-primary btn-sm book-buy-btn">Buy Now</a>`) : `<a href="${esc(book.buy_url || book.source_url || '#')}" target="_blank" rel="noopener noreferrer" class="btn btn-external btn-sm book-buy-btn">View &amp; Buy ↗</a>`}</div>
    </div>
  </article>`;
}

if (!document.getElementById('bookora-book-card-premium-styles')) {
  const style = document.createElement('style');
  style.id = 'bookora-book-card-premium-styles';
  style.textContent = `.book-card-premium{width:100%!important;min-width:0!important;max-width:none!important;display:flex!important;flex-direction:column!important;overflow:hidden;background:var(--bg-card,#fff);border:1px solid var(--border-subtle,#e2e8f0);border-radius:14px;box-shadow:0 4px 16px rgba(15,23,42,.07);cursor:pointer;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}.book-card-premium:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(15,23,42,.12);border-color:rgba(37,99,235,.25)}.book-card-premium:focus-visible{outline:3px solid rgba(37,99,235,.25);outline-offset:3px}.book-cover-premium{position:relative;width:100%!important;aspect-ratio:2/3!important;overflow:hidden;background:#172554;flex:none}.book-cover-image{position:absolute!important;inset:0;width:100%!important;height:100%!important;object-fit:cover!important;z-index:1;display:block;background:#e2e8f0;transition:transform .3s ease}.book-card-premium:hover .book-cover-image{transform:scale(1.015)}.book-cover-fallback{position:absolute;inset:0;z-index:0;padding:1rem;display:flex;flex-direction:column;justify-content:space-between;color:#fff}.book-cover-fallback strong{font-family:var(--font-display);font-size:1.08rem;line-height:1.25}.book-cover-fallback span,.book-cover-fallback small{font-size:.68rem;opacity:.9}.book-cover-image~.book-cover-fallback{display:none}.book-cover-container.cover-image-failed .book-cover-fallback{display:flex}.book-cover-shade{position:absolute;inset:0;z-index:2;background:linear-gradient(to bottom,rgba(2,6,23,.02),transparent 45%,rgba(2,6,23,.74));pointer-events:none}.book-cover-spine{position:absolute;z-index:3;left:0;top:0;bottom:0;width:4px;background:rgba(255,255,255,.14)}.book-cover-content{position:absolute;z-index:4;left:.9rem;right:.9rem;bottom:.75rem;color:#fff;pointer-events:none}.book-cover-topline{font-size:.58rem;font-weight:800;text-transform:uppercase;opacity:.9}.book-cover-content h4{font-family:var(--font-display);font-size:1rem;font-weight:800;line-height:1.2;text-shadow:0 2px 7px rgba(0,0,0,.45);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin:.2rem 0}.book-cover-content p{font-size:.66rem;opacity:.88;margin:.2rem 0}.book-cover-meta{border-top:1px solid rgba(255,255,255,.25);margin-top:.4rem;padding-top:.35rem;display:flex;justify-content:space-between;gap:.4rem;font-size:.63rem;font-weight:600}.book-format-pill{background:rgba(255,255,255,.2);padding:2px 6px;border-radius:4px}.book-card-premium .book-wishlist-btn{position:absolute;z-index:8;top:.65rem;right:.65rem;width:36px;height:36px;border:1px solid rgba(255,255,255,.8);border-radius:50%;background:rgba(255,255,255,.96);color:#334155;box-shadow:0 3px 10px rgba(15,23,42,.14);cursor:pointer}.book-card-premium .book-wishlist-btn.active{color:#E11D48}.book-card-info{display:flex!important;flex-direction:column!important;flex:1!important;min-width:0;padding:.8rem .9rem}.book-card-meta-row{display:flex;align-items:center;justify-content:space-between;gap:.4rem;margin-bottom:.38rem}.book-pages{font-size:.68rem;color:var(--text-muted,#64748b);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.book-card-title-link{display:block;min-width:0;text-decoration:none}.book-card-title-link h3{font-size:.98rem;font-weight:800;color:var(--text-primary,#0f172a);line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.55rem;margin:0}.book-card-author{font-size:.75rem;color:var(--text-secondary,#64748b);margin:.25rem 0 .35rem}.book-card-author span{font-weight:700;color:var(--text-primary,#0f172a)}.book-card-rating{min-height:1.05rem;display:flex;align-items:center;gap:.28rem;margin-top:auto;margin-bottom:.42rem}.book-rating-stars{display:inline-flex;gap:1px;font-size:.82rem}.book-rating-value{font-size:.7rem;font-weight:800}.book-rating-count{font-size:.68rem;color:var(--text-muted,#64748b)}.book-card-price-row{border-top:1px solid var(--border-subtle,#e2e8f0);padding-top:.55rem;display:flex;align-items:center;justify-content:space-between;gap:.5rem}.book-card-price{font-weight:850;font-size:1.03rem}.book-card-old-price{font-size:.67rem;color:var(--text-muted,#64748b);text-decoration:line-through}.book-buy-btn{flex:0 0 auto;font-size:.72rem!important;padding:.42rem .7rem!important;white-space:nowrap}@media(max-width:1050px){.book-card-title-link h3{font-size:.92rem}.book-card-info{padding:.72rem}}@media(max-width:700px){.book-card-premium{border-radius:12px}.book-cover-premium{aspect-ratio:2/3!important}.book-card-info{padding:.65rem .7rem}.book-card-meta-row{margin-bottom:.3rem}.book-card-title-link h3{font-size:.86rem;min-height:2.25rem}.book-card-author{font-size:.68rem}.book-card-price{font-size:.92rem}.book-buy-btn{font-size:.66rem!important;padding:.38rem .55rem!important}.book-card-premium .book-wishlist-btn{width:32px;height:32px;top:.5rem;right:.5rem}}`;
  document.head.appendChild(style);
}
