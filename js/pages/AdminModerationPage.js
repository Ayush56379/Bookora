import { apiFetch } from '../config.js';
import { getFirestoreInstance } from '../services/firebase.js';
import { state } from '../state.js';
import { Toast } from '../components/Toast.js';
import { updateSEO } from '../utils/seo.js';

const ADMIN_EMAIL = 'ayushprajpati6@gmail.com';
let books = [];
let unsubscribe = null;
let activeFilter = 'pending';
let searchTerm = '';
let initialized = false;
let loading = false;

const esc = value => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/\"/g, '&quot;').replace(/'/g, '&#039;');

function isAdmin() {
  const u = state.currentUser || {};
  return state.isAdmin === true || u.role === 'admin' || u.isMasterAdmin === true || String(u.email || '').toLowerCase() === ADMIN_EMAIL;
}

function withTimeout(promise, ms, message) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))]);
}

function dateValue(value) {
  if (!value) return 0;
  try { if (typeof value.toDate === 'function') return value.toDate().getTime(); } catch (_) {}
  const n = new Date(value).getTime();
  return Number.isFinite(n) ? n : 0;
}

function formatDate(value) {
  const n = dateValue(value);
  return n ? new Date(n).toLocaleString('en-IN') : '—';
}

function money(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function statusBadge(status) {
  const s = String(status || 'pending').toLowerCase();
  const map = {
    pending: ['#fef3c7','#92400e'], approved: ['#dcfce7','#166534'],
    rejected: ['#fee2e2','#991b1b'], removed: ['#e2e8f0','#475569']
  };
  const [bg,color] = map[s] || map.pending;
  return `<span class="mod-status" style="background:${bg};color:${color}">${esc(s)}</span>`;
}

function sourceBadge(book) {
  const external = String(book.source_type || book.sourceType || '').toLowerCase() === 'external';
  return `<span class="mod-source ${external ? 'external' : 'internal'}">${external ? 'EXTERNAL' : 'BOOKORA'}</span>`;
}

export function renderAdminModerationPage() {
  updateSEO({ title: 'Content Moderation', description: 'Review and approve Bookora eBook submissions from Firebase.' });
  if (!isAdmin()) {
    return `<section class="admin-moderation-page mod-page"><div class="mod-denied"><div class="mod-denied-icon">🔒</div><h2>Admin access required</h2><p>This moderation center is available only to authorized Bookora administrators.</p><a href="#/admin" class="mod-primary">Back to Admin</a></div></section>`;
  }
  return `
    <section class="admin-moderation-page mod-page">
      <div class="mod-shell">
        <div class="mod-hero">
          <div>
            <div class="mod-kicker"><span>🛡️</span> CONTENT MODERATION</div>
            <h1>Moderation Center</h1>
            <p>Review new eBook submissions, verify metadata, and control what becomes visible in the Bookora marketplace.</p>
          </div>
          <div class="mod-hero-actions">
            <span id="mod-live-state" class="mod-live"><i></i> Firebase Live</span>
            <button id="mod-refresh" class="mod-refresh" type="button">↻ Refresh</button>
          </div>
        </div>

        <div class="mod-stats">
          <div class="mod-stat"><div class="mod-stat-icon pending">◷</div><div><span>Pending Review</span><strong id="mod-pending">0</strong></div></div>
          <div class="mod-stat"><div class="mod-stat-icon approved">✓</div><div><span>Approved</span><strong id="mod-approved">0</strong></div></div>
          <div class="mod-stat"><div class="mod-stat-icon rejected">!</div><div><span>Rejected</span><strong id="mod-rejected">0</strong></div></div>
          <div class="mod-stat"><div class="mod-stat-icon total">▦</div><div><span>Total Submissions</span><strong id="mod-total">0</strong></div></div>
        </div>

        <div class="mod-toolbar">
          <div class="mod-tabs" role="tablist">
            <button class="mod-tab active" data-mod-filter="pending">Pending <b id="mod-tab-pending">0</b></button>
            <button class="mod-tab" data-mod-filter="approved">Approved <b id="mod-tab-approved">0</b></button>
            <button class="mod-tab" data-mod-filter="rejected">Rejected <b id="mod-tab-rejected">0</b></button>
            <button class="mod-tab" data-mod-filter="all">All <b id="mod-tab-all">0</b></button>
          </div>
          <div class="mod-search-wrap"><span>⌕</span><input id="mod-search" type="search" autocomplete="off" placeholder="Search title, author, seller or ID..."></div>
        </div>

        <div id="mod-list" class="mod-list">
          <div class="mod-loading"><div class="mod-spinner"></div><strong>Connecting to Firebase…</strong><span>Loading moderation records safely.</span></div>
        </div>
      </div>
    </section>
    <div id="mod-detail-modal" class="mod-modal" hidden>
      <div class="mod-modal-backdrop" data-mod-close></div>
      <div class="mod-modal-card" role="dialog" aria-modal="true" aria-labelledby="mod-modal-title">
        <div class="mod-modal-head"><div><div class="mod-kicker">SUBMISSION REVIEW</div><h2 id="mod-modal-title">eBook details</h2></div><button type="button" class="mod-close" data-mod-close>×</button></div>
        <div id="mod-modal-body"></div>
      </div>
    </div>
    <style>
      .mod-page{min-height:100vh;background:#f6f8fc;padding:34px 24px 70px;color:#0f172a}.mod-shell{max-width:1460px;margin:auto}.mod-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap;margin-bottom:26px}.mod-kicker{display:inline-flex;align-items:center;gap:7px;padding:7px 11px;border-radius:999px;background:#eef4ff;color:#2563eb;font-size:11px;font-weight:850;letter-spacing:.04em}.mod-hero h1{margin:11px 0 7px;font-size:34px;line-height:1.1;letter-spacing:-.035em;font-weight:850}.mod-hero p{max-width:760px;margin:0;color:#64748b;font-size:14px;line-height:1.65}.mod-hero-actions{display:flex;align-items:center;gap:10px}.mod-live{display:inline-flex;align-items:center;gap:7px;padding:10px 12px;border:1px solid #bbf7d0;background:#f0fdf4;border-radius:11px;color:#166534;font-size:12px;font-weight:750}.mod-live i{width:7px;height:7px;border-radius:50%;background:#16a34a;box-shadow:0 0 0 4px #dcfce7}.mod-refresh,.mod-primary{border:0;border-radius:11px;background:#2563eb;color:#fff;padding:12px 16px;font-weight:750;cursor:pointer;box-shadow:0 7px 18px rgba(37,99,235,.18);text-decoration:none}.mod-refresh:disabled{opacity:.6;cursor:wait}.mod-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:20px}.mod-stat{display:flex;align-items:center;gap:13px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:18px;box-shadow:0 4px 18px rgba(15,23,42,.035)}.mod-stat span{display:block;color:#64748b;font-size:12px;font-weight:650;margin-bottom:5px}.mod-stat strong{font-size:26px;line-height:1;font-weight:850}.mod-stat-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:12px;font-weight:900;font-size:18px}.mod-stat-icon.pending{background:#fff7ed;color:#c2410c}.mod-stat-icon.approved{background:#ecfdf5;color:#15803d}.mod-stat-icon.rejected{background:#fff1f2;color:#be123c}.mod-stat-icon.total{background:#eef2ff;color:#4338ca}.mod-toolbar{display:flex;align-items:center;justify-content:space-between;gap:15px;flex-wrap:wrap;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:10px;margin-bottom:16px}.mod-tabs{display:flex;gap:4px;flex-wrap:wrap}.mod-tab{border:0;background:transparent;color:#64748b;padding:10px 13px;border-radius:10px;font-size:12px;font-weight:750;cursor:pointer}.mod-tab.active{background:#eff6ff;color:#2563eb}.mod-tab b{margin-left:4px;padding:2px 6px;border-radius:999px;background:#e2e8f0;color:#475569;font-size:10px}.mod-tab.active b{background:#dbeafe;color:#1d4ed8}.mod-search-wrap{display:flex;align-items:center;gap:8px;width:min(390px,100%);padding:0 12px;border:1px solid #dbe2ea;border-radius:10px;background:#f8fafc}.mod-search-wrap span{font-size:19px;color:#94a3b8}.mod-search-wrap input{border:0;outline:0;background:transparent;width:100%;padding:11px 0;color:#0f172a;font-size:13px}.mod-list{display:grid;gap:13px}.mod-card{display:grid;grid-template-columns:92px minmax(0,1fr) auto;gap:17px;align-items:center;background:#fff;border:1px solid #e2e8f0;border-radius:17px;padding:15px;box-shadow:0 4px 18px rgba(15,23,42,.035)}.mod-cover{width:92px;height:118px;border-radius:11px;overflow:hidden;background:linear-gradient(145deg,#dbeafe,#eef2ff);display:grid;place-items:center;color:#64748b;font-size:27px}.mod-cover img{width:100%;height:100%;object-fit:cover}.mod-main{min-width:0}.mod-topline{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px}.mod-source{display:inline-flex;padding:4px 7px;border-radius:999px;font-size:9px;font-weight:850;letter-spacing:.05em}.mod-source.internal{background:#eef2ff;color:#4338ca}.mod-source.external{background:#ecfeff;color:#0e7490}.mod-status{display:inline-flex;padding:4px 8px;border-radius:999px;font-size:9px;font-weight:850;text-transform:uppercase}.mod-main h3{margin:0;color:#0f172a;font-size:17px;font-weight:820;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mod-author{margin:4px 0 9px;color:#64748b;font-size:12px}.mod-meta{display:flex;flex-wrap:wrap;gap:7px}.mod-meta span{padding:5px 8px;border:1px solid #e5e7eb;border-radius:8px;color:#475569;background:#fafafa;font-size:10px}.mod-description{margin-top:9px;color:#64748b;font-size:11px;line-height:1.5;max-width:780px}.mod-actions{display:flex;flex-direction:column;gap:7px;min-width:108px}.mod-btn{border:0;border-radius:9px;padding:9px 11px;font-size:11px;font-weight:800;cursor:pointer}.mod-btn.view{background:#eef2ff;color:#3730a3}.mod-btn.approve{background:#dcfce7;color:#166534}.mod-btn.reject{background:#fee2e2;color:#991b1b}.mod-btn:disabled{opacity:.55;cursor:wait}.mod-empty{background:#fff;border:1px dashed #cbd5e1;border-radius:17px;padding:65px 20px;text-align:center}.mod-empty-icon{width:58px;height:58px;border-radius:16px;background:#ecfdf5;color:#15803d;display:grid;place-items:center;margin:0 auto 12px;font-size:25px}.mod-empty h3{margin:0 0 6px;font-size:17px}.mod-empty p{margin:0;color:#64748b;font-size:12px}.mod-loading{background:#fff;border:1px solid #e2e8f0;border-radius:17px;min-height:230px;display:grid;place-items:center;align-content:center;gap:7px;color:#64748b}.mod-loading strong{color:#334155;font-size:14px}.mod-loading span{font-size:11px}.mod-spinner{width:27px;height:27px;border:3px solid #dbeafe;border-top-color:#2563eb;border-radius:50%;animation:modspin .75s linear infinite;margin-bottom:5px}@keyframes modspin{to{transform:rotate(360deg)}}.mod-error{background:#fff;border:1px solid #fecaca;border-radius:17px;padding:32px;text-align:center}.mod-error h3{margin:0 0 7px;color:#991b1b}.mod-error p{margin:0 0 15px;color:#64748b;font-size:12px}.mod-modal[hidden]{display:none}.mod-modal{position:fixed;inset:0;z-index:10050}.mod-modal-backdrop{position:absolute;inset:0;background:rgba(15,23,42,.52);backdrop-filter:blur(2px)}.mod-modal-card{position:relative;z-index:1;width:min(900px,calc(100% - 28px));max-height:calc(100vh - 36px);overflow:auto;margin:18px auto;background:#fff;border-radius:20px;box-shadow:0 28px 100px rgba(15,23,42,.28);padding:23px}.mod-modal-head{display:flex;justify-content:space-between;gap:15px;border-bottom:1px solid #e2e8f0;padding-bottom:14px;margin-bottom:17px}.mod-modal-head h2{margin:5px 0 0;font-size:22px}.mod-close{border:1px solid #cbd5e1;background:#fff;border-radius:9px;width:36px;height:36px;font-size:22px;cursor:pointer}.mod-detail-cover{width:130px;height:170px;border-radius:12px;overflow:hidden;background:#eef2ff}.mod-detail-cover img{width:100%;height:100%;object-fit:cover}.mod-detail-head{display:grid;grid-template-columns:130px 1fr;gap:18px}.mod-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:18px}.mod-detail-item{border:1px solid #e2e8f0;border-radius:10px;padding:10px}.mod-detail-item small{display:block;color:#64748b;font-size:10px;margin-bottom:4px}.mod-detail-item strong{display:block;color:#0f172a;font-size:12px;word-break:break-word}.mod-detail-full{grid-column:1/-1}.mod-detail-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px;padding-top:16px;border-top:1px solid #e2e8f0}.mod-denied{max-width:520px;margin:70px auto;background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:42px;text-align:center;box-shadow:0 12px 35px rgba(15,23,42,.08)}.mod-denied-icon{width:60px;height:60px;border-radius:16px;background:#fee2e2;display:grid;place-items:center;margin:0 auto 14px;font-size:27px}.mod-denied h2{margin:0 0 8px}.mod-denied p{color:#64748b;font-size:13px;line-height:1.6;margin:0 0 20px}.mod-denied a{display:inline-block}@media(max-width:950px){.mod-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.mod-card{grid-template-columns:76px minmax(0,1fr)}.mod-cover{width:76px;height:100px}.mod-actions{grid-column:2;flex-direction:row;flex-wrap:wrap}.mod-actions .mod-btn{flex:1}}@media(max-width:650px){.mod-page{padding:22px 13px 50px}.mod-hero h1{font-size:27px}.mod-stats{grid-template-columns:1fr 1fr}.mod-stat{padding:13px}.mod-stat-icon{width:36px;height:36px}.mod-stat strong{font-size:22px}.mod-toolbar{padding:8px}.mod-tabs{width:100%;overflow-x:auto;flex-wrap:nowrap}.mod-search-wrap{width:100%}.mod-card{grid-template-columns:62px minmax(0,1fr);gap:11px;padding:12px}.mod-cover{width:62px;height:84px}.mod-actions{grid-column:1/-1}.mod-actions .mod-btn{flex:1}.mod-main h3{font-size:14px}.mod-description{display:none}.mod-detail-head{grid-template-columns:90px 1fr}.mod-detail-cover{width:90px;height:120px}.mod-detail-grid{grid-template-columns:1fr}.mod-detail-full{grid-column:auto}}
    </style>`;
}

function updateCounts() {
  const count = status => books.filter(b => String(b.status || 'pending').toLowerCase() === status).length;
  const pending = count('pending'), approved = count('approved'), rejected = count('rejected');
  const set = (id, value) => document.getElementById(id)?.replaceChildren(document.createTextNode(String(value)));
  set('mod-pending', pending); set('mod-approved', approved); set('mod-rejected', rejected); set('mod-total', books.length);
  set('mod-tab-pending', pending); set('mod-tab-approved', approved); set('mod-tab-rejected', rejected); set('mod-tab-all', books.length);
}

function visibleBooks() {
  const q = searchTerm.trim().toLowerCase();
  return books.filter(book => {
    const status = String(book.status || 'pending').toLowerCase();
    const hay = [book.id,book.title,book.author,book.seller_name,book.seller_id,book.category,book.source_domain].map(v => String(v || '')).join(' ').toLowerCase();
    return (activeFilter === 'all' || status === activeFilter) && (!q || hay.includes(q));
  }).sort((a,b) => {
    const ap = String(a.status || 'pending').toLowerCase() === 'pending' ? 1 : 0;
    const bp = String(b.status || 'pending').toLowerCase() === 'pending' ? 1 : 0;
    return bp-ap || dateValue(b.createdAt || b.created_at) - dateValue(a.createdAt || a.created_at);
  });
}

function renderList() {
  const el = document.getElementById('mod-list');
  if (!el) return;
  updateCounts();
  const list = visibleBooks();
  if (!list.length) {
    el.innerHTML = `<div class="mod-empty"><div class="mod-empty-icon">✓</div><h3>No submissions here</h3><p>${activeFilter === 'pending' ? 'The moderation queue is clear. New Firebase submissions will appear automatically.' : 'No eBooks match the current filter or search.'}</p></div>`;
    return;
  }
  el.innerHTML = list.map(book => {
    const status = String(book.status || 'pending').toLowerCase();
    const cover = String(book.cover_url || book.coverUrl || '').trim();
    const description = String(book.description || '').trim();
    const seller = book.seller_name || book.sellerName || book.seller_id || 'Independent publisher';
    const category = book.category || 'Uncategorized';
    const pages = book.pages ? `${book.pages} pages` : 'Pages —';
    const price = money(book.sale_price ?? book.price);
    const buttons = `<button class="mod-btn view" data-mod-view="${esc(book.id)}">Review</button>${status === 'pending' ? `<button class="mod-btn approve" data-mod-status="approved" data-mod-id="${esc(book.id)}">Approve</button><button class="mod-btn reject" data-mod-status="rejected" data-mod-id="${esc(book.id)}">Reject</button>` : status === 'rejected' ? `<button class="mod-btn approve" data-mod-status="approved" data-mod-id="${esc(book.id)}">Approve</button>` : ''}`;
    return `<article class="mod-card"><div class="mod-cover">${cover ? `<img src="${esc(cover)}" alt="" loading="lazy" onerror="this.style.display='none'">` : '▤'}</div><div class="mod-main"><div class="mod-topline">${sourceBadge(book)}${statusBadge(status)}</div><h3 title="${esc(book.title || 'Untitled')}">${esc(book.title || 'Untitled')}</h3><div class="mod-author">by ${esc(book.author || 'Unknown author')} · Publisher: ${esc(seller)}</div><div class="mod-meta"><span>${esc(category)}</span><span>${esc(pages)}</span><span>${esc(book.format || 'PDF')}</span><span>${esc(price)}</span><span>${esc(formatDate(book.createdAt || book.created_at))}</span></div>${description ? `<div class="mod-description">${esc(description.slice(0,240))}${description.length>240?'…':''}</div>` : ''}</div><div class="mod-actions">${buttons}</div></article>`;
  }).join('');
}

async function fetchServerBooks() {
  try {
    const response = await withTimeout(apiFetch('/api/admin/books'), 7500, 'Admin books request timed out.');
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Server returned ${response.status}.`);
    return Array.isArray(data) ? data : (Array.isArray(data.books) ? data.books : []);
  } catch (error) {
    console.warn('[Moderation] server list fallback:', error?.message || error);
    return [];
  }
}

async function loadBooks() {
  if (loading) return;
  loading = true;
  const live = document.getElementById('mod-live-state');
  if (live) live.innerHTML = '<i></i> Syncing…';
  try {
    const db = getFirestoreInstance();
    let firestoreRows = [];
    if (db) {
      try {
        const snap = await withTimeout(db.collection('books').get(), 6500, 'Firebase books query timed out.');
        firestoreRows = snap.docs.map(doc => ({ id: String(doc.id), ...doc.data() }));
      } catch (error) { console.warn('[Moderation] Firestore list:', error?.message || error); }
    }
    const serverRows = await fetchServerBooks();
    const merged = new Map();
    firestoreRows.forEach(row => row?.id != null && merged.set(String(row.id), row));
    serverRows.forEach(row => row?.id != null && merged.set(String(row.id), row));
    books = Array.from(merged.values());
    renderList();
    if (!books.length) {
      document.getElementById('mod-list').innerHTML = `<div class="mod-error"><h3>No Firebase submissions returned</h3><p>Firebase and the verified admin endpoint returned no book records. You can retry without leaving this page.</p><button class="mod-primary" type="button" id="mod-inline-retry">Retry now</button></div>`;
    }
    if (live) live.innerHTML = '<i></i> Firebase Live';
  } catch (error) {
    console.error('[Moderation] load failed:', error);
    const el = document.getElementById('mod-list');
    if (el) el.innerHTML = `<div class="mod-error"><h3>Could not load moderation records</h3><p>${esc(error?.message || 'Temporary Firebase connection problem.')}</p><button class="mod-primary" type="button" id="mod-inline-retry">Retry now</button></div>`;
    if (live) live.innerHTML = '<i style="background:#dc2626;box-shadow:0 0 0 4px #fee2e2"></i> Retry needed';
  } finally { loading = false; }
}

function openDetails(book) {
  const modal = document.getElementById('mod-detail-modal');
  const body = document.getElementById('mod-modal-body');
  const title = document.getElementById('mod-modal-title');
  if (!modal || !body || !book) return;
  title.textContent = book.title || 'eBook details';
  const cover = String(book.cover_url || book.coverUrl || '').trim();
  const item = (label,value,full=false) => `<div class="mod-detail-item ${full?'mod-detail-full':''}"><small>${esc(label)}</small><strong>${esc(value || '—')}</strong></div>`;
  const status = String(book.status || 'pending').toLowerCase();
  body.innerHTML = `<div class="mod-detail-head"><div class="mod-detail-cover">${cover ? `<img src="${esc(cover)}" alt="" onerror="this.style.display='none'">` : '▤'}</div><div><div class="mod-topline">${sourceBadge(book)}${statusBadge(status)}</div><h2 style="margin:0 0 6px;font-size:24px">${esc(book.title || 'Untitled')}</h2><p style="margin:0;color:#64748b;font-size:13px;line-height:1.6">${esc(book.description || 'No description provided.')}</p></div></div><div class="mod-detail-grid">${item('Author',book.author)}${item('Publisher / Seller',book.seller_name || book.seller_id)}${item('Category',book.category)}${item('Language',book.language)}${item('Price',money(book.sale_price ?? book.price))}${item('Pages',book.pages)}${item('Format',book.format)}${item('Created',formatDate(book.createdAt || book.created_at))}${item('Book ID',book.id,true)}${item('Source URL',book.source_url || book.buy_url || 'Internal Bookora file',true)}${item('PDF URL',book.pdf_url || 'Not provided',true)}</div><div class="mod-detail-actions">${status === 'pending' ? `<button class="mod-btn approve" data-mod-status="approved" data-mod-id="${esc(book.id)}">Approve submission</button><button class="mod-btn reject" data-mod-status="rejected" data-mod-id="${esc(book.id)}">Reject submission</button>` : status === 'rejected' ? `<button class="mod-btn approve" data-mod-status="approved" data-mod-id="${esc(book.id)}">Approve submission</button>` : ''}<button class="mod-btn view" data-mod-close>Close</button></div>`;
  modal.hidden = false;
}

async function ensureAdminToken() {
  if (!isAdmin()) throw new Error('Administrator authorization required.');
  if (String(state.token || '').startsWith('tok_')) return state.token;
  const auth = window.firebase?.auth?.();
  const user = auth?.currentUser;
  if (!user) throw new Error('Administrator Firebase session is not ready. Please sign in again.');
  const firebaseToken = await user.getIdToken(true);
  const res = await withTimeout(apiFetch('/api/auth/firebase', { method:'POST', headers:{ Authorization:`Bearer ${firebaseToken}`, 'Content-Type':'application/json' }, body:'{}' }), 7500, 'Admin session exchange timed out.');
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success || data.is_admin !== true) throw new Error(data.error || 'Server could not verify admin access.');
  state.token = data.token;
  state.isAdmin = true;
  return data.token;
}

async function updateStatus(id, status, button) {
  if (!id || !['approved','rejected'].includes(status)) return;
  const book = books.find(b => String(b.id) === String(id));
  if (!book) return;
  if (status === 'rejected' && !window.confirm(`Reject “${book.title || 'this submission'}”?`)) return;
  if (button) { button.disabled = true; button.textContent = status === 'approved' ? 'Approving…' : 'Rejecting…'; }
  try {
    await ensureAdminToken();
    const payload = { status };
    if (status === 'rejected') payload.rejection_reason = 'Rejected by Bookora administrator after moderation review.';
    const res = await withTimeout(apiFetch(`/api/admin/books/${encodeURIComponent(id)}`, { method:'POST', headers:{ Authorization:`Bearer ${state.token}`, 'Content-Type':'application/json' }, body:JSON.stringify(payload) }), 8000, 'Moderation update timed out.');
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(data.error || 'Moderation update failed.');
    const updated = data.book || { ...book, status };
    const index = books.findIndex(b => String(b.id) === String(id));
    if (index >= 0) books[index] = updated;
    renderList();
    document.getElementById('mod-detail-modal')?.setAttribute('hidden','');
    Toast.show(status === 'approved' ? 'eBook approved and saved to Firebase.' : 'eBook rejected and saved to Firebase.', 'success');
  } catch (error) {
    console.error('[Moderation] status update:', error);
    Toast.show(error?.message || 'Could not update submission.', 'error');
    if (button) { button.disabled = false; button.textContent = status === 'approved' ? 'Approve' : 'Reject'; }
  }
}

function bindEvents() {
  if (initialized) return;
  initialized = true;
  document.getElementById('mod-refresh')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    await loadBooks();
    button.disabled = false;
  });
  document.getElementById('mod-search')?.addEventListener('input', event => { searchTerm = event.target.value; renderList(); });
  document.querySelectorAll('[data-mod-filter]').forEach(tab => tab.addEventListener('click', () => {
    activeFilter = tab.dataset.modFilter || 'pending';
    document.querySelectorAll('[data-mod-filter]').forEach(x => x.classList.toggle('active', x === tab));
    renderList();
  }));
  document.addEventListener('click', event => {
    const retry = event.target.closest?.('#mod-inline-retry');
    if (retry) { retry.disabled = true; retry.textContent = 'Retrying…'; void loadBooks(); return; }
    const close = event.target.closest?.('[data-mod-close]');
    if (close) { const modal = document.getElementById('mod-detail-modal'); if (modal) modal.hidden = true; return; }
    const view = event.target.closest?.('[data-mod-view]');
    if (view) { const book = books.find(b => String(b.id) === String(view.dataset.modView)); openDetails(book); return; }
    const action = event.target.closest?.('[data-mod-status]');
    if (action) { void updateStatus(action.dataset.modId, action.dataset.modStatus, action); }
  });
}

function startRealtime() {
  if (unsubscribe) { try { unsubscribe(); } catch (_) {} unsubscribe = null; }
  const db = getFirestoreInstance();
  if (!db) return;
  try {
    unsubscribe = db.collection('books').onSnapshot(snapshot => {
      books = snapshot.docs.map(doc => ({ id:String(doc.id), ...doc.data() }));
      renderList();
    }, error => {
      console.warn('[Moderation] realtime listener:', error?.message || error);
      loadBooks();
    });
  } catch (error) { console.warn('[Moderation] listener setup:', error?.message || error); }
}

export async function initAdminModerationEvents() {
  bindEvents();
  startRealtime();
  await loadBooks();
}
