import { state } from '../state.js';
import { Toast } from '../components/Toast.js';

const API = window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com';
const MAX_PDF_MB = 100;
const MAX_COVER_MB = 5;
const UPLOAD_TIMEOUT_MS = 15 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 120000;
let selectedPDF = null;
let selectedCover = null;
let initialized = false;
let configLoaded = false;

const $ = id => document.getElementById(id);
const val = (id, fallback = '') => String($(id)?.value || '').trim() || fallback;
const num = (id, fallback = 0) => { const n = Number($(id)?.value); return Number.isFinite(n) ? n : fallback; };
const esc = v => String(v ?? '').replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
const auth = () => window.firebase?.auth?.() || null;

function toast(message, type='warning') { try { Toast.show(message, type); } catch (_) { console.warn(message); } }

async function firebaseUser(timeout=15000) {
  const a = auth();
  if (!a) throw new Error('Please sign in again to publish your eBook.');
  if (a.currentUser) return a.currentUser;
  return new Promise((resolve, reject) => {
    let done = false, unsub = null;
    const finish = u => { if (done) return; done = true; try { unsub?.(); } catch (_) {} u ? resolve(u) : reject(new Error('Please sign in again to publish your eBook.')); };
    try { unsub = a.onAuthStateChanged(finish); } catch (_) { finish(null); return; }
    setTimeout(() => finish(a.currentUser || null), timeout);
  });
}

async function token(refresh=false) {
  const u = await firebaseUser();
  const t = await u.getIdToken(refresh);
  if (!t) throw new Error('Please sign in again to publish your eBook.');
  return { u, t };
}

