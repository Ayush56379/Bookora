// Bookora — global interaction safety + SPA click bridge.
// This file is loaded before the SPA and survives route replacements.

const MOBILE_BREAKPOINT = 930;
const get = id => document.getElementById(id);

function setDrawer(open) {
  const drawer = get('mobile-nav-drawer');
  const backdrop = get('mobile-drawer-backdrop');
  const toggle = get('mobile-nav-toggle-btn');

  if (!drawer || !backdrop) {
    document.documentElement.classList.remove('bookora-menu-open');
    document.body.classList.remove('bookora-menu-open');
    return;
  }

  drawer.classList.toggle('open', open);
  backdrop.classList.toggle('open', open);
  drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
  backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
  if (toggle) {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close Navigation Drawer' : 'Open Navigation Drawer');
  }
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

function navigateTo(value) {
  if (!value) return false;
  const target = String(value).trim();
  if (!target) return false;

  // Internal SPA route.
  if (target.startsWith('#/')) {
    closeDrawer();
    if (window.location.hash !== target) window.location.hash = target;
    else window.dispatchEvent(new Event('hashchange'));
    return true;
  }

  // Relative internal page.
  if (target.startsWith('/') && !target.startsWith('//')) {
    closeDrawer();
    window.location.href = target;
    return true;
  }

  // External URL explicitly supplied by a component.
  if (/^https?:\/\//i.test(target)) {
    closeDrawer();
    window.location.href = target;
    return true;
  }

  return false;
}

function installGlobalInteractions() {
  if (window.__BOOKORA_GLOBAL_INTERACTIONS__) return;
  window.__BOOKORA_GLOBAL_INTERACTIONS__ = true;

  /* CAPTURE: only mobile drawer controls are intercepted here. */
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
  }, true);

  /* BUBBLE: route buttons that expose an explicit navigation attribute get a
     reliable fallback. Existing page handlers still run first and can call
     preventDefault(), so this does not replace page-specific functionality. */
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target || event.defaultPrevented) return;

    const control = target.closest('button,[role="button"],a');
    if (!control) return;

    if (control.matches('a[href^="#/"]')) {
      // Native hash navigation is normally enough. This only closes a stale
      // drawer so the next page is immediately interactive.
      closeDrawer();
      return;
    }

    if (control.matches('button,[role="button"]')) {
      const route = control.dataset.route || control.dataset.navigate || control.dataset.href || control.getAttribute('data-url');
      if (route) navigateTo(route);
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeDrawer();
    if ((event.key === 'Enter' || event.key === ' ') && event.target?.id === 'mobile-nav-toggle-btn') {
      event.preventDefault();
      toggleDrawer();
    }
  });

  window.addEventListener('hashchange', closeDrawer);
  window.addEventListener('resize', () => {
    if (window.innerWidth > MOBILE_BREAKPOINT) closeDrawer();
  }, { passive: true });

  /* If a route replaces the header while the drawer is open, clear stale
     scroll locking and backdrop state immediately. */
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

export { closeDrawer, setDrawer, toggleDrawer, navigateTo };
