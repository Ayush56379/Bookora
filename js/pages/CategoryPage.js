// CategoryPage Component
import { state } from '../state.js';
import { renderBookCard } from '../components/BookCard.js';
import { updateSEO } from '../utils/seo.js';

export function renderCategoryPage(slug) {
  const category = state.getCategoryBySlug(slug) || {
    name: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: 'Explore top publications in this category.',
    count: 0
  };

  updateSEO({
    title: `${category.name} eBooks`,
    description: category.description || `Browse top ${category.name} eBooks on Bookora.`
  });

  const books = state.getApprovedBooks().filter(b => 
    b.category.toLowerCase() === category.name.toLowerCase() ||
    b.category.toLowerCase().replace(/[^a-z0-9]/g, '-') === slug
  );

  return `
    <div class="category-page animate-fade-in" style="background: var(--bg-secondary); min-height: 80vh; padding: 3.5rem 0 5rem 0;">
      <div class="container">
        
        <!-- Category Banner Card -->
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; margin-bottom: 2.5rem; box-shadow: var(--shadow-sm); display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1.5rem;">
          <div style="max-width: 680px;">
            <a href="#/explore" style="font-size: 0.8rem; font-weight: 600; color: var(--accent); margin-bottom: 0.5rem; display: inline-block;">
              ← Back to All Categories
            </a>
            <h1 style="font-family: var(--font-display); font-size: 2.4rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; margin-bottom: 0.5rem;">
              ${category.name}
            </h1>
            <p style="font-size: 1.05rem; color: var(--text-secondary); line-height: 1.6;">
              ${category.description}
            </p>
          </div>

          <div style="text-align: right;">
            <div style="font-size: 2.2rem; font-weight: 800; color: var(--accent); font-family: var(--font-display);">
              ${books.length}
            </div>
            <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">
              Publications Found
            </div>
          </div>
        </div>

        <!-- Books Grid -->
        ${books.length > 0 ? `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem;">
            ${books.map(b => renderBookCard(b)).join('')}
          </div>
        ` : `
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 4rem 2rem; text-align: center;">
            <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">No eBooks in ${category.name} Yet</h3>
            <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.5rem;">Be the first author to publish in this category!</p>
            <a href="#/publish" class="btn btn-primary btn-sm">Publish Your eBook</a>
          </div>
        `}

      </div>
    </div>
  `;
}
