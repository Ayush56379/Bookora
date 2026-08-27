// Bookora Explore — production filter/rating bridge.
// Keeps the canonical Explore UI only. No AI smart-filter UI.
(() => {
  'use strict';
  if (window.__BOOKORA_EXPLORE_PRODUCTION_FILTER_V6__) return;
  window.__BOOKORA_EXPLORE_PRODUCTION_FILTER_V6__ = true;

  const page = () => document.querySelector('.explore-page');
  const approvedBooks = () => { try { const s = window.BookoraState || window.state; return typeof s?.getApprovedBooks === 'function' ? s.getApprovedBooks() : []; } catch (_) { return []; } };
  const numericRating = book => {
    const values = [book?.rating,book?.averageRating,book?.average_rating,book?.avgRating,book?.ratingValue,book?.reviewRating,book?.review_rating];
    for (const value of values) { if (value === null || value === undefined || value === '') continue; const n = Number(String(value).replace(/[^0-9.\-]/g,'')); if (Number.isFinite(n)) return Math.max(0,Math.min(5,n)); }
    const total=Number(book?.ratingTotal||book?.rating_total||0), count=Number(book?.reviewCount||book?.review_count||book?.ratingsCount||0);
    return total>0&&count>0 ? Math.max(0,Math.min(5,total/count)) : 0;
  };
  const numericPrice = book => { for (const value of [book?.sale_price,book?.salePrice,book?.price,book?.original_price,book?.originalPrice]) { if(value===null||value===undefined||value==='') continue; const n=Number(String(value).replace(/[^0-9.\-]/g,'')); if(Number.isFinite(n)) return Math.max(0,n); } return 0; };
  const normalizeCatalog = () => { const books=approvedBooks(); if(!Array.isArray(books))return; books.forEach(book=>{book.rating=numericRating(book);if(book.review_count===undefined&&book.reviewCount!==undefined)book.review_count=Number(book.reviewCount)||0;}); };

  const removeUnwantedAI = () => {
    const p=page(); if(!p)return;
    p.querySelectorAll('#bookora-ai-filter,[data-smart-filter],.smart-filter-section,.ai-smart-filter').forEach(el=>el.remove());
    p.querySelectorAll('.filter-section').forEach(section=>{const text=String(section.textContent||'').trim().toLowerCase();if(text.includes('ai smart filter'))section.remove();});
  };

  const updatePriceControls = () => {
    const p=page(); if(!p)return;
    const books=approvedBooks(); const maxCatalogPrice=Math.max(0,...books.map(numericPrice));
    const min=p.querySelector('#filter-min-price'), max=p.querySelector('#filter-max-price'), slider=p.querySelector('#filter-price-slider');
    if(min){min.removeAttribute('max');min.setAttribute('inputmode','numeric');}
    if(max){max.removeAttribute('max');max.setAttribute('inputmode','numeric');}
    if(slider){const sliderMax=Math.max(1000,Math.ceil(maxCatalogPrice/100)*100,Number(max?.value||0));slider.max=String(sliderMax);slider.setAttribute('aria-label',`Maximum price up to ₹${sliderMax}`);const n=Number(slider.value);if(!Number.isFinite(n)||n>sliderMax)slider.value=String(sliderMax);}
  };

  const styleRatingFilter = () => {
    const p=page(); if(!p)return;
    if(!document.getElementById('bookora-explore-rating-ui-v6')){const style=document.createElement('style');style.id='bookora-explore-rating-ui-v6';style.textContent=`
      .explore-page .filter-rating-row{display:grid!important;grid-template-columns:20px minmax(0,1fr)!important;align-items:center!important;gap:8px!important;min-height:40px!important;padding:6px 8px!important;border:1px solid transparent!important;border-radius:9px!important;color:#334155!important;font-size:12px!important;font-weight:650!important;line-height:1.2!important}.explore-page .filter-rating-row:hover{background:#faf5ff!important;border-color:#ede9fe!important}.explore-page .filter-rating-row input{width:16px!important;height:16px!important;margin:0!important;accent-color:#7c3aed!important}.explore-page .filter-rating-row .rating-option-content{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;width:100%!important}.explore-page .filter-rating-row .rating-stars-text{color:#f59e0b!important;letter-spacing:1px!important;font-size:12px!important;white-space:nowrap!important}.explore-page .filter-rating-row .rating-threshold{color:#475569!important;font-weight:700!important;white-space:nowrap!important}.explore-page .filter-rating-row .rating-all-label{color:#475569!important;font-weight:700!important}.explore-page .book-card-rating{display:flex!important;align-items:center!important;gap:5px!important;min-height:22px!important}`;document.head.appendChild(style);}
    p.querySelectorAll('.filter-rating-row').forEach(row=>{
      const input=row.querySelector('input[name="filter-rating"]'); if(!input||row.dataset.ratingUiVersion==='6')return;
      const value=Number(input.value||0); row.innerHTML=''; row.appendChild(input); const content=document.createElement('span'); content.className='rating-option-content';
      if(value===0)content.innerHTML='<span class="rating-all-label">All ratings</span>'; else {const stars=value>=4.5?'★★★★★':value>=4?'★★★★☆':'★★★☆☆';content.innerHTML=`<span class="rating-stars-text">${stars}</span><span class="rating-threshold">${value.toFixed(1)} &amp; up</span>`;}
      row.appendChild(content);row.dataset.ratingUiVersion='6';
    });
  };

  const triggerActiveFilter = () => { const p=page();if(!p)return;const selected=p.querySelector('input[name="filter-rating"]:checked');if(selected)selected.dispatchEvent(new Event('change',{bubbles:true})); };
  const refresh = () => { if(!page())return;normalizeCatalog();removeUnwantedAI();updatePriceControls();styleRatingFilter();triggerActiveFilter(); };
  window.addEventListener('bookora:catalog-updated',()=>requestAnimationFrame(refresh),{passive:true});
  window.addEventListener('hashchange',()=>setTimeout(refresh,0));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,0),{once:true});else setTimeout(refresh,0);
  const observer=new MutationObserver(()=>{if(page()){removeUnwantedAI();updatePriceControls();styleRatingFilter();}}); observer.observe(document.body,{childList:true,subtree:true});
})();
