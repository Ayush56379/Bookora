// Bookora - Admin Seller Management
// Firestore is used for live seller application data; approval/rejection/suspension
// decisions are sent to the protected backend so the client cannot grant access.

import { getFirestoreInstance } from '../services/firebase.js';
import { apiFetch } from '../config.js';
import { state } from '../state.js';
import { Toast } from '../components/Toast.js';

const MASTER_ADMIN_EMAIL = 'ayushprajpati6@gmail.com';
let unsubscribeSellers = null;
let sellersCache = [];
let searchTerm = '';
let statusFilter = 'all';

const escapeHtml = value => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/\"/g, '&quot;').replace(/'/g, '&#039;');

function formatDate(value) {
  if (!value) return '—';
  try {
    if (value.toDate) return value.toDate().toLocaleString();
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toLocaleString();
  } catch (_) {}
  return '—';
}

function isCurrentAdmin() {
  const user = state.currentUser;
  return state.isAdmin === true || user?.role === 'admin' || user?.isMasterAdmin === true || user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL;
}

function statusClass(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'approved' || value === 'active') return 'seller-status-approved';
  if (value === 'rejected') return 'seller-status-rejected';
  if (value === 'suspended') return 'seller-status-suspended';
  return 'seller-status-pending';
}

function mask(value) {
  const text = String(value || '');
  if (!text) return '—';
  if (text.length <= 4) return '****';
  return `${'•'.repeat(Math.max(2, text.length - 4))}${text.slice(-4)}`;
}

