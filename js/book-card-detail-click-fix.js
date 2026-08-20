// Bookora: make the whole eBook card open its detail page.
// Existing links/buttons (wishlist, title, buy/read, external links) keep their own behavior.
(() => {
  if (window.__bookoraBookCardDetailClickFix) return;
  window.__bookoraBookCardDetailClickFix = true;

  const openDetail = (card) => {
    const id = String(card?.dataset?.bookId || '').trim();
    if (!id) return;

    // Prefer the rendered title-link href so slug handling stays identical to BookCard.
    const titleLink = card.querySelector('.book-card-title-link[href]');
    const href = titleLink?.getAttribute('href');
    if (href) {
      window.location.hash = href.startsWith('#') ? href.slice(1) : href;
      return;
    }

    window.location.hash = `#/book/${encodeURIComponent(id)}`;
  };

  document.addEventListener('click', (event) => {
    const card = event.target.closest?.('.book-card[data-book-id]');
    if (!card) return;

    // Never hijack controls/links inside the card.
    if (event.target.closest('a, button, input, select, textarea, [role="button"]')) return;

    openDetail(card);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target.closest?.('.book-card[data-book-id]');
    if (!card || event.target.closest('a, button, input, select, textarea, [role="button"]')) return;
    event.preventDefault();
    openDetail(card);
  });
})();
