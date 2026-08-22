// Bookora homepage catalog enhancement
// Adds a single clear All eBooks catalog with a user-selectable view.
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
  const headings = [...document.querySelectorAll('h2')];
  const categoryHeading = headings.find(h => /browse by category/i.test(h.textContent || ''));
  return categoryHeading?.closest('section') || null;
}

function renderCatalog(view = 'all') {
  const root = document.getElementById(SECTION_ID);
  if (!root) return;
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

  root.querySelector('.bookora-catalog-title').textContent = title;
  root.querySelector('.bookora-catalog-count').textContent = `${count} ${count === 1 ? 'book' : 'books'}`;
  root.querySelector('.bookora-catalog-grid').innerHTML = count
    ? books.map(renderBookCard).join('')
    : `<div class="bookora-catalog-empty"><strong>No eBooks found</strong><span>Try another category or view.</span></div>`;
}

function injectCatalog() {
  if (observerBusy || !document.querySelector('.homepage')) return;
  const existing = document.getElementById(SECTION_ID);
  if (existing) {
    renderCatalog(existing.querySelector('select')?.value || 'all');
    return;
  }

  const categorySection = getTargetSection();
  if (!categorySection) return;

  const section = document.createElement('section');
  section.id = SECTION_ID;
  section.className = 'bookora-home-catalog-section';
  section.innerHTML = `
    <div class="container">
      <div class="bookora-catalog-header">
        <div>
          <span class="badge badge-bookora">BOOKORA LIBRARY</span>
          <h2 class="bookora-catalog-title">All eBooks</h2>
          <p>Browse the complete Bookora catalog and switch between trending, best sellers, new releases, and categories.</p>
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

  categorySection.insertAdjacentElement('afterend', section);
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
  observer.observe(app, { childList: true, subtree: true });
}

window.addEventListener('hashchange', () => setTimeout(scheduleInject, 0));

try {
  state.subscribe(() => setTimeout(scheduleInject, 0));
} catch (_) {}

setTimeout(scheduleInject, 50);