export function renderAdminSellersPage() {
  if (!isCurrentAdmin()) {
    return `<section style="min-height:70vh;display:flex;align-items:center;justify-content:center;padding:40px;background:#f8fafc;"><div style="max-width:500px;width:100%;background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:40px;text-align:center;box-shadow:0 10px 30px rgba(15,23,42,.08);"><h2 style="margin:0 0 10px;color:#0f172a;">Access Denied</h2><p style="margin:0;color:#64748b;line-height:1.6;">Administrator authorization is required.</p></div></section>`;
  }

  return `
    <section class="admin-sellers-page" style="min-height:100vh;background:#f8fafc;padding:32px;">
      <div style="max-width:1500px;margin:0 auto;">
        <div class="seller-admin-header">
          <div><div class="seller-admin-badge">ADMIN SELLER MANAGEMENT</div><h1>Sellers</h1><p>Review complete creator applications, approve seller access and manage existing seller status.</p></div>
          <button id="admin-sellers-refresh" type="button" class="seller-primary-btn">Refresh Sellers</button>
        </div>
        <div class="seller-stats-grid">
          <div class="seller-stat-card"><span>Total Applications</span><strong id="sellers-total">0</strong></div>
          <div class="seller-stat-card"><span>Pending</span><strong id="sellers-pending">0</strong></div>
          <div class="seller-stat-card"><span>Approved</span><strong id="sellers-approved">0</strong></div>
          <div class="seller-stat-card"><span>Rejected / Suspended</span><strong id="sellers-blocked">0</strong></div>
        </div>
        <div class="seller-toolbar"><input id="admin-sellers-search" type="search" placeholder="Search publisher, name, email or application ID..." autocomplete="off"><select id="admin-sellers-filter"><option value="all">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="suspended">Suspended</option></select></div>
        <div class="seller-table-wrap"><div style="overflow-x:auto;"><table class="seller-table"><thead><tr><th>SELLER</th><th>EMAIL</th><th>TYPE</th><th>STATUS</th><th>ACCESS</th><th>SUBMITTED</th><th>ACTION</th></tr></thead><tbody id="admin-sellers-list"><tr><td colspan="7" class="seller-loading">Loading seller applications...</td></tr></tbody></table></div></div>
      </div>
    </section>
    <div id="seller-detail-modal" class="seller-modal" hidden><div class="seller-modal-backdrop" data-close-seller-modal></div><div class="seller-modal-card"><div class="seller-modal-head"><div><div class="seller-modal-kicker">SELLER APPLICATION</div><h2 id="seller-detail-title">Application details</h2></div><button type="button" class="seller-modal-close" data-close-seller-modal>Close</button></div><div id="seller-detail-content" class="seller-detail-content"></div></div></div>
    <style>
      .admin-sellers-page *{box-sizing:border-box}.seller-admin-header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:28px}.seller-admin-badge{display:inline-flex;padding:7px 12px;border-radius:999px;background:#f5f3ff;color:#6d28d9;font-size:12px;font-weight:800;margin-bottom:10px}.seller-admin-header h1{margin:0;font-size:32px;font-weight:800;color:#0f172a}.seller-admin-header p{margin:8px 0 0;color:#64748b;line-height:1.5}.seller-primary-btn{border:0;border-radius:12px;background:#2563eb;color:#fff;padding:13px 18px;font-weight:700;cursor:pointer}.seller-stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px;margin-bottom:22px}.seller-stat-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:20px}.seller-stat-card span{display:block;color:#64748b;font-size:13px;font-weight:600;margin-bottom:8px}.seller-stat-card strong{display:block;color:#0f172a;font-size:28px;font-weight:800}.seller-toolbar{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:18px;margin-bottom:20px;display:flex;gap:12px;flex-wrap:wrap}.seller-toolbar input{flex:1;min-width:240px;padding:14px 16px;border:1px solid #cbd5e1;border-radius:12px;outline:none;font-size:15px;background:#f8fafc;color:#0f172a}.seller-toolbar select{padding:14px 16px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;color:#0f172a;font-size:14px;min-width:170px}.seller-table-wrap{background:#fff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden}.seller-table{width:100%;border-collapse:collapse;min-width:1100px}.seller-table th{background:#f8fafc;border-bottom:1px solid #e2e8f0;text-align:left;padding:14px 16px;font-size:11px;letter-spacing:.05em;color:#64748b;font-weight:800;white-space:nowrap}.seller-table td{padding:15px 16px;border-bottom:1px solid #f1f5f9;color:#334155;font-size:14px;vertical-align:middle}.seller-user{display:flex;align-items:center;gap:11px;min-width:210px}.seller-avatar{width:40px;height:40px;border-radius:50%;background:#ede9fe;color:#6d28d9;display:flex;align-items:center;justify-content:center;font-weight:800}.seller-name{font-weight:750;color:#0f172a}.seller-bio{font-size:11px;color:#94a3b8;margin-top:3px;max-width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.seller-status{display:inline-flex;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:800}.seller-status-approved{background:#dcfce7;color:#15803d}.seller-status-pending{background:#fef3c7;color:#a16207}.seller-status-rejected{background:#fee2e2;color:#b91c1c}.seller-status-suspended{background:#e2e8f0;color:#475569}.seller-access-active{color:#15803d;font-weight:700}.seller-access-inactive{color:#64748b;font-weight:600}.seller-actions{display:flex;gap:7px;flex-wrap:wrap}.seller-action{border:0;border-radius:8px;padding:8px 10px;font-weight:700;cursor:pointer;font-size:12px}.seller-view{background:#e0e7ff;color:#3730a3}.seller-approve{background:#dcfce7;color:#15803d}.seller-reject{background:#fee2e2;color:#b91c1c}.seller-suspend{background:#fef3c7;color:#a16207}.seller-reactivate{background:#dbeafe;color:#1d4ed8}.seller-loading{text-align:center;padding:50px;color:#64748b}.seller-modal[hidden]{display:none}.seller-modal{position:fixed;inset:0;z-index:10000}.seller-modal-backdrop{position:absolute;inset:0;background:rgba(15,23,42,.5)}.seller-modal-card{position:relative;z-index:1;width:min(920px,calc(100% - 28px));max-height:calc(100vh - 40px);overflow:auto;margin:20px auto;background:#fff;border-radius:18px;padding:24px;box-shadow:0 24px 80px rgba(15,23,42,.25)}.seller-modal-head{display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid #e2e8f0;padding-bottom:16px;margin-bottom:18px}.seller-modal-kicker{font-size:11px;font-weight:800;color:#6d28d9}.seller-modal-head h2{margin:5px 0 0;color:#0f172a}.seller-modal-close{border:1px solid #cbd5e1;background:#fff;border-radius:9px;padding:8px 12px;cursor:pointer}.seller-detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.seller-detail-item{border:1px solid #e2e8f0;border-radius:10px;padding:11px}.seller-detail-item small{display:block;color:#64748b;font-size:11px;margin-bottom:4px}.seller-detail-item strong{display:block;color:#0f172a;font-size:13px;word-break:break-word}.seller-detail-full{grid-column:1/-1}.seller-detail-section{margin-top:18px}.seller-detail-section h3{font-size:14px;margin:0 0 9px;color:#0f172a}.seller-chip{display:inline-block;margin:3px;padding:4px 8px;border-radius:999px;background:#f1f5f9;color:#334155;font-size:11px}.seller-detail-reason{padding:10px;border-radius:10px;background:#fff7ed;color:#9a3412;font-size:12px;line-height:1.5}@media(max-width:700px){.admin-sellers-page{padding:16px!important}.seller-admin-header h1{font-size:26px}.seller-toolbar input,.seller-toolbar select{width:100%;min-width:0}.seller-detail-grid{grid-template-columns:1fr}.seller-detail-full{grid-column:auto}}
    </style>
  `;
}

