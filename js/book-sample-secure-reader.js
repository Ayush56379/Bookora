/* Bookora — canonical free-sample launcher. */
import { state } from './state.js';
import { renderFreeSamplePage, initFreeSamplePage, closeFreeSamplePage } from './pages/FreeSamplePage.js?v=20260820-5';

(() => {
  let busy = false;
  const close = () => { closeFreeSamplePage(); document.removeEventListener('keydown', onKeyDown); };
  const onKeyDown = e => { if (e.key === 'Escape') close(); };

  document.addEventListener('click', async event => {
    const target = event.target instanceof Element ? event.target : null;
    const button = target?.closest('#detail-preview-btn');
    if (!button || busy) return;
    const hash = (location.hash || '').split('?')[0];
    if (!hash.startsWith('#/book/')) return;
    event.preventDefault(); event.stopImmediatePropagation(); event.stopPropagation();
    const book = state.getBookBySlug(decodeURIComponent(hash.slice(7)));
    if (!book) { window.Toast?.show?.('Book data is still loading. Please try again.', 'info'); return; }
    busy = true; button.disabled = true;
    const label = button.querySelector('span'); if (label) label.textContent = 'Opening sample…';
    closeFreeSamplePage();
    document.body.insertAdjacentHTML('beforeend', renderFreeSamplePage(book));
    document.body.classList.add('bookora-sample-open'); document.addEventListener('keydown', onKeyDown);
    try { await initFreeSamplePage(book); }
    finally { busy = false; button.disabled = false; if (label) label.textContent = 'Read Free Sample'; if (!document.getElementById('bookora-free-sample-page')) document.removeEventListener('keydown', onKeyDown); }
  }, true);
})();
