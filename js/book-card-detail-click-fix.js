// Bookora: reliable whole eBook card -> Details navigation.
// Interactive controls (wishlist, links, buttons, inputs) keep their own behavior.
(() => {
  'use strict';

  if (window.__bookoraBookCardDetailClickFixV2) return;
  window.__bookoraBookCardDetailClickFixV2 = true;

  const isInteractive = target => Boolean(
    target?.closest?.('a, button, input, select, textarea, [role="button"]')
  );

  const getDetailHref = card => {
    const titleLink = card.querySelector('.book-card-title-link[href^="#/book/"]');
    const href = titleLink?.getAttribute('href');
    if (href) return href;

    const id = String(card.dataset.bookId || '').trim();
    if (!id) return '';
    return `#/book/${encodeURIComponent(id)}`;
  };

  const openDetail = (card, event) => {
    if (!card || isInteractive(event.target)) return;

    const href = getDetailHref(card);
    if (!href) return;

    event.preventDefault();
    event.stopPropagation();

    // Use the SPA hash router instead of a full-page navigation.
    if (window.location.hash === href) {
      window.dispatchEvent(new Event('hashchange'));
    } else {
      window.location.hash = href.startsWith('#') ? href.slice(1) : href;
    }
  };

  // Capture phase makes the card navigation reliable even when another
  // document-level click handler calls preventDefault() later in bubbling.
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    const card = target?.closest('.book-card[data-book-id]');
    if (!card) return;
    openDetail(card, event);
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    const target = event.target instanceof Element ? event.target : null;
    const card = target?.closest('.book-card[data-book-id]');
    if (!card || target !== card) return;

    const href = getDetailHref(card);
    if (!href) return;

    event.preventDefault();
    event.stopPropagation();
    window.location.hash = href.startsWith('#') ? href.slice(1) : href;
  });
})();
