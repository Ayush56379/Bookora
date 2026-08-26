// Bookora Explore — resilient filter runtime
(() => {
  'use strict';
  if (window.__BOOKORA_EXPLORE_FILTER_RUNTIME_FIX__) return;
  window.__BOOKORA_EXPLORE_FILTER_RUNTIME_FIX__ = true;

  let stateModule = null;
  let cardModule = null;
  let ready = false;
  let rendering = false;
  let queued = false;

  const page = () => document.querySelector('.explore-page');
  const value = (selector, fallback = '') => page()?.querySelector(selector)?.value ?? fallback;
  const checked = name => page()?.querySelector(`input[name="${name}"]:checked`)?.value ?? '';
  const number = (selector, fallback) => {
    const raw = Number(value(selector, fallback));
    return Number.isFinite(raw) ? raw : fallback;
  };
  const text = v => String(v ?? '').trim();
  const lower = v => text(v).toLocaleLowerCase();

  const priceOf = book => {
    for (const candidate of [book?.sale_price, book?.salePrice, book?.selling_price, book?.sellingPrice, book?.price, book?.amount]) {
      const n = Number(candidate);
      if (Number.isFinite(n)) return n;
    }
    return 0;
  };
  const ratingOf = book => {
    const n = Number(book?.rating ?? book?.average_rating ?? book?.averageRating ?? 0);
    return Number.isFinite(n) ? n : 0;
  };
  const categoryOf = book => text(book?.category ?? book?.category_name ?? book?.categoryName ?? book?.genre ?? '');
  const sourceOf = book => lower(book?.source_type ?? book?.sourceType ?? book?.book_source ?? 'internal') || 'internal';
  const dateOf = book => new Date(book?.created_at ?? book?.createdAt ?? book?.published_at ?? book?.publishedAt ?? 0).getTime() || 0;
  const salesOf = book => Number(book?.sales_count ?? book?.sales ?? book?.purchase_count ?? book?.purchaseCount ?? book?.total_sales ?? 0) || 0;

  const allBooks = () => {
    const state = stateModule?.state;
    if (!state) return [];
    try {
      const books = typeof state.getApprovedBooks === 'function' ? state.getApprovedBooks() : state.books;
      return (Array.isArray(books) ? books : []).filter(book => {
        const status = lower(book?.status);
        return !status || status === 'approved';
      });
    } catch (error) {
      console.warn('[Explore filters] catalog read failed:', error);
      return Array.isArray(state.books) ? state.books : [];
    }
  };

  const apply = () => {
    const p = page();
    const grid = p?.querySelector('#explore-books-grid');
    if (!p || !grid || !ready || rendering) return;
    rendering = true;
    try {
      const search = lower(value('#filter-search-input'));
      const category = text(checked('filter-category'));
      const source = lower(checked('filter-source') || 'all');
      const rating = Number(checked('filter-rating') || 0) || 0;
      const min = Math.max(0, number('#filter-min-price', 0));
      const max = Math.max(min, Math.max(0, number('#filter-max-price', 999999)));
      const sort = value('#catalog-sort-select', 'popular');

      let books = allBooks().filter(book => {
        if (search) {
          const haystack = [book?.title, book?.author, book?.description, book?.subtitle, book?.category, book?.category_name, ...(Array.isArray(book?.tags) ? book.tags : [])].map(lower).join(' ');
          if (!haystack.includes(search)) return false;
        }
        if (category && lower(categoryOf(book)) !== lower(category)) return false;
        if (source !== 'all' && sourceOf(book) !== source) return false;
        const price = priceOf(book);
        if (price < min || price > max) return false;
        if (rating > 0 && ratingOf(book) < rating) return false;
        return true;
      });

      if (sort === 'newest') books.sort((a, b) => dateOf(b) - dateOf(a));
      else if (sort === 'bestselling') books.sort((a, b) => salesOf(b) - salesOf(a));
      else if (sort === 'toprated') books.sort((a, b) => ratingOf(b) - ratingOf(a));
      else if (sort === 'price-asc') books.sort((a, b) => priceOf(a) - priceOf(b));
      else if (sort === 'price-desc') books.sort((a, b) => priceOf(b) - priceOf(a));

      const count = p.querySelector('#catalog-count');
      if (count) count.textContent = String(books.length);

      const summary = p.querySelector('#mobile-filter-summary');
      if (summary) {
        const active = [];
        if (search) active.push('Search');
        if (category) active.push(category);
        if (source !== 'all') active.push(source === 'internal' ? 'Bookora' : 'External');
        if (rating) active.push(`${rating}★+`);
        if (min > 0 || max < 999999) active.push('Price');
        summary.textContent = active.length ? `${active.length} filter${active.length > 1 ? 's' : ''} applied` : 'All books';
      }

      if (!books.length) {
        grid.innerHTML = `<div style="grid-column:1/-1;background:#fff;border:1px solid var(--border-subtle);border-radius:16px;padding:60px 24px;text-align:center"><div style="font-size:38px;margin-bottom:10px">⌕</div><h3 style="margin-bottom:7px;color:var(--text-primary)">No eBooks Matched Your Filters</h3><p style="color:var(--text-secondary);margin-bottom:18px">Try changing or clearing one of your filters.</p><button id="explore-runtime-reset" class="btn btn-primary btn-sm" type="button">Clear Filters</button></div>`;
        return;
      }

      const render = cardModule?.renderBookCard;
      if (typeof render !== 'function') return;
      grid.innerHTML = books.map(render).join('');
    } catch (error) {
      console.error('[Explore filters] render failed:', error);
    } finally {
      rendering = false;
    }
  };

  const scheduleRender = () => {
    if (!ready || queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      apply();
    });
  };

  const reset = () => {
    const p = page();
    if (!p) return;
    p.querySelector('#filter-search-input')?.setAttribute('value', '');
    const search = p.querySelector('#filter-search-input');
    const min = p.querySelector('#filter-min-price');
    const max = p.querySelector('#filter-max-price');
    const slider = p.querySelector('#filter-price-slider');
    const sort = p.querySelector('#catalog-sort-select');
    if (search) search.value = '';
    if (min) min.value = '';
    if (max) max.value = '999999';
    if (slider) slider.value = '9999';
    if (sort) sort.value = 'popular';
    p.querySelector('input[name="filter-category"][value=""]')?.click();
    p.querySelector('input[name="filter-source"][value="all"]')?.click();
    p.querySelector('input[name="filter-rating"][value="0"]')?.click();
    scheduleRender();
  };

  const load = async () => {
    try {
      [stateModule, cardModule] = await Promise.all([
        import('./state.js?v=explore-filter-runtime-20260826-1'),
        import('./components/BookCard.js?v=explore-filter-runtime-20260826-1')
      ]);
      ready = true;
      scheduleRender();
    } catch (error) {
      console.error('[Explore filters] runtime load failed:', error);
    }
  };

  document.addEventListener('input', event => {
    if (!page()) return;
    const target = event.target;
    if (target?.matches?.('#filter-search-input,#filter-min-price,#filter-max-price,#filter-price-slider')) scheduleRender();
  }, true);

  document.addEventListener('change', event => {
    if (!page()) return;
    const target = event.target;
    if (target?.matches?.('input[name="filter-category"],input[name="filter-rating"],input[name="filter-source"],#filter-min-price,#filter-max-price,#filter-price-slider,#catalog-sort-select')) scheduleRender();
  }, true);

  document.addEventListener('click', event => {
    const target = event.target?.closest?.('button,[role="button"]');
    if (!target || !page()) return;
    if (target.id === 'explore-runtime-reset' || target.id === 'reset-filters-btn') {
      event.preventDefault();
      reset();
      return;
    }
    const preset = target.closest('[data-max-price]');
    if (preset) {
      event.preventDefault();
      const p = page();
      const max = p?.querySelector('#filter-max-price');
      const slider = p?.querySelector('#filter-price-slider');
      const presetMax = Number(preset.getAttribute('data-max-price')) || 999999;
      if (max) max.value = String(presetMax);
      if (slider) slider.value = String(Math.min(9999, presetMax));
      scheduleRender();
    }
  }, true);

  window.addEventListener('hashchange', () => setTimeout(scheduleRender, 50));
  window.addEventListener('bookora:catalog-updated', () => setTimeout(scheduleRender, 50));
  let attempts = 0;
  const bootTimer = setInterval(() => {
    if (page()) scheduleRender();
    if (++attempts >= 30) clearInterval(bootTimer);
  }, 300);

  load();
})();
