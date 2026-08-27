// PublicDiscoveryPages Component
import { state } from '../state.js';
import { renderBookCard } from '../components/BookCard.js';
import { updateSEO } from '../utils/seo.js';
import '../best-sellers-firebase-runtime.js?v=20260827-1';

const esc = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');
const slugify = value => String(value || '').trim().toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

function bookCategoryNames(book) {
  const values = [];
  const add = value => {
    if (value == null || value === '') return;
    if (Array.isArray(value)) return value.forEach(add);
    if (typeof value === 'object') return add(value.name || value.title || value.category || value.label || value.slug || value.id);
    const text = String(value).trim().replace(/\s+/g,' ');
    if (text) values.push(text);
  };
  add(book?.category); add(book?.categories); add(book?.category_name); add(book?.categoryName);
  return [...new Set(values)];
}

function liveCategories() {
  const books = state.getApprovedBooks();
  const map = new Map();
  books.forEach(book => bookCategoryNames(book).forEach(name => {
    const key = name.toLowerCase();
    const item = map.get(key);
    if (item) item.count += 1;
    else map.set(key, { name, slug: slugify(name), count: 1 });
  }));
  return [...map.values()].filter(item => item.count > 0).sort((a,b) => a.name.localeCompare(b.name));
}

function installCategoryCSS() {
  if (document.getElementById('bookora-final-category-css')) return;
  const style = document.createElement('style');
  style.id = 'bookora-final-category-css';
  style.textContent = `
    .bookora-final-categories{background:var(--bg-secondary);min-height:85vh;padding:38px 0 64px}
    .bookora-final-category-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:22px}
    .bookora-final-category-head h1{margin:0;font:800 2.15rem/1.15 var(--font-display,Inter,sans-serif);letter-spacing:-.03em;color:var(--text-primary)}
    .bookora-final-category-head h1 span{color:var(--accent)}
    .bookora-final-category-head p{margin:7px 0 0;color:var(--text-secondary);font-size:.94rem}
    .bookora-final-category-total{display:flex;gap:6px;align-items:baseline;background:#fff;border:1px solid var(--border-subtle);border-radius:10px;padding:8px 12px;white-space:nowrap}
    .bookora-final-category-total strong{font-size:18px;color:var(--text-primary)}.bookora-final-category-total span{font-size:11px;font-weight:700;color:var(--text-muted)}
    .bookora-final-category-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
    .bookora-final-category-card{position:relative;display:flex;align-items:center;gap:12px;min-width:0;min-height:78px;padding:13px 14px;background:#fff;border:1px solid var(--border-subtle);border-radius:12px;text-decoration:none;box-shadow:0 2px 8px rgba(15,23,42,.04);transition:.15s;overflow:hidden}
    .bookora-final-category-card:before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(180deg,#7c3aed,#2563eb)}
    .bookora-final-category-card:hover{transform:translateY(-2px);border-color:#c4b5fd;box-shadow:0 8px 20px rgba(15,23,42,.08)}
    .bookora-final-category-icon{width:40px;height:40px;flex:0 0 40px;display:grid;place-items:center;border-radius:10px;background:#f5f3ff;color:#6d28d9;font-size:17px}
    .bookora-final-category-copy{min-width:0;flex:1;display:flex;flex-direction:column;gap:4px}.bookora-final-category-copy strong{font-size:14px;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bookora-final-category-copy small{font-size:11px;font-weight:600;color:var(--text-muted)}
    .bookora-final-category-arrow{font-size:18px;font-weight:800;color:var(--text-muted)}
    @media(max-width:950px){.bookora-final-category-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:650px){.bookora-final-category-head{align-items:flex-start;flex-direction:column}.bookora-final-category-head h1{font-size:1.8rem}.bookora-final-category-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}

export function renderCategoriesDirectoryPage() {
  installCategoryCSS();
  updateSEO({ title:'Browse All Categories', description:'Explore categories with published Bookora eBooks.' });
  const categories = liveCategories();
  const books = state.getApprovedBooks();
  return `<div class="bookora-final-categories animate-fade-in"><div class="container"><div class="bookora-final-category-head"><div><h1>Explore Categories <span>(${categories.length})</span></h1><p>Browse categories that currently contain published eBooks.</p></div><div class="bookora-final-category-total"><strong>${books.length}</strong><span>published books</span></div></div>${categories.length ? `<div class="bookora-final-category-grid">${categories.map(c => `<a class="bookora-final-category-card" href="#/category/${encodeURIComponent(c.slug)}" aria-label="Browse ${esc(c.name)}"><span class="bookora-final-category-icon">▣</span><span class="bookora-final-category-copy"><strong>${esc(c.name)}</strong><small>${c.count} ${c.count === 1 ? 'Publication' : 'Publications'}</small></span><span class="bookora-final-category-arrow">→</span></a>`).join('')}</div>` : `<div style="background:#fff;border:1px solid var(--border-subtle);border-radius:12px;padding:42px;text-align:center;color:var(--text-muted)">No published categories available yet.</div>`}</div></div>`;
}

if (!window.__BOOKORA_FINAL_CATEGORY_SUBSCRIBER__) {
  window.__BOOKORA_FINAL_CATEGORY_SUBSCRIBER__ = true;
  state.subscribe(event => {
    if (!['DATA_SYNCED','BOOKS_UPDATED','CATALOG_UPDATED'].includes(event)) return;
    const root = document.querySelector('.bookora-final-categories');
    if (!root) return;
    const holder = document.createElement('div'); holder.innerHTML = renderCategoriesDirectoryPage();
    root.replaceWith(holder.firstElementChild);
  });
}

function renderBestSellerState() {
  if (state.__bestSellerLoading || state.__bestSellerRanked === null) {
    return `<div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:4rem 2rem;text-align:center;color:var(--text-secondary)"><div style="font-weight:700;margin-bottom:.5rem">Loading Best Sellers…</div><div style="font-size:.9rem;color:var(--text-muted)">Reading successful purchases from Firebase.</div></div>`;
  }
  if (state.__bestSellerError) {
    return `<div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:3rem 2rem;text-align:center;color:var(--text-secondary)"><div style="font-weight:700;margin-bottom:.5rem">Best Sellers could not be loaded</div><div style="font-size:.9rem;color:var(--text-muted)">${esc(state.__bestSellerError)}</div><button class="btn btn-secondary btn-sm" style="margin-top:1rem" onclick="window.dispatchEvent(new CustomEvent('bookora:best-sellers-retry'))">Retry</button></div>`;
  }
  return null;
}

