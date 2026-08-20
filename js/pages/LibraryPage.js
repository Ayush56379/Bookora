// LibraryPage Component
import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';
import { ReaderModal } from '../components/ReaderModal.js';
import { downloadEBook } from '../utils/pdfDownloader.js';
import { Toast } from '../components/Toast.js';

let librarySyncStarted = false;

function getLibraryBooks() {
  const ownedBookIds = new Set(Array.from(state.library || []).map(id => String(id)));
  return (Array.isArray(state.books) ? state.books : [])
    .map(book => state.normalizeBook(book))
    .filter(Boolean)
    .filter(book => ownedBookIds.has(String(book.id)));
}

function coverMarkup(book) {
  const cover = String(book.cover_url || book.coverUrl || '').trim();
  if (cover) {
    return `<img src="${cover.replace(/"/g, '&quot;')}" alt="${String(book.title || 'eBook').replace(/"/g, '&quot;')} cover" style="width:72px;height:100px;object-fit:cover;border-radius:8px;display:block;box-shadow:0 4px 10px rgba(0,0,0,.15);" loading="lazy" />`;
  }
  return `<div style="width:72px;height:100px;border-radius:8px;background:${book.cover_gradient || 'linear-gradient(135deg,#1E3A8A,#3B82F6)'};flex-shrink:0;box-shadow:0 4px 10px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.72rem;text-align:center;padding:6px;">${String(book.title || 'Bookora').slice(0,24)}</div>`;
}

export function renderLibraryPage() {
  updateSEO({
    title: state.isAdmin ? 'Bookora Admin Library' : 'My eBook Library',
    description: state.isAdmin ? 'Full Bookora eBook access for administration.' : 'Access and read your purchased eBooks on Bookora.'
  });

  const books = getLibraryBooks();
  const heading = state.isAdmin ? 'All eBook Library' : 'My eBook Library';
  const eyebrow = state.isAdmin ? 'ADMIN LIBRARY' : 'PERSONAL LIBRARY';
  const description = state.isAdmin
    ? `You have full access to ${books.length} approved Bookora eBook${books.length === 1 ? '' : 's'} for administration, reading and download.`
    : `You own ${books.length} permanent digital license${books.length === 1 ? '' : 's'}. Read in-browser or download your licensed files anytime.`;

  return `
    <div class="library-page animate-fade-in" style="background:var(--bg-secondary);min-height:85vh;padding:3.5rem 0 5rem;">
      <div class="container">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:1.5rem;margin-bottom:2.5rem;">
          <div>
            <div class="badge badge-bookora" style="margin-bottom:.5rem;">${eyebrow}</div>
            <h1 style="font-family:var(--font-display);font-size:2.2rem;font-weight:800;color:var(--text-primary);">${heading}</h1>
            <p style="font-size:.95rem;color:var(--text-secondary);margin-top:.25rem;">${description}</p>
          </div>
          <a href="#/explore" class="btn btn-secondary btn-sm">+ Discover More eBooks</a>
        </div>

        ${books.length > 0 ? `
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:2rem;">
            ${books.map(book => {
              const prog = state.readingProgress?.[book.id] || { percent: 0, current_page: 1, total_pages: book.pages || 100 };
              return `
                <div class="book-card animate-slide-up" style="background:#fff;padding:1.5rem;">
                  <div style="display:flex;gap:1rem;margin-bottom:1.25rem;">
                    ${coverMarkup(book)}
                    <div style="min-width:0;">
                      <span class="badge badge-bookora" style="font-size:.65rem;margin-bottom:4px;">${state.isAdmin ? 'ADMIN ACCESS' : 'LIFETIME LICENSE'}</span>
                      <h3 style="font-size:1.05rem;font-weight:700;color:var(--text-primary);line-height:1.3;">${String(book.title || 'Untitled eBook')}</h3>
                      <div style="font-size:.8rem;color:var(--text-muted);margin-top:4px;">by ${String(book.author || 'Bookora Creator')}</div>
                    </div>
                  </div>
                  <div style="margin-bottom:1.25rem;">
                    <div style="display:flex;justify-content:space-between;font-size:.75rem;font-weight:600;color:var(--text-secondary);margin-bottom:4px;">
                      <span>Reading Progress</span><span>${prog.percent || 0}%</span>
                    </div>
                    <div style="width:100%;height:6px;background:var(--bg-tertiary);border-radius:99px;overflow:hidden;">
                      <div style="width:${Math.max(0,Math.min(100,Number(prog.percent)||0))}%;height:100%;background:var(--accent);border-radius:99px;transition:width .3s ease;"></div>
                    </div>
                  </div>
                  <div style="display:flex;gap:.75rem;border-top:1px solid var(--border-subtle);padding-top:1rem;">
                    <button class="btn btn-primary btn-sm lib-read-btn" data-id="${String(book.id)}" style="flex:1;">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 6.5 2z"/></svg>
                      ${prog.percent > 0 ? 'Resume Reading' : 'Read eBook'}
                    </button>
                    <button class="btn btn-secondary btn-sm lib-download-btn" data-id="${String(book.id)}" title="Download licensed PDF">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> PDF
                    </button>
                  </div>
                </div>`;
            }).join('')}
          </div>
        ` : `
          <div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:5rem 2rem;text-align:center;max-width:540px;margin:0 auto;">
            <div style="width:64px;height:64px;border-radius:99px;background:var(--accent-light);color:var(--accent);display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 6.5 2z"/></svg>
            </div>
            <h3 style="font-size:1.35rem;font-weight:800;color:var(--text-primary);margin-bottom:.5rem;">${state.isAdmin ? 'No Approved eBooks Yet' : 'Your Library is Empty'}</h3>
            <p style="font-size:.95rem;color:var(--text-secondary);margin-bottom:2rem;">${state.isAdmin ? 'Approved Bookora publications will appear here with full read and download access.' : 'Purchase an eBook and it will remain in your library permanently. You can read or download it whenever you want.'}</p>
            <a href="#/explore" class="btn btn-primary btn-lg">${state.isAdmin ? 'View Catalog' : 'Explore Top eBooks'}</a>
          </div>
        `}
      </div>
    </div>`;
}

