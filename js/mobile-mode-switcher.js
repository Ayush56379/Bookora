// Mobile mode switcher enhancement
// Keeps Buyer / Seller / Admin switching available inside the mobile drawer.
import { state } from './state.js';
import { renderModeSwitcher, initModeSwitcherEvents } from './components/ModeSwitcher.js';

function mountMobileModeSwitcher() {
  const drawer = document.getElementById('mobile-nav-drawer');
  if (!drawer || !state.isAuthenticated) return;

  let host = drawer.querySelector('[data-mobile-mode-host]');
  if (!host) {
    host = document.createElement('div');
    host.setAttribute('data-mobile-mode-host', 'true');
    host.className = 'mobile-mode-switcher-section';
    drawer.prepend(host);
  }

  host.innerHTML = `
    <div class="mobile-mode-switcher-title">CURRENT MODE</div>
    <div class="mobile-mode-switcher-control">${renderModeSwitcher()}</div>
  `;

  initModeSwitcherEvents();
}

function scheduleMount() {
  requestAnimationFrame(() => setTimeout(mountMobileModeSwitcher, 0));
}

const observer = new MutationObserver(scheduleMount);

function start() {
  const drawer = document.getElementById('mobile-nav-drawer');
  if (drawer) {
    observer.observe(drawer, { childList: true, subtree: true });
    mountMobileModeSwitcher();
  }
  scheduleMount();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
  start();
}

state.subscribe((event) => {
  if (event === 'USER_LOGGED_IN' || event === 'DATA_SYNCED' || event === 'AUTH_STATE_CHANGED' || event === 'MODE_CHANGED') {
    scheduleMount();
  }
});
