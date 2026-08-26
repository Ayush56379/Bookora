// Bookora header active-route fix
// Keeps the navigation highlight synchronized with the actual SPA hash route,
// including routes that previously had no active-state expression.
(() => {
  'use strict';
  if (window.__BOOKORA_HEADER_ACTIVE_ROUTE_FIX__) return;
  window.__BOOKORA_HEADER_ACTIVE_ROUTE_FIX__ = true;

  const normalize = value => {
    const raw = String(value || '#/').trim();
    if (!raw || raw === '#') return '#/';
    return raw.replace(/\/+$/, '') || '#/';
  };

  const routeMatches = (href, hash) => {
    const target = normalize(href);
    const current = normalize(hash);
    if (target === '#/') return current === '#/';
    // Exact route for normal top-level navigation; nested routes stay active
    // under their parent (e.g. /explore?... or /categories/foo).
    return current === target || current.startsWith(`${target}/`) || current.startsWith(`${target}?`);
  };

  const sync = () => {
    const current = normalize(window.location.hash || '#/');
    document.querySelectorAll('#main-header a.nav-link, .mobile-drawer-link').forEach(link => {
      const href = link.getAttribute('href') || '';
      if (!href.startsWith('#/')) return;
      const active = routeMatches(href, current);
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  };

  const schedule = () => requestAnimationFrame(sync);

  window.addEventListener('hashchange', schedule);
  window.addEventListener('bookora:route-changed', schedule);
  window.addEventListener('bookora:header-rendered', schedule);

  const observer = new MutationObserver(() => {
    if (document.querySelector('#main-header')) schedule();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('click', event => {
    const link = event.target?.closest?.('#main-header a.nav-link, #main-header .mobile-drawer-link');
    if (!link) return;
    setTimeout(sync, 0);
  }, true);

  sync();
})();
