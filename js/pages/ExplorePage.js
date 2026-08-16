// ExplorePage Component
import { state } from '../state.js';
import { renderBookCard } from '../components/BookCard.js';
import { updateSEO } from '../utils/seo.js';
import { renderBookCardSkeleton } from '../components/Skeleton.js';

export function renderExplorePage() {
  updateSEO({
    title: 'Explore All eBooks',
    description: 'Browse, filter, and discover the complete catalog of digital publications on Bookora.'
  });

  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const activeSort = urlParams.get('sort') || 'popular';
  const activeCategory = urlParams.get('category') || '';
  const activeSource = urlParams.get('source') || 'all';

  return `
    <div class="explore-page animate-fade-in" style="background: var(--bg-secondary); min-height: 80vh; padding: 2.5rem 0 5rem 0;">
      <div class="container">
        
        <!-- Header Strip -->
        <div style="margin-bottom: 2rem;">
          <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">Catalog Explorer</div>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em;">
            Explore All eBooks
          </h1>
          <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
            Discover, filter, and sort over 10,000+ publications across all categories.
          </p>
        </div>

        <!-- Main Layout with Filter Sidebar + Grid -->
        <div style="display: grid; grid-template-columns: 280px 1fr; gap: 2rem; align-items: start;" class="explore-grid-layout">
          
          <!-- Filter Sidebar -->
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.5rem; box-shadow: var(--shadow-sm); position: sticky; top: 90px;" class="filter-sidebar">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
              <span style="font-weight: 700; font-size: 1rem; color: var(--text-primary);">Filters</span>
              <button id="reset-filters-btn" class="btn btn-ghost btn-sm" style="font-size: 0.75rem; color: var(--accent);">Reset All</button>
            </div>

            <!-- Search input within filters -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.4rem;">Keyword</label>
              <input type="text" id="filter-search-input" placeholder="Title, author, topic..." style="width: 100%; padding: 0.55rem 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.875rem;" />
            </div>

            <!-- Source Filter (Bookora vs External) -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.5rem;">Source Type</label>
              <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; cursor: pointer;">
                  <input type="radio" name="filter-source" value="all" ${activeSource === 'all' ? 'checked' : ''} />
                  <span>All Sources</span>
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; cursor: pointer;">
                  <input type="radio" name="filter-source" value="internal" ${activeSource === 'internal' ? 'checked' : ''} />
                  <span class="badge badge-bookora" style="font-size: 0.65rem;">BOOKORA ONLY</span>
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; cursor: pointer;">
                  <input type="radio" name="filter-source" value="external" ${activeSource === 'external' ? 'checked' : ''} />
                  <span class="badge badge-external" style="font-size: 0.65rem;">EXTERNAL ONLY</span>
                </label>
              </div>
            </div>

            <!-- Category Filter -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.4rem;">Category</label>
              <select id="filter-category-select" style="width: 100%; padding: 0.55rem 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.875rem; background: #FFFFFF;">
                <option value="">All Categories</option>
                ${state.categories.map(c => `
                  <option value="${c.name}" ${activeCategory === c.name ? 'selected' : ''}>${c.name} (${c.count})</option>
                `).join('')}
              </select>
            </div>

            <!-- Price Range -->
            <div style="margin-bottom: 1.5rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.4rem;">
                <span>Max Price:</span>
                <span id="price-val-label">$100</span>
              </div>
              <input type="range" id="filter-price-slider" min="10" max="100" value="100" step="5" style="width: 100%; accent-color: var(--accent);" />
            </div>

            <!-- Rating Filter -->
            <div style="margin-bottom: 1rem;">
              <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.4rem;">Minimum Rating</label>
              <select id="filter-rating-select" style="width: 100%; padding: 0.55rem 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.875rem; background: #FFFFFF;">
                <option value="0">Any Rating</option>
                <option value="4.5">⭐⭐⭐⭐⭐ 4.5 & Up</option>
                <option value="4.0">⭐⭐⭐⭐ 4.0 & Up</option>
              </select>
            </div>

          </div>

          <!-- Catalog Content Area -->
          <div>
            
            <!-- Top Controls (Count + Sorting) -->
            <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 0.85rem 1.25rem; margin-bottom: 1.5rem; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem;">
              <div style="font-size: 0.9rem; color: var(--text-secondary);">
                Showing <strong id="catalog-count" style="color: var(--text-primary);">0</strong> eBooks
              </div>

              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">Sort By:</label>
                <select id="catalog-sort-select" style="padding: 0.4rem 0.75rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.85rem; background: #FFFFFF;">
                  <option value="popular" ${activeSort === 'popular' ? 'selected' : ''}>Popular</option>
                  <option value="newest" ${activeSort === 'newest' ? 'selected' : ''}>Newest</option>
                  <option value="bestselling" ${activeSort === 'bestselling' ? 'selected' : ''}>Best Selling</option>
                  <option value="toprated" ${activeSort === 'toprated' ? 'selected' : ''}>Top Rated</option>
                  <option value="price-asc" ${activeSort === 'price-asc' ? 'selected' : ''}>Price: Low to High</option>
                  <option value="price-desc" ${activeSort === 'price-desc' ? 'selected' : ''}>Price: High to Low</option>
                </select>
              </div>
            </div>

            <!-- Books Grid Container -->
            <div id="explore-books-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.5rem;">
              <!-- Filled dynamically by initExploreEvents -->
            </div>

          </div>

        </div>

      </div>
    </div>
  `;
}