async function request(path, options={}, retry=true) {
  const { t } = await token(false);
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${t}`);
  headers.set('Accept', 'application/json');
  if (options.body !== undefined && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    let r = await fetch(`${API}${path}`, { ...options, headers, signal: controller.signal, cache:'no-store' });
    let data = {}; try { data = await r.json(); } catch (_) {}
    if (r.status === 401 && retry) {
      const refreshed = await token(true);
      const h = new Headers(options.headers || {});
      h.set('Authorization', `Bearer ${refreshed.t}`); h.set('Accept','application/json');
      if (options.body !== undefined && !h.has('Content-Type')) h.set('Content-Type','application/json');
      r = await fetch(`${API}${path}`, { ...options, headers:h, cache:'no-store' });
      data = {}; try { data = await r.json(); } catch (_) {}
    }
    if (!r.ok || data.success === false) {
      const e = new Error(data.error || `Request failed (${r.status}).`); e.status = r.status; throw e;
    }
    return data;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('The publishing service took too long to respond. Please retry.');
    throw e;
  } finally { clearTimeout(timer); }
}

function validateStep1() {
  if (val('pub-title').length < 3) { toast('Please enter a valid eBook title.'); return false; }
  if (!val('pub-author')) { toast('Please enter the author name.'); return false; }
  if (!val('pub-category')) { toast('Please select a category.'); return false; }
  if (val('pub-description').length < 20) { toast('Description must contain at least 20 characters.'); return false; }
  return true;
}

function validateStep2() {
  if (!selectedPDF) { toast('Please select your PDF eBook.'); return false; }
  if (selectedPDF.type !== 'application/pdf' && !selectedPDF.name.toLowerCase().endsWith('.pdf')) { toast('Only PDF files are supported.'); return false; }
  if (selectedPDF.size > MAX_PDF_MB * 1024 * 1024) { toast(`PDF must be ${MAX_PDF_MB} MB or smaller.`); return false; }
  if (!selectedCover) { toast('Please select the eBook cover image.'); return false; }
  if (selectedCover.size > MAX_COVER_MB * 1024 * 1024) { toast(`Cover must be ${MAX_COVER_MB} MB or smaller.`); return false; }
  if (num('pub-pages') < 1) { toast('PDF page count is required.'); return false; }
  return true;
}

function validateStep3() {
  const price = num('pub-price');
  const raw = val('pub-saleprice');
  const sale = raw === '' ? null : Number(raw);
  if (!(price > 0) || !Number.isFinite(price)) { toast('Please enter a valid list price.'); return false; }
  if (sale !== null && (!Number.isFinite(sale) || sale < 0 || sale > price)) { toast('Sale price must be between ₹0 and the list price.'); return false; }
  return true;
}

function setStep(n) {
  const target = Math.max(1, Math.min(5, Number(n) || 1));
  for (let i=1;i<=5;i++) {
    const s = $(`step-${i}`); if (!s) continue;
    const active = i === target;
    s.hidden = !active;
    s.setAttribute('aria-hidden', active ? 'false' : 'true');
    s.style.setProperty('display', active ? 'block' : 'none', 'important');
  }
  const active = $(`step-${target}`);
  if (active) active.scrollIntoView({behavior:'auto', block:'start'});
  if (target === 4) renderPreview();
  if (target === 5) renderSubmitReview();
  window.dispatchEvent(new CustomEvent('bookora:publish-step-changed',{detail:{step:target}}));
}

function fileUI() {
  const p = $('pdf-file-name'), ps = $('pdf-status'), c = $('cover-file-name'), cs = $('cover-status');
  if (p) p.textContent = selectedPDF ? selectedPDF.name : 'No PDF selected';
  if (ps) { ps.textContent = selectedPDF ? `${(selectedPDF.size/1048576).toFixed(2)} MB · Ready` : 'Required'; ps.className = selectedPDF ? 'upload-status ok' : 'upload-status'; }
  if (c) c.textContent = selectedCover ? selectedCover.name : 'No cover selected';
  if (cs) { cs.textContent = selectedCover ? `${(selectedCover.size/1048576).toFixed(2)} MB · Ready` : 'Required'; cs.className = selectedCover ? 'upload-status ok' : 'upload-status'; }
  $('pdf-selected-card')?.classList.toggle('ready', !!selectedPDF); $('cover-selected-card')?.classList.toggle('ready', !!selectedCover);
}

async function detectPages() {
  if (!selectedPDF) { toast('Select the PDF first.'); return; }
  const b = $('detect-pages-btn'); if (b) { b.disabled=true; b.textContent='Detecting…'; }
  try {
    if (!window.pdfjsLib) {
      const s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      await new Promise((resolve,reject)=>{s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
      window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    const url=URL.createObjectURL(selectedPDF);
    try { const pdf=await window.pdfjsLib.getDocument({url}).promise; $('pub-pages').value=String(pdf.numPages); toast(`${pdf.numPages} PDF pages detected.`,'success'); }
    finally { URL.revokeObjectURL(url); }
  } catch (_) { toast('Automatic page detection failed. Enter the page count manually.'); }
  finally { if(b){b.disabled=false;b.textContent='Detect Pages';} }
}

function renderPreview() {
  const title=val('pub-title','Untitled eBook'), subtitle=val('pub-subtitle'), author=val('pub-author','—'), category=val('pub-category','—');
  const description=val('pub-description','—'), tags=val('pub-tags'), pages=val('pub-pages','—'), price=val('pub-price','0'), sale=val('pub-saleprice');
  const titleEl=$('v2-preview-title'), subtitleEl=$('v2-preview-subtitle'), authorEl=$('v2-preview-author'), catEl=$('v2-preview-category'), descEl=$('v2-preview-description'), pagesEl=$('v2-preview-pages'), priceEl=$('v2-preview-price'), saleEl=$('v2-preview-sale'), cover=$('v2-preview-cover');
  if(titleEl) titleEl.textContent=title; if(subtitleEl){subtitleEl.textContent=subtitle;subtitleEl.hidden=!subtitle;} if(authorEl)authorEl.textContent=`By ${author}`; if(catEl)catEl.textContent=category; if(descEl)descEl.textContent=description; if(pagesEl)pagesEl.textContent=`${pages} pages`; if(priceEl)priceEl.textContent=`₹${Number(price||0).toFixed(2)}`; if(saleEl){saleEl.textContent=sale?`Sale ₹${Number(sale).toFixed(2)}`:'';saleEl.hidden=!sale;}
  if(cover){
    if(selectedCover){const url=URL.createObjectURL(selectedCover);cover.src=url;cover.onload=()=>URL.revokeObjectURL(url);cover.hidden=false;$('v2-preview-cover-empty')?.setAttribute('hidden','');}
    else {cover.removeAttribute('src');cover.hidden=true;$('v2-preview-cover-empty')?.removeAttribute('hidden');}
  }
  const full=$('v2-preview-tags'); if(full) full.textContent=tags || '—';
}

function renderSubmitReview() {
  renderPreview();
  const title=val('pub-title','Untitled eBook');
  const p=$('submit-review-title'); if(p)p.textContent=title;
  const status=$('publish-status-text'); if(status)status.textContent='Ready to upload PDF → cover → create review record → sync Firebase → send confirmation email.';
}

function setPublishProgress(step, text, percent) {
  const label=$('publish-progress-label'), pct=$('publish-progress-percent'), fill=$('publish-progress-fill');
  if(label)label.textContent=text; if(pct)pct.textContent=`${percent}%`; if(fill)fill.style.width=`${percent}%`;
  document.querySelectorAll('.publish-stage').forEach(x=>x.classList.remove('active','done'));
  const active=$(`publish-stage-${step}`); if(active)active.classList.add('active');
  for(let i=1;i<step;i++) $(`publish-stage-${i}`)?.classList.add('done');
}

async function uploadFile(file, kind) {
  const session=await request('/api/books/upload-direct-session/start',{method:'POST',body:JSON.stringify({name:file.name,mimeType:kind==='pdf'?'application/pdf':file.type,size:file.size,kind})});
  if(!session.upload_url) throw new Error('Secure upload session could not be created.');
  const { t } = await token(false);
  const c=new AbortController(), timer=setTimeout(()=>c.abort(),UPLOAD_TIMEOUT_MS);
  try {
    const r=await fetch(session.upload_url,{method:'PUT',headers:{Authorization:`Bearer ${t}`,'Content-Type':kind==='pdf'?'application/pdf':file.type},body:file,signal:c.signal,cache:'no-store'});
    if(!r.ok){let message='Upload failed. Please retry.';try{const d=await r.clone().json();message=d?.error||message;}catch(_){}throw new Error(message);}
  } catch(e) { if(e.name==='AbortError')throw new Error('The upload took too long. Please retry.'); throw e; }
  finally { clearTimeout(timer); }
  const id=session.file_id||session.fileId||session.id;
  if(!id) throw new Error('Upload could not be finalized.');
  const done=await request('/api/books/upload-direct-session/finalize',{method:'POST',body:JSON.stringify({file_id:id})});
  if(!done?.file?.id) throw new Error('Upload could not be finalized.');
  return done.file;
}

async function mirrorFirestore(book,input,pdf,cover,user) {
  const db=window.firebase?.firestore?.(); if(!db||!book?.id)return false;
  const id=String(book.id), now=new Date().toISOString();
  const coverUrl=cover.url||cover.webViewLink||cover.downloadUrl||'', pdfUrl=pdf.url||pdf.webViewLink||pdf.downloadUrl||'';
  await db.collection('books').doc(id).set({id,bookId:id,title:input.title,subtitle:input.subtitle,author:input.author,description:input.description,category:input.category,tags:input.tags,pages:input.pages,format:'PDF',price:input.price,salePrice:input.sale_price,sale_price:input.sale_price,coverUrl,cover_url:coverUrl,coverFileId:cover.id,cover_file_id:cover.id,pdfUrl,pdf_url:pdfUrl,pdfFileId:pdf.id,pdf_file_id:pdf.id,creatorId:book.creator_id,creator_id:book.creator_id,sellerId:book.seller_id||book.creator_id,seller_id:book.seller_id||book.creator_id,creatorUid:user.uid,firebaseUid:user.uid,status:'pending',reviewStatus:'pending',review_status:'pending',isNew:true,is_new:true,createdAt:book.created_at||now,created_at:book.created_at||now,updatedAt:now,updated_at:now,backendBookId:id,backendSynced:true,metadataSource:'firestore',driveStorage:'files-only'},{merge:true});
  return true;
}

async function publish() {
  const b=$('submit-pub-btn');
  if(!validateStep1()){setStep(1);return;} if(!validateStep2()){setStep(2);return;} if(!validateStep3()){setStep(3);return;}
  if(!state.isAuthenticated||(!state.isSeller&&!state.isAdmin)){toast('Please sign in with an approved seller account to publish.','error');return;}
  if(!b||b.disabled)return;
  b.disabled=true;b.setAttribute('aria-busy','true');b.textContent='Uploading…';
  const success=$('publish-success'), failure=$('publish-failure'); success?.setAttribute('hidden',''); failure?.setAttribute('hidden','');
  try {
    const {u}=await token(false);
    setPublishProgress(1,'Uploading PDF (1/4)…',8);
    const pdf=await uploadFile(selectedPDF,'pdf');
    setPublishProgress(1,'PDF uploaded successfully ✓',35);
    setPublishProgress(2,'Uploading cover (2/4)…',42);
    const cover=await uploadFile(selectedCover,'cover');
    setPublishProgress(2,'Cover uploaded successfully ✓',62);
    setPublishProgress(3,'Creating review record and syncing Firebase…',70);
    const input={title:val('pub-title'),subtitle:val('pub-subtitle'),author:val('pub-author'),category:val('pub-category'),description:val('pub-description'),tags:val('pub-tags').split(',').map(x=>x.trim()).filter(Boolean),pages:num('pub-pages'),price:num('pub-price'),sale_price:(()=>{const x=val('pub-saleprice');return x===''?null:Number(x)})()};
    const key=`publish-${crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
    const r=await request('/api/books/create',{method:'POST',headers:{'X-Idempotency-Key':key},body:JSON.stringify({...input,format:'PDF',cover_url:cover.url||cover.webViewLink||cover.downloadUrl||'',pdf_url:pdf.url||pdf.webViewLink||pdf.downloadUrl||'',cover_file_id:cover.id,pdf_file_id:pdf.id,status:'pending',idempotency_key:key,publish_idempotency_key:key,user_id:u.uid,uid:u.uid,email:u.email||state.currentUser?.email||'',creator_uid:u.uid})});
    if(!r?.book?.id) throw new Error('The review record was not created. Please retry.');
    let firebaseOk=false; try { firebaseOk=await mirrorFirestore(r.book,input,pdf,cover,u); } catch(e) { console.warn('[Bookora publish] Firebase mirror warning:',e); }
    setPublishProgress(3,firebaseOk?'Review record + Firebase synced ✓':'Review record created ✓',88);
    setPublishProgress(4,'Upload complete — submitted for admin review ✓',100);
    b.textContent='Upload Successful ✓';
    success?.removeAttribute('hidden');
    $('publish-success-title')?.replaceChildren(document.createTextNode(input.title));
    $('publish-success-detail')?.replaceChildren(document.createTextNode(firebaseOk?'Your eBook is now in the admin review queue and synced to Firebase.':'Your eBook is in the admin review queue. Firebase sync will reconcile automatically.'));
    toast('eBook uploaded successfully and submitted for admin review.','success');
    setTimeout(()=>{window.location.hash='#/creator/dashboard';},1800);
  } catch(e) {
    console.error('[Bookora publish]',e);
    b.disabled=false;b.removeAttribute('aria-busy');b.textContent='Upload failed — Retry';
    $('publish-failure-message')?.replaceChildren(document.createTextNode(e.message||'Your eBook could not be uploaded. Please retry.'));
    failure?.removeAttribute('hidden');
    toast(e.message||'Your eBook could not be uploaded. Please retry.','error');
  }
}

