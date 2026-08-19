// Bookora — Free Sample Security Hotfix
// Never opens the original/full PDF from the Free Sample button.
// Only allows explicitly limited sample_pages data (max 5 pages).
import { ReaderModal } from './components/ReaderModal.js';
import { state } from './state.js';
import { apiUrl } from './config.js';

(() => {
  'use strict';

  const MAX_SAMPLE_PAGES = 5;
  let busy = false;

  const currentBook = () => {
    try {
      const hash = (location.hash || '').split('?')[0];
      return hash.startsWith('#/book/')
        ? state.getBookBySlug(decodeURIComponent(hash.slice(7)))
        : null;
    } catch (_) {
      return null;
    }
  };

  const limitedPages = value => {
    if (!Array.isArray(value)) return [];
    return value.slice(0, MAX_SAMPLE_PAGES).filter(Boolean);
  };

  async function getBackendPages(book) {
    const id = encodeURIComponent(String(book?.id || '').trim());
    if (!id) return [];

    const endpoints = [
      apiUrl(`/api/books/sample/${id}`),
      apiUrl(`/api/books/${id}/sample`)
    ];

    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          headers: { Accept: 'application/json' },
          credentials: 'omit',
          cache: 'no-store'
        });
        if (!response.ok) continue;

        const data = await response.json();
        const pages = limitedPages(
          data?.pages || data?.sample_pages || data?.samplePages ||
          data?.preview_pages || data?.previewPages ||
          data?.book?.sample_pages || data?.book?.samplePages
        );
        if (pages.length) return pages;
      } catch (_) {}
    }

    return [];
  }

  async function openSecureSample(event) {
    const button = event.target instanceof Element
      ? event.target.closest('#detail-preview-btn')
      : null;
    if (!button || busy) return;

    // Run in capture phase so the old handler cannot fall back to a
    // Google Drive full-PDF preview.
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const book = currentBook();
    if (!book) return;

    busy = true;
    button.disabled = true;
    const label = button.querySelector('span');
    const original = label?.textContent || 'Read Free Sample';
    if (label) label.textContent = 'Opening sample…';

    try {
      let pages = limitedPages(book.sample_pages || book.samplePages || book.preview_pages || book.previewPages);

      if (!pages.length) {
        pages = await getBackendPages(book);
      }

      if (!pages.length) {
        alert('Free sample is not available yet. The full PDF has been blocked for your safety.');
        return;
      }

      await ReaderModal.open({ ...book, sample_pages: pages }, true);
    } finally {
      busy = false;
      button.disabled = false;
      if (label) label.textContent = original;
    }
  }

  document.addEventListener('click', openSecureSample, true);

  // Remove/hide any legacy Drive sample iframe if another runtime creates it.
  const removeLegacyPreview = () => {
    document.getElementById('bookora-drive-sample-modal')?.remove();
  };

  new MutationObserver(removeLegacyPreview).observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  removeLegacyPreview();
})();
