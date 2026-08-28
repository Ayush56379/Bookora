// Bookora permanent seller onboarding route override.
(() => {
  if (window.__BOOKORA_FINAL_SELLER_ROUTE_V3__) return;
  window.__BOOKORA_FINAL_SELLER_ROUTE_V3__ = true;
  const install = () => {
    const app = window.__BOOKORA_APP_INSTANCE__;
    if (!app || app.__finalSellerInstalledV3) return Boolean(app);
    const original = app.loadPage.bind(app);
    app.loadPage = async (path, params) => {
      if (path === '/seller/apply') {
        const m = await import('./pages/SellerApplyQuickPage.js?v=20260827-five7-progress');
        return { html: m.renderSellerApplyPage(), init: m.initSellerApplyEvents };
      }
      return original(path, params);
    };
    app.__finalSellerInstalledV3 = true;
    if (app.currentPath?.() === '/seller/apply') void app.route(true, false);
    return true;
  };
  if (install()) return;
  [100, 500, 1500].forEach(delay => setTimeout(install, delay));
})();
import('./seller-firestore-progress-stable.js?v=20260828-1').catch(error => {
  console.warn('[Bookora seller Firebase] persistence layer unavailable:', error);
});
import('./seller-onboarding-profile-fix.js?v=20260828-3').catch(error => {
  console.warn('[Bookora seller profile fix] unavailable:', error);
});
