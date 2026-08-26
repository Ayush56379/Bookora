// Bookora New Releases Firebase runtime
// Keeps the New Releases page sorted by the real publication/release timestamp
// and updates the page immediately when an approved book changes in Firestore.
import { state } from './state.js';

const RELEASE_FIELDS = [
  'publishedAt', 'published_at',
  'releasedAt', 'released_at',
  'releaseDate', 'release_date',
  'publicationDate', 'publication_date',
  'createdAt', 'created_at',
  'uploadedAt', 'uploaded_at',
  'updatedAt', 'updated_at'
];

let unsubscribe = null;
let starting = false;
let rerenderTimer = null;

function toMillis(value) {
  if (value == null || value === '') return 0;
  try {
    if (typeof value?.toMillis === 'function') return Number(value.toMillis()) || 0;
    if (typeof value === 'object') {
      if (Number.isFinite(Number(value.seconds))) return Number(value.seconds) * 1000 + Math.floor(Number(value.nanoseconds || 0) / 1e6);
      if (Number.isFinite(Number(value._seconds))) return Number(value._seconds) * 1000 + Math.floor(Number(value._nanoseconds || 0) / 1e6);
      if (value instanceof Date) return value.getTime() || 0;
    }
    if (typeof value === 'number') {
      const n = Number(value);
      if (!Number.isFinite(n)) return 0;
      return n < 1e12 ? n * 1000 : n;
    }
    const parsed = Date.parse(String(value));
    return Number.isFinite(parsed) ? parsed : 0;
  } catch (_) {
    return 0;
  }
}

function releaseMillis(book) {
  for (const field of RELEASE_FIELDS) {
    const value = book?.[field];
    const millis = toMillis(value);
    if (millis > 0) return millis;
  }
  return 0;
}

function createdMillis(book) {
  return toMillis(book?.createdAt) || toMillis(book?.created_at) || toMillis(book?.updatedAt) || toMillis(book?.updated_at) || 0;
}

function normalizeAndSort(books) {
  return (Array.isArray(books) ? books : [])
    .map(book => state.normalizeBook(book))
    .filter(Boolean)
    .filter(book => String(book.status || '').toLowerCase() === 'approved')
    .sort((a, b) => {
      const releaseDiff = releaseMillis(b) - releaseMillis(a);
      if (releaseDiff) return releaseDiff;
      const createdDiff = createdMillis(b) - createdMillis(a);
      if (createdDiff) return createdDiff;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
}

// Override only the New Releases selector. Other catalog sections keep their
// existing behavior and data flow.
state.getNewReleases = () => normalizeAndSort(state.books);

function renderCurrentNewReleases() {
  const path = String(window.location.hash || '#/').split('?')[0].replace(/^#/, '');
  if (path !== '/new-releases') return;
  clearTimeout(rerenderTimer);
  rerenderTimer = setTimeout(async () => {
    try {
      const module = await import('./pages/PublicDiscoveryPages.js');
      const main = document.getElementById('main-content');
      if (!main) return;
      main.innerHTML = module.renderCuratedCatalogPage('new');
    } catch (error) {
      console.warn('[New Releases] Re-render skipped:', error);
    }
  }, 0);
}

async function startRealtimeListener() {
  if (unsubscribe || starting) return;
  starting = true;
  try {
    const waitForFirebase = async () => {
      for (let attempt = 0; attempt < 80; attempt += 1) {
        if (window.firebase?.apps?.length) return window.firebase.firestore();
        await new Promise(resolve => setTimeout(resolve, 250));
      }
      throw new Error('Firebase did not initialize in time.');
    };

    const db = await waitForFirebase();
    const query = db.collection('books').where('status', '==', 'approved');
    unsubscribe = query.onSnapshot(snapshot => {
      const books = normalizeAndSort(snapshot.docs.map(doc => ({ id: String(doc.id), ...doc.data() })));
      state.books = books;
      state.booksLoaded = true;
      state.persistCatalogCache(books);
      state.notify('NEW_RELEASES_UPDATED', books);
      renderCurrentNewReleases();
    }, error => {
      console.warn('[New Releases] Firestore realtime listener failed:', error);
      // Keep the existing state/backend fallback instead of blanking the page.
      unsubscribe = null;
    });
  } catch (error) {
    console.warn('[New Releases] Firebase listener could not start:', error);
  } finally {
    starting = false;
  }
}

function stopRealtimeListener() {
  if (typeof unsubscribe === 'function') unsubscribe();
  unsubscribe = null;
}

function handleRouteChange() {
  const path = String(window.location.hash || '#/').split('?')[0].replace(/^#/, '');
  if (path === '/new-releases') startRealtimeListener();
  else stopRealtimeListener();
}

window.addEventListener('hashchange', handleRouteChange);
window.addEventListener('load', handleRouteChange, { once: true });
queueMicrotask(handleRouteChange);

export { releaseMillis, normalizeAndSort, startRealtimeListener, stopRealtimeListener };
