// Bookora — global interaction safety + SPA stability bridge.
// Keep navigation SPA-only and prevent asynchronous data syncs from
// destroying an interaction that is currently being opened.

import './admin-mode-persistence-hotfix.js';
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
  if (target.startsWith('#/')) {
    closeDrawer();
    if (window.location.hash !== target) window.location.hash = target;
    else window.dispatchEvent(new Event('hashchange'));
    return true;
  }
  if (target.startsWith('/') && !target.startsWith('//')) {
    closeDrawer();
    const hash = `#${target}`;
    if (window.location.hash !== hash) window.location.hash = hash;
    else window.dispatchEvent(new Event('hashchange'));
    return true;
  }
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
        if (drawerIsOpen()) { scheduleFlush(); return; }
        const pending = pendingSync;
        pendingSync = null;
        callback(pending.event, pending.payload, pending.store);
      }, 250);
    };
    const wrappedCallback = (event, payload, store) => {
      if (event === 'DATA_SYNCED' && drawerIsOpen()) {
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
  window.addEventListener('hashchange', closeDrawer);

  const observer = new MutationObserver(() => {
    const drawer = get('mobile-nav-drawer');
    const backdrop = get('mobile-drawer-backdrop');
    if (!drawer || !backdrop) closeDrawer();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Completely remove the blue hero search submit control.
  if (!document.getElementById('bookora-search-button-clean-style')) {
    const style = document.createElement('style');
    style.id = 'bookora-search-button-clean-style';
    style.textContent = `
      .hero-search-box form > button[type="submit"] { display: none !important; }
      .hero-search-box form { padding-right: 20px !important; }
      .hero-search-box form > input[type="text"] { min-width: 0; }
    `;
    document.head.appendChild(style);
  }

  window.addEventListener('error', event => console.error('[Bookora] Runtime error:', event.error || event.message));
  window.addEventListener('unhandledrejection', event => console.error('[Bookora] Unhandled promise rejection:', event.reason));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installGlobalInteractions, { once: true });
else installGlobalInteractions();

export { closeDrawer, navigateTo };