/* Bookora Publish — working seller preview. */
(()=>{
  'use strict';
  let coverUrl='',lastFile=null;
  const $=id=>document.getElementById(id);
  const val=(id,f='—')=>{const e=$(id);const v=typeof e?.value==='string'?e.value.trim():'';return v||f};
  const esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
  const getTags=()=>val('pub-tags','').split(',').map(s=>s.trim()).filter(Boolean);
  function getCover(){const i=$('pub-cover'),f=i?.files?.[0];if(f&&f!==lastFile){if(coverUrl)URL.revokeObjectURL(coverUrl);coverUrl=URL.createObjectURL(f);lastFile=f;window.__BOOKORA_PREVIEW_FILE__=f}return coverUrl}
  function render(){
    const step=$('step-4');if(!step||getComputedStyle(step).display==='none')return;
    let box=step.querySelector('.publish-complete-preview');
    if(!box){box=document.createElement('div');box.className='publish-complete-preview';const h=step.querySelector('h3');h?h.insertAdjacentElement('afterend',box):step.prepend(box)}
    const title=val('pub-title','Untitled eBook'),subtitle=val('pub-subtitle',''),author=val('pub-author'),category=val('pub-category'),description=val('pub-description'),pages=val('pub-pages'),price=val('pub-price'),sale=val('pub-saleprice',''),ts=getTags(),cv=getCover();
    box.innerHTML=`<div class="pcp-hero"><div class="pcp-cover-wrap">${cv?`<img class="pcp-cover-img" src="${cv}" alt="Book cover preview">`:`<div class="pcp-cover-empty"><span>📕</span><small>Cover not uploaded</small></div>`}</div><div class="pcp-content"><div class="pcp-eyebrow">SELLER PREVIEW · STEP 4 OF 5</div><h4>${esc(title)}</h4>${subtitle?`<p class="pcp-subtitle">${esc(subtitle)}</p>`:''}<p class="pcp-author">By <strong>${esc(author)}</strong></p><div class="pcp-badges"><span>${esc(category)}</span><span>${esc(pages)} pages</span><span>PDF</span></div><div class="pcp-price-row"><div><small>List price</small><strong>${price==='—'?'—':'₹'+esc(price)}</strong></div>${sale?`<div><small>Sale price</small><strong>₹${esc(sale)}</strong></div>`:''}</div></div></div><div class="pcp-info-grid"><section class="pcp-detail-card"><div class="pcp-detail-label">Description</div><p>${esc(description)}</p></section><section class="pcp-detail-card"><div class="pcp-detail-label">Tags</div><div class="pcp-tags">${ts.length?ts.map(t=>`<span class="pcp-tag">${esc(t)}</span>`).join(''):'<span class="pcp-muted">No tags added</span>'}</div></section></div><div class="pcp-check-note"><span>✓</span><div><strong>Check everything before continuing</strong><small>This preview shows the information entered in Steps 1–3. Nothing is published until Step 5.</small></div></div>`;
  }
  function bind(form){if(form.dataset.bookoraPreviewBound==='1')return;form.dataset.bookoraPreviewBound='1';form.addEventListener('input',render,{passive:true});form.addEventListener('change',render,{passive:true});}
  function start(){const form=$('publish-wizard-form');if(!form)return false;bind(form);render();return true}
  new MutationObserver(start).observe(document.body,{childList:true,subtree:true});start();
})();
