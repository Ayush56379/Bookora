import { state } from './state.js';
import { apiUrl } from './config.js';

const attempted = new Set();

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
  if (!slug) return;
  const book = state.getBookBySlug(slug);
  if (!book) return;

  const currentPages = Number(book.pages || book.page_count || 0);
  const url = pdfUrl(book);
  const id = String(book.id || '').trim();
  if (currentPages > 0 || !id || !url || attempted.has(id)) return;
  attempted.add(id);

  try {
    const response = await fetch(`${apiUrl(`/api/books/page-count/${encodeURIComponent(id)}`)}?pdf_url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    if (!response.ok) return;
    const result = await response.json();
    const pages = Number(result?.pages || 0);
    if (pages <= 0) return;

    const value = pageValueElement();
    if (value) value.textContent = String(pages);

    if (state.books?.length) {
      const target = state.books.find(item => String(item.id) === id);
      if (target) target.pages = pages;
      try { state.persistCatalogCache(state.books); } catch (_) {}
    }
  } catch (_) {
    // Page metadata must never block or alter the normal book page.
  }
}

function schedule() {
  setTimeout(saveMissingPageCount, 700);
}

window.addEventListener('hashchange', schedule);
schedule();
