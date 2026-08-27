/* Bookora route stability guard — event-safe and idle-free. */
(() => {
  const install = () => {
    const app = window.__BOOKORA_APP_INSTANCE__;
    if (!app || typeof app.route !== 'function' || app.__stableRoutePatched) return !!app;

    const originalRoute = app.route.bind(app);
    app.route = async (force = false, navigation = false) => {
      const hash = window.location.hash || '#/';
      const main = document.querySelector('#main-content');
      if (!force && app.lastHash === hash && main) return;
      return originalRoute(force, navigation);
    };
    app.__stableRoutePatched = true;
    return true;
  };

  // app-safe is loaded before this deferred script in normal startup.
  // Keep only a few low-frequency retries for slow devices; never poll every 25ms.
  if (install()) return;
  [100, 500, 1500].forEach(delay => setTimeout(install, delay));
})();
