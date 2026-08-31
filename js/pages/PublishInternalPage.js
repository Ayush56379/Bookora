import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';

const DRAFT_KEY = 'bookora_publish_draft_id_v5';
const categories = [
  'Fiction','Romance','Mystery & Thriller','Horror','Fantasy','Science Fiction','Adventure',
  'Biography & Memoir','History','Self Help','Psychology','Business','Finance & Investing',
  'Education','Programming','Technology','Artificial Intelligence','Science','Mathematics',
  'Health & Wellness','Travel','Cooking & Food','Poetry','Religion & Spirituality',
  "Children's Books",'Young Adult','Exam Preparation','Career & Jobs','Personal Development',
  'Marketing','Management','Law','Economics','Politics','Art & Design','Music',
  'Language Learning','Comics & Graphic Novels','Academic & Research','Engineering',
  'Environment','Lifestyle','Productivity','Leadership','Entrepreneurship','Parenting',
  'Sports','Photography','Crafts & Hobbies','Other'
];
const languages = ['English','Hindi','Hinglish','Bengali','Marathi','Tamil','Telugu','Gujarati','Kannada','Malayalam','Punjabi','Urdu','Other'];
const contentTypes = ['Fiction','Non-Fiction','Educational','Reference','Poetry','Short Stories','Workbook / Practice','Other'];

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
const field = id => String(document.getElementById(id)?.value || '').trim();
const validUrl = value => { try { const u = new URL(value); return u.protocol === 'https:' || u.protocol === 'http:'; } catch (_) { return false; } };
const driveId = value => { try { const u = new URL(value); return u.pathname.match(/\/file\/d\/([^/]+)/i)?.[1] || u.searchParams.get('id') || ''; } catch (_) { return ''; } };
const usableUrl = (value, kind) => {
  const id = driveId(value);
  if (!id) return value;
  return kind === 'cover'
    ? `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`
    : `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
};

function db() {
  if (!window.firebase?.firestore) throw new Error('Firebase Firestore is not ready. Please try again.');
  return window.firebase.firestore();
}

async function authUser() {
  const auth = window.firebase?.auth?.();
  if (!auth) throw new Error('Firebase Authentication is not ready. Please try again.');
  if (auth.currentUser) return auth.currentUser;
  return new Promise((resolve, reject) => {
    let done = false;
    let unsubscribe = null;
    const finish = user => {
      if (done) return;
      done = true;
      try { unsubscribe?.(); } catch (_) {}
      user ? resolve(user) : reject(new Error('Please sign in again to publish.'));
    };
    try { unsubscribe = auth.onAuthStateChanged(finish); } catch (_) { finish(null); }
    setTimeout(() => finish(auth.currentUser || null), 6000);
  });
}

function draftId() {
  let id = sessionStorage.getItem(DRAFT_KEY);
  if (!id) {
    id = `book_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(DRAFT_KEY, id);
  }
  return id;
}

