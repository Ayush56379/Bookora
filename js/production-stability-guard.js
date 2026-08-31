/* Bookora production stability guard: defensive runtime, no data/schema changes. */
(() => {
  const TIMEOUT = 15000;
  const originalFetch = window.fetch?.bind(window);
  if (originalFetch && !window.__BOOKORA_STABILITY_FETCH_GUARD__) {
    window.__BOOKORA_STABILITY_FETCH_GUARD__ = true;
    window.fetch = (input, init = {}) => {
      if (init.signal) return originalFetch(input, init);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT);
      return originalFetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
    };
  }

  window.addEventListener('error', event => {
    console.error('[Bookora stability guard]', event.error || event.message);
    const main = document.getElementById('main-content');
    if (main && !main.children.length) {
      main.innerHTML = '<div role="alert" style="min-height:60vh;display:grid;place-items:center;text-align:center;padding:40px 20px;font-family:Inter,system-ui,sans-serif;color:#334155"><div><strong style="display:block;font-size:20px;margin-bottom:8px">This page could not be loaded.</strong><span style="display:block;font-size:14px;color:#64748b">Please try again.</span></div></div>';
    }
  });
  window.addEventListener('unhandledrejection', event => console.warn('[Bookora stability guard] unhandled promise:', event.reason));

  // If a route remains on the bootstrap Bookora screen too long, recover instead of
  // trapping the user behind an infinite-looking loader.
  let loadingSince = 0;
  setInterval(() => {
    const main = document.getElementById('main-content');
    const loader = main?.querySelector('[aria-label="Loading Bookora"]');
    if (!loader) { loadingSince = 0; return; }
    if (!loadingSince) loadingSince = Date.now();
    if (Date.now() - loadingSince < 12000) return;
    loader.outerHTML = '<div role="alert" style="min-height:60vh;display:grid;place-items:center;text-align:center;padding:40px 20px;font-family:Inter,system-ui,sans-serif;color:#334155"><div><strong style="display:block;font-size:20px;margin-bottom:8px">This page is taking too long to load.</strong><span style="display:block;font-size:14px;color:#64748b;margin-bottom:18px">The network or a service may be temporarily unavailable.</span><button type="button" id="bookora-stability-retry" style="border:0;border-radius:10px;padding:10px 16px;background:#2563eb;color:#fff;font-weight:700;cursor:pointer">Try again</button></div></div>';
    document.getElementById('bookora-stability-retry')?.addEventListener('click', () => window.__BOOKORA_APP_INSTANCE__?.route(true, false));
    loadingSince = 0;
  }, 2000);

  const patchState = async () => {
    try {
      const { state } = await import('./state.js');
      if (!state || state.__stabilityGuardPatched) return;
      const originalSync = state.syncData.bind(state);
      let syncInFlight = null;
      state.syncData = function guardedSyncData() {
        if (syncInFlight) return syncInFlight;
        syncInFlight = Promise.race([
          Promise.resolve().then(() => originalSync()),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Bookora data sync timed out')), TIMEOUT))
        ]).catch(error => console.warn('[Bookora stability guard] data sync:', error?.message || error)).finally(() => { syncInFlight = null; });
        return syncInFlight;
      };
      state.__stabilityGuardPatched = true;
    } catch (error) { console.warn('[Bookora stability guard] state patch skipped:', error?.message || error); }
  };
  setTimeout(patchState, 0);
  setTimeout(patchState, 1000);
})();
