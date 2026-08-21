// Bookora Library Page
// Direct Firestore entitlement loading for fast, authenticated library reads.
// Payment/fulfillment and protected PDF access remain on the existing backend.
import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';
import { ReaderModal } from '../components/ReaderModal.js';
import { downloadEBook } from '../utils/pdfDownloader.js';
import { Toast } from '../components/Toast.js';

let librarySyncStarted = false;
let libraryLoadState = 'idle';
let libraryLoadError = '';
let libraryRecords = [];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>\"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function normalizeAccessStatus(value) {
  return String(value ?? 'active').trim().toLowerCase();
}

function getLibraryBooks() {
  return libraryRecords.map(record => {
    const bookId = String(record.bookId || record.book_id || record.id || '').trim();
    const catalogBook = (Array.isArray(state.books) ? state.books : [])
      .map(book => state.normalizeBook(book))
      .find(book => book && String(book.id) === bookId);

    return {
      ...(catalogBook || {}),
      ...record,
      id: bookId,
      title: record.title || catalogBook?.title || 'Untitled eBook',
      author: record.author || catalogBook?.author || 'Bookora Creator',
      cover_url: record.coverUrl || record.cover_url || catalogBook?.cover_url || catalogBook?.coverUrl || '',
      cover_gradient: catalogBook?.cover_gradient || 'linear-gradient(135deg,#1E3A8A,#3B82F6)'
    };
  }).filter(book => book.id);
}

function coverMarkup(book) {
  const cover = String(book.cover_url || book.coverUrl || '').trim();
  const title = escapeHtml(book.title || 'eBook');
  if (cover) return `<img src="${escapeHtml(cover)}" alt="${title} cover" style="width:72px;height:100px;object-fit:cover;border-radius:8px;display:block;box-shadow:0 4px 10px rgba(0,0,0,.15);" loading="lazy" />`;
  return `<div style="width:72px;height:100px;border-radius:8px;background:${book.cover_gradient || 'linear-gradient(135deg,#1E3A8A,#3B82F6)'};flex-shrink:0;box-shadow:0 4px 10px rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.72rem;text-align:center;padding:6px;">${title.slice(0,24)}</div>`;
}

function stateMarkup() {
  if (libraryLoadState === 'loading') return `<div class="library-state"><div class="library-spinner"></div><p>Loading your library...</p></div>`;
  if (libraryLoadState === 'error') return `<div class="library-state"><div class="library-error-icon">!</div><h3>Unable to load your library.</h3><p>${escapeHtml(libraryLoadError || 'Please try again.')}</p><button type="button" class="btn btn-primary btn-sm library-retry-btn">Retry</button></div>`;
  return `<div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:5rem 2rem;text-align:center;max-width:540px;margin:0 auto;"><div style="width:64px;height:64px;border-radius:99px;background:var(--accent-light);color:var(--accent);display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 6.5 2z"/></svg></div><h3 style="font-size:1.35rem;font-weight:800;color:var(--text-primary);margin-bottom:.5rem;">Your Library is Empty</h3><p style="font-size:.95rem;color:var(--text-secondary);margin-bottom:2rem;">Purchase an eBook and it will remain in your library permanently. You can read or download it whenever you want.</p><a href="#/explore" class="btn btn-primary btn-lg">Explore Top eBooks</a></div>`;
}

