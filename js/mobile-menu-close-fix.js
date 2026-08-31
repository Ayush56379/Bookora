// Bookora — mobile menu close-only reliability fix.
// This patch intentionally touches only the close interaction of the existing drawer.
(() => {
  const DRAWER = '.mobile-nav-drawer';

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

  // Event delegation keeps this working even when the SPA replaces the header.
  document.addEventListener('click', event => {
    const drawer = event.target?.closest?.(DRAWER);
    if (!drawer) return;
    if (isCloseControl(event.target)) {
      event.preventDefault();
      event.stopPropagation();
      closeDrawer();
    }
  }, true);

  // The backdrop is also a close action; preserve the existing open behavior.
  document.addEventListener('click', event => {
    if (event.target?.closest?.('.drawer-backdrop')) {
      closeDrawer();
    }
  }, true);

  window.__BOOKORA_CLOSE_MOBILE_MENU__ = closeDrawer;
})();
