import { state } from './state.js';
import { apiUrl } from './config.js';

const attempted = new Set();
const RETRY_COUNT = 30;
const RETRY_DELAY = 1000;
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
      cache: 'no-store'
    });
    if (!response.ok) {
      attempted.delete(id);
      return false;
    }

    const result = await response.json();
    const pages = Number(result?.pages || 0);
    if (pages <= 0) {
      attempted.delete(id);
      return false;
    }

    updateLocalBook(id, pages);
    if (updateDetail) {
      const value = pageValueElement();
      if (value) value.textContent = String(pages);
    }
    return true;
  } catch (_) {
    attempted.delete(id);
    return false;
  }
}

async function processAllMissingBooks() {
  if (!Array.isArray(state.books) || !state.books.length) return false;
  let changed = false;
  for (const book of state.books.slice()) {
    const currentPages = Number(book?.pages || book?.page_count || 0);
    if (currentPages > 0 || !pdfUrl(book) || !String(book?.id || '').trim()) continue;
    const done = await saveBookPageCount(book, false);
    changed = changed || done;
    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
  }
  return changed;
}

async function saveCurrentBook() {
  const slug = currentSlug();
  if (!slug) return false;
  const book = state.getBookBySlug(slug);
  if (!book) return false;
  return saveBookPageCount(book, true);
}

function schedule() {
  let tries = 0;
  const run = async () => {
    tries += 1;
    await processAllMissingBooks();
    const done = await saveCurrentBook();
    if (done || tries >= RETRY_COUNT || !currentSlug()) return;
    setTimeout(run, RETRY_DELAY);
  };
  setTimeout(run, 500);
}

window.addEventListener('hashchange', schedule);
try { state.subscribe(event => { if (event === 'DATA_SYNCED') schedule(); }); } catch (_) {}
schedule();
