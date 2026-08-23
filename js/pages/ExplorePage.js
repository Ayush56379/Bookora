// ExplorePage Component — Amazon/Flipkart-style responsive catalog filters
import { state } from '../state.js';
import { renderBookCard } from '../components/BookCard.js';
import { updateSEO } from '../utils/seo.js';

const FILTER_CSS = `
.explore-page .explore-grid-layout{display:grid;grid-template-columns:280px minmax(0,1fr);gap:24px;align-items:start}
.explore-page .filter-sidebar{background:#fff;border:1px solid var(--border-subtle);border-radius:16px;box-shadow:0 2px 10px rgba(15,23,42,.05);position:sticky;top:88px;overflow:hidden}
.explore-page .filter-head{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;border-bottom:1px solid var(--border-subtle)}
.explore-page .filter-head strong{font-size:16px;color:var(--text-primary)}
.explore-page .filter-section{padding:16px 18px;border-bottom:1px solid var(--border-subtle)}
.explore-page .filter-section:last-child{border-bottom:0}
.explore-page .filter-section-title{display:flex;align-items:center;justify-content:space-between;width:100%;padding:0;background:none;border:0;color:var(--text-primary);font-size:14px;font-weight:800;text-align:left;cursor:pointer}
.explore-page .filter-section-title svg{transition:transform .18s ease}
.explore-page .filter-section-title[aria-expanded="false"] svg{transform:rotate(-90deg)}
.explore-page .filter-section-body{margin-top:13px}
.explore-page .filter-section-body.collapsed{display:none}
.explore-page .filter-search{width:100%;height:40px;padding:0 12px;border:1px solid var(--border-medium);border-radius:8px;font-size:14px;outline:none;background:#fff}
.explore-page .filter-search:focus,.explore-page .price-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(37,99,235,.1)}
.explore-page .filter-option{display:flex;align-items:center;gap:9px;min-height:34px;color:var(--text-secondary);font-size:13px;cursor:pointer}
.explore-page .filter-option input{width:16px;height:16px;accent-color:var(--accent);flex:0 0 auto}
.explore-page .filter-option span{min-width:0}
.explore-page .filter-option .count{margin-left:auto;color:var(--text-muted);font-size:11px}
.explore-page .category-list{max-height:210px;overflow:auto;padding-right:3px}
.explore-page .category-list::-webkit-scrollbar{width:5px}.explore-page .category-list::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px}
.explore-page .price-presets{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:12px}
.explore-page .price-chip{border:1px solid var(--border-medium);background:#fff;border-radius:999px;padding:6px 9px;font-size:11px;color:var(--text-secondary);cursor:pointer}
.explore-page .price-chip:hover{border-color:var(--accent);color:var(--accent)}
.explore-page .price-fields{display:grid;grid-template-columns:1fr 1fr;gap:8px;align-items:center}
.explore-page .price-input{width:100%;height:38px;border:1px solid var(--border-medium);border-radius:8px;padding:0 9px;font-size:13px;outline:none}
.explore-page .price-sep{text-align:center;color:var(--text-muted);font-size:12px}
.explore-page .price-range{width:100%;margin-top:12px;accent-color:var(--accent)}
.explore-page .filter-rating-row{display:flex;align-items:center;gap:7px;padding:5px 0;font-size:13px;cursor:pointer}
.explore-page .filter-rating-row input{accent-color:var(--accent)}
.explore-page .stars{letter-spacing:1px;color:#f59e0b;font-size:13px}
.explore-page .filter-mobile-bar{display:none}
.explore-page .filter-drawer-backdrop{display:none}
.explore-page .filter-drawer-close{display:none}
@media(max-width:900px){
 .explore-page .explore-grid-layout{grid-template-columns:minmax(0,1fr);gap:14px}
 .explore-page .filter-sidebar{display:none;position:fixed;z-index:1005;left:0;top:0;bottom:0;width:min(360px,88vw);height:100dvh;border-radius:0;overflow-y:auto;box-shadow:12px 0 35px rgba(15,23,42,.2);transform:translateX(-102%);transition:transform .22s ease}
 .explore-page .filter-sidebar.mobile-open{display:block;transform:translateX(0)}
 .explore-page .filter-mobile-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:2px}
 .explore-page .filter-mobile-btn{display:inline-flex;align-items:center;gap:7px;min-height:42px;border:1px solid var(--border-medium);border-radius:9px;background:#fff;color:var(--text-primary);padding:0 13px;font-weight:700;cursor:pointer}
 .explore-page .filter-mobile-summary{font-size:12px;color:var(--text-secondary)}
 .explore-page .filter-drawer-backdrop{position:fixed;z-index:1004;inset:0;background:rgba(15,23,42,.45)}
 .explore-page .filter-drawer-backdrop.open{display:block}
 .explore-page .filter-drawer-close{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border:0;border-radius:8px;background:#f1f5f9;cursor:pointer}
}
@media(max-width:600px){
 .explore-page{padding-top:16px!important}
 .explore-page .explore-grid-layout{gap:10px}
 .explore-page .catalog-toolbar{padding:10px!important;gap:9px!important}
 .explore-page .catalog-toolbar .sort-wrap{width:100%;justify-content:space-between}
 .explore-page .catalog-toolbar select{min-height:40px;flex:1}
 .explore-page #explore-books-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
 .explore-page .filter-sidebar{width:min(350px,92vw)}
}
@media(max-width:360px){.explore-page #explore-books-grid{gap:7px!important}}
`;

