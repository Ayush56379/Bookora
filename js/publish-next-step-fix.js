/* Bookora Publish Wizard Navigation + complete preview fix v2 */
(() => {
  if (window.__BOOKORA_PUBLISH_WIZARD_NAV_V2__) return;
  window.__BOOKORA_PUBLISH_WIZARD_NAV_V2__ = true;
  const toast=(message,type='warning')=>{try{const fn=window.Toast?.show||window.BookoraToast?.show;if(typeof fn==='function')fn(message,type);else console.warn('[Bookora publish wizard]',message)}catch(_){console.warn('[Bookora publish wizard]',message)}};
  const value=id=>String(document.getElementById(id)?.value||'').trim();
  const file=id=>document.getElementById(id)?.files?.[0]||null;
  const number=id=>Number(document.getElementById(id)?.value||0);
  const esc=s=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
  let coverUrl=''; let previewFile=null;
  function currentStep(){for(let i=1;i<=5;i++){const el=document.getElementById(`step-${i}`);if(el&&getComputedStyle(el).display!=='none')return i}return 1}
  function go(step){const n=Math.max(1,Math.min(5,Number(step)||1));for(let i=1;i<=5;i++){const section=document.getElementById(`step-${i}`);if(section)section.style.display=i===n?'block':'none'}if(n===4)updatePreview();window.scrollTo({top:0,left:0,behavior:'smooth'});window.dispatchEvent(new CustomEvent('bookora:publish-step-changed',{detail:{step:n}}))}
  function validateStep(step){
    if(step===1){if(value('pub-title').length<3){toast('Please enter a valid eBook title.');return false}if(!value('pub-author')){toast('Please enter the author name.');return false}if(!value('pub-category')){toast('Please select a category.');return false}if(value('pub-description').length<20){toast('Description must contain at least 20 characters.');return false}}
    if(step===2){const pdf=file('pub-pdf'),cover=file('pub-cover');if(!pdf){toast('Please select your PDF eBook.');return false}if(!pdf.name.toLowerCase().endsWith('.pdf')&&pdf.type!=='application/pdf'){toast('Only PDF files are supported.');return false}if(pdf.size>100*1024*1024){toast('PDF must be 100 MB or smaller.');return false}if(!cover){toast('Please select the eBook cover image.');return false}if(cover.size>5*1024*1024){toast('Cover must be 5 MB or smaller.');return false}if(number('pub-pages')<1){toast('PDF page count is required.');return false}}
    if(step===3){const price=number('pub-price'),saleRaw=value('pub-saleprice'),sale=saleRaw===''?null:Number(saleRaw);if(!(price>0)){toast('Please enter a valid list price.');return false}if(sale!==null&&(!Number.isFinite(sale)||sale<0||sale>price)){toast('Please enter a valid sale price.');return false}}
    return true;
  }
  function updatePreview(){
    const step=document.getElementById('step-4');if(!step||getComputedStyle(step).display==='none')return;
    const f=file('pub-cover');if(f&&f!==previewFile){if(coverUrl)URL.revokeObjectURL(coverUrl);coverUrl=URL.createObjectURL(f);previewFile=f}
    let box=step.querySelector('.publish-complete-preview');
    if(!box){box=document.createElement('div');box.className='publish-complete-preview';const h=step.querySelector('h3');if(h)h.insertAdjacentElement('afterend',box);else step.prepend(box)}
    const title=value('pub-title')||'Untitled eBook',subtitle=value('pub-subtitle'),author=value('pub-author')||'—',category=value('pub-category')||'—',description=value('pub-description')||'—',tags=value('pub-tags').split(',').map(x=>x.trim()).filter(Boolean),pages=value('pub-pages')||'—';
    const price=Number(value('pub-price')),sale=value('pub-saleprice'),shown=sale!==''?Number(sale):price;
    box.innerHTML=`<div class="pcp-main"><div class="pcp-cover">${coverUrl?`<img src="${coverUrl}" alt="${esc(title)} cover">`:'<span>📚</span>'}</div><div class="pcp-content"><span class="pcp-eyebrow">BOOK PREVIEW</span><h4>${esc(title)}</h4>${subtitle?`<p class="pcp-subtitle">${esc(subtitle)}</p>`:''}<p class="pcp-author">By ${esc(author)}</p><div class="pcp-badges"><span>${esc(category)}</span><span>${esc(pages)} pages</span><span>PDF</span></div><div class="pcp-price"><strong>${Number.isFinite(shown)?`₹${shown.toFixed(2)}`:'—'}</strong>${sale!==''&&Number.isFinite(Number(sale))?`<span>List price ₹${Number.isFinite(price)?price.toFixed(2):'—'}</span>`:''}</div></div></div><div class="pcp-details"><section><b>Description</b><p>${esc(description)}</p></section><section><b>Tags</b><p>${tags.length?tags.map(t=>`<span class="pcp-tag">${esc(t)}</span>`).join(' '):'—'}</p></section></div>`;
  }
  function handleClick(event){const button=event.target?.closest?.('button[data-next],button[data-prev],button.next-step-btn');if(!button||!document.getElementById('publish-wizard-form'))return;const next=button.dataset.next,prev=button.dataset.prev;if(next==null&&prev==null)return;const from=currentStep(),target=next!=null?Number(next):Number(prev);if(!Number.isFinite(target))return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();if(target>from&&!validateStep(from))return;go(target)}
  document.addEventListener('click',handleClick,true);
  const observer=new MutationObserver(()=>{const form=document.getElementById('publish-wizard-form');if(!form)return;form.querySelectorAll('button[data-next],button[data-prev]').forEach(b=>{b.type='button';b.style.pointerEvents='auto'});if(currentStep()===4)updatePreview()});
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style']});
  document.addEventListener('input',()=>{if(currentStep()===4)updatePreview()});
  document.addEventListener('change',()=>{if(currentStep()===4)updatePreview()});
})();
