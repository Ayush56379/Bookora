import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';

const DRAFT_KEY = 'bookora_publish_draft_id_v4';
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

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const value = id => String(document.getElementById(id)?.value || '').trim();
const isUrl = v => { try { const u = new URL(v); return u.protocol === 'https:' || u.protocol === 'http:'; } catch (_) { return false; } };
const driveId = v => { try { const u = new URL(v); return u.pathname.match(/\/file\/d\/([^/]+)/i)?.[1] || u.searchParams.get('id') || ''; } catch (_) { return ''; } };
const usableUrl = (v, kind) => { const id = driveId(v); if (!id) return v; return kind === 'cover' ? `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}` : `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`; };

function firebaseDb() {
  if (!window.firebase?.firestore) throw new Error('Firebase Firestore is not ready. Please try again.');
  return window.firebase.firestore();
}

async function currentUser() {
  const auth = window.firebase?.auth?.();
  if (!auth) throw new Error('Firebase Authentication is not ready. Please try again.');
  if (auth.currentUser) return auth.currentUser;
  return new Promise((resolve, reject) => {
    let finished = false;
    const done = user => { if (finished) return; finished = true; try { unsub?.(); } catch (_) {} user ? resolve(user) : reject(new Error('Please sign in again to publish.')); };
    let unsub;
    try { unsub = auth.onAuthStateChanged(done); } catch (_) { done(null); }
    setTimeout(() => done(auth.currentUser || null), 8000);
  });
}

