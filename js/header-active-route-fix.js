// Bookora permanent header active-route fix v6.
// Exactly one navigation item is active and it always matches the currently open
// route in buyer, seller, and admin modes. More-specific routes always win.
(() => {
  'use strict';
  if (window.__BOOKORA_HEADER_ACTIVE_ROUTE_FIX_V6__) return;
  window.__BOOKORA_HEADER_ACTIVE_ROUTE_FIX_V6__ = true;

  const normalize = value => {
    let raw = String(value || '#/').trim();
    if (!raw || raw === '#') return '#/';
    raw = raw.split('?')[0];
    return raw.replace(/\/+$/, '') || '#/';
  };

  // Longest/specific routes must be checked before parent routes such as #/admin.
  const routes = [
    ['#/admin/settings', h => h === '#/admin/settings' || h.startsWith('#/admin/settings/')],
    ['#/admin/books', h => h === '#/admin/books' || h.startsWith('#/admin/books/')],
    ['#/admin/users', h => h === '#/admin/users' || h.startsWith('#/admin/users/')],
    ['#/admin/sellers', h => h === '#/admin/sellers' || h.startsWith('#/admin/sellers/')],
    ['#/admin/orders', h => h === '#/admin/orders' || h.startsWith('#/admin/orders/')],
    ['#/admin/subscriptions', h => h === '#/admin/subscriptions' || h.startsWith('#/admin/subscriptions/')],
    ['#/admin', h => h === '#/admin'],
    ['#/seller/wallet', h => h === '#/seller/wallet' || h.startsWith('#/seller/wallet/')],
    ['#/seller/dashboard', h => h === '#/seller' || h === '#/seller/dashboard' || h.startsWith('#/seller/dashboard/')],
    ['#/publish', h => h === '#/publish' || h.startsWith('#/publish/')],
    ['#/explore', h => h === '#/explore' || h.startsWith('#/explore/')],
    ['#/categories', h => h === '#/categories' || h.startsWith('#/categories/')],
    ['#/best-sellers', h => h === '#/best-sellers' || h.startsWith('#/best-sellers/')],
    ['#/new-releases', h => h === '#/new-releases' || h.startsWith('#/new-releases/')],
    ['#/pricing', h => h === '#/pricing' || h.startsWith('#/pricing/')],
    ['#/', h => h === '#/']
  ];

  const currentTarget = () => {
    const hash = normalize(window.location.hash || '#/');
    return routes.find(([, test]) => test(hash))?.[0] || null;
  };

  const apply = () => {
    const header = document.getElementById('main-header');
    if (!header) return;
    const target = currentTarget();
    const links = Array.from(header.querySelectorAll('a.nav-link'));
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

    // Keep mobile drawer navigation consistent with the desktop header.
    header.querySelectorAll('.mobile-drawer-link').forEach(link => {
      const href = normalize(link.getAttribute('href') || '');
      const active = !!target && href === target;
      link.classList.toggle('active', active);
      if (active) {
        link.setAttribute('aria-current', 'page');
        link.style.setProperty('background', '#EFF6FF', 'important');
        link.style.setProperty('color', '#2563EB', 'important');
        link.style.setProperty('font-weight', '700', 'important');
      } else {
        link.removeAttribute('aria-current');
        link.style.removeProperty('background');
        link.style.removeProperty('color');
        link.style.removeProperty('font-weight');
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
    // Observe only DOM insertion/replacement. Attribute changes are deliberately
    // excluded because this module changes classes/styles itself.
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
