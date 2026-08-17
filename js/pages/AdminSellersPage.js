// Bookora - Admin Seller Management
// Firebase Authentication + Firestore
// ------------------------------------------------------------

import { getFirestoreInstance } from '../services/firebase.js';
import { state } from '../state.js';
import { Toast } from '../components/Toast.js';

const MASTER_ADMIN_EMAIL = 'ayushprajpati6@gmail.com';

let unsubscribeSellers = null;
let sellersCache = [];
let searchTerm = '';
let statusFilter = 'all';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
  return state.isAdmin === true ||
    user?.role === 'admin' ||
    user?.isMasterAdmin === true ||
    user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL;
}

function statusClass(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'approved' || value === 'active') return 'seller-status-approved';
  if (value === 'rejected') return 'seller-status-rejected';
  if (value === 'suspended') return 'seller-status-suspended';
  return 'seller-status-pending';
}

export function renderAdminSellersPage() {
  if (!isCurrentAdmin()) {
    return `
      <section style="min-height:70vh;display:flex;align-items:center;justify-content:center;padding:40px;background:#f8fafc;">
        <div style="max-width:500px;width:100%;background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:40px;text-align:center;box-shadow:0 10px 30px rgba(15,23,42,.08);">
          <div style="font-size:42px;margin-bottom:15px;">🔒</div>
          <h2 style="margin:0 0 10px;color:#0f172a;">Access Denied</h2>
          <p style="margin:0;color:#64748b;line-height:1.6;">Administrator authorization is required.</p>
        </div>
      </section>
    `;
  }

  return `
    <section class="admin-sellers-page" style="min-height:100vh;background:#f8fafc;padding:32px;">
      <div style="max-width:1400px;margin:0 auto;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:28px;">
          <div>
            <div style="display:inline-flex;align-items:center;gap:8px;padding:7px 12px;border-radius:999px;background:#f5f3ff;color:#6d28d9;font-size:13px;font-weight:700;margin-bottom:12px;">
              ✍️ ADMIN SELLER MANAGEMENT
            </div>
            <h1 style="margin:0;font-size:32px;font-weight:800;color:#0f172a;">Sellers</h1>
            <p style="margin:8px 0 0;color:#64748b;">Review applications, approve creators and manage seller access.</p>
          </div>
          <button id="admin-sellers-refresh" type="button" class="seller-primary-btn">↻ Refresh Sellers</button>
        </div>

        <div class="seller-stats-grid">
          <div class="seller-stat-card"><span>Total Applications</span><strong id="sellers-total">0</strong></div>
          <div class="seller-stat-card"><span>Pending</span><strong id="sellers-pending">0</strong></div>
          <div class="seller-stat-card"><span>Approved</span><strong id="sellers-approved">0</strong></div>
          <div class="seller-stat-card"><span>Rejected / Suspended</span><strong id="sellers-blocked">0</strong></div>
        </div>

        <div class="seller-toolbar">
          <input id="admin-sellers-search" type="search" placeholder="Search by name or email..." autocomplete="off">
          <select id="admin-sellers-filter">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div class="seller-table-wrap">
          <div style="overflow-x:auto;">
            <table class="seller-table">
              <thead>
                <tr>
                  <th>SELLER</th>
                  <th>EMAIL</th>
                  <th>STATUS</th>
                  <th>SELLER ACCESS</th>
                  <th>CREATED</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody id="admin-sellers-list">
                <tr><td colspan="6" class="seller-loading">Loading sellers...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>

    <style>
      .admin-sellers-page *{box-sizing:border-box}
      .seller-stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px;margin-bottom:22px}
      .seller-stat-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:20px;box-shadow:0 5px 20px rgba(15,23,42,.04)}
      .seller-stat-card span{display:block;color:#64748b;font-size:13px;font-weight:600;margin-bottom:8px}
      .seller-stat-card strong{display:block;color:#0f172a;font-size:28px;font-weight:800}
      .seller-primary-btn{border:0;border-radius:12px;background:#2563eb;color:#fff;padding:13px 18px;font-weight:700;cursor:pointer;box-shadow:0 8px 20px rgba(37,99,235,.20)}
      .seller-toolbar{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:18px;margin-bottom:20px;display:flex;gap:12px;flex-wrap:wrap}
      .seller-toolbar input{flex:1;min-width:220px;padding:14px 16px;border:1px solid #cbd5e1;border-radius:12px;outline:none;font-size:15px;background:#f8fafc;color:#0f172a}
      .seller-toolbar select{padding:14px 16px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;color:#0f172a;font-size:14px;min-width:170px}
      .seller-table-wrap{background:#fff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 5px 20px rgba(15,23,42,.04)}
      .seller-table{width:100%;border-collapse:collapse;min-width:1000px}
      .seller-table th{background:#f8fafc;border-bottom:1px solid #e2e8f0;text-align:left;padding:14px 16px;font-size:11px;letter-spacing:.05em;color:#64748b;font-weight:800;white-space:nowrap}
      .seller-table td{padding:15px 16px;border-bottom:1px solid #f1f5f9;color:#334155;font-size:14px;vertical-align:middle}
      .seller-table tbody tr:hover{background:#f8fafc}
      .seller-user{display:flex;align-items:center;gap:11px;min-width:190px}
      .seller-avatar{width:40px;height:40px;border-radius:50%;background:#ede9fe;color:#6d28d9;display:flex;align-items:center;justify-content:center;font-weight:800}
      .seller-name{font-weight:750;color:#0f172a}
      .seller-bio{font-size:11px;color:#94a3b8;margin-top:3px;max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .seller-status{display:inline-flex;padding:5px 9px;border-radius:999px;font-size:11px;font-weight:800}
      .seller-status-approved{background:#dcfce7;color:#15803d}
      .seller-status-pending{background:#fef3c7;color:#a16207}
      .seller-status-rejected{background:#fee2e2;color:#b91c1c}
      .seller-status-suspended{background:#e2e8f0;color:#475569}
      .seller-access-active{color:#15803d;font-weight:700}
      .seller-access-inactive{color:#64748b;font-weight:600}
      .seller-actions{display:flex;gap:7px;flex-wrap:wrap}
      .seller-action{border:0;border-radius:8px;padding:8px 11px;font-weight:700;cursor:pointer;font-size:12px}
      .seller-approve{background:#dcfce7;color:#15803d}
      .seller-reject{background:#fee2e2;color:#b91c1c}
      .seller-suspend{background:#fef3c7;color:#a16207}
      .seller-reactivate{background:#dbeafe;color:#1d4ed8}
      .seller-loading{text-align:center;padding:50px;color:#64748b}
      @media(max-width:700px){.admin-sellers-page{padding:16px!important}.admin-sellers-page h1{font-size:26px!important}.seller-toolbar{padding:12px}.seller-toolbar select,.seller-toolbar input{width:100%;min-width:0}}
    </style>
  `;
}

