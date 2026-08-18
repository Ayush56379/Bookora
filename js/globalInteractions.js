// Bookora global interaction safety layer.
// This module is intentionally independent from individual page modules so one
// page-specific initialization failure cannot break navigation or the mobile menu.

const MOBILE_BREAKPOINT = 930;

function get(id) {
  return document.getElementById(id);
}

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

  // Capture clicks so the mobile menu continues to work even when a page
  // component is rendered/replaced by the SPA router.
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const toggle = target.closest('#mobile-nav-toggle-btn');
    if (toggle) {
      event.preventDefault();
      event.stopPropagation();
      toggleDrawer();
      return;
    }

    if (target.closest('#mobile-drawer-close-btn,#mobile-drawer-backdrop')) {
      event.preventDefault();
      event.stopPropagation();
      closeDrawer();
      return;
    }

    const drawerLink = target.closest('#mobile-nav-drawer a');
    if (drawerLink) {
      // Allow the anchor's normal hash navigation, but close the drawer first.
      closeDrawer();
    }
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeDrawer();
  });

  // Close the drawer whenever the SPA route changes.
  window.addEventListener('hashchange', closeDrawer);
  window.addEventListener('resize', () => {
    if (window.innerWidth > MOBILE_BREAKPOINT) closeDrawer();
  }, { passive: true });

  // A defensive cleanup for stale overlay state after route replacement.
  const observer = new MutationObserver(() => {
    const backdrop = get('mobile-drawer-backdrop');
    const drawer = get('mobile-nav-drawer');
    if (!backdrop || !drawer) return;
    if (!drawer.classList.contains('open')) {
      backdrop.classList.remove('open');
      backdrop.setAttribute('aria-hidden', 'true');
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Report runtime errors without preventing normal interaction. This is
  // deliberately diagnostic only; page modules remain responsible for their
  // own business actions.
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

export { closeDrawer, setDrawer };
