// Bookora — Limited Free Sample Reader
// Final reliable sample pipeline: stored pages -> backend sample -> live catalog
// lookup -> PDF endpoint/Drive PDF -> first five pages. Never declares a sample
// unavailable until every supported source has been checked.
import { state } from '../state.js';
import { apiUrl } from '../config.js';
import { Toast } from './Toast.js';

const MAX_SAMPLE_PAGES = 5;
const PDFJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';

function getSamplePages(book) {
  const pages = book?.sample_pages || book?.samplePages || book?.preview_pages || book?.previewPages;
  return Array.isArray(pages) ? pages.slice(0, MAX_SAMPLE_PAGES).filter(Boolean) : [];
}

function driveId(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^[A-Za-z0-9_-]{20,}$/.test(raw)) return raw;
  return raw.match(/[?&]id=([A-Za-z0-9_-]{10,})/i)?.[1]
    || raw.match(/\/d\/([A-Za-z0-9_-]{10,})/i)?.[1]
    || raw.match(/file\/d\/([A-Za-z0-9_-]{10,})/i)?.[1]
    || '';
}

function getPdfUrl(book) {
  const fields = [
    'pdf_url','pdfUrl','file_url','fileUrl','pdf_download_url','pdfDownloadUrl',
    'download_url','downloadUrl','pdf','file','ebook_url','ebookUrl','document_url',
    'documentUrl','content_url','contentUrl','source_url','sourceUrl'
  ];
  for (const key of fields) {
    const raw = String(book?.[key] || '').trim();
    if (!raw) continue;
    const id = driveId(raw);
    if (id) return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
    if (/^https?:\/\//i.test(raw)) return raw;
  }
  const id = driveId(
    book?.pdf_file_id || book?.pdfFileId || book?.file_id || book?.fileId ||
    book?.ebook_file_id || book?.ebookFileId || book?.document_file_id || book?.documentFileId
  );
  return id ? `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}` : '';
}

function findCatalogBook(payload, original) {
  const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.books) ? payload.books : []);
  if (!list.length) return null;
  const id = String(original?.id || '').trim().toLowerCase();
  const slug = String(original?.slug || '').trim().toLowerCase();
  const title = String(original?.title || '').trim().toLowerCase();
  return list.find(item => String(item?.id ?? item?.bookId ?? '').trim().toLowerCase() === id)
    || list.find(item => String(item?.slug || '').trim().toLowerCase() === slug)
    || list.find(item => String(item?.title || '').trim().toLowerCase() === title)
    || null;
}

async function fetchCatalogBook(book) {
  // The public /api/books route is the most reliable source because it is
  // already used by the catalog itself. Do not depend on a single /:id route.
  try {
    const response = await fetch(apiUrl('/api/books'), {
      headers: { Accept: 'application/json' }, credentials: 'omit', cache: 'no-store'
    });
    if (response.ok) {
      const data = await response.json();
      const match = findCatalogBook(data, book);
      if (match) return { ...book, ...match };
    }
  } catch (error) {
    console.warn('Bookora catalog lookup failed:', error?.message || error);
  }
  return book;
}

async function fetchJsonOrPdf(url) {
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json, application/pdf, text/plain' },
    credentials: 'omit',
    cache: 'no-store'
  });
  if (!response.ok) return null;
  const type = String(response.headers.get('content-type') || '').toLowerCase();
  if (type.includes('application/pdf')) return { pdfData: await response.arrayBuffer() };
  try { return { json: await response.json() }; } catch (_) {}
  return null;
}

function pagesFromPayload(data) {
  const pages = data?.pages || data?.sample_pages || data?.samplePages || data?.preview_pages || data?.previewPages;
  return Array.isArray(pages) ? pages.slice(0, MAX_SAMPLE_PAGES).filter(Boolean) : [];
}

