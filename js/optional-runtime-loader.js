// Bookora optional runtime loader.
// Never blocks or replaces the core SPA. Every optional runtime is isolated.
// IMPORTANT: the first three runtimes are classic scripts, so their URLs must
// be resolved from the site root (this loader itself is a classic script).
(() => {
  const modules = [
    './firestore-book-sync.js?v=20260823-9', './google-drive-resumable-bridge.js?v=20260823-5',
    './book-card-direct-navigation-hotfix.js?v=20260820-3', './auth-buyer-only.js?v=20260823-2',
    './globalInteractions.js?v=20260822-4', './settings-runtime.js', './i18n-runtime-safe.js?v=20260823-4',
    './regional-currency-runtime.js?v=20260822-1', './regional-checkout-hotfix.js?v=20260822-1',
    './checkout-production-runtime.js?v=20260820-2', './admin-coupon-runtime.js?v=20260820-1',
    './purchase-access-runtime.js?v=20260821-6', './payment-runtime.js?v=20260820-3', './backendStateSync.js',
    './publish-enhancements.js', './subscription-session.js', './backend-token-restore.js?v=20260823-2',
    './firebase-authenticated-fetch.js?v=20260823-3', './external-seller-auth-persistence-fix.js?v=20260823-2',
    './external-auth-submit-bridge.js?v=20260823-4', './catalog-visibility-hotfix.js?v=1', './auth-session-bridge.js?v=20260821-3',
    './firebase-auth-token-bridge.js?v=20260821-9', './wishlist-permission-fix.js?v=20260820-2',
    './payment-route-stability-hotfix.js?v=20260821-1', './settings-route-sync-hotfix.js?v=20260822-1',
    './profile-menu-stability.js?v=20260822-1', './payment-success-verification-hotfix.js?v=20260821-7',
    './payment-success-responsive-hotfix.js?v=20260821-1', './orders-page-permanent-fix.js?v=20260821-6',
    './orders-page-render-sync.js?v=20260821-2', './homepage-catalog-enhancement.js?v=20260820-1',
    './homepage-catalog-cleanup.js?v=20260823-2', './homepage-seller-section-fix.js?v=20260820-1',
    './admin-settings-persistence-fix.js?v=20260820-1', './google-profile-photo-fix.js?v=20260819-1',
    './book-detail-loading-fix.js?v=20260819-1', './book-detail-media-hotfix.js?v=20260819-2',
    './final-click-safety.js', './ai-click-fix.js?v=3', './seller-wallet-route.js?v=1',
    './book-detail-complete.js?v=3', './book-detail-permanent-fix.js?v=20260819-6',
    './book-detail-reviews-runtime.js?v=20260823-3', './book-author-profile-runtime.js?v=20260823-1',
    './book-reviews-runtime.js?v=20260823-5', './book-sample-secure-reader.js?v=20260820-5',
    './free-sample-permanent-fix.js?v=20260820-5', './book-card-size-fix.js?v=20260820-1',
    './checkout-image-hotfix.js?v=20260820-3', './payment-auth-session-fix.js?v=20260820-2',
    './book-cover-display-fix.js?v=20260820-1', './mode-specific-menu-fix.js?v=20260820-1',
    './mobile-mode-switcher.js?v=20260823-boot2', './book-card-detail-click-fix.js?v=20260820-2',
    './external-bookora-commerce.js?v=20260821-1', './external-bookora-detail-ui.js?v=20260822-1',
    './external-purchase-flow.js?v=20260822-1', './external-integration-ui.js?v=20260822-1',
    './book-detail-related-mobile-fix.js?v=20260822-1', './smart-search-runtime.js?v=20260822-1'
  ];

  const loadOne = async src => {
    try {
      if (src.includes('firestore-book-sync') || src.includes('google-drive-resumable-bridge') || src.includes('auth-buyer-only')) {
        const rootRelativeSrc = src.replace(/^\.\//, './js/');
        await new Promise(resolve => {
          const s = document.createElement('script');
          s.src = rootRelativeSrc; s.defer = true; s.onload = s.onerror = resolve;
          document.body.appendChild(s);
        });
      } else {
        await import(src);
      }
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