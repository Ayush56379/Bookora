// Bookora public category data — Firebase-backed names and live approved-book counts.
(() => {
  'use strict';
  if (window.__BOOKORA_PUBLIC_CATEGORY_DATA_FIX_V3__) return;
  window.__BOOKORA_PUBLIC_CATEGORY_DATA_FIX_V3__ = true;

  const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  const slugify = value => String(value || '')
    .trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const normalizeName = value => String(value || '').trim().replace(/\s+/g, ' ');

  const renderCard = c => `
    <a href="#/category/${encodeURIComponent(c.slug)}" class="category-card" data-slug="${esc(c.slug)}">
      <div class="category-icon-box">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
      </div>
      <div><h4 style="font-size:0.95rem;font-weight:700;color:var(--text-primary);margin-bottom:2px;">${esc(c.name)}</h4><span style="font-size:0.78rem;color:var(--text-muted);">${Number(c.count || 0)} Publications</span></div>
      <div class="category-arrow"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"></path></svg></div>
    </a>
  `;

  const renderBookCard = async book => {
    try {
      const module = await import('./components/BookCard.js?v=category-data-runtime-card-1');
      return module.renderBookCard(book);
    } catch (_) {
      return '';
    }
  };

  const sync = async () => {
    try {
      const [{ state }, cardModule] = await Promise.all([
        import('./state.js?v=category-data-runtime-20260826-3'),
        import('./components/BookCard.js?v=category-data-runtime-card-1')
      ]);
      const sourceCategories = Array.isArray(state.categories) ? state.categories : [];
      const books = typeof state.getApprovedBooks === 'function' ? state.getApprovedBooks() : [];

      const countByName = new Map();
      books.forEach(book => {
        const name = normalizeName(book?.category || book?.category_name || book?.categoryName || 'Other');
        if (!name) return;
        const key = name.toLowerCase();
        const entry = countByName.get(key) || { name, count: 0 };
        entry.count += 1;
        countByName.set(key, entry);
      });

      const categories = [];
      const seen = new Set();
      const add = raw => {
        const name = normalizeName(raw?.name || raw?.title || raw?.category || '');
        if (!name) return;
        const key = name.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        categories.push({
          ...raw,
          name,
          slug: raw?.slug || slugify(name),
          description: raw?.description || `Explore ${name} eBooks on Bookora.`,
          count: countByName.get(key)?.count || 0
        });
      };

      sourceCategories.forEach(add);
      countByName.forEach(entry => {
        if (!seen.has(entry.name.toLowerCase())) add({ name: entry.name, count: entry.count });
      });
      state.categories = categories;

      const explore = document.querySelector('.explore-page');
      if (explore) {
        const list = explore.querySelector('.category-list');
        if (list) {
          const selected = list.querySelector('input[name="filter-category"]:checked')?.value || '';
          list.innerHTML = `<label class="filter-option"><input type="radio" name="filter-category" value="" ${selected === '' ? 'checked' : ''}><span>All Categories</span></label>${categories.map(c => `
            <label class="filter-option"><input type="radio" name="filter-category" value="${esc(c.name)}" ${selected === c.name ? 'checked' : ''}><span>${esc(c.name)}</span><span class="count">${Number(c.count || 0)}</span></label>
          `).join('')}`;
          list.querySelectorAll('input[name="filter-category"]').forEach(input => input.addEventListener('change', () => {
            explore.querySelector('#catalog-sort-select')?.dispatchEvent(new Event('change', { bubbles: true }));
          }));
        }
      }

      const dir = document.querySelector('.categories-dir-page');
      if (dir) {
        const heading = dir.querySelector('h1');
        if (heading) heading.textContent = `Explore Categories (${categories.length})`;
        const grid = heading?.closest('.container')?.querySelector('div[style*="repeat(auto-fill"]');
        if (grid) grid.innerHTML = categories.map(renderCard).join('');
      }

      const categoryPage = document.querySelector('.category-page');
      const hash = window.location.hash || '';
      if (categoryPage && hash.startsWith('#/category/')) {
        const slug = decodeURIComponent(hash.replace('#/category/', '').split('?')[0]).toLowerCase();
        const category = categories.find(c => String(c.slug || '').toLowerCase() === slug) || categories.find(c => slugify(c.name) === slug);
        if (category) {
          const matchingBooks = books.filter(book => {
            const name = normalizeName(book?.category || book?.category_name || book?.categoryName || '');
            return name.toLowerCase() === category.name.toLowerCase() || slugify(name) === slug;
          });
          const countNode = categoryPage.querySelector('.container > div:first-child div[style*="font-size: 2.2rem"]');
          if (countNode) countNode.textContent = String(matchingBooks.length);
          const grid = categoryPage.querySelector('.container > div:nth-child(2)');
          if (grid && matchingBooks.length && typeof cardModule.renderBookCard === 'function') {
            grid.innerHTML = matchingBooks.map(cardModule.renderBookCard).join('');
          }
        }
      }
    } catch (error) {
      console.warn('[Bookora categories] live data sync skipped:', error?.message || error);
    }
  };

  window.addEventListener('bookora:catalog-updated', sync, { passive: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(sync, 0), { once: true });
  else setTimeout(sync, 0);
})();
