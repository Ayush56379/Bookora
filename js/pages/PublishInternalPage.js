import { state } from '../state.js';
import { apiFetch } from '../config.js';
import { updateSEO } from '../utils/seo.js';
import { formatPrice } from '../utils/formatters.js';
import { Toast } from '../components/Toast.js';

const MAX_PDF_SIZE = 100 * 1024 * 1024;
const MAX_COVER_SIZE = 5 * 1024 * 1024;
let selectedPDF = null;
let selectedCover = null;

const esc = v => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

function fileToBase64(file) {
  if (!file) return Promise.resolve('');
  return new Promise((resolve,reject)=>{
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || '').split(',')[1] || '');
    r.onerror = () => reject(new Error('Unable to read selected file.'));
    r.readAsDataURL(file);
  });
}

function validate1() {
  const title=document.getElementById('pub-title')?.value.trim()||'';
  const author=document.getElementById('pub-author')?.value.trim()||'';
  const category=document.getElementById('pub-category')?.value.trim()||'';
  const description=document.getElementById('pub-description')?.value.trim()||'';
  if(title.length<3){Toast.show('Please enter a valid eBook title.','warning');document.getElementById('pub-title')?.focus();return false;}
  if(!author){Toast.show('Please enter the author name.','warning');document.getElementById('pub-author')?.focus();return false;}
  if(!category){Toast.show('Please select a category.','warning');document.getElementById('pub-category')?.focus();return false;}
  if(description.length<20){Toast.show('Description must contain at least 20 characters.','warning');document.getElementById('pub-description')?.focus();return false;}
  return true;
}

function validate2(){
  if(!selectedPDF){Toast.show('Please select your PDF eBook.','warning');return false;}
  if(selectedPDF.size>MAX_PDF_SIZE){Toast.show('PDF must be 100 MB or smaller.','warning');return false;}
  if(!selectedPDF.name.toLowerCase().endsWith('.pdf') && selectedPDF.type!=='application/pdf'){Toast.show('Only PDF files are supported.','warning');return false;}
  if(selectedCover && selectedCover.size>MAX_COVER_SIZE){Toast.show('Cover must be 5 MB or smaller.','warning');return false;}
  const pages=Number(document.getElementById('pub-pages')?.value||0);
  if(!pages||pages<1){Toast.show('Please enter or detect the PDF page count.','warning');return false;}
  return true;
}

function validate3(){
  const price=Number(document.getElementById('pub-price')?.value||0);
  const sale=Number(document.getElementById('pub-saleprice')?.value||0);
  if(price<=0){Toast.show('Please enter a valid price.','warning');return false;}
  if(sale<0 || (sale>0 && sale>=price)){Toast.show('Sale price must be lower than the list price.','warning');return false;}
  return true;
}

async function detectPages(file){
  if(!window.pdfjsLib||!file)return null;
  try{return (await window.pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise).numPages||null;}
  catch(e){console.warn('PDF page detection failed',e);return null;}
}

function updateFiles(){
  const pn=document.getElementById('pdf-file-name'),ps=document.getElementById('pdf-status');
  const cn=document.getElementById('cover-file-name'),cs=document.getElementById('cover-status');
  if(pn)pn.textContent=selectedPDF?selectedPDF.name:'No PDF selected';
  if(ps)ps.textContent=selectedPDF?`${(selectedPDF.size/1048576).toFixed(2)} MB`:'Required';
  if(cn)cn.textContent=selectedCover?selectedCover.name:'No cover selected (optional)';
  if(cs)cs.textContent=selectedCover?`${(selectedCover.size/1048576).toFixed(2)} MB`:'Optional';
}

function preview(){
  const title=document.getElementById('pub-title')?.value.trim()||'Untitled eBook';
  const author=document.getElementById('pub-author')?.value.trim()||'Author';
  const pages=document.getElementById('pub-pages')?.value||'—';
  const price=Number(document.getElementById('pub-saleprice')?.value||document.getElementById('pub-price')?.value||0);
  const a=document.getElementById('preview-title'),b=document.getElementById('preview-author'),c=document.getElementById('preview-pages'),d=document.getElementById('preview-price');
  if(a)a.textContent=title;if(b)b.textContent=`by ${author}`;if(c)c.textContent=`Pages: ${pages}`;if(d)d.textContent=formatPrice(price);
  const box=document.getElementById('preview-cover-box');
  if(box&&selectedCover){if(box.dataset.url)URL.revokeObjectURL(box.dataset.url);const u=URL.createObjectURL(selectedCover);box.dataset.url=u;box.style.background=`url("${u}") center/cover no-repeat`;}
}

