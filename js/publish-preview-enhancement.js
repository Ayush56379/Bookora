/* Bookora Publish — seller-complete Step 4 preview. No network calls. */
(()=>{
  'use strict';
  let coverUrl='';
  let lastFile=null;
  const $=id=>document.getElementById(id);
  const value=(id,fallback='—')=>{const el=$(id); const v=typeof el?.value==='string'?el.value.trim():''; return v||fallback;};
  const money=(id)=>{const raw=value(id,''); const n=Number(raw); return raw!==''&&Number.isFinite(n)?`₹${n.toFixed(2)}`:'—';};
  const escapeHtml=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const getTags=()=>value('pub-tags','').split(',').map(x=>x.trim()).filter(Boolean);

  function getCover(){
    const input=$('pub-cover');
    const file=input?.files?.[0];
    if(file && file!==lastFile){
      if(coverUrl) URL.revokeObjectURL(coverUrl);
      coverUrl=URL.createObjectURL(file);
      lastFile=file;
      window.__BOOKORA_PREVIEW_FILE__=file;
    }
    return coverUrl;
  }

  function render(){
    const step=$('step-4');
    if(!step || getComputedStyle(step).display==='none') return;
    const cover=getCover();
    let box=step.querySelector('.publish-complete-preview');
    if(!box){
      box=document.createElement('div');
      box.className='publish-complete-preview';
      const heading=step.querySelector('h3');
      if(heading) heading.insertAdjacentElement('afterend',box); else step.prepend(box);
    }

    const title=value('pub-title','Untitled eBook');
    const subtitle=value('pub-subtitle','');
    const author=value('pub-author','—');
    const category=value('pub-category','—');
    const description=value('pub-description','—');
    const pages=value('pub-pages','—');
    const listPrice=money('pub-price');
    const salePrice=value('pub-saleprice','');
    const tags=getTags();

    box.innerHTML=`
      <div class="pcp-hero">
        <div class="pcp-cover-wrap">
          ${cover?`<img class="pcp-cover-img" src="${cover}" alt="Uploaded book cover preview">`:`<div class="pcp-cover-empty"><span>📕</span><small>Cover not uploaded</small></div>`}
        </div>
        <div class="pcp-content">
          <div class="pcp-eyebrow">SELLER PREVIEW · STEP 4 OF 5</div>
          <h4>${escapeHtml(title)}</h4>
          ${subtitle?`<p class="pcp-subtitle">${escapeHtml(subtitle)}</p>`:''}
          <p class="pcp-author">By <strong>${escapeHtml(author)}</strong></p>
          <div class="pcp-badges">
            <span>${escapeHtml(category)}</span>
            <span>${escapeHtml(pages)} pages</span>
            <span>PDF</span>
          </div>
          <div class="pcp-price-row">
            <div><small>List price</small><strong>${listPrice}</strong></div>
            ${salePrice?`<div><small>Sale price</small><strong>₹${escapeHtml(salePrice)}</strong></div>`:''}
          </div>
        </div>
      </div>
      <div class="pcp-info-grid">
        <section class="pcp-detail-card"><div class="pcp-detail-label">Description</div><p>${escapeHtml(description)}</p></section>
        <section class="pcp-detail-card"><div class="pcp-detail-label">Tags</div><div class="pcp-tags">${tags.length?tags.map(t=>`<span class="pcp-tag">${escapeHtml(t)}</span>`).join(''):'<span class="pcp-muted">No tags added</span>'}</div></section>
      </div>
      <div class="pcp-check-note"><span>✓</span><div><strong>Check everything before continuing</strong><small>This preview shows the information the seller entered from Steps 1–3. Nothing is published until Step 5.</small></div></div>
    `;
  }

  function watch(){
    const form=$('publish-wizard-form');
    if(!form) return;
    render();
    form.addEventListener('input',render,{passive:true});
    form.addEventListener('change',render,{passive:true});
    new MutationObserver(()=>{window.requestAnimationFrame(render)}).observe(form,{subtree:true,childList:true,attributes:true,attributeFilter:['style','class']});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',watch,{once:true}); else watch();
})();