function styles() {
  if (document.getElementById('bookora-publish-v5-style')) return;
  const style = document.createElement('style');
  style.id = 'bookora-publish-v5-style';
  style.textContent = `
    .bp-wrap{min-height:calc(100vh - 80px);background:linear-gradient(180deg,#f7f9ff 0%,#fff 52%);padding:38px 20px 80px}
    .bp-shell{max-width:1120px;margin:auto;background:#fff;border:1px solid #e5eaf3;border-radius:28px;box-shadow:0 18px 55px rgba(15,23,42,.08);overflow:hidden}
    .bp-hero{padding:42px 48px 36px;background:linear-gradient(135deg,#fff 0%,#f7f9ff 100%);border-bottom:1px solid #edf1f7}
    .bp-kicker{font-size:12px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:#4f46e5;margin-bottom:9px}.bp-title{font-size:clamp(30px,4vw,48px);line-height:1.05;font-weight:900;color:#111827;margin:0}.bp-sub{font-size:15px;color:#64748b;max-width:760px;line-height:1.65;margin:13px 0 0}
    .bp-steps{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid #edf1f7}.bp-step{padding:17px 22px;display:flex;align-items:center;gap:11px;color:#94a3b8;font-weight:800;font-size:13px;border-bottom:3px solid transparent}.bp-step.active{color:#4338ca;border-bottom-color:#4f46e5;background:#fafaff}.bp-num{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#eef2f7;color:#64748b;font-weight:900}.bp-step.active .bp-num{background:#4f46e5;color:#fff}
    .bp-body{padding:38px 48px 48px}.bp-panel{display:none}.bp-panel.active{display:block}.bp-heading{font-size:26px;font-weight:900;color:#111827;margin:0 0 7px}.bp-help{font-size:14px;color:#64748b;margin:0 0 27px;line-height:1.6}.bp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.bp-full{grid-column:1/-1}.bp-field label{display:block;font-size:13px;font-weight:800;color:#334155;margin:0 0 8px}.bp-field input,.bp-field select,.bp-field textarea{width:100%;box-sizing:border-box;border:1px solid #d7deea;background:#fff;border-radius:13px;padding:13px 14px;font:inherit;color:#0f172a;outline:none;transition:.18s}.bp-field textarea{min-height:145px;resize:vertical}.bp-field input:focus,.bp-field select:focus,.bp-field textarea:focus{border-color:#6366f1;box-shadow:0 0 0 4px rgba(99,102,241,.1)}.bp-required{color:#ef4444}.bp-hint{font-size:11px;color:#94a3b8;margin-top:6px}
    .bp-actions{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:32px;padding-top:24px;border-top:1px solid #edf1f7}.bp-btn{border:0;border-radius:12px;padding:13px 20px;font-weight:900;cursor:pointer;font-size:14px}.bp-primary{background:#4f46e5;color:#fff;box-shadow:0 8px 20px rgba(79,70,229,.2)}.bp-secondary{background:#fff;color:#334155;border:1px solid #dbe2ec}.bp-btn:disabled{opacity:.6;cursor:not-allowed}.bp-save{font-size:12px;color:#64748b}.bp-message{padding:14px 16px;border-radius:12px;margin-bottom:18px;font-size:13px;font-weight:700}.bp-error{background:#fef2f2;color:#b91c1c}.bp-success{background:#ecfdf5;color:#047857}.bp-card{border:1px solid #e5eaf3;border-radius:18px;padding:20px;background:#fbfcff}.bp-preview-grid{display:grid;grid-template-columns:130px 1fr;gap:25px}.bp-cover{width:110px;height:150px;object-fit:cover;border-radius:10px;background:#eef2f7;border:1px solid #e2e8f0}.bp-detail{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:22px}.bp-detail div{padding:13px 14px;background:#f8fafc;border-radius:11px}.bp-detail b{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:4px}.bp-detail span{font-size:13px;color:#334155;white-space:pre-wrap;word-break:break-word}.bp-price{font-size:25px;font-weight:900;color:#111827}
    @media(max-width:760px){.bp-hero,.bp-body{padding:28px 20px}.bp-grid,.bp-detail{grid-template-columns:1fr}.bp-full{grid-column:auto}.bp-steps{grid-template-columns:1fr}.bp-step{padding:12px 20px}.bp-step:not(.active){display:none}.bp-preview-grid{grid-template-columns:1fr}.bp-cover{width:95px;height:130px}.bp-actions{flex-wrap:wrap}}
  `;
  document.head.appendChild(style);
}

