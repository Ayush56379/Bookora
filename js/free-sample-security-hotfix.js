/* Bookora — Premium Free Sample Preview
 * Shows exactly 6 selected pages from the original PDF:
 * 2 opening + 2 middle + 2 ending pages.
 * The Google Drive PDF viewer is NEVER opened.
 * PDF.js renders the selected pages as a clean Bookora preview.
 */
import { state } from './state.js';

(() => {
  'use strict';

  const SAMPLE_PAGE_COUNT = 6;
  const APPS_SCRIPT_URL = window.BOOKORA_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzUu9SstSp1ONdUOLb6hAeCtDzlxrvymtf_y2c5ISacPNRYXaJThewGzqbIO0vzQqYfnw/exec';
  let busy = false;
  let callbackCounter = 0;

  const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

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
      const callback = `__bookoraPremiumSample_${Date.now()}_${++callbackCounter}`;
      const script = document.createElement('script');
      const timer = setTimeout(() => { cleanup(); reject(new Error('Sample backend timed out.')); }, 30000);

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

      const fileId = driveId(
        book?.pdf_file_id || book?.pdfFileId || book?.file_id || book?.fileId ||
        book?.pdf_url || book?.pdfUrl
      );
      if (!fileId) { cleanup(); reject(new Error('PDF file ID is missing for this book.')); return; }

      const params = new URLSearchParams({ callback, action: 'getBookSample', pdf_file_id: fileId });
      script.src = `${APPS_SCRIPT_URL}${APPS_SCRIPT_URL.includes('?') ? '&' : '?'}${params.toString()}`;
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

  function getSelectedPages(total) {
    if (total <= 0) return [];
    if (total <= SAMPLE_PAGE_COUNT) return Array.from({ length: total }, (_, i) => i + 1);

    // Example for a 355-page book: 1, 2, 177, 178, 354, 355.
    const middleA = Math.max(3, Math.floor(total / 2));
    const middleB = Math.min(total - 2, middleA + 1);
    const pages = [1, 2, middleA, middleB, total - 1, total];
    return [...new Set(pages)].sort((a, b) => a - b);
  }

  function removeModal() {
    document.getElementById('bookora-premium-sample-modal')?.remove();
    document.documentElement.classList.remove('bookora-sample-open');
  }

  function addStyles() {
    if (document.getElementById('bookora-premium-sample-styles')) return;
    const style = document.createElement('style');
    style.id = 'bookora-premium-sample-styles';
    style.textContent = `
      html.bookora-sample-open,html.bookora-sample-open body{overflow:hidden!important}
      #bookora-premium-sample-modal{position:fixed!important;inset:0!important;z-index:2147483000!important;background:rgba(7,15,30,.82)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:18px!important}
      #bookora-premium-sample-modal .bps-shell{width:min(1120px,100%)!important;height:min(94vh,940px)!important;background:#eef2f7!important;border-radius:20px!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;box-shadow:0 30px 100px rgba(0,0,0,.45)!important}
      #bookora-premium-sample-modal .bps-head{height:70px!important;min-height:70px!important;background:#fff!important;border-bottom:1px solid #e2e8f0!important;display:flex!important;align-items:center!important;justify-content:space-between!important;padding:0 18px 0 22px!important;color:#0f172a!important;gap:12px!important}
      #bookora-premium-sample-modal .bps-title{min-width:0!important}
      #bookora-premium-sample-modal .bps-title strong{display:block!important;font:800 16px/1.2 Inter,system-ui,sans-serif!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #bookora-premium-sample-modal .bps-title small{display:block!important;margin-top:4px!important;color:#64748b!important;font:600 11px/1.2 Inter,system-ui,sans-serif!important}
      #bookora-premium-sample-modal .bps-actions{display:flex!important;align-items:center!important;gap:6px!important;flex-shrink:0!important}
      #bookora-premium-sample-modal .bps-tool,#bookora-premium-sample-modal .bps-close{border:0!important;background:#f1f5f9!important;color:#0f172a!important;width:36px!important;height:36px!important;border-radius:10px!important;cursor:pointer!important;font:800 18px/1 Inter,system-ui,sans-serif!important}
      #bookora-premium-sample-modal .bps-close{font-size:25px!important;margin-left:4px!important}
      #bookora-premium-sample-modal .bps-zoom-value{min-width:48px!important;text-align:center!important;color:#475569!important;font:800 11px/1 Inter,system-ui,sans-serif!important}
      #bookora-premium-sample-modal .bps-body{flex:1!important;min-height:0!important;overflow:auto!important;padding:26px!important}
      #bookora-premium-sample-modal .bps-pages{width:max-content!important;min-width:100%!important;margin:0 auto!important}
      #bookora-premium-sample-modal .bps-page{background:#fff!important;margin:0 auto 26px!important;box-shadow:0 10px 32px rgba(15,23,42,.16)!important;position:relative!important;border-radius:3px!important;overflow:hidden!important}
      #bookora-premium-sample-modal canvas{display:block!important}
      #bookora-premium-sample-modal .bps-page-label{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:10px!important;padding:8px 12px!important;color:#64748b!important;background:#f8fafc!important;border-top:1px solid #e2e8f0!important;font:700 10px/1.2 Inter,system-ui,sans-serif!important}
      #bookora-premium-sample-modal .bps-page-label span:last-child{color:#94a3b8!important}
      #bookora-premium-sample-modal .bps-loading{text-align:center!important;padding:80px 24px!important;color:#475569!important;font:700 14px/1.5 Inter,system-ui,sans-serif!important}
      #bookora-premium-sample-modal .bps-footer{min-height:74px!important;background:#fff!important;border-top:1px solid #e2e8f0!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:18px!important;padding:12px 18px 12px 22px!important}
      #bookora-premium-sample-modal .bps-footer-text strong{display:block!important;color:#0f172a!important;font:800 13px/1.2 Inter,system-ui,sans-serif!important}
      #bookora-premium-sample-modal .bps-footer-text span{display:block!important;margin-top:4px!important;color:#64748b!important;font:600 11px/1.3 Inter,system-ui,sans-serif!important}
      #bookora-premium-sample-modal .bps-buy{border:0!important;border-radius:12px!important;background:#173ea5!important;color:#fff!important;padding:12px 20px!important;cursor:pointer!important;font:800 13px/1 Inter,system-ui,sans-serif!important;white-space:nowrap!important;box-shadow:0 8px 20px rgba(23,62,165,.25)!important}
      #bookora-premium-sample-modal .bps-buy:hover{filter:brightness(1.06)!important;transform:translateY(-1px)!important}
      @media(max-width:640px){
        #bookora-premium-sample-modal{padding:0!important}
        #bookora-premium-sample-modal .bps-shell{height:100dvh!important;border-radius:0!important}
        #bookora-premium-sample-modal .bps-head{height:62px!important;min-height:62px!important;padding:0 12px!important}
        #bookora-premium-sample-modal .bps-body{padding:12px!important}
        #bookora-premium-sample-modal .bps-footer{padding:10px 12px!important;min-height:72px!important}
        #bookora-premium-sample-modal .bps-footer-text span{max-width:180px!important}
        #bookora-premium-sample-modal .bps-buy{padding:11px 14px!important}
        #bookora-premium-sample-modal .bps-title small{max-width:170px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      }
    `;
    document.head.appendChild(style);
  }

  function createModal(title, totalPages, selectedPages) {
    removeModal();
    const modal = document.createElement('div');
    modal.id = 'bookora-premium-sample-modal';
    modal.innerHTML = `
      <div class="bps-shell" role="dialog" aria-modal="true" aria-label="Read Free Sample">
        <header class="bps-head">
          <div class="bps-title">
            <strong>Read Free Sample</strong>
            <small>${esc(title || 'eBook')} · ${selectedPages.length} selected pages from ${totalPages} total</small>
          </div>
          <div class="bps-actions">
            <button type="button" class="bps-tool bps-minus" aria-label="Zoom out">−</button>
            <span class="bps-zoom-value">100%</span>
            <button type="button" class="bps-tool bps-plus" aria-label="Zoom in">+</button>
            <button type="button" class="bps-close" aria-label="Close">×</button>
          </div>
        </header>
        <main class="bps-body">
          <div class="bps-pages"><div class="bps-loading">Preparing your selected sample pages…</div></div>
        </main>
        <footer class="bps-footer">
          <div class="bps-footer-text">
            <strong>Like what you see?</strong>
            <span>Preview shows 2 opening, 2 middle and 2 ending pages. Buy the eBook to unlock the complete book.</span>
          </div>
          <button type="button" class="bps-buy">Buy Now →</button>
        </footer>
      </div>`;
    document.body.appendChild(modal);
    document.documentElement.classList.add('bookora-sample-open');
    return modal;
  }

  function triggerBuy(book) {
    removeModal();
    const buyButton = document.querySelector('#detail-buy-btn, [data-action="buy"], .detail-buy-btn');
    if (buyButton) {
      buyButton.click();
      return;
    }
    window.dispatchEvent(new CustomEvent('bookora:buy', { detail: { book } }));
  }

  async function renderPdf(bytes, title, book) {
    const pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    const totalPages = pdf.numPages;
    if (!totalPages) throw new Error('The PDF has no readable pages.');

    const selectedPages = getSelectedPages(totalPages);
    const modal = createModal(title, totalPages, selectedPages);
    const pages = modal.querySelector('.bps-pages');
    const body = modal.querySelector('.bps-body');
    const zoomValue = modal.querySelector('.bps-zoom-value');
    let zoom = 1;
    let rendering = false;

    async function paint() {
      if (rendering) return;
      rendering = true;
      pages.innerHTML = '';
      try {
        for (let index = 0; index < selectedPages.length; index++) {
          const pageNo = selectedPages[index];
          const page = await pdf.getPage(pageNo);
          const base = page.getViewport({ scale: 1 });
          const maxWidth = Math.min(900, Math.max(280, body.clientWidth - 24));
          const scale = (maxWidth / base.width) * zoom;
          const viewport = page.getViewport({ scale });
          const wrap = document.createElement('section');
          wrap.className = 'bps-page';
          const canvas = document.createElement('canvas');
          const ratio = window.devicePixelRatio || 1;
          canvas.width = Math.floor(viewport.width * ratio);
          canvas.height = Math.floor(viewport.height * ratio);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
          const ctx = canvas.getContext('2d', { alpha: false });
          await page.render({
            canvasContext: ctx,
            viewport,
            transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : null
          }).promise;

          const label = document.createElement('div');
          label.className = 'bps-page-label';
          label.innerHTML = `<span>Preview ${index + 1} of ${selectedPages.length}</span><span>Book page ${pageNo} of ${totalPages}</span>`;
          wrap.append(canvas, label);
          pages.appendChild(wrap);
          page.cleanup?.();
        }
      } finally {
        rendering = false;
      }
    }

    modal.querySelector('.bps-close').onclick = removeModal;
    modal.addEventListener('click', event => {
      if (event.target === modal) removeModal();
    });
    modal.querySelector('.bps-minus').onclick = async () => {
      zoom = Math.max(.7, +(zoom - .1).toFixed(1));
      zoomValue.textContent = `${Math.round(zoom * 100)}%`;
      await paint();
    };
    modal.querySelector('.bps-plus').onclick = async () => {
      zoom = Math.min(1.6, +(zoom + .1).toFixed(1));
      zoomValue.textContent = `${Math.round(zoom * 100)}%`;
      await paint();
    };
    modal.querySelector('.bps-buy').onclick = () => triggerBuy(book);

    await paint();
  }

  async function openPremiumSample(event) {
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
    if (label) label.textContent = 'Preparing sample…';

    try {
      const data = await requestSample(book);
      if (!data.pdf_base64) throw new Error('Sample PDF was not returned by the backend.');
      await renderPdf(base64ToBytes(data.pdf_base64), book.title, book);
    } catch (error) {
      console.error('[Bookora premium sample]', error);
      if (window.Toast?.show) window.Toast.show(error.message || 'Free sample could not be opened.', 'error');
      else alert(error.message || 'Free sample could not be opened.');
    } finally {
      busy = false;
      button.disabled = false;
      if (label) label.textContent = original;
    }
  }

  addStyles();
  document.addEventListener('click', openPremiumSample, true);
})();