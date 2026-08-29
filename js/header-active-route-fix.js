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
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    apply();
    return true;
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();

// Bookora Community Chat route bridge. Keeps the existing SPA architecture intact
// while adding a dedicated Firebase-to-Firebase user chat page.
(() => {
  'use strict';
  if (window.__BOOKORA_COMMUNITY_CHAT_BRIDGE__) return;
  window.__BOOKORA_COMMUNITY_CHAT_BRIDGE__ = true;

  const boot = () => {
    const app = window.__BOOKORA_APP_INSTANCE__;
    if (!app) return setTimeout(boot, 150);
    if (app.__communityChatPatched) return;
    app.__communityChatPatched = true;

    const originalLoadPage = app.loadPage.bind(app);
    app.loadPage = async (path, params) => {
      if (path === '/community-chat') {
        const m = await import('./pages/CommunityChatPage.js?v=20260829-1');
        return { html: m.renderCommunityChatPage(), init: m.initCommunityChatEvents };
      }
      return originalLoadPage(path, params);
    };

    const originalRoute = app.route.bind(app);
    app.route = async (force = false, navigation = false) => {
      const path = (window.location.hash || '#/').split('?')[0].replace(/^#/, '') || '/';
      if (path !== '/community-chat') return originalRoute(force, navigation);
      const firebaseUser = window.firebase?.auth?.()?.currentUser;
      if (!firebaseUser) return originalRoute(force, navigation);
      const wasAuthenticated = app.root?.dataset?.communityAuth || null;
      const oldAuth = window.__BOOKORA_STATE__?.isAuthenticated;
      // The state singleton is the same object used by SafeApp; locate it through
      // the loaded page module after Firebase auth has hydrated when possible.
      let stateObj = null;
      try { stateObj = (await import('./state.js')).state; } catch (_) {}
      const prev = stateObj?.isAuthenticated;
      if (stateObj) stateObj.isAuthenticated = true;
      try { return await originalRoute(force, navigation); }
      finally { if (stateObj && prev === false) stateObj.isAuthenticated = false; }
    };

    const injectNav = () => {
      const header = document.getElementById('main-header');
      if (!header) return;
      const nav = header.querySelector('.desktop-nav');
      if (!nav || nav.querySelector('[data-community-chat-link]')) return;
      if (document.querySelector('#community-chat-nav-style')) return addNav(nav);
      addNav(nav);
    };
    const addNav = nav => {
      const link = document.createElement('a');
      link.href = '#/community-chat';
      link.className = 'nav-link';
      link.dataset.communityChatLink = '1';
      link.textContent = 'Community';
      nav.appendChild(link);
      const style = document.createElement('style');
      style.id = 'community-chat-nav-style';
      style.textContent = '.community-chat-page{isolation:isolate}.community-chat-page .btn{font-weight:700}.community-chat-page [hidden]{display:none!important}';
      document.head.appendChild(style);
      setTimeout(injectNav, 0);
    };
    injectNav();
    new MutationObserver(injectNav).observe(document.body, { childList: true, subtree: true });
  };
  boot();
})();