async function fetchBackendSample(book) {
  const id = String(book?.id || '').trim();
  if (!id) return { pages: [], pdfData: null };
  const encoded = encodeURIComponent(id);
  const endpoints = [
    `/api/books/sample/${encoded}`,
    `/api/books/${encoded}/sample`,
    `/api/books/sample?book_id=${encoded}`,
    `/api/books/${encoded}/preview`,
    `/api/books/${encoded}/pdf`
  ];

  for (const endpoint of endpoints) {
    try {
      const result = await fetchJsonOrPdf(apiUrl(endpoint));
      if (!result) continue;
      const pages = pagesFromPayload(result.json);
      if (pages.length) return { pages, pdfData: null };
      const record = result.json?.book || result.json?.data || result.json;
      if (record && typeof record === 'object') {
        const merged = { ...book, ...record };
        const recordPages = getSamplePages(merged);
        if (recordPages.length) return { pages: recordPages, pdfData: null, book: merged };
        if (getPdfUrl(merged)) return { pages: [], pdfData: null, book: merged };
      }
      if (result.pdfData) return { pages: [], pdfData: result.pdfData };
    } catch (error) {
      console.warn(`Sample source failed: ${endpoint}`, error?.message || error);
    }
  }
  return { pages: [], pdfData: null };
}

async function loadPdfJs() {
  const pdfjs = await import(PDFJS_URL);
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  return pdfjs;
}

async function extractPdfData(pdfData, maxPages = MAX_SAMPLE_PAGES) {
  if (!pdfData) return [];
  const pdfjs = await loadPdfJs();
  const pdf = await pdfjs.getDocument({ data: pdfData }).promise;
  return extractPages(pdf, maxPages);
}

async function extractPages(pdf, maxPages = MAX_SAMPLE_PAGES) {
  const count = Math.min(maxPages, pdf.numPages);
  const result = [];
  for (let pageNo = 1; pageNo <= count; pageNo++) {
    const page = await pdf.getPage(pageNo);
    const textContent = await page.getTextContent();
    const text = textContent.items.map(item => item.str || '').join(' ').replace(/\s+/g, ' ').trim();
    result.push(text || `Page ${pageNo}`);
    page.cleanup?.();
  }
  return result;
}

async function extractPdfFromUrl(url, maxPages = MAX_SAMPLE_PAGES) {
  if (!url) return [];
  const pdfjs = await loadPdfJs();
  // Try normal PDF.js loading first. This works when the source allows CORS.
  try {
    const pdf = await pdfjs.getDocument({ url, withCredentials: false }).promise;
    return extractPages(pdf, maxPages);
  } catch (firstError) {
    // A Drive/HTTP redirect may block PDF.js range requests. Fetch the binary
    // ourselves and pass bytes to PDF.js; this also handles servers that do not
    // support range requests.
    try {
      const response = await fetch(url, { credentials: 'omit', cache: 'no-store' });
      if (!response.ok) throw new Error(`PDF HTTP ${response.status}`);
      const data = await response.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data }).promise;
      return extractPages(pdf, maxPages);
    } catch (secondError) {
      console.warn('Bookora PDF extraction failed:', secondError?.message || firstError?.message || secondError);
      return [];
    }
  }
}

async function resolveSample(book) {
  let current = { ...book };

  const stored = getSamplePages(current);
  if (stored.length) return { book: current, pages: stored, source: 'stored' };

  const catalog = await fetchCatalogBook(current);
  current = { ...current, ...catalog };
  const catalogPages = getSamplePages(current);
  if (catalogPages.length) return { book: current, pages: catalogPages, source: 'catalog' };

  const backend = await fetchBackendSample(current);
  if (backend.book) current = { ...current, ...backend.book };
  if (backend.pages.length) return { book: current, pages: backend.pages, source: 'backend-pages' };
  if (backend.pdfData) {
    const pages = await extractPdfData(backend.pdfData);
    if (pages.length) return { book: current, pages, source: 'backend-pdf' };
  }

  const pdfUrl = getPdfUrl(current);
  if (pdfUrl) {
    const pages = await extractPdfFromUrl(pdfUrl);
    if (pages.length) return { book: current, pages, source: 'pdf' };
  }

  return { book: current, pages: [], source: 'unavailable' };
}

