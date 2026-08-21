// Bookora purchased-access runtime.
// This module owns authenticated protected PDF access.
// Library listing is Firestore-direct in LibraryPage.js; it must never trigger
// a backend auth/session request merely because the user opened /library.
import { state } from './state.js';
import { apiUrl } from './config.js';
import { ReaderModal } from './components/ReaderModal.js';
import { Toast } from './components/Toast.js';

const API = String(apiUrl('') || window.BOOKORA_API_URL || '').replace(/\/$/, '');
let sessionPromise = null;

async function waitForFirebaseUser() {
  const current = window.firebase?.auth?.()?.currentUser;
  if (current) return current;
  if (window.BookoraAuthReady) {
    const resolved = await Promise.race([
      window.BookoraAuthReady,
      new Promise(resolve => setTimeout(() => resolve(null), 10000))
    ]);
    if (resolved) return resolved;
  }
  const auth = window.firebase?.auth?.();
  if (!auth) return null;
  return await new Promise(resolve => {
    let settled = false;
    let unsubscribe = null;
    const finish = user => { if (settled) return; settled = true; try { unsubscribe?.(); } catch (_) {} resolve(user || null); };
    unsubscribe = auth.onAuthStateChanged(finish);
    setTimeout(() => finish(auth.currentUser || null), 10000);
  });
}

async function ensureBackendSession(force = false) {
  if (!force && state.token) return state.token;
  if (!force) {
    const cached = localStorage.getItem('bookora_auth_token') || '';
    if (cached) { state.token = cached; return cached; }
  }
  if (sessionPromise) return sessionPromise;
  sessionPromise = (async () => {
    try {
      const firebaseUser = await waitForFirebaseUser();
      if (!firebaseUser) throw new Error('Authentication required. Please sign in again.');
      const idToken = await firebaseUser.getIdToken(force);
      const response = await fetch(`${API}/api/auth/firebase`, {
        method:'POST',
        headers:{ Authorization:`Bearer ${idToken}`, Accept:'application/json', 'Content-Type':'application/json' },
        body: JSON.stringify({ firebaseUid: firebaseUser.uid, email: firebaseUser.email || '', role: state.currentUser?.role || 'buyer' }),
        cache:'no-store'
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.token) throw new Error(data.error || 'Could not create a secure Bookora session.');
      state.token = data.token;
      state.isAuthenticated = true;
      if (data.user) {
        state.currentUser = {
          ...(state.currentUser || {}),
          ...data.user,
          firebaseUid: firebaseUser.uid,
          bookoraUserId: data.user.bookoraUserId || data.user.userId || data.user.id || state.currentUser?.bookoraUserId || null
        };
      }
      localStorage.setItem('bookora_auth_token', data.token);
      localStorage.setItem('bookora_user_profile', JSON.stringify(state.currentUser || {}));
      return data.token;
    } finally { sessionPromise = null; }
  })();
  return sessionPromise;
}

async function backend(path, options = {}) {
  let token = await ensureBackendSession(false);
  const request = async sessionToken => {
    const headers = { Accept:'application/json', ...(options.headers || {}), Authorization:`Bearer ${sessionToken}` };
    return fetch(`${API}${path}`, { ...options, headers, cache:'no-store' });
  };
  let response = await request(token);
  if (response.status === 401) {
    token = await ensureBackendSession(true);
    response = await request(token);
  }
  return response;
}

// Explicit protected-access operation only. Never called automatically on login.
async function syncPurchasedLibrary() {
  const firebaseUser = await waitForFirebaseUser();
  if (!firebaseUser) throw new Error('Authentication required. Please sign in again.');
  await ensureBackendSession(false);
  const response = await backend('/api/library');
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Unable to load your library.');
  const books = Array.isArray(data) ? data : (Array.isArray(data.library) ? data.library : (Array.isArray(data.books) ? data.books : []));
  for (const item of books) {
    const book = item.bookId && !item.title ? (state.books.find(b => String(b.id) === String(item.bookId)) || item) : item;
    const id = String(book?.id || book?.bookId || '').trim();
    if (id) state.library.add(id);
    if (book?.id && !state.books.some(existing => String(existing.id) === id)) state.books.push(book);
  }
  return books;
}

async function fetchPurchasedPdf(bookId, mode = 'open') {
  const response = await backend(`/${mode === 'download' ? 'api/download' : 'api/open'}/${encodeURIComponent(bookId)}`);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Purchased PDF access was denied.');
  }
  const type = String(response.headers.get('content-type') || '').toLowerCase();
  if (!type.includes('application/pdf')) throw new Error('The purchased file is not a PDF.');
  return response.blob();
}

async function openPurchasedPdf(book) {
  if (!book?.id) throw new Error('Book information is missing.');
  const tab = window.open('about:blank', '_blank');
  if (!tab) throw new Error('Please allow pop-ups for Bookora to open the purchased PDF.');
  try {
    tab.document.write('<title>Bookora — Opening PDF…</title><p style="font-family:Arial;padding:24px">Opening your licensed PDF…</p>');
    await syncPurchasedLibrary();
    if (!state.hasPurchased(book.id)) throw new Error('This eBook is not unlocked for the current account.');
    const blob = await fetchPurchasedPdf(book.id, 'open');
    const url = URL.createObjectURL(blob);
    tab.location.href = url;
    window.setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000);
  } catch (error) {
    try { tab.close(); } catch (_) {}
    throw error;
  }
}

async function downloadPurchasedPdf(book) {
  if (!book?.id) throw new Error('Book information is missing.');
  await syncPurchasedLibrary();
  if (!state.hasPurchased(book.id)) throw new Error('This eBook is not unlocked for the current account.');
  const blob = await fetchPurchasedPdf(book.id, 'download');
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${String(book.title || 'Bookora-eBook').replace(/[^a-zA-Z0-9._-]+/g, '_')}.pdf`;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60 * 1000);
}

const originalReaderOpen = ReaderModal.open.bind(ReaderModal);
ReaderModal.open = async function(book, isSample = false) {
  if (isSample) return originalReaderOpen(book, true);
  try { await openPurchasedPdf(book); }
  catch (error) { console.error('Purchased reader:', error); Toast.show(error.message || 'Unable to open the purchased PDF.', 'error'); }
};

window.BookoraPurchaseAccess = {
  ensureBackendSession,
  syncPurchasedLibrary,
  openPurchasedPdf,
  downloadPurchasedPdf,
  fetchPurchasedPdf
};

// No USER_LOGGED_IN listener on purpose. The library page is Firestore-direct.
// Backend authentication starts only after an explicit protected Read/Download.
