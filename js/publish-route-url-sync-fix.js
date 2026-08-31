// Keep the SPA URL and rendered Publish page in sync.
// Scope: only the Publish Internal page; no other route is modified.
(function () {
  function sync() {
    const hash = window.location.hash || '#/';
    const publishPage = document.querySelector('.publish-v2-shell');
    if (publishPage && (hash === '#/' || hash === '' || hash === '#')) {
      window.location.hash = '#/publish';
    }
  }

  function boot() {
    sync();
    const app = document.getElementById('app');
    if (!app) return;
    const observer = new MutationObserver(sync);
    observer.observe(app, { childList: true, subtree: true });
    window.addEventListener('hashchange', sync);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
