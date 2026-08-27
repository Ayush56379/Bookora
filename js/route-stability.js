/* Bookora route stability guard — event-safe and idle-free. */
(() => {
  const install = () => {
    const app = window.__BOOKORA_APP_INSTANCE__;
    if (!app || typeof app.route !== 'function' || app.__stableRoutePatched) return !!app;

    const originalLoadPage = app.loadPage.bind(app);
    app.loadPage = async (path, params) => {
      // Keep these routes owned by the core SPA router. This prevents optional
      // runtimes from racing the page renderer and makes direct deep-links stable.
      if (path === '/authors') {
        const m = await import('./pages/PublicDiscoveryPages.js');
        return { html: m.renderAuthorsDirectoryPage() };
      }
      if (path === '/seller/wallet') {
        const m = await import('./pages/WalletPage.js');
        return { html: await m.renderWalletPage(), init: m.initWalletPageEvents };
      }
      return originalLoadPage(path, params);
    };

    // Older recovery helpers call requestRoute(). Keep one canonical API.
    if (typeof app.requestRoute !== 'function') {
      app.requestRoute = (force = true, navigation = true) => app.route(force, navigation);
    }

    // Wallet must not install a second renderer once core owns the route.
    window.__BOOKORA_CORE_WALLET_ROUTE_V2__ = true;

    const originalRoute = app.route.bind(app);
    app.route = async (force = false, navigation = false) => {
      try {
        return await originalRoute(force, navigation);
      } finally {
        window.dispatchEvent(new CustomEvent('bookora:route-ready', {
          detail: { hash: window.location.hash || '#/' }
        }));
      }
    };

    // Render is a server-side API dependency, not a prerequisite for painting
    // the SPA. A sleeping/slow free Render instance must never leave a browser
    // request hanging forever. Bound only ordinary API GET/HEAD calls; uploads,
    // payments, AI requests and sample PDF downloads keep their existing timing.
    if (!window.__BOOKORA_RENDER_FETCH_GUARD__) {
      window.__BOOKORA_RENDER_FETCH_GUARD__ = true;
      const nativeFetch = window.fetch.bind(window);
      const renderHost = 'bookora-backend-x08l.onrender.com';
      window.fetch = (input, init = {}) => {
        let url = '';
        try { url = typeof input === 'string' ? input : String(input?.url || ''); } catch (_) {}
        const method = String(init?.method || (typeof input === 'object' && input?.method) || 'GET').toUpperCase();
        const isRenderApi = url.includes(renderHost) && method === 'GET' && !/\/api\/books\/[^/]+\/sample(?:\?|$)/.test(url);
        if (!isRenderApi || init?.signal) return nativeFetch(input, init);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort('Bookora Render request timeout'), 10000);
        return nativeFetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
      };
    }

    app.__stableRoutePatched = true;
    return true;
  };

  // app-safe is asynchronous. Use only a few bounded retries; never poll.
  if (install()) return;
  [100, 500, 1500].forEach(delay => setTimeout(install, delay));
})();