function bind(form) {
  if(initialized)return; initialized=true;
  $('pub-pdf')?.addEventListener('change',e=>{selectedPDF=e.target.files?.[0]||null;fileUI();});
  $('pub-cover')?.addEventListener('change',e=>{selectedCover=e.target.files?.[0]||null;fileUI();});
  $('detect-pages-btn')?.addEventListener('click',detectPages);
  form.querySelectorAll('.v2-next').forEach(b=>b.addEventListener('click',()=>{const n=Number(b.dataset.next);if(n===2&&!validateStep1())return;if(n===3&&!validateStep2())return;if(n===4&&!validateStep3())return;setStep(n);}));
  form.querySelectorAll('.v2-prev').forEach(b=>b.addEventListener('click',()=>setStep(Number(b.dataset.prev))));
  form.addEventListener('input',()=>{if(Number(form.dataset.step)==4||getComputedStyle($('step-4')).display!=='none')renderPreview();});
  form.addEventListener('submit',e=>{e.preventDefault();publish();});
  $('submit-pub-btn')?.addEventListener('click',e=>{e.preventDefault();publish();});
  setStep(1);
}

export function renderPublishInternalPage() {
  selectedPDF=null; selectedCover=null; initialized=false;
  return `<div class="publish-v2-shell"><div class="publish-v2-card"><div class="publish-v2-hero"><div><div class="publish-kicker">SELLER CENTER · PUBLISH eBOOK</div><h1>Publish your eBook</h1><p>Upload your manuscript, add a cover and pricing, review every detail, then submit it securely for admin approval.</p></div><div class="publish-secure-badge">🔒 Secure publishing</div></div><div class="publish-steps-top"><div class="top-step active"><b>1</b><span>Book Information</span></div><div class="top-step"><b>2</b><span>Files</span></div><div class="top-step"><b>3</b><span>Pricing</span></div><div class="top-step"><b>4</b><span>Preview</span></div><div class="top-step"><b>5</b><span>Submit</span></div></div><form id="publish-wizard-form" novalidate>
<section id="step-1" class="publish-v2-section"><div class="section-heading"><span class="section-icon">1</span><div><h2>Book Information</h2><p>Tell readers and the review team what your eBook is about.</p></div></div><div class="field-grid"><div class="field full"><label for="pub-title">eBook Title <i>*</i></label><input id="pub-title" required minlength="3" placeholder="Enter your eBook title"></div><div class="field"><label for="pub-subtitle">Subtitle</label><input id="pub-subtitle" placeholder="Optional subtitle"></div><div class="field"><label for="pub-author">Author Name <i>*</i></label><input id="pub-author" required></div><div class="field"><label for="pub-category">Category <i>*</i></label><select id="pub-category" required><option value="">Select category</option><option>Business</option><option>Education</option><option>Finance</option><option>Productivity</option><option>Technology</option><option>Self Development</option><option>Fiction</option><option>Other</option></select></div><div class="field full"><label for="pub-description">Description <i>*</i></label><textarea id="pub-description" rows="6" minlength="20" placeholder="Describe the eBook, what readers will learn, and why it is useful."></textarea><small>Minimum 20 characters.</small></div><div class="field full"><label for="pub-tags">Tags</label><input id="pub-tags" placeholder="Productivity, Business, Finance"></div></div><div class="v2-actions end"><button type="button" class="btn btn-primary v2-next" data-next="2">Continue to Files <span>→</span></button></div></section>
<section id="step-2" class="publish-v2-section" hidden><div class="section-heading"><span class="section-icon">2</span><div><h2>Cover & Files</h2><p>PDF first, then cover. Your PDF can be up to 100 MB.</p></div></div><div class="upload-order-note"><b>Upload order</b><span>01 PDF manuscript</span><span>02 Cover image</span><span>03 Page count</span></div><div class="upload-grid"><div id="pdf-selected-card" class="upload-card"><div class="upload-card-icon">📄</div><div class="upload-card-main"><h3>eBook PDF</h3><p>PDF only · maximum 100 MB</p><div id="pdf-file-name" class="file-name">No PDF selected</div><div id="pdf-status" class="upload-status">Required</div></div><input id="pub-pdf" type="file" accept="application/pdf,.pdf" hidden><label for="pub-pdf" class="btn btn-primary upload-btn">Choose PDF</label></div><div id="cover-selected-card" class="upload-card"><div class="upload-card-icon">🖼️</div><div class="upload-card-main"><h3>Cover image</h3><p>JPG, PNG or WEBP · maximum 5 MB</p><div id="cover-file-name" class="file-name">No cover selected</div><div id="cover-status" class="upload-status">Required</div></div><input id="pub-cover" type="file" accept="image/jpeg,image/png,image/webp" hidden><label for="pub-cover" class="btn btn-primary upload-btn">Choose Cover</label></div></div><div class="page-count-row"><div class="field"><label for="pub-pages">PDF Page Count <i>*</i></label><input id="pub-pages" type="number" min="1" placeholder="Enter page count or detect automatically"></div><button type="button" id="detect-pages-btn" class="btn btn-secondary">Detect Pages</button></div><div class="file-policy"><span>✓</span><div><b>Secure upload</b><p>The PDF is sent through the secure upload gateway. The browser does not store the manuscript in GitHub.</p></div></div><div class="v2-actions"><button type="button" class="btn btn-secondary v2-prev" data-prev="1">← Back</button><button type="button" class="btn btn-primary v2-next" data-next="3">Continue to Pricing →</button></div></section>
<section id="step-3" class="publish-v2-section" hidden><div class="section-heading"><span class="section-icon">3</span><div><h2>Pricing</h2><p>Set the list price and an optional sale price.</p></div></div><div class="price-card"><div class="field"><label for="pub-price">List Price <i>*</i></label><div class="money-input"><span>₹</span><input id="pub-price" type="number" min="1" step=".01" placeholder="499"></div></div><div class="field"><label for="pub-saleprice">Sale Price</label><div class="money-input"><span>₹</span><input id="pub-saleprice" type="number" min="0" step=".01" placeholder="Optional"></div></div></div><div class="pricing-note"><b>Seller pricing</b><p>The list price is shown to buyers. If a sale price is entered, it cannot be higher than the list price.</p></div><div class="v2-actions"><button type="button" class="btn btn-secondary v2-prev" data-prev="2">← Back</button><button type="button" class="btn btn-primary v2-next" data-next="4">Review eBook →</button></div></section>
<section id="step-4" class="publish-v2-section" hidden><div class="section-heading"><span class="section-icon">4</span><div><h2>Preview</h2><p>This is the information that will be submitted for admin review.</p></div></div><div class="preview-book-card"><div class="preview-cover"><img id="v2-preview-cover" alt="eBook cover preview" hidden><div id="v2-preview-cover-empty">📕<small>Cover preview</small></div></div><div class="preview-book-main"><span id="v2-preview-category" class="preview-pill">Category</span><h3 id="v2-preview-title">Untitled eBook</h3><p id="v2-preview-subtitle" hidden></p><div id="v2-preview-author" class="preview-author">By —</div><div class="preview-meta"><span id="v2-preview-pages">— pages</span><span>PDF</span><span id="v2-preview-sale" hidden></span></div><div class="preview-price" id="v2-preview-price">₹0.00</div></div></div><div class="preview-details"><div><h4>Description</h4><p id="v2-preview-description">—</p><div class="preview-tags-row"><h4>Tags</h4><p id="v2-preview-tags">—</p></div></div><div><h4>What happens next?</h4><ul><li>PDF is uploaded securely.</li><li>Cover is uploaded securely.</li><li>Book record is created with <b>pending</b> review status.</li><li>Firebase receives the complete book metadata.</li><li>You receive a confirmation email after submission.</li></ul></div></div><div class="v2-actions"><button type="button" class="btn btn-secondary v2-prev" data-prev="3">← Back</button><button type="button" class="btn btn-primary v2-next" data-next="5">Continue to Submit →</button></div></section>
<section id="step-5" class="publish-v2-section" hidden><div class="section-heading"><span class="section-icon">5</span><div><h2>Submit for Admin Review</h2><p>Final submission will upload the files and create the review record.</p></div></div><div class="submit-summary"><div><span>eBook</span><b id="submit-review-title">Your eBook</b></div><div><span>Upload limit</span><b>100 MB PDF</b></div><div><span>Status after upload</span><b>Pending Admin Review</b></div></div><div class="publish-progress"><div class="publish-progress-head"><b id="publish-progress-label">Ready to upload</b><b id="publish-progress-percent">0%</b></div><div class="publish-progress-track"><div id="publish-progress-fill"></div></div><div class="publish-stage-list"><div id="publish-stage-1" class="publish-stage">01 · PDF upload</div><div id="publish-stage-2" class="publish-stage">02 · Cover upload</div><div id="publish-stage-3" class="publish-stage">03 · Firebase + review record</div><div id="publish-stage-4" class="publish-stage">04 · Successful submission</div></div></div><div id="publish-success" class="publish-result success" hidden><div class="result-icon">✓</div><div><h3>eBook uploaded successfully</h3><p><b id="publish-success-title"></b> has been submitted for admin review.</p><small id="publish-success-detail">Your book is now pending review.</small></div></div><div id="publish-failure" class="publish-result failure" hidden><div class="result-icon">!</div><div><h3>Upload needs attention</h3><p id="publish-failure-message">Please retry.</p></div></div><p id="publish-status-text" class="submit-status">Ready to upload PDF → cover → create review record → sync Firebase → send confirmation email.</p><div class="v2-actions"><button type="button" class="btn btn-secondary v2-prev" data-prev="4">← Back</button><button id="submit-pub-btn" type="submit" class="btn btn-primary">Upload & Submit for Review</button></div></section>
</form></div></div>`;
}

export async function initPublishInternalEvents() {
  const form=$('publish-wizard-form'); if(!form)return; bind(form); renderPreview();
  if(!configLoaded){configLoaded=true; try { const r=await fetch(`${API}/api/settings/public`,{headers:{Accept:'application/json'},cache:'no-store'}); if(r.ok){const d=await r.json();const limit=Number(d?.books_config?.max_pdf_size_mb);if(Number.isFinite(limit)&&limit>0&&limit<MAX_PDF_MB){document.querySelectorAll('.upload-card p').forEach(t=>{if(t.textContent.includes('maximum 100 MB'))t.textContent=`PDF only · maximum ${Math.floor(limit)} MB`;});}}}catch(_){} }
}