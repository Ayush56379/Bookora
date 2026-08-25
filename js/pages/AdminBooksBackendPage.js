import { apiFetch, waitForAuthenticatedFirebaseUser } from '../config.js';
import { state } from '../state.js';
import { getAllBooksFromFirestore, getDbInstance } from '../services/firebase.js';
import { Toast } from '../components/Toast.js';

let books = [];
let filter = 'all';
let search = '';
let eventsBound = false;
let serverSessionReady = false;

function esc(v) { return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;'); }
function isAdmin() { return !!state.isAdmin; }
function withTimeout(promise, timeoutMs, message) { return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(message)), timeoutMs))]); }

async function validateCachedServerSession() {
  const token = String(localStorage.getItem('bookora_auth_token') || '');
  if (!token || !token.startsWith('tok_')) return '';
  try {
    const response = await withTimeout(fetch(`${window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com'}/api/auth/me`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, cache: 'no-store' }), 5000, 'Server session check timed out.');
    const data = await response.json().catch(() => ({}));
    const admin = response.ok && data?.authenticated === true && (data?.is_admin === true || String(data?.user?.email || '').toLowerCase() === 'ayushprajpati6@gmail.com');
    if (!admin) { localStorage.removeItem('bookora_auth_token'); return ''; }
    state.token = token; state.currentUser = data.user || state.currentUser; state.isAuthenticated = true; state.isAdmin = true; serverSessionReady = true;
    return token;
  } catch (_) { return ''; }
}

async function waitForAdminFirebaseUser(timeoutMs = 8000) {
  const auth = window.firebase?.auth?.();
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;
  return withTimeout(waitForAuthenticatedFirebaseUser(), timeoutMs, 'Firebase administrator session is not ready.');
}

