// Live public data bridge: Render backend -> Bookora state
// Public catalog is sourced from the production backend when it has data.
// A temporary empty backend response must never erase a working Firebase /
// cached public catalog.
import { API_BASE_URL } from './config.js';
import { state } from './state.js';

let syncInFlight = null;
let settingsSyncInFlight = null;

function isPublicCatalogRoute() {
  const hash = window.location.hash || '#/';
  const path = (hash.split('?')[0] || '#/').replace(/^#/, '') || '/';
  return path === '/' || path === '' ||
    ['/explore', '/categories', '/best-sellers', '/new-releases', '/trending', '/authors', '/search'].includes(path) ||
    path.startsWith('/category/') || path.startsWith('/book/') || path.startsWith('/author/');
}

// Firestore settings/public is the authoritative admin configuration store.
// Render's local filesystem is only a runtime mirror and may be recreated on
// restart/deploy. Push the signed-in admin's Firestore settings to the backend
// so payment/commission/runtime code always uses the latest saved values.
export async function syncBackendSettings() {
  if (!state.isAdmin || settingsSyncInFlight) return false;

  settingsSyncInFlight = (async () => {
    try {
      const { auth } = await state.getFirebase();
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return false;
      const idToken = await firebaseUser.getIdToken(true);
      const response = await fetch(`${API_BASE_URL}/api/settings/sync`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: '{}',
        cache: 'no-store'
      });
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Settings sync HTTP ${response.status}: ${text.slice(0, 300)}`);
      }
      return true;
    } catch (error) {
      console.warn('Backend settings persistence sync unavailable:', error);
      return false;
    } finally {
      settingsSyncInFlight = null;
    }
  })();

  return settingsSyncInFlight;
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
      state.notify('DATA_SYNCED');
      return false;
    } finally {
      syncInFlight = null;
    }
  })();

  return syncInFlight;
}

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    syncLiveBackendData();
    setTimeout(() => syncBackendSettings(), 300);
  }, 0);
});

state.subscribe(event => {
  if (event === 'USER_LOGGED_IN') {
    setTimeout(() => {
      syncLiveBackendData();
      setTimeout(() => syncBackendSettings(), 100);
    }, 50);
  }

  // AdminSettingsPage already saves to Firestore and emits this event. Mirror
  // the exact Firestore document to Render immediately after every Save.
  if (event === 'SETTINGS_UPDATED') {
    setTimeout(() => syncBackendSettings(), 0);
  }
});

window.addEventListener('hashchange', () => {
  if (isPublicCatalogRoute()) {
    setTimeout(() => syncLiveBackendData(), 0);
  }
  if (state.isAdmin) setTimeout(() => syncBackendSettings(), 100);
});