export const ReaderModal = {
  currentBook: null,
  currentPage: 0,
  currentTheme: 'light',
  fontSize: 18,
  isSample: false,
  samplePages: [],
  sampleLoading: false,
  sampleError: '',

  async open(book, isSample = false) {
    this.currentBook = book;
    this.isSample = Boolean(isSample);
    this.currentPage = 0;
    this.samplePages = getSamplePages(book);
    this.sampleLoading = Boolean(isSample);
    this.sampleError = '';

    if (this.isSample) {
      this.render();
      try {
        const resolved = await resolveSample(book);
        this.currentBook = resolved.book;
        this.samplePages = resolved.pages.slice(0, MAX_SAMPLE_PAGES);
        if (!this.samplePages.length) this.sampleError = 'Free sample could not be prepared for this eBook.';
      } catch (error) {
        console.error('Bookora final sample resolver failed:', error);
        this.sampleError = 'Free sample could not be prepared right now.';
      } finally {
        this.sampleLoading = false;
      }
    } else {
      this.sampleLoading = false;
    }

    this.render();
  },

  close() {
    document.getElementById('bookora-reader-modal')?.remove();
  },

  async extractPdfSample(book, maxPages = MAX_SAMPLE_PAGES) {
    const url = getPdfUrl(book);
    return url ? extractPdfFromUrl(url, maxPages) : [];
  },

  setTheme(theme) {
    this.currentTheme = theme;
    const container = document.getElementById('reader-box');
    if (container) container.className = `reader-container reader-theme-${theme}`;
  },

  changeFontSize(delta) {
    this.fontSize = Math.max(14, Math.min(26, this.fontSize + delta));
    const body = document.getElementById('reader-content-body');
    if (body) body.style.fontSize = `${this.fontSize}px`;
  },

  nextPage() {
    if (this.currentPage < this.samplePages.length - 1) {
      this.currentPage++;
      this.updatePage();
    } else if (this.isSample) {
      Toast.show(`Free sample ends here. Only the first ${MAX_SAMPLE_PAGES} pages are available in preview.`, 'info');
    }
  },

  prevPage() {
    if (this.currentPage > 0) { this.currentPage--; this.updatePage(); }
  },

  updatePage() {
    const pages = this.samplePages;
    const content = pages[this.currentPage] || (this.sampleLoading ? 'Preparing your free sample…' : (this.sampleError || 'Free sample is not available for this eBook yet.'));
    const body = document.getElementById('reader-content-body');
    const indicator = document.getElementById('reader-page-indicator');
    const progressBar = document.getElementById('reader-progress-fill');
    if (body) body.innerHTML = this.formatContent(content);
    if (indicator) indicator.textContent = pages.length ? `Sample page ${this.currentPage + 1} of ${pages.length}` : (this.sampleLoading ? 'Preparing sample…' : 'Sample unavailable');
    if (progressBar) progressBar.style.width = `${pages.length ? Math.round(((this.currentPage + 1) / pages.length) * 100) : 0}%`;
    if (!this.isSample && this.currentBook?.id && state.hasPurchased(this.currentBook.id)) state.updateReadingProgress(this.currentBook.id, this.currentPage + 1, pages.length);
    const next = document.getElementById('reader-next-btn');
    const prev = document.getElementById('reader-prev-btn');
    if (next) next.disabled = this.sampleLoading || pages.length <= 1 || this.currentPage >= pages.length - 1;
    if (prev) prev.disabled = this.currentPage === 0;
  },

  formatContent(text) {
    const safe = String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;');
    return safe.replace(/^# (.*$)/gim, '<h1 style="font-family:var(--font-display);font-size:1.8rem;font-weight:800;margin-bottom:1.25rem;">$1</h1>').replace(/^## (.*$)/gim, '<h2 style="font-family:var(--font-display);font-size:1.4rem;font-weight:700;margin-top:1.5rem;margin-bottom:.85rem;">$1</h2>').replace(/^### (.*$)/gim, '<h3 style="font-size:1.15rem;font-weight:600;margin-top:1.25rem;margin-bottom:.6rem;">$1</h3>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n\n/g, '<p style="margin-bottom:1.25rem;"></p>').replace(/\n/g, '<br>');
  },

  render() {
    this.close();
    const book = this.currentBook || {};
    const pages = this.samplePages;
    const totalPages = pages.length;
    const initialContent = this.sampleLoading
      ? 'Preparing your free sample…'
      : (pages[0] || this.sampleError || `This free sample is limited to the first ${MAX_SAMPLE_PAGES} pages.`);
    const overlay = document.createElement('div');
    overlay.id = 'bookora-reader-modal';
    overlay.className = 'reader-overlay';
    overlay.innerHTML = `
      <div id="reader-box" class="reader-container reader-theme-${this.currentTheme}">
        <div class="reader-header">
          <div style="display:flex;align-items:center;gap:.85rem;min-width:0;">
            <button id="reader-close-btn" class="btn btn-ghost btn-sm" style="padding:4px;border-radius:var(--radius-full);" aria-label="Close reader"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
            <div style="min-width:0;"><div style="font-weight:700;font-size:.95rem;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${String(book.title || 'eBook')}</div><div style="font-size:.75rem;opacity:.7;">${this.isSample ? '📖 Free Sample Preview' : '✨ Full Licensed Edition'} • ${String(book.author || '')}</div></div>
          </div>
          <div style="display:flex;align-items:center;gap:.5rem;"><div style="display:flex;align-items:center;border:1px solid rgba(148,163,184,.3);border-radius:var(--radius-sm);padding:2px;"><button id="font-dec-btn" class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:.75rem;">A-</button><button id="font-inc-btn" class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:.85rem;font-weight:700;">A+</button></div><div style="display:flex;gap:4px;"><button class="theme-btn" data-theme="light" style="width:24px;height:24px;border-radius:99px;background:#fff;border:1px solid #CBD5E1;" title="Light Theme"></button><button class="theme-btn" data-theme="sepia" style="width:24px;height:24px;border-radius:99px;background:#FAF5EB;border:1px solid #D6D3D1;" title="Sepia Theme"></button><button class="theme-btn" data-theme="dark" style="width:24px;height:24px;border-radius:99px;background:#0F172A;border:1px solid #475569;" title="Night Theme"></button></div></div>
        </div>
        <div style="width:100%;height:3px;background:rgba(148,163,184,.15);"><div id="reader-progress-fill" style="width:${totalPages ? Math.round((1 / totalPages) * 100) : 0}%;height:100%;background:var(--accent);transition:width .3s ease;"></div></div>
        <div id="reader-content-body" class="reader-body" style="font-size:${this.fontSize}px;">${this.formatContent(initialContent)}</div>
        <div class="reader-footer"><button id="reader-prev-btn" class="btn btn-secondary btn-sm" disabled>Previous</button><span id="reader-page-indicator" style="font-size:.85rem;font-weight:600;opacity:.8;">${totalPages ? `Sample page 1 of ${totalPages}` : (this.sampleLoading ? 'Preparing sample…' : 'Sample preview')}</span><button id="reader-next-btn" class="btn btn-primary btn-sm" ${totalPages <= 1 || this.sampleLoading ? 'disabled' : ''}>Next</button></div>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('reader-close-btn')?.addEventListener('click', () => this.close());
    document.getElementById('reader-prev-btn')?.addEventListener('click', () => this.prevPage());
    document.getElementById('reader-next-btn')?.addEventListener('click', () => this.nextPage());
    document.getElementById('font-inc-btn')?.addEventListener('click', () => this.changeFontSize(2));
    document.getElementById('font-dec-btn')?.addEventListener('click', () => this.changeFontSize(-2));
    overlay.querySelectorAll('.theme-btn').forEach(btn => btn.addEventListener('click', () => this.setTheme(btn.dataset.theme)));
    const escHandler = e => { if (e.key === 'Escape') { this.close(); document.removeEventListener('keydown', escHandler); } };
    document.addEventListener('keydown', escHandler);
  }
};