function esc(v){return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}

export function renderExplorePage() {
  updateSEO({title:'Explore All eBooks',description:'Browse, filter, and discover the complete catalog of digital publications on Bookora.'});
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const activeSort = params.get('sort') || 'popular';
  const activeCategory = params.get('category') || '';
  const activeSource = params.get('source') || 'all';
  const categories = Array.isArray(state.categories) ? state.categories : [];

  return `
    <style id="bookora-explore-filter-css">${FILTER_CSS}</style>
    <div class="explore-page animate-fade-in" style="background:var(--bg-secondary);min-height:80vh;padding:2rem 0 5rem">
      <div class="container">
        <div style="margin-bottom:20px">
          <div class="badge badge-bookora" style="margin-bottom:7px">Catalog Explorer</div>
          <h1 style="font-family:var(--font-display);font-size:2.2rem;font-weight:800;color:var(--text-primary);letter-spacing:-.02em">Explore All eBooks</h1>
          <p style="font-size:.95rem;color:var(--text-secondary);margin-top:4px">Discover, filter, and sort publications across all categories.</p>
        </div>

        <div class="filter-mobile-bar">
          <button id="open-mobile-filters" class="filter-mobile-btn" type="button"><span>☰</span> Filters</button>
          <span id="mobile-filter-summary" class="filter-mobile-summary">All books</span>
        </div>
        <div id="filter-drawer-backdrop" class="filter-drawer-backdrop"></div>

        <div class="explore-grid-layout">
          <aside id="explore-filter-sidebar" class="filter-sidebar" aria-label="Book filters">
            <div class="filter-head">
              <strong>Filters</strong>
              <div style="display:flex;align-items:center;gap:7px">
                <button id="reset-filters-btn" class="btn btn-ghost btn-sm" type="button" style="font-size:12px;color:var(--accent)">Clear all</button>
                <button id="close-mobile-filters" class="filter-drawer-close" type="button" aria-label="Close filters">✕</button>
              </div>
            </div>

            <section class="filter-section">
              <button class="filter-section-title" type="button" aria-expanded="true" data-filter-toggle="keyword">Search <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></button>
              <div class="filter-section-body" data-filter-body="keyword"><input id="filter-search-input" class="filter-search" type="search" placeholder="Search title, author, topic..." autocomplete="off"></div>
            </section>

            <section class="filter-section">
              <button class="filter-section-title" type="button" aria-expanded="true" data-filter-toggle="category">Category <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></button>
              <div class="filter-section-body" data-filter-body="category">
                <div class="category-list">
                  <label class="filter-option"><input type="radio" name="filter-category" value="" ${!activeCategory?'checked':''}><span>All Categories</span></label>
                  ${categories.map(c=>`<label class="filter-option"><input type="radio" name="filter-category" value="${esc(c.name)}" ${activeCategory===c.name?'checked':''}><span>${esc(c.name)}</span><span class="count">${Number(c.count||0)}</span></label>`).join('')}
                </div>
              </div>
            </section>

            <section class="filter-section">
              <button class="filter-section-title" type="button" aria-expanded="true" data-filter-toggle="price">Price <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></button>
              <div class="filter-section-body" data-filter-body="price">
                <div class="price-presets">
                  <button type="button" class="price-chip" data-max-price="199">Under ₹199</button>
                  <button type="button" class="price-chip" data-max-price="499">Under ₹499</button>
                  <button type="button" class="price-chip" data-max-price="999">Under ₹999</button>
                  <button type="button" class="price-chip" data-max-price="999999">All</button>
                </div>
                <div class="price-fields"><input id="filter-min-price" class="price-input" type="number" min="0" step="1" placeholder="Min ₹"><span class="price-sep">to</span><input id="filter-max-price" class="price-input" type="number" min="0" step="1" value="999999" placeholder="Max ₹"></div>
                <input id="filter-price-slider" class="price-range" type="range" min="0" max="9999" value="9999" step="50" aria-label="Maximum price">
              </div>
            </section>

            <section class="filter-section">
              <button class="filter-section-title" type="button" aria-expanded="true" data-filter-toggle="rating">Customer Rating <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></button>
              <div class="filter-section-body" data-filter-body="rating">
                <label class="filter-rating-row"><input type="radio" name="filter-rating" value="0" checked><span>All ratings</span></label>
                <label class="filter-rating-row"><input type="radio" name="filter-rating" value="4.5"><span class="stars">★★★★★</span><span>& Up</span></label>
                <label class="filter-rating-row"><input type="radio" name="filter-rating" value="4"><span class="stars">★★★★</span><span> & Up</span></label>
                <label class="filter-rating-row"><input type="radio" name="filter-rating" value="3"><span class="stars">★★★</span><span> & Up</span></label>
              </div>
            </section>

            <section class="filter-section">
              <button class="filter-section-title" type="button" aria-expanded="true" data-filter-toggle="source">Book Source <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></button>
              <div class="filter-section-body" data-filter-body="source">
                <label class="filter-option"><input type="radio" name="filter-source" value="all" ${activeSource==='all'?'checked':''}><span>All sources</span></label>
                <label class="filter-option"><input type="radio" name="filter-source" value="internal" ${activeSource==='internal'?'checked':''}><span>Bookora books</span></label>
                <label class="filter-option"><input type="radio" name="filter-source" value="external" ${activeSource==='external'?'checked':''}><span>External books</span></label>
              </div>
            </section>
          </aside>

          <main>
            <div class="catalog-toolbar" style="background:#fff;border:1px solid var(--border-subtle);border-radius:14px;padding:12px 16px;margin-bottom:16px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px">
              <div style="font-size:.9rem;color:var(--text-secondary)">Showing <strong id="catalog-count" style="color:var(--text-primary)">0</strong> eBooks</div>
              <div class="sort-wrap" style="display:flex;align-items:center;gap:8px"><label style="font-size:.84rem;font-weight:700;color:var(--text-secondary)">Sort by</label><select id="catalog-sort-select" style="min-height:40px;padding:0 10px;border-radius:8px;border:1px solid var(--border-medium);font-size:.84rem;background:#fff"><option value="popular" ${activeSort==='popular'?'selected':''}>Popular</option><option value="newest" ${activeSort==='newest'?'selected':''}>Newest</option><option value="bestselling" ${activeSort==='bestselling'?'selected':''}>Best Selling</option><option value="toprated" ${activeSort==='toprated'?'selected':''}>Top Rated</option><option value="price-asc" ${activeSort==='price-asc'?'selected':''}>Price: Low to High</option><option value="price-desc" ${activeSort==='price-desc'?'selected':''}>Price: High to Low</option></select></div>
            </div>
            <div id="explore-books-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px"></div>
          </main>
        </div>
      </div>
    </div>
  `;
}

