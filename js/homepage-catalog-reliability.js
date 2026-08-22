// Bookora homepage catalog reliability layer.
// Keeps the public catalog populated when Firebase is temporarily slow,
// returns an empty snapshot, or the first backend request is transiently unavailable.
import { state } from './state.js';

const MAX_ATTEMPTS = 6;
const RETRY_DELAYS = [500, 1200, 2500, 5000, 9000, 15000];
let running = false;

function mergeBooks(existing, incoming) {
  const map = new Map();
  for (const book of [...(existing || []), ...(incoming || [])]) {
    const normalized = state.normalizeBook(book);
    if (!normalized?.id || normalized.status !== 'approved') continue;
    map.set(String(normalized.id), normalized);
  }
  return [...map.values()];
}

async function refreshPublicCatalog() {
  if (running) return;
  running = true;
  try {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      try {
        const backendBooks = await state.fetchBooksFromBackend();
        if (backendBooks.length) {
          const merged = mergeBooks(state.books, backendBooks);
          state.books = merged;
          state.booksLoaded = true;
          state.persistCatalogCache(merged);
          state.notify('DATA_SYNCED');
          return;
        }
      } catch (error) {
        console.warn('[Catalog] public refresh attempt failed:', error?.message || error);
      }
      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt]));
      }
    }
  } finally {
    running = false;
  }
}

function scheduleIfNeeded() {
  const approved = state.getApprovedBooks();
  // A populated cache/Firestore catalog is already usable. Still refresh in
  // the background so newly approved books can appear without a reload.
  if (!approved.length || !state.booksLoaded) refreshPublicCatalog();
}

try {
  state.subscribe(event => {
    if (event === 'DATA_SYNCED' || event === 'USER_LOGGED_IN') {
      setTimeout(scheduleIfNeeded, 150);
    }
  });
} catch (_) {}

setTimeout(scheduleIfNeeded, 800);
setTimeout(scheduleIfNeeded, 5000);
