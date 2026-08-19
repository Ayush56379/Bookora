/* Bookora — free sample SPA page launcher.
 * The sample is rendered by a JS page module inside the existing Bookora SPA.
 * It does NOT open sample.html, a Drive viewer, or a modal.
 */
import { state } from './state.js';
import { renderFreeSamplePage, initFreeSamplePage } from './pages/FreeSamplePage.js';

(() => {
  'use strict';
  let busy = false;
  let activeHash = '';

  function getSampleRoute() {
    const raw = location.hash || '#/';
    const [pathPart, queryPart = ''] = raw.split('?');
    if (!pathPart.startsWith('#/book/')) return null;
    const params = new URLSearchParams(queryPart);
    if (params.get('sample') !== '1') return null;
    return { path: pathPart, slug: decodeURIComponent(pathPart.slice('#/book/'.length)) };
  }

  async function openSampleRoute() {
    const route = getSampleRoute();
    if (!route) {
      activeHash = '';
      return;
    }
    if (activeHash === location.hash && document.getElementById('bookora-free-sample-page')) return;
    activeHash = location.hash;

    const book = state.getBookBySlug(route.slug);
    if (!book) {
      setTimeout(openSampleRoute, 150);
      return;
    }

    const main = document.querySelector('#main-content');
    if (!main) {
      setTimeout(openSampleRoute, 80);
      return;
    }

    main.outerHTML = renderFreeSamplePage(book);
    await initFreeSamplePage(book);
  }

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('#detail-preview-btn');
    if (!button || busy) return;

    const hash = location.hash || '#/';
    if (!hash.startsWith('#/book/')) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();

    const slug = decodeURIComponent(hash.split('?')[0].slice('#/book/'.length));
    const book = state.getBookBySlug(slug);
    if (!book) {
      window.Toast?.show?.('Book data is still loading. Please try again.', 'info');
      return;
    }

    busy = true;
    button.disabled = true;
    const label = button.querySelector('span');
    if (label) label.textContent = 'Opening sample…';

    // Keep the existing Bookora SPA route structure. Only the query changes,
    // so app.js continues to treat this as the public /book/:slug route.
    window.location.hash = `#/book/${encodeURIComponent(book.slug || book.id || slug)}?sample=1`;
    setTimeout(() => { busy = false; }, 1800);
  }, true);

  window.addEventListener('hashchange', () => setTimeout(openSampleRoute, 0));
  window.addEventListener('load', () => setTimeout(openSampleRoute, 0));
})();