async function ensureServerAdminSession() {
  if (!isAdmin()) throw new Error('Administrator authorization required.');
  const cached = await validateCachedServerSession();
  if (cached) return cached;
  const firebaseUser = await waitForAdminFirebaseUser(8000);
  if (!firebaseUser) throw new Error('Firebase administrator session is not ready. Please sign in again.');
  const firebaseToken = await firebaseUser.getIdToken(true);
  if (!firebaseToken) throw new Error('Firebase administrator token is unavailable. Please sign in again.');
  if (serverSessionReady && String(state.token || '').startsWith('tok_')) return state.token;
  const res = await withTimeout(apiFetch('/api/auth/firebase', { method: 'POST', headers: { Authorization: `Bearer ${firebaseToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({}) }), 8000, 'Administrator session exchange timed out.');
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success || !data.token) throw new Error(data.error || 'Server could not verify the administrator session. Please sign in again.');
  if (data.is_admin !== true) throw new Error('Forbidden: Server-verified Admin authorization required.');
  state.token = data.token; state.currentUser = data.user || state.currentUser; state.isAdmin = true; state.isAuthenticated = true;
  try { localStorage.setItem('bookora_user_profile', JSON.stringify(state.currentUser)); localStorage.setItem('bookora_auth_token', data.token); } catch (_) {}
  serverSessionReady = true;
  return data.token;
}

export function renderAdminBooksPage() {
  if (!isAdmin()) return '<section style="padding:60px;text-align:center"><h2>Admin authorization required.</h2></section>';
  return `<section style="min-height:100vh;background:#f8fafc;padding:32px"><div style="max-width:1450px;margin:auto">
    <div style="display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:24px"><div><div style="color:#2563eb;font-weight:800;font-size:12px">BOOK MANAGEMENT</div><h1 style="margin:6px 0">Books</h1><p style="color:#64748b">Manage internal and external eBooks with server-verified admin authorization and Firebase persistence.</p></div><button id="admin-books-refresh" style="border:0;border-radius:10px;padding:12px 18px;background:#2563eb;color:white;font-weight:700">↻ Refresh</button></div>
    <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;margin-bottom:18px"><div class="ab-stat"><small>Total</small><b id="ab-total">0</b></div><div class="ab-stat"><small>Pending</small><b id="ab-pending">0</b></div><div class="ab-stat"><small>Approved</small><b id="ab-approved">0</b></div><div class="ab-stat"><small>Rejected</small><b id="ab-rejected">0</b></div><div class="ab-stat"><small>Removed</small><b id="ab-removed">0</b></div></div>
    <div style="background:white;border:1px solid #e2e8f0;border-radius:16px;padding:16px;display:flex;gap:10px;margin-bottom:18px"><input id="ab-search" placeholder="Search title, author, seller..." style="flex:1;padding:12px;border:1px solid #cbd5e1;border-radius:10px"><select id="ab-filter" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px"><option value="all">Active + Removed</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="removed">Removed</option></select></div>
    <div style="background:white;border:1px solid #e2e8f0;border-radius:16px;overflow:auto"><table style="width:100%;min-width:1050px;border-collapse:collapse"><thead><tr style="background:#f8fafc"><th>BOOK</th><th>SOURCE</th><th>PRICE</th><th>SELLER</th><th>STATUS</th><th>CREATED</th><th>ACTION</th></tr></thead><tbody id="ab-list"><tr><td colspan="7" style="padding:50px;text-align:center">Loading…</td></tr></tbody></table></div>
  </div></section><style>.ab-stat{background:white;border:1px solid #e2e8f0;border-radius:14px;padding:18px}.ab-stat small{display:block;color:#64748b}.ab-stat b{display:block;font-size:26px;margin-top:6px}th,td{text-align:left;padding:14px;border-bottom:1px solid #f1f5f9;font-size:13px}.ab-btn{border:0;border-radius:8px;padding:7px 10px;margin:2px;font-weight:700;cursor:pointer}.ab-ok{background:#dcfce7;color:#166534}.ab-no{background:#fee2e2;color:#991b1b}.ab-remove{background:#111827;color:#fff}.ab-source{display:inline-flex;padding:3px 7px;border-radius:999px;font-size:11px;font-weight:800}.ab-source-internal{background:#eef2ff;color:#3730a3}.ab-source-external{background:#ecfeff;color:#0e7490}.ab-status-removed{color:#64748b!important;text-decoration:line-through}@media(max-width:900px){.ab-stat{padding:12px}.ab-stat b{font-size:20px}}@media(max-width:700px){.ab-stat{padding:10px}}</style>`;
}

async function loadBooksFromFirestore() {
  // Fast bootstrap cache gives an immediate approved catalog when available.
  if (Array.isArray(window.__BOOKORA_FAST_BOOKS__) && window.__BOOKORA_FAST_BOOKS__.length) {
    books = window.__BOOKORA_FAST_BOOKS__.slice(); renderTable();
  }
  try {
    const result = await withTimeout(getAllBooksFromFirestore(), 6000, 'Firebase books query timed out.');
    if (Array.isArray(result) && result.length) { books = result; renderTable(); return true; }
  } catch (error) { console.warn('[Admin Books] Firestore query:', error?.message || error); }
  try {
    const db = getDbInstance();
    if (db) {
      const statuses = ['pending','approved','rejected','removed'];
      const snapshots = await Promise.all(statuses.map(status => withTimeout(db.collection('books').where('status','==',status).get(), 3500, `Firestore ${status} query timed out.`).catch(() => null)));
      const merged = new Map();
      snapshots.forEach(s => s?.docs?.forEach(doc => merged.set(String(doc.id), { id:String(doc.id), ...doc.data() })));
      if (merged.size) { books = Array.from(merged.values()); renderTable(); return true; }
    }
  } catch (error) { console.warn('[Admin Books] status queries:', error?.message || error); }
  if (Array.isArray(state.books) && state.books.length) { books = state.books.slice(); renderTable(); return true; }
  return false;
}

async function loadBooksFromServer() {
  await ensureServerAdminSession();
  const res = await withTimeout(apiFetch('/api/admin/books', { headers: { Authorization: `Bearer ${state.token}` } }), 8000, 'Books API request timed out.');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Unable to load books.');
  return Array.isArray(data) ? data : (Array.isArray(data.books) ? data.books : []);
}

async function loadBooks() {
  const tbody = document.getElementById('ab-list');
  try {
    // Do not wait on one data source. Firebase is authoritative for eBooks;
    // the server is the secure fallback and for all admin mutations.
    const firebasePromise = loadBooksFromFirestore();
    let serverResult = null;
    try { serverResult = await loadBooksFromServer(); } catch (serverError) { console.warn('[Admin Books] server source:', serverError?.message || serverError); }
    if (serverResult && serverResult.length) { books = serverResult; renderTable(); return; }
    const firebaseResult = await firebasePromise;
    if (firebaseResult) return;
    books = [];
    renderTable();
  } catch (error) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="padding:50px;text-align:center;color:#b91c1c">${esc(error?.message || 'Unable to load books.')}<br><button id="admin-books-inline-retry" class="ab-btn" style="margin-top:12px;background:#2563eb;color:#fff">Retry</button></td></tr>`;
    throw error;
  }
}

function renderTable() {
  const term = search.trim().toLowerCase();
  const visible = books.filter(b => { const status=String(b.status||'pending').toLowerCase(); const text=`${b.title||''} ${b.author||''} ${b.seller_name||''} ${b.seller_id||''} ${b.id||''}`.toLowerCase(); const statusOk=filter==='all'||status===filter; return statusOk&&(!term||text.includes(term)); });
  const count=s=>books.filter(b=>String(b.status||'pending').toLowerCase()===s).length;
  document.getElementById('ab-total')?.replaceChildren(document.createTextNode(books.length)); document.getElementById('ab-pending')?.replaceChildren(document.createTextNode(count('pending'))); document.getElementById('ab-approved')?.replaceChildren(document.createTextNode(count('approved'))); document.getElementById('ab-rejected')?.replaceChildren(document.createTextNode(count('rejected'))); document.getElementById('ab-removed')?.replaceChildren(document.createTextNode(count('removed')));
  const tbody=document.getElementById('ab-list'); if(!tbody)return;
  if(!visible.length){tbody.innerHTML='<tr><td colspan="7" style="padding:50px;text-align:center;color:#64748b">No books found.</td></tr>';return;}
  tbody.innerHTML=visible.map(b=>{const status=String(b.status||'pending').toLowerCase();const source=String(b.source_type||b.sourceType||'internal').toLowerCase()==='external'?'external':'internal';const statusColor=status==='approved'?'#15803d':status==='rejected'?'#b91c1c':status==='removed'?'#64748b':'#a16207';const action=status==='removed'?'<span style="color:#64748b;font-weight:700">Removed</span>':`<button class="ab-btn ab-remove" data-ab-remove-id="${esc(b.id)}">Remove</button>`;return `<tr><td><b class="${status==='removed'?'ab-status-removed':''}">${esc(b.title||'Untitled')}</b><div style="color:#94a3b8">${esc(b.author||'')}</div></td><td><span class="ab-source ab-source-${source}">${source.toUpperCase()}</span></td><td>₹${Number(b.price||0).toLocaleString('en-IN')}</td><td>${esc(b.seller_name||b.seller_id||'—')}</td><td><b style="color:${statusColor}">${esc(status.toUpperCase())}</b></td><td>${esc(b.created_at||b.createdAt||'—')}</td><td>${status!=='removed'?`${status!=='approved'?`<button class="ab-btn ab-ok" data-ab-action="approved" data-ab-id="${esc(b.id)}">Approve</button>`:''}${status!=='rejected'?`<button class="ab-btn ab-no" data-ab-action="rejected" data-ab-id="${esc(b.id)}">Reject</button>`:''}`:''}${action}</td></tr>`;}).join('');
}

export function initAdminBooksEvents() {
  if (!isAdmin() || eventsBound) return; eventsBound=true;
  document.getElementById('admin-books-refresh')?.addEventListener('click',async e=>{e.currentTarget.disabled=true;try{serverSessionReady=false;await loadBooks();Toast.show('Books refreshed.','success')}catch(err){Toast.show(err.message,'error')}finally{e.currentTarget.disabled=false}});
  document.getElementById('ab-search')?.addEventListener('input',e=>{search=e.target.value;renderTable()}); document.getElementById('ab-filter')?.addEventListener('change',e=>{filter=e.target.value;renderTable()});
  document.addEventListener('click',async e=>{
    const retryBtn=e.target.closest('#admin-books-inline-retry'); if(retryBtn){retryBtn.disabled=true;retryBtn.textContent='Retrying…';try{serverSessionReady=false;await loadBooks();Toast.show('Books loaded.','success')}catch(err){Toast.show(err.message||'Unable to load books.','error');retryBtn.disabled=false;retryBtn.textContent='Retry'}return;}
    const removeBtn=e.target.closest('[data-ab-remove-id]'); if(removeBtn){const id=removeBtn.dataset.abRemoveId;if(!id)return;const book=books.find(b=>String(b.id)===String(id));const title=book?.title||'this eBook';if(!window.confirm(`Remove "${title}" from Bookora?\n\nThe listing will be hidden from the marketplace. Existing paid order/library records will be preserved.`))return;removeBtn.disabled=true;removeBtn.textContent='Removing…';try{await ensureServerAdminSession();const res=await apiFetch(`/api/admin/books/${encodeURIComponent(id)}/remove`,{method:'POST',headers:{Authorization:`Bearer ${state.token}`}});const data=await res.json().catch(()=>({}));if(!res.ok||!data.success)throw new Error(data.error||'eBook removal failed.');const index=books.findIndex(b=>String(b.id)===String(id));if(index>=0)books[index]=data.book;renderTable();Toast.show('eBook removed successfully.','success')}catch(err){Toast.show(err.message||'eBook removal failed.','error');removeBtn.disabled=false;removeBtn.textContent='Remove'}return;}
    const btn=e.target.closest('[data-ab-action]');if(!btn)return;const id=btn.dataset.abId,status=btn.dataset.abAction;if(!id)return;btn.disabled=true;try{await ensureServerAdminSession();const res=await apiFetch(`/api/admin/books/${encodeURIComponent(id)}/status`,{method:'POST',headers:{Authorization:`Bearer ${state.token}`},body:JSON.stringify({status})});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||'Update failed.');const index=books.findIndex(b=>String(b.id)===String(id));if(index>=0)books[index]=data.book;renderTable();Toast.show(status==='approved'?'Book approved.':'Book rejected.','success')}catch(err){Toast.show(err.message,'error')}finally{btn.disabled=false}
  });
  loadBooks().catch(err=>Toast.show(err.message,'error'));
}