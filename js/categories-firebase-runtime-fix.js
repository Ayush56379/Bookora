// Bookora Categories — Firebase-backed live directory.
// Only categories that actually contain approved Firebase books are shown.
import { state } from './state.js';

const esc = value => String(value ?? '')
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/\"/g,'&quot;').replace(/'/g,'&#039;');

const slugify = value => String(value || '')
  .toLowerCase().trim().replace(/&/g,'and')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

const categoryValues = book => {
  const values = [];
  const add = value => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) return value.forEach(add);
    if (typeof value === 'object') {
      add(value.name); add(value.title); add(value.category);
      add(value.label); add(value.slug); add(value.id);
      return;
    }
    const text = String(value).trim().replace(/\s+/g,' ');
    if (text) values.push(text);
  };
  add(book?.category);
  add(book?.categories);
  add(book?.category_name);
  add(book?.categoryName);
  return [...new Set(values)];
};

function getCategories() {
  const books = typeof state.getApprovedBooks === 'function'
    ? state.getApprovedBooks()
    : [];

  const map = new Map();
  books.forEach(book => {
    categoryValues(book).forEach(name => {
      const key = name.toLowerCase();
      const existing = map.get(key);
      if (existing) existing.count += 1;
      else map.set(key, { name, count: 1, slug: slugify(name) });
    });
  });

  return [...map.values()]
    .filter(c => c.count > 0)
    .sort((a,b) => a.name.localeCompare(b.name));
}

function iconFor(name) {
  const n = String(name).toLowerCase();
  if (n.includes('business')) return '▣';
  if (n.includes('romance')) return '♥';
  if (n.includes('horror') || n.includes('fiction')) return '◈';
  if (n.includes('science')) return '✦';
  if (n.includes('self')) return '◎';
  if (n.includes('finance')) return '₹';
  if (n.includes('education')) return '▤';
  return '📚';
}

function render() {
  const root = document.querySelector('.categories-dir-page');
  if (!root) return;

  const categories = getCategories();
  const total = categories.reduce((sum,c) => sum + c.count, 0);

  root.innerHTML = `
    <div class="container categories-live-only">
      <div class="categories-live-head">
        <h1>Available Categories <span>(${categories.length})</span></h1>
        <p>Only categories containing published eBooks are shown.</p>
        <div class="categories-live-total"><strong>${total}</strong><span>published books</span></div>
      </div>
      ${categories.length ? `
        <div class="categories-live-grid">
          ${categories.map(c => `
            <a class="category-live-item" href="#/category/${encodeURIComponent(c.slug)}" aria-label="Browse ${esc(c.name)} — ${c.count} ${c.count === 1 ? 'publication' : 'publications'}">
              <span class="category-live-icon" aria-hidden="true">${iconFor(c.name)}</span>
              <span class="category-live-copy"><strong>${esc(c.name)}</strong><small>${c.count} ${c.count === 1 ? 'Publication' : 'Publications'}</small></span>
              <span class="category-live-arrow" aria-hidden="true">→</span>
            </a>
          `).join('')}
        </div>
      ` : `
        <div class="categories-live-empty">
          <strong>No categories available yet</strong>
          <span>Categories will appear automatically when an approved eBook exists in Firebase.</span>
        </div>
      `}
    </div>
  `;
}

function install() {
  if (!document.querySelector('.categories-dir-page')) return;

  if (!document.getElementById('bookora-categories-live-only-css')) {
    const style = document.createElement('style');
    style.id = 'bookora-categories-live-only-css';
    style.textContent = `
      .categories-dir-page{background:var(--bg-secondary)!important;min-height:85vh!important;padding:42px 0 70px!important}
      .categories-live-only{max-width:1180px!important}
      .categories-live-head{margin-bottom:24px}
      .categories-live-head h1{margin:0;color:var(--text-primary);font:800 2.2rem/1.15 var(--font-display,Inter,sans-serif);letter-spacing:-.025em}
      .categories-live-head h1 span{color:var(--accent)}
      .categories-live-head p{margin:8px 0 14px;color:var(--text-secondary);font-size:.95rem}
      .categories-live-total{display:inline-flex;align-items:baseline;gap:7px;padding:7px 11px;background:#fff;border:1px solid var(--border-subtle);border-radius:9px}
      .categories-live-total strong{font-size:17px;color:var(--text-primary)}
      .categories-live-total span{font-size:11px;color:var(--text-muted);font-weight:700}
      .categories-live-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
      .category-live-item{display:flex;align-items:center;gap:13px;min-height:82px;padding:14px 15px;background:#fff;border:1px solid var(--border-subtle);border-radius:12px;text-decoration:none;transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease}
      .category-live-item:hover{transform:translateY(-2px);border-color:#c4b5fd;box-shadow:0 8px 20px rgba(15,23,42,.08)}
      .category-live-icon{width:42px;height:42px;flex:0 0 42px;display:grid;place-items:center;border-radius:10px;background:#f5f3ff;color:#6d28d9;font-size:19px}
      .category-live-copy{min-width:0;flex:1;display:flex;flex-direction:column;gap:4px}
      .category-live-copy strong{color:var(--text-primary);font-size:14px;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .category-live-copy small{color:var(--text-muted);font-size:11px;font-weight:600}
      .category-live-arrow{font-size:18px;color:var(--text-muted);font-weight:800}
      .categories-live-empty{padding:50px 20px;background:#fff;border:1px solid var(--border-subtle);border-radius:14px;text-align:center;display:flex;flex-direction:column;gap:7px}
      .categories-live-empty strong{color:var(--text-primary);font-size:16px}
      .categories-live-empty span{color:var(--text-muted);font-size:13px}
      @media(max-width:950px){.categories-live-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:650px){.categories-dir-page{padding:25px 0 50px!important}.categories-live-head h1{font-size:1.8rem}.categories-live-grid{grid-template-columns:1fr}.category-live-item{min-height:74px}}
    `;
    document.head.appendChild(style);
  }

  render();

  if (!window.__BOOKORA_CATEGORIES_LIVE_WATCH__) {
    window.__BOOKORA_CATEGORIES_LIVE_WATCH__ = true;
    let lastSignature = '';
    setInterval(() => {
      const root = document.querySelector('.categories-dir-page');
      if (!root) return;
      const books = typeof state.getApprovedBooks === 'function' ? state.getApprovedBooks() : [];
      const signature = books.map(b => `${b?.id || ''}:${JSON.stringify(b?.category || '')}:${b?.status || ''}:${b?.updatedAt || b?.updated_at || ''}`).join('|');
      if (signature !== lastSignature) {
        lastSignature = signature;
        render();
      }
    }, 1500);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
else install();
window.addEventListener('hashchange', () => setTimeout(install, 80));
