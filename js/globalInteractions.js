// Bookora — global interaction safety + SPA stability bridge.
// Keep navigation SPA-only and prevent asynchronous data syncs from
// destroying an interaction that is currently being opened.

import { state } from './state.js';

const MOBILE_BREAKPOINT = 930;

function get(id) {
  return document.getElementById(id);
}

function closeDrawer() {
  const drawer = get('mobile-nav-drawer');
  const backdrop = get('mobile-drawer-backdrop');
  drawer?.classList.remove('open');
  backdrop?.classList.remove('open');
  document.documentElement.classList.remove('bookora-menu-open');
  document.body.classList.remove('bookora-menu-open');
}

function navigateTo(value) {
  const target = String(value || '').trim();
  if (!target) return false;

  // Bookora is a hash-based SPA. Never use window.location.href for an
  // internal route because that causes a full document reload.
  if (target.startsWith('#/')) {
    closeDrawer();
    if (window.location.hash !== target) window.location.hash = target;
    else window.dispatchEvent(new Event('hashchange'));
    return true;
  }

  // Convert common internal path values to SPA hashes as a safety net.
  if (target.startsWith('/') && !target.startsWith('//')) {
    closeDrawer();
    const hash = `#${target}`;
    if (window.location.hash !== hash) window.location.hash = hash;
    else window.dispatchEvent(new Event('hashchange'));
    return true;
  }

  // Explicit external URLs remain normal browser navigation.
  if (/^https?:\/\//i.test(target)) {
    window.location.href = target;
    return true;
  }

  return false;
}

function installDataSyncStabilityGuard() {
  if (window.__BOOKORA_DATA_SYNC_GUARD__) return;
  window.__BOOKORA_DATA_SYNC_GUARD__ = true;

  const originalSubscribe = state.subscribe.bind(state);

  state.subscribe = callback => {
    let pendingSync = null;
    let flushTimer = null;

    const drawerIsOpen = () => get('mobile-nav-drawer')?.classList.contains('open');

    const scheduleFlush = () => {
      if (flushTimer) return;
      flushTimer = setTimeout(() => {
        flushTimer = null;
        if (!pendingSync) return;
        if (drawerIsOpen()) {
          scheduleFlush();
          return;
        }
        const pending = pendingSync;
        pendingSync = null;
        callback(pending.event, pending.payload, pending.store);
      }, 250);
    };

    const wrappedCallback = (event, payload, store) => {
      if (event === 'DATA_SYNCED' && drawerIsOpen()) {
        // Do not let the async catalog sync re-render the entire SPA while
        // the user is opening the mobile drawer. Render the fresh catalog
        // only after the drawer has actually closed.
        pendingSync = { event, payload, store };
        scheduleFlush();
        return;
      }
      callback(event, payload, store);
    };

    return originalSubscribe(wrappedCallback);
  };
}

function installGlobalInteractions() {
  if (window.__BOOKORA_GLOBAL_INTERACTIONS__) return;
  window.__BOOKORA_GLOBAL_INTERACTIONS__ = true;

  installDataSyncStabilityGuard();

  // Only provide a fallback for buttons that explicitly declare a route.
  // Normal <a href="#/..."> links remain owned by the SPA router in app.js.
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target || event.defaultPrevented) return;

    const control = target.closest('button,[role="button"]');
    if (!control) return;

    const route = control.dataset.route || control.dataset.navigate || control.dataset.href || control.getAttribute('data-url');
    if (!route) return;

    event.preventDefault();
    event.stopPropagation();
    navigateTo(route);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeDrawer();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > MOBILE_BREAKPOINT) closeDrawer();
  }, { passive: true });

  window.addEventListener('hashchange', () => {
    // Route changes are allowed to close the drawer; the router owns the
    // actual render. This handler only removes stale scroll locking.
    closeDrawer();
  });

  const observer = new MutationObserver(() => {
    const drawer = get('mobile-nav-drawer');
    const backdrop = get('mobile-drawer-backdrop');
    if (!drawer || !backdrop) closeDrawer();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Clean mobile hero search action: icon-only button, no blue "Search" text.
  if (!document.getElementById('bookora-search-button-clean-style')) {
    const style = document.createElement('style');
    style.id = 'bookora-search-button-clean-style';
    style.textContent = `
      .hero-search-box form > button[type="submit"] {
        position: relative;
        flex: 0 0 48px;
        width: 48px;
        min-width: 48px;
        height: 48px;
        padding: 0 !important;
        margin: 0;
        font-size: 0 !important;
        line-height: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px !important;
      }
      .hero-search-box form > button[type="submit"]::before {
        content: "";
        width: 15px;
        height: 15px;
        border: 2px solid currentColor;
        border-radius: 50%;
        box-sizing: border-box;
        display: block;
      }
      .hero-search-box form > button[type="submit"]::after {
        content: "";
        position: absolute;
        width: 7px;
        height: 2px;
        background: currentColor;
        border-radius: 2px;
        transform: translate(7px, 7px) rotate(45deg);
        transform-origin: left center;
      }
      .hero-search-box form > button[type="submit"]:focus-visible {
        outline: 3px solid rgba(37, 99, 235, 0.25);
        outline-offset: 2px;
      }
      @media (max-width: 600px) {
        .hero-search-box form > button[type="submit"] {
          flex-basis: 46px;
          width: 46px;
          min-width: 46px;
          height: 46px;
        }
      }
    `;
    document.head.appendChild(style);
  }

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

export { closeDrawer, navigateTo };
