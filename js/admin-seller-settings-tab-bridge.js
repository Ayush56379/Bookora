// Bookora — permanent Seller Management entry inside Admin Settings.
// Uses the existing Firestore-backed Admin Sellers surface so there is one
// source of truth for review, documents and seller access controls.
(() => {
  const SETTINGS_ROUTE = '#/admin/settings';
  const SELLERS_ROUTE = '#/admin/sellers';
  let preloaded = false;
  let observer = null;

  const isSettings = () => (window.location.hash || '#/').split('?')[0] === SETTINGS_ROUTE;

  const preloadSellerPage = () => {
    if (preloaded) return;
    preloaded = true;
    import('./pages/AdminSellersPage.js?v=20260828-seller-settings')
      .catch(() => { preloaded = false; });
  };

  const ensureSellerTab = () => {
    if (!isSettings()) return;
    const side = document.querySelector('.admin-settings .as-side');
    if (!side || side.querySelector('[data-bookora-seller-settings-tab]')) return;
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'as-tab';
    tab.setAttribute('data-bookora-seller-settings-tab', '1');
    tab.innerHTML = '<span>👥 Sellers</span><span>›</span>';
    side.appendChild(tab);
    preloadSellerPage();
  };

  // Capture phase guarantees the Settings page's generic tab handler cannot
  // open an empty section before we route to the real seller management page.
  document.addEventListener('click', event => {
    const tab = event.target?.closest?.('[data-bookora-seller-settings-tab]');
    if (!tab || !isSettings()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.hash = SELLERS_ROUTE;
  }, true);

  const start = () => {
    ensureSellerTab();
    const root = document.getElementById('app') || document.body;
    if (!observer && root) {
      observer = new MutationObserver(ensureSellerTab);
      observer.observe(root, { childList: true, subtree: true });
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
  window.addEventListener('hashchange', ensureSellerTab, true);
})();