function renderSellersTable() {
  const tbody = document.getElementById('admin-sellers-list');
  if (!tbody) return;

  const query = searchTerm.trim().toLowerCase();
  const filtered = sellersCache.filter(seller => {
    const status = String(seller.status || 'pending').toLowerCase();
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    const text = `${seller.name || ''} ${seller.email || ''} ${seller.bio || ''}`.toLowerCase();
    return matchesStatus && (!query || text.includes(query));
  });

  const pending = sellersCache.filter(s => String(s.status).toLowerCase() === 'pending').length;
  const approved = sellersCache.filter(s => String(s.status).toLowerCase() === 'approved').length;
  const blocked = sellersCache.filter(s => ['rejected','suspended'].includes(String(s.status).toLowerCase())).length;

  document.getElementById('sellers-total')?.replaceChildren(document.createTextNode(String(sellersCache.length)));
  document.getElementById('sellers-pending')?.replaceChildren(document.createTextNode(String(pending)));
  document.getElementById('sellers-approved')?.replaceChildren(document.createTextNode(String(approved)));
  document.getElementById('sellers-blocked')?.replaceChildren(document.createTextNode(String(blocked)));

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="seller-loading">No seller applications found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(seller => {
    const status = String(seller.status || 'pending').toLowerCase();
    const accessActive = String(seller.sellerStatus || '').toLowerCase() === 'active';
    const initials = String(seller.name || seller.email || 'S').split(/\s+/).slice(0,2).map(x => x[0] || '').join('').toUpperCase();

    let actionButtons = '';
    if (status === 'pending') {
      actionButtons = `
        <button class="seller-action seller-approve" data-seller-action="approve" data-id="${escapeHtml(seller.id)}">✓ Approve</button>
        <button class="seller-action seller-reject" data-seller-action="reject" data-id="${escapeHtml(seller.id)}">✕ Reject</button>
      `;
    } else if (status === 'approved') {
      actionButtons = `<button class="seller-action seller-suspend" data-seller-action="suspend" data-id="${escapeHtml(seller.id)}">Suspend</button>`;
    } else {
      actionButtons = `<button class="seller-action seller-reactivate" data-seller-action="approve" data-id="${escapeHtml(seller.id)}">Reactivate</button>`;
    }

    return `
      <tr>
        <td>
          <div class="seller-user">
            <div class="seller-avatar">${escapeHtml(initials)}</div>
            <div>
              <div class="seller-name">${escapeHtml(seller.name || 'Unnamed seller')}</div>
              <div class="seller-bio">${escapeHtml(seller.bio || 'Bookora creator')}</div>
            </div>
          </div>
        </td>
        <td>${escapeHtml(seller.email || '—')}</td>
        <td><span class="seller-status ${statusClass(status)}">${escapeHtml(status.toUpperCase())}</span></td>
        <td><span class="${accessActive ? 'seller-access-active' : 'seller-access-inactive'}">${accessActive ? 'ACTIVE' : 'INACTIVE'}</span></td>
        <td>${escapeHtml(formatDate(seller.createdAt))}</td>
        <td><div class="seller-actions">${actionButtons}</div></td>
      </tr>
    `;
  }).join('');
}