export function renderPublishInternalPage() {
  styles();
  updateSEO({ title:'Publish eBook', description:'Publish your eBook on Bookora.' });
  return `
    <main class="bp-wrap"><div class="bp-shell">
      <header class="bp-hero"><div class="bp-kicker">Seller Center · Publish eBook</div><h1 class="bp-title">Publish your eBook</h1><p class="bp-sub">Enter your book details, paste your PDF and cover links, set pricing, review everything once, then submit the same Firebase record for admin approval.</p></header>
      <div class="bp-steps"><div class="bp-step active" data-bp-step="1"><span class="bp-num">1</span>Book Details</div><div class="bp-step" data-bp-step="2"><span class="bp-num">2</span>PDF, Cover & Pricing</div><div class="bp-step" data-bp-step="3"><span class="bp-num">3</span>Preview & Submit</div></div>
      <section class="bp-body"><div id="bp-message" hidden></div>
        <section class="bp-panel active" data-panel="1"><h2 class="bp-heading">Book Information</h2><p class="bp-help">Complete the book metadata. Saving uses one Firebase draft record, so moving between steps does not create duplicates.</p><div class="bp-grid">
          <div class="bp-field bp-full"><label>eBook Title <span class="bp-required">*</span></label><input id="bp-title" maxlength="180" placeholder="Enter your eBook title"></div>
          <div class="bp-field"><label>Subtitle</label><input id="bp-subtitle" maxlength="220" placeholder="Enter subtitle (optional)"></div><div class="bp-field"><label>Author Name <span class="bp-required">*</span></label><input id="bp-author" maxlength="120" placeholder="Author name"></div>
          <div class="bp-field"><label>Category <span class="bp-required">*</span></label><select id="bp-category"><option value="">Select category</option>${categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></div>
          <div class="bp-field" id="bp-custom-category-wrap" hidden><label>Custom Category <span class="bp-required">*</span></label><input id="bp-custom-category" maxlength="100" placeholder="Enter your own category"></div>
          <div class="bp-field"><label>Language <span class="bp-required">*</span></label><select id="bp-language"><option value="">Select language</option>${languages.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></div>
          <div class="bp-field"><label>Publisher Name</label><input id="bp-publisher" maxlength="160" placeholder="Publisher name (optional)"></div><div class="bp-field"><label>ISBN</label><input id="bp-isbn" maxlength="40" placeholder="ISBN (optional)"></div>
          <div class="bp-field"><label>Edition</label><input id="bp-edition" maxlength="80" placeholder="e.g. First Edition"></div><div class="bp-field"><label>Publication Year</label><input id="bp-year" type="number" min="1000" max="2100" placeholder="e.g. 2026"></div>
          <div class="bp-field"><label>Content Type</label><select id="bp-content-type"><option value="">Select content type</option>${contentTypes.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></div>
          <div class="bp-field bp-full"><label>Description <span class="bp-required">*</span></label><textarea id="bp-description" maxlength="5000" placeholder="Describe the eBook, what readers will learn, and why it is useful."></textarea><div class="bp-hint">Minimum 20 characters.</div></div>
          <div class="bp-field bp-full"><label>Tags <span class="bp-required">*</span></label><input id="bp-tags" maxlength="500" placeholder="productivity, business, finance"></div>
          <div class="bp-field bp-full"><label>About the Author</label><textarea id="bp-about-author" maxlength="2500" placeholder="Short author biography (optional)"></textarea></div>
        </div><div class="bp-actions"><span class="bp-save">✓ Firebase draft · One record only</span><button class="bp-btn bp-primary" id="bp-next-1">Save & Continue →</button></div></section>

        <section class="bp-panel" data-panel="2"><h2 class="bp-heading">PDF, Cover & Pricing</h2><p class="bp-help">No file upload. Paste public/shareable links and save pricing to the same Firebase record.</p><div class="bp-grid">
          <div class="bp-field bp-full"><label>eBook PDF Link <span class="bp-required">*</span></label><input id="bp-pdf-url" type="url" placeholder="Paste your public PDF link"><div class="bp-hint">Public HTTPS PDF links and Google Drive share links are supported.</div></div>
          <div class="bp-field bp-full"><label>Cover Image Link <span class="bp-required">*</span></label><input id="bp-cover-url" type="url" placeholder="Paste your public cover image link"><div class="bp-hint">Use a public JPG, PNG or WEBP image URL.</div></div>
          <div class="bp-field"><label>List Price (₹) <span class="bp-required">*</span></label><input id="bp-list-price" type="number" min="0" step="0.01" placeholder="e.g. 299"></div>
          <div class="bp-field"><label>Sale Price (₹) <span class="bp-required">*</span></label><input id="bp-sale-price" type="number" min="0" step="0.01" placeholder="e.g. 199"><div class="bp-hint">Sale price cannot be greater than list price.</div></div>
        </div><div class="bp-actions"><button class="bp-btn bp-secondary" id="bp-back-2">← Back</button><span class="bp-save">✓ Same Firebase document</span><button class="bp-btn bp-primary" id="bp-next-2">Save & Preview →</button></div></section>

        <section class="bp-panel" data-panel="3"><h2 class="bp-heading">Final Preview</h2><p class="bp-help">Review every detail you entered. Submit here to change the same Firebase record to pending approval.</p><div id="bp-preview"></div><div class="bp-actions"><button class="bp-btn bp-secondary" id="bp-back-3">← Edit Details</button><span class="bp-save">No duplicate record during preview</span><button class="bp-btn bp-primary" id="bp-submit">Submit for Approval →</button></div></section>
      </section></div></main>`;
}

