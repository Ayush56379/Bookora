// Bookora permanent header active-route fix.
// Exactly one navigation item is blue and it always matches the currently open route.
(() => {
  'use strict';
  if (window.__BOOKORA_HEADER_ACTIVE_ROUTE_FIX_V5__) return;
  window.__BOOKORA_HEADER_ACTIVE_ROUTE_FIX_V5__ = true;

  const normalize = value => {
    const raw = String(value || '#/').trim();
    if (!raw || raw === '#') return '#/';
    return raw.replace(/\/+$/, '') || '#/';
  };

  const routes = [
    ['#/', h => h === '#/'],
    ['#/explore', h => h === '#/explore' || h.startsWith('#/explore/') || h.startsWith('#/explore?')],
    ['#/categories', h => h === '#/categories' || h.startsWith('#/categories/') || h.startsWith('#/categories?')],
    ['#/best-sellers', h => h === '#/best-sellers' || h.startsWith('#/best-sellers/') || h.startsWith('#/best-sellers?')],
    ['#/new-releases', h => h === '#/new-releases' || h.startsWith('#/new-releases/') || h.startsWith('#/new-releases?')],
    ['#/pricing', h => h === '#/pricing' || h.startsWith('#/pricing/') || h.startsWith('#/pricing?')],
    ['#/admin', h => h === '#/admin' || h.startsWith('#/admin/') || h.startsWith('#/admin?')],
    ['#/seller/dashboard', h => h === '#/seller' || h === '#/seller/dashboard' || h.startsWith('#/seller/dashboard/') || h.startsWith('#/seller/dashboard?')],
    ['#/publish', h => h === '#/publish' || h.startsWith('#/publish/') || h.startsWith('#/publish?')],
    ['#/seller/wallet', h => h === '#/seller/wallet' || h.startsWith('#/seller/wallet/') || h.startsWith('#/seller/wallet?')]
  ];

  const currentTarget = () => {
    const hash = normalize(window.location.hash || '#/');
    return routes.find(([, test]) => test(hash))?.[0] || null;
  };

  const apply = () => {
    const header = document.getElementById('main-header');
    if (!header) return;
    const links = Array.from(header.querySelectorAll('a.nav-link'));
    if (!links.length) return;
    const target = currentTarget();
    links.forEach(link => {
      const href = normalize(link.getAttribute('href') || '');
      const active = !!target && href === target;
      link.classList.toggle('active', active);
      if (active) {
        link.setAttribute('aria-current', 'page');
        link.style.setProperty('background', '#EFF6FF', 'important');
        link.style.setProperty('color', '#2563EB', 'important');
        link.style.setProperty('font-weight', '700', 'important');
        link.style.setProperty('box-shadow', 'none', 'important');
      } else {
        link.removeAttribute('aria-current');
        link.style.removeProperty('background');
        link.style.removeProperty('color');
        link.style.removeProperty('font-weight');
        link.style.removeProperty('box-shadow');
      }
    });
  };

  let raf = 0;
  const schedule = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(apply);
  };

  const install = () => {
    if (!document.body) return false;
    window.addEventListener('hashchange', schedule, { passive: true });
    window.addEventListener('bookora:route-changed', schedule);
    window.addEventListener('bookora:header-rendered', schedule);
    document.addEventListener('click', event => {
      if (event.target?.closest?.('#main-header a.nav-link, #main-header .mobile-drawer-link')) schedule();
    }, true);
    // Observe only DOM insertion/replacement. Never observe attributes because
    // this module changes classes/styles itself.
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    apply();
    return true;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
