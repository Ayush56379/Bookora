// Bookora homepage catalog enhancement
// Adds a complete All eBooks catalog directly on the homepage, immediately
// after the existing Featured eBooks section.
import './homepage-catalog-reliability.js';
import { state } from './state.js';
import { renderBookCard } from './components/BookCard.js';

const SECTION_ID = 'bookora-home-catalog';
let observerBusy = false;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function booksForView(view) {
  const all = state.getApprovedBooks();
  if (view === 'trending') return state.getTrendingBooks();
  if (view === 'bestsellers') return state.getBestSellers();
  if (view === 'new') return state.getNewReleases();
  if (view === 'external') return state.getExternalBooks();
  if (view.startsWith('category:')) {
    const wanted = view.slice(9).toLowerCase();
    return all.filter(book => String(book.category || '').toLowerCase() === wanted);
  }
  return all;
}

function categoryOptions() {
  const names = new Set();
  (state.categories || []).forEach(c => {
    const name = typeof c === 'string' ? c : (c?.name || c?.title || '');
    if (name) names.add(String(name));
  });
  state.getApprovedBooks().forEach(book => {
    if (book.category) names.add(String(book.category));
  });
  return [...names].sort((a, b) => a.localeCompare(b));
}

function getTargetSection() {
  const sections = [...document.querySelectorAll('section')];
  const featured = sections.find(section => {
    const text = String(section.textContent || '').replace(/\s+/g, ' ').trim();
    return /Featured eBooks/i.test(text) && /Best Sellers/i.test(text) && /New Releases/i.test(text);
  });
  if (featured) return featured;

  const headings = [...document.querySelectorAll('h2')];
  const featuredHeading = headings.find(h => /featured ebooks/i.test(h.textContent || ''));
  if (featuredHeading) return featuredHeading.closest('section') || null;

  const categoryHeading = headings.find(h => /browse by category/i.test(h.textContent || ''));
  return categoryHeading?.closest('section') || null;
}

function renderCatalog(view = 'all') {
  const root = document.getElementById(SECTION_ID);
  if (!root) return;
  const titleEl = root.querySelector('.bookora-catalog-title');
  const countEl = root.querySelector('.bookora-catalog-count');
  const gridEl = root.querySelector('.bookora-catalog-grid');
  if (!titleEl || !countEl || !gridEl) return;

  const books = booksForView(view);
  const titleMap = {
    all: 'All eBooks',
    trending: 'Trending eBooks',
    bestsellers: 'Best Sellers',
    new: 'New Releases',
    external: 'External Publications'
  };
  const title = view.startsWith('category:') ? `${view.slice(9)} eBooks` : (titleMap[view] || 'eBooks');
  const count = books.length;

  titleEl.textContent = title;
  countEl.textContent = `${count} ${count === 1 ? 'book' : 'books'}`;
  const nextHtml = count
    ? books.map(renderBookCard).join('')
    : `<div class="bookora-catalog-empty"><strong>No eBooks found</strong><span>Try another category or view.</span></div>`;

  if (gridEl.innerHTML !== nextHtml) gridEl.innerHTML = nextHtml;
}

function injectCatalog() {
  if (observerBusy || !document.querySelector('.homepage')) return;
  const existing = document.getElementById(SECTION_ID);
  if (existing) {
    renderCatalog(existing.querySelector('select')?.value || 'all');
    return;
  }

  const targetSection = getTargetSection();
  if (!targetSection) return;

  const section = document.createElement('section');
  section.id = SECTION_ID;
  section.className = 'bookora-home-catalog-section';
  section.innerHTML = `
    <div class="container">
      <div class="bookora-catalog-header">
        <div>
          <span class="badge badge-bookora">BOOKORA LIBRARY</span>
          <h2 class="bookora-catalog-title">All eBooks</h2>
          <p>All approved eBooks available on Bookora are shown here. Use the filters to browse the complete catalog.</p>
        </div>
        <div class="bookora-catalog-filter-wrap">
          <label for="bookora-home-catalog-filter">Browse</label>
          <select id="bookora-home-catalog-filter" aria-label="Filter homepage eBooks">
            <option value="all">All eBooks</option>
            <option value="trending">Trending</option>
            <option value="bestsellers">Best Sellers</option>
            <option value="new">New Releases</option>
            <option value="external">External Publications</option>
            ${categoryOptions().map(c => `<option value="category:${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}
          </select>
          <span class="bookora-catalog-count">0 books</span>
        </div>
      </div>
      <div class="bookora-catalog-grid"></div>
    </div>
  `;

  targetSection.insertAdjacentElement('afterend', section);
  section.querySelector('select').addEventListener('change', e => renderCatalog(e.target.value));
  renderCatalog('all');
}

function scheduleInject() {
  if (observerBusy) return;
  observerBusy = true;
  requestAnimationFrame(() => {
    observerBusy = false;
    injectCatalog();
  });
}

const app = document.getElementById('app');
if (app) {
  const observer = new MutationObserver(scheduleInject);
  observer.observe(app, { childList: true, subtree: false });
}

window.addEventListener('hashchange', () => setTimeout(scheduleInject, 0));

try {
  state.subscribe(() => setTimeout(scheduleInject, 0));
} catch (_) {}

setTimeout(scheduleInject, 50);
