/* Permanent auth-route guard.
   Keeps authenticated Firebase users out of login/signup/register pages.
   It is deliberately isolated from the SPA renderer so it cannot destabilize routing. */
(() => {
  const AUTH_ROUTES = new Set(['#/login', '#/signup', '#/register']);
  let firebaseListenerInstalled = false;
  let lastRedirect = '';

  const isAuthRoute = () => AUTH_ROUTES.has((window.location.hash || '#/').split('?')[0]);

  const redirectHome = () => {
    if (!isAuthRoute()) return false;
    if (lastRedirect === window.location.hash) return true;
    lastRedirect = window.location.hash;
    window.location.hash = '#/';
    return true;
  };

  const install = () => {
    if (firebaseListenerInstalled) return true;
    const auth = window.firebase?.auth?.();
    if (!auth?.onAuthStateChanged) return false;
    firebaseListenerInstalled = true;
    auth.onAuthStateChanged(user => {
      if (user) redirectHome();
    });
    return true;
  };

  const boot = () => {
    if (!isAuthRoute()) return;
    if (install()) return;
    const timer = setInterval(() => {
      if (install()) clearInterval(timer);
    }, 200);
    setTimeout(() => clearInterval(timer), 10000);
  };

  window.addEventListener('hashchange', boot);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
