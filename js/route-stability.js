/* Bookora route stability: prevents background state events from re-rendering the current page. */
(() => {
  let patched = false;
  const install = () => {
    const app = window.__BOOKORA_APP_INSTANCE__;
    if (!app || typeof app.route !== 'function') return false;
    if (app.__stableRoutePatched) return true;

    const originalRoute = app.route.bind(app);
    app.route = async (force = false, navigation = false) => {
      const hash = window.location.hash || '#/';
      const main = document.querySelector('#main-content');
      const sameRoute = app.lastHash === hash;

      // Firebase auth/mode/load events may call route(true, false).
      // Never destroy an already-rendered page for those background events.
      if (!navigation && sameRoute && main) return;

      return originalRoute(force, navigation);
    };
    app.__stableRoutePatched = true;
    patched = true;
    return true;
  };

  // app-safe.js is a dynamic module, so wait briefly for its instance.
  const started = performance.now();
  const timer = setInterval(() => {
    if (install() || performance.now() - started > 10000) clearInterval(timer);
  }, 25);
  install();
})();
