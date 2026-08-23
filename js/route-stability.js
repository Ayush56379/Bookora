/* Bookora permanent route stability + no-loading-flash patch. */
(() => {
  const install = () => {
    const app = window.__BOOKORA_APP_INSTANCE__;
    if (!app || typeof app.route !== 'function') return false;
    if (app.__stableRoutePatched) return true;

    const originalRoute = app.route.bind(app);
    app.route = async (force = false, navigation = false) => {
      const hash = window.location.hash || '#/';
      const main = document.querySelector('#main-content');
      const sameRoute = app.lastHash === hash;
      if (!navigation && sameRoute && main) return;

      const root = app.root;
      let descriptor;
      let patchedRoot = false;
      if (root) {
        let proto = root;
        while (proto && !descriptor) {
          descriptor = Object.getOwnPropertyDescriptor(proto, 'innerHTML');
          proto = Object.getPrototypeOf(proto);
        }
        if (descriptor?.set) {
          const originalSetter = descriptor.set;
          const originalGetter = descriptor.get;
          try {
            Object.defineProperty(root, 'innerHTML', {
              configurable: true,
              enumerable: descriptor.enumerable,
              get: originalGetter ? () => originalGetter.call(root) : undefined,
              set(value) {
                const html = String(value ?? '');
                if (html.includes('Loading Bookora…') || html.includes('Loading Bookora...')) {
                  if (root.querySelector('#main-content')) return;
                  const hiddenLoader = '<div aria-hidden="true" style="height:60vh;min-height:420px;visibility:hidden;pointer-events:none"></div>';
                  originalSetter.call(root, html.replace(/<div[^>]*>Loading Bookora(?:…|\.\.\.)<\/div>/, hiddenLoader));
                  return;
                }
                originalSetter.call(root, value);
              }
            });
            patchedRoot = true;
          } catch (error) { console.warn('[Bookora route stability] innerHTML guard unavailable', error); }
        }
      }
      try {
        return await originalRoute(force, navigation);
      } finally {
        if (patchedRoot) {
          try { delete root.innerHTML; } catch (_) {}
        }
      }
    };
    app.__stableRoutePatched = true;
    return true;
  };
  const started = performance.now();
  const timer = setInterval(() => {
    if (install() || performance.now() - started > 15000) clearInterval(timer);
  }, 25);
  install();
})();
