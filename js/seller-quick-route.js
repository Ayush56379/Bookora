// Bookora permanent seller onboarding route override.
// Always loads the five-step resumable seller onboarding page with a fresh
// module version so the legacy one-page/old design cannot return from cache.
(() => {
  if (window.__BOOKORA_FINAL_SELLER_ROUTE_V2__) return;
  window.__BOOKORA_FINAL_SELLER_ROUTE_V2__ = true;
  const install = () => {
    const app = window.__BOOKORA_APP_INSTANCE__;
    if (!app || app.__finalSellerInstalledV2) return Boolean(app);
    const original = app.loadPage.bind(app);
    app.loadPage = async (path, params) => {
      if (path === '/seller/apply') {
        const m = await import('./pages/SellerApplyQuickPage.js?v=20260827-five6-progress');
        return { html: m.renderSellerApplyPage(), init: m.initSellerApplyEvents };
      }
      return original(path, params);
    };
    app.__finalSellerInstalledV2 = true;
    if (app.currentPath?.() === '/seller/apply') void app.route(true, false);
    return true;
  };
  if (install()) return;
  let tries = 0;
  const timer = setInterval(() => { tries += 1; if (install() || tries >= 120) clearInterval(timer); }, 100);
})();
