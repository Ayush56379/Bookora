// Bookora admin route recovery guard.
// Keeps the existing Settings recovery intact and adds a native, non-blocking
// Moderation route so /#/admin/moderation never falls through to 404 or waits
// on Firebase before the page shell becomes visible.
(() => {
  'use strict';

  const SETTINGS_ROUTE = '#/admin/settings';
  const MODERATION_ROUTE = '#/admin/moderation';
  let settingsTimer = 0;
  let moderationTimer = 0;
  let settingsRunning = false;
  let moderationRunning = false;
  let moderationInitialized = false;

  const route = () => (window.location.hash || '#/').split('?')[0];
  const isSettings = () => route() === SETTINGS_ROUTE;
  const isModeration = () => route() === MODERATION_ROUTE;

  async function renderSettingsDirectly() {
    if (!isSettings() || settingsRunning || document.querySelector('.admin-settings')) return;
    settingsRunning = true;
    try {
      const pageModule = await import('./pages/AdminSettingsPage.js');
      const app = document.getElementById('app');
      if (!app) return;
      let main = document.getElementById('main-content');
      if (!main) { main = document.createElement('main'); main.id = 'main-content'; main.style.cssText = 'flex:1;min-height:60vh'; app.appendChild(main); }
      main.innerHTML = pageModule.renderAdminSettingsPage();
      if (typeof pageModule.initAdminSettingsEvents === 'function') {
        await Promise.race([Promise.resolve(pageModule.initAdminSettingsEvents()), new Promise(resolve => setTimeout(resolve, 2500))]);
      }
      window.__BOOKORA_ADMIN_SETTINGS_RECOVERED__ = true;
    } catch (error) {
      console.error('[Bookora Admin Settings] recovery failed:', error);
    } finally { settingsRunning = false; }
  }

  async function renderModerationDirectly() {
    if (!isModeration() || moderationRunning || document.querySelector('.admin-moderation-page')) return;
    moderationRunning = true;
    try {
      const pageModule = await import('./pages/AdminModerationPage.js?v=20260830-moderation-1');
      const app = document.getElementById('app');
      if (!app) return;
      let main = document.getElementById('main-content');
      if (!main) { main = document.createElement('main'); main.id = 'main-content'; main.style.cssText = 'flex:1;min-height:60vh'; app.appendChild(main); }
      main.innerHTML = pageModule.renderAdminModerationPage();
      window.__BOOKORA_ADMIN_MODERATION_RECOVERED__ = true;
      // Never block route completion on Firebase. Data hydration starts independently.
      setTimeout(() => {
        if (!isModeration() || moderationInitialized) return;
        moderationInitialized = true;
        Promise.resolve(pageModule.initAdminModerationEvents()).catch(error => console.error('[Bookora Moderation] init failed:', error));
      }, 0);
    } catch (error) {
      console.error('[Bookora Admin Moderation] recovery failed:', error);
      const main = document.getElementById('main-content');
      if (main && isModeration()) main.innerHTML = `<div style="min-height:60vh;display:grid;place-items:center;padding:30px;font-family:Inter,system-ui,sans-serif"><div style="max-width:560px;background:#fff;border:1px solid #fecaca;border-radius:18px;padding:32px;text-align:center"><h2 style="color:#991b1b;margin:0 0 8px">Moderation module unavailable</h2><p style="color:#64748b">Please refresh once. The rest of the admin panel remains available.</p><a href="#/admin" style="display:inline-block;margin-top:12px;padding:10px 14px;border-radius:9px;background:#2563eb;color:#fff;text-decoration:none;font-weight:700">Back to Admin</a></div></div>`;
    } finally { moderationRunning = false; }
  }

  function patchCoreRouter() {
    const app = window.__BOOKORA_APP_INSTANCE__;
    if (!app || typeof app.loadPage !== 'function' || app.__BOOKORA_MODERATION_ROUTER_PATCHED__) return !!app;
    const originalLoadPage = app.loadPage.bind(app);
    app.loadPage = async (path, params) => {
      if (path === '/admin/moderation') {
        const pageModule = await import('./pages/AdminModerationPage.js?v=20260830-moderation-1');
        return { html: pageModule.renderAdminModerationPage() };
      }
      return originalLoadPage(path, params);
    };
    app.__BOOKORA_MODERATION_ROUTER_PATCHED__ = true;
    return true;
  }

  function ensureModerationNav() {
    document.querySelectorAll('a[href="#/admin/books"]').forEach(bookLink => {
      const parent = bookLink.parentElement;
      if (!parent || parent.querySelector('a[data-bookora-moderation-link]')) return;
      const link = document.createElement('a');
      link.href = '#/admin/moderation';
      link.className = 'nav-link';
      link.dataset.bookoraModerationLink = '1';
      link.textContent = 'Moderation';
      bookLink.insertAdjacentElement('afterend', link);
    });
  }

  function scheduleSettings() {
    clearTimeout(settingsTimer);
    if (isSettings()) settingsTimer = setTimeout(renderSettingsDirectly, 500);
  }

  function scheduleModeration() {
    clearTimeout(moderationTimer);
    moderationInitialized = false;
    if (!isModeration()) return;
    moderationTimer = setTimeout(() => {
      if (isModeration() && !document.querySelector('.admin-moderation-page')) renderModerationDirectly();
    }, 700);
  }

  window.addEventListener('hashchange', () => { patchCoreRouter(); ensureModerationNav(); scheduleSettings(); scheduleModeration(); }, true);
  window.addEventListener('pageshow', () => { patchCoreRouter(); ensureModerationNav(); scheduleSettings(); scheduleModeration(); }, true);
  window.addEventListener('bookora:route-ready', () => { patchCoreRouter(); ensureModerationNav(); scheduleSettings(); scheduleModeration(); }, true);

  const bootWatch = () => {
    patchCoreRouter();
    ensureModerationNav();
    if (window.__BOOKORA_CORE_BOOTED__) { scheduleSettings(); scheduleModeration(); return; }
    setTimeout(bootWatch, 120);
  };
  bootWatch();

  // Keep the lightweight observer alive because Header.js is recreated on SPA route changes.
  const observer = new MutationObserver(() => ensureModerationNav());
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