function renderSellersTable() {
  const tbody = document.getElementById('admin-sellers-list');
  if (!tbody) return;
  const query = searchTerm.trim().toLowerCase();
  const filtered = sellersCache.filter(seller => {
    const status = String(seller.status || 'pending').toLowerCase();
    const text = `${seller.name || ''} ${seller.publisherName || ''} ${seller.store_name || ''} ${seller.email || ''} ${seller.applicationId || seller.id || ''}`.toLowerCase();
    return (statusFilter === 'all' || status === statusFilter) && (!query || text.includes(query));
  });
  const count = status => sellersCache.filter(s => String(s.status || '').toLowerCase() === status).length;
  document.getElementById('sellers-total')?.replaceChildren(document.createTextNode(String(sellersCache.length)));
  document.getElementById('sellers-pending')?.replaceChildren(document.createTextNode(String(count('pending'))));
  document.getElementById('sellers-approved')?.replaceChildren(document.createTextNode(String(count('approved'))));
  document.getElementById('sellers-blocked')?.replaceChildren(document.createTextNode(String(sellersCache.filter(s => ['rejected','suspended'].includes(String(s.status || '').toLowerCase())).length)));
  if (!filtered.length) { tbody.innerHTML = `<tr><td colspan="7" class="seller-loading">No seller applications found.</td></tr>`; return; }
  tbody.innerHTML = filtered.map(seller => {
    const status = String(seller.status || 'pending').toLowerCase();
    const accessActive = String(seller.sellerStatus || '').toLowerCase() === 'active';
    const name = seller.publisherName || seller.store_name || seller.name || 'Unnamed seller';
    const initials = String(name).split(/\s+/).slice(0,2).map(x => x[0] || '').join('').toUpperCase() || 'S';
    let actionButtons = `<button class="seller-action seller-view" data-seller-action="view" data-id="${escapeHtml(seller.id || seller.uid || seller.user_id)}">View</button>`;
    if (status === 'pending') actionButtons += `<button class="seller-action seller-approve" data-seller-action="approve" data-id="${escapeHtml(seller.id || seller.uid || seller.user_id)}">Approve</button><button class="seller-action seller-reject" data-seller-action="reject" data-id="${escapeHtml(seller.id || seller.uid || seller.user_id)}">Reject</button>`;
    else if (status === 'approved') actionButtons += `<button class="seller-action seller-suspend" data-seller-action="suspend" data-id="${escapeHtml(seller.id || seller.uid || seller.user_id)}">Suspend</button>`;
    else actionButtons += `<button class="seller-action seller-reactivate" data-seller-action="approve" data-id="${escapeHtml(seller.id || seller.uid || seller.user_id)}">Reactivate</button>`;
    return `<tr><td><div class="seller-user"><div class="seller-avatar">${escapeHtml(initials)}</div><div><div class="seller-name">${escapeHtml(name)}</div><div class="seller-bio">${escapeHtml(seller.authorBio || seller.bio || 'Bookora creator')}</div></div></div></td><td>${escapeHtml(seller.email || '—')}</td><td>${escapeHtml(seller.publisherType || '—')}</td><td><span class="seller-status ${statusClass(status)}">${escapeHtml(status.toUpperCase())}</span></td><td><span class="${accessActive ? 'seller-access-active' : 'seller-access-inactive'}">${accessActive ? 'ACTIVE' : 'INACTIVE'}</span></td><td>${escapeHtml(formatDate(seller.submittedAt || seller.createdAt || seller.created_at))}</td><td><div class="seller-actions">${actionButtons}</div></td></tr>`;
  }).join('');
}