export function initLibraryEvents() {
  const sync = window.BookoraPurchaseAccess?.syncPurchasedLibrary;
  if (sync && state.isAuthenticated && !librarySyncStarted) {
    librarySyncStarted = true;
    sync()
      .then(() => {
        window.dispatchEvent(new Event('hashchange'));
      })
      .catch(error => {
        console.warn('Bookora library server sync:', error?.message || error);
        librarySyncStarted = false;
      });
  }

  document.querySelectorAll('.lib-read-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const book = state.books.find(b => String(b.id) === String(btn.dataset.id));
      if (!book) return;
      btn.disabled = true;
      try {
        if (window.BookoraPurchaseAccess?.openPurchasedPdf) {
          await window.BookoraPurchaseAccess.openPurchasedPdf(book);
        } else {
          await ReaderModal.open(book, false);
        }
      } catch (error) {
        Toast.show(error?.message || 'Unable to open this eBook.', 'error');
      } finally {
        btn.disabled = false;
      }
    });
  });

  document.querySelectorAll('.lib-download-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const book = state.books.find(b => String(b.id) === String(btn.dataset.id));
      if (!book) return;
      btn.disabled = true;
      try {
        if (window.BookoraPurchaseAccess?.downloadPurchasedPdf) {
          await window.BookoraPurchaseAccess.downloadPurchasedPdf(book);
        } else {
          await downloadEBook(book, state.currentUser);
        }
        Toast.show(`Downloaded "${book.title}" as a licensed PDF.`, 'success');
      } catch (error) {
        Toast.show(error?.message || 'Unable to download this eBook.', 'error');
      } finally {
        btn.disabled = false;
      }
    });
  });
}
