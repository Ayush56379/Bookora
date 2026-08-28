// Bookora permanent seller onboarding route override.
// The legacy progress/profile overlays are intentionally not loaded here:
// they duplicated the upload/save listeners and caused CORS errors.
import './seller-profile-drive-firebase-hotfix.js?v=20260828-2';

(() => {
  if (window.__BOOKORA_FINAL_SELLER_ROUTE_V3__) return;
  window.__BOOKORA_FINAL_SELLER_ROUTE_V3__ = true;
  const install = () => {
    const app = window.__BOOKORA_APP_INSTANCE__;
    if (!app || app.__finalSellerInstalledV3) return Boolean(app);
    const original = app.loadPage.bind(app);
    app.loadPage = async (path, params) => {
      if (path === '/seller/apply') {
        const m = await import('./pages/SellerApplyQuickPage.js?v=20260828-drive-firebase');
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
