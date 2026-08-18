// Bookora global interaction safety layer.
// Keeps global navigation reliable across SPA route replacements.

const MOBILE_BREAKPOINT = 930;

const get = id => document.getElementById(id);

function setDrawer(open) {
  const drawer = get('mobile-nav-drawer');
  const backdrop = get('mobile-drawer-backdrop');
  const toggle = get('mobile-nav-toggle-btn');
  if (!drawer || !backdrop) return;

  drawer.classList.toggle('open', open);
  backdrop.classList.toggle('open', open);
  drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
  backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
  if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  document.documentElement.classList.toggle('bookora-menu-open', open);
  document.body.classList.toggle('bookora-menu-open', open);
}

function toggleDrawer() {
  const drawer = get('mobile-nav-drawer');
  setDrawer(!drawer?.classList.contains('open'));
}

function closeDrawer() {
  setDrawer(false);
}

function installGlobalInteractions() {
  if (window.__BOOKORA_GLOBAL_INTERACTIONS__) return;
  window.__BOOKORA_GLOBAL_INTERACTIONS__ = true;

  /*
   * One delegated handler is deliberately used instead of binding listeners
   * to individual header elements. The SPA replaces the header on every
   * route, so direct listeners can become stale.
   *
   * This is a CAPTURE listener only for the mobile drawer controls. It does
   * not intercept ordinary buttons, anchors, forms, inputs, or page clicks.
   */
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const toggle = target.closest('#mobile-nav-toggle-btn');
    if (toggle) {
      event.preventDefault();
      event.stopImmediatePropagation();
      toggleDrawer();
      return;
    }

    const close = target.closest('#mobile-drawer-close-btn');
    if (close) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeDrawer();
      return;
    }

    const backdrop = target.closest('#mobile-drawer-backdrop');
    if (backdrop) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeDrawer();
      return;
    }

    const drawerLink = target.closest('#mobile-nav-drawer a');
    if (drawerLink) closeDrawer();
    // IMPORTANT: ordinary clicks are intentionally allowed to continue to
    // the page's own event handlers and native anchor behavior.
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeDrawer();
    if (event.key === 'Enter' && event.target?.id === 'mobile-nav-toggle-btn') {
      event.preventDefault();
      toggleDrawer();
    }
  });

  window.addEventListener('hashchange', closeDrawer);
  window.addEventListener('resize', () => {
    if (window.innerWidth > MOBILE_BREAKPOINT) closeDrawer();
  }, { passive: true });

  // Safety: if a route replaces the header while the drawer is open, remove
  // stale scroll locking and stale backdrop state.
  const observer = new MutationObserver(() => {
    const drawer = get('mobile-nav-drawer');
    const backdrop = get('mobile-drawer-backdrop');
    if (!drawer || !backdrop) {
      document.documentElement.classList.remove('bookora-menu-open');
      document.body.classList.remove('bookora-menu-open');
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('error', event => {
    console.error('[Bookora] Runtime error:', event.error || event.message);
  });
  window.addEventListener('unhandledrejection', event => {
    console.error('[Bookora] Unhandled promise rejection:', event.reason);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installGlobalInteractions, { once: true });
} else {
  installGlobalInteractions();
}

export { closeDrawer, setDrawer, toggleDrawer };
