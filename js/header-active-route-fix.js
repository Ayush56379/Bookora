// Bookora permanent header active-route fix.
// Buyer navigation must have exactly ONE active item, matching the current SPA hash.
(() => {
  'use strict';
  if (window.__BOOKORA_HEADER_ACTIVE_ROUTE_FIX_V2__) return;
  window.__BOOKORA_HEADER_ACTIVE_ROUTE_FIX_V2__ = true;

  const normalize = value => {
    const raw = String(value || '#/').trim();
    if (!raw || raw === '#') return '#/';
    return raw.replace(/\/+$/, '') || '#/';
  };

  const buyerRoutes = [
    ['#/', h => h === '#/'],
    ['#/explore', h => h === '#/explore' || h.startsWith('#/explore/') || h.startsWith('#/explore?')],
    ['#/categories', h => h === '#/categories' || h.startsWith('#/categories/') || h.startsWith('#/categories?')],
    ['#/best-sellers', h => h === '#/best-sellers' || h.startsWith('#/best-sellers/') || h.startsWith('#/best-sellers?')],
    ['#/new-releases', h => h === '#/new-releases' || h.startsWith('#/new-releases/') || h.startsWith('#/new-releases?')],
    ['#/pricing', h => h === '#/pricing' || h.startsWith('#/pricing/') || h.startsWith('#/pricing?')]
  ];

  const getCurrentTarget = () => {
    const hash = normalize(window.location.hash || '#/');
    return buyerRoutes.find(([, test]) => test(hash))?.[0] || null;
  };

  const applyBuyerState = () => {
    const header = document.getElementById('main-header');
    if (!header) return;
    const nav = header.querySelector('.desktop-nav');
    if (!nav) return;

    // Seller/Admin nav does not contain the buyer Home link.
    if (!nav.querySelector('a.nav-link[href="#/"]')) return;

    const target = getCurrentTarget();
    if (!target) return;

    Array.from(nav.querySelectorAll('a.nav-link')).forEach(link => {
      const href = normalize(link.getAttribute('href') || '');
      const active = href === target;
      link.classList.remove('active');
      link.removeAttribute('aria-current');
      link.style.removeProperty('background');
      link.style.removeProperty('color');
      link.style.removeProperty('font-weight');
      link.style.removeProperty('box-shadow');

      if (active) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
        link.style.setProperty('background', '#EFF6FF', 'important');
        link.style.setProperty('color', '#2563EB', 'important');
        link.style.setProperty('font-weight', '700', 'important');
      }
    });
  };

  let raf = 0;
  const schedule = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      applyBuyerState();
      setTimeout(applyBuyerState, 0);
    });
  };

  window.addEventListener('hashchange', schedule, { passive: true });
  window.addEventListener('bookora:route-changed', schedule);
  window.addEventListener('bookora:header-rendered', schedule);
  document.addEventListener('click', event => {
    if (event.target?.closest?.('#main-header a.nav-link, #main-header .mobile-drawer-link')) setTimeout(applyBuyerState, 0);
  }, true);

  const observer = new MutationObserver(() => {
    if (document.getElementById('main-header')) schedule();
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'href'] });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyBuyerState, { once: true });
  else applyBuyerState();
})();
