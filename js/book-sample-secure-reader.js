/* Bookora — free sample in-page reader.
 * Opens selected sample pages as images in a clean overlay above the current book page.
 * Never opens sample.html, a Google Drive viewer, or a separate sample page.
 */
import { state } from './state.js';
import { renderFreeSamplePage, initFreeSamplePage, closeFreeSamplePage } from './pages/FreeSamplePage.js';

(() => {
  'use strict';
  let busy = false;

  function close() {
    closeFreeSamplePage();
    document.removeEventListener('keydown', onKeyDown);
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') close();
  }

  document.addEventListener('click', async (event) => {
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

    // Keep the user on the current Book Detail page.
    // The sample is an overlay, so there is no route change or page reload.
    document.getElementById('bookora-free-sample-page')?.remove();
    document.body.insertAdjacentHTML('beforeend', renderFreeSamplePage(book));
    document.body.classList.add('bookora-sample-open');
    document.addEventListener('keydown', onKeyDown);

    try {
      await initFreeSamplePage(book);
    } finally {
      busy = false;
      button.disabled = false;
      if (label) label.textContent = 'Read Free Sample';
    }
  }, true);
})();