async function updateSeller(sellerId, action) {
  if (!isCurrentAdmin()) throw new Error('Administrator authorization required.');

  const db = getFirestoreInstance();
  if (!db) throw new Error('Firestore is not available.');

  const sellerRef = db.collection('sellers').doc(sellerId);
  const sellerSnap = await sellerRef.get();
  if (!sellerSnap.exists) throw new Error('Seller application not found.');

  const seller = sellerSnap.data();
  const now = window.firebase.firestore.FieldValue.serverTimestamp();

  if (action === 'approve') {
    await sellerRef.set({
      status: 'approved',
      sellerStatus: 'active',
      approvedAt: now,
      updatedAt: now
    }, { merge: true });

    await db.collection('users').doc(seller.uid || sellerId).set({
      role: 'seller',
      seller_status: 'approved',
      status: 'active',
      updatedAt: now
    }, { merge: true });

    return 'Seller approved successfully.';
  }

  if (action === 'reject') {
    await sellerRef.set({
      status: 'rejected',
      sellerStatus: 'inactive',
      rejectedAt: now,
      updatedAt: now
    }, { merge: true });

    await db.collection('users').doc(seller.uid || sellerId).set({
      seller_status: 'rejected',
      updatedAt: now
    }, { merge: true });

    return 'Seller application rejected.';
  }

  if (action === 'suspend') {
    await sellerRef.set({
      status: 'suspended',
      sellerStatus: 'inactive',
      suspendedAt: now,
      updatedAt: now
    }, { merge: true });

    await db.collection('users').doc(seller.uid || sellerId).set({
      seller_status: 'suspended',
      updatedAt: now
    }, { merge: true });

    return 'Seller suspended.';
  }

  throw new Error('Unknown seller action.');
}

async function loadSellers() {
  const db = getFirestoreInstance();
  if (!db) throw new Error('Firestore is not available.');
  if (!isCurrentAdmin()) throw new Error('Administrator authorization required.');

  if (unsubscribeSellers) {
    unsubscribeSellers();
    unsubscribeSellers = null;
  }

  unsubscribeSellers = db.collection('sellers').onSnapshot(
    snapshot => {
      sellersCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      sellersCache.sort((a,b) => {
        const av = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bv = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return bv - av;
      });
      renderSellersTable();
    },
    error => {
      console.error('Sellers listener error:', error);
      const tbody = document.getElementById('admin-sellers-list');
      if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="seller-loading" style="color:#dc2626;">Unable to load sellers. Check Firestore rules.</td></tr>`;
      Toast.show('Unable to load sellers.', 'error');
    }
  );
}

export function initAdminSellersEvents() {
  if (!isCurrentAdmin()) return;

  const search = document.getElementById('admin-sellers-search');
  const filter = document.getElementById('admin-sellers-filter');
  const refresh = document.getElementById('admin-sellers-refresh');

  search?.addEventListener('input', e => {
    searchTerm = e.target.value || '';
    renderSellersTable();
  });

  filter?.addEventListener('change', e => {
    statusFilter = e.target.value || 'all';
    renderSellersTable();
  });

  refresh?.addEventListener('click', async () => {
    refresh.disabled = true;
    refresh.textContent = 'Refreshing...';
    try {
      await loadSellers();
      Toast.show('Seller list refreshed.', 'success');
    } catch (error) {
      console.error(error);
      Toast.show(error.message || 'Unable to refresh sellers.', 'error');
    } finally {
      refresh.disabled = false;
      refresh.textContent = '↻ Refresh Sellers';
    }
  });

  document.getElementById('admin-sellers-list')?.addEventListener('click', async e => {
    const button = e.target.closest('[data-seller-action]');
    if (!button) return;

    const action = button.dataset.sellerAction;
    const sellerId = button.dataset.id;
    const seller = sellersCache.find(item => item.id === sellerId);
    if (!seller) return;

    const label = action === 'approve' ? 'approve' : action === 'reject' ? 'reject' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${label} ${seller.name || seller.email || 'this seller'}?`)) return;

    button.disabled = true;
    try {
      const message = await updateSeller(sellerId, action);
      Toast.show(message, 'success');
    } catch (error) {
      console.error('Seller action error:', error);
      Toast.show(error.message || 'Seller action failed.', 'error');
      button.disabled = false;
    }
  });

  loadSellers().catch(error => {
    console.error('Initial seller load error:', error);
    Toast.show(error.message || 'Unable to load sellers.', 'error');
  });

  window.addEventListener('beforeunload', () => {
    if (unsubscribeSellers) unsubscribeSellers();
  }, { once: true });
}
