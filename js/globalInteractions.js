// Bookora global interaction bridge — lightweight and interaction-first.
import './admin-mode-persistence-hotfix.js';
import { state } from './state.js';

const MOBILE_BREAKPOINT = 930;
const get = id => document.getElementById(id);

function closeDrawer() {
  get('mobile-nav-drawer')?.classList.remove('open');
  get('mobile-drawer-backdrop')?.classList.remove('open');
  document.documentElement.classList.remove('bookora-menu-open');
  document.body.classList.remove('bookora-menu-open');
}

function navigateTo(value) {
  const target = String(value || '').trim();
  if (!target) return false;
  closeDrawer();
  if (target.startsWith('#/')) {
    if (window.location.hash !== target) window.location.hash = target;
    else window.dispatchEvent(new Event('hashchange'));
    return true;
  }
  if (target.startsWith('/') && !target.startsWith('//')) {
    window.location.hash = `#${target}`;
    return true;
  }
  if (/^https?:\/\//i.test(target)) { window.location.href = target; return true; }
  return false;
}

function installDataSyncStabilityGuard() {
  if (window.__BOOKORA_DATA_SYNC_GUARD__) return;
  window.__BOOKORA_DATA_SYNC_GUARD__ = true;
  const originalSubscribe = state.subscribe.bind(state);
  state.subscribe = callback => {
    let pending = null;
    let timer = null;
    const flush = () => {
      timer = null;
      if (!pending) return;
      const item = pending; pending = null;
      callback(item.event, item.payload, item.store);
    };
    return originalSubscribe((event, payload, store) => {
      if (event !== 'DATA_SYNCED') return callback(event, payload, store);
      pending = { event, payload, store };
      if (!timer) timer = setTimeout(flush, 250);
    });
  };
}

function install() {
  if (window.__BOOKORA_GLOBAL_INTERACTIONS__) return;
  window.__BOOKORA_GLOBAL_INTERACTIONS__ = true;
  installDataSyncStabilityGuard();

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const control = target?.closest('button,[role="button"]');
    if (!control || event.defaultPrevented) return;
    const route = control.dataset.route || control.dataset.navigate || control.dataset.href || control.getAttribute('data-url');
    if (!route) return;
    event.preventDefault();
    event.stopPropagation();
    navigateTo(route);
  }, { passive: false });

  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeDrawer(); });
  window.addEventListener('resize', () => { if (window.innerWidth > MOBILE_BREAKPOINT) closeDrawer(); }, { passive: true });
  window.addEventListener('hashchange', closeDrawer, { passive: true });

  // Do not observe documentElement/body. SPA page rendering mutates the DOM often;
  // a global MutationObserver here caused continuous synchronous work.
  window.addEventListener('bookora:header-ready', closeDrawer, { passive: true });

  if (!document.getElementById('bookora-search-button-clean-style')) {
    const style = document.createElement('style');
    style.id = 'bookora-search-button-clean-style';
    style.textContent = '.hero-search-box form > button[type="submit"]{display:none!important}.hero-search-box form{padding-right:20px!important}.hero-search-box form > input[type="text"]{min-width:0}';
    document.head.appendChild(style);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
else install();

export { closeDrawer, navigateTo };