function showSellerDetails(seller) {
  const modal = document.getElementById('seller-detail-modal');
  const content = document.getElementById('seller-detail-content');
  const title = document.getElementById('seller-detail-title');
  if (!modal || !content || !seller) return;
  title.textContent = seller.publisherName || seller.store_name || seller.name || 'Seller application';
  const chips = values => (Array.isArray(values) ? values : []).map(v => `<span class="seller-chip">${escapeHtml(v)}</span>`).join('') || '—';
  const item = (label, value, full = false) => `<div class="seller-detail-item ${full ? 'seller-detail-full' : ''}"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value || '—')}</strong></div>`;
  content.innerHTML = `<div class="seller-detail-grid">${item('Application ID', seller.applicationId || seller.id)}${item('User ID', seller.user_id || seller.uid)}${item('Publisher / Store', seller.publisherName || seller.store_name)}${item('Legal / Full Name', seller.legalName || seller.name)}${item('Email', seller.email)}${item('Phone', seller.phone)}${item('Publisher Type', seller.publisherType)}${item('Previous Books', seller.previousBooksCount)}${item('Country', seller.country)}${item('State', seller.state)}${item('City', seller.city)}${item('Postal/PIN', seller.postalCode)}${item('Bank', seller.bankName || seller.payout_bank)}${item('Account Holder', seller.accountHolderName)}${item('Account', seller.payout_account_masked || (seller.payout_account_last4 ? `****${seller.payout_account_last4}` : '—'))}${item('IFSC', seller.ifscCode)}${item('UPI', seller.upiIdMasked)}${item('PAN', seller.panLast4 ? `****${seller.panLast4}` : '—')}${item('Payout Method', seller.payoutMethod)}${item('Status', seller.status)}${item('Submitted', formatDate(seller.submittedAt || seller.createdAt))}${item('Website', seller.website)}${item('Portfolio', seller.portfolioUrl)}</div><div class="seller-detail-section"><h3>Categories</h3><div>${chips(seller.categories)}</div></div><div class="seller-detail-section"><h3>Languages</h3><div>${chips(seller.languages)}</div></div><div class="seller-detail-section"><h3>Ebook Formats</h3><div>${chips(seller.ebookFormats)}</div></div><div class="seller-detail-section"><h3>Publishing Experience</h3><div class="seller-detail-reason">${escapeHtml(seller.authorBio || seller.bio || '—')}</div></div><div class="seller-detail-section"><h3>Planned Catalogue</h3><div class="seller-detail-reason">${escapeHtml(seller.publishingDescription || '—')}</div></div><div class="seller-detail-section"><h3>Rights Declaration</h3><div class="seller-detail-reason">${escapeHtml(seller.rightsDeclaration || '—')}</div></div>${seller.rejectionReason ? `<div class="seller-detail-section"><h3>Rejection Reason</h3><div class="seller-detail-reason">${escapeHtml(seller.rejectionReason)}</div></div>` : ''}${seller.suspensionReason ? `<div class="seller-detail-section"><h3>Suspension Reason</h3><div class="seller-detail-reason">${escapeHtml(seller.suspensionReason)}</div></div>` : ''}`;
  modal.hidden = false;
}

