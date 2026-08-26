// Bookora public category data — Firebase-backed names and live approved-book counts.
// This runtime is intentionally scoped to the public category directory/explore filter.
(() => {
  'use strict';
  if (window.__BOOKORA_PUBLIC_CATEGORY_DATA_FIX_V6__) return;
  window.__BOOKORA_PUBLIC_CATEGORY_DATA_FIX_V6__ = true;

  const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;').replace(/'/g, '&#039;');

  const normalizeName = value => {
    if (Array.isArray(value)) return '';
    if (value && typeof value === 'object') {
      return normalizeName(value.name || value.title || value.category || value.label || value.slug || value.id || '');
    }
    return String(value || '').trim().replace(/\s+/g, ' ');
  };

  const slugify = value => String(value || '')
    .trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const categoryValues = book => {
    const raw = [book?.category, book?.categories, book?.category_name, book?.categoryName]
      .filter(value => value !== undefined && value !== null && value !== '');
    const values = [];
    const add = value => {
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) return value.forEach(add);
      if (typeof value === 'object') {
        add(value.name); add(value.title); add(value.category);
        add(value.label); add(value.slug); add(value.id);
        return;
      }
      const normalized = normalizeName(value);
      if (normalized) values.push(normalized);
    };
    raw.forEach(add);
    return [...new Set(values)];
  };

  const categoryKeys = category => [...new Set([
    normalizeName(category?.name), normalizeName(category?.title),
    normalizeName(category?.slug), normalizeName(category?.id)
  ].filter(Boolean).map(value => String(value).trim().toLowerCase()))];

  const renderCard = c => `
    <a href="#/category/${encodeURIComponent(c.slug)}" class="category-card" data-slug="${esc(c.slug)}">
      <div class="category-icon-box"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg></div>
      <div><h4 style="font-size:0.95rem;font-weight:700;color:var(--text-primary);margin-bottom:2px;">${esc(c.name)}</h4><span style="font-size:0.78rem;color:var(--text-muted);">${Number.isFinite(Number(c.count)) ? Number(c.count) : 0} Publications</span></div>
      <div class="category-arrow"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"></path></svg></div>
    </a>`;

  const sync = async () => {
    try {
      const { state } = await import('./state.js?v=category-data-runtime-20260826-6');
      const sourceCategories = Array.isArray(state.categories) ? state.categories : [];
      let books = Array.isArray(state.books) ? state.books : [];
      if (typeof state.getApprovedBooks === 'function') {
        const approved = state.getApprovedBooks();
        if (approved.length) books = approved;
      }

      // IMPORTANT: each book is counted once per category alias. The previous
      // implementation incremented the same alias twice (raw value + slug),
      // which produced incorrect doubled counts such as 18 instead of 9.
      const countByKey = new Map();
      books.forEach(book => {
        const aliases = new Set();
        categoryValues(book).forEach(value => {
          const normalized = String(value).trim().toLowerCase();
          if (!normalized) return;
          aliases.add(normalized);
          const slug = slugify(value);
          if (slug) aliases.add(slug);
        });
        aliases.forEach(key => countByKey.set(key, (countByKey.get(key) || 0) + 1));
      });

      const categories = [];
      const seen = new Set();
      const add = raw => {
        const name = normalizeName(raw?.name || raw?.title || raw?.category || raw);
        if (!name) return;
        const key = name.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        const count = categoryKeys(raw).reduce((max, k) => Math.max(max, Number(countByKey.get(k) || 0)), 0);
        categories.push({
          ...((raw && typeof raw === 'object') ? raw : {}),
          name,
          slug: raw?.slug || slugify(name),
          description: raw?.description || `Explore ${name} eBooks on Bookora.`,
          count
        });
      };

      sourceCategories.forEach(add);

      const knownKeys = new Set(categories.flatMap(categoryKeys));
      books.forEach(book => {
        categoryValues(book).forEach(value => {
          const key = String(value).trim().toLowerCase();
          const slug = slugify(value);
          if (knownKeys.has(key) || knownKeys.has(slug)) return;
          add({ name: value, slug: slug || key });
        });
      });

      state.categories = categories;

      const dir = document.querySelector('.categories-dir-page');
      if (dir) {
        const heading = dir.querySelector('h1');
        if (heading) heading.textContent = `Explore Categories (${categories.length})`;
        const grid = dir.querySelector('.container > div[style*="repeat(auto-fill"]');
        if (grid) grid.innerHTML = categories.map(renderCard).join('');
      }

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
    } catch (error) {
      console.warn('[Bookora categories] live data sync skipped:', error?.message || error);
    }
  };

  window.addEventListener('bookora:catalog-updated', sync, { passive: true });
  window.addEventListener('hashchange', () => setTimeout(sync, 50), { passive: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(sync, 0), { once: true });
  else setTimeout(sync, 0);
})();
