/* Bookora — free sample SPA launcher.
 * Opens the dedicated FreeSamplePage.js route inside the existing SPA.
 * Never opens sample.html, a Google Drive viewer, or a modal.
 */
import { state } from './state.js';

(() => {
  'use strict';
  let busy = false;

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('#detail-preview-btn');
    if (!button || busy) return;

    const hash = (location.hash || '#/').split('?')[0];
    if (!hash.startsWith('#/book/')) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();

    const slug = decodeURIComponent(hash.slice('#/book/'.length));
    const book = state.getBookBySlug(slug);
    if (!book) {
      window.Toast?.show?.('Book data is still loading. Please try again.', 'info');
      return;
    }

    busy = true;
    button.disabled = true;
    const label = button.querySelector('span');
    if (label) label.textContent = 'Opening sample…';

    // Dedicated SPA route: /sample/:slug
    // No sample.html and no PDF viewer page.
    window.location.hash = `#/sample/${encodeURIComponent(book.slug || book.id || slug)}`;

    setTimeout(() => {
      busy = false;
      button.disabled = false;
      if (label) label.textContent = 'Read Free Sample';
    }, 1600);
  }, true);
})();
