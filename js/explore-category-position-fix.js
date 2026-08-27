// Bookora Explore — place available category chips directly under the result count.
// Keeps Firebase-driven category data and active-state logic from the canonical filter runtime.
(() => {
  'use strict';
  if (window.__BOOKORA_EXPLORE_CATEGORY_POSITION_V8__) return;
  window.__BOOKORA_EXPLORE_CATEGORY_POSITION_V8__ = true;

  const style = () => {
    if (document.getElementById('bookora-explore-category-position-v8')) return;
    const s = document.createElement('style');
    s.id = 'bookora-explore-category-position-v8';
    s.textContent = `
      .explore-page .catalog-toolbar.bookora-category-toolbar-v8 {
        display: grid !important;
        grid-template-columns: minmax(0,1fr) auto !important;
        align-items: center !important;
        justify-content: initial !important;
        gap: 10px 16px !important;
      }
      .explore-page .catalog-toolbar.bookora-category-toolbar-v8 > #explore-category-chips {
        grid-column: 1 / -1 !important;
        grid-row: 2 !important;
        width: 100% !important;
        min-width: 0 !important;
        margin: 0 !important;
        padding: 0 1px 2px !important;
      }
      .explore-page .catalog-toolbar.bookora-category-toolbar-v8 > #explore-category-chips:empty {
        display: none !important;
      }
      @media (max-width: 680px) {
        .explore-page .catalog-toolbar.bookora-category-toolbar-v8 {
          grid-template-columns: 1fr !important;
        }
        .explore-page .catalog-toolbar.bookora-category-toolbar-v8 > #explore-category-chips {
          grid-row: auto !important;
        }
      }
    `;
    document.head.appendChild(s);
  };

  const move = () => {
    const page = document.querySelector('.explore-page');
    if (!page) return;
    const toolbar = page.querySelector('.catalog-toolbar');
    const chips = page.querySelector('#explore-category-chips');
    if (!toolbar || !chips) return;
    style();
    toolbar.classList.add('bookora-category-toolbar-v8');
    if (chips.parentElement !== toolbar) toolbar.appendChild(chips);
  };

  const run = () => requestAnimationFrame(move);
  window.addEventListener('hashchange', run, { passive: true });
  window.addEventListener('bookora:catalog-updated', run, { passive: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
  new MutationObserver(run).observe(document.body, { childList: true, subtree: true });
})();
