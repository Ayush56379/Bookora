// Bookora Admin Review route bridge.
// Keeps the dedicated review page compatible with the SafeApp boot router.
(() => {
  'use strict';
  if (window.__BOOKORA_ADMIN_REVIEW_ROUTE_FIX__) return;
  window.__BOOKORA_ADMIN_REVIEW_ROUTE_FIX__ = true;

  const path = () => (window.location.hash || '#/').split('?')[0].replace(/^#/, '') || '/';
  const isReview = () => path() === '/admin/review-submissions';

  const addNavLink = () => {
    if (!path().startsWith('/admin')) return;
    const header = document.getElementById('header-container');
    if (!header || header.querySelector('[data-bookora-review-nav]')) return;
    const links = [...header.querySelectorAll('a[href^="#/admin/"]')];
    const settings = links.find(a => a.getAttribute('href') === '#/admin/settings');
    if (!settings) return;
    const link = document.createElement('a');
    link.href = '#/admin/review-submissions';
    link.dataset.bookoraReviewNav = '1';
    link.textContent = 'Review';
    link.className = settings.className || '';
    link.style.cssText = settings.style.cssText || 'color:#475569';
    link.style.fontWeight = '600';
    link.setAttribute('aria-label', 'Review submissions');
    settings.parentElement?.insertBefore(link, settings);
  };

  const patchRouter = async () => {
    const app = window.__BOOKORA_APP_INSTANCE__;
    if (!app || typeof app.loadPage !== 'function' || app.__bookoraReviewLoadPatched) return !!app;
    const original = app.loadPage.bind(app);
    app.loadPage = async (requestedPath, params) => {
      if (requestedPath === '/admin/review-submissions') {
        const m = await import('./pages/AdminReviewSubmissionsPage.js?v=20260828-2');
        return { html: m.renderAdminReviewSubmissionsPage(), init: m.initAdminReviewSubmissionsEvents };
      }
      return original(requestedPath, params);
    };
    app.__bookoraReviewLoadPatched = true;
    if (isReview()) await app.route(true, false);
    return true;
  };

  const observe = () => {
    addNavLink();
    patchRouter().catch(error => console.warn('[Bookora admin review route]', error));
    const observer = new MutationObserver(() => {
      addNavLink();
      if (isReview()) patchRouter().catch(() => {});
    });
    observer.observe(document.body, { childList:true, subtree:true });
  };

  const wait = () => {
    if (window.__BOOKORA_APP_INSTANCE__) observe();
    else setTimeout(wait, 150);
  };
  window.addEventListener('hashchange', () => setTimeout(() => { addNavLink(); patchRouter().catch(() => {}); }, 80));
  wait();
})();
