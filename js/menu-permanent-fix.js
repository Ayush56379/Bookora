// Bookora mobile/profile menu interaction stability fix.
// The SPA router is now responsible for lifecycle/data stability. This file
// must NOT override state.notify() or state.subscribe(), because global state
// patches can silently interfere with Firebase/auth/catalog events.

(() => {
  if (window.__BOOKORA_MENU_PERMANENT_FIX__) return;
  window.__BOOKORA_MENU_PERMANENT_FIX__ = true;

  const getDrawer = () => document.getElementById('mobile-nav-drawer');
  const getBackdrop = () => document.getElementById('mobile-drawer-backdrop');
  const getToggle = () => document.getElementById('mobile-nav-toggle-btn');

  const close = () => {
    const drawer = getDrawer();
    const backdrop = getBackdrop();
    drawer?.classList.remove('open');
    backdrop?.classList.remove('open');
    drawer?.setAttribute('aria-hidden', 'true');
    backdrop?.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('bookora-menu-open');
    document.body.classList.remove('bookora-menu-open');
    getToggle()?.setAttribute('aria-expanded', 'false');
    getToggle()?.setAttribute('aria-label', 'Open Navigation Drawer');
  };

  const open = () => {
    const drawer = getDrawer();
    const backdrop = getBackdrop();
    if (!drawer || !backdrop) return;
    drawer.classList.add('open');
    backdrop.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('bookora-menu-open');
    document.body.classList.add('bookora-menu-open');
    getToggle()?.setAttribute('aria-expanded', 'true');
    getToggle()?.setAttribute('aria-label', 'Close Navigation Drawer');
  };

  // Capture the menu toggle before other document-level click handlers.
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const toggle = target.closest('#mobile-nav-toggle-btn');
    if (toggle) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (getDrawer()?.classList.contains('open')) close();
      else open();
      return;
    }

    if (target.closest('#mobile-drawer-close-btn') || target.closest('#mobile-drawer-backdrop')) {
      event.preventDefault();
      close();
      return;
    }

    if (target.closest('.mobile-drawer-link')) close();
  }, true);

  window.addEventListener('hashchange', close, { passive: true });
  window.addEventListener('pageshow', close, { passive: true });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 930) close();
  }, { passive: true });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') close();
  });

  window.BookoraMenuSafety = Object.freeze({ open, close });
})();