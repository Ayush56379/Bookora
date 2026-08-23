// Bookora startup compatibility bridge.
// This file never changes application state, Firebase, fetch, or location.
// Its only job is to guarantee that the SPA performs its first route render.

const ensureBookoraRoute = () => {
  try {
    const appRoot = document.getElementById('app');
    if (!appRoot) return;

    const instance = window.__BOOKORA_APP_INSTANCE__;
    if (instance && typeof instance.route === 'function') {
      instance.route(true, false);
      return;
    }

    if (!appRoot.querySelector('#main-content')) {
      window.dispatchEvent(new Event('load'));
    }
  } catch (error) {
    console.error('[Bookora] Startup route bridge failed:', error);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(ensureBookoraRoute, 0);
  }, { once: true });
} else {
  setTimeout(ensureBookoraRoute, 0);
}

// One delayed safety pass handles slow module initialization without creating
// a reload loop or repeatedly replacing the live page.
setTimeout(ensureBookoraRoute, 800);

export {};
