import { apiUrl } from './config.js';

// Targeted PDF page-count backfill only. No other book fields are written.
const attempted = new Set();
const RETRY_COUNT = 60;
const RETRY_DELAY = 1500;
const BATCH_DELAY = 250;

function pdfUrl(book) {
  return String(book?.pdf_url || book?.pdfUrl || '').trim();
}

function pageValueElement() {
  const stats = Array.from(document.querySelectorAll('.bd-stat'));
  const stat = stats.find(node => String(node.querySelector('.bd-stat-label')?.textContent || '').trim().toLowerCase() === 'pages');
  return stat?.querySelector('.bd-stat-value') || null;
}

async function fetchBackendBooks() {
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
}

async function saveBookPageCount(book, updateDetail = false) {
  const currentPages = Number(book?.pages || book?.page_count || 0);
  const url = pdfUrl(book);
  const id = String(book?.id || '').trim();
  if (currentPages > 0 || !id || !url || attempted.has(id)) return false;
  attempted.add(id);

  try {
    console.log(`[Bookora PDF Pages] Processing ${id}`);
    const endpoint = `${apiUrl(`/api/books/page-count/${encodeURIComponent(id)}`)}?pdf_url=${encodeURIComponent(url)}`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'omit',
      cache: 'no-store'
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result?.error || `HTTP ${response.status}`);

    const pages = Number(result?.pages || 0);
    if (pages <= 0) throw new Error(result?.error || 'No readable PDF pages');

    book.pages = pages;
    if (updateDetail) {
      const value = pageValueElement();
      if (value) value.textContent = String(pages);
    }
    console.log(`[Bookora PDF Pages] SAVED ${pages} pages for book ${id}`);
    return true;
  } catch (error) {
    attempted.delete(id);
    console.warn(`[Bookora PDF Pages] ${id} skipped:`, error?.message || error);
    return false;
  }
}

async function processAllMissingBooks() {
  let books = [];
  try {
    books = await fetchBackendBooks();
  } catch (error) {
    console.warn('[Bookora PDF Pages] Backend catalog unavailable:', error?.message || error);
    return false;
  }

  let changed = false;
  for (const book of books) {
    if (Number(book?.pages || book?.page_count || 0) > 0 || !pdfUrl(book) || !book.id) continue;
    changed = (await saveBookPageCount(book, false)) || changed;
    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
  }
  return changed;
}

function updateCurrentDetailFromCatalog(books) {
  const hash = String(location.hash || '');
  const match = hash.match(/^#\/book\/([^/?#]+)/i);
  if (!match) return;
  const slug = decodeURIComponent(match[1]).trim().toLowerCase();
  const book = books.find(item => String(item?.slug || item?.id || '').trim().toLowerCase() === slug);
  if (!book || Number(book?.pages || book?.page_count || 0) <= 0) return;
  const value = pageValueElement();
  if (value) value.textContent = String(book.pages || book.page_count);
}

async function run() {
  try {
    const books = await fetchBackendBooks();
    updateCurrentDetailFromCatalog(books);
    for (const book of books) {
      if (Number(book?.pages || book?.page_count || 0) > 0 || !pdfUrl(book) || !book.id) continue;
      await saveBookPageCount(book, false);
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
    updateCurrentDetailFromCatalog(books);
  } catch (error) {
    console.warn('[Bookora PDF Pages] run skipped:', error?.message || error);
  }
}

let tries = 0;
function schedule() {
  tries = 0;
  const tick = async () => {
    tries += 1;
    await run();
    if (tries < RETRY_COUNT) setTimeout(tick, RETRY_DELAY);
  };
  setTimeout(tick, 500);
}

window.addEventListener('hashchange', schedule);
schedule();
