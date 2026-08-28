// Bookora permanent SPA navigation recovery.
// Navigation-only safety layer. Never owns rendering; it only asks the core
// router to reconcile the visible page with the current hash when necessary.
(() => {
  if (window.__BOOKORA_SPA_NAV_RECOVERY__) return;
  window.__BOOKORA_SPA_NAV_RECOVERY__ = true;
  let timer = null;
  let lastHash = window.location.hash || '#/';
  const currentPath = () => (window.location.hash || '#/').split('?')[0].replace(/^#/, '') || '/';

  const recover = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const hash = window.location.hash || '#/';
      const path = currentPath();
      if (path === '/seller/wallet') return;
      if (hash === lastHash && document.querySelector('#main-content')) return;
      lastHash = hash;
      const app = window.__BOOKORA_APP_INSTANCE__;
      if (!app || typeof app.route !== 'function') return;
      try { app.route(true, true); }
      catch (error) { console.warn('[Bookora navigation recovery]', error); }
    }, 30);
  };

  window.addEventListener('hashchange', recover, true);
  window.addEventListener('popstate', recover, true);
  setTimeout(recover, 1200);
})();
