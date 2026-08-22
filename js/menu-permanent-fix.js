// Bookora mobile/profile menu permanent stability fix.
// Prevents Firebase session/catalog state events from rebuilding the header
// while the user is interacting with a menu. The old router called
// updateHeader() for every state event, which replaced the DOM node containing
// the open menu and made it look like the menu was refreshing repeatedly.

(() => {
  if (window.__BOOKORA_MENU_PERMANENT_FIX__) return;
  window.__BOOKORA_MENU_PERMANENT_FIX__ = true;

  // The app's state module is already loaded before this file (index.html
  // loads this fix immediately after app.js). Patch notify after startup so
  // repeated background hydration events cannot trigger the router/header.
  import('./state.js').then(({ state }) => {
    if (!state || state.__bookoraMenuNotifyPatched) return;
    state.__bookoraMenuNotifyPatched = true;

    const originalNotify = state.notify.bind(state);
    let initialDataSyncDelivered = false;

    state.notify = (event, payload = null) => {
      const hasRenderedApp = !!document.querySelector('#main-content');

      // Once the SPA has rendered, repeated catalog/session hydration must not
      // rebuild the header. This is the main source of the visible refresh.
      if (hasRenderedApp && event === 'DATA_SYNCED') {
        if (!initialDataSyncDelivered) initialDataSyncDelivered = true;
        return;
      }

      // AUTH_STATE_CHANGED is only a low-level Firebase hydration signal.
      // USER_LOGGED_IN / USER_LOGGED_OUT already handle the actual UI route.
      // Suppress it after the first page render so it cannot replace an open
      // profile/menu DOM tree.
      if (hasRenderedApp && event === 'AUTH_STATE_CHANGED') return;

      if (event === 'DATA_SYNCED') initialDataSyncDelivered = true;
      return originalNotify(event, payload);
    };
  }).catch(error => {
    console.warn('[Menu stability] state notify patch skipped:', error);
  });

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
