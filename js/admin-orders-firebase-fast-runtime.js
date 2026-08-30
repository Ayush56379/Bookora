// Bookora Admin Orders — Firebase fast/retry runtime.
// Keeps AdminOrdersPage as the single renderer and simply guarantees that its
// Firestore listener is started after Firebase/Auth are ready. This avoids the
// permanent "Loading orders..." state caused by script/module timing races.
(() => {
  'use strict';
  if (window.__BOOKORA_ADMIN_ORDERS_FAST_RUNTIME__) return;
  window.__BOOKORA_ADMIN_ORDERS_FAST_RUNTIME__ = true;

  const isOrdersRoute = () => String(location.hash || '').split('?')[0].replace(/\/+$/, '') === '#/admin/orders';
  const isAdminReady = () => {
    const state = window.__BOOKORA_STATE_MODULE__?.state;
    const user = state?.currentUser || {};
    return !!(state?.isAdmin === true || user.role === 'admin' || user.isMasterAdmin === true || String(user.email || '').toLowerCase() === 'ayushprajpati6@gmail.com');
  };
  let timer = null;
  let attempts = 0;
  let started = false;
  let starting = false;

  const tryStart = async () => {
    if (!isOrdersRoute() || started || starting) return;
    if (!window.firebase?.firestore || !isAdminReady()) return;
    starting = true;
    try {
      const mod = await import('./pages/AdminOrdersPage.js?v=20260830-orders-fast-3');
      if (typeof mod.initAdminOrdersEvents !== 'function') return;
      // AdminOrdersPage owns the single Firestore listener and unsubscribes its
      // previous listener before creating a new one, so this retry is idempotent.
      mod.initAdminOrdersEvents();
      started = true;
      clearInterval(timer);
      timer = null;
    } catch (error) {
      console.warn('[Bookora Admin Orders fast runtime]', error?.message || error);
    } finally {
      starting = false;
    }
  };

  const schedule = () => {
    if (!isOrdersRoute()) return;
    attempts = 0;
    clearInterval(timer);
    timer = setInterval(() => {
      attempts += 1;
      void tryStart();
      if (attempts >= 60) { clearInterval(timer); timer = null; }
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
  [100, 500, 1000, 2000, 4000, 8000].forEach(delay => setTimeout(schedule, delay));
  schedule();
})();
