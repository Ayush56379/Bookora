/* Bookora — secure free-sample image gallery
 * The backend returns a NEW PDF containing only the first 5 pages.
 * The original Google Drive PDF is never opened by the browser.
 * The returned sample is rendered into images; no browser PDF viewer is used.
 */
import { state } from './state.js';

(() => {
  'use strict';

  const MAX_PAGES = 5;
  const BACKEND_URL = String(window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com').replace(/\/$/, '');
  let busy = false;

  const esc = s => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function currentBook() {
    try {
      const hash = (location.hash || '').split('?')[0];
      return hash.startsWith('#/book/') ? state.getBookBySlug(decodeURIComponent(hash.slice(7))) : null;
    } catch (_) { return null; }
  }

  async function requestSample(book) {
    const slug = String(book?.slug || book?.id || '').trim();
    if (!slug) throw new Error('Book identifier is missing.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch(`${BACKEND_URL}/api/books/${encodeURIComponent(slug)}/sample`, {
        method: 'GET', headers: { 'Accept': 'application/pdf' }, cache: 'no-store', signal: controller.signal
      });
      const contentType = String(response.headers.get('content-type') || '').toLowerCase();
      if (!response.ok) {
        let message = `Sample could not be generated (${response.status}).`;
        try { const data = await response.json(); if (data?.error) message = data.error; } catch (_) {}
        throw new Error(message);
      }
      if (!contentType.includes('application/pdf')) throw new Error('Sample backend returned an invalid response.');
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (!bytes.length) throw new Error('The sample is empty.');
      return bytes;
    } catch (error) {
      if (error?.name === 'AbortError') throw new Error('Sample generation timed out. Please try again.');
      throw error;
    } finally { clearTimeout(timer); }
  }

  function removeModal() {
    document.getElementById('bookora-secure-sample-modal')?.remove();
    document.documentElement.classList.remove('bookora-sample-open');
  }

  function addStyles() {
    if (document.getElementById('bookora-secure-sample-styles')) return;
    const style = document.createElement('style');
    style.id = 'bookora-secure-sample-styles';
    style.textContent = `
      html.bookora-sample-open,html.bookora-sample-open body{overflow:hidden!important}
      #bookora-secure-sample-modal{position:fixed!important;inset:0!important;z-index:2147483000!important;background:rgba(15,23,42,.82)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:16px!important}
      #bookora-secure-sample-modal .bosr-shell{width:min(1120px,100%)!important;height:min(94vh,980px)!important;background:#f1f5f9!important;border-radius:20px!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;box-shadow:0 30px 100px rgba(0,0,0,.38)!important}
      #bookora-secure-sample-modal .bosr-head{height:70px!important;min-height:70px!important;background:#fff!important;border-bottom:1px solid #e5e7eb!important;display:flex!important;align-items:center!important;justify-content:space-between!important;padding:0 18px 0 22px!important;color:#111827!important}
      #bookora-secure-sample-modal .bosr-title strong{display:block!important;font:800 16px/1.2 Inter,sans-serif!important}
      #bookora-secure-sample-modal .bosr-title small{display:block!important;margin-top:5px!important;color:#64748b!important;font:600 11px/1.2 Inter,sans-serif!important}
      #bookora-secure-sample-modal .bosr-close{border:0!important;background:#f1f5f9!important;color:#0f172a!important;width:40px!important;height:40px!important;border-radius:11px!important;cursor:pointer!important;font:700 25px/1 Inter,sans-serif!important}
      #bookora-secure-sample-modal .bosr-body{flex:1!important;min-height:0!important;overflow:auto!important;padding:24px!important}
      #bookora-secure-sample-modal .bosr-grid{width:min(980px,100%)!important;margin:0 auto!important;display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:22px!important}
      #bookora-secure-sample-modal .bosr-card{background:#fff!important;border:1px solid #e5e7eb!important;border-radius:16px!important;overflow:hidden!important;box-shadow:0 8px 28px rgba(15,23,42,.10)!important}
      #bookora-secure-sample-modal .bosr-image{display:block!important;width:100%!important;height:auto!important;background:#fff!important;user-select:none!important;-webkit-user-drag:none!important;pointer-events:none!important}
      #bookora-secure-sample-modal .bosr-caption{padding:10px 13px!important;text-align:center!important;color:#64748b!important;font:700 11px/1.2 Inter,sans-serif!important;background:#f8fafc!important}
      #bookora-secure-sample-modal .bosr-loading{text-align:center!important;padding:70px 24px!important;color:#475569!important;font:600 14px/1.5 Inter,sans-serif!important}
      #bookora-secure-sample-modal .bosr-note{width:min(980px,100%)!important;margin:0 auto 18px!important;text-align:center!important;color:#64748b!important;font:600 11px/1.5 Inter,sans-serif!important}
      @media(max-width:760px){#bookora-secure-sample-modal{padding:0!important}#bookora-secure-sample-modal .bosr-shell{height:100dvh!important;border-radius:0!important}#bookora-secure-sample-modal .bosr-head{padding:0 13px!important;height:64px!important;min-height:64px!important}#bookora-secure-sample-modal .bosr-body{padding:14px!important}#bookora-secure-sample-modal .bosr-grid{grid-template-columns:1fr!important;gap:16px!important}#bookora-secure-sample-modal .bosr-title small{max-width:210px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}}
    `;
    document.head.appendChild(style);
  }

  function createModal(title) {
    removeModal();
    const modal = document.createElement('div');
    modal.id = 'bookora-secure-sample-modal';
    modal.innerHTML = `<div class="bosr-shell" role="dialog" aria-modal="true" aria-label="Read Free Sample">
      <header class="bosr-head"><div class="bosr-title"><strong>Read Free Sample</strong><small>${esc(title || 'eBook')} · ${MAX_PAGES} preview images</small></div><button type="button" class="bosr-close" aria-label="Close">×</button></header>
      <main class="bosr-body"><div class="bosr-loading">Preparing preview images…</div></main></div>`;
    document.body.appendChild(modal);
    document.documentElement.classList.add('bookora-sample-open');
    modal.querySelector('.bosr-close').onclick = removeModal;
    modal.addEventListener('click', e => { if (e.target === modal) removeModal(); });
    return modal;
  }

  async function renderSampleImages(bytes, title) {
    const pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    const total = Math.min(MAX_PAGES, pdf.numPages);
    if (!total) throw new Error('The sample has no readable pages.');

    const modal = createModal(title);
    const body = modal.querySelector('.bosr-body');
    body.innerHTML = `<div class="bosr-note">Free preview · Only sample pages are shown. The original PDF is not opened in the browser.</div><div class="bosr-grid"></div>`;
    const grid = body.querySelector('.bosr-grid');

    for (let pageNo = 1; pageNo <= total; pageNo++) {
      const page = await pdf.getPage(pageNo);
      const base = page.getViewport({ scale: 1 });
      const targetWidth = Math.min(480, Math.max(280, Math.floor((body.clientWidth - 50) / 2)));
      const viewport = page.getViewport({ scale: targetWidth / base.width });
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      const ctx = canvas.getContext('2d', { alpha: false });
      await page.render({ canvasContext: ctx, viewport, transform: ratio !== 1 ? [ratio,0,0,ratio,0,0] : null }).promise;

      const img = document.createElement('img');
      img.className = 'bosr-image';
      img.alt = `${title || 'Book'} free sample page ${pageNo}`;
      img.src = canvas.toDataURL('image/jpeg', 0.86);
      img.draggable = false;
      img.loading = pageNo === 1 ? 'eager' : 'lazy';

      const card = document.createElement('article');
      card.className = 'bosr-card';
      const caption = document.createElement('div');
      caption.className = 'bosr-caption';
      caption.textContent = `Preview image ${pageNo}`;
      card.append(img, caption);
      grid.appendChild(card);
      page.cleanup?.();
      canvas.width = 1; canvas.height = 1;
    }
    pdf.cleanup?.();
    pdf.destroy?.();
  }

  async function openSample(event) {
    const button = event.target instanceof Element ? event.target.closest('#detail-preview-btn') : null;
    if (!button || busy) return;
    event.preventDefault(); event.stopImmediatePropagation(); event.stopPropagation(); busy = true;
    const label = button.querySelector('span');
    const original = label?.textContent || 'Read Free Sample';
    button.disabled = true;
    if (label) label.textContent = 'Opening sample…';
    try {
      const book = currentBook();
      if (!book) throw new Error('Book data is not available yet.');
      await renderSampleImages(await requestSample(book), book.title);
    } catch (error) {
      console.error('[Bookora sample]', error);
      if (window.Toast?.show) window.Toast.show(error.message || 'Free sample could not be opened.', 'error');
      else alert(error.message || 'Free sample could not be opened.');
    } finally {
      busy = false; button.disabled = false; if (label) label.textContent = original;
    }
  }

  addStyles();
  document.addEventListener('click', openSample, true);
})();
