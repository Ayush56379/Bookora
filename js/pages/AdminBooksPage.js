// Bookora — Admin Books Control Center
// Firebase-first management for internal + external eBooks.
import { apiFetch } from '../config.js';
import { getAuthInstance } from '../services/firebase.js';
import { state } from '../state.js';
import { Toast } from '../components/Toast.js';

const MASTER_ADMIN_EMAIL = 'ayushprajpati6@gmail.com';
let booksCache = [];
let eventsBound = false;
let searchTerm = '';
let statusFilter = 'all';

function isAdmin() {
  const firebaseUser = getAuthInstance()?.currentUser;
  const user = state.currentUser || {};
  return String(firebaseUser?.email || user.email || '').toLowerCase() === MASTER_ADMIN_EMAIL ||
    state.isAdmin === true || user.role === 'admin' || user.isMasterAdmin === true;
}

function esc(value) {
  return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');
}

function val(book, ...keys) {
  for (const key of keys) if (book?.[key] !== undefined && book?.[key] !== null && book?.[key] !== '') return book[key];
  return '';
}

function dateText(value) {
  try {
    const d = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('en-IN', {dateStyle:'medium', timeStyle:'short'});
  } catch (_) { return '—'; }
}

function statusBadge(status) {
  const s = String(status || 'pending').toLowerCase();
  const map = {approved:['#dcfce7','#166534'], pending:['#fef3c7','#92400e'], rejected:['#fee2e2','#991b1b'], removed:['#e2e8f0','#475569']};
  const [bg,color] = map[s] || map.pending;
  return `<span class="ab-status" style="background:${bg};color:${color}">${esc(s)}</span>`;
}

