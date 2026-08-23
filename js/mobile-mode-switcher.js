// Bookora startup + runtime stability compatibility bridge.
// Mobile mode switching remains permanently disabled.
// Never import language-runtime.js from this file.
//
// IMPORTANT: this bridge must not synthesize a repeating browser load cycle.
// It starts the existing SPA once after DOM readiness, then keeps asynchronous
// catalog synchronization from replacing the live page and destroying the
// event handlers installed by page/runtime modules.

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

const protectLivePageFromSyncRerender = async () => {
  try {
    const module = await import('./state.js');
    const state = module?.state;
    if (!state || state.__BOOKORA_SYNC_STABILITY_PATCHED__) return;

    const originalNotify = state.notify.bind(state);
    state.notify = (event, payload = null) => {
      if (event === 'DATA_SYNCED') {
        state.subscribers.forEach(callback => {
          try { callback('CATALOG_UPDATED', payload, state); }
          catch (error) { console.error('[Bookora] State subscriber error:', error); }
        });
        window.dispatchEvent(new CustomEvent('bookora:catalog-updated', { detail: payload }));
        return;
      }
      originalNotify(event, payload);
    };

    state.__BOOKORA_SYNC_STABILITY_PATCHED__ = true;
  } catch (error) {
    console.warn('[Bookora] Sync stability bridge skipped:', error);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootBookoraRoute, { once: true });
} else {
  bootBookoraRoute();
}

protectLivePageFromSyncRerender();

export {};
