// Bookora permanent header active-route fix.
// Buyer navigation must have exactly ONE active item, matching the current SPA hash.
(() => {
  'use strict';
  if (window.__BOOKORA_HEADER_ACTIVE_ROUTE_FIX_V3__) return;
  window.__BOOKORA_HEADER_ACTIVE_ROUTE_FIX_V3__ = true;

  const normalize = value => {
    const raw = String(value || '').trim();
    if (!raw || raw === '#') return '#/';
    return raw.replace(/\/+$/, '') || '#/';
  };

  const getCurrentTarget = () => {
    const hash = normalize(window.location.hash);
    if (hash === '#/' || hash === '#/home' || hash.startsWith('#/home?') || hash.startsWith('#/home/')) return '#/';
    if (hash === '#/explore' || hash.startsWith('#/explore/') || hash.startsWith('#/explore?')) return '#/explore';
    if (hash === '#/categories' || hash.startsWith('#/categories/') || hash.startsWith('#/categories?')) return '#/categories';
    if (hash === '#/best-sellers' || hash.startsWith('#/best-sellers/') || hash.startsWith('#/best-sellers?')) return '#/best-sellers';
    if (hash === '#/new-releases' || hash.startsWith('#/new-releases/') || hash.startsWith('#/new-releases?')) return '#/new-releases';
    if (hash === '#/pricing' || hash.startsWith('#/pricing/') || hash.startsWith('#/pricing?')) return '#/pricing';
    return null;
  };

  const applyBuyerState = () => {
    const header = document.getElementById('main-header');
    if (!header) return;
    const nav = header.querySelector('.desktop-nav');
    if (!nav) return;
    const homeLink = nav.querySelector('a.nav-link[href="#/"]');
    if (!homeLink) return;

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
    if (event.target?.closest?.('#main-header a.nav-link, #main-header .mobile-drawer-link')) setTimeout(schedule, 0);
  }, true);

  const observer = new MutationObserver(() => {
    if (document.getElementById('main-header')) schedule();
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'href'] });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyBuyerState, { once: true });
  else applyBuyerState();
})();
