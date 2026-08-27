// Bookora Explore — filter controls synchronization hotfix.
(() => {
  'use strict';
  if (window.__BOOKORA_EXPLORE_FILTER_CONTROLS_V1__) return;
  window.__BOOKORA_EXPLORE_FILTER_CONTROLS_V1__ = true;

  const page = () => document.querySelector('.explore-page');
  const value = el => String(el?.value ?? '').trim();
  const fire = el => {
    if (!el) return;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };

  const syncPrice = source => {
    const p = page(); if (!p) return;
    const min = p.querySelector('#filter-min-price');
    const max = p.querySelector('#filter-max-price');
    const slider = p.querySelector('#filter-price-slider');
    if (source === 'slider' && slider && max) max.value = value(slider);
    if (source === 'max' && max && slider) {
      const n = Number(max.value);
      if (Number.isFinite(n)) slider.value = String(Math.min(Number(slider.max || 9999), Math.max(Number(slider.min || 0), n)));
    }
    if (min && max && min.value !== '' && max.value !== '' && Number(min.value) > Number(max.value)) {
      if (source === 'min') max.value = min.value;
      else min.value = max.value;
    }
  };

  const wire = () => {
    const p = page(); if (!p) return;
    if (p.dataset.filterControlsHotfix === '1') return;
    p.dataset.filterControlsHotfix = '1';

    p.addEventListener('input', e => {
      if (e.target.matches('#filter-price-slider')) { syncPrice('slider'); fire(e.target); }
      else if (e.target.matches('#filter-max-price,#filter-min-price')) { syncPrice(e.target.id === 'filter-max-price' ? 'max' : 'min'); }
    }, true);

    p.addEventListener('click', e => {
      const chip = e.target.closest('[data-max-price]');
      if (chip && p.contains(chip)) {
        const max = p.querySelector('#filter-max-price');
        const slider = p.querySelector('#filter-price-slider');
        if (max) max.value = chip.dataset.maxPrice === '999999' ? '' : chip.dataset.maxPrice;
        if (slider) slider.value = chip.dataset.maxPrice === '999999' ? slider.max : String(Math.min(Number(slider.max || 9999), Number(chip.dataset.maxPrice)));
        fire(max); fire(slider);
        e.preventDefault();
      }

      const categoryChip = e.target.closest('[data-category-chip]');
      if (categoryChip && p.contains(categoryChip)) {
        const wanted = value({ value: categoryChip.dataset.categoryChip });
        const radio = [...p.querySelectorAll('input[name="filter-category"]')].find(x => value(x) === wanted);
        if (radio) { radio.checked = true; fire(radio); }
      }
    }, true);
  };

  const observer = new MutationObserver(() => { if (page()) wire(); });
  observer.observe(document.body, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire, { once: true }); else setTimeout(wire, 0);
})();
