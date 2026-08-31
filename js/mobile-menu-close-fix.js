// Bookora — mobile menu positioning + close reliability fix.
// This patch only controls the existing mobile navigation drawer layer.
// It does not change navigation links, routing, data, Firebase, or page content.
(() => {
  const DRAWER = '.mobile-nav-drawer';
  const STYLE_ID = 'bookora-mobile-menu-layer-fix';

  function installLayerStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      @media (max-width: 868px) {
        .mobile-nav-drawer {
          position: fixed !important;
          top: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          left: auto !important;
          width: min(88vw, 340px) !important;
          max-width: 340px !important;
          height: 100dvh !important;
          max-height: 100dvh !important;
          margin: 0 !important;
          padding: 1rem !important;
          background: #fff !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;
          box-sizing: border-box !important;
          transform: translate3d(100%, 0, 0) !important;
          transition: transform .25s ease, visibility .25s ease !important;
          visibility: hidden !important;
          pointer-events: none !important;
          z-index: 2147483001 !important;
        }
        .mobile-nav-drawer.open {
          transform: translate3d(0, 0, 0) !important;
          visibility: visible !important;
          pointer-events: auto !important;
        }
        .drawer-backdrop {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100dvh !important;
          margin: 0 !important;
          z-index: 2147483000 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function closeDrawer() {
    const drawer = document.querySelector(DRAWER);
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');

    document.querySelectorAll('.drawer-backdrop.open').forEach(el => {
      el.classList.remove('open');
      el.setAttribute('aria-hidden', 'true');
    });

    document.documentElement.classList.remove('bookora-menu-open');
    document.body.classList.remove('bookora-menu-open');
  }

  function isCloseControl(target) {
    const el = target?.closest?.('button, a, [role="button"]');
    if (!el) return false;
    if (el.matches('.mobile-nav-close,[data-mobile-menu-close],[data-close-menu],[aria-label*="close" i],[title*="close" i]')) return true;
    const text = (el.textContent || '').trim();
    return text === '×' || text === '✕' || text === '✖';
  }

  installLayerStyles();

  // Event delegation keeps this working when the SPA replaces the header.
  document.addEventListener('click', event => {
    const drawer = event.target?.closest?.(DRAWER);
    if (!drawer) return;
    if (isCloseControl(event.target)) {
      event.preventDefault();
      event.stopPropagation();
      closeDrawer();
    }
  }, true);

  document.addEventListener('click', event => {
    if (event.target?.closest?.('.drawer-backdrop')) {
      closeDrawer();
    }
  }, true);

  window.__BOOKORA_CLOSE_MOBILE_MENU__ = closeDrawer;
})();