export function initExploreEvents() {
  const grid=document.getElementById('explore-books-grid'); if(!grid) return;
  const sidebar=document.getElementById('explore-filter-sidebar');
  const backdrop=document.getElementById('filter-drawer-backdrop');
  const searchInput=document.getElementById('filter-search-input');
  const minPrice=document.getElementById('filter-min-price');
  const maxPrice=document.getElementById('filter-max-price');
  const priceSlider=document.getElementById('filter-price-slider');
  const countLabel=document.getElementById('catalog-count');
  const sortSelect=document.getElementById('catalog-sort-select');
  const mobileSummary=document.getElementById('mobile-filter-summary');

  const getSelected=(name, fallback='')=>document.querySelector(`input[name="${name}"]:checked`)?.value ?? fallback;
  const openFilters=()=>{sidebar?.classList.add('mobile-open');backdrop?.classList.add('open');document.body.style.overflow='hidden';};
  const closeFilters=()=>{sidebar?.classList.remove('mobile-open');backdrop?.classList.remove('open');document.body.style.overflow='';};
  document.getElementById('open-mobile-filters')?.addEventListener('click',openFilters);
  document.getElementById('close-mobile-filters')?.addEventListener('click',closeFilters);
  backdrop?.addEventListener('click',closeFilters);

  document.querySelectorAll('[data-filter-toggle]').forEach(btn=>btn.addEventListener('click',()=>{
    const key=btn.getAttribute('data-filter-toggle'); const body=document.querySelector(`[data-filter-body="${key}"]`); const expanded=btn.getAttribute('aria-expanded')==='true';
    btn.setAttribute('aria-expanded',String(!expanded)); body?.classList.toggle('collapsed',expanded);
  }));

  const filterAndRender=()=>{
    const search=(searchInput?.value||'').toLowerCase().trim();
    const category=getSelected('filter-category','');
    const source=getSelected('filter-source','all');
    const rating=Number(getSelected('filter-rating','0'));
    const min=Math.max(0,Number(minPrice?.value||0));
    const max=Math.max(min,Number(maxPrice?.value||999999));
    const sort=sortSelect?.value||'popular';
    let books=[...(state.getApprovedBooks()||[])];

    if(search) books=books.filter(b=>[b.title,b.author,b.description,b.category,...(b.tags||[])].some(v=>String(v||'').toLowerCase().includes(search)));
    if(category) books=books.filter(b=>String(b.category||'')===category);
    if(source!=='all') books=books.filter(b=>String(b.source_type||b.sourceType||'internal').toLowerCase()===source);
    books=books.filter(b=>{const p=Number(b.sale_price||b.salePrice||b.price||0);return p>=min&&p<=max;});
    if(rating>0) books=books.filter(b=>Number(b.rating||0)>=rating);

    if(sort==='newest') books.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
    else if(sort==='bestselling') books.sort((a,b)=>(Number(b.sales_count||b.sales||b.purchase_count||0)-Number(a.sales_count||a.sales||a.purchase_count||0)) || (Number(b.is_bestseller)-Number(a.is_bestseller)));
    else if(sort==='toprated') books.sort((a,b)=>Number(b.rating||0)-Number(a.rating||0));
    else if(sort==='price-asc') books.sort((a,b)=>Number(a.sale_price||a.salePrice||a.price||0)-Number(b.sale_price||b.salePrice||b.price||0));
    else if(sort==='price-desc') books.sort((a,b)=>Number(b.sale_price||b.salePrice||b.price||0)-Number(a.sale_price||a.salePrice||a.price||0));

    if(countLabel) countLabel.textContent=books.length;
    const active=[];
    if(search) active.push('Search'); if(category) active.push(category); if(source!=='all') active.push(source==='internal'?'Bookora':'External'); if(rating) active.push(`${rating}★+`); if(min>0||max<999999) active.push(`₹${min}–₹${max>=999999?'∞':max}`);
    if(mobileSummary) mobileSummary.textContent=active.length?active.join(' · '):'All books';

    if(!books.length){grid.innerHTML=`<div style="grid-column:1/-1;background:#fff;border:1px solid var(--border-subtle);border-radius:16px;padding:60px 24px;text-align:center"><div style="font-size:38px;margin-bottom:10px">⌕</div><h3 style="margin-bottom:7px;color:var(--text-primary)">No eBooks Matched Your Filters</h3><p style="color:var(--text-secondary);margin-bottom:18px">Try changing or clearing one of your filters.</p><button id="empty-reset-btn" class="btn btn-primary btn-sm" type="button">Clear Filters</button></div>`;document.getElementById('empty-reset-btn')?.addEventListener('click',resetAll);return;}
    grid.innerHTML=books.map(renderBookCard).join('');
  };

  const resetAll=()=>{
    if(searchInput) searchInput.value=''; if(minPrice) minPrice.value=''; if(maxPrice) maxPrice.value='999999'; if(priceSlider) priceSlider.value='9999';
    document.querySelector('input[name="filter-category"][value=""]')?.click(); document.querySelector('input[name="filter-source"][value="all"]')?.click(); document.querySelector('input[name="filter-rating"][value="0"]')?.click(); if(sortSelect) sortSelect.value='popular'; filterAndRender();
  };

  searchInput?.addEventListener('input',filterAndRender);
  minPrice?.addEventListener('input',()=>{const n=Number(minPrice.value||0);if(Number(maxPrice.value||0)<n)maxPrice.value=String(n);filterAndRender();});
  maxPrice?.addEventListener('input',()=>{const n=Number(maxPrice.value||999999);if(priceSlider)n<=9999&&(priceSlider.value=String(n));filterAndRender();});
  priceSlider?.addEventListener('input',()=>{maxPrice.value=priceSlider.value;filterAndRender();});
  sortSelect?.addEventListener('change',filterAndRender);
  document.querySelectorAll('input[name="filter-category"],input[name="filter-source"],input[name="filter-rating"]').forEach(el=>el.addEventListener('change',filterAndRender));
  document.querySelectorAll('[data-max-price]').forEach(btn=>btn.addEventListener('click',()=>{maxPrice.value=btn.getAttribute('data-max-price');if(priceSlider)priceSlider.value=String(Math.min(9999,Number(maxPrice.value)));filterAndRender();}));
  document.getElementById('reset-filters-btn')?.addEventListener('click',resetAll);
  filterAndRender();
}
