// Bookora final seller onboarding route override.
// Always loads the current five-step seller onboarding page and busts the
// browser module cache so legacy seller forms cannot reappear.
(() => {
  if (window.__BOOKORA_FINAL_SELLER_ROUTE__) return;
  window.__BOOKORA_FINAL_SELLER_ROUTE__ = true;
  const install = () => {
    const app = window.__BOOKORA_APP_INSTANCE__;
    if (!app || app.__finalSellerInstalled) return Boolean(app);
    const original = app.loadPage.bind(app);
    app.loadPage = async (path, params) => {
      if (path === '/seller/apply') {
        const m = await import('./pages/SellerApplyQuickPage.js?v=20260827-five5');
        return { html: m.renderSellerApplyPage(), init: m.initSellerApplyEvents };
      }
      return original(path, params);
    };
    app.__finalSellerInstalled = true;
    if (app.currentPath?.() === '/seller/apply') void app.route(true, false);
    return true;
  };
  if (install()) return;
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (install() || tries >= 120) clearInterval(timer);
  }, 100);
})();
