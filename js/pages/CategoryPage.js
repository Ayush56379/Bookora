// Canonical Firebase Category Page V2
// - Uses the already-loaded/cached public catalog for fast navigation.
// - Shows ONLY approved Firebase books belonging to the selected category.
// - Supports category strings, arrays and category objects.
// - One renderer + one subscription only: no duplicate cards/design/runtime.
import { state } from '../state.js';
import { renderBookCard } from '../components/BookCard.js';
import { updateSEO } from '../utils/seo.js';

const esc = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/\"/g, '&quot;')
  .replace(/'/g, '&#039;');

const slugify = value => String(value ?? '')
  .trim()
  .toLowerCase()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const normalize = value => String(value ?? '')
  .trim()
  .replace(/\s+/g, ' ')
  .toLowerCase();

function categoryValues(book) {
  const values = [];
  const add = value => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach(add);
      return;
    }
    if (typeof value === 'object') {
      // Accept common Firebase category object shapes without duplicating aliases.
      add(value.name);
      add(value.title);
      add(value.category);
      add(value.label);
      add(value.slug);
      add(value.id);
      return;
    }
    const text = String(value).trim().replace(/\s+/g, ' ');
    if (text) values.push(text);
  };

  add(book?.category);
  add(book?.categories);
  add(book?.category_name);
  add(book?.categoryName);
  return [...new Set(values)];
}

function categoryAliases(value) {
  if (!value) return [];
  if (typeof value === 'object') {
    return [...new Set([
      value.name,
      value.title,
      value.category,
      value.label,
      value.slug,
      value.id
    ].filter(Boolean).flatMap(categoryAliases))];
  }
  const text = String(value).trim();
  if (!text) return [];
  return [...new Set([normalize(text), slugify(text)])].filter(Boolean);
}

function getWantedAliases(slug) {
  const raw = decodeURIComponent(String(slug || '')).trim();
  const aliases = new Set(categoryAliases(raw));

  // Prefer the canonical Firebase category record when available.
  const categories = Array.isArray(state.categories) ? state.categories : [];
  categories.forEach(category => {
    const categoryAliasesList = categoryAliases(category);
    if (categoryAliasesList.includes(slugify(raw)) || categoryAliasesList.includes(normalize(raw))) {
      categoryAliases(category).forEach(alias => aliases.add(alias));
    }
  });

  return [...aliases];
}