export function renderCuratedCatalogPage(type='bestsellers') {
  const isBest=type==='bestsellers', isTrend=type==='trending';
  const title=isBest?'Best Sellers Leaderboard':isTrend?'Trending Now':'New Releases';
  updateSEO({title,description:`Explore ${title.toLowerCase()} on Bookora.`});
  if (isBest) {
    const stateView = renderBestSellerState();
    if (stateView) return `<div class="curated-catalog-page animate-fade-in" style="background:var(--bg-secondary);min-height:85vh;padding:4rem 0 6rem"><div class="container"><div style="margin-bottom:2.5rem"><h1 style="font-family:var(--font-display);font-size:2.2rem;font-weight:800;color:var(--text-primary)">${title}</h1><p style="font-size:.95rem;color:var(--text-secondary)">Ranked by successful Firebase purchases.</p></div>${stateView}</div></div>`;
  }
  const books=isBest?state.getBestSellers():isTrend?state.getTrendingBooks():state.getNewReleases();
  const content=books.length?`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.5rem">${books.map(renderBookCard).join('')}</div>`:`<div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:4rem 2rem;text-align:center;color:var(--text-muted)">${isBest?'No successful purchases found yet.':'No publications available in this section yet.'}</div>`;
  return `<div class="curated-catalog-page animate-fade-in" style="background:var(--bg-secondary);min-height:85vh;padding:4rem 0 6rem"><div class="container"><div style="margin-bottom:2.5rem"><h1 style="font-family:var(--font-display);font-size:2.2rem;font-weight:800;color:var(--text-primary)">${title}</h1><p style="font-size:.95rem;color:var(--text-secondary)">${isBest?'Ranked by successful Firebase purchases.':'Real-time curated marketplace selections.'}</p></div>${content}</div></div>`;
}

if (!window.__BOOKORA_BEST_SELLERS_RETRY__) {
  window.__BOOKORA_BEST_SELLERS_RETRY__ = true;
  window.addEventListener('bookora:best-sellers-retry', () => state.__hydrateBestSellers?.().then(() => window.__BOOKORA_APP_INSTANCE__?.requestRoute?.(true, false)));
}

export function renderAuthorsDirectoryPage() {
  updateSEO({title:'Authors & Creators',description:'Meet verified authors publishing on Bookora.'});
  const creators=state.users.filter(u=>u.role==='creator'||u.seller_status==='approved');
  return `<div class="authors-page animate-fade-in" style="background:var(--bg-secondary);min-height:85vh;padding:4rem 0 6rem"><div class="container"><div style="margin-bottom:2.5rem"><h1 style="font-family:var(--font-display);font-size:2.2rem;font-weight:800;color:var(--text-primary)">Authors & Creators (${creators.length})</h1><p style="font-size:.95rem;color:var(--text-secondary)">Connect with independent writers and publishers.</p></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem">${creators.map(c=>`<div class="book-card" style="background:#fff;padding:1.5rem;text-align:center"><img src="${c.avatar||'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}" alt="${esc(c.name)}" style="width:72px;height:72px;border-radius:99px;object-fit:cover;margin:0 auto 1rem"><h3>${esc(c.name)}</h3><div style="color:var(--accent);font-size:.75rem;font-weight:600">Verified Author</div><p>${esc(c.bio||'Bookora Author')}</p><a href="#/explore?q=${encodeURIComponent(c.name)}" class="btn btn-secondary btn-sm" style="width:100%">View Publications</a></div>`).join('')}</div></div></div>`;
}