export function renderAdminBooksPage() {
  if (!isAdmin()) return `<section class="ab-denied"><div><div style="font-size:42px">🔒</div><h2>Access Denied</h2><p>Administrator authorization is required.</p></div></section>`;
  return `
  <section class="admin-books-page">
    <div class="ab-wrap">
      <header class="ab-header">
        <div><div class="ab-kicker">BOOK MANAGEMENT • FIREBASE</div><h1>Books</h1><p>Manage every internal and external eBook directly from Firestore.</p></div>
        <button id="admin-books-refresh" class="ab-primary">↻ Refresh</button>
      </header>
      <div class="ab-stats">
        <div><span>Total</span><b id="books-total">0</b></div><div><span>Pending</span><b id="books-pending">0</b></div>
        <div><span>Approved</span><b id="books-approved">0</b></div><div><span>Rejected</span><b id="books-rejected">0</b></div><div><span>Removed</span><b id="books-removed">0</b></div>
      </div>
      <div class="ab-toolbar">
        <input id="admin-books-search" type="search" placeholder="Search title, author, seller, book ID, website...">
        <select id="admin-books-status"><option value="all">All Books</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="removed">Removed</option></select>
      </div>
      <div class="ab-table-wrap"><table class="ab-table"><thead><tr><th>BOOK</th><th>SOURCE</th><th>PRICE</th><th>SELLER</th><th>STATUS</th><th>CREATED</th><th>ACTIONS</th></tr></thead><tbody id="admin-books-list"><tr><td colspan="7" class="ab-loading">Loading books from Firebase…</td></tr></tbody></table></div>
    </div>
  </section>

  <div id="ab-edit-modal" class="ab-modal hidden"><div class="ab-modal-card"><div class="ab-modal-head"><div><b>Edit Book</b><small id="ab-edit-id"></small></div><button data-modal-close>×</button></div><form id="ab-edit-form"><input type="hidden" id="ab-edit-book-id"><div class="ab-grid">
    <label>Title<input id="ab-edit-title" required></label><label>Author<input id="ab-edit-author"></label><label>Price (₹)<input id="ab-edit-price" type="number" min="0" step="0.01"></label><label>Sale Price (₹)<input id="ab-edit-sale-price" type="number" min="0" step="0.01"></label>
    <label>Category<input id="ab-edit-category"></label><label>Language<input id="ab-edit-language"></label><label>Pages<input id="ab-edit-pages" type="number" min="0"></label><label>Status<select id="ab-edit-status"><option>pending</option><option>approved</option><option>rejected</option><option>removed</option></select></label>
    <label class="ab-full">Cover URL<input id="ab-edit-cover"></label><label class="ab-full">PDF URL<input id="ab-edit-pdf-url"></label><label class="ab-full">Description<textarea id="ab-edit-description" rows="4"></textarea></label>
  </div><div id="ab-external-details" class="ab-external-details"></div><div class="ab-checks"><label><input id="ab-edit-trending" type="checkbox"> Trending</label><label><input id="ab-edit-bestseller" type="checkbox"> Bestseller</label><label><input id="ab-edit-new" type="checkbox"> New</label><label><input id="ab-edit-featured" type="checkbox"> Featured</label></div><div class="ab-modal-actions"><button type="button" data-modal-close class="ab-secondary">Cancel</button><button class="ab-primary" type="submit">Save Changes</button></div></form></div></div>

  <style>
    .admin-books-page{min-height:100vh;background:#f8fafc;padding:32px}.ab-wrap{max-width:1600px;margin:auto}.ab-header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;margin-bottom:22px}.ab-kicker{color:#2563eb;font-size:12px;font-weight:900;letter-spacing:.04em}.ab-header h1{margin:7px 0 4px;color:#0f172a;font-size:34px}.ab-header p{margin:0;color:#64748b}.ab-primary{border:0;background:#2563eb;color:white;border-radius:11px;padding:12px 17px;font-weight:800;cursor:pointer}.ab-primary:disabled{opacity:.6;cursor:wait}.ab-stats{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:18px}.ab-stats>div{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:18px}.ab-stats span{display:block;color:#64748b;font-size:13px}.ab-stats b{display:block;color:#0f172a;font-size:28px;margin-top:5px}.ab-toolbar{display:flex;gap:10px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:15px;margin-bottom:18px}.ab-toolbar input,.ab-toolbar select{border:1px solid #cbd5e1;border-radius:10px;padding:12px 14px;background:#fff;outline:none}.ab-toolbar input{flex:1;min-width:240px}.ab-table-wrap{background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:auto}.ab-table{width:100%;min-width:1200px;border-collapse:collapse}.ab-table th{padding:14px 15px;text-align:left;background:#f8fafc;color:#64748b;font-size:11px;white-space:nowrap}.ab-table td{padding:14px 15px;border-top:1px solid #f1f5f9;vertical-align:middle;font-size:13px;color:#334155}.ab-row:hover{background:#f8fafc}.ab-loading{text-align:center!important;padding:60px!important;color:#64748b}.ab-status{display:inline-flex;padding:5px 9px;border-radius:999px;font-size:10px;font-weight:900;text-transform:uppercase}.ab-source{font-size:10px;font-weight:900;padding:5px 8px;border-radius:7px;background:#eef2ff;color:#4338ca}.ab-source.external{background:#fef3c7;color:#92400e}.ab-title{font-weight:800;color:#0f172a;max-width:300px}.ab-sub{font-size:10px;color:#94a3b8;margin-top:4px}.ab-actions{display:flex;gap:5px;flex-wrap:wrap;min-width:290px}.ab-btn{border:0;border-radius:8px;padding:7px 9px;font-size:10px;font-weight:800;cursor:pointer}.ab-edit{background:#dbeafe;color:#1d4ed8}.ab-approve{background:#dcfce7;color:#166534}.ab-reject{background:#fee2e2;color:#991b1b}.ab-remove{background:#fef3c7;color:#92400e}.ab-restore{background:#dcfce7;color:#166534}.ab-delete{background:#e2e8f0;color:#475569}.ab-flag{background:#f1f5f9;color:#64748b}.ab-flag.on{background:#ede9fe;color:#6d28d9}.ab-modal{position:fixed;inset:0;background:rgba(15,23,42,.48);display:flex;align-items:center;justify-content:center;padding:20px;z-index:9999}.ab-modal.hidden{display:none}.ab-modal-card{width:min(820px,100%);max-height:92vh;overflow:auto;background:white;border-radius:20px;box-shadow:0 30px 80px rgba(0,0,0,.25)}.ab-modal-head{display:flex;justify-content:space-between;padding:20px 22px;border-bottom:1px solid #e2e8f0}.ab-modal-head b{font-size:20px;color:#0f172a}.ab-modal-head small{display:block;color:#94a3b8;margin-top:3px}.ab-modal-head button{border:0;background:#f1f5f9;border-radius:9px;font-size:22px;width:36px;height:36px;cursor:pointer}.ab-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px;padding:20px}.ab-grid label{font-size:12px;font-weight:800;color:#475569}.ab-grid input,.ab-grid select,.ab-grid textarea{display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:11px 12px;border:1px solid #cbd5e1;border-radius:9px;font:inherit;outline:none}.ab-full{grid-column:1/-1}.ab-checks{display:flex;gap:18px;flex-wrap:wrap;padding:0 20px 18px}.ab-checks label{font-size:12px;font-weight:700;color:#475569}.ab-external-details{margin:0 20px 18px;padding:14px;border:1px solid #fde68a;background:#fffbeb;border-radius:12px;color:#78350f;font-size:12px;line-height:1.7}.ab-external-details strong{color:#92400e}.ab-modal-actions{display:flex;justify-content:flex-end;gap:9px;padding:17px 20px;border-top:1px solid #e2e8f0}.ab-secondary{border:0;background:#f1f5f9;color:#475569;border-radius:10px;padding:11px 16px;font-weight:800;cursor:pointer}.ab-denied{min-height:70vh;display:grid;place-items:center;background:#f8fafc}.ab-denied>div{background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:40px;text-align:center}.ab-denied h2{color:#0f172a}.ab-denied p{color:#64748b}@media(max-width:800px){.admin-books-page{padding:16px}.ab-stats{grid-template-columns:repeat(2,1fr)}.ab-grid{grid-template-columns:1fr}.ab-full{grid-column:auto}.ab-header{flex-direction:column}}
  </style>`;
}

