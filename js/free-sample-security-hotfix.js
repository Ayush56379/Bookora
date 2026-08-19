/* Bookora — Free Sample Security Hotfix
 * Renders the first 5 pages with PDF.js inside Bookora.
 * Never opens the Google Drive PDF viewer, so the Drive download arrow is not exposed.
 */
import { state } from './state.js';

(() => {
  'use strict';

  const MAX_PAGES = 5;
  const APPS_SCRIPT_URL = window.BOOKORA_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzUu9SstSp1ONdUOLb6hAeCtDzlxrvymtf_y2c5ISacPNRYXaJThewGzqbIO0vzQqYfnw/exec';
  let busy = false;
  let callbackCounter = 0;

  const esc = s => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function currentBook() {
    try {
      const hash = (location.hash || '').split('?')[0];
      return hash.startsWith('#/book/') ? state.getBookBySlug(decodeURIComponent(hash.slice(7))) : null;
    } catch (_) { return null; }
  }

  function driveId(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    return (/^[A-Za-z0-9_-]{20,}$/.test(raw) ? raw : '')
      || raw.match(/[?&]id=([A-Za-z0-9_-]{10,})/i)?.[1]
      || raw.match(/\/d\/([A-Za-z0-9_-]{10,})/i)?.[1]
      || raw.match(/file\/d\/([A-Za-z0-9_-]{10,})/i)?.[1]
      || '';
  }

  function requestSample(book) {
    return new Promise((resolve, reject) => {
      const callback = `__bookoraSecureSample_${Date.now()}_${++callbackCounter}`;
      const script = document.createElement('script');
      const timer = setTimeout(() => { cleanup(); reject(new Error('Sample backend timed out.')); }, 20000);

      function cleanup() {
        clearTimeout(timer);
        try { delete window[callback]; } catch (_) {}
        script.remove();
      }

      window[callback] = data => {
        cleanup();
        if (data?.success) resolve(data);
        else reject(new Error(data?.error || 'Sample backend returned no sample.'));
      };
      script.onerror = () => { cleanup(); reject(new Error('Sample backend could not be reached.')); };

      const fileId = driveId(book?.pdf_file_id || book?.pdfFileId || book?.file_id || book?.fileId || book?.pdf_url || book?.pdfUrl);
      if (!fileId) { cleanup(); reject(new Error('PDF file ID is missing for this book.')); return; }

      const params = new URLSearchParams({ callback, action: 'getBookSample', pdf_file_id: fileId });
      script.src = `${APPS_SCRIPT_URL}${APPS_SCRIPT_URL.includes('?') ? '&' : '?'}${params}`;
      document.head.appendChild(script);
    });
  }

  function base64ToBytes(base64) {
    const clean = String(base64 || '').replace(/^data:application\/pdf;base64,/, '');
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
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
      #bookora-secure-sample-modal{position:fixed!important;inset:0!important;z-index:2147483000!important;background:rgba(15,23,42,.78)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:16px!important}
      #bookora-secure-sample-modal .bosr-shell{width:min(1100px,100%)!important;height:min(94vh,960px)!important;background:#eef2f7!important;border-radius:18px!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;box-shadow:0 30px 100px rgba(0,0,0,.35)!important}
      #bookora-secure-sample-modal .bosr-head{height:64px!important;min-height:64px!important;background:#fff!important;border-bottom:1px solid #e5e7eb!important;display:flex!important;align-items:center!important;justify-content:space-between!important;padding:0 16px 0 20px!important;color:#111827!important}
      #bookora-secure-sample-modal .bosr-title strong{display:block!important;font:800 15px/1.2 Inter,sans-serif!important}
      #bookora-secure-sample-modal .bosr-title small{display:block!important;margin-top:3px!important;color:#64748b!important;font:500 11px/1.2 Inter,sans-serif!important}
      #bookora-secure-sample-modal .bosr-actions{display:flex!important;align-items:center!important;gap:5px!important}
      #bookora-secure-sample-modal .bosr-zoom,#bookora-secure-sample-modal .bosr-close{border:0!important;background:#f1f5f9!important;color:#0f172a!important;width:34px!important;height:34px!important;border-radius:9px!important;cursor:pointer!important;font:700 18px/1 Inter,sans-serif!important}
      #bookora-secure-sample-modal .bosr-close{font-size:25px!important;margin-left:6px!important}
      #bookora-secure-sample-modal .bosr-zoom-value{min-width:48px!important;text-align:center!important;font:700 11px/1 Inter,sans-serif!important;color:#475569!important}
      #bookora-secure-sample-modal .bosr-body{flex:1!important;min-height:0!important;overflow:auto!important;padding:24px!important}
      #bookora-secure-sample-modal .bosr-pages{width:max-content!important;min-width:100%!important;margin:0 auto!important}
      #bookora-secure-sample-modal .bosr-page{background:#fff!important;margin:0 auto 22px!important;box-shadow:0 8px 28px rgba(15,23,42,.14)!important;position:relative!important}
      #bookora-secure-sample-modal canvas{display:block!important}
      #bookora-secure-sample-modal .bosr-page-label{text-align:center!important;padding:7px!important;color:#64748b!important;font:600 10px/1 Inter,sans-serif!important;background:#f8fafc!important}
      #bookora-secure-sample-modal .bosr-loading{text-align:center!important;padding:60px 24px!important;color:#475569!important;font:600 14px/1.5 Inter,sans-serif!important}
      @media(max-width:640px){#bookora-secure-sample-modal{padding:0!important}#bookora-secure-sample-modal .bosr-shell{height:100dvh!important;border-radius:0!important}#bookora-secure-sample-modal .bosr-head{padding-left:13px!important}#bookora-secure-sample-modal .bosr-body{padding:12px!important}#bookora-secure-sample-modal .bosr-title small{max-width:180px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}}
    `;
    document.head.appendChild(style);
  }

  function createModal(title) {
    removeModal();
    const modal = document.createElement('div');
    modal.id = 'bookora-secure-sample-modal';
    modal.innerHTML = `<div class="bosr-shell" role="dialog" aria-modal="true" aria-label="Read Free Sample">
      <header class="bosr-head"><div class="bosr-title"><strong>Read Free Sample</strong><small>${esc(title || 'eBook')} · First ${MAX_PAGES} pages</small></div>
      <div class="bosr-actions"><button type="button" class="bosr-zoom bosr-minus" aria-label="Zoom out">−</button><span class="bosr-zoom-value">100%</span><button type="button" class="bosr-zoom bosr-plus" aria-label="Zoom in">+</button><button type="button" class="bosr-close" aria-label="Close">×</button></div></header>
      <main class="bosr-body"><div class="bosr-pages"><div class="bosr-loading">Preparing sample…</div></div></main></div>`;
    document.body.appendChild(modal);
    document.documentElement.classList.add('bookora-sample-open');
    return modal;
  }

  async function renderPdf(bytes, title) {
    const pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    const total = Math.min(MAX_PAGES, pdf.numPages);
    if (!total) throw new Error('The PDF has no readable pages.');

    const modal = createModal(title);
    const pages = modal.querySelector('.bosr-pages');
    const body = modal.querySelector('.bosr-body');
    const zoomValue = modal.querySelector('.bosr-zoom-value');
    let zoom = 1;
    let rendering = false;

    async function paint() {
      if (rendering) return;
      rendering = true;
      pages.innerHTML = '';
      try {
        for (let pageNo = 1; pageNo <= total; pageNo++) {
          const page = await pdf.getPage(pageNo);
          const base = page.getViewport({ scale: 1 });
          const maxWidth = Math.min(900, Math.max(280, body.clientWidth - 24));
          const scale = (maxWidth / base.width) * zoom;
          const viewport = page.getViewport({ scale });
          const wrap = document.createElement('section');
          wrap.className = 'bosr-page';
          const canvas = document.createElement('canvas');
          const ratio = window.devicePixelRatio || 1;
          canvas.width = Math.floor(viewport.width * ratio);
          canvas.height = Math.floor(viewport.height * ratio);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
          const ctx = canvas.getContext('2d', { alpha: false });
          await page.render({ canvasContext: ctx, viewport, transform: ratio !== 1 ? [ratio,0,0,ratio,0,0] : null }).promise;
          const label = document.createElement('div');
          label.className = 'bosr-page-label';
          label.textContent = `Page ${pageNo} of ${total}`;
          wrap.append(canvas, label);
          pages.appendChild(wrap);
          page.cleanup?.();
        }
      } finally { rendering = false; }
    }

    modal.querySelector('.bosr-close').onclick = removeModal;
    modal.addEventListener('click', e => { if (e.target === modal) removeModal(); });
    modal.querySelector('.bosr-minus').onclick = async () => { zoom = Math.max(.7, +(zoom - .1).toFixed(1)); zoomValue.textContent = `${Math.round(zoom * 100)}%`; await paint(); };
    modal.querySelector('.bosr-plus').onclick = async () => { zoom = Math.min(1.6, +(zoom + .1).toFixed(1)); zoomValue.textContent = `${Math.round(zoom * 100)}%`; await paint(); };
    await paint();
  }

  async function openSecureSample(event) {
    const button = event.target instanceof Element ? event.target.closest('#detail-preview-btn') : null;
    if (!button || busy) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    event.stopPropagation();

    const book = currentBook();
    if (!book) return;
    busy = true;
    button.disabled = true;
    const label = button.querySelector('span');
    const original = label?.textContent || 'Read Free Sample';
    if (label) label.textContent = 'Opening sample…';

    try {
      const data = await requestSample(book);
      if (!data.pdf_base64) throw new Error('Sample backend is not updated yet. Deploy the corrected Apps Script and try again.');
      await renderPdf(base64ToBytes(data.pdf_base64), book.title);
    } catch (error) {
      console.error('[Bookora sample]', error);
      if (window.Toast?.show) window.Toast.show(error.message || 'Free sample could not be opened.', 'error');
      else alert(error.message || 'Free sample could not be opened.');
    } finally {
      busy = false;
      button.disabled = false;
      if (label) label.textContent = original;
    }
  }

  addStyles();
  document.addEventListener('click', openSecureSample, true);
})();
