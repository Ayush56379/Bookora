// Bookora startup compatibility bridge.
// This file never changes application state, Firebase, fetch, or location.
// The SPA now renders its first route directly from app.js, so this bridge is
// only a last-resort recovery path for a blank #app during slow module startup.

const ensureBookoraRoute = () => {
  try {
    const appRoot = document.getElementById('app');
    if (!appRoot) return;

    // app.js owns the normal boot path. Never force a second render when the
    // application has already produced the live page.
    if (appRoot.querySelector('#main-content')) return;

    const instance = window.__BOOKORA_APP_INSTANCE__;
    if (instance && typeof instance.route === 'function') {
      instance.route(true, false);
      return;
    }

    // Only use the browser load event as a true last fallback when the SPA
    // instance has not been created yet. This cannot create a repeating loop.
    window.dispatchEvent(new Event('load'));
  } catch (error) {
    console.error('[Bookora] Startup recovery failed:', error);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(ensureBookoraRoute, 0), { once: true });
} else {
  setTimeout(ensureBookoraRoute, 0);
}

setTimeout(ensureBookoraRoute, 1200);

export {};