async function updateSeller(sellerId, action, reason = '') {
  if (!isCurrentAdmin()) throw new Error('Administrator authorization required.');
  const res = await apiFetch('/api/admin/sellers/action', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.token}` }, body: JSON.stringify({ sellerId, action, reason }) });
  let data = {};
  try { data = await res.json(); } catch (_) {}
  if (!res.ok || !data.success) throw new Error(data.error || 'Seller action failed.');
  return data;
}

async function loadSellers() {
  const db = getFirestoreInstance();
  if (!db) throw new Error('Firestore is not available.');
  if (!isCurrentAdmin()) throw new Error('Administrator authorization required.');
  if (unsubscribeSellers) { unsubscribeSellers(); unsubscribeSellers = null; }
  unsubscribeSellers = db.collection('sellers').onSnapshot(snapshot => {
    sellersCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    sellersCache.sort((a,b) => String(b.submittedAt || b.createdAt || b.created_at || '').localeCompare(String(a.submittedAt || a.createdAt || a.created_at || '')));
    renderSellersTable();
  }, error => {
    console.error('Sellers Firestore listener error:', error);
    const tbody = document.getElementById('admin-sellers-list');
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="seller-loading" style="color:#dc2626;">Unable to load seller applications from Firestore.</td></tr>`;
    Toast.show('Unable to load sellers from Firebase.', 'error');
  });
}

export function initAdminSellersEvents() {
  if (!isCurrentAdmin()) return;
  const search = document.getElementById('admin-sellers-search');
  const filter = document.getElementById('admin-sellers-filter');
  const refresh = document.getElementById('admin-sellers-refresh');
  search?.addEventListener('input', e => { searchTerm = e.target.value || ''; renderSellersTable(); });
  filter?.addEventListener('change', e => { statusFilter = e.target.value || 'all'; renderSellersTable(); });
  refresh?.addEventListener('click', async () => { refresh.disabled = true; refresh.textContent = 'Refreshing...'; try { await loadSellers(); Toast.show('Seller list refreshed.', 'success'); } catch (error) { Toast.show(error.message || 'Unable to refresh sellers.', 'error'); } finally { refresh.disabled = false; refresh.textContent = 'Refresh Sellers'; } });
  document.querySelectorAll('[data-close-seller-modal]').forEach(el => el.addEventListener('click', () => { const modal = document.getElementById('seller-detail-modal'); if (modal) modal.hidden = true; }));
  document.getElementById('admin-sellers-list')?.addEventListener('click', async event => {
    const button = event.target.closest('[data-seller-action]');
    if (!button) return;
    const action = button.dataset.sellerAction;
    const sellerId = button.dataset.id;
    const seller = sellersCache.find(item => String(item.id || item.uid || item.user_id) === String(sellerId));
    if (!seller) return;
    if (action === 'view') { showSellerDetails(seller); return; }
    let reason = '';
    if (action === 'reject' || action === 'suspend') {
      reason = window.prompt(`Enter the reason to ${action} this seller:`) || '';
      if (reason.trim().length < 3) { Toast.show('A reason is required.', 'warning'); return; }
    } else if (!window.confirm(`Are you sure you want to ${action === 'approve' ? 'approve' : 'reactivate'} ${seller.publisherName || seller.name || seller.email || 'this seller'}?`)) return;
    button.disabled = true;
    try {
      const data = await updateSeller(sellerId, action, reason);
      Toast.show(`Seller ${data.status === 'approved' ? 'approved' : data.status}.`, 'success');
    } catch (error) {
      console.error('Seller action error:', error);
      Toast.show(error.message || 'Seller action failed.', 'error');
      button.disabled = false;
    }
  });
  loadSellers().catch(error => Toast.show(error.message || 'Unable to load sellers.', 'error'));
  window.addEventListener('beforeunload', () => { if (unsubscribeSellers) unsubscribeSellers(); }, { once: true });
}