function message(text, type='error') { const box=document.getElementById('bp-message'); if(!box)return; box.hidden=false; box.className=`bp-message bp-${type}`; box.textContent=text; }
function clearMessage(){const box=document.getElementById('bp-message');if(box){box.hidden=true;box.textContent='';box.className='';}}
function showStep(step){document.querySelectorAll('.bp-panel').forEach(p=>p.classList.toggle('active',Number(p.dataset.panel)===step));document.querySelectorAll('.bp-step').forEach(p=>p.classList.toggle('active',Number(p.dataset.bpStep)===step));window.scrollTo({top:0,behavior:'smooth'});}

function collectDetails() {
  const category = field('bp-category');
  return {
    title:field('bp-title'), subtitle:field('bp-subtitle'), authorName:field('bp-author'), category,
    categorySelection:category, customCategory:field('bp-custom-category'), language:field('bp-language'),
    publisherName:field('bp-publisher'), isbn:field('bp-isbn'), edition:field('bp-edition'), publicationYear:field('bp-year'),
    contentType:field('bp-content-type'), description:field('bp-description'), tags:field('bp-tags'), aboutAuthor:field('bp-about-author')
  };
}

function collectPricing() {
  const pdfUrl=field('bp-pdf-url'), coverUrl=field('bp-cover-url');
  return { pdfUrl, coverUrl, usablePdfUrl:usableUrl(pdfUrl,'pdf'), usableCoverUrl:usableUrl(coverUrl,'cover'), listPrice:Number(field('bp-list-price')), salePrice:Number(field('bp-sale-price')) };
}

function validateStep1(d){
  if(!d.title)return 'eBook title is required.';
  if(!d.authorName)return 'Author name is required.';
  if(!d.category)return 'Please select a category.';
  if(d.category==='Other'&&!d.customCategory)return 'Please enter your custom category.';
  if(!d.language)return 'Please select a language.';
  if(d.description.length<20)return 'Description must be at least 20 characters.';
  if(!d.tags)return 'Please enter at least one tag.';
  return '';
}

function validateStep2(p){
  if(!p.pdfUrl||!validUrl(p.pdfUrl))return 'Please enter a valid PDF link.';
  if(!p.coverUrl||!validUrl(p.coverUrl))return 'Please enter a valid cover image link.';
  if(!Number.isFinite(p.listPrice)||p.listPrice<0)return 'Please enter a valid list price.';
  if(!Number.isFinite(p.salePrice)||p.salePrice<0)return 'Please enter a valid sale price.';
  if(p.salePrice>p.listPrice)return 'Sale price cannot be greater than list price.';
  return '';
}

async function saveDraft(status='draft') {
  const user=await authUser();
  const details=collectDetails();
  const pricing=collectPricing();
  const id=draftId();
  const payload={
    id,title:details.title,subtitle:details.subtitle,author:details.authorName,authorName:details.authorName,
    category:details.category,categorySelection:details.categorySelection,customCategory:details.customCategory,language:details.language,
    publisherName:details.publisherName,isbn:details.isbn,edition:details.edition,publicationYear:details.publicationYear,contentType:details.contentType,
    description:details.description,tags:details.tags.split(',').map(x=>x.trim()).filter(Boolean),tagsText:details.tags,aboutAuthor:details.aboutAuthor,
    pdfUrl:pricing.pdfUrl,pdf_url:pricing.pdfUrl,usablePdfUrl:pricing.usablePdfUrl,coverUrl:pricing.coverUrl,cover_url:pricing.coverUrl,usableCoverUrl:pricing.usableCoverUrl,
    listPrice:pricing.listPrice,list_price:pricing.listPrice,salePrice:pricing.salePrice,sale_price:pricing.salePrice,price:pricing.salePrice,
    source_type:'internal',source:'bookora',
    ownerId:user.uid,
    creator_id:user.uid,creatorId:user.uid,sellerId:user.uid,publisher_id:user.uid,publisher_email:user.email||'',
    status,updatedAt:window.firebase.firestore.FieldValue.serverTimestamp()
  };
  const ref=db().collection('books').doc(id);
  // Do not read the draft before writing. A new document has no readable resource
  // and that pre-read was causing Firestore "Missing or insufficient permissions".
  // Merge keeps the same draft document across all three steps without duplicates.
  await ref.set(payload,{merge:true});
  return id;
}

