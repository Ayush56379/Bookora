// Bookora seller onboarding route: Firebase-first, profile image upload permanently disabled.
(() => {
  if (window.__BOOKORA_SELLER_NO_PROFILE_IMAGE_V6__) return;
  window.__BOOKORA_SELLER_NO_PROFILE_IMAGE_V6__ = true;

  const install = () => {
    const app = window.__BOOKORA_APP_INSTANCE__;
    if (!app || app.__sellerNoProfileImageV6) return Boolean(app);
    app.__sellerNoProfileImageV6 = true;
    const original = app.loadPage.bind(app);
    app.loadPage = async (path, params) => {
      if (path !== '/seller/apply') return original(path, params);
      const m = await import('./pages/SellerApplyFirebaseStable.js?v=20260828-no-profile-image-2');
      return { html: await m.renderStable(), init: m.initStable };
    };
    if (app.currentPath?.() === '/seller/apply') setTimeout(() => app.route(true, false), 0);
    return true;
  };

  if (!install()) [50,150,400,1000,2000].forEach(delay => setTimeout(install, delay));
})();
