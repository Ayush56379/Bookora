// BookCard Component (Real Data Mode)
import { state } from '../state.js';
import { formatPrice, renderStars } from '../utils/formatters.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getCoverUrl(book) {
  const candidates = [
    book.cover_url,
    book.cover_image_url,
    book.coverImageUrl,
    book.front_cover_url,
    book.frontCoverUrl,
    book.cover_image,
    book.coverImage,
    book.front_cover,
    book.frontCover,
    book.cover,
    book.thumbnail,
    book.image_url,
    book.image,
    book.thumbnail_url
  ];

  const value = candidates.find(v => typeof v === 'string' && v.trim());
  if (!value) return '';

  const url = value.trim();

  // Already a usable browser URL/data URI.
  if (/^(https?:\/\/|data:image\/|blob:)/i.test(url)) return url;

  // Google Drive file ID support for older uploaded records.
  if (/^[a-zA-Z0-9_-]{20,}$/.test(url)) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(url)}&sz=w1000`;
  }

  return url;
}

export function renderBookCard(book) {
  if (!book) return '';
  const isWish = state.isInWishlist(book.id);
  const isInternal = book.source_type === 'internal';
  const hasPurchased = state.hasPurchased(book.id);
  const coverUrl = getCoverUrl(book);
  const title = escapeHtml(book.title || 'Untitled Book');
  const author = escapeHtml(book.author || 'Unknown Author');
  const category = escapeHtml(book.category || 'eBook');
  const subtitle = escapeHtml(book.subtitle || '');
  const format = escapeHtml(book.format || 'PDF');
  const fallbackGradient = book.cover_gradient || 'linear-gradient(145deg, #172554 0%, #2563EB 55%, #60A5FA 100%)';

  return `
    <article class="book-card book-card-premium animate-fade-in" data-book-id="${escapeHtml(book.id)}">
      
      <!-- Real Cover -->
      <div class="book-cover-container book-cover-premium" style="background:${fallbackGradient};">
        ${coverUrl ? `
          <img
            class="book-cover-image"
            src="${escapeHtml(coverUrl)}"
            alt="Cover of ${title}"
            loading="lazy"
            decoding="async"
            onerror="this.style.display='none';this.parentElement.classList.add('cover-image-failed');"
          />
        ` : ''}

        <div class="book-cover-fallback" aria-hidden="true">
          <span class="book-cover-fallback-category">${category}</span>
          <strong>${title}</strong>
          ${subtitle ? `<small>${subtitle}</small>` : ''}
          <span class="book-cover-fallback-author">${author}</span>
        </div>

        <div class="book-cover-shade"></div>
        <div class="book-cover-spine"></div>

        <div class="book-cover-content">
          <div class="book-cover-topline">${category}</div>
          <h4>${title}</h4>
          ${subtitle ? `<p>${subtitle}</p>` : ''}
          <div class="book-cover-meta">
            <span>${author}</span>
            <span class="book-format-pill">${format}</span>
          </div>
        </div>

        <button class="book-wishlist-btn ${isWish ? 'active' : ''}" data-id="${escapeHtml(book.id)}" title="${isWish ? 'Remove from Wishlist' : 'Add to Wishlist'}" aria-label="${isWish ? 'Remove from Wishlist' : 'Add to Wishlist'}">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="${isWish ? '#E11D48' : 'none'}" stroke="currentColor" stroke-width="2.2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
        </button>

        <div class="book-quick-actions">
          <button class="btn btn-secondary btn-sm quick-preview-btn" data-id="${escapeHtml(book.id)}">Preview</button>
          <a href="#/book/${encodeURIComponent(book.slug || book.id)}" class="btn btn-primary btn-sm">Details →</a>
        </div>
      </div>

      <!-- Card Info -->
      <div class="book-card-info">
        <div class="book-card-meta-row">
          <span class="badge ${isInternal ? 'badge-bookora' : 'badge-external'}">
            ${isInternal ? 'BOOKORA' : 'EXTERNAL'}
          </span>
          <span class="book-pages">${book.pages ? `${escapeHtml(book.pages)} pages` : (escapeHtml(book.source_domain || 'Web'))}</span>
        </div>

        <a href="#/book/${encodeURIComponent(book.slug || book.id)}" class="book-card-title-link">
          <h3>${title}</h3>
        </a>
        <p class="book-card-author">by <span>${author}</span></p>

        <div class="book-card-rating">
          ${renderStars(book.rating || 0)}
        </div>

        <div class="book-card-price-row">
          <div>
            <div class="book-card-price">${formatPrice(book.sale_price || book.price)}</div>
            ${book.discount > 0 ? `<div class="book-card-old-price">${formatPrice(book.price)}</div>` : ''}
          </div>

          ${isInternal ? `
            ${hasPurchased ? `
              <a href="#/library" class="btn btn-secondary btn-sm book-buy-btn">Read</a>
            ` : `
              <a href="#/checkout/${encodeURIComponent(book.slug || book.id)}" class="btn btn-primary btn-sm book-buy-btn">Buy Now</a>
            `}
          ` : `
            <a href="${escapeHtml(book.buy_url || book.source_url || '#')}" target="_blank" rel="noopener noreferrer" class="btn btn-external btn-sm book-buy-btn" title="Opens publisher website">
              <span>View & Buy ↗</span>
            </a>
          `}
        </div>
      </div>
    </article>
  `;
}

// Component-level styles are injected once so the card stays correct even
// when it is rendered on pages that use different catalog layouts.
if (!document.getElementById('bookora-book-card-premium-styles')) {
  const style = document.createElement('style');
  style.id = 'bookora-book-card-premium-styles';
  style.textContent = `
    .book-card-premium{min-width:0;overflow:hidden;background:#fff;border:1px solid var(--border-subtle);border-radius:18px;box-shadow:0 4px 18px rgba(15,23,42,.055);}
    .book-cover-premium{position:relative;width:100%;aspect-ratio:2/3;min-height:0;overflow:hidden;background:#172554;}
    .book-cover-image{position:absolute!important;inset:0;width:100%!important;height:100%!important;max-width:none!important;object-fit:cover!important;object-position:center!important;z-index:1;display:block;transition:transform .45s ease;}
    .book-card-premium:hover .book-cover-image{transform:scale(1.025);}
    .book-cover-fallback{position:absolute;inset:0;z-index:0;padding:1.2rem;display:flex;flex-direction:column;justify-content:space-between;color:#fff;text-align:left;}
    .book-cover-fallback-category{font-size:.68rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase;opacity:.9;}
    .book-cover-fallback strong{font-family:var(--font-display);font-size:1.2rem;line-height:1.25;}
    .book-cover-fallback small{font-size:.72rem;opacity:.85;line-height:1.35;}
    .book-cover-fallback-author{font-size:.72rem;font-weight:600;opacity:.9;}
    .book-cover-image~.book-cover-fallback{display:none;}
    .book-cover-container.cover-image-failed .book-cover-fallback{display:flex;}
    .book-cover-container.cover-image-failed .book-cover-content{display:none;}
    .book-cover-shade{position:absolute;inset:0;z-index:2;background:linear-gradient(to bottom,rgba(2,6,23,.12) 0%,transparent 35%,rgba(2,6,23,.7) 100%);pointer-events:none;}
    .book-cover-spine{position:absolute;z-index:3;left:0;top:0;bottom:0;width:5px;background:linear-gradient(to right,rgba(0,0,0,.25),rgba(255,255,255,.12),rgba(0,0,0,.12));pointer-events:none;}
    .book-cover-content{position:absolute;z-index:4;left:1rem;right:1rem;bottom:.9rem;color:#fff;pointer-events:none;}
    .book-cover-topline{font-size:.62rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.9;margin-bottom:.3rem;}
    .book-cover-content h4{font-family:var(--font-display);font-size:1.05rem;font-weight:800;line-height:1.25;text-shadow:0 2px 8px rgba(0,0,0,.35);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
    .book-cover-content p{font-size:.7rem;opacity:.88;margin-top:.25rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
    .book-cover-meta{border-top:1px solid rgba(255,255,255,.25);margin-top:.55rem;padding-top:.45rem;display:flex;align-items:center;justify-content:space-between;gap:.5rem;font-size:.68rem;font-weight:600;}
    .book-format-pill{background:rgba(255,255,255,.18);padding:2px 7px;border-radius:5px;flex:0 0 auto;}
    .book-card-premium .book-wishlist-btn{position:absolute;z-index:8;top:.7rem;right:.7rem;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.55);border-radius:50%;background:rgba(255,255,255,.92);color:#334155;box-shadow:0 4px 12px rgba(15,23,42,.15);backdrop-filter:blur(6px);cursor:pointer;}
    .book-card-premium .book-wishlist-btn.active{color:#E11D48;}
    .book-card-premium .book-quick-actions{position:absolute;z-index:7;left:.7rem;right:.7rem;bottom:.7rem;display:flex;gap:.5rem;opacity:0;transform:translateY(8px);transition:all .25s ease;}
    .book-card-premium:hover .book-quick-actions,.book-card-premium:focus-within .book-quick-actions{opacity:1;transform:translateY(0);}
    .book-card-premium .book-quick-actions .btn{flex:1;min-width:0;box-shadow:0 5px 16px rgba(15,23,42,.16);}
    .book-card-info{display:flex;flex-direction:column;flex:1;min-width:0;padding:1rem 1rem .95rem;}
    .book-card-meta-row{display:flex;align-items:center;justify-content:space-between;gap:.5rem;margin-bottom:.55rem;min-width:0;}
    .book-pages{font-size:.72rem;color:var(--text-muted);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .book-card-title-link{display:block;margin-bottom:.2rem;min-width:0;}
    .book-card-title-link h3{font-size:1rem;font-weight:800;color:var(--text-primary);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.7rem;}
    .book-card-author{font-size:.8rem;color:var(--text-secondary);margin-bottom:.55rem;}
    .book-card-author span{font-weight:700;color:var(--text-primary);}
    .book-card-rating{min-height:1.25rem;margin-top:auto;margin-bottom:.7rem;display:flex;align-items:center;}
    .book-card-price-row{border-top:1px solid var(--border-subtle);padding-top:.75rem;display:flex;align-items:center;justify-content:space-between;gap:.65rem;min-width:0;}
    .book-card-price{font-weight:800;font-size:1.12rem;color:var(--text-primary);}
    .book-card-old-price{font-size:.7rem;color:var(--text-muted);text-decoration:line-through;}
    .book-buy-btn{flex:0 0 auto;}
    @media(max-width:700px){
      .book-cover-premium{aspect-ratio:2/3;}
      .book-card-info{padding:.85rem .85rem .9rem;}
      .book-cover-content{left:.85rem;right:.85rem;bottom:.8rem;}
      .book-cover-content h4{font-size:.98rem;}
      .book-card-premium .book-quick-actions{opacity:1;transform:none;}
      .book-card-premium .book-quick-actions .btn{font-size:.72rem;padding:.4rem .5rem;}
    }
  `;
  document.head.appendChild(style);
}
