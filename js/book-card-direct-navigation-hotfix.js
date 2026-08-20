// Bookora: direct eBook card navigation hotfix.
// Uses pointer/click capture and delegates routing to the SPA hash.
(() => {
  'use strict';
  if (window.__BOOKORA_DIRECT_CARD_NAV_V3__) return;
  window.__BOOKORA_DIRECT_CARD_NAV_V3__ = true;

  const interactive = target => target?.closest?.('a,button,input,select,textarea,[role="button"]');

  const navigate = card => {
    const href = card?.dataset?.detailHref || card?.querySelector?.('.book-card-title-link')?.getAttribute('href');
    if (!href || !href.startsWith('#/book/')) return false;
    const hash = href.slice(1);
    if (window.location.hash === hash) window.dispatchEvent(new Event('hashchange'));
    else window.location.hash = hash;
    return true;
  };

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const card = target?.closest?.('.book-card[data-book-id]');
    if (!card || interactive(target)) return;

    const href = card.dataset.detailHref || card.querySelector('.book-card-title-link')?.getAttribute('href');
    if (!href) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    navigate(card);
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target instanceof Element ? event.target : null;
    const card = target?.closest?.('.book-card[data-book-id]');
    if (!card || interactive(target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    navigate(card);
  }, true);
})();
