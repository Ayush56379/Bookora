// Live public data bridge: Render backend -> Bookora state
// Public catalog is sourced from the production backend when it has data.
// A temporary empty backend response must never erase a working Firebase /
// cached public catalog.
import { API_BASE_URL } from './config.js';
import { state } from './state.js';

let syncInFlight = null;

function isPublicCatalogRoute() {
  const hash = window.location.hash || '#/';
  const path = (hash.split('?')[0] || '#/').replace(/^#/, '') || '/';
  return path === '/' || path === '' ||
    ['/explore', '/categories', '/best-sellers', '/new-releases', '/trending', '/authors', '/search'].includes(path) ||
    path.startsWith('/category/') || path.startsWith('/book/') || path.startsWith('/author/');
}

export async function syncLiveBackendData() {
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    try {
      const [booksRes, categoriesRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/books?sort=newest`, {
          headers: { Accept: 'application/json' },
          cache: 'no-store'
        }),
        fetch(`${API_BASE_URL}/api/categories`, {
          headers: { Accept: 'application/json' },
          cache: 'no-store'
        }),
        fetch(`${API_BASE_URL}/api/settings/public`, {
          headers: { Accept: 'application/json' },
          cache: 'no-store'
        })
      ]);

      // The backend is preferred only when it actually returns approved books.
      // Never replace a non-empty Firebase/cache catalog with [] during a
      // Render cold start, database outage, or temporary empty response.
      if (booksRes.ok && (!state.isAdmin || isPublicCatalogRoute())) {
        const books = await booksRes.json();
        if (Array.isArray(books) && books.length) {
          state.books = books;
          state.persistCatalogCache?.(books);
        }
      }

      if (categoriesRes.ok) {
        const categories = await categoriesRes.json();
        if (Array.isArray(categories) && categories.length) {
          state.categories = categories;
        }
      }

      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        if (settings && typeof settings === 'object') state.settings = settings;
      }

      state.notify('DATA_SYNCED');
      return true;
    } catch (error) {
      console.warn('Live backend public sync unavailable:', error);
      // Existing Firebase/cache data remains untouched on failure.
      state.notify('DATA_SYNCED');
      return false;
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => syncLiveBackendData(), 0);
});

// Firebase login currently triggers a Firestore sync as well. Re-sync the
// public catalog afterwards so a non-empty backend catalog can refresh stale
// cached data without ever allowing an empty response to erase it.
state.subscribe(event => {
  if (event === 'USER_LOGGED_IN') {
    setTimeout(() => syncLiveBackendData(), 50);
  }
});

// When an admin approves a book and then returns to the public homepage,
// refresh the backend catalog immediately instead of relying on a full reload.
window.addEventListener('hashchange', () => {
  if (isPublicCatalogRoute()) {
    setTimeout(() => syncLiveBackendData(), 0);
  }
});
