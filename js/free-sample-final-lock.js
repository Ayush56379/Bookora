import { state } from './state.js';
import { ReaderModal } from './components/ReaderModal.js';
import { Toast } from './components/Toast.js';

(() => {
  'use strict';

  const MAX_PAGES = 5;
  const API = window.BOOKORA_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzUu9SstSp1ONdUOLb6hAeCtDzlxrvymtf_y2c5ISacPNRYXaJThewGzqbIO0vzQqYfnw/exec';
  let busy = false;
  let counter = 0;

  const getBook = () => {
    try {
      const hash = (location.hash || '').split('?')[0];
      return hash.startsWith('#/book/')
        ? state.getBookBySlug(decodeURIComponent(hash.slice(7)))
        : null;
    } catch (_) { return null; }
  };

  function removeDriveViewer() {
    document.getElementById('bookora-drive-sample-modal')?.remove();
    document.querySelectorAll('iframe[src*="drive.google.com/file/"][src*="/preview"]').forEach(el => el.closest('#bookora-drive-sample-modal')?.remove());
  }

  // Never allow the old Drive preview fallback to remain on the page.
  new MutationObserver(removeDriveViewer).observe(document.documentElement, { childList: true, subtree: true });
  removeDriveViewer();

  function getSampleFromAppsScript(book) {
    const fileId = String(book?.pdf_file_id || book?.pdfFileId || book?.file_id || book?.fileId || '').trim();
    const pdfUrl = String(book?.pdf_url || book?.pdfUrl || '').trim();
    if (!API || (!fileId && !pdfUrl)) return Promise.resolve(null);

    return new Promise(resolve => {
      const callback = `__bookoraFinalSample_${Date.now()}_${++counter}`;
      const script = document.createElement('script');
      let done = false;

      const finish = value => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        try { delete window[callback]; } catch (_) {}
        script.remove();
        resolve(value || null);
      };

      const timer = setTimeout(() => finish(null), 20000);
      window[callback] = data => finish(data);
      script.onerror = () => finish(null);

      const query = new URLSearchParams({
        callback,
        action: 'getBookSample',
        pdf_file_id: fileId,
        pdf_url: pdfUrl
      });
      script.src = `${API}${API.includes('?') ? '&' : '?'}${query.toString()}`;
      document.head.appendChild(script);
    });
  }

  function base64ToBytes(base64) {
    const clean = String(base64 || '').replace(/^data:application\/pdf;base64,/i, '').replace(/\s/g, '');
    if (!clean) throw new Error('Sample PDF data is empty.');
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function pagesFromPdfBytes(bytes) {
    const pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    const pages = [];
    const count = Math.min(MAX_PAGES, pdf.numPages);

    for (let pageNo = 1; pageNo <= count; pageNo++) {
      const page = await pdf.getPage(pageNo);
      const content = await page.getTextContent();
      pages.push(content.items.map(item => item.str || '').join(' ').trim() || `Page ${pageNo}`);
      page.cleanup?.();
    }

    if (!pages.length) throw new Error('The sample PDF has no readable pages.');
    return pages;
  }

  async function openSample(event) {
    const button = event.target instanceof Element ? event.target.closest('#detail-preview-btn') : null;
    if (!button || busy) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    removeDriveViewer();

    const book = getBook();
    if (!book) return;

    busy = true;
    button.disabled = true;
    const label = button.querySelector('span');
    const oldLabel = label?.textContent || 'Read Free Sample';
    if (label) label.textContent = 'Opening sample…';

    try {
      const stored = [book.sample_pages, book.samplePages, book.preview_pages, book.previewPages].find(Array.isArray) || [];
      if (stored.length) {
        await ReaderModal.open({ ...book, sample_pages: stored.slice(0, MAX_PAGES) }, true);
        return;
      }

      const result = await getSampleFromAppsScript(book);
      if (!result?.success) throw new Error(result?.error || 'Sample service did not return a sample.');

      if (Array.isArray(result.pages) && result.pages.length) {
        await ReaderModal.open({ ...book, sample_pages: result.pages.slice(0, MAX_PAGES) }, true);
        return;
      }

      const base64 = result.pdf_base64 || result.pdfBase64 || result.sample_pdf_base64 || result.samplePdfBase64;
      if (!base64) {
        throw new Error('Backend is still returning the original PDF URL. It must return pdf_base64 for the protected sample reader.');
      }

      const pages = await pagesFromPdfBytes(base64ToBytes(base64));
      await ReaderModal.open({ ...book, sample_pages: pages }, true);

    } catch (error) {
      console.error('Bookora protected free sample:', error);
      removeDriveViewer();
      Toast.show(error?.message || 'Free sample could not be opened. Please try again.', 'error');
    } finally {
      busy = false;
      button.disabled = false;
      if (label) label.textContent = oldLabel;
    }
  }

  // Capture phase runs before the older sample handlers and blocks their Drive fallback.
  document.addEventListener('click', openSample, true);

  // Remove old Drive viewer if an older cached script creates it later.
  setInterval(removeDriveViewer, 250);
})();
