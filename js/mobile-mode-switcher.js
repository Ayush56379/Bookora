// Bookora startup compatibility bridge.
// Mobile mode switching remains disabled. This file only guarantees that the
// existing SPA performs its initial route render when DOMContentLoaded occurs.
// It MUST NOT override state.notify(), fetch(), location.reload(), or Firebase.

const bootBookoraRoute = () => {
  if (window.__BOOKORA_STARTUP_ROUTE_TRIGGERED__) return;
  window.__BOOKORA_STARTUP_ROUTE_TRIGGERED__ = true;

  setTimeout(() => {
    try {
      const appRoot = document.getElementById('app');
      if (!appRoot) return;
      if (!appRoot.querySelector('#main-content')) {
        window.dispatchEvent(new Event('load'));
      }
    } catch (error) {
      console.error('[Bookora] Startup route bridge failed:', error);
    }
  }, 0);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootBookoraRoute, { once: true });
} else {
  bootBookoraRoute();
}

export {};
