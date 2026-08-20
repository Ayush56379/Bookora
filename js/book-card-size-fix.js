// Bookora — compact KDP-style eBook card sizing
// Keeps the standard 6x9 (2:3) cover proportion while preventing oversized cards.
(() => {
  const STYLE_ID = 'bookora-compact-book-card-size';
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    /* Standard paperback-style display proportion: 6 x 9 = 2:3. */
    .book-card-premium {
      width: 220px !important;
      max-width: 220px !important;
      min-width: 0 !important;
      justify-self: center;
    }

    .book-card-premium .book-cover-premium {
      width: 220px !important;
      height: 330px !important;
      aspect-ratio: 2 / 3 !important;
      max-width: 220px !important;
      min-height: 0 !important;
    }

    .book-card-premium .book-card-info {
      width: 220px !important;
      box-sizing: border-box;
    }

    @media (max-width: 700px) {
      .book-card-premium {
        width: 190px !important;
        max-width: 190px !important;
      }

      .book-card-premium .book-cover-premium {
        width: 190px !important;
        height: 285px !important;
        max-width: 190px !important;
      }

      .book-card-premium .book-card-info {
        width: 190px !important;
      }
    }

    @media (max-width: 420px) {
      .book-card-premium {
        width: 170px !important;
        max-width: 170px !important;
      }

      .book-card-premium .book-cover-premium {
        width: 170px !important;
        height: 255px !important;
        max-width: 170px !important;
      }

      .book-card-premium .book-card-info {
        width: 170px !important;
      }
    }
  `;
  document.head.appendChild(style);
})();
