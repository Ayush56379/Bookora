// Bookora: reliable eBook card -> detail navigation.
// Uses the card's stable book id so navigation does not depend on a generated slug.
(() => {
  'use strict';
  if (window.__BOOKORA_DIRECT_CARD_NAV_V4__) return;
  window.__BOOKORA_DIRECT_CARD_NAV_V4__ = true;

  const isInteractive = target => Boolean(target?.closest?.('a,button,input,select,textarea,[role="button"]'));

  function navigate(card) {
    if (!card) return false;
    const id = String(card.dataset.bookId || '').trim();
    if (!id) return false;

    const href = `#/book/${encodeURIComponent(id)}`;
    if (window.location.hash === href) {
      window.dispatchEvent(new Event('hashchange'));
    } else {
      window.location.hash = href.slice(1);
    }
    return true;
  }

  function handle(event) {
    const target = event.target instanceof Element ? event.target : null;
    const card = target?.closest?.('.book-card[data-book-id]');
    if (!card || isInteractive(target)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    navigate(card);
  }

  // Capture click/pointer activation before other global handlers.
  document.addEventListener('click', handle, true);
  document.addEventListener('pointerup', event => {
    const target = event.target instanceof Element ? event.target : null;
    const card = target?.closest?.('.book-card[data-book-id]');
    if (!card || isInteractive(target)) return;
    navigate(card);
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target instanceof Element ? event.target : null;
    const card = target?.closest?.('.book-card[data-book-id]');
    if (!card || target !== card) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    navigate(card);
  }, true);
})();
