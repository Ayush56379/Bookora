// Bookora seller onboarding route override.
// Uses the short form that includes the payout fields required by the seller wallet.
(() => {
  if (window.__BOOKORA_QUICK_SELLER_ROUTE__) return;
  window.__BOOKORA_QUICK_SELLER_ROUTE__ = true;
  const install = () => {
    const app = window.__BOOKORA_APP_INSTANCE__;
    if (!app || app.__quickSellerInstalled) return Boolean(app);
    const original = app.loadPage.bind(app);
    app.loadPage = async (path, params) => {
      if (path === '/seller/apply') {
        const m = await import('./pages/SellerApplyPayoutPage.js?v=20260827-wallet1');
        return { html: m.renderSellerApplyPage(), init: m.initSellerApplyEvents };
      }
      return original(path, params);
    };
    app.__quickSellerInstalled = true;
    if (app.currentPath?.() === '/seller/apply') void app.route(true, false);
    return true;
  };
  if (install()) return;
  let tries = 0;
  const timer = setInterval(() => { tries += 1; if (install() || tries >= 120) clearInterval(timer); }, 100);
})();
