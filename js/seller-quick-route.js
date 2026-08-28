// Bookora seller onboarding route resilience.
// Seller-only override: other routes keep their existing loader untouched.
(() => {
  if (window.__BOOKORA_SELLER_STABLE_ROUTE_V5__) return;
  window.__BOOKORA_SELLER_STABLE_ROUTE_V5__ = true;

  const install = () => {
    const app = window.__BOOKORA_APP_INSTANCE__;
    if (!app || app.__sellerStableV5) return Boolean(app);
    app.__sellerStableV5 = true;
    const original = app.loadPage.bind(app);
    app.loadPage = async (path, params) => {
      if (path !== '/seller/apply') return original(path, params);
      const m = await import('./pages/SellerApplyFirebaseStable.js?v=20260828-firebase-save-1');
      return { html: await m.renderStable(), init: m.initStable };
    };
    if (app.currentPath?.() === '/seller/apply') setTimeout(() => app.route(true, false), 0);
    return true;
  };

  if (!install()) [50,150,400,1000,2000].forEach(delay => setTimeout(install, delay));
})();