function updateStats() {
  const count = s => booksCache.filter(b => String(b.status || 'pending').toLowerCase() === s).length;
  const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=String(v); };
  set('books-total',booksCache.length);set('books-pending',count('pending'));set('books-approved',count('approved'));set('books-rejected',count('rejected'));set('books-removed',count('removed'));
}

function filteredBooks() {
  const q=searchTerm.trim().toLowerCase();
  return booksCache.filter(b=>{
    const s=String(b.status||'pending').toLowerCase();
    const hay=[b.title,b.author,b.id,b.seller_id,b.sellerId,b.seller_name,b.sellerName,b.source_domain,b.source_url,b.websiteDomain,b.websiteUrl].join(' ').toLowerCase();
    return (!q||hay.includes(q)) && (statusFilter==='all'||s===statusFilter);
  });
}

function renderBooksTable() {
  const tbody=document.getElementById('admin-books-list'); if(!tbody)return;
  updateStats(); const books=filteredBooks();
  if(!books.length){tbody.innerHTML='<tr><td colspan="7" class="ab-loading">No books found in Firebase.</td></tr>';return;}
  tbody.innerHTML=books.map(book=>{
    const title=val(book,'title')||'Untitled Book', status=String(val(book,'status')||'pending').toLowerCase();
    const cover=val(book,'cover_url','coverUrl'); const price=Number(val(book,'sale_price','salePrice','price')||0);
    const source=String(val(book,'source_type','sourceType')||'internal').toLowerCase();
    const seller=val(book,'seller_name','sellerName','seller_id','sellerId')||'—';
    const created=val(book,'created_at','createdAt');
    return `<tr class="ab-row"><td><div style="display:flex;gap:10px;align-items:center"><div style="width:44px;height:58px;border-radius:7px;overflow:hidden;background:#e2e8f0;display:grid;place-items:center">${cover?`<img src="${esc(cover)}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">`:'📖'}</div><div><div class="ab-title">${esc(title)}</div><div class="ab-sub">${esc(book.id)}</div></div></div></td><td><span class="ab-source ${source==='external'?'external':''}">${source==='external'?'EXTERNAL':'INTERNAL'}</span></td><td><b>₹${price.toLocaleString('en-IN')}</b></td><td><span style="font-size:11px;word-break:break-all">${esc(seller)}</span></td><td>${statusBadge(status)}</td><td>${esc(dateText(created))}</td><td><div class="ab-actions">
      <button class="ab-btn ab-edit" data-action="edit" data-id="${esc(book.id)}">Edit</button>
      ${status!=='approved'&&status!=='removed'?`<button class="ab-btn ab-approve" data-action="approve" data-id="${esc(book.id)}">Approve</button>`:''}
      ${status!=='rejected'&&status!=='removed'?`<button class="ab-btn ab-reject" data-action="reject" data-id="${esc(book.id)}">Reject</button>`:''}
      ${status!=='removed'?`<button class="ab-btn ab-remove" data-action="remove" data-id="${esc(book.id)}">Remove</button>`:`<button class="ab-btn ab-restore" data-action="restore" data-id="${esc(book.id)}">Restore</button>`}
      <button class="ab-btn ab-delete" data-action="delete" data-id="${esc(book.id)}">Delete</button>
      <button class="ab-btn ab-flag" data-action="trending" data-id="${esc(book.id)}">${book.is_trending?'Untrend':'Trending'}</button>
      <button class="ab-btn ab-flag" data-action="bestseller" data-id="${esc(book.id)}">${book.is_bestseller?'Unbest':'Bestseller'}</button>
      <button class="ab-btn ab-flag" data-action="featured" data-id="${esc(book.id)}">${book.is_featured?'Unfeature':'Feature'}</button>
    </div></td></tr>`;
  }).join('');
}

