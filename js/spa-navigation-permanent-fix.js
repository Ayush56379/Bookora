// Bookora permanent SPA navigation recovery.
// Scope: navigation only. Does not modify page/business logic.
// Ensures the visible page always follows the URL hash, even after an
// optional route module (such as Seller Wallet) has rendered asynchronously.
(() => {
  let timer = null;
  let lastHash = window.location.hash || '#/';

  const currentPath = () => (window.location.hash || '#/').split('?')[0].replace(/^#/, '') || '/';

  const recover = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const hash = window.location.hash || '#/';
      const path = currentPath();
      if (hash === lastHash && path === '/seller/wallet') return;
      lastHash = hash;

      // Wallet has its own isolated renderer only while its route is active.
      // Every other route belongs to the core SPA router.
      if (path === '/seller/wallet') return;

      const app = window.__BOOKORA_APP_INSTANCE__;
      if (!app || typeof app.requestRoute !== 'function') return;

      // Let the core router finish any in-flight Wallet render, then force the
      // requested hash to become the visible page.
      setTimeout(() => {
        const livePath = currentPath();
        if (livePath === '/seller/wallet') return;
        try { app.requestRoute(true, true); }
        catch (error) { console.warn('[Bookora navigation recovery]', error); }
      }, 0);
    }, 0);
  };

  window.addEventListener('hashchange', recover, true);
  window.addEventListener('popstate', recover, true);

  // Also recover once after boot in case a stale optional renderer left the
  // DOM on a different page while the URL already points elsewhere.
  setTimeout(recover, 1200);
})();
