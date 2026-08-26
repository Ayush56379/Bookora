// Bookora admin route integrity guard.
// Keeps the visible admin page synchronized with the URL hash after any
// legacy/optional runtime finishes rendering. It only acts on admin routes
// and only when the expected page root is missing.
(() => {
  const expected = {
    '/admin': '.admin-dashboard',
    '/admin/overview': '.admin-dashboard',
    '/admin/users': '.admin-users',
    '/admin/sellers': '.admin-sellers',
    '/admin/books': '.admin-books',
    '/admin/orders': '.admin-orders',
    '/admin/plans': '.admin-plans',
    '/admin/subscriptions': '.admin-plans',
    '/admin/settings': '.admin-settings',
    '/admin/security': '.admin-security',
    '/admin/ai-diagnostics': '.admin-ai-diagnostics'
  };

  let timer = null;
  let lastCheckedHash = '';
  let repairing = false;

  const path = () => (window.location.hash || '#/').split('?')[0].replace(/^#/, '') || '/';

  const check = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const p = path();
      const selector = expected[p];
      if (!selector || repairing) return;

      const hash = window.location.hash || '#/';
      const main = document.getElementById('main-content');
      if (hash === lastCheckedHash && main?.querySelector(selector)) return;
      lastCheckedHash = hash;

      // Give the core router and page init callbacks a chance to finish.
      setTimeout(() => {
        if (path() !== p || repairing) return;
        const liveMain = document.getElementById('main-content');
        if (liveMain?.querySelector(selector)) return;

        const app = window.__BOOKORA_APP_INSTANCE__;
        if (!app || typeof app.requestRoute !== 'function') return;
        repairing = true;
        try { app.requestRoute(true, true); }
        catch (e) { console.warn('[Bookora admin route integrity]', e); }
        finally { setTimeout(() => { repairing = false; }, 250); }
      }, 350);
    }, 50);
  };

  window.addEventListener('hashchange', check, true);
  window.addEventListener('popstate', check, true);
  window.addEventListener('load', check, true);
  setTimeout(check, 900);
  setTimeout(check, 2500);
})();
