// Canonical Firebase category page
import { state } from '../state.js';
import { renderBookCard } from '../components/BookCard.js';
import { updateSEO } from '../utils/seo.js';

const esc = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');
const slugify = value => String(value || '').trim().toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');

function categoryValues(book) {
  const out=[];
  const add=value=>{
    if(value==null||value==='') return;
    if(Array.isArray(value)) return value.forEach(add);
    if(typeof value==='object') return add(value.name||value.title||value.category||value.label||value.slug||value.id);
    const text=String(value).trim().replace(/\s+/g,' '); if(text) out.push(text);
  };
  add(book?.category); add(book?.categories); add(book?.category_name); add(book?.categoryName);
  return [...new Set(out)];
}

function matchesCategory(book, wantedSlug, wantedName) {
  return categoryValues(book).some(value => slugify(value) === wantedSlug || value.trim().toLowerCase() === wantedName.trim().toLowerCase());
}

function findCategory(slug) {
  const wantedSlug=slugify(decodeURIComponent(String(slug||'')));
  const books=state.getApprovedBooks();
  const names=[];
  books.forEach(book=>categoryValues(book).forEach(name=>{
    if(!names.some(x=>x.toLowerCase()===name.toLowerCase())) names.push(name);
  }));
  return names.find(name=>slugify(name)===wantedSlug) || decodeURIComponent(String(slug||'')).replace(/-/g,' ').replace(/\b\w/g,l=>l.toUpperCase());
}

export function renderCategoryPage(slug) {
  const categoryName=findCategory(slug);
  const wantedSlug=slugify(categoryName);
  const books=state.getApprovedBooks().filter(book=>matchesCategory(book,wantedSlug,categoryName));
  updateSEO({title:`${categoryName} eBooks`,description:`Browse published ${categoryName} eBooks on Bookora.`});

  return `<div class="canonical-category-page animate-fade-in"><div class="container">
    <div class="canonical-category-head"><a href="#/categories">← Back to Categories</a><h1>${esc(categoryName)}</h1><span>${books.length} ${books.length===1?'Publication':'Publications'}</span></div>
    ${books.length ? `<div class="canonical-category-books">${books.map(b=>renderBookCard(b)).join('')}</div>` : `<div class="canonical-category-empty"><strong>No published eBooks in this category.</strong><span>This category currently has no approved Firebase books.</span></div>`}
  </div></div>`;
}

if(!document.getElementById('bookora-canonical-category-page-css')){const s=document.createElement('style');s.id='bookora-canonical-category-page-css';s.textContent=`
.canonical-category-page{background:var(--bg-secondary);min-height:85vh;padding:36px 0 64px}.canonical-category-head{display:flex;align-items:center;gap:18px;margin-bottom:24px;flex-wrap:wrap}.canonical-category-head a{width:100%;color:var(--accent);font-size:13px;font-weight:700;text-decoration:none}.canonical-category-head h1{margin:0;font:800 2.15rem/1.15 var(--font-display,Inter,sans-serif);color:var(--text-primary);letter-spacing:-.03em}.canonical-category-head span{padding:7px 10px;background:#fff;border:1px solid var(--border-subtle);border-radius:9px;color:var(--text-muted);font-size:12px;font-weight:700}.canonical-category-books{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}.canonical-category-empty{background:#fff;border:1px solid var(--border-subtle);border-radius:14px;padding:48px 20px;text-align:center;display:flex;flex-direction:column;gap:8px}.canonical-category-empty strong{color:var(--text-primary)}.canonical-category-empty span{color:var(--text-muted);font-size:13px}@media(max-width:650px){.canonical-category-page{padding:25px 0 50px}.canonical-category-head h1{font-size:1.8rem}.canonical-category-books{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}}
`;document.head.appendChild(s)}
