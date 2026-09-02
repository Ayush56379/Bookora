import { state } from './state.js';
import { apiUrl } from './config.js';

// Targeted PDF page-count backfill only. No other book fields are written.
const attempted = new Set();
const RETRY_COUNT = 60;
const RETRY_DELAY = 1500;
const BATCH_DELAY = 250;

function currentSlug() {
  const match = String(location.hash || '').match(/^#\/book\/([^/?#]+)/i);
  return match ? decodeURIComponent(match[1]) : '';
}

function pdfUrl(book) {
  return String(book?.pdf_url || book?.pdfUrl || '').trim();
}

function pageValueElement() {
  const stats = Array.from(document.querySelectorAll('.bd-stat'));
  const stat = stats.find(node => String(node.querySelector('.bd-stat-label')?.textContent || '').trim().toLowerCase() === 'pages');
  return stat?.querySelector('.bd-stat-value') || null;
}

function updateLocalBook(id, pages) {
  if (!Array.isArray(state.books)) return;
  const target = state.books.find(item => String(item.id) === String(id));
  if (target) target.pages = pages;
  try { state.persistCatalogCache(state.books); } catch (_) {}
}

async function saveBookPageCount(book, updateDetail = false) {
  const currentPages = Number(book?.pages || book?.page_count || 0);
  const url = pdfUrl(book);
  const id = String(book?.id || '').trim();
  if (currentPages > 0 || !id || !url || attempted.has(id)) return false;
  attempted.add(id);

  try {
    const endpoint = `${apiUrl(`/api/books/page-count/${encodeURIComponent(id)}`)}?pdf_url=${encodeURIComponent(url)}`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'omit',
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();
    const pages = Number(result?.pages || 0);
    if (pages <= 0) throw new Error(result?.error || 'No readable PDF pages');

    updateLocalBook(id, pages);
    if (updateDetail) {
      const value = pageValueElement();
      if (value) value.textContent = String(pages);
    }
    console.log(`[Bookora PDF Pages] Saved ${pages} pages for book ${id}`);
    return true;
  } catch (error) {
    attempted.delete(id);
    console.warn(`[Bookora PDF Pages] ${id} skipped:`, error?.message || error);
    return false;
  }
}

async function fetchBackendBooks() {
  try {
    const response = await fetch(apiUrl('/api/books'), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'omit',
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`Catalog HTTP ${response.status}`);
    const payload = await response.json();
    const books = Array.isArray(payload) ? payload : (Array.isArray(payload?.books) ? payload.books : []);
    return books.map(book => ({ ...book, id: String(book?.id || '').trim() }));
  } catch (error) {
    console.warn('[Bookora PDF Pages] Backend catalog unavailable:', error?.message || error);
    return [];
  }
}

async function processBooks(books) {
  if (!Array.isArray(books) || !books.length) return false;
  let changed = false;
  for (const book of books) {
    const currentPages = Number(book?.pages || book?.page_count || 0);
    if (currentPages > 0 || !pdfUrl(book) || !String(book?.id || '').trim()) continue;
    const done = await saveBookPageCount(book, false);
    changed = changed || done;
    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
  }
  return changed;
}

async function processAllMissingBooks() {
  const backendBooks = await fetchBackendBooks();
  if (backendBooks.length) await processBooks(backendBooks);
  if (Array.isArray(state.books) && state.books.length) await processBooks(state.books.slice());
}

async function saveCurrentBook() {
  const slug = currentSlug();
  if (!slug) return false;

  let book = null;
  try { book = state.getBookBySlug(slug); } catch (_) {}
  if (book) {
    const done = await saveBookPageCount(book, true);
    if (done) return true;
  }

  const backendBooks = await fetchBackendBooks();
  const match = backendBooks.find(item => {
    const itemSlug = String(item?.slug || item?.id || '').trim().toLowerCase();
    return itemSlug === String(slug).trim().toLowerCase();
  });
  if (!match) return false;
  return saveBookPageCount(match, true);
}

function schedule() {
  let tries = 0;
  const run = async () => {
    tries += 1;
    await processAllMissingBooks();
    const done = await saveCurrentBook();
    if (done || tries >= RETRY_COUNT) return;
    setTimeout(run, RETRY_DELAY);
  };
  setTimeout(run, 500);
}

window.addEventListener('hashchange', schedule);
try { state.subscribe(event => { if (event === 'DATA_SYNCED') schedule(); }); } catch (_) {}
schedule();
