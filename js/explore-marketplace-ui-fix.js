(() => {
  'use strict';

  const STYLE_ID = 'bookora-explore-marketplace-ui-fix';
  const CHIPS_ID = 'bookora-explore-category-chips';

  const CSS = `
  .explore-page{background:#f8fafc!important;min-height:calc(100vh - 80px)!important;padding:30px 0 70px!important}
  .explore-page>.container{max-width:1460px!important}
  .explore-page h1{font-size:clamp(2rem,3vw,2.65rem)!important;letter-spacing:-.035em!important}
  .explore-page .explore-grid-layout{grid-template-columns:250px minmax(0,1fr)!important;gap:18px!important}
  .explore-page .filter-sidebar{border:1px solid #e5e7eb!important;border-radius:14px!important;box-shadow:0 3px 14px rgba(15,23,42,.055)!important;background:#fff!important;top:82px!important}
  .explore-page .filter-head{padding:16px 15px!important}
  .explore-page .filter-section{padding:14px 15px!important}
  .explore-page .filter-section-title{font-size:13px!important;text-transform:uppercase;letter-spacing:.035em}
  .explore-page .filter-option{min-height:31px!important;font-size:12.5px!important}
  .explore-page .filter-option input,.explore-page .filter-rating-row input{accent-color:#7c3aed!important}
  .explore-page .filter-option .count{color:#94a3b8!important}
  .explore-page .filter-search{border-radius:9px!important;height:42px!important}
  .explore-page .price-chip{border-radius:8px!important;background:#fff!important;padding:6px 8px!important}
  .explore-page .price-chip:hover{background:#faf5ff!important;border-color:#8b5cf6!important;color:#7c3aed!important}
  .explore-page .catalog-toolbar{border:1px solid #e5e7eb!important;border-radius:12px!important;box-shadow:0 2px 10px rgba(15,23,42,.035)!important;margin-bottom:10px!important}
  .explore-page .catalog-toolbar select:focus{outline:2px solid rgba(124,58,237,.14);border-color:#8b5cf6!important}
  #${CHIPS_ID}{display:flex;align-items:center;gap:9px;overflow-x:auto;padding:2px 1px 12px;scrollbar-width:thin}
  #${CHIPS_ID}::-webkit-scrollbar{height:5px}
  #${CHIPS_ID} button{flex:0 0 auto;height:36px;padding:0 14px;border:1px solid #e2e8f0;border-radius:9px;background:#fff;color:#334155;font:700 12px/1 Inter,system-ui,sans-serif;cursor:pointer;transition:.18s ease;white-space:nowrap}
  #${CHIPS_ID} button:hover{border-color:#a78bfa;color:#6d28d9;background:#faf5ff}
  #${CHIPS_ID} button.active{border-color:#7c3aed;background:#f5f3ff;color:#6d28d9;box-shadow:0 0 0 1px rgba(124,58,237,.08)}
  .explore-page #explore-books-grid{grid-template-columns:repeat(6,minmax(0,1fr))!important;gap:14px!important;align-items:stretch!important}
  .explore-page .book-card-premium{border-radius:12px!important;box-shadow:0 3px 12px rgba(15,23,42,.055)!important;border-color:#e5e7eb!important}
  .explore-page .book-card-premium:hover{transform:translateY(-2px)!important;box-shadow:0 9px 22px rgba(15,23,42,.10)!important}
  .explore-page .book-cover-premium{aspect-ratio:2/2.72!important}
  .explore-page .book-card-info{padding:9px 10px 10px!important}
  .explore-page .book-card-meta-row{margin-bottom:5px!important}
  .explore-page .book-card-meta-row .badge{font-size:9px!important;padding:4px 7px!important;border-radius:999px!important;color:#7c3aed!important;background:#f5f3ff!important;border-color:#ddd6fe!important}
  .explore-page .book-pages{display:none!important}
  .explore-page .book-card-title-link h3{font-size:.9rem!important;min-height:2.35rem!important}
  .explore-page .book-card-author{font-size:.7rem!important}
  .explore-page .book-card-rating{margin-bottom:5px!important}
  .explore-page .book-card-price-row{padding-top:7px!important}
  .explore-page .book-card-price{font-size:.98rem!important}
  .explore-page .book-buy-btn{font-size:.66rem!important;padding:.4rem .58rem!important}
  .explore-page .book-cover-content h4{font-size:.88rem!important}
  .explore-page .book-cover-content{left:.7rem;right:.7rem;bottom:.6rem}
  .explore-page .book-wishlist-btn{width:32px!important;height:32px!important;top:7px!important;right:7px!important}
  .explore-page .filter-mobile-btn{border-color:#ddd6fe!important;color:#6d28d9!important;background:#fff!important}
  .explore-page .filter-mobile-summary{color:#64748b!important}
  @media(max-width:1350px){.explore-page #explore-books-grid{grid-template-columns:repeat(5,minmax(0,1fr))!important}}
  @media(max-width:1120px){.explore-page .explore-grid-layout{grid-template-columns:235px minmax(0,1fr)!important}.explore-page #explore-books-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important}}
  @media(max-width:900px){.explore-page .explore-grid-layout{grid-template-columns:1fr!important}.explore-page #explore-books-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:11px!important}.explore-page .filter-sidebar.mobile-open{width:min(355px,90vw)!important}}
  @media(max-width:680px){.explore-page{padding-top:18px!important}.explore-page h1{font-size:1.8rem!important}.explore-page #explore-books-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}.explore-page .book-card-title-link h3{font-size:.82rem!important;min-height:2.15rem!important}.explore-page .book-card-author{font-size:.65rem!important}.explore-page .book-card-price{font-size:.88rem!important}.explore-page .book-buy-btn{font-size:.61rem!important;padding:.34rem .45rem!important}}
  `;

  function injectStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=CSS;
    document.head.appendChild(style);
  }

  function getExplore(){return document.querySelector('.explore-page')}

  function escapeHtml(value){return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;')}

  function ensureCategoryChips(){
    const page=getExplore();
    if(!page) return;
    const main=page.querySelector('main');
    const grid=page.querySelector('#explore-books-grid');
    if(!main||!grid) return;
    let chips=document.getElementById(CHIPS_ID);
    if(!chips){
      chips=document.createElement('div');
      chips.id=CHIPS_ID;
      main.insertBefore(chips,grid);
    }
    const radios=[...page.querySelectorAll('input[name="filter-category"]')];
    const signature=radios.map(r=>r.value).join('|');
    if(chips.dataset.signature!==signature){
      chips.dataset.signature=signature;
      chips.innerHTML=radios.map(radio=>{
        const label=radio.closest('label');
        const text=label?.querySelector('span:not(.count)')?.textContent?.trim()||radio.value||'All Categories';
        return `<button type="button" data-category-value="${escapeHtml(radio.value)}" class="${radio.checked?'active':''}">${escapeHtml(text)}</button>`;
      }).join('');
    }
    chips.querySelectorAll('button[data-category-value]').forEach(button=>{
      if(button.dataset.bound==='1') return;
      button.dataset.bound='1';
      button.addEventListener('click',()=>{
        const value=button.dataset.categoryValue||'';
        const radio=radios.find(r=>r.value===value);
        if(!radio) return;
        radio.checked=true;
        radio.dispatchEvent(new Event('change',{bubbles:true}));
        syncCategoryChipState();
      });
    });
  }

  function syncCategoryChipState(){
    const page=getExplore();
    const chips=document.getElementById(CHIPS_ID);
    if(!page||!chips) return;
    const selected=page.querySelector('input[name="filter-category"]:checked')?.value||'';
    chips.querySelectorAll('button[data-category-value]').forEach(btn=>btn.classList.toggle('active',(btn.dataset.categoryValue||'')===selected));
  }

  function updateFilterSummary(){
    const page=getExplore();
    if(!page) return;
    const summary=page.querySelector('#mobile-filter-summary');
    if(!summary) return;
    const active=[];
    const category=page.querySelector('input[name="filter-category"]:checked')?.value||'';
    const rating=page.querySelector('input[name="filter-rating"]:checked')?.value||'0';
    const source=page.querySelector('input[name="filter-source"]:checked')?.value||'all';
    const min=Number(page.querySelector('#filter-min-price')?.value||0);
    const max=Number(page.querySelector('#filter-max-price')?.value||999999);
    const search=String(page.querySelector('#filter-search-input')?.value||'').trim();
    if(search) active.push('Search');
    if(category) active.push(category);
    if(rating!=='0') active.push(`${rating}★+`);
    if(source!=='all') active.push(source==='internal'?'Bookora':'External');
    if(min>0||max<999999) active.push('Price');
    summary.textContent=active.length?`${active.length} filter${active.length>1?'s':''} applied`:'All books';
  }

  function enhanceCards(){
    const page=getExplore();
    const grid=page?.querySelector('#explore-books-grid');
    if(!grid) return;
    grid.querySelectorAll('.book-card').forEach(card=>{
      const category=card.querySelector('.book-cover-topline')?.textContent?.trim();
      const badge=card.querySelector('.book-card-meta-row .badge');
      if(badge&&category){
        badge.textContent=category;
        badge.classList.add('badge-bookora');
        badge.classList.remove('badge-external');
      }
      const info=card.querySelector('.book-card-info');
      if(info) info.style.minWidth='0';
    });
  }

  function wireMobileDrawer(){
    const page=getExplore();
    if(!page||page.dataset.marketplaceUiWired==='1') return;
    page.dataset.marketplaceUiWired='1';
    const sidebar=page.querySelector('#explore-filter-sidebar');
    const backdrop=page.querySelector('#filter-drawer-backdrop');
    const open=page.querySelector('#open-mobile-filters');
    const close=page.querySelector('#close-mobile-filters');
    const reset=page.querySelector('#reset-filters-btn');
    const closeDrawer=()=>{sidebar?.classList.remove('mobile-open');backdrop?.classList.remove('open');document.body.classList.remove('bookora-filter-drawer-open')};
    open?.addEventListener('click',()=>{sidebar?.classList.add('mobile-open');backdrop?.classList.add('open');document.body.classList.add('bookora-filter-drawer-open')});
    close?.addEventListener('click',closeDrawer);
    backdrop?.addEventListener('click',closeDrawer);
    reset?.addEventListener('click',()=>setTimeout(()=>{closeDrawer();updateFilterSummary();syncCategoryChipState()},30));
    page.addEventListener('change',e=>{
      if(e.target.matches('input[name="filter-category"],input[name="filter-rating"],input[name="filter-source"],#filter-min-price,#filter-max-price,#filter-price-slider')) setTimeout(()=>{updateFilterSummary();syncCategoryChipState()},0);
    });
    page.addEventListener('input',e=>{
      if(e.target.matches('#filter-search-input,#filter-min-price,#filter-max-price,#filter-price-slider')) setTimeout(updateFilterSummary,0);
    });
  }

  function sync(){
    const page=getExplore();
    if(!page) return;
    injectStyle();
    ensureCategoryChips();
    wireMobileDrawer();
    syncCategoryChipState();
    updateFilterSummary();
    enhanceCards();
  }

  document.addEventListener('DOMContentLoaded',sync,{once:true});
  window.addEventListener('hashchange',()=>setTimeout(sync,20));
  window.addEventListener('bookora:catalog-updated',()=>setTimeout(sync,20));
  let attempts=0;
  const timer=setInterval(()=>{sync();if(++attempts>=20) clearInterval(timer)},250);
})();