function draftId() {
  let id = sessionStorage.getItem(DRAFT_KEY);
  if (!id) { id = `book_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; sessionStorage.setItem(DRAFT_KEY, id); }
  return id;
}

function commonStyles() {
  if (document.getElementById('bookora-publish-v4-style')) return;
  const style = document.createElement('style');
  style.id = 'bookora-publish-v4-style';
  style.textContent = `
    .bp-wrap{min-height:calc(100vh - 80px);background:linear-gradient(180deg,#f8faff 0%,#fff 48%);padding:38px 20px 70px}
    .bp-shell{max-width:1080px;margin:auto;background:#fff;border:1px solid #e5eaf3;border-radius:28px;box-shadow:0 18px 55px rgba(15,23,42,.08);overflow:hidden}
    .bp-hero{padding:42px 46px 34px;background:linear-gradient(135deg,#fff 0%,#f7f9ff 100%);border-bottom:1px solid #edf1f7}
    .bp-kicker{font-size:12px;font-weight:900;letter-spacing:.13em;text-transform:uppercase;color:#4f46e5;margin-bottom:9px}
    .bp-title{font-size:clamp(30px,4vw,48px);line-height:1.05;font-weight:900;color:#111827;margin:0}
    .bp-sub{font-size:15px;color:#64748b;max-width:720px;line-height:1.65;margin:13px 0 0}
    .bp-steps{display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid #edf1f7;background:#fff}
    .bp-step{padding:17px 20px;display:flex;align-items:center;gap:11px;color:#94a3b8;font-weight:800;font-size:13px;border-bottom:3px solid transparent}
    .bp-step.active{color:#4338ca;border-bottom-color:#4f46e5;background:#fafaff}.bp-num{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:#eef2f7;color:#64748b;font-weight:900}.bp-step.active .bp-num{background:#4f46e5;color:#fff}
    .bp-body{padding:38px 46px 44px}.bp-panel{display:none}.bp-panel.active{display:block}.bp-heading{font-size:25px;font-weight:900;color:#111827;margin:0 0 7px}.bp-help{font-size:14px;color:#64748b;margin:0 0 27px;line-height:1.6}
    .bp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.bp-full{grid-column:1/-1}.bp-field label{display:block;font-size:13px;font-weight:800;color:#334155;margin:0 0 8px}.bp-field input,.bp-field select,.bp-field textarea{width:100%;box-sizing:border-box;border:1px solid #d7deea;background:#fff;border-radius:13px;padding:13px 14px;font:inherit;color:#0f172a;outline:none;transition:.18s}.bp-field textarea{min-height:145px;resize:vertical}.bp-field input:focus,.bp-field select:focus,.bp-field textarea:focus{border-color:#6366f1;box-shadow:0 0 0 4px rgba(99,102,241,.1)}.bp-required{color:#ef4444}.bp-hint{font-size:11px;color:#94a3b8;margin-top:6px}
    .bp-actions{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:32px;padding-top:24px;border-top:1px solid #edf1f7}.bp-btn{border:0;border-radius:12px;padding:13px 20px;font-weight:900;cursor:pointer;font-size:14px}.bp-primary{background:#4f46e5;color:#fff;box-shadow:0 8px 20px rgba(79,70,229,.2)}.bp-secondary{background:#fff;color:#334155;border:1px solid #dbe2ec}.bp-btn:disabled{opacity:.6;cursor:not-allowed}.bp-save{font-size:12px;color:#64748b}.bp-card{border:1px solid #e5eaf3;border-radius:18px;padding:20px;background:#fbfcff}.bp-price{font-size:25px;font-weight:900;color:#111827}.bp-cover{width:110px;height:150px;object-fit:cover;border-radius:10px;background:#eef2f7;border:1px solid #e2e8f0}.bp-preview-grid{display:grid;grid-template-columns:130px 1fr;gap:25px}.bp-detail{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:22px}.bp-detail div{padding:13px 14px;background:#f8fafc;border-radius:11px}.bp-detail b{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:4px}.bp-detail span{font-size:13px;color:#334155;white-space:pre-wrap;word-break:break-word}.bp-message{padding:14px 16px;border-radius:12px;margin-bottom:18px;font-size:13px;font-weight:700}.bp-error{background:#fef2f2;color:#b91c1c}.bp-success{background:#ecfdf5;color:#047857}
    @media(max-width:760px){.bp-hero,.bp-body{padding:28px 20px}.bp-grid,.bp-detail{grid-template-columns:1fr}.bp-full{grid-column:auto}.bp-steps{grid-template-columns:1fr}.bp-step{padding:12px 20px}.bp-step:not(.active){display:none}.bp-preview-grid{grid-template-columns:1fr}.bp-cover{width:95px;height:130px}}
  `;
  document.head.appendChild(style);
}

export function renderPublishInternalPage() {
  commonStyles();
  updateSEO({ title: 'Publish eBook', description: 'Publish your eBook on Bookora.' });
  return `
    <main class="bp-wrap">
      <div class="bp-shell">
        <header class="bp-hero"><div class="bp-kicker">Seller Center · Publish eBook</div><h1 class="bp-title">Publish your eBook</h1><p class="bp-sub">Add your book details, paste your PDF and cover links, set pricing, review everything once, then submit directly to Firebase for admin approval.</p></header>
        <div class="bp-steps"><div class="bp-step active" data-bp-step="1"><span class="bp-num">1</span>Book Details</div><div class="bp-step" data-bp-step="2"><span class="bp-num">2</span>PDF, Cover & Pricing</div><div class="bp-step" data-bp-step="3"><span class="bp-num">3</span>Preview & Submit</div></div>
        <section class="bp-body">
          <div id="bp-message" hidden></div>
          <section class="bp-panel active" data-panel="1">
            <h2 class="bp-heading">Book Information</h2><p class="bp-help">Enter complete information about your eBook. Step 1 is saved to Firebase as a single draft so your work is not lost.</p>
            <div class="bp-grid">
              <div class="bp-field bp-full"><label>eBook Title <span class="bp-required">*</span></label><input id="bp-title" placeholder="Enter your eBook title" maxlength="180"></div>
              <div class="bp-field"><label>Subtitle</label><input id="bp-subtitle" placeholder="Enter subtitle (optional)" maxlength="220"></div>
              <div class="bp-field"><label>Author Name <span class="bp-required">*</span></label><input id="bp-author" placeholder="Author name" maxlength="120"></div>
              <div class="bp-field"><label>Category <span class="bp-required">*</span></label><select id="bp-category"><option value="">Select category</option>${categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></div>
              <div class="bp-field" id="bp-custom-category-wrap" hidden><label>Custom Category <span class="bp-required">*</span></label><input id="bp-custom-category" placeholder="Enter your own category" maxlength="100"></div>
              <div class="bp-field"><label>Language <span class="bp-required">*</span></label><select id="bp-language"><option value="">Select language</option>${languages.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></div>
              <div class="bp-field"><label>Publisher Name</label><input id="bp-publisher" placeholder="Publisher name (optional)" maxlength="160"></div>
              <div class="bp-field"><label>ISBN</label><input id="bp-isbn" placeholder="ISBN (optional)" maxlength="40"></div>
              <div class="bp-field"><label>Edition</label><input id="bp-edition" placeholder="e.g. First Edition" maxlength="80"></div>
              <div class="bp-field"><label>Publication Year</label><input id="bp-year" type="number" min="1000" max="2100" placeholder="e.g. 2026"></div>
              <div class="bp-field"><label>Content Type</label><select id="bp-content-type"><option value="">Select content type</option>${contentTypes.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></div>
              <div class="bp-field bp-full"><label>Description <span class="bp-required">*</span></label><textarea id="bp-description" maxlength="5000" placeholder="Describe the eBook, what readers will learn, and why it is useful."></textarea><div class="bp-hint">Minimum 20 characters.</div></div>
              <div class="bp-field bp-full"><label>Tags <span class="bp-required">*</span></label><input id="bp-tags" placeholder="productivity, business, finance" maxlength="500"></div>
              <div class="bp-field bp-full"><label>About the Author</label><textarea id="bp-about-author" maxlength="2500" placeholder="Short author biography (optional)"></textarea></div>
            </div>
            <div class="bp-actions"><span class="bp-save">✓ Firebase-first draft save · No duplicate draft</span><button class="bp-btn bp-primary" id="bp-next-1">Save & Continue →</button></div>
          </section>

          <section class="bp-panel" data-panel="2">
            <h2 class="bp-heading">PDF, Cover & Pricing</h2><p class="bp-help">No files are uploaded to Bookora. Paste public/shareable links and the metadata is saved directly to the same Firebase book record.</p>
            <div class="bp-grid">
              <div class="bp-field bp-full"><label>eBook PDF Link <span class="bp-required">*</span></label><input id="bp-pdf-url" type="url" placeholder="Paste your public PDF link"><div class="bp-hint">Google Drive share links and public HTTPS PDF links are supported.</div></div>
              <div class="bp-field bp-full"><label>Cover Image Link <span class="bp-required">*</span></label><input id="bp-cover-url" type="url" placeholder="Paste your public cover image link"><div class="bp-hint">JPG, PNG or WEBP public image URL.</div></div>
              <div class="bp-field"><label>List Price (₹) <span class="bp-required">*</span></label><input id="bp-list-price" type="number" min="1" step="0.01" placeholder="e.g. 299"></div>
              <div class="bp-field"><label>Sale Price (₹) <span class="bp-required">*</span></label><input id="bp-sale-price" type="number" min="0" step="0.01" placeholder="e.g. 199"><div class="bp-hint">Sale price cannot be greater than list price.</div></div>
            </div>
            <div class="bp-actions"><button class="bp-btn bp-secondary" id="bp-back-2">← Back</button><span class="bp-save">✓ Same Firebase record will be updated</span><button class="bp-btn bp-primary" id="bp-next-2">Save & Preview →</button></div>
          </section>

          <section class="bp-panel" data-panel="3">
            <h2 class="bp-heading">Final Preview</h2><p class="bp-help">Everything you entered is shown below. Check it once. Submit from this page to send the same Firebase record for admin approval.</p>
            <div id="bp-preview"></div>
            <div class="bp-actions"><button class="bp-btn bp-secondary" id="bp-back-3">← Edit Details</button><span class="bp-save">No new record is created during preview</span><button class="bp-btn bp-primary" id="bp-submit">Submit for Approval →</button></div>
          </section>
        </section>
      </div>
    </main>`;
}

function showMessage(text, type='error') {
  const box = document.getElementById('bp-message'); if (!box) return;
  box.hidden = false; box.className = `bp-message bp-${type}`; box.textContent = text;
}
function clearMessage(){ const b=document.getElementById('bp-message'); if(b){b.hidden=true;b.textContent='';} }
function showStep(n){ document.querySelectorAll('.bp-panel').forEach(p=>p.classList.toggle('active',Number(p.dataset.panel)===n)); document.querySelectorAll('[data-bp-step]').forEach(s=>s.classList.toggle('active',Number(s.dataset.bpStep)===n)); window.scrollTo({top:0,behavior:'smooth'}); }

function readStep1(){
  const category = value('bp-category');
  return { title:value('bp-title'), subtitle:value('bp-subtitle'), author:value('bp-author'), category:category==='Other'?value('bp-custom-category'):category, categorySelection:category, customCategory:value('bp-custom-category'), language:value('bp-language'), publisherName:value('bp-publisher'), isbn:value('bp-isbn'), edition:value('bp-edition'), publicationYear:value('bp-year')?Number(value('bp-year')):null, contentType:value('bp-content-type'), description:value('bp-description'), tags:value('bp-tags').split(',').map(x=>x.trim()).filter(Boolean), aboutAuthor:value('bp-about-author') };
}
function readStep2(){ const pdf=value('bp-pdf-url'), cover=value('bp-cover-url'); return { pdfUrl:pdf, pdfResolvedUrl:usableUrl(pdf,'pdf'), coverUrl:cover, coverResolvedUrl:usableUrl(cover,'cover'), listPrice:Number(value('bp-list-price')), salePrice:Number(value('bp-sale-price')) }; }
function validate1(d){ if(!d.title||!d.author||!d.categorySelection||!d.language||d.description.length<20||!d.tags.length)return 'Please complete all required book details.'; if(d.categorySelection==='Other'&&!d.customCategory)return 'Please enter your custom category.'; return ''; }
function validate2(d){ if(!d.pdfUrl||!isUrl(d.pdfUrl))return 'Please enter a valid PDF link.'; if(!d.coverUrl||!isUrl(d.coverUrl))return 'Please enter a valid cover image link.'; if(!(d.listPrice>0))return 'Please enter a valid list price.'; if(!(d.salePrice>=0)||d.salePrice>d.listPrice)return 'Sale price must be between ₹0 and the list price.'; return ''; }

async function saveDraft(partial){
  const user=await currentUser();
  if(!state.isSeller && !state.isAdmin) throw new Error('Author authorization required to publish an eBook.');
  const db=firebaseDb(), id=draftId(), now=new Date().toISOString();
  const data={id,bookId:id,...partial,creatorId:user.uid,creator_id:user.uid,sellerId:user.uid,seller_id:user.uid,publisherId:user.uid,publisherEmail:user.email||'',firebaseUid:user.uid,status:'draft',reviewStatus:'draft',source_type:'internal',sourceType:'internal',updatedAt:now,updated_at:now};
  await db.collection('books').doc(id).set(data,{merge:true});
  return {id,user};
}

function preview(){
  const a=readStep1(), b=readStep2(), p=document.getElementById('bp-preview'); if(!p)return;
  const cover=isUrl(b.coverUrl)?usableUrl(b.coverUrl,'cover'):'';
  const tags=a.tags.join(', ');
  p.innerHTML=`<div class="bp-card"><div class="bp-preview-grid"><div>${cover?`<img class="bp-cover" src="${esc(cover)}" alt="Cover preview">`:`<div class="bp-cover"></div>`}</div><div><h3 style="margin:0;font-size:27px;font-weight:900;color:#111827">${esc(a.title)}</h3><div style="margin-top:6px;color:#64748b;font-size:14px">${esc(a.subtitle||'')} ${a.subtitle?'· ':''}By ${esc(a.author)}</div><div style="margin-top:14px"><span class="bp-price">₹${b.salePrice.toLocaleString('en-IN')}</span> <span style="color:#94a3b8;text-decoration:line-through;margin-left:8px">₹${b.listPrice.toLocaleString('en-IN')}</span></div></div></div><div class="bp-detail"><div><b>Category</b><span>${esc(a.category)}</span></div><div><b>Language</b><span>${esc(a.language)}</span></div><div><b>Content Type</b><span>${esc(a.contentType||'Not specified')}</span></div><div><b>Publisher</b><span>${esc(a.publisherName||'Not specified')}</span></div><div><b>ISBN</b><span>${esc(a.isbn||'Not specified')}</span></div><div><b>Edition / Year</b><span>${esc([a.edition,a.publicationYear].filter(Boolean).join(' · ')||'Not specified')}</span></div><div><b>Tags</b><span>${esc(tags)}</span></div><div><b>PDF</b><span>${esc(b.pdfUrl)}</span></div><div class="bp-full"><b>Description</b><span>${esc(a.description)}</span></div><div class="bp-full"><b>About the Author</b><span>${esc(a.aboutAuthor||'Not provided')}</span></div></div></div>`;
}

export function initPublishInternalEvents(){
  commonStyles();
  const cat=document.getElementById('bp-category'); cat?.addEventListener('change',()=>{const w=document.getElementById('bp-custom-category-wrap'); if(w)w.hidden=cat.value!=='Other';});
  document.getElementById('bp-next-1')?.addEventListener('click',async()=>{
    clearMessage(); const d=readStep1(), err=validate1(d); if(err){showMessage(err);return;} const btn=document.getElementById('bp-next-1'); btn.disabled=true; btn.textContent='Saving…';
    try{await saveDraft(d);showStep(2);}catch(e){console.error(e);showMessage(e.message||'Could not save to Firebase. Please try again.');}finally{btn.disabled=false;btn.textContent='Save & Continue →';}
  });
  document.getElementById('bp-next-2')?.addEventListener('click',async()=>{
    clearMessage(); const d=readStep2(), err=validate2(d); if(err){showMessage(err);return;} const btn=document.getElementById('bp-next-2');btn.disabled=true;btn.textContent='Saving…';
    try{await saveDraft(d);preview();showStep(3);}catch(e){console.error(e);showMessage(e.message||'Could not save to Firebase. Please try again.');}finally{btn.disabled=false;btn.textContent='Save & Preview →';}
  });
  document.getElementById('bp-back-2')?.addEventListener('click',()=>showStep(1));
  document.getElementById('bp-back-3')?.addEventListener('click',()=>showStep(2));
  document.getElementById('bp-submit')?.addEventListener('click',async()=>{
    clearMessage(); const a=readStep1(),b=readStep2(),e1=validate1(a),e2=validate2(b); if(e1||e2){showMessage(e1||e2);return;} const btn=document.getElementById('bp-submit');btn.disabled=true;btn.textContent='Submitting…';
    try{const {user,id}=await saveDraft({...a,...b,status:'pending',reviewStatus:'pending',review_status:'pending',isNew:true,is_new:true,submittedAt:new Date().toISOString(),submitted_at:new Date().toISOString()});
      const db=firebaseDb(); await db.collection('books').doc(id).set({status:'pending',reviewStatus:'pending',review_status:'pending',submittedAt:new Date().toISOString(),submitted_at:new Date().toISOString(),updatedAt:new Date().toISOString(),updated_at:new Date().toISOString(),creatorId:user.uid,creator_id:user.uid},{merge:true});
      sessionStorage.removeItem(DRAFT_KEY); showMessage('eBook submitted successfully. It is now pending admin approval.','success'); btn.textContent='Submitted ✓';
      setTimeout(()=>{window.location.hash='#/creator';},900);
    }catch(e){console.error('[Bookora publish]',e);showMessage(e.message||'Submission failed. Please try again.');btn.disabled=false;btn.textContent='Submit for Approval →';}
  });
}
