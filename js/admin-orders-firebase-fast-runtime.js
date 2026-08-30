// Bookora Admin Orders — Firebase fast/retry runtime.
// Keeps AdminOrdersPage as the single renderer and simply guarantees that its
// Firestore listener is started after Firebase/Auth are ready. This avoids the
// permanent "Loading orders..." state caused by script/module timing races.
(() => {
  'use strict';
  if (window.__BOOKORA_ADMIN_ORDERS_FAST_RUNTIME__) return;
  window.__BOOKORA_ADMIN_ORDERS_FAST_RUNTIME__ = true;

  const isOrdersRoute = () => String(location.hash || '').split('?')[0].replace(/\/+$/, '') === '#/admin/orders';
  let timer = null;
  let attempts = 0;
  let started = false;

  const tryStart = async () => {
    if (!isOrdersRoute() || started) return;
    if (!window.firebase?.firestore) return;

    try {
      const mod = await import('./pages/AdminOrdersPage.js?v=20260830-orders-fast-2');
      if (typeof mod.initAdminOrdersEvents !== 'function') return;
      // The page module already owns its listener and safely unsubscribes the
      // previous one before creating a new one, so this is idempotent.
      mod.initAdminOrdersEvents();
      started = true;
      clearInterval(timer);
      timer = null;
    } catch (error) {
      console.warn('[Bookora Admin Orders fast runtime]', error?.message || error);
    }
  };

  const schedule = () => {
    if (!isOrdersRoute()) return;
    attempts = 0;
    clearInterval(timer);
    timer = setInterval(() => {
      attempts += 1;
      void tryStart();
      if (attempts >= 30) { clearInterval(timer); timer = null; }
    }, 500);
    void tryStart();
  };

  window.addEventListener('hashchange', () => {
    started = false;
    schedule();
  });
  window.addEventListener('bookora:route-ready', () => {
    started = false;
    schedule();
  });
  window.addEventListener('load', schedule, { once: true });
  [100, 500, 1000, 2000, 4000].forEach(delay => setTimeout(schedule, delay));
  schedule();
})();
