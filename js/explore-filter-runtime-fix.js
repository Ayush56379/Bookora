// Bookora Explore — stable catalog refresh bridge.
// The page component owns filter input/change handlers. This runtime only refreshes
// after the asynchronous Firebase catalog becomes available, so cards never blink
// from a polling loop or duplicate render handlers.
(() => {
  'use strict';
  if (window.__BOOKORA_EXPLORE_STABLE_REFRESH_V3__) return;
  window.__BOOKORA_EXPLORE_STABLE_REFRESH_V3__ = true;

  const page = () => document.querySelector('.explore-page');

  const refreshFromCatalog = () => {
    const p = page();
    if (!p) return;

    // Let the native ExplorePage implementation do the actual filtering.
    // A single change event refreshes the current catalog without installing
    // another input/change handler or polling loop.
    const sort = p.querySelector('#catalog-sort-select');
    if (sort) sort.dispatchEvent(new Event('change', { bubbles: true }));
  };

  window.addEventListener('bookora:catalog-updated', () => {
    requestAnimationFrame(refreshFromCatalog);
  }, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(refreshFromCatalog, 0), { once: true });
  } else {
    setTimeout(refreshFromCatalog, 0);
  }

  // Category names/counts are also hydrated from the same live catalog event.
  import('./public-category-data-runtime-fix.js?v=20260826-1').catch(error => {
    console.warn('[Bookora categories] runtime load failed:', error?.message || error);
  });
})();