function renderBody() {
  const books = getLibraryBooks();
  if (libraryLoadState === 'loading' || libraryLoadState === 'error') return stateMarkup();
  if (!books.length) return stateMarkup();

  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:2rem;">${books.map(book => {
    const prog = state.readingProgress?.[book.id] || { percent: 0, current_page: 1, total_pages: book.pages || 100 };
    const safeId = escapeHtml(book.id);
    return `<div class="book-card animate-slide-up" style="background:#fff;padding:1.5rem;"><div style="display:flex;gap:1rem;margin-bottom:1.25rem;">${coverMarkup(book)}<div style="min-width:0;"><span class="badge badge-bookora" style="font-size:.65rem;margin-bottom:4px;">${state.isAdmin ? 'ADMIN ACCESS' : 'LIFETIME LICENSE'}</span><h3 style="font-size:1.05rem;font-weight:700;color:var(--text-primary);line-height:1.3;">${escapeHtml(book.title)}</h3><div style="font-size:.8rem;color:var(--text-muted);margin-top:4px;">by ${escapeHtml(book.author || 'Bookora Creator')}</div></div></div><div style="margin-bottom:1.25rem;"><div style="display:flex;justify-content:space-between;font-size:.75rem;font-weight:600;color:var(--text-secondary);margin-bottom:4px;"><span>Reading Progress</span><span>${Number(prog.percent) || 0}%</span></div><div style="width:100%;height:6px;background:var(--bg-tertiary);border-radius:99px;overflow:hidden;"><div style="width:${Math.max(0,Math.min(100,Number(prog.percent)||0))}%;height:100%;background:var(--accent);border-radius:99px;"></div></div></div><div style="display:flex;gap:.75rem;border-top:1px solid var(--border-subtle);padding-top:1rem;"><button class="btn btn-primary btn-sm lib-read-btn" data-id="${safeId}" style="flex:1;">${prog.percent > 0 ? 'Resume Reading' : 'Read eBook'}</button><button class="btn btn-secondary btn-sm lib-download-btn" data-id="${safeId}" title="Download licensed PDF">PDF</button></div></div>`;
  }).join('')}</div>`;
}

function rerenderLibrary() {
  if ((window.location.hash || '').split('?')[0] !== '#/library') return;
  const content = document.querySelector('.library-content');
  if (content) content.innerHTML = renderBody();
  const count = getLibraryBooks().length;
  const description = document.querySelector('.library-license-count');
  if (description && !state.isAdmin) description.textContent = `You own ${count} permanent digital license${count === 1 ? '' : 's'}. Read in-browser or download your licensed files anytime.`;
  bindLibraryButtons();
}

export function renderLibraryPage() {
  updateSEO({ title: state.isAdmin ? 'Bookora Admin Library' : 'My eBook Library', description: 'Access and read your purchased eBooks on Bookora.' });
  const books = getLibraryBooks();
  const heading = state.isAdmin ? 'All eBook Library' : 'My eBook Library';
  const eyebrow = state.isAdmin ? 'ADMIN LIBRARY' : 'PERSONAL LIBRARY';
  const description = state.isAdmin ? `You have full access to ${books.length} approved Bookora eBook${books.length === 1 ? '' : 's'} for administration, reading and download.` : `You own ${books.length} permanent digital license${books.length === 1 ? '' : 's'}. Read in-browser or download your licensed files anytime.`;

  return `<div class="library-page animate-fade-in" style="background:var(--bg-secondary);min-height:85vh;padding:3.5rem 0 5rem;"><div class="container"><div style="display:flex;justify-content:space-between;align-items:flex-end;gap:1.5rem;margin-bottom:2.5rem;"><div><div class="badge badge-bookora" style="margin-bottom:.5rem;">${eyebrow}</div><h1 style="font-family:var(--font-display);font-size:2.2rem;font-weight:800;color:var(--text-primary);">${heading}</h1><p class="library-license-count" style="font-size:.95rem;color:var(--text-secondary);margin-top:.25rem;">${description}</p></div><div style="display:flex;gap:.5rem;align-items:center;"><button type="button" class="btn btn-secondary btn-sm library-refresh-btn">Refresh</button><a href="#/explore" class="btn btn-secondary btn-sm">+ Discover More eBooks</a></div></div><div class="library-content">${renderBody()}</div></div></div>`;
}

async function getAuthenticatedBookoraUser() {
  const auth = window.firebase?.auth?.();
  if (!auth) throw new Error('Firebase Authentication is not available.');

  let firebaseUser = auth.currentUser || null;
  if (!firebaseUser && window.BookoraAuthReady) {
    firebaseUser = await Promise.race([
      window.BookoraAuthReady,
      new Promise(resolve => setTimeout(() => resolve(null), 10000))
    ]);
  }
  if (!firebaseUser) {
    firebaseUser = await new Promise(resolve => {
      let done = false;
      let unsubscribe = null;
      const finish = user => {
        if (done) return;
        done = true;
        try { unsubscribe?.(); } catch (_) {}
        resolve(user || null);
      };
      unsubscribe = auth.onAuthStateChanged(finish);
      setTimeout(() => finish(auth.currentUser || null), 10000);
    });
  }
  if (!firebaseUser) throw new Error('Authentication required. Please sign in again.');

  const { db } = await state.getFirebase();
  const profile = await state.resolveBookoraUser(firebaseUser, db);
  const bookoraUserId = String(
    profile?.bookoraUserId ||
    profile?.userId ||
    profile?.user_id ||
    profile?.id ||
    profile?.bookora_user_id ||
    state.currentUser?.bookoraUserId ||
    ''
  ).trim();

  if (!bookoraUserId) throw new Error('Your Bookora account could not be resolved. Please sign in again.');

  state.currentUser = {
    ...(state.currentUser || {}),
    ...profile,
    uid: firebaseUser.uid,
    firebaseUid: firebaseUser.uid,
    email: firebaseUser.email || profile?.email || '',
    bookoraUserId
  };
  state.isAuthenticated = true;
  localStorage.setItem('bookora_user_profile', JSON.stringify(state.currentUser));

  console.info('[Library] Firebase UID:', firebaseUser.uid);
  console.info('[Library] Firebase email:', firebaseUser.email || '');
  console.info('[Library] Resolved Bookora user ID:', bookoraUserId);

  return { firebaseUser, db, bookoraUserId };
}

async function loadLibraryDirectFromFirebase() {
  libraryLoadState = 'loading';
  libraryLoadError = '';
  rerenderLibrary();

  try {
    const { db, bookoraUserId } = await getAuthenticatedBookoraUser();

    if (state.isAdmin) {
      // Preserve the existing admin-library behavior: admins can see the approved catalog.
      const snapshot = await db.collection('books').where('status', '==', 'approved').get();
      libraryRecords = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), bookId: doc.id }));
      state.library = new Set(libraryRecords.map(record => String(record.bookId)).filter(Boolean));
      console.info('[Library] Admin catalog records:', libraryRecords.length);
    } else {
      // Direct Firestore read: no Render/API round trip is used to populate a buyer's library.
      // The entitlement documents contain the canonical Bookora userId.
      const snapshot = await db.collection('library').where('userId', '==', bookoraUserId).get();

      libraryRecords = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(record => normalizeAccessStatus(record.accessStatus) === 'active');

      state.library = new Set(libraryRecords
        .map(record => String(record.bookId || record.book_id || '').trim())
        .filter(Boolean));

      console.info('[Library] Firestore collection: library');
      console.info('[Library] Firestore userId:', bookoraUserId);
      console.info('[Library] Active library records:', libraryRecords.length);
      console.info('[Library] Library items:', libraryRecords.map(item => ({
        libraryId: item.bookoraLibraryId || item.id,
        bookId: item.bookId,
        title: item.title,
        orderId: item.orderId,
        accessStatus: item.accessStatus
      })));
    }

    libraryLoadState = 'loaded';
    rerenderLibrary();
  } catch (error) {
    libraryRecords = [];
    libraryLoadState = 'error';
    libraryLoadError = error?.message || 'Unable to load your library. Please try again.';
    console.error('[Library] Direct Firestore load failed:', error);
    rerenderLibrary();
    throw error;
  }
}

function bindLibraryButtons() {
  document.querySelectorAll('.lib-read-btn').forEach(btn => {
    if (btn.dataset.libraryBound === '1') return;
    btn.dataset.libraryBound = '1';
    btn.addEventListener('click', async () => {
      const book = getLibraryBooks().find(b => String(b.id) === String(btn.dataset.id));
      if (!book) return;
      btn.disabled = true;
      try {
        await (window.BookoraPurchaseAccess?.openPurchasedPdf
          ? window.BookoraPurchaseAccess.openPurchasedPdf(book)
          : ReaderModal.open(book, false));
      } catch (error) {
        Toast.show(error?.message || 'Unable to open this eBook.', 'error');
      } finally { btn.disabled = false; }
    });
  });

  document.querySelectorAll('.lib-download-btn').forEach(btn => {
    if (btn.dataset.libraryBound === '1') return;
    btn.dataset.libraryBound = '1';
    btn.addEventListener('click', async () => {
      const book = getLibraryBooks().find(b => String(b.id) === String(btn.dataset.id));
      if (!book) return;
      btn.disabled = true;
      try {
        if (window.BookoraPurchaseAccess?.downloadPurchasedPdf) await window.BookoraPurchaseAccess.downloadPurchasedPdf(book);
        else await downloadEBook(book, state.currentUser);
        Toast.show(`Downloaded "${book.title}" as a licensed PDF.`, 'success');
      } catch (error) {
        Toast.show(error?.message || 'Unable to download this eBook.', 'error');
      } finally { btn.disabled = false; }
    });
  });
}

export function initLibraryEvents() {
  librarySyncStarted = false;

  const start = async () => {
    if (librarySyncStarted) return;
    librarySyncStarted = true;
    try {
      await loadLibraryDirectFromFirebase();
    } catch (_) {
      librarySyncStarted = false;
    }
    bindLibraryButtons();
  };

  // Reuse the existing auth bridge. The actual library read is Firestore-direct.
  if (window.BookoraAuthReady) {
    void window.BookoraAuthReady.then(firebaseUser => {
      if (firebaseUser || window.firebase?.auth?.()?.currentUser || state.isAuthenticated) start();
      else {
        libraryLoadState = 'error';
        libraryLoadError = 'Authentication required. Please sign in again.';
        rerenderLibrary();
      }
    });
  } else if (window.firebase?.auth?.()?.currentUser || state.isAuthenticated) {
    void start();
  } else {
    libraryLoadState = 'error';
    libraryLoadError = 'Authentication required. Please sign in again.';
    rerenderLibrary();
  }

  document.querySelector('.library-refresh-btn')?.addEventListener('click', () => {
    librarySyncStarted = false;
    void start();
  });
  document.querySelector('.library-retry-btn')?.addEventListener('click', () => {
    librarySyncStarted = false;
    void start();
  });
  bindLibraryButtons();
}
