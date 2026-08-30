// Bookora permanent ebook-card interaction bridge.
// Runs before the SPA modules so card clicks and wishlist clicks remain reliable
// even when older delegated handlers or homepage section rebuilders are present.
(() => {
  if (window.__BOOKORA_PERMANENT_CARD_INTERACTIONS__) return;
  window.__BOOKORA_PERMANENT_CARD_INTERACTIONS__ = true;

  const ensureStyles = () => {
    if (document.getElementById('bookora-permanent-card-interaction-styles')) return;
    const style = document.createElement('style');
    style.id = 'bookora-permanent-card-interaction-styles';
    style.textContent = `
      .book-card[data-book-id]{will-change:transform,opacity;transition:transform .24s ease,opacity .38s ease,box-shadow .24s ease}
      .book-card.bookora-card-reveal{opacity:0;transform:translateY(18px) scale(.985)}
      .book-card.bookora-card-visible{opacity:1;transform:translateY(0) scale(1)}
      .book-card[data-book-id]:hover{transform:translateY(-5px)}
      .book-card .book-wishlist-btn{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
      .book-card .book-wishlist-btn:disabled{pointer-events:none}
      .book-card .book-wishlist-btn.active{background:#E11D48!important;border-color:#E11D48!important;color:#fff!important;box-shadow:0 5px 14px rgba(225,29,72,.28)!important}
      .book-card .book-wishlist-btn.active:hover{background:#BE123C!important;border-color:#BE123C!important;color:#fff!important}
    `;
    document.head.appendChild(style);
  };

  const revealCard = card => {
    if (!card || card.dataset.bookoraReveal === '1') return;
    card.dataset.bookoraReveal = '1';
    card.classList.add('bookora-card-reveal');
    requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('bookora-card-visible')));
  };

  const scanCards = root => {
    ensureStyles();
    if (!root) return;
    if (root instanceof Element && root.matches('.book-card[data-book-id]')) revealCard(root);
    root.querySelectorAll?.('.book-card[data-book-id]').forEach(revealCard);
  };

  const goToBook = card => {
    const slug = String(card?.dataset?.bookSlug || '').trim();
    const id = String(card?.dataset?.bookId || '').trim();
    const target = slug || id;
    if (!target) return false;
    window.location.hash = `#/book/${target}`;
    return true;
  };

  const getTarget = event => event.target instanceof Element ? event.target : event.target?.parentElement || null;

  document.addEventListener('click', async event => {
    const target = getTarget(event);
    const card = target?.closest('.book-card[data-book-id]');
    if (!card) return;

    const wishlistButton = target.closest('.book-wishlist-btn');
    if (wishlistButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      const bookId = String(wishlistButton.dataset.id || card.dataset.bookId || '').trim();
      if (!bookId || wishlistButton.disabled) return;

      try {
        // Always load the persistence bridge first. This prevents a fast click
        // immediately after page load from reaching the older state implementation.
        await import('./wishlist-permission-fix.js?v=20260830-wishlist-1');
        const { state } = await import('./state.js');
        if (!state.isAuthenticated) {
          const returnTo = window.location.hash || '#/';
          window.location.hash = `#/login?returnTo=${encodeURIComponent(returnTo)}`;
          return;
        }

        wishlistButton.disabled = true;
        const added = await state.toggleWishlist(bookId);
        wishlistButton.classList.toggle('active', !!added);
        wishlistButton.textContent = added ? '♥' : '♡';
        wishlistButton.setAttribute('aria-label', added ? 'Remove from Wishlist' : 'Add to Wishlist');
        wishlistButton.setAttribute('title', added ? 'Remove from Wishlist' : 'Add to Wishlist');

        try {
          const { Toast } = await import('./components/Toast.js');
          Toast.show(added ? 'Added to Wishlist' : 'Removed from Wishlist', added ? 'success' : 'info');
        } catch (_) {}
      } catch (error) {
        console.error('[Bookora] Wishlist action failed:', error);
        try {
          const { Toast } = await import('./components/Toast.js');
          Toast.show('Wishlist could not be updated. Please try again.', 'error');
        } catch (_) {}
      } finally {
        wishlistButton.disabled = false;
      }
      return;
    }

    const action = target.closest('a,button,input,select,textarea,[role="button"]');
    if (action) {
      const href = action.getAttribute?.('href') || '';
      if (action.classList.contains('book-card-title-link') || href.startsWith('#/book/')) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        goToBook(card);
      }
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    goToBook(card);
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = getTarget(event);
    const card = target?.closest('.book-card[data-book-id]');
    if (!card) return;
    if (target.closest('button,a,input,select,textarea,[role="button"]')) return;
    event.preventDefault();
    goToBook(card);
  }, true);

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) scanCards(node);
      });
    }
  });

  const start = () => {
    ensureStyles();
    scanCards(document);
    observer.observe(document.body, { childList: true, subtree: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
