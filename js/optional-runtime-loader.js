// Bookora optional runtime loader.
// Optional enhancements must NEVER block the core SPA or user interactions.
(() => {
  const EARLY_AUTH_RUNTIME = './auth-network-resilience.js?v=20260826-6';
  const EARLY_SELLER_UI_RUNTIME = './seller-apply-ui-v5.js?v=20260827-4';
  const EARLY_SELLER_PROFILE_UI_RUNTIME = './seller-apply-profile-ui-v6.js?v=20260827-2';
  const modules = [
    './homepage-featured-removal-permanent.js?v=20260826-1','./auth-logout-ui-permanent-fix.js?v=20260826-1','./api-auth-bridge.js?v=20260827-5','./external-publish-scan-permanent-fix.js?v=20260823-3','./firestore-book-sync.js?v=20260823-10','./google-drive-resumable-bridge.js?v=20260823-6','./auth-buyer-only.js?v=20260823-3','./globalInteractions.js?v=20260822-4','./settings-runtime.js?v=20260823-1','./i18n-runtime-safe.js?v=20260823-5','./regional-currency-runtime.js?v=20260822-1','./regional-checkout-hotfix.js?v=20260822-1','./checkout-production-runtime.js?v=20260820-3','./admin-coupon-runtime.js?v=20260820-1','./purchase-access-runtime.js?v=20260821-6','./payment-runtime.js?v=20260820-3','./backendStateSync.js?v=20260823-1','./publish-enhancements.js?v=20260826-1','./publish-success-finalizer.js?v=20260826-1','./subscription-session.js?v=20260823-1','./backend-token-restore.js?v=20260823-3','./firebase-authenticated-fetch.js?v=20260823-5','./external-seller-auth-persistence-fix.js?v=20260823-5','./external-auth-submit-bridge.js?v=20260823-8','./catalog-visibility-hotfix.js?v=20260823-1','./auth-session-bridge.js?v=20260821-3','./firebase-auth-token-bridge.js?v=20260821-9','./wishlist-permission-fix.js?v=20260826-2','./payment-route-stability-hotfix.js?v=20260821-1','./settings-route-sync-hotfix.js?v=20260822-1','./profile-menu-stability.js?v=20260822-1','./payment-success-verification-hotfix.js?v=20260821-7','./payment-success-responsive-hotfix.js?v=20260821-1','./orders-page-permanent-fix.js?v=20260821-6','./orders-page-render-sync.js?v=20260821-2','./homepage-catalog-enhancement.js?v=20260820-1','./homepage-catalog-cleanup.js?v=20260823-2','./homepage-seller-section-fix.js?v=20260820-1','./admin-settings-persistence-fix.js?v=20260824-1','./admin-settings-live-firestore.js?v=20260824-1','./admin-cashfree-subscription-mode.js?v=20260826-4','./google-profile-photo-fix.js?v=20260819-1','./seller-profile-image-drive.js?v=20260827-2','./book-detail-loading-fix.js?v=20260819-1','./book-detail-media-hotfix.js?v=20260819-2','./book-detail-complete.js?v=20260823-1','./book-detail-permanent-fix.js?v=20260819-6','./book-detail-reviews-runtime.js?v=20260823-3','./book-author-profile-runtime.js?v=20260823-1','./book-reviews-runtime.js?v=20260823-5','./book-sample-secure-reader.js?v=20260820-5','./free-sample-permanent-fix.js?v=20260820-5','./book-card-size-fix.js?v=20260820-1','./checkout-image-hotfix.js?v=20260820-3','./payment-auth-session-fix.js?v=20260820-2','./mobile-mode-switcher.js?v=20260823-boot3','./book-detail-related-mobile-fix.js?v=20260822-1','./seller-wallet-route.js?v=20260826-1','./wallet-cashfree-payout.js?v=20260826-1','./smart-search-runtime.js?v=20260822-1','./active-mode-persistence.js?v=20260826-1','./membership-firebase-runtime.js?v=20260826-3','./membership-autopay-runtime.js?v=20260826-3','./explore-category-position-fix.js?v=20260827-1','./catalog-dedupe-runtime.js?v=20260827-1','./bookora-branding-permanent-fix.js?v=20260827-2','./ai-single-trigger-permanent-fix.js?v=20260827-1'
  ];
  const loadOne = src => {
    const timeout = new Promise(resolve => setTimeout(resolve, 3500));
    const task = import(src).catch(error => console.warn('[Bookora optional runtime skipped]', src, error));
    return Promise.race([task, timeout]).catch(() => {});
  };
  const loadQueue = async (items, concurrency = 2) => {
    let cursor = 0;
    const worker = async () => {
      while (cursor < items.length) {
        const src = items[cursor++];
        await loadOne(src);
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  };
  loadOne(EARLY_AUTH_RUNTIME);
  loadOne(EARLY_SELLER_UI_RUNTIME);
  loadOne(EARLY_SELLER_PROFILE_UI_RUNTIME);
  let started = false;
  const start = () => {
    if (started || !window.__BOOKORA_CORE_BOOTED__) return;
    started = true;
    setTimeout(() => loadQueue(modules, 2), 250);
  };
  const waitForCore = () => window.__BOOKORA_CORE_BOOTED__ ? start() : setTimeout(waitForCore, 250);
  if ('requestIdleCallback' in window) requestIdleCallback(waitForCore, { timeout: 3000 });
  else setTimeout(waitForCore, 1500);
})();
