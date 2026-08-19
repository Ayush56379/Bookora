/* Bookora — permanent free-sample transport fallback.
 *
 * The sample UI already renders PDF pages correctly. The failure was happening
 * before PDF.js: some catalog entries do not expose a browser-readable PDF URL
 * and the Render sample route can be unavailable. This bridge uses the existing
 * Google Apps Script getBookSample action as a JSONP transport, then converts
 * the returned protected PDF base64 into a normal Response so the existing
 * FreeSamplePage renderer can continue unchanged.
 */
import { state } from './state.js';

(() => {
  'use strict';

  const originalFetch = window.fetch.bind(window);
  const API = String(window.BOOKORA_APPS_SCRIPT_URL || '').replace(/\/$/, '');
  const SAMPLE_RE = /\/api\/books\/([^/?#]+)\/sample(?:\?|$)/i;
  let counter = 0;

  if (!API || window.__BOOKORA_SAMPLE_FETCH_PATCHED__) return;
  window.__BOOKORA_SAMPLE_FETCH_PATCHED__ = true;

  function getBook(key) {
    const decoded = (() => {
      try { return decodeURIComponent(key); } catch (_) { return key; }
    })();
    const wanted = String(decoded || '').trim().toLowerCase();
    if (!wanted) return null;

    const books = Array.isArray(state.books) ? state.books : [];
    return books.find(book => {
      const id = String(book?.id || '').trim().toLowerCase();
      const slug = String(book?.slug || '').trim().toLowerCase();
      return id === wanted || slug === wanted;
    }) || state.getBookBySlug?.(decoded) || null;
  }

  function getSampleViaAppsScript(book) {
    const fileId = String(book?.pdf_file_id || book?.pdfFileId || book?.file_id || book?.fileId || '').trim();
    const pdfUrl = String(book?.sample_pdf_url || book?.samplePdfUrl || book?.preview_pdf_url || book?.previewPdfUrl || book?.pdf_url || book?.pdfUrl || book?.file_url || book?.fileUrl || '').trim();
    if (!fileId && !pdfUrl) return Promise.resolve(null);

    return new Promise(resolve => {
      const callback = `__bookoraSampleTransport_${Date.now()}_${++counter}`;
      const script = document.createElement('script');
      let finished = false;

      const finish = value => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        try { delete window[callback]; } catch (_) {}
        script.remove();
        resolve(value || null);
      };

      const timer = setTimeout(() => finish(null), 30000);
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

  function base64ToBytes(value) {
    const clean = String(value || '')
      .replace(/^data:application\/pdf;base64,/i, '')
      .replace(/\s/g, '');
    if (!clean) return null;

    try {
      const binary = atob(clean);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes;
    } catch (_) {
      return null;
    }
  }

  window.fetch = async function patchedFetch(input, init) {
    const requestUrl = typeof input === 'string' ? input : input?.url || '';
    const match = String(requestUrl).match(SAMPLE_RE);

    if (!match) return originalFetch(input, init);

    const key = match[1];
    const book = getBook(key);

    if (book) {
      try {
        const result = await getSampleViaAppsScript(book);
        if (result?.success) {
          const base64 = result.pdf_base64 || result.pdfBase64 || result.sample_pdf_base64 || result.samplePdfBase64;
          const bytes = base64ToBytes(base64);

          if (bytes?.length) {
            return new Response(bytes, {
              status: 200,
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Length': String(bytes.length),
                'Cache-Control': 'no-store'
              }
            });
          }
        }
      } catch (error) {
        console.warn('Bookora sample transport fallback failed:', error);
      }
    }

    return originalFetch(input, init);
  };
})();
