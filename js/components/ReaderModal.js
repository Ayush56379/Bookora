// Bookora — Limited Free Sample Reader
// Free samples are capped at five pages and fetched as extracted text from the backend.
import { state } from '../state.js';
import { apiUrl } from '../config.js';
import { Toast } from './Toast.js';

const MAX_SAMPLE_PAGES = 5;

function getSamplePages(book) {
  const pages = book?.sample_pages || book?.samplePages || book?.preview_pages || book?.previewPages;
  return Array.isArray(pages) ? pages.slice(0, MAX_SAMPLE_PAGES).filter(Boolean) : [];
}

function getPdfUrl(book) {
  return book?.pdf_url || book?.pdfUrl || book?.file_url || book?.fileUrl || book?.pdf_download_url || book?.pdfDownloadUrl || '';
}

export const ReaderModal = {
  currentBook: null,
  currentPage: 0,
  currentTheme: 'light',
  fontSize: 18,
  isSample: false,
  samplePages: [],
  sampleLoading: false,

  async open(book, isSample = false) {
    this.currentBook = book;
    this.isSample = Boolean(isSample);
    this.currentPage = 0;
    this.samplePages = getSamplePages(book);
    this.sampleLoading = false;

    if (this.isSample) {
      // Prefer the backend sample endpoint. It extracts and caches only the
      // first five pages, so the complete PDF is never sent to the browser.
      this.sampleLoading = true;
      this.render();
      try {
        const response = await fetch(`${apiUrl('/api/books/sample/')}${encodeURIComponent(String(book.id))}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          credentials: 'omit',
          cache: 'no-store'
        });
        if (response.ok) {
          const data = await response.json();
          if (data?.success && Array.isArray(data.pages)) {
            this.samplePages = data.pages.slice(0, MAX_SAMPLE_PAGES).filter(Boolean);
          }
        }
      } catch (error) {
        console.warn('Backend sample endpoint failed:', error);
      }
      this.sampleLoading = false;

      // Existing stored sample pages remain a valid fallback. Only when no
      // backend sample exists do we try the direct PDF extractor.
      if (this.samplePages.length === 0 && getPdfUrl(book)) {
        this.sampleLoading = true;
        this.render();
        try {
          this.samplePages = await this.extractPdfSample(book, MAX_SAMPLE_PAGES);
        } catch (error) {
          console.warn('Direct sample extraction failed:', error);
          this.samplePages = [];
        }
        this.sampleLoading = false;
      }
    }

    this.render();
  },

  close() {
    const modal = document.getElementById('bookora-reader-modal');
    if (modal) modal.remove();
  },

  async extractPdfSample(book, maxPages = MAX_SAMPLE_PAGES) {
    const url = getPdfUrl(book);
    if (!url) return [];

    const pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';

    const pdf = await pdfjs.getDocument({ url, withCredentials: false }).promise;
    const count = Math.min(maxPages, pdf.numPages);
    const result = [];

    for (let pageNo = 1; pageNo <= count; pageNo++) {
      const page = await pdf.getPage(pageNo);
      const textContent = await page.getTextContent();
      const text = textContent.items.map(item => item.str || '').join(' ').trim();
      result.push(text || `Page ${pageNo}`);
      page.cleanup?.();
    }
    return result;
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
    const pages = this.samplePages;
    if (this.currentPage < pages.length - 1) {
      this.currentPage++;
      this.updatePage();
    } else if (this.isSample) {
      Toast.show(`Free sample ends here. Only the first ${MAX_SAMPLE_PAGES} pages are available in preview.`, 'info');
    }
  },

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePage();
    }
  },

  updatePage() {
    const pages = this.samplePages;
    const content = pages[this.currentPage] || (this.sampleLoading ? 'Preparing your free sample…' : 'Free sample is not available for this eBook yet.');
    const body = document.getElementById('reader-content-body');
    const indicator = document.getElementById('reader-page-indicator');
    const progressBar = document.getElementById('reader-progress-fill');

    if (body) body.innerHTML = this.formatContent(content);
    if (indicator) indicator.textContent = pages.length ? `Sample page ${this.currentPage + 1} of ${pages.length}` : 'Sample unavailable';
    if (progressBar) {
      const pct = pages.length ? Math.round(((this.currentPage + 1) / pages.length) * 100) : 0;
      progressBar.style.width = `${pct}%`;
    }

    if (!this.isSample && state.hasPurchased(this.currentBook.id)) {
      state.updateReadingProgress(this.currentBook.id, this.currentPage + 1, pages.length);
    }
  },

  formatContent(text) {
    const safe = String(text || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    return safe
      .replace(/^# (.*$)/gim, '<h1 style="font-family:var(--font-display);font-size:1.8rem;font-weight:800;margin-bottom:1.25rem;">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 style="font-family:var(--font-display);font-size:1.4rem;font-weight:700;margin-top:1.5rem;margin-bottom:.85rem;">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 style="font-size:1.15rem;font-weight:600;margin-top:1.25rem;margin-bottom:.6rem;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<p style="margin-bottom:1.25rem;"></p>')
      .replace(/\n/g, '<br>');
  },

  render() {
    this.close();
    const book = this.currentBook;
    const pages = this.samplePages;
    const totalPages = pages.length;
    const initialContent = this.sampleLoading
      ? 'Preparing your free sample…'
      : (pages[0] || `This free sample is limited to the first ${MAX_SAMPLE_PAGES} pages. The complete eBook remains locked until purchase.`);

    const overlay = document.createElement('div');
    overlay.id = 'bookora-reader-modal';
    overlay.className = 'reader-overlay';

    overlay.innerHTML = `
      <div id="reader-box" class="reader-container reader-theme-${this.currentTheme}">
        <div class="reader-header">
          <div style="display:flex;align-items:center;gap:.85rem;min-width:0;">
            <button id="reader-close-btn" class="btn btn-ghost btn-sm" style="padding:4px;border-radius:var(--radius-full);" aria-label="Close reader">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
            <div style="min-width:0;"><div style="font-weight:700;font-size:.95rem;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${String(book.title || 'eBook')}</div><div style="font-size:.75rem;opacity:.7;">${this.isSample ? '📖 Free Sample Preview' : '✨ Full Licensed Edition'} • ${String(book.author || '')}</div></div>
          </div>
          <div style="display:flex;align-items:center;gap:.5rem;"><div style="display:flex;align-items:center;border:1px solid rgba(148,163,184,.3);border-radius:var(--radius-sm);padding:2px;"><button id="font-dec-btn" class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:.75rem;">A-</button><button id="font-inc-btn" class="btn btn-ghost btn-sm" style="padding:2px 8px;font-size:.85rem;font-weight:700;">A+</button></div><div style="display:flex;gap:4px;"><button class="theme-btn" data-theme="light" style="width:24px;height:24px;border-radius:99px;background:#fff;border:1px solid #CBD5E1;" title="Light Theme"></button><button class="theme-btn" data-theme="sepia" style="width:24px;height:24px;border-radius:99px;background:#FAF5EB;border:1px solid #D6D3D1;" title="Sepia Theme"></button><button class="theme-btn" data-theme="dark" style="width:24px;height:24px;border-radius:99px;background:#0F172A;border:1px solid #475569;" title="Night Theme"></button></div></div>
        </div>
        <div style="width:100%;height:3px;background:rgba(148,163,184,.15);"><div id="reader-progress-fill" style="width:${totalPages ? Math.round((1 / totalPages) * 100) : 0}%;height:100%;background:var(--accent);transition:width .3s ease;"></div></div>
        <div id="reader-content-body" class="reader-body" style="font-size:${this.fontSize}px;">${this.formatContent(initialContent)}</div>
        <div class="reader-footer"><button id="reader-prev-btn" class="btn btn-secondary btn-sm" ${this.currentPage === 0 ? 'disabled' : ''}>Previous</button><span id="reader-page-indicator" style="font-size:.85rem;font-weight:600;opacity:.8;">${totalPages ? `Sample page 1 of ${totalPages}` : 'Sample preview'}</span><button id="reader-next-btn" class="btn btn-primary btn-sm" ${totalPages <= 1 || this.sampleLoading ? 'disabled' : ''}>Next</button></div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.getElementById('reader-close-btn')?.addEventListener('click', () => this.close());
    document.getElementById('reader-prev-btn')?.addEventListener('click', () => this.prevPage());
    document.getElementById('reader-next-btn')?.addEventListener('click', () => this.nextPage());
    document.getElementById('font-inc-btn')?.addEventListener('click', () => this.changeFontSize(2));
    document.getElementById('font-dec-btn')?.addEventListener('click', () => this.changeFontSize(-2));
    overlay.querySelectorAll('.theme-btn').forEach(btn => btn.addEventListener('click', () => this.setTheme(btn.dataset.theme)));

    const escHandler = e => {
      if (e.key === 'Escape') { this.close(); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);
  }
};
