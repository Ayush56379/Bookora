/* Bookora final interaction + eBook card guard. */
(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  function closeMobileLayers() {
    const drawer = $('mobile-nav-drawer');
    const backdrop = $('mobile-drawer-backdrop');
    if (drawer) drawer.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    document.documentElement.classList.remove('bookora-menu-open');
    document.body.classList.remove('bookora-menu-open');
    if (drawer) drawer.setAttribute('aria-hidden', 'true');
    if (backdrop) backdrop.setAttribute('aria-hidden', 'true');
    const toggle = $('mobile-nav-toggle-btn');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open Navigation Drawer');
    }
  }

  function go(value) {
    const valueText = String(value || '').trim();
    if (!valueText) return false;
    closeMobileLayers();
    if (valueText.startsWith('#/')) {
      if (location.hash === valueText) window.dispatchEvent(new Event('hashchange'));
      else location.hash = valueText;
      return true;
    }
    if (valueText.startsWith('/') && !valueText.startsWith('//')) { location.href = valueText; return true; }
    if (/^https?:\/\//i.test(valueText)) { location.href = valueText; return true; }
    return false;
  }

  window.addEventListener('hashchange', closeMobileLayers, { passive: true });
  window.addEventListener('pageshow', closeMobileLayers, { passive: true });

  new MutationObserver(() => {
    if (!$('mobile-nav-drawer') || !$('mobile-drawer-backdrop')) closeMobileLayers();
  }).observe(document.documentElement, { childList: true, subtree: true });

  // Any visible part of an eBook card opens its Details page.
  // Interactive controls keep their own behavior: wishlist, preview, buy, links.
  document.addEventListener('click', event => {
    if (event.defaultPrevented) return;
    const element = event.target instanceof Element ? event.target : null;
    const card = element?.closest('.book-card[data-book-id]');
    if (!card) return;
    if (element.closest('button,a,input,select,textarea,[role="button"]')) return;
    const directLink = card.querySelector('.book-card-title-link[href^="#/book/"], .book-quick-actions a[href^="#/book/"]');
    if (directLink?.getAttribute('href')) {
      event.preventDefault();
      go(directLink.getAttribute('href'));
    }
  });

  document.addEventListener('keydown', event => {
    if (event.defaultPrevented) return;
    const element = event.target instanceof Element ? event.target : null;
    const card = element?.closest('.book-card[data-book-id]');
    if (!card || (event.key !== 'Enter' && event.key !== ' ')) return;
    if (element.closest('button,a,input,select,textarea,[role="button"]') && element !== card) return;
    const directLink = card.querySelector('.book-card-title-link[href^="#/book/"]');
    if (directLink?.getAttribute('href')) {
      event.preventDefault();
      go(directLink.getAttribute('href'));
    }
  });

  document.addEventListener('click', event => {
    if (event.defaultPrevented) return;
    const element = event.target instanceof Element ? event.target.closest('button,[role="button"]') : null;
    if (!element) return;
    const route = element.dataset.route || element.dataset.navigate || element.dataset.href || element.getAttribute('data-url');
    if (route) go(route);
  });

  document.addEventListener('click', event => {
    if (event.defaultPrevented) return;
    const anchor = event.target instanceof Element ? event.target.closest('a[href^="#/"]') : null;
    if (anchor) closeMobileLayers();
  });

  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || (event.key !== 'Enter' && event.key !== ' ')) return;
    const element = event.target instanceof Element ? event.target.closest('button,[role="button"]') : null;
    if (!element) return;
    const route = element.dataset.route || element.dataset.navigate || element.dataset.href || element.getAttribute('data-url');
    if (!route) return;
    event.preventDefault();
    go(route);
  });

  // Keep cover images sharp and correctly proportioned on every catalog card.
  const style = document.createElement('style');
  style.id = 'bookora-card-visual-hotfix';
  style.textContent = `
    .book-cover-premium{aspect-ratio:2/3!important;height:auto!important;min-height:0!important;}
    .book-cover-premium .book-cover-image{object-fit:cover!important;object-position:center!important;image-rendering:auto!important;}
    .book-cover-premium .book-cover-image{background:#f8fafc;}
    @media(max-width:700px){.book-cover-premium{aspect-ratio:2/3!important;}}
  `;
  document.head.appendChild(style);

  window.BookoraClickSafety = Object.freeze({ closeMobileLayers, go });
})();
