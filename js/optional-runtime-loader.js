// Bookora optional runtime loader.
// Critical rule: homepage interactions must never compete with unrelated page code.
(() => {
  const route = () => (window.location.hash || '#/').split('?')[0].replace(/^#/, '') || '/';
  const homepage = [
    './homepage-featured-removal-permanent.js?v=20260827-2',
    './globalInteractions.js?v=20260827-2',
    './homepage-catalog-enhancement.js?v=20260820-1',
    './homepage-catalog-cleanup.js?v=20260823-2',
    './homepage-seller-section-fix.js?v=20260820-1',
    './active-mode-persistence.js?v=20260826-1',
    './ai-single-trigger-permanent-fix.js?v=20260827-2'
  ];
  const common = [
    './auth-logout-ui-permanent-fix.js?v=20260826-1',
    './backend-token-restore.js?v=20260823-3',
    './firebase-auth-token-bridge.js?v=20260821-9',
    './profile-menu-stability.js?v=20260822-1'
  ];
  const routeModules = {
    '/admin/review-submissions': ['./admin-review-route-fix.js?v=20260828-1'],
    '/explore': ['./smart-search-runtime.js?v=20260822-1','./explore-category-position-fix.js?v=20260827-1','./catalog-dedupe-runtime.js?v=20260827-1'],
    '/pricing': ['./membership-firebase-runtime.js?v=20260826-3','./membership-autopay-runtime.js?v=20260826-3'],
    '/subscription': ['./membership-firebase-runtime.js?v=20260826-3','./membership-autopay-runtime.js?v=20260826-3'],
    '/subscription/manage': ['./membership-firebase-runtime.js?v=20260826-3','./membership-autopay-runtime.js?v=20260826-3'],
    '/library': ['./wishlist-permission-fix.js?v=20260826-2'],
    '/orders': ['./orders-page-permanent-fix.js?v=20260821-6','./orders-page-render-sync.js?v=20260821-2'],
    '/publish': ['./publish-enhancements.js?v=20260826-1','./publish-success-finalizer.js?v=20260826-1','./publish-concurrency-safety.js?v=20260828-1','./publish-submit-progress-ui.js?v=20260828-1','./publish-submit-finalization-hotfix.js?v=20260828-1'],
    '/publish/external': ['./external-seller-auth-persistence-fix.js?v=20260823-5','./external-auth-submit-bridge.js?v=20260823-8','./external-publish-scan-permanent-fix.js?v=20260823-3'],
    '/seller/apply': ['./seller-apply-ui-v5.js?v=20260827-4','./seller-apply-profile-ui-v6.js?v=20260827-2'],
    '/seller/dashboard': ['./seller-wallet-route.js?v=20260826-1'],
    '/admin': ['./admin-settings-persistence-fix.js?v=20260824-1','./admin-settings-live-firestore.js?v=20260824-1','./admin-cashfree-subscription-mode.js?v=20260826-4'],
    '/admin/books': ['./admin-settings-persistence-fix.js?v=20260824-1'],
    '/admin/settings': ['./admin-settings-persistence-fix.js?v=20260824-1','./admin-settings-live-firestore.js?v=20260824-1'],
    '/book': ['./book-detail-loading-fix.js?v=20260819-1','./book-detail-media-hotfix.js?v=20260819-2','./book-detail-complete.js?v=20260823-1','./book-detail-permanent-fix.js?v=20260819-6','./book-detail-reviews-runtime.js?v=20260823-3','./book-reviews-runtime.js?v=20260823-5'],
    '/sample': ['./book-sample-secure-reader.js?v=20260820-5','./free-sample-permanent-fix.js?v=20260820-5'],
    '/checkout': ['./checkout-production-runtime.js?v=20260820-3','./regional-checkout-hotfix.js?v=20260822-1','./checkout-image-hotfix.js?v=20260820-3','./payment-auth-session-fix.js?v=20260820-2','./payment-runtime.js?v=20260820-3'],
    '/payment/success': ['./payment-success-verification-hotfix.js?v=20260821-7','./payment-success-responsive-hotfix.js?v=20260821-1'],
    '/settings': ['./settings-runtime.js?v=20260823-1','./settings-route-sync-hotfix.js?v=20260822-1']
  };
  const isPrefix = (r, prefix) => r === prefix || r.startsWith(`${prefix}/`);
  const selected = () => {
    const r = route();
    if (r === '/') return homepage;
    const exact = routeModules[r];
    if (exact) return [...common, ...exact];
    const key = Object.keys(routeModules).find(k => isPrefix(r, k));
    return [...common, ...(key ? routeModules[key] : [])];
  };
  const loaded = new Set();
  const loadOne = src => {
    if (loaded.has(src)) return Promise.resolve();
    loaded.add(src);
    return import(src).catch(error => console.warn('[Bookora optional runtime skipped]', src, error));
  };
  let generation = 0;
  const loadForRoute = () => {
    const myGeneration = ++generation;
    if (!window.__BOOKORA_CORE_BOOTED__) return;
    const items = selected();
    const run = async () => {
      for (const src of items) {
        if (myGeneration !== generation) return;
        await loadOne(src);
        await new Promise(resolve => setTimeout(resolve, 60));
      }
    };
    const start = () => run().catch(error => console.warn('[Bookora optional queue]', error));
    if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1800 });
    else setTimeout(start, 900);
  };
  const bootWait = () => {
    if (window.__BOOKORA_CORE_BOOTED__) loadForRoute();
    else setTimeout(bootWait, 250);
  };
  bootWait();
  window.addEventListener('hashchange', () => setTimeout(loadForRoute, 120), { passive: true });
})();
