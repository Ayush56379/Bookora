/* Bookora final interaction guard.
   Runs after the SPA is loaded and protects every route from stale mobile
   overlays while providing a safe fallback for explicit route buttons. */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  function closeMobileLayers() {
    const drawer = $('mobile-nav-drawer');
    const backdrop = $('mobile-drawer-backdrop');
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    document.documentElement.classList.remove('bookora-menu-open');
    document.body.classList.remove('bookora-menu-open');
    if (drawer) drawer.setAttribute('aria-hidden', 'true');
    if (backdrop) backdrop.setAttribute('aria-hidden', 'true');
    const toggle = $('mobile-nav-toggle-btn');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open Navigation Drawer');
    }
  }

  function go(value) {
    const valueText = String(value || '').trim();
    if (!valueText) return false;
    closeMobileLayers();
    if (valueText.startsWith('#/')) {
      if (location.hash === valueText) window.dispatchEvent(new Event('hashchange'));
      else location.hash = valueText;
      return true;
    }
    if (valueText.startsWith('/') && !valueText.startsWith('//')) {
      location.href = valueText;
      return true;
    }
    if (/^https?:\/\//i.test(valueText)) {
      location.href = valueText;
      return true;
    }
    return false;
  }

  /* A route change must always leave the next page completely clickable. */
  window.addEventListener('hashchange', closeMobileLayers, { passive: true });
  window.addEventListener('pageshow', closeMobileLayers, { passive: true });

  /* If a route replacement removes the drawer, remove stale body locking. */
  new MutationObserver(() => {
    if (!$('mobile-nav-drawer') || !$('mobile-drawer-backdrop')) closeMobileLayers();
  }).observe(document.documentElement, { childList: true, subtree: true });

  /* Delegated fallback for explicit navigation controls. Existing handlers
     still work normally; only buttons that declare a route are bridged. */
  document.addEventListener('click', event => {
    if (event.defaultPrevented) return;
    const element = event.target instanceof Element ? event.target.closest('button,[role="button"]') : null;
    if (!element) return;

    const route = element.dataset.route || element.dataset.navigate || element.dataset.href || element.getAttribute('data-url');
    if (route) go(route);
  });

  /* Keep native SPA anchors reliable after any component re-render. */
  document.addEventListener('click', event => {
    if (event.defaultPrevented) return;
    const anchor = event.target instanceof Element ? event.target.closest('a[href^="#/"]') : null;
    if (!anchor) return;
    closeMobileLayers();
  });

  /* Make keyboard activation equivalent to a real click for explicit route
     buttons without changing normal form/button behavior. */
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || (event.key !== 'Enter' && event.key !== ' ')) return;
    const element = event.target instanceof Element ? event.target.closest('button,[role="button"]') : null;
    if (!element) return;
    const route = element.dataset.route || element.dataset.navigate || element.dataset.href || element.getAttribute('data-url');
    if (!route) return;
    event.preventDefault();
    go(route);
  });

  window.BookoraClickSafety = Object.freeze({ closeMobileLayers, go });
})();
