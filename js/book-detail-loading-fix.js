// Bookora direct-detail loading guard.
// Prevents a false "eBook Not Found" screen while the public catalog is
// still loading. The normal router replaces the loading state after DATA_SYNCED.
import { state } from './state.js';

(() => {
  'use strict';

  const isBookRoute = () => (window.location.hash || '').split('?')[0].startsWith('#/book/');

  function showLoadingIfCatalogPending() {
    if (!isBookRoute()) return;
    if (state.getBookBySlug(window.location.hash.split('?')[0].slice(7))) return;
    if (state.booksLoaded && !state.booksLoading) return;

    const main = document.getElementById('main-content');
    if (!main) return;
    const text = String(main.textContent || '');
    if (!text.includes('eBook Not Found')) return;

    main.innerHTML = `
      <section style="min-height:420px;display:flex;align-items:center;justify-content:center;padding:4rem 1.5rem;background:var(--bg-secondary,#f8fafc);">
        <div style="text-align:center;max-width:520px;">
          <div style="width:46px;height:46px;border:4px solid #dbeafe;border-top-color:#2563eb;border-radius:50%;animation:bookora-detail-spin .8s linear infinite;margin:0 auto 1.25rem;"></div>
          <h2 style="font-size:1.6rem;font-weight:800;color:var(--text-primary,#0f172a);margin:0 0 .5rem;">Loading eBook…</h2>
          <p style="color:var(--text-secondary,#475569);margin:0;line-height:1.6;">Loading the latest publication details. Please wait a moment.</p>
        </div>
      </section>`;

    if (!document.getElementById('bookora-detail-spin-style')) {
      const style = document.createElement('style');
      style.id = 'bookora-detail-spin-style';
      style.textContent = '@keyframes bookora-detail-spin{to{transform:rotate(360deg)}}';
      document.head.appendChild(style);
    }
  }

  state.subscribe(event => {
    if (event === 'DATA_SYNCED' || event === 'USER_LOGGED_IN') {
      // Let the core router render the real detail page first.
      requestAnimationFrame(() => {
        if (isBookRoute()) window.dispatchEvent(new Event('hashchange'));
      });
    }
  });

  window.addEventListener('hashchange', () => setTimeout(showLoadingIfCatalogPending, 0));
  window.addEventListener('load', () => setTimeout(showLoadingIfCatalogPending, 0));
  new MutationObserver(() => showLoadingIfCatalogPending()).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(showLoadingIfCatalogPending, 0);
})();
