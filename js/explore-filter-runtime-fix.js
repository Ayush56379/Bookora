// Bookora Explore — optimized production filter bridge.
// IMPORTANT: no global MutationObserver. Explore must stay lightweight.
(() => {
  'use strict';
  if (window.__BOOKORA_EXPLORE_PRODUCTION_FILTER_V8__) return;
  window.__BOOKORA_EXPLORE_PRODUCTION_FILTER_V8__ = true;

  const page = () => document.querySelector('.explore-page');
  const getBooks = () => {
    try {
      const s = window.BookoraState || window.state;
      return typeof s?.getApprovedBooks === 'function' ? s.getApprovedBooks() : [];
    } catch (_) { return []; }
  };
  const num = (v) => {
    const n = Number(String(v ?? '').replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };
  const rating = (b) => {
    for (const v of [b?.rating,b?.averageRating,b?.average_rating,b?.avgRating,b?.ratingValue,b?.reviewRating,b?.review_rating]) {
      if (v !== null && v !== undefined && v !== '') return Math.max(0, Math.min(5, num(v)));
    }
    const total = num(b?.ratingTotal ?? b?.rating_total), count = num(b?.reviewCount ?? b?.review_count ?? b?.ratingsCount);
    return total > 0 && count > 0 ? Math.max(0, Math.min(5, total / count)) : 0;
  };
  const price = (b) => {
    for (const v of [b?.sale_price,b?.salePrice,b?.price,b?.original_price,b?.originalPrice]) {
      if (v !== null && v !== undefined && v !== '') return Math.max(0, num(v));
    }
    return 0;
  };
  const catValues = (b) => {
    const out = [];
    const add = (v) => {
      if (v === null || v === undefined || v === '') return;
      if (Array.isArray(v)) return v.forEach(add);
      if (typeof v === 'object') return add(v.name || v.title || v.category || v.label || v.slug || v.id);
      const s = String(v).trim().replace(/\s+/g, ' ');
      if (s) out.push(s);
    };
    add(b?.category); add(b?.categories); add(b?.category_name); add(b?.categoryName);
    return [...new Set(out)];
  };
  const key = (v) => String(v || '').trim().toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const esc = (v) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');

  const removeAI = (p) => {
    p.querySelectorAll('#bookora-ai-filter,[data-smart-filter],.smart-filter-section,.ai-smart-filter').forEach(el => el.remove());
    p.querySelectorAll('.filter-section').forEach(s => { if (/ai smart filter/i.test(s.textContent || '')) s.remove(); });
  };

  const updatePrice = (p, books) => {
    const maxPrice = Math.max(0, ...books.map(price));
    const min = p.querySelector('#filter-min-price'), max = p.querySelector('#filter-max-price'), slider = p.querySelector('#filter-price-slider');
    if (min) { min.removeAttribute('max'); min.setAttribute('inputmode','numeric'); }
    if (max) { max.removeAttribute('max'); max.setAttribute('inputmode','numeric'); }
    if (slider) {
      const limit = Math.max(1000, Math.ceil(maxPrice / 100) * 100, num(max?.value));
      slider.max = String(limit);
      slider.setAttribute('aria-label', `Maximum price up to ₹${limit}`);
      if (!Number.isFinite(Number(slider.value)) || Number(slider.value) > limit) slider.value = String(limit);
    }
  };

  const styleRating = (p) => {
    if (!document.getElementById('bookora-explore-rating-ui-v8')) {
      const s = document.createElement('style');
      s.id = 'bookora-explore-rating-ui-v8';
      s.textContent = `.explore-page .filter-rating-row{display:grid!important;grid-template-columns:20px minmax(0,1fr)!important;align-items:center!important;gap:8px!important;min-height:40px!important;padding:6px 8px!important;border:1px solid transparent!important;border-radius:9px!important;color:#334155!important;font-size:12px!important;font-weight:650!important;line-height:1.2!important}.explore-page .filter-rating-row:hover{background:#faf5ff!important;border-color:#ede9fe!important}.explore-page .filter-rating-row input{width:16px!important;height:16px!important;margin:0!important;accent-color:#7c3aed!important}.explore-page .filter-rating-row .rating-option-content{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;width:100%!important}.explore-page .filter-rating-row .rating-stars-text{color:#f59e0b!important;letter-spacing:1px!important;font-size:12px!important;white-space:nowrap!important}.explore-page .filter-rating-row .rating-threshold{color:#475569!important;font-weight:700!important;white-space:nowrap!important}.explore-page .filter-rating-row .rating-all-label{color:#475569!important;font-weight:700!important}.explore-page .category-chips{visibility:hidden}.explore-page .category-chips.bookora-category-ready{visibility:visible}.explore-page .category-chips button.active{background:#2563eb!important;border-color:#2563eb!important;color:#fff!important;box-shadow:0 2px 8px rgba(37,99,235,.22)!important}.explore-page .category-chips button.active:hover{background:#1d4ed8!important;border-color:#1d4ed8!important;color:#fff!important}`;
      document.head.appendChild(s);
    }
    p.querySelectorAll('.filter-rating-row').forEach(row => {
      const input = row.querySelector('input[name="filter-rating"]');
      if (!input || row.dataset.ratingUiVersion === '8') return;
      const value = Number(input.value || 0);
      row.innerHTML = ''; row.appendChild(input);
      const c = document.createElement('span'); c.className = 'rating-option-content';
      c.innerHTML = value === 0 ? '<span class="rating-all-label">All ratings</span>' : `<span class="rating-stars-text">${value >= 4.5 ? '★★★★★' : value >= 4 ? '★★★★☆' : '★★★☆☆'}</span><span class="rating-threshold">${value.toFixed(1)} &amp; up</span>`;
      row.appendChild(c); row.dataset.ratingUiVersion = '8';
    });
  };

  const syncCategories = (p, books) => {
    const chips = p.querySelector('#explore-category-chips');
    if (!chips) return;
    const map = new Map();
    books.forEach(b => catValues(b).forEach(name => {
      const k = key(name); if (!k) return;
      if (!map.has(k)) map.set(k, { name, count: 0 });
      map.get(k).count++;
    }));
    const categories = [...map.values()].sort((a,b) => a.name.localeCompare(b.name, undefined, { sensitivity:'base' }));
    const query = new URLSearchParams((window.location.hash || '#/explore').split('?')[1] || '');
    const selected = key(query.get('category') || '');
    const sig = JSON.stringify([selected, ...categories.map(c => [key(c.name), c.count])]);
    if (chips.dataset.firebaseCategorySignature === sig) { chips.classList.add('bookora-category-ready'); return; }
    chips.dataset.firebaseCategorySignature = sig;
    chips.innerHTML = `<button type="button" class="${selected ? '' : 'active'}" data-category-chip="">All Categories</button>` + categories.map(c => `<button type="button" class="${selected === key(c.name) ? 'active' : ''}" data-category-chip="${esc(c.name)}">${esc(c.name)}</button>`).join('');
    chips.classList.add('bookora-category-ready');
    chips.querySelectorAll('[data-category-chip]').forEach(btn => btn.addEventListener('click', () => {
      const value = btn.getAttribute('data-category-chip') || '';
      const radio = [...p.querySelectorAll('input[name="filter-category"]')].find(r => r.value === value);
      if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles:true })); }
      else { const base = window.location.hash.split('?')[0] || '#/explore'; window.location.hash = value ? `${base}?category=${encodeURIComponent(value)}` : base; }
    }, { passive:true }));
  };

  let queued = false;
  const refresh = () => {
    queued = false;
    const p = page(); if (!p) return;
    const books = getBooks(); if (!Array.isArray(books)) return;
    books.forEach(b => {
      const r = rating(b); if (b.rating !== r) b.rating = r;
      if (b.review_count === undefined && b.reviewCount !== undefined) b.review_count = Number(b.reviewCount) || 0;
    });
    removeAI(p); updatePrice(p, books); styleRating(p); syncCategories(p, books);
  };
  const scheduleRefresh = () => { if (queued) return; queued = true; requestAnimationFrame(refresh); };

  window.addEventListener('bookora:catalog-updated', scheduleRefresh, { passive:true });
  window.addEventListener('hashchange', scheduleRefresh, { passive:true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scheduleRefresh, { once:true });
  else scheduleRefresh();
})();
