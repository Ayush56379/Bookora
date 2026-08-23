// Bookora startup compatibility bridge.
// Mobile mode switching remains permanently disabled.
// IMPORTANT: never import language-runtime.js here.
//
// app.js historically attached its first route to window "load". If an external
// resource keeps the browser load lifecycle pending, the SPA shell can remain
// blank even though the app module itself has initialized. Trigger the existing
// app route once DOMContentLoaded has completed so the UI does not depend on
// slow external resources. This does NOT reload the page.

const bootBookoraRoute = () => {
  if (window.__BOOKORA_STARTUP_ROUTE_TRIGGERED__) return;
  window.__BOOKORA_STARTUP_ROUTE_TRIGGERED__ = true;

  // Give the app module's DOMContentLoaded handler a microtask/paint boundary
  // to construct the App instance and register its route listener.
  setTimeout(() => {
    try {
      const appRoot = document.getElementById('app');
      if (!appRoot) return;

      // Only trigger the existing route when the SPA has not rendered yet.
      // Never use location.reload(); never create a repeating timer.
      if (!appRoot.querySelector('#main-content')) {
        window.dispatchEvent(new Event('load'));
      }
    } catch (error) {
      console.error('[Bookora] Startup route bridge failed:', error);
    }
  }, 0);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootBookoraRoute, { once: true });
} else {
  bootBookoraRoute();
}