function previewHtml(){
  const d=collectDetails(), p=collectPricing();
  const row=(label,val)=>`<div><b>${esc(label)}</b><span>${esc(val||'—')}</span></div>`;
  return `<div class="bp-card"><div class="bp-preview-grid"><div><img class="bp-cover" src="${esc(p.usableCoverUrl)}" alt="Cover preview" onerror="this.style.display='none'"></div><div><div class="bp-kicker">Bookora eBook</div><h3 style="margin:0 0 6px;font-size:28px;font-weight:900;color:#111827">${esc(d.title)}</h3><p style="margin:0;color:#64748b">${esc(d.subtitle||'')}</p><div style="margin-top:14px;display:flex;gap:22px;flex-wrap:wrap"><span><b>Author:</b> ${esc(d.authorName)}</span><span><b>Category:</b> ${esc(d.category)}</span><span><b>Language:</b> ${esc(d.language)}</span></div><div style="margin-top:16px"><span style="text-decoration:line-through;color:#94a3b8;margin-right:10px">₹${p.listPrice.toFixed(2)}</span><strong class="bp-price">₹${p.salePrice.toFixed(2)}</strong></div></div></div><div class="bp-detail">${row('Title',d.title)}${row('Subtitle',d.subtitle)}${row('Author',d.authorName)}${row('Category',d.category)}${row('Language',d.language)}${row('Publisher',d.publisherName)}${row('ISBN',d.isbn)}${row('Edition',d.edition)}${row('Publication Year',d.publicationYear)}${row('Content Type',d.contentType)}${row('Tags',d.tags)}${row('Description',d.description)}${row('About the Author',d.aboutAuthor)}${row('PDF Link',p.pdfUrl)}${row('Cover Link',p.coverUrl)}${row('List Price',`₹${p.listPrice.toFixed(2)}`)}${row('Sale Price',`₹${p.salePrice.toFixed(2)}`)}</div></div>`;
}

export function initPublishInternalEvents(){
  styles();
  const category=document.getElementById('bp-category');
  const customWrap=document.getElementById('bp-custom-category-wrap');
  category?.addEventListener('change',()=>{customWrap.hidden=category.value!=='Other';if(category.value!=='Other')document.getElementById('bp-custom-category').value='';});

  document.getElementById('bp-next-1')?.addEventListener('click',async e=>{
    clearMessage();const btn=e.currentTarget;const error=validateStep1(collectDetails());if(error){message(error);return;}btn.disabled=true;btn.textContent='Saving…';
    try{await saveDraft('draft');showStep(2);}catch(err){console.error(err);message(err.message||'Could not save book details. Please try again.');}finally{btn.disabled=false;btn.textContent='Save & Continue →';}
  });
  document.getElementById('bp-back-2')?.addEventListener('click',()=>{clearMessage();showStep(1);});
  document.getElementById('bp-next-2')?.addEventListener('click',async e=>{
    clearMessage();const btn=e.currentTarget;const error=validateStep2(collectPricing());if(error){message(error);return;}btn.disabled=true;btn.textContent='Saving…';
    try{await saveDraft('draft');document.getElementById('bp-preview').innerHTML=previewHtml();showStep(3);}catch(err){console.error(err);message(err.message||'Could not save PDF, cover and pricing. Please try again.');}finally{btn.disabled=false;btn.textContent='Save & Preview →';}
  });
  document.getElementById('bp-back-3')?.addEventListener('click',()=>{clearMessage();showStep(2);});
  document.getElementById('bp-submit')?.addEventListener('click',async e=>{
    clearMessage();const btn=e.currentTarget;const e1=validateStep1(collectDetails());const e2=validateStep2(collectPricing());if(e1||e2){message(e1||e2);return;}btn.disabled=true;btn.textContent='Submitting…';
    try{
      const id=await saveDraft('pending');
      sessionStorage.removeItem(DRAFT_KEY);
      try{state.emit?.('DATA_SYNCED');}catch(_){window.dispatchEvent(new CustomEvent('bookora:catalog-updated'));}
      message('eBook submitted successfully for admin approval.','success');
      btn.textContent='Submitted ✓';
      setTimeout(()=>{window.location.hash='#/dashboard';},900);
    }catch(err){console.error(err);message(err.message||'Could not submit the eBook. Please try again.');btn.disabled=false;btn.textContent='Submit for Approval →';}
  });
}