export function initExploreEvents() {
  const grid = document.getElementById('explore-books-grid');
  const countLabel = document.getElementById('catalog-count');
  const searchInput = document.getElementById('filter-search-input');
  const categorySelect = document.getElementById('filter-category-select');
  const priceSlider = document.getElementById('filter-price-slider');
  const priceLabel = document.getElementById('price-val-label');
  const ratingSelect = document.getElementById('filter-rating-select');
  const sortSelect = document.getElementById('catalog-sort-select');
  const resetBtn = document.getElementById('reset-filters-btn');

  const filterAndRender = () => {
    if (!grid) return;

    const searchTerm = (searchInput?.value || '').toLowerCase().trim();
    const selectedCat = categorySelect?.value || '';
    const maxPrice = parseFloat(priceSlider?.value || '100');
    const minRating = parseFloat(ratingSelect?.value || '0');
    const selectedSource = document.querySelector('input[name="filter-source"]:checked')?.value || 'all';
    const sortBy = sortSelect?.value || 'popular';

    let books = state.getApprovedBooks();

    // 1. Search
    if (searchTerm) {
      books = books.filter(b => 
        b.title.toLowerCase().includes(searchTerm) ||
        b.author.toLowerCase().includes(searchTerm) ||
        b.description.toLowerCase().includes(searchTerm) ||
        (b.tags && b.tags.some(t => t.toLowerCase().includes(searchTerm)))
      );
    }

    // 2. Category
    if (selectedCat) {
      books = books.filter(b => b.category === selectedCat);
    }

    // 3. Source
    if (selectedSource === 'internal') {
      books = books.filter(b => b.source_type === 'internal');
    } else if (selectedSource === 'external') {
      books = books.filter(b => b.source_type === 'external');
    }

    // 4. Price
    books = books.filter(b => (b.sale_price || b.price) <= maxPrice);

    // 5. Rating
    if (minRating > 0) {
      books = books.filter(b => (b.rating || 0) >= minRating);
    }

    // 6. Sort
    if (sortBy === 'newest') {
      books.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sortBy === 'bestselling') {
      books.sort((a, b) => (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0));
    } else if (sortBy === 'toprated') {
      books.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'price-asc') {
      books.sort((a, b) => (a.sale_price || a.price) - (b.sale_price || b.price));
    } else if (sortBy === 'price-desc') {
      books.sort((a, b) => (b.sale_price || b.price) - (a.sale_price || a.price));
    }

    // Update count
    if (countLabel) countLabel.textContent = books.length;

    if (books.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 4rem 2rem; text-align: center;">
          <div style="width: 64px; height: 64px; margin: 0 auto 1.25rem auto; border-radius: var(--radius-full); background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center; color: var(--text-muted);">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
          <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">No eBooks Matched Your Filters</h3>
          <p style="font-size: 0.9rem; color: var(--text-secondary); max-width: 420px; margin: 0 auto 1.5rem auto;">
            Try adjusting your search keyword, resetting category filters, or raising the maximum price threshold.
          </p>
          <button id="empty-reset-btn" class="btn btn-primary btn-sm">Reset All Filters</button>
        </div>
      `;
      document.getElementById('empty-reset-btn')?.addEventListener('click', () => {
        resetAll();
      });
      return;
    }

    grid.innerHTML = books.map(b => renderBookCard(b)).join('');
  };

  const resetAll = () => {
    if (searchInput) searchInput.value = '';
    if (categorySelect) categorySelect.value = '';
    if (priceSlider) {
      priceSlider.value = 100;
      if (priceLabel) priceLabel.textContent = '$100';
    }
    if (ratingSelect) ratingSelect.value = '0';
    const allRadio = document.querySelector('input[name="filter-source"][value="all"]');
    if (allRadio) allRadio.checked = true;
    if (sortSelect) sortSelect.value = 'popular';
    filterAndRender();
  };

  // Bind listeners
  searchInput?.addEventListener('input', filterAndRender);
  categorySelect?.addEventListener('change', filterAndRender);
  ratingSelect?.addEventListener('change', filterAndRender);
  sortSelect?.addEventListener('change', filterAndRender);
  document.querySelectorAll('input[name="filter-source"]').forEach(r => r.addEventListener('change', filterAndRender));

  priceSlider?.addEventListener('input', () => {
    if (priceLabel) priceLabel.textContent = `$${priceSlider.value}`;
    filterAndRender();
  });

  resetBtn?.addEventListener('click', resetAll);

  // Initial render
  filterAndRender();
}