async function loadBooks() {
  if(!isAdmin()) throw new Error('Administrator authorization required.');
  const tbody=document.getElementById('admin-books-list');
  if(tbody) tbody.innerHTML='<tr><td colspan="7" class="ab-loading">Loading internal + external books from Firebase…</td></tr>';
  const res=await apiFetch('/api/admin/books',{cache:'no-store'});
  let data={}; try{data=await res.json();}catch(_){data={};}
  if(!res.ok||!data.success) throw new Error(data.error||`Books API failed (${res.status}).`);
  booksCache=Array.isArray(data.books)?data.books:[];
  renderBooksTable();
  return booksCache;
}

async function updateBook(bookId,data) {
  const res=await apiFetch(`/api/admin/books/${encodeURIComponent(bookId)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const result=await res.json().catch(()=>({}));
  if(!res.ok||!result.success) throw new Error(result.error||'Firebase book update failed.');
  const index=booksCache.findIndex(b=>b.id===bookId); if(index>=0&&result.book)booksCache[index]=result.book;
  renderBooksTable(); return result.book;
}

function openEdit(book) {
  const modal=document.getElementById('ab-edit-modal'); if(!modal)return;
  const get=id=>document.getElementById(id); const set=(id,v)=>{get(id).value=v??''};
  set('ab-edit-book-id',book.id);set('ab-edit-title',val(book,'title'));set('ab-edit-author',val(book,'author'));set('ab-edit-price',val(book,'price'));set('ab-edit-sale-price',val(book,'sale_price','salePrice'));set('ab-edit-category',val(book,'category'));set('ab-edit-language',val(book,'language'));set('ab-edit-pages',val(book,'pages'));set('ab-edit-status',val(book,'status')||'pending');set('ab-edit-cover',val(book,'cover_url','coverUrl'));set('ab-edit-pdf-url',val(book,'pdf_url','pdfUrl'));set('ab-edit-description',val(book,'description'));get('ab-edit-trending').checked=!!book.is_trending;get('ab-edit-bestseller').checked=!!book.is_bestseller;get('ab-edit-new').checked=!!book.is_new;get('ab-edit-featured').checked=!!book.is_featured;get('ab-edit-id').textContent=book.id;
  const source=String(val(book,'source_type','sourceType')||'internal').toLowerCase();
  const details=get('ab-external-details');
  if(details){details.style.display=source==='external'?'block':'none';details.innerHTML=source==='external'?`<strong>External eBook</strong><br>Website: ${esc(val(book,'websiteName','website_name','source_domain')||'—')}<br>Website URL: ${esc(val(book,'websiteUrl','website_url','source_url')||'—')}<br>Integration ID: ${esc(val(book,'external_integration_id','integrationId')||'—')}<br>PDF File ID: ${esc(val(book,'pdf_file_id','pdfFileId')||'—')}<br>PDF URL: ${esc(val(book,'pdf_url','pdfUrl')||'—')}`:'';}
  modal.classList.remove('hidden');
}

async function action(action,id) {
  const book=booksCache.find(b=>b.id===id); if(!book)throw new Error('Book not found in Firebase.');
  const title=val(book,'title')||'this book';
  if(action==='edit'){openEdit(book);return;}
  if(action==='delete'){
    if(!confirm(`Permanently delete "${title}" from Firebase? This cannot be undone.`))return;
    const res=await apiFetch(`/api/admin/books/${encodeURIComponent(id)}`,{method:'DELETE'});const data=await res.json().catch(()=>({}));
    if(!res.ok||!data.success)throw new Error(data.error||'Firebase delete failed.');
    booksCache=booksCache.filter(b=>b.id!==id);renderBooksTable();Toast.show('Book permanently deleted from Firebase.','success');return;
  }
  if(action==='remove'){if(!confirm(`Remove "${title}" from the marketplace?`))return;await updateBook(id,{status:'removed',removed:true});Toast.show('Book removed from marketplace and saved in Firebase.','success');return;}
  if(action==='restore'){await updateBook(id,{status:'pending',removed:false});Toast.show('Book restored to pending.','success');return;}
  if(action==='approve'){await updateBook(id,{status:'approved',removed:false});Toast.show('Book approved in Firebase.','success');return;}
  if(action==='reject'){await updateBook(id,{status:'rejected'});Toast.show('Book rejected in Firebase.','success');return;}
  const fields={trending:'is_trending',bestseller:'is_bestseller',featured:'is_featured'};
  if(fields[action]){const key=fields[action];await updateBook(id,{[key]:!Boolean(book[key])});Toast.show('Book updated in Firebase.','success');}
}

function bindEditForm(){
  document.getElementById('ab-edit-form')?.addEventListener('submit',async e=>{
    e.preventDefault();const id=document.getElementById('ab-edit-book-id').value;const button=e.target.querySelector('button[type=submit]');button.disabled=true;button.textContent='Saving to Firebase…';
    try{const n=x=>document.getElementById(x);await updateBook(id,{title:n('ab-edit-title').value.trim(),author:n('ab-edit-author').value.trim(),price:Number(n('ab-edit-price').value||0),sale_price:n('ab-edit-sale-price').value===''?null:Number(n('ab-edit-sale-price').value),category:n('ab-edit-category').value.trim(),language:n('ab-edit-language').value.trim(),pages:Number(n('ab-edit-pages').value||0),status:n('ab-edit-status').value,cover_url:n('ab-edit-cover').value.trim(),pdf_url:n('ab-edit-pdf-url').value.trim(),description:n('ab-edit-description').value.trim(),is_trending:n('ab-edit-trending').checked,is_bestseller:n('ab-edit-bestseller').checked,is_new:n('ab-edit-new').checked,is_featured:n('ab-edit-featured').checked});n('ab-edit-modal').classList.add('hidden');Toast.show('All changes saved to Firebase.','success');}catch(err){Toast.show(err.message||'Could not save book.','error');}finally{button.disabled=false;button.textContent='Save Changes';}
  });
}

export function initAdminBooksEvents(){
  if(!isAdmin()||eventsBound)return;eventsBound=true;
  document.getElementById('admin-books-search')?.addEventListener('input',e=>{searchTerm=e.target.value||'';renderBooksTable();});
  document.getElementById('admin-books-status')?.addEventListener('change',e=>{statusFilter=e.target.value;renderBooksTable();});
  document.getElementById('admin-books-refresh')?.addEventListener('click',async e=>{const b=e.currentTarget;b.disabled=true;b.textContent='Refreshing…';try{await loadBooks();Toast.show('Internal + external books refreshed.','success');}catch(err){Toast.show(err.message||'Refresh failed.','error');}finally{b.disabled=false;b.textContent='↻ Refresh';}});
  document.addEventListener('click',async e=>{
    const close=e.target.closest('[data-modal-close]');if(close){document.getElementById('ab-edit-modal')?.classList.add('hidden');return;}
    const button=e.target.closest('[data-action]');if(!button||!button.dataset.id)return;button.disabled=true;const old=button.textContent;button.textContent='…';try{await action(button.dataset.action,button.dataset.id);}catch(err){console.error(err);Toast.show(err.message||'Action failed.','error');}finally{button.disabled=false;button.textContent=old;}
  });
  bindEditForm();loadBooks().catch(err=>{const tbody=document.getElementById('admin-books-list');if(tbody)tbody.innerHTML=`<tr><td colspan="7" class="ab-loading" style="color:#dc2626">Could not load Firebase books.<br><small>${esc(err.message||'Permission or server error')}</small></td></tr>`;Toast.show(err.message||'Unable to load books.','error');});
}

export function destroyAdminBooksPage(){booksCache=[];searchTerm='';statusFilter='all';eventsBound=false;}
