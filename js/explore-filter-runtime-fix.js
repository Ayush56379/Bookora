// Bookora Explore — stable catalog refresh bridge.
// The page component owns filter input/change handlers. This runtime only refreshes
// after the asynchronous Firebase catalog becomes available, so cards never blink
// from a polling loop or duplicate render handlers.
(() => {
  'use strict';
  if (window.__BOOKORA_EXPLORE_STABLE_REFRESH_V2__) return;
  window.__BOOKORA_EXPLORE_STABLE_REFRESH_V2__ = true;

  const page = () => document.querySelector('.explore-page');

  const refreshFromCatalog = () => {
    const p = page();
    if (!p) return;

    // Let the native ExplorePage implementation do the actual filtering.
    // Re-dispatching a harmless input event is avoided because it can create
    // duplicate work. Instead call the page's public refresh hook when present.
    if (typeof window.__BOOKORA_EXPLORE_REFRESH__ === 'function') {
      window.__BOOKORA_EXPLORE_REFRESH__();
      return;
    }

    // Compatibility fallback for older ExplorePage builds: trigger exactly one
    // change event on the current sort control. No polling and no extra handlers.
    const sort = p.querySelector('#catalog-sort-select');
    if (sort) sort.dispatchEvent(new Event('change', { bubbles: true }));
  };

  window.addEventListener('bookora:catalog-updated', () => {
    requestAnimationFrame(refreshFromCatalog);
  }, { passive: true });

  // The initial route may be rendered before the module state has hydrated.
  // One delayed refresh is enough; never poll every few hundred milliseconds.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(refreshFromCatalog, 0), { once: true });
  } else {
    setTimeout(refreshFromCatalog, 0);
  }
})();
