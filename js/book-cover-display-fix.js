// Bookora — preserve the complete uploaded eBook cover in catalog cards.
// Real cover images must never be cropped or covered by generated card text.
(() => {
  const STYLE_ID = 'bookora-complete-cover-display-fix';
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* Uploaded cover: show the entire source image, never crop it. */
    .book-card-premium .book-cover-container:has(.book-cover-image):not(.cover-image-failed) {
      background: #fff !important;
    }

    .book-card-premium .book-cover-container:has(.book-cover-image):not(.cover-image-failed) .book-cover-image {
      object-fit: contain !important;
      object-position: center center !important;
      transform: none !important;
      background: #fff !important;
    }

    /* Do not place generated title/category/author text or gradients over a real cover. */
    .book-card-premium .book-cover-container:has(.book-cover-image):not(.cover-image-failed) .book-cover-shade,
    .book-card-premium .book-cover-container:has(.book-cover-image):not(.cover-image-failed) .book-cover-spine,
    .book-card-premium .book-cover-container:has(.book-cover-image):not(.cover-image-failed) .book-cover-content {
      display: none !important;
    }

    /* If the real image fails, restore the normal generated fallback. */
    .book-card-premium .book-cover-container.cover-image-failed .book-cover-image {
      display: none !important;
    }

    .book-card-premium .book-cover-container.cover-image-failed .book-cover-shade,
    .book-card-premium .book-cover-container.cover-image-failed .book-cover-spine {
      display: block !important;
    }

    /* Keep the cover fully visible on mobile too. */
    @media (max-width: 700px) {
      .book-card-premium .book-cover-image {
        object-fit: contain !important;
      }
    }
  `;
  document.head.appendChild(style);
})();
