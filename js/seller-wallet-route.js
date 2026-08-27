// Legacy wallet renderer kept only as a compatibility shim.
// The canonical wallet route is now owned by app-safe.js through route-stability.js.
(() => {
  if (window.__BOOKORA_CORE_WALLET_ROUTE_V2__) return;
  if (window.__BOOKORA_LEGACY_WALLET_SHIM__) return;
  window.__BOOKORA_LEGACY_WALLET_SHIM__ = true;

  // This file can be loaded lazily by older deployments. If core routing is
  // not ready yet, wait for the canonical route-ready event instead of polling.
  const activate = () => {
    if (window.__BOOKORA_CORE_WALLET_ROUTE_V2__) return;
    const app = window.__BOOKORA_APP_INSTANCE__;
    if (!app || typeof app.route !== 'function') return;
    // Do not create a second renderer. The route-stability patch will take
    // ownership as soon as app-safe is ready.
  };
  window.addEventListener('bookora:route-ready', activate, { once: true });
})();
