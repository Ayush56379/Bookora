// Bookora optional runtime loader.
// Never blocks or replaces the core SPA. Every optional runtime is isolated.
// This loader itself lives inside /js, so every module below must resolve
// relative to this file as ./<module>, never ./js/<module>.
(() => {
  const modules = [
    './api-auth-bridge.js?v=20260823-1',
    './external-publish-scan-permanent-fix.js?v=20260823-3',
    './firestore-book-sync.js?v=20260823-10',
    './google-drive-resumable-bridge.js?v=20260823-6',
    './auth-buyer-only.js?v=20260823-3',
    './globalInteractions.js?v=20260822-4',
    './settings-runtime.js?v=20260823-1',
    './i18n-runtime-safe.js?v=20260823-5',
    './regional-currency-runtime.js?v=20260822-1',
    './regional-checkout-hotfix.js?v=20260822-1',
    './checkout-production-runtime.js?v=20260820-2',
    './admin-coupon-runtime.js?v=20260820-1',
    './purchase-access-runtime.js?v=20260821-6',
    './payment-runtime.js?v=20260820-3',
    './backendStateSync.js?v=20260823-1',
    './publish-enhancements.js?v=20260823-1',
    './subscription-session.js?v=20260823-1',
    './backend-token-restore.js?v=20260823-3',
    './firebase-authenticated-fetch.js?v=20260823-5',
    './external-seller-auth-persistence-fix.js?v=20260823-5',
    './external-auth-submit-bridge.js?v=20260823-8',
    './catalog-visibility-hotfix.js?v=20260823-1',
    './auth-session-bridge.js?v=20260821-3',
    './firebase-auth-token-bridge.js?v=20260821-9',
    './wishlist-permission-fix.js?v=20260820-2',
    './payment-route-stability-hotfix.js?v=20260821-1',
    './settings-route-sync-hotfix.js?v=20260822-1',
    './profile-menu-stability.js?v=20260822-1',
    './payment-success-verification-hotfix.js?v=20260821-7',
    './payment-success-responsive-hotfix.js?v=20260821-1',
    './orders-page-permanent-fix.js?v=20260821-6',
    './orders-page-render-sync.js?v=20260821-2',
    './homepage-catalog-enhancement.js?v=20260820-1',
    './homepage-catalog-cleanup.js?v=20260823-2',
    './homepage-seller-section-fix.js?v=20260820-1',
    './admin-settings-persistence-fix.js?v=20260820-1',
    './google-profile-photo-fix.js?v=20260819-1',
    './book-detail-loading-fix.js?v=20260819-1',
    './book-detail-media-hotfix.js?v=20260819-2',
    './final-click-safety.js?v=20260823-1',
    './ai-click-fix.js?v=20260823-1',
    './seller-wallet-route.js?v=20260823-1',
    './book-detail-complete.js?v=20260823-1',
    './book-detail-permanent-fix.js?v=20260819-6',
    './book-detail-reviews-runtime.js?v=20260823-3',
    './book-author-profile-runtime.js?v=20260823-1',
    './book-reviews-runtime.js?v=20260823-5',
    './book-sample-secure-reader.js?v=20260820-5',
    './free-sample-permanent-fix.js?v=20260820-5',
    './book-card-size-fix.js?v=20260820-1',
    './checkout-image-hotfix.js?v=20260820-3',
    './payment-auth-session-fix.js?v=20260820-2',
    './mobile-mode-switcher.js?v=20260823-boot3',
    './book-detail-related-mobile-fix.js?v=20260822-1',
    './smart-search-runtime.js?v=20260822-1'
  ];

  const loadOne = async src => {
    try {
      await import(src);
    } catch (error) {
      console.warn('[Bookora optional runtime skipped]', src, error);
    }
  };

  const start = async () => {
    if (!window.__BOOKORA_CORE_BOOTED__) return;
    for (const src of modules) await loadOne(src);
  };

  const waitForCore = () => {
    if (window.__BOOKORA_CORE_BOOTED__) return start();
    setTimeout(waitForCore, 250);
  };

  if ('requestIdleCallback' in window) requestIdleCallback(waitForCore, { timeout: 3000 });
  else setTimeout(waitForCore, 1500);
})();