function resolveCategoryName(slug, books) {
  const raw = decodeURIComponent(String(slug || '')).trim();
  const wanted = new Set(getWantedAliases(raw));
  const categories = Array.isArray(state.categories) ? state.categories : [];

  const firebaseCategory = categories.find(category => {
    const aliases = categoryAliases(category);
    return aliases.some(alias => wanted.has(alias));
  });
  if (firebaseCategory?.name || firebaseCategory?.title) {
    return String(firebaseCategory.name || firebaseCategory.title).trim();
  }

  const bookCategory = books.flatMap(categoryValues).find(value =>
    categoryAliases(value).some(alias => wanted.has(alias))
  );
  if (bookCategory) return bookCategory;

  return raw.replace(/-/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

function getCategoryBooks(slug) {
  const books = typeof state.getApprovedBooks === 'function'
    ? state.getApprovedBooks()
    : [];
  const wanted = new Set(getWantedAliases(slug));

  return books.filter(book => categoryValues(book).some(value =>
    categoryAliases(value).some(alias => wanted.has(alias))
  ));
}

function renderCategoryContent(slug) {
  const allBooks = typeof state.getApprovedBooks === 'function'
    ? state.getApprovedBooks()
    : [];
  const categoryName = resolveCategoryName(slug, allBooks);
  const books = getCategoryBooks(slug);

  updateSEO({
    title: `${categoryName} eBooks`,
    description: `Browse published ${categoryName} eBooks on Bookora.`
  });

  return {
    categoryName,
    books,
    html: books.length
      ? `<div class="bookora-category-book-grid">${books.map(book => renderBookCard(book)).join('')}</div>`
      : `<div class="bookora-category-empty">
          <div class="bookora-category-empty-title">No published eBooks in this category yet</div>
          <div class="bookora-category-empty-copy">Approved Firebase publications will appear here automatically.</div>
        </div>`
  };
}

export function renderCategoryPage(slug) {
  const data = renderCategoryContent(slug);
  const loading = !state.booksLoaded && state.booksLoading;

  return `<div class="bookora-category-page animate-fade-in" data-category-route="${esc(slug)}">
    <div class="container">
      <div class="bookora-category-top">
        <a class="bookora-category-back" href="#/categories" aria-label="Back to categories">← Back to Categories</a>
        <div class="bookora-category-heading-row">
          <div class="bookora-category-heading">
            <h1>${esc(data.categoryName)}</h1>
            <p>Explore all published books in this category.</p>
          </div>
          <div class="bookora-category-count" aria-label="Publication count">
            <strong>${data.books.length}</strong>
            <span>${data.books.length === 1 ? 'Publication' : 'Publications'}</span>
          </div>
        </div>
      </div>
      <div class="bookora-category-results" aria-live="polite">
        ${loading ? `<div class="bookora-category-loading-grid">${Array.from({ length: 6 }, () => `
          <div class="bookora-category-skeleton"><div class="bookora-category-skeleton-cover"></div><div class="bookora-category-skeleton-line wide"></div><div class="bookora-category-skeleton-line"></div></div>
        `).join('')}</div>` : data.html}
      </div>
    </div>
  </div>`;
}

if (!document.getElementById('bookora-category-page-v2-css')) {
  const style = document.createElement('style');
  style.id = 'bookora-category-page-v2-css';
  style.textContent = `
    .bookora-category-page{background:var(--bg-secondary);min-height:85vh;padding:32px 0 64px}
    .bookora-category-top{margin-bottom:26px}
    .bookora-category-back{display:inline-flex;align-items:center;gap:6px;margin-bottom:18px;color:var(--accent);font-size:13px;font-weight:750;text-decoration:none}
    .bookora-category-back:hover{text-decoration:underline}
    .bookora-category-heading-row{display:flex;align-items:flex-end;justify-content:space-between;gap:24px}
    .bookora-category-heading h1{margin:0;color:var(--text-primary);font:800 clamp(1.9rem,3vw,2.55rem)/1.1 var(--font-display,Inter,sans-serif);letter-spacing:-.035em}
    .bookora-category-heading p{margin:9px 0 0;color:var(--text-secondary);font-size:.94rem}
    .bookora-category-count{display:flex;align-items:baseline;gap:7px;white-space:nowrap;padding:10px 13px;background:#fff;border:1px solid var(--border-subtle);border-radius:11px;box-shadow:0 2px 8px rgba(15,23,42,.04)}
    .bookora-category-count strong{color:var(--text-primary);font:800 18px/1 var(--font-display,Inter,sans-serif)}
    .bookora-category-count span{color:var(--text-muted);font-size:11px;font-weight:700}
    .bookora-category-book-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:18px}
    .bookora-category-empty{min-height:260px;padding:48px 20px;background:#fff;border:1px solid var(--border-subtle);border-radius:16px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px}
    .bookora-category-empty-title{color:var(--text-primary);font-size:17px;font-weight:800}
    .bookora-category-empty-copy{color:var(--text-muted);font-size:13px}
    .bookora-category-loading-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:18px}
    .bookora-category-skeleton{height:430px;background:#fff;border:1px solid var(--border-subtle);border-radius:16px;overflow:hidden;padding-bottom:18px}
    .bookora-category-skeleton-cover,.bookora-category-skeleton-line{background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 37%,#f1f5f9 63%);background-size:400% 100%;animation:bookoraCategoryShimmer 1.35s ease infinite}
    .bookora-category-skeleton-cover{height:305px;margin-bottom:18px}
    .bookora-category-skeleton-line{height:14px;width:55%;margin:0 18px 10px;border-radius:8px}
    .bookora-category-skeleton-line.wide{width:75%}
    @keyframes bookoraCategoryShimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
    @media(max-width:700px){
      .bookora-category-page{padding:24px 0 50px}
      .bookora-category-heading-row{align-items:flex-start;flex-direction:column;gap:14px}
      .bookora-category-count{padding:8px 11px}
      .bookora-category-book-grid,.bookora-category-loading-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
      .bookora-category-skeleton{height:340px}
      .bookora-category-skeleton-cover{height:235px}
    }
  `;
  document.head.appendChild(style);
}

// Install exactly one live refresh listener for this page module.
if (!window.__BOOKORA_CATEGORY_PAGE_V2_WATCH__) {
  window.__BOOKORA_CATEGORY_PAGE_V2_WATCH__ = true;
  state.subscribe(event => {
    if (event !== 'DATA_SYNCED' && event !== 'BOOKS_UPDATED' && event !== 'CATALOG_UPDATED') return;
    const root = document.querySelector('.bookora-category-page');
    if (!root) return;

    const slug = root.getAttribute('data-category-route') || '';
    const next = renderCategoryPage(slug);
    const wrapper = document.createElement('div');
    wrapper.innerHTML = next;
    const replacement = wrapper.firstElementChild;
    if (replacement) root.replaceWith(replacement);
  });
}
