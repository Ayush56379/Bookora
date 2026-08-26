// Bookora Admin Settings emergency route recovery.
// If another page init/background runtime leaves the core SPA router waiting,
// the admin settings route must still become usable instead of leaving the old page frozen.
(() => {
  const ROUTE = '#/admin/settings';
  let timer = 0;
  let running = false;

  const isRoute = () => (window.location.hash || '#/').split('?')[0] === ROUTE;

  const renderDirectly = async () => {
    if (!isRoute() || running || document.querySelector('.admin-settings')) return;
    running = true;
    try {
      const pageModule = await import('./pages/AdminSettingsPage.js');
      const app = document.getElementById('app');
      if (!app) return;

      let main = document.getElementById('main-content');
      if (!main) {
        main = document.createElement('main');
        main.id = 'main-content';
        main.style.cssText = 'flex:1;min-height:60vh';
        app.appendChild(main);
      }

      main.innerHTML = pageModule.renderAdminSettingsPage();
      if (typeof pageModule.initAdminSettingsEvents === 'function') {
        await Promise.race([
          Promise.resolve(pageModule.initAdminSettingsEvents()),
          new Promise(resolve => setTimeout(resolve, 2500))
        ]);
      }
      window.__BOOKORA_ADMIN_SETTINGS_RECOVERED__ = true;
    } catch (error) {
      console.error('[Bookora Admin Settings] emergency route recovery failed:', error);
    } finally {
      running = false;
    }
  };

  const scheduleCheck = () => {
    clearTimeout(timer);
    if (!isRoute()) return;
    timer = setTimeout(() => {
      if (isRoute() && !document.querySelector('.admin-settings')) renderDirectly();
    }, 900);
  };

  window.addEventListener('hashchange', scheduleCheck, true);
  window.addEventListener('pageshow', scheduleCheck, true);

  const bootWatch = () => {
    if (window.__BOOKORA_CORE_BOOTED__) scheduleCheck();
    else setTimeout(bootWatch, 250);
  };
  bootWatch();
})();
