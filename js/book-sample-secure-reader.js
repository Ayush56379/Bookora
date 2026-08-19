/* Bookora — dedicated free sample page launcher.
 * The sample is intentionally opened as a separate page, not a modal and not a Drive viewer.
 */
import { state } from './state.js';

(() => {
  'use strict';
  let busy = false;

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('#detail-preview-btn');
    if (!button || busy) return;

    const hash = (location.hash || '').split('?')[0];
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
    const oldLabel = label?.textContent || 'Read Free Sample';
    if (label) label.textContent = 'Opening sample…';

    const sampleUrl = `./sample.html?book=${encodeURIComponent(book.slug || book.id || slug)}`;
    window.location.href = sampleUrl;

    setTimeout(() => {
      busy = false;
      button.disabled = false;
      if (label) label.textContent = oldLabel;
    }, 2500);
  }, true);
})();
