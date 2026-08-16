// In-Browser Interactive Reader & Sample Previewer
import { state } from '../state.js';
import { Toast } from './Toast.js';

export const ReaderModal = {
  currentBook: null,
  currentPage: 0,
  currentTheme: 'light',
  fontSize: 18,
  isSample: false,

  open(book, isSample = false) {
    this.currentBook = book;
    this.isSample = isSample;
    this.currentPage = 0;
    this.render();
  },

  close() {
    const modal = document.getElementById('bookora-reader-modal');
    if (modal) modal.remove();
  },

  setTheme(theme) {
    this.currentTheme = theme;
    const container = document.getElementById('reader-box');
    if (container) {
      container.className = `reader-container reader-theme-${theme}`;
    }
  },

  changeFontSize(delta) {
    this.fontSize = Math.max(14, Math.min(26, this.fontSize + delta));
    const body = document.getElementById('reader-content-body');
    if (body) {
      body.style.fontSize = `${this.fontSize}px`;
    }
  },

  nextPage() {
    const pages = this.currentBook.sample_pages || [];
    if (this.currentPage < pages.length - 1) {
      this.currentPage++;
      this.updatePage();
    } else if (this.isSample) {
      Toast.show('You reached the end of the sample preview. Unlock the full book on Bookora!', 'info');
    }
  },

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updatePage();
    }
  },

  updatePage() {
    const pages = this.currentBook.sample_pages || [];
    const content = pages[this.currentPage] || 'No page content.';
    const body = document.getElementById('reader-content-body');
    const indicator = document.getElementById('reader-page-indicator');
    const progressBar = document.getElementById('reader-progress-fill');

    if (body) {
      // Format markdown-like text to HTML
      body.innerHTML = this.formatContent(content);
    }
    if (indicator) {
      indicator.textContent = `Page ${this.currentPage + 1} of ${pages.length}`;
    }
    if (progressBar) {
      const pct = Math.round(((this.currentPage + 1) / pages.length) * 100);
      progressBar.style.width = `${pct}%`;
    }

    // Save reading progress if owned
    if (!this.isSample && state.hasPurchased(this.currentBook.id)) {
      state.updateReadingProgress(this.currentBook.id, this.currentPage + 1, pages.length);
    }
  },

  formatContent(text) {
    return text
      .replace(/^# (.*$)/gim, '<h1 style="font-family: var(--font-display); font-size: 1.8rem; font-weight: 800; margin-bottom: 1.25rem;">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 style="font-family: var(--font-display); font-size: 1.4rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.85rem;">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 style="font-size: 1.15rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.6rem;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^> (.*$)/gim, '<blockquote style="border-left: 3px solid var(--accent); padding-left: 1rem; margin: 1.25rem 0; font-style: italic; opacity: 0.9;">$1</blockquote>')
      .replace(/\n\n/g, '<p style="margin-bottom: 1.25rem;"></p>');
  },

  render() {
    this.close();

    const book = this.currentBook;
    const pages = book.sample_pages || [];
    const totalPages = pages.length;

    const overlay = document.createElement('div');
    overlay.id = 'bookora-reader-modal';
    overlay.className = 'reader-overlay';

    overlay.innerHTML = `
      <div id="reader-box" class="reader-container reader-theme-${this.currentTheme}">
        
        <!-- Header -->
        <div class="reader-header">
          <div style="display: flex; align-items: center; gap: 0.85rem;">
            <button id="reader-close-btn" class="btn btn-ghost btn-sm" style="padding: 4px; border-radius: var(--radius-full);">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
            <div>
              <div style="font-weight: 700; font-size: 0.95rem; line-height: 1.2;">${book.title}</div>
              <div style="font-size: 0.75rem; opacity: 0.7;">${this.isSample ? '📖 Limited Sample Preview' : '✨ Full Licensed Edition'} • ${book.author}</div>
            </div>
          </div>

          <!-- Controls: Theme, Font Size -->
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            
            <!-- Font Size Controls -->
            <div style="display: flex; align-items: center; border: 1px solid rgba(148,163,184,0.3); border-radius: var(--radius-sm); padding: 2px;">
              <button id="font-dec-btn" class="btn btn-ghost btn-sm" style="padding: 2px 8px; font-size: 0.75rem;">A-</button>
              <button id="font-inc-btn" class="btn btn-ghost btn-sm" style="padding: 2px 8px; font-size: 0.85rem; font-weight: 700;">A+</button>
            </div>

            <!-- Theme Buttons -->
            <div style="display: flex; gap: 4px;">
              <button class="theme-btn" data-theme="light" style="width: 24px; height: 24px; border-radius: 99px; background: #FFFFFF; border: 1px solid #CBD5E1;" title="Light Theme"></button>
              <button class="theme-btn" data-theme="sepia" style="width: 24px; height: 24px; border-radius: 99px; background: #FAF5EB; border: 1px solid #D6D3D1;" title="Sepia Theme"></button>
              <button class="theme-btn" data-theme="dark" style="width: 24px; height: 24px; border-radius: 99px; background: #0F172A; border: 1px solid #475569;" title="Night Theme"></button>
            </div>

          </div>
        </div>

        <!-- Progress Line -->
        <div style="width: 100%; height: 3px; background: rgba(148,163,184,0.15);">
          <div id="reader-progress-fill" style="width: ${Math.round((1 / totalPages) * 100)}%; height: 100%; background: var(--accent); transition: width 0.3s ease;"></div>
        </div>

        <!-- Body Content -->
        <div id="reader-content-body" class="reader-body" style="font-size: ${this.fontSize}px;">
          ${this.formatContent(pages[0] || 'No page content.')}
        </div>

        <!-- Footer Pagination -->
        <div class="reader-footer">
          <button id="reader-prev-btn" class="btn btn-secondary btn-sm" style="display: flex; align-items: center; gap: 4px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
            Previous
          </button>

          <span id="reader-page-indicator" style="font-size: 0.85rem; font-weight: 600; opacity: 0.8;">
            Page 1 of ${totalPages}
          </span>

          <button id="reader-next-btn" class="btn btn-primary btn-sm" style="display: flex; align-items: center; gap: 4px;">
            Next
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>

      </div>
    `;

    document.body.appendChild(overlay);

    // Event listeners
    document.getElementById('reader-close-btn').addEventListener('click', () => this.close());
    document.getElementById('reader-prev-btn').addEventListener('click', () => this.prevPage());
    document.getElementById('reader-next-btn').addEventListener('click', () => this.nextPage());
    document.getElementById('font-inc-btn').addEventListener('click', () => this.changeFontSize(2));
    document.getElementById('font-dec-btn').addEventListener('click', () => this.changeFontSize(-2));

    overlay.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => this.setTheme(btn.dataset.theme));
    });

    // Close on escape
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }
};
