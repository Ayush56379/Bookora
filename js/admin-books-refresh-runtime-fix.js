// Bookora Admin Books refresh runtime guard.
// Some already-open deployments may still have the pre-fix page module cached.
// Capture the Refresh click before legacy handlers so Event.currentTarget cannot
// become null after an awaited operation. The normal SPA route/load pipeline is
// then used to render and reload the books data.
(() => {
  if (window.__BOOKORA_ADMIN_BOOKS_REFRESH_RUNTIME_FIX__) return;
  window.__BOOKORA_ADMIN_BOOKS_REFRESH_RUNTIME_FIX__ = true;

  // Presentation-only enhancement: Firebase cover thumbnails for the existing
  // Admin Books rows. It does not replace the existing books loader or actions.
  import('./admin-books-cover-thumbnails.js?v=20260830-1').catch(error => {
    console.warn('[Bookora Admin Books covers]', error?.message || error);
  });

  const isBooksRefresh = target => {
    try { return !!target?.closest?.('#admin-books-refresh'); } catch (_) { return false; }
  };

  document.addEventListener('click', event => {
    const button = isBooksRefresh(event.target) ? event.target.closest('#admin-books-refresh') : null;
    if (!button) return;

    // Stop both the legacy element listener and delegated document listeners.
    event.preventDefault();
    event.stopImmediatePropagation();

    if (button.dataset.bookoraRefreshRunning === '1') return;
    button.dataset.bookoraRefreshRunning = '1';
    button.disabled = true;

    const app = window.__BOOKORA_APP_INSTANCE__;
    const run = app?.route?.bind(app);
    if (typeof run !== 'function') {
      button.disabled = false;
      delete button.dataset.bookoraRefreshRunning;
      location.reload();
      return;
    }

    Promise.resolve(run(true, false)).catch(error => {
      console.error('[Bookora Admin Books refresh]', error);
    }).finally(() => {
      // route() replaces the button, so only touch the old node when it is
      // still connected. Never access Event.currentTarget after await.
      if (button.isConnected) {
        button.disabled = false;
        delete button.dataset.bookoraRefreshRunning;
      }
    });
  }, true);
})();
