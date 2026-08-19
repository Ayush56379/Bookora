// Bookora — stable Book Detail runtime + Apps Script free sample.
import { state } from './state.js';
import { ReaderModal } from './components/ReaderModal.js';
import { apiUrl } from './config.js';
import { Toast } from './components/Toast.js';

(() => {
  'use strict';
  const MAX_SAMPLE_PAGES = 5;
  const APPS_SCRIPT_URL = window.BOOKORA_APPS_SCRIPT_URL || '';
  let sampleBusy = false;
  let coverEnhanceQueued = false;

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

  function mediaSources(book) {
    const fields = ['cover_url','coverUrl','cover_file_id','coverFileId','cover_image_url','coverImageUrl','front_cover_url','frontCoverUrl','front_cover','frontCover','cover_image','coverImage','cover','thumbnail','image_url','image','thumbnail_url'];
    const out = [];
    const add = value => { if (value && !out.includes(value)) out.push(value); };
    fields.forEach(key => {
      const value = String(book?.[key] || '').trim();
      if (!value) return;
      const id = driveId(value);
      if (id) {
        add(`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w600`);
        add(`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1000`);
        add(`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1600`);
        add(`https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`);
      }
      if (/^(https?:\/\/|data:image\/|blob:)/i.test(value)) add(value);
    });
    return out;
  }

  function coverBox() {
    return document.querySelector('.book-detail-page .book-detail-cover-box') || document.querySelector('.book-detail-page .bookora-cover-ready-box') || document.querySelector('.book-detail-page .book-cover-spine')?.parentElement || document.querySelector('.book-detail-layout > div:first-child > div:first-child');
  }

  function repairCover() {
    const book = currentBook();
    const box = coverBox();
    if (!book || !box) return;
    const sources = mediaSources(book);
    if (!sources.length) return;
    box.classList.add('bookora-cover-ready-box');
    let img = box.querySelector('.bookora-permanent-cover');
    if (!img) {
      img = document.createElement('img');
      img.className = 'bookora-permanent-cover';
      img.alt = `Cover of ${book.title || 'eBook'}`;
      img.decoding = 'async';
      img.loading = 'eager';
      img.fetchPriority = 'high';
      img.referrerPolicy = 'no-referrer';
      box.prepend(img);
    }
    const sourceKey = sources.join('|');
    if (img.dataset.sourceKey === sourceKey && img.src) return;
    img.dataset.sourceKey = sourceKey;
    let index = 0;
    const showNext = () => {
      if (index >= sources.length) return;
      img.classList.remove('loaded');
      img.src = sources[index++];
    };
    img.onload = () => { img.classList.add('loaded'); box.classList.add('bookora-cover-loaded'); };
    img.onerror = showNext;
    showNext();
  }

  function pdfUrl(book) {
    for (const key of ['sample_pdf_url','samplePdfUrl','pdf_url','pdfUrl','file_url','fileUrl','pdf_download_url','pdfDownloadUrl','download_url','downloadUrl']) {
      const value = String(book?.[key] || '').trim();
      if (value && /^(https?:\/\/|blob:)/i.test(value)) return value;
    }
    const id = driveId(book?.pdf_file_id || book?.pdfFileId || book?.file_id || book?.fileId);
    return id ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}` : '';
  }

  async function appsScriptSample(book) {
    if (!APPS_SCRIPT_URL || !book) return null;
    const fileId = driveId(book.pdf_file_id || book.pdfFileId || book.file_id || book.fileId || book.pdf_url || book.pdfUrl);
    const pdf = pdfUrl(book);
    if (!fileId && !pdf) return null;
    try {
      // Do NOT set application/json here. That triggers a CORS OPTIONS
      // preflight which Google Apps Script web apps do not handle reliably.
      // A plain-text POST is CORS-safelisted and Apps Script still exposes
      // the exact JSON string through e.postData.contents for doPost().
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({ action: 'getBookSample', pdf_file_id: fileId, pdf_url: pdf }),
        credentials: 'omit',
        redirect: 'follow',
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`Apps Script HTTP ${response.status}`);
      const raw = await response.text();
      let data;
      try { data = JSON.parse(raw); } catch (_) { throw new Error('Apps Script returned non-JSON response'); }
      if (!data?.success) throw new Error(data?.error || 'Apps Script sample request failed');
      if (!data?.pdf_url && !Array.isArray(data?.pages)) throw new Error('Apps Script returned no sample source');
      return data;
    } catch (error) {
      console.warn('Apps Script sample:', error?.message || error);
      return null;
    }
  }

  async function backendSample(book) {
    const id = encodeURIComponent(String(book?.id || ''));
    if (!id) return null;
    for (const url of [apiUrl(`/api/books/sample/${id}`), apiUrl(`/api/books/${id}/sample`)]) {
      try {
        const response = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'omit', cache: 'no-store' });
        if (!response.ok) continue;
        const data = await response.json();
        if (data?.pdf_url || data?.view_url) return data;
        const pages = data?.pages || data?.sample_pages || data?.samplePages;
        if (Array.isArray(pages) && pages.length) return { pages: pages.slice(0, MAX_SAMPLE_PAGES) };
      } catch (_) {}
    }
    return null;
  }

  async function renderPdfSample(pdfSource, book) {
    const pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
    const pdf = await pdfjs.getDocument({ url: pdfSource, withCredentials: false }).promise;
    const pages = [];
    for (let pageNo = 1; pageNo <= Math.min(MAX_SAMPLE_PAGES, pdf.numPages); pageNo++) {
      const page = await pdf.getPage(pageNo);
      const content = await page.getTextContent();
      pages.push(content.items.map(item => item.str || '').join(' ').trim() || `Page ${pageNo}`);
      page.cleanup?.();
    }
    if (!pages.length) throw new Error('PDF contains no readable sample pages.');
    await ReaderModal.open({ ...book, sample_pages: pages }, true);
  }

  async function openFreeSample(event) {
    const button = event.target instanceof Element ? event.target.closest('#detail-preview-btn') : null;
    if (!button || sampleBusy) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const book = currentBook();
    if (!book) return;
    sampleBusy = true;
    const label = button.querySelector('span');
    const original = label?.textContent || 'Read Free Sample';
    button.disabled = true;
    if (label) label.textContent = 'Opening sample…';
    try {
      const stored = [book.sample_pages, book.samplePages, book.preview_pages, book.previewPages].find(Array.isArray) || [];
      if (stored.length) {
        await ReaderModal.open({ ...book, sample_pages: stored.slice(0, MAX_SAMPLE_PAGES) }, true);
        return;
      }

      const apps = await appsScriptSample(book);
      if (apps?.pages?.length) {
        await ReaderModal.open({ ...book, sample_pages: apps.pages.slice(0, MAX_SAMPLE_PAGES) }, true);
        return;
      }
      if (apps?.pdf_url) {
        await renderPdfSample(apps.pdf_url, book);
        return;
      }

      const backend = await backendSample(book);
      if (backend?.pages?.length) {
        await ReaderModal.open({ ...book, sample_pages: backend.pages.slice(0, MAX_SAMPLE_PAGES) }, true);
        return;
      }
      if (backend?.pdf_url || backend?.view_url) {
        await renderPdfSample(backend.pdf_url || backend.view_url, book);
        return;
      }

      const direct = pdfUrl(book);
      if (direct) {
        await renderPdfSample(direct, book);
        return;
      }
      throw new Error('No PDF sample source is available for this book.');
    } catch (error) {
      console.error('Bookora free sample:', error);
      Toast.show('Free sample could not be opened. Please try again.', 'error');
    } finally {
      sampleBusy = false;
      button.disabled = false;
      if (label) label.textContent = original;
    }
  }

  function addStyles() {
    if (document.getElementById('bookora-permanent-detail-styles')) return;
    const style = document.createElement('style');
    style.id = 'bookora-permanent-detail-styles';
    style.textContent = `html.bookora-detail-active,html.bookora-detail-active body{scroll-behavior:auto!important}.bookora-detail-grid{align-items:start!important}.bookora-cover-ready-box{position:relative!important;overflow:hidden!important;background:#fff!important;isolation:isolate}.bookora-permanent-cover{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;object-fit:cover!important;object-position:center!important;display:block!important;z-index:10!important;opacity:0;transition:opacity .08s linear}.bookora-permanent-cover.loaded{opacity:1}.bookora-cover-loaded>div:not(.book-cover-spine){opacity:0!important;pointer-events:none!important}.bookora-cover-loaded .book-cover-spine{z-index:12!important}#detail-preview-btn:disabled{opacity:.65!important;cursor:wait!important}.bd-stat-icon{width:28px!important;height:28px!important;min-width:28px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;border-radius:8px!important;background:#eff6ff!important;color:#2563eb!important;font:800 10px/1 Inter,sans-serif!important;box-shadow:none!important;overflow:hidden!important}.bd-stat-icon svg{width:16px!important;height:16px!important;display:block!important;fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important}.bd-stat{display:grid!important;grid-template-columns:28px 1fr!important;column-gap:8px!important;align-items:center!important}.bd-stat-label,.bd-stat-value{grid-column:2!important}#bookora-reader-modal{position:fixed!important;inset:0!important;z-index:99999!important;background:rgba(15,23,42,.72)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:18px!important}#bookora-reader-modal .reader-container{width:min(100%,980px)!important;height:min(92vh,900px)!important;display:flex!important;flex-direction:column!important;border-radius:18px!important;overflow:hidden!important;background:#fff;box-shadow:0 24px 80px rgba(0,0,0,.28)}#bookora-reader-modal .reader-body{flex:1 1 auto!important;overflow:auto!important;padding:32px clamp(20px,6vw,72px)!important;line-height:1.8!important;overscroll-behavior:contain!important}@media(max-width:700px){.book-detail-page .book-detail-layout{grid-template-columns:1fr!important;gap:1.5rem!important;padding:1rem!important}.book-detail-page .book-detail-layout>div:first-child>div:first-child{max-width:270px!important;margin-inline:auto!important}#bookora-reader-modal{padding:0!important}#bookora-reader-modal .reader-container{width:100%!important;height:100%!important;border-radius:0!important}#bookora-reader-modal .reader-body{padding:22px 18px!important}}`;
    document.head.appendChild(style);
  }

  document.addEventListener('click', event => {
    if (event.target instanceof Element && event.target.closest('#detail-preview-btn')) openFreeSample(event);
  }, true);

  function enhance() {
    if (!location.hash.startsWith('#/book/')) return;
    addStyles();
    document.documentElement.classList.add('bookora-detail-active');
    const page = document.querySelector('.book-detail-page');
    page?.querySelector('.book-detail-layout')?.classList.add('bookora-detail-grid');
    if (!coverEnhanceQueued) {
      coverEnhanceQueued = true;
      requestAnimationFrame(() => { coverEnhanceQueued = false; repairCover(); });
    }
  }

  window.addEventListener('hashchange', () => setTimeout(enhance, 30));
  window.addEventListener('load', () => setTimeout(enhance, 30));
  state.subscribe(event => {
    if (event === 'DATA_SYNCED' || event === 'USER_LOGGED_IN' || event === 'REVIEWS_UPDATED') setTimeout(enhance, 30);
  });
  new MutationObserver(() => { if (location.hash.startsWith('#/book/')) enhance(); }).observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(enhance, 30);
})();