function showStep(step){
  step=Math.max(1,Math.min(5,Number(step)||1));
  document.querySelectorAll('.wizard-section').forEach(s=>{s.style.display=s.id===`step-${step}`?'block':'none';});
  document.querySelectorAll('.wizard-step-node').forEach(n=>{
    const num=Number(n.dataset.step),circle=n.querySelector('.step-num'),label=n.querySelector('.step-title');if(!circle||!label)return;
    const active=num===step,done=num<step;
    circle.style.background=active?'var(--accent)':done?'#ECFDF5':'#fff';circle.style.color=active?'#fff':done?'#059669':'var(--text-muted)';circle.style.borderColor=active?'var(--accent)':done?'#059669':'var(--border-medium)';label.style.color=active?'var(--accent)':done?'#059669':'var(--text-muted)';
  });
  window.scrollTo({top:0,behavior:'smooth'});
}

export function renderPublishInternalPage(){
  updateSEO({title:'Publish an eBook on Bookora',description:'Publish your digital eBook on Bookora.'});
  const categories=Array.isArray(state.categories)?state.categories:[];
  return `<div class="publish-page" style="background:var(--bg-secondary);min-height:85vh;padding:2rem 0 5rem"><div class="container" style="max-width:860px"><div style="text-align:center;margin-bottom:2rem"><div class="badge badge-bookora">Author Studio</div><h1>Publish Your eBook</h1><p style="color:var(--text-secondary)">Complete the steps below. Your book will be reviewed before publishing.</p></div>
  <div style="display:flex;gap:.35rem;justify-content:space-between;margin-bottom:2rem">${['Info','Files','Pricing','Preview','Submit'].map((x,i)=>`<div class="wizard-step-node" data-step="${i+1}" style="text-align:center;flex:1"><div class="step-num" style="width:36px;height:36px;border-radius:50%;background:${i===0?'var(--accent)':'#fff'};color:${i===0?'#fff':'var(--text-muted)'};border:2px solid ${i===0?'var(--accent)':'var(--border-medium)'};display:flex;align-items:center;justify-content:center;font-weight:700;margin:auto">${i+1}</div><span class="step-title" style="font-size:.72rem;font-weight:600">${i+1}. ${x}</span></div>`).join('')}</div>
  <div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:clamp(1rem,4vw,2.5rem);box-shadow:var(--shadow-sm)"><form id="publish-wizard-form">
  <section id="step-1" class="wizard-section"><h3>Step 1: Book Information</h3><label>eBook Title *</label><input id="pub-title" required placeholder="Enter your book title" style="width:100%;padding:.75rem;margin:.4rem 0 1rem"><label>Subtitle</label><input id="pub-subtitle" placeholder="Optional subtitle" style="width:100%;padding:.75rem;margin:.4rem 0 1rem"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem"><div><label>Author Name *</label><input id="pub-author" value="${esc(state.currentUser?.name||'')}" required style="width:100%;padding:.75rem;margin:.4rem 0 1rem"></div><div><label>Category *</label><select id="pub-category" required style="width:100%;padding:.75rem;margin:.4rem 0 1rem"><option value="">Select category</option>${categories.map(c=>`<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('')}</select></div></div><label>Description *</label><textarea id="pub-description" rows="5" minlength="20" required placeholder="Describe your eBook..." style="width:100%;padding:.75rem;margin:.4rem 0 1rem"></textarea><label>Tags</label><input id="pub-tags" placeholder="Productivity, Business, Finance" style="width:100%;padding:.75rem;margin:.4rem 0 1.5rem"><div style="text-align:right"><button type="button" class="btn btn-primary next-step-btn" data-next="2">Next: Files →</button></div></section>
  <section id="step-2" class="wizard-section" style="display:none"><h3>Step 2: Cover & Files</h3><div style="border:2px dashed var(--border-medium);border-radius:16px;padding:2rem;text-align:center;margin:1.5rem 0"><div style="font-size:38px">📄</div><h4>Upload eBook PDF</h4><p>PDF only · Maximum 100 MB</p><input id="pub-pdf" type="file" accept="application/pdf,.pdf" style="display:none"><label for="pub-pdf" class="btn btn-primary" style="cursor:pointer;display:inline-block">Choose PDF</label><div id="pdf-file-name" style="margin-top:12px;font-weight:700">No PDF selected</div><div id="pdf-status">Required</div></div><div style="border:2px dashed var(--border-medium);border-radius:16px;padding:2rem;text-align:center;margin-bottom:1.5rem"><div style="font-size:38px">🖼️</div><h4>Upload Cover</h4><p>JPG, PNG or WEBP · Maximum 5 MB · Optional</p><input id="pub-cover" type="file" accept="image/jpeg,image/png,image/webp" style="display:none"><label for="pub-cover" class="btn btn-primary" style="cursor:pointer;display:inline-block">Choose Cover</label><div id="cover-file-name" style="margin-top:12px;font-weight:700">No cover selected (optional)</div><div id="cover-status">Optional</div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.5rem"><div><label>Page Count *</label><input id="pub-pages" type="number" min="1" required placeholder="Automatically detected" style="width:100%;padding:.75rem"></div><div><label>Format</label><input id="pub-format" value="PDF" readonly style="width:100%;padding:.75rem"></div></div><div style="display:flex;justify-content:space-between;gap:1rem"><button type="button" class="btn btn-secondary prev-step-btn" data-prev="1">← Back</button><button type="button" class="btn btn-primary next-step-btn" data-next="3">Next: Pricing →</button></div></section>
  <section id="step-3" class="wizard-section" style="display:none"><h3>Step 3: Pricing</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin:1.5rem 0"><div><label>List Price *</label><input id="pub-price" type="number" min="1" step=".01" required style="width:100%;padding:.75rem"></div><div><label>Sale Price</label><input id="pub-saleprice" type="number" min="0" step=".01" style="width:100%;padding:.75rem"></div></div><div style="padding:1.25rem;background:var(--accent-light);border-radius:14px;margin-bottom:1.5rem"><strong id="pub-royalty-label">Estimated Author Royalty: 85%</strong><div id="pub-royalty-calc" style="font-size:1.3rem;font-weight:800;margin-top:8px">₹0.00 per sale</div></div><div style="display:flex;justify-content:space-between;gap:1rem"><button type="button" class="btn btn-secondary prev-step-btn" data-prev="2">← Back</button><button type="button" class="btn btn-primary next-step-btn" data-next="4">Next: Preview →</button></div></section>
  <section id="step-4" class="wizard-section" style="display:none"><h3>Step 4: Preview</h3><div style="background:var(--bg-secondary);border-radius:16px;padding:1.5rem;margin:1.5rem 0;display:flex;gap:1.5rem;align-items:center"><div id="preview-cover-box" style="width:110px;height:150px;border-radius:10px;background:linear-gradient(135deg,#1E3A8A,#3B82F6);flex-shrink:0"></div><div><h3 id="preview-title">Your Book</h3><div id="preview-author">Author</div><div id="preview-pages">Pages: —</div><div id="preview-price" style="color:var(--accent);font-size:1.3rem;font-weight:800;margin-top:10px">₹0.00</div></div></div><div style="display:flex;justify-content:space-between;gap:1rem"><button type="button" class="btn btn-secondary prev-step-btn" data-prev="3">← Back</button><button type="button" class="btn btn-primary next-step-btn" data-next="5">Continue →</button></div></section>
  <section id="step-5" class="wizard-section" style="display:none"><h3>Step 5: Submit</h3><div style="padding:1.5rem;background:#eff6ff;border-radius:14px;margin:1.5rem 0;line-height:1.7">The PDF and optional cover will be uploaded to Google Drive. A pending book record will then be created for admin review.</div><div style="display:flex;justify-content:space-between;gap:1rem"><button type="button" class="btn btn-secondary prev-step-btn" data-prev="4">← Back</button><button type="submit" id="submit-pub-btn" class="btn btn-primary btn-lg">Upload & Submit 🚀</button></div></section>
  </form></div></div></div>`;
}

export function initPublishInternalEvents(){
  const form=document.getElementById('publish-wizard-form');if(!form)return;
  selectedPDF=null;selectedCover=null;
  const pdf=document.getElementById('pub-pdf');
  pdf?.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;if(!f.name.toLowerCase().endsWith('.pdf')&&f.type!=='application/pdf'){Toast.show('Please select a PDF file.','warning');e.target.value='';return;}if(f.size>MAX_PDF_SIZE){Toast.show('PDF must be 100 MB or smaller.','warning');e.target.value='';return;}selectedPDF=f;updateFiles();const pages=await detectPages(f);if(pages)document.getElementById('pub-pages').value=pages;});
  document.getElementById('pub-cover')?.addEventListener('change',e=>{const f=e.target.files?.[0];if(!f)return;if(!['image/jpeg','image/png','image/webp'].includes(f.type)){Toast.show('Please select JPG, PNG or WEBP cover.','warning');e.target.value='';return;}if(f.size>MAX_COVER_SIZE){Toast.show('Cover must be 5 MB or smaller.','warning');e.target.value='';return;}selectedCover=f;updateFiles();});
  form.addEventListener('click',e=>{const n=e.target.closest('.next-step-btn'),p=e.target.closest('.prev-step-btn');if(n){e.preventDefault();const step=Number(n.dataset.next);if(step===2&&!validate1())return;if(step===3&&!validate2())return;if(step===4&&!validate3())return;if(step===5)preview();showStep(step);}else if(p){e.preventDefault();showStep(Number(p.dataset.prev));}});
  const royalty=()=>{const price=Number(document.getElementById('pub-saleprice')?.value||document.getElementById('pub-price')?.value||0);const pct=Number(window.BOOKORA_MARKETPLACE?.sellerCommissionPct??85);const out=document.getElementById('pub-royalty-calc'),label=document.getElementById('pub-royalty-label');if(out)out.textContent=`${formatPrice(price*pct/100)} per sale`;if(label)label.textContent=`Estimated Author Royalty: ${pct}%`;};
  document.getElementById('pub-price')?.addEventListener('input',royalty);document.getElementById('pub-saleprice')?.addEventListener('input',royalty);
  form.addEventListener('submit',async e=>{e.preventDefault();if(!validate1()){showStep(1);return;}if(!validate2()){showStep(2);return;}if(!validate3()){showStep(3);return;}if(!state.isAuthenticated){Toast.show('Please sign in before publishing.','error');return;}if(!state.isSeller&&!state.isAdmin){Toast.show('Seller approval is required before publishing.','warning');return;}const btn=document.getElementById('submit-pub-btn');btn.disabled=true;try{btn.textContent='Preparing PDF...';const pdfData=await fileToBase64(selectedPDF);const coverData=await fileToBase64(selectedCover);btn.textContent='Uploading to Google Drive...';const upload=await apiFetch('/api/books/upload-files',{method:'POST',headers:{Authorization:`Bearer ${state.token}`},body:JSON.stringify({action:'uploadBookFiles',pdf:{name:selectedPDF.name,mimeType:'application/pdf',data:pdfData},...(selectedCover?{cover:{name:selectedCover.name,mimeType:selectedCover.type,data:coverData}}:{})})});const ud=await upload.json().catch(()=>({}));if(!upload.ok||!ud.success)throw new Error(ud.error||'File upload failed.');btn.textContent='Creating book listing...';const create=await apiFetch('/api/books/create',{method:'POST',headers:{Authorization:`Bearer ${state.token}`},body:JSON.stringify({action:'createBook',title:document.getElementById('pub-title').value.trim(),subtitle:document.getElementById('pub-subtitle').value.trim(),author:document.getElementById('pub-author').value.trim(),category:document.getElementById('pub-category').value,description:document.getElementById('pub-description').value.trim(),tags:document.getElementById('pub-tags').value.split(',').map(x=>x.trim()).filter(Boolean),pages:Number(document.getElementById('pub-pages').value),format:'PDF',price:Number(document.getElementById('pub-price').value),sale_price:Number(document.getElementById('pub-saleprice').value||0)||null,cover_url:ud.cover_url||'',pdf_url:ud.pdf_url||'',cover_file_id:ud.cover_file_id||'',pdf_file_id:ud.pdf_file_id||'',status:'pending'})});const cd=await create.json().catch(()=>({}));if(!create.ok||!cd.success)throw new Error(cd.error||'Book creation failed.');Toast.show('eBook submitted successfully for admin review!','success');selectedPDF=null;selectedCover=null;setTimeout(()=>{window.location.hash='#/creator/dashboard';},700);}catch(err){console.error(err);Toast.show(err.message||'Unable to publish eBook.','error');btn.disabled=false;btn.textContent='Upload & Submit 🚀';}});
  updateFiles();royalty();showStep(1);
}
