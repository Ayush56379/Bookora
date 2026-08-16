// LibraryPage Component
import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';
import { ReaderModal } from '../components/ReaderModal.js';
import { downloadEBook } from '../utils/pdfDownloader.js';
import { Toast } from '../components/Toast.js';

export function renderLibraryPage() {
  updateSEO({
    title: 'My eBook Library',
    description: 'Access and read your purchased eBooks on Bookora.'
  });

  const ownedBookIds = Array.from(state.library);
  const books = state.books.filter(b => ownedBookIds.includes(b.id));

  return `
    <div class="library-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem;">
          <div>
            <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">Personal Library</div>
            <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
              My eBook Library
            </h1>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
              You own ${books.length} permanent digital license${books.length === 1 ? '' : 's'}. Read in-browser or download DRM-verified files.
            </p>
          </div>
          <a href="#/explore" class="btn btn-secondary btn-sm">
            + Discover More eBooks
          </a>
        </div>

        ${books.length > 0 ? `
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem;">
            ${books.map(book => {
              const prog = state.readingProgress[book.id] || { percent: 0, current_page: 1, total_pages: book.pages || 100 };
              return `
                <div class="book-card animate-slide-up" style="background: #FFFFFF; padding: 1.5rem;">
                  
                  <div style="display: flex; gap: 1rem; margin-bottom: 1.25rem;">
                    <div style="width: 72px; height: 100px; border-radius: 8px; background: ${book.cover_gradient}; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.15); position: relative;">
                      <div class="book-cover-spine"></div>
                    </div>
                    <div>
                      <span class="badge badge-bookora" style="font-size: 0.65rem; margin-bottom: 4px;">LICENSED</span>
                      <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); line-height: 1.3;">
                        ${book.title}
                      </h3>
                      <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">by ${book.author}</div>
                    </div>
                  </div>

                  <!-- Reading Progress Bar -->
                  <div style="margin-bottom: 1.25rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px;">
                      <span>Reading Progress</span>
                      <span>${prog.percent}%</span>
                    </div>
                    <div style="width: 100%; height: 6px; background: var(--bg-tertiary); border-radius: 99px; overflow: hidden;">
                      <div style="width: ${prog.percent}%; height: 100%; background: var(--accent); border-radius: 99px; transition: width 0.3s ease;"></div>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div style="display: flex; gap: 0.75rem; border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
                    <button class="btn btn-primary btn-sm lib-read-btn" data-id="${book.id}" style="flex: 1;">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                      ${prog.percent > 0 ? 'Resume Reading' : 'Start Reading'}
                    </button>
                    <button class="btn btn-secondary btn-sm lib-download-btn" data-id="${book.id}" title="Download verified PDF">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      PDF
                    </button>
                  </div>

                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 5rem 2rem; text-align: center; max-width: 540px; margin: 0 auto;">
            <div style="width: 64px; height: 64px; border-radius: 99px; background: var(--accent-light); color: var(--accent); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem auto;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            </div>
            <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">Your Library is Empty</h3>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 2rem;">
              You haven't purchased any Bookora publications yet. Explore our best sellers and start reading today!
            </p>
            <a href="#/explore" class="btn btn-primary btn-lg">Explore Top eBooks</a>
          </div>
        `}

      </div>
    </div>
  `;
}

export function initLibraryEvents() {
  document.querySelectorAll('.lib-read-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const book = state.books.find(b => b.id === btn.dataset.id);
      if (book) ReaderModal.open(book, false);
    });
  });

  document.querySelectorAll('.lib-download-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const book = state.books.find(b => b.id === btn.dataset.id);
      if (book) {
        downloadEBook(book, state.currentUser);
        Toast.show(`Downloaded "${book.title}" (Licensed edition)`, 'success');
      }
    });
  });
}
