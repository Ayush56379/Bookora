// WishlistPage Component
import { state } from '../state.js';
import { renderBookCard } from '../components/BookCard.js';
import { updateSEO } from '../utils/seo.js';

export function renderWishlistPage() {
  updateSEO({
    title: 'Saved eBooks Wishlist',
    description: 'Your saved favorite eBooks on Bookora.'
  });

  const wishIds = Array.from(state.wishlist);
  const books = state.books.filter(b => wishIds.includes(b.id));

  return `
    <div class="wishlist-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem;">
          <div>
            <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">Saved Items</div>
            <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
              Your Wishlist (${books.length})
            </h1>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
              Publications you've bookmarked to read or purchase later.
            </p>
          </div>
          <a href="#/explore" class="btn btn-secondary btn-sm">
            Continue Browsing
          </a>
        </div>

        ${books.length > 0 ? `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem;">
            ${books.map(b => renderBookCard(b)).join('')}
          </div>
        ` : `
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 5rem 2rem; text-align: center; max-width: 540px; margin: 0 auto;">
            <div style="width: 64px; height: 64px; border-radius: 99px; background: #FFF1F2; color: #E11D48; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
            </div>
            <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">Your Wishlist is Empty</h3>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 2rem;">
              Click the heart icon on any publication to save it here for quick access later!
            </p>
            <a href="#/explore" class="btn btn-primary btn-lg">Explore Popular Titles</a>
          </div>
        `}

      </div>
    </div>
  `;
}
