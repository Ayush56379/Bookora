/* Bookora Publish — complete Step 4 preview (lightweight, no network calls). */
(()=>{
  let coverUrl='';
  const $=id=>document.getElementById(id);
  const val=(id,empty='—')=>{const e=$(id);const v=e?.value?.trim();return v||empty};
  const money=(id)=>{const v=Number($(id)?.value);return Number.isFinite(v)?`₹${v.toFixed(2)}`:'—'};
  const refresh=()=>{
    const step=$('step-4'); if(!step || getComputedStyle(step).display==='none') return;
    const file=$('pub-cover')?.files?.[0];
    if(file && file!==window.__BOOKORA_PREVIEW_FILE__){
      if(coverUrl)URL.revokeObjectURL(coverUrl);
      coverUrl=URL.createObjectURL(file); window.__BOOKORA_PREVIEW_FILE__=file;
    }
    let box=step.querySelector('.publish-complete-preview');
    if(!box){
      box=document.createElement('div');box.className='publish-complete-preview';
      const heading=step.querySelector('h3');
      if(heading) heading.insertAdjacentElement('afterend',box); else step.prepend(box);
    }
    const tags=val('pub-tags','').split(',').map(x=>x.trim()).filter(Boolean);
    const title=val('pub-title','Untitled eBook'),subtitle=val('pub-subtitle',''),author=val('pub-author','—'),category=val('pub-category','—'),desc=val('pub-description','—'),pages=val('pub-pages','—');
    const price=money('pub-price'),sale=val('pub-saleprice','');
    box.innerHTML=`<div class="pcp-main"><div class="pcp-cover">${coverUrl?`<img src="${coverUrl}" alt="Book cover preview">`:'<span>📚</span>'}</div><div class="pcp-content"><div class="pcp-eyebrow">BOOK PREVIEW</div><h4>${escapeHtml(title)}</h4>${subtitle?`<p class="pcp-subtitle">${escapeHtml(subtitle)}</p>`:''}<p class="pcp-author">By ${escapeHtml(author)}</p><div class="pcp-badges"><span>${escapeHtml(category)}</span><span>${escapeHtml(pages)} pages</span><span>PDF</span></div><div class="pcp-price"><strong>${price}</strong>${sale?`<span>Sale price: ${escapeHtml(sale)}</span>`:''}</div></div></div><div class="pcp-details"><div><b>Description</b><p>${escapeHtml(desc)}</p></div><div><b>Tags</b><p>${tags.length?tags.map(t=>`<span class="pcp-tag">${escapeHtml(t)}</span>`).join(' '):'—'}</p></div></div>`;
  };
  const escapeHtml=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const watch=()=>{refresh();const form=$('publish-wizard-form');if(!form)return;new MutationObserver(refresh).observe(form,{subtree:true,attributes:true,attributeFilter:['style']});form.addEventListener('input',refresh);form.addEventListener('change',refresh)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch,{once:true});else watch();
})();
