// BookCard Component (Real Data Mode)
import { state } from '../state.js';
import { formatPrice, renderStars } from '../utils/formatters.js';

export function renderBookCard(book) {
  if (!book) return '';
  const isWish = state.isInWishlist(book.id);
  const isInternal = book.source_type === 'internal';
  const hasPurchased = state.hasPurchased(book.id);

  return `
    <div class="book-card animate-fade-in" data-book-id="${book.id}">
      
      <!-- Cover Area -->
      <div class="book-cover-container" style="background: ${book.cover_gradient || 'linear-gradient(135deg, #1E3A8A, #3B82F6)'};">
        <div class="book-cover-spine"></div>
        
        <div style="padding: 1.25rem 1rem 1rem 1.5rem; height: 100%; display: flex; flex-direction: column; justify-content: space-between; color: #FFFFFF; position: relative;">
          <div>
            <div style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.85; margin-bottom: 0.4rem;">
              ${book.category}
            </div>
            <h4 style="font-family: var(--font-display); font-weight: 800; font-size: 1.05rem; line-height: 1.3; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
              ${book.title}
            </h4>
            ${book.subtitle ? `<p style="font-size: 0.7rem; opacity: 0.8; margin-top: 0.3rem; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${book.subtitle}</p>` : ''}
          </div>

          <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 0.5rem; display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 0.72rem; font-weight: 600; opacity: 0.9;">${book.author}</span>
            <span style="font-size: 0.65rem; background: rgba(255,255,255,0.2); padding: 1px 6px; border-radius: 4px;">${book.format || 'PDF'}</span>
          </div>
        </div>

        <!-- Wishlist Button -->
        <button class="book-wishlist-btn ${isWish ? 'active' : ''}" data-id="${book.id}" title="${isWish ? 'Remove from Wishlist' : 'Add to Wishlist'}">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="${isWish ? '#E11D48' : 'none'}" stroke="currentColor" stroke-width="2.2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
          </svg>
        </button>

        <!-- Quick Actions Hover Drawer -->
        <div class="book-quick-actions">
          <button class="btn btn-secondary btn-sm quick-preview-btn" data-id="${book.id}" style="flex: 1; font-size: 0.75rem; padding: 0.4rem 0.2rem; background: rgba(255,255,255,0.95); backdrop-filter: blur(4px);">
            Preview
          </button>
          <a href="#/book/${book.slug || book.id}" class="btn btn-primary btn-sm" style="flex: 1; font-size: 0.75rem; padding: 0.4rem 0.2rem;">
            Details →
          </a>
        </div>
      </div>

      <!-- Card Info -->
      <div style="display: flex; flex-direction: column; flex: 1;">
        
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 0.4rem;">
          <span class="badge ${isInternal ? 'badge-bookora' : 'badge-external'}">
            ${isInternal ? 'BOOKORA' : 'EXTERNAL'}
          </span>
          <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">
            ${book.pages ? `${book.pages} pages` : (book.source_domain || 'Web')}
          </span>
        </div>

        <a href="#/book/${book.slug || book.id}" style="display: block; margin-bottom: 0.25rem;">
          <h3 style="font-size: 0.975rem; font-weight: 700; color: var(--text-primary); line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.7rem;">
            ${book.title}
          </h3>
        </a>
        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.6rem;">
          by <span style="font-weight: 600; color: var(--text-primary);">${book.author}</span>
        </p>

        <!-- Rating Stars -->
        <div style="margin-bottom: 0.85rem; margin-top: auto;">
          ${renderStars(book.rating || 0)}
        </div>

        <!-- Price & CTA Bar -->
        <div style="border-top: 1px solid var(--border-subtle); padding-top: 0.75rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
          <div>
            <div style="font-weight: 800; font-size: 1.15rem; color: var(--text-primary);">
              ${formatPrice(book.sale_price || book.price)}
            </div>
            ${book.discount > 0 ? `
              <div style="font-size: 0.72rem; color: var(--text-muted); text-decoration: line-through;">
                ${formatPrice(book.price)}
              </div>
            ` : ''}
          </div>

          ${isInternal ? `
            ${hasPurchased ? `
              <a href="#/library" class="btn btn-secondary btn-sm" style="font-size: 0.8rem;">
                Read
              </a>
            ` : `
              <a href="#/checkout/${book.slug || book.id}" class="btn btn-primary btn-sm" style="font-size: 0.8rem;">
                Buy Now
              </a>
            `}
          ` : `
            <a href="${book.buy_url || book.source_url || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-external btn-sm" style="font-size: 0.8rem;" title="Opens publisher website">
              <span>View & Buy ↗</span>
            </a>
          `}
        </div>

      </div>
    </div>
  `;
}
