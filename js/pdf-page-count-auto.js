import { state } from './state.js';
import { apiUrl } from './config.js';

const attempted = new Set();
const RETRY_COUNT = 30;
const RETRY_DELAY = 1000;

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

async function saveMissingPageCount() {
  const slug = currentSlug();
  if (!slug) return false;

  const book = state.getBookBySlug(slug);
  if (!book) return false;

  const currentPages = Number(book.pages || book.page_count || 0);
  const url = pdfUrl(book);
  const id = String(book.id || '').trim();
  if (currentPages > 0) return true;
  if (!id || !url) return false;
  if (attempted.has(id)) return true;
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

    const value = pageValueElement();
    if (value) value.textContent = String(pages);

    if (Array.isArray(state.books)) {
      const target = state.books.find(item => String(item.id) === id);
      if (target) target.pages = pages;
      try { state.persistCatalogCache(state.books); } catch (_) {}
    }
    return true;
  } catch (_) {
    attempted.delete(id);
    return false;
  }
}

function schedule() {
  let tries = 0;
  const run = async () => {
    tries += 1;
    if (await saveMissingPageCount()) return;
    if (tries < RETRY_COUNT && currentSlug()) setTimeout(run, RETRY_DELAY);
  };
  setTimeout(run, 500);
}

window.addEventListener('hashchange', schedule);
schedule();
