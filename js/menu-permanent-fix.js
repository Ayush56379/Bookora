// Bookora mobile menu permanent stability fix.
// Prevents the first tap from being lost when auth/catalog state refreshes
// re-renders the header immediately after the menu opens.

(() => {
  if (window.__BOOKORA_MENU_PERMANENT_FIX__) return;
  window.__BOOKORA_MENU_PERMANENT_FIX__ = true;

  let menuIntent = false;
  let suppressIntentUntil = 0;

  const getDrawer = () => document.getElementById('mobile-nav-drawer');
  const getBackdrop = () => document.getElementById('mobile-drawer-backdrop');

  const applyOpen = () => {
    if (!menuIntent || Date.now() < suppressIntentUntil) return;
    const drawer = getDrawer();
    const backdrop = getBackdrop();
    if (!drawer || !backdrop) return;
    drawer.classList.add('open');
    backdrop.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    backdrop.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('bookora-menu-open');
    document.body.classList.add('bookora-menu-open');
    const toggle = document.getElementById('mobile-nav-toggle-btn');
    toggle?.setAttribute('aria-expanded', 'true');
    toggle?.setAttribute('aria-label', 'Close Navigation Drawer');
  };

  const close = () => {
    menuIntent = false;
    suppressIntentUntil = Date.now() + 250;
    const drawer = getDrawer();
    const backdrop = getBackdrop();
    drawer?.classList.remove('open');
    backdrop?.classList.remove('open');
    drawer?.setAttribute('aria-hidden', 'true');
    backdrop?.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('bookora-menu-open');
    document.body.classList.remove('bookora-menu-open');
    const toggle = document.getElementById('mobile-nav-toggle-btn');
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', 'Open Navigation Drawer');
  };

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    if (target.closest('#mobile-nav-toggle-btn')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const drawer = getDrawer();
      const isOpen = !!drawer?.classList.contains('open');
      if (isOpen || menuIntent) close();
      else {
        menuIntent = true;
        suppressIntentUntil = 0;
        applyOpen();
        requestAnimationFrame(applyOpen);
        setTimeout(applyOpen, 0);
        setTimeout(applyOpen, 50);
        setTimeout(applyOpen, 150);
      }
      return;
    }

    if (target.closest('#mobile-drawer-close-btn') || target.closest('#mobile-drawer-backdrop')) {
      close();
      return;
    }

    if (target.closest('.mobile-drawer-link')) {
      close();
      return;
    }
  }, true);

  window.addEventListener('hashchange', close, { passive: true });

  const observer = new MutationObserver(() => {
    if (menuIntent) {
      applyOpen();
      setTimeout(applyOpen, 0);
    }
  });

  const startObserver = () => observer.observe(document.body, { childList: true, subtree: true });
  if (document.body) startObserver();
  else document.addEventListener('DOMContentLoaded', startObserver, { once: true });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 930) close();
  }, { passive: true });
})();
