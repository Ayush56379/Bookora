// Bookora mobile/profile menu interaction stability fix.
// This file also installs the route no-loading-flash guard before/while the SPA boots.
(() => {
  if (window.__BOOKORA_MENU_PERMANENT_FIX__) return;
  window.__BOOKORA_MENU_PERMANENT_FIX__ = true;

  const getDrawer = () => document.getElementById('mobile-nav-drawer');
  const getBackdrop = () => document.getElementById('mobile-drawer-backdrop');
  const getToggle = () => document.getElementById('mobile-nav-toggle-btn');

  const close = () => {
    const drawer = getDrawer(); const backdrop = getBackdrop();
    drawer?.classList.remove('open'); backdrop?.classList.remove('open');
    drawer?.setAttribute('aria-hidden', 'true'); backdrop?.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('bookora-menu-open');
    document.body.classList.remove('bookora-menu-open');
    getToggle()?.setAttribute('aria-expanded', 'false');
    getToggle()?.setAttribute('aria-label', 'Open Navigation Drawer');
  };
  const open = () => {
    const drawer = getDrawer(); const backdrop = getBackdrop();
    if (!drawer || !backdrop) return;
    drawer.classList.add('open'); backdrop.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false'); backdrop.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('bookora-menu-open');
    document.body.classList.add('bookora-menu-open');
    getToggle()?.setAttribute('aria-expanded', 'true');
    getToggle()?.setAttribute('aria-label', 'Close Navigation Drawer');
  };

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const toggle = target.closest('#mobile-nav-toggle-btn');
    if (toggle) {
      event.preventDefault(); event.stopImmediatePropagation();
      if (getDrawer()?.classList.contains('open')) close(); else open(); return;
    }
    if (target.closest('#mobile-drawer-close-btn') || target.closest('#mobile-drawer-backdrop')) { event.preventDefault(); close(); return; }
    if (target.closest('.mobile-drawer-link')) close();
  }, true);
  window.addEventListener('hashchange', close, { passive: true });
  window.addEventListener('pageshow', close, { passive: true });
  window.addEventListener('resize', () => { if (window.innerWidth > 930) close(); }, { passive: true });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  window.BookoraMenuSafety = Object.freeze({ open, close });

  // Permanent SPA route guard. app-safe inserts a temporary Loading shell before
  // every render; that shell causes the visible blink. Keep the current DOM during
  // route changes and make the first-boot placeholder invisible.
  const installRouteGuard = () => {
    const app = window.__BOOKORA_APP_INSTANCE__;
    if (!app || typeof app.route !== 'function' || app.__noLoadingFlashGuard) return !!app;
    const originalRoute = app.route.bind(app);
    app.route = async (force = false, navigation = false) => {
      const hash = window.location.hash || '#/';
      const main = document.querySelector('#main-content');
      if (!navigation && app.lastHash === hash && main) return;
      const root = app.root;
      let descriptor, proto = root;
      while (proto && !descriptor) { descriptor = Object.getOwnPropertyDescriptor(proto, 'innerHTML'); proto = Object.getPrototypeOf(proto); }
      let guarded = false;
      if (root && descriptor?.set) {
        const setter = descriptor.set, getter = descriptor.get;
        try {
          Object.defineProperty(root, 'innerHTML', {
            configurable: true, enumerable: descriptor.enumerable,
            get: getter ? () => getter.call(root) : undefined,
            set(value) {
              const html = String(value ?? '');
              if (html.includes('Loading Bookora…') || html.includes('Loading Bookora...')) {
                if (root.querySelector('#main-content')) return;
                const placeholder = '<div aria-hidden="true" style="height:60vh;min-height:420px;visibility:hidden;pointer-events:none"></div>';
                setter.call(root, html.replace(/<div[^>]*>Loading Bookora(?:…|\.\.\.)<\/div>/, placeholder));
                return;
              }
              setter.call(root, value);
            }
          });
          guarded = true;
        } catch (_) {}
      }
      try { return await originalRoute(force, navigation); }
      finally { if (guarded) { try { delete root.innerHTML; } catch (_) {} } }
    };
    app.__noLoadingFlashGuard = true;
    return true;
  };
  const started = performance.now();
  const timer = setInterval(() => { if (installRouteGuard() || performance.now() - started > 15000) clearInterval(timer); }, 25);
  installRouteGuard();
})();
