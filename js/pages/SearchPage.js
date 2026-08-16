// SearchPage Component
import { state } from '../state.js';
import { renderBookCard } from '../components/BookCard.js';
import { updateSEO } from '../utils/seo.js';

export function renderSearchPage(query) {
  const q = (query || '').trim();

  updateSEO({
    title: `Search: "${q}"`,
    description: `Search results for "${q}" on Bookora.`
  });

  const books = state.getApprovedBooks().filter(b => {
    if (!q) return true;
    const lower = q.toLowerCase();
    return b.title.toLowerCase().includes(lower) ||
           b.author.toLowerCase().includes(lower) ||
           b.category.toLowerCase().includes(lower) ||
           b.description.toLowerCase().includes(lower) ||
           (b.tags && b.tags.some(t => t.toLowerCase().includes(lower)));
  });

  return `
    <div class="search-page animate-fade-in" style="background: var(--bg-secondary); min-height: 80vh; padding: 3rem 0 5rem 0;">
      <div class="container">
        
        <div style="margin-bottom: 2.5rem;">
          <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">Search Results</div>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em;">
            Results for "${q}"
          </h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
            Found ${books.length} matching publication${books.length === 1 ? '' : 's'}.
          </p>
        </div>

        ${books.length > 0 ? `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem;">
            ${books.map(b => renderBookCard(b)).join('')}
          </div>
        ` : `
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 4rem 2rem; text-align: center; max-width: 600px; margin: 0 auto;">
            <div style="width: 64px; height: 64px; margin: 0 auto 1.25rem auto; border-radius: var(--radius-full); background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center; color: var(--text-muted);">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <h3 style="font-size: 1.3rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">No eBooks Found</h3>
            <p style="font-size: 0.925rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.75rem;">
              We couldn't find any books matching "<strong>${q}</strong>". Try checking for spelling errors or browse our featured categories.
            </p>
            <div style="display: flex; justify-content: center; gap: 0.75rem;">
              <a href="#/explore" class="btn btn-primary btn-sm">Explore All eBooks</a>
              <a href="#/" class="btn btn-secondary btn-sm">Back to Home</a>
            </div>
          </div>
        `}

      </div>
    </div>
  `;
}
