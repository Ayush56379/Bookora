// Bookora - Admin Orders Management
import { getFirestoreInstance } from '../services/firebase.js';
import { state } from '../state.js';
import { Toast } from '../components/Toast.js';

const MASTER_ADMIN_EMAIL = 'ayushprajpati6@gmail.com';
let ordersCache = [];
let unsubscribeOrders = null;
let searchTerm = '';
let statusFilter = 'all';

function isAdmin() {
  const user = state.currentUser || {};
  return state.isAdmin === true || user.role === 'admin' || user.isMasterAdmin === true || String(user.email || '').toLowerCase() === MASTER_ADMIN_EMAIL;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function formatMoney(value) {
  const n = Number(value || 0);
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatDate(value) {
  if (!value) return '—';
  try {
    if (typeof value.toDate === 'function') return value.toDate().toLocaleString('en-IN');
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('en-IN');
  } catch (_) { return '—'; }
}

function badge(value, kind = 'neutral') {
  const v = String(value || 'pending').toLowerCase();
  const styles = {
    success: ['#dcfce7', '#166534'], warning: ['#fef3c7', '#92400e'],
    danger: ['#fee2e2', '#991b1b'], neutral: ['#f1f5f9', '#475569'], blue: ['#dbeafe', '#1d4ed8']
  };
  let type = kind;
  if (kind === 'auto') type = ['paid','completed','delivered','success'].includes(v) ? 'success' : ['failed','cancelled','rejected'].includes(v) ? 'danger' : 'warning';
  const [bg, color] = styles[type] || styles.neutral;
  return `<span style="display:inline-flex;padding:5px 9px;border-radius:999px;background:${bg};color:${color};font-size:10px;font-weight:800;text-transform:uppercase;white-space:nowrap;">${escapeHtml(v)}</span>`;
}

export function renderAdminOrdersPage() {
  if (!isAdmin()) {
    return `<section style="min-height:70vh;display:flex;align-items:center;justify-content:center;padding:30px;background:#f8fafc;"><div style="background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:40px;text-align:center;max-width:500px;width:100%;"><div style="font-size:40px;margin-bottom:15px;">🔒</div><h2 style="margin:0 0 10px;color:#0f172a;">Access Denied</h2><p style="margin:0;color:#64748b;">Administrator authorization is required.</p></div></section>`;
  }

  return `
    <section class="admin-orders-page" style="min-height:100vh;background:#f8fafc;padding:32px;">
      <div style="max-width:1450px;margin:0 auto;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px;flex-wrap:wrap;margin-bottom:25px;">
          <div>
            <div style="display:inline-flex;padding:7px 12px;border-radius:999px;background:#eff6ff;color:#2563eb;font-size:12px;font-weight:800;margin-bottom:10px;">🧾 ORDER MANAGEMENT</div>
            <h1 style="margin:0;color:#0f172a;font-size:32px;font-weight:800;">Orders</h1>
            <p style="margin:8px 0 0;color:#64748b;">View and manage Bookora customer orders and payment status.</p>
          </div>
          <button id="admin-orders-refresh" type="button" style="border:0;border-radius:12px;padding:13px 18px;background:#2563eb;color:#fff;font-weight:700;cursor:pointer;">↻ Refresh</button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:15px;margin-bottom:20px;">
          <div class="order-stat"><span>Total</span><strong id="orders-total">0</strong></div>
          <div class="order-stat"><span>Pending</span><strong id="orders-pending">0</strong></div>
          <div class="order-stat"><span>Paid</span><strong id="orders-paid">0</strong></div>
          <div class="order-stat"><span>Completed</span><strong id="orders-completed">0</strong></div>
          <div class="order-stat"><span>Revenue</span><strong id="orders-revenue">₹0</strong></div>
        </div>

        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:18px;margin-bottom:20px;display:flex;gap:12px;flex-wrap:wrap;">
          <input id="admin-orders-search" type="search" placeholder="Search order, book, user or payment ID..." style="flex:1;min-width:240px;padding:13px 15px;border:1px solid #cbd5e1;border-radius:11px;background:#f8fafc;color:#0f172a;outline:none;">
          <select id="admin-orders-status" style="padding:13px 15px;border:1px solid #cbd5e1;border-radius:11px;background:#fff;color:#0f172a;">
            <option value="all">All Status</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="failed">Failed</option>
          </select>
        </div>

        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;">
          <div style="overflow-x:auto;">
            <table style="width:100%;min-width:1250px;border-collapse:collapse;">
              <thead><tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;">
                <th class="admin-order-th">ORDER</th><th class="admin-order-th">BOOK</th><th class="admin-order-th">USER</th><th class="admin-order-th">AMOUNT</th><th class="admin-order-th">PAYMENT</th><th class="admin-order-th">ORDER STATUS</th><th class="admin-order-th">CREATED</th><th class="admin-order-th">ACTION</th>
              </tr></thead>
              <tbody id="admin-orders-list"><tr><td colspan="8" style="padding:50px;text-align:center;color:#64748b;">Loading orders...</td></tr></tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
    <style>
      .order-stat{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:20px}.order-stat span{display:block;color:#64748b;font-size:13px;margin-bottom:8px}.order-stat strong{display:block;color:#0f172a;font-size:26px;font-weight:800}.admin-order-th{padding:14px 16px;text-align:left;color:#64748b;font-size:11px;font-weight:800;white-space:nowrap}.admin-order-row{border-bottom:1px solid #f1f5f9}.admin-order-row:hover{background:#f8fafc}.admin-order-cell{padding:15px 16px;color:#334155;font-size:13px;vertical-align:middle}.order-action{border:0;border-radius:8px;padding:8px 10px;margin:2px;font-size:11px;font-weight:700;cursor:pointer}.order-processing{background:#dbeafe;color:#1d4ed8}.order-complete{background:#dcfce7;color:#166534}.order-cancel{background:#fee2e2;color:#991b1b}@media(max-width:700px){.admin-orders-page{padding:16px!important}.order-stat{padding:15px}}
    </style>`;
}

function updateStats() {
  const total = ordersCache.length;
  const status = o => String(o.orderStatus || o.order_status || o.status || 'pending').toLowerCase();
  const payment = o => String(o.paymentStatus || o.payment_status || '').toLowerCase();
  const paid = ordersCache.filter(o => ['paid','success','completed'].includes(payment(o)) || payment(o) === 'paid').length;
  const pending = ordersCache.filter(o => status(o) === 'pending').length;
  const completed = ordersCache.filter(o => ['completed','delivered'].includes(status(o))).length;
  const revenue = ordersCache.filter(o => ['paid','success','completed'].includes(payment(o)) || ['completed','delivered'].includes(status(o))).reduce((sum,o)=>sum+Number(o.amount||0),0);
  const set = (id,v) => { const el=document.getElementById(id); if(el) el.textContent=v; };
  set('orders-total', total); set('orders-pending', pending); set('orders-paid', paid); set('orders-completed', completed); set('orders-revenue', formatMoney(revenue));
}

function renderOrdersTable() {
  const tbody = document.getElementById('admin-orders-list');
  if (!tbody) return;
  updateStats();
  const term = searchTerm.trim().toLowerCase();
  const filtered = ordersCache.filter(o => {
    const s = String(o.orderStatus || o.order_status || o.status || 'pending').toLowerCase();
    const text = [o.id,o.orderId,o.bookId,o.bookTitle,o.book_title,o.userId,o.user_id,o.sellerId,o.seller_id,o.paymentId,o.payment_id].map(v=>String(v||'').toLowerCase()).join(' ');
    return (statusFilter === 'all' || s === statusFilter) && (!term || text.includes(term));
  });
  if (!filtered.length) { tbody.innerHTML='<tr><td colspan="8" style="padding:55px;text-align:center;color:#64748b;">No orders found.</td></tr>'; return; }
  tbody.innerHTML = filtered.map(o => {
    const id = o.id || o.orderId || '—';
    const book = o.bookTitle || o.book_title || o.bookId || '—';
    const user = o.userId || o.user_id || o.email || '—';
    const amount = Number(o.amount || 0);
    const paymentStatus = o.paymentStatus || o.payment_status || 'pending';
    const orderStatus = o.orderStatus || o.order_status || o.status || 'pending';
    const paymentId = o.paymentId || o.payment_id || o.payment_id || '—';
    const created = o.createdAt || o.created_at || o.date;
    return `<tr class="admin-order-row"><td class="admin-order-cell"><strong style="color:#0f172a;">${escapeHtml(id)}</strong></td><td class="admin-order-cell"><strong style="color:#0f172a;display:block;max-width:260px;">${escapeHtml(book)}</strong></td><td class="admin-order-cell"><span style="font-family:monospace;font-size:11px;">${escapeHtml(user)}</span></td><td class="admin-order-cell"><strong style="color:#0f172a;">${formatMoney(amount)}</strong></td><td class="admin-order-cell">${badge(paymentStatus,'auto')}<div style="font-size:10px;color:#94a3b8;margin-top:5px;max-width:150px;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(paymentId)}</div></td><td class="admin-order-cell">${badge(orderStatus,'auto')}</td><td class="admin-order-cell" style="white-space:nowrap;">${escapeHtml(formatDate(created))}</td><td class="admin-order-cell" style="white-space:nowrap;"><button class="order-action order-processing" data-order-action="processing" data-order-id="${escapeHtml(id)}">Processing</button><button class="order-action order-complete" data-order-action="completed" data-order-id="${escapeHtml(id)}">Complete</button><button class="order-action order-cancel" data-order-action="cancelled" data-order-id="${escapeHtml(id)}">Cancel</button></td></tr>`;
  }).join('');
}

async function loadOrders() {
  if (!isAdmin()) throw new Error('Administrator authorization required.');
  const db = getFirestoreInstance();
  if (!db) throw new Error('Firestore is not available.');
  if (unsubscribeOrders) { unsubscribeOrders(); unsubscribeOrders = null; }
  unsubscribeOrders = db.collection('orders').onSnapshot(snapshot => {
    ordersCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderOrdersTable();
  }, error => {
    console.error('Orders listener error:', error);
    const tbody = document.getElementById('admin-orders-list');
    if (tbody) tbody.innerHTML='<tr><td colspan="8" style="padding:50px;text-align:center;color:#dc2626;">Unable to load orders.<br><small>Check Firestore Rules and the orders collection.</small></td></tr>';
    Toast.show('Unable to load orders.', 'error');
  });
}

async function updateOrderStatus(orderId, newStatus) {
  if (!isAdmin()) return Toast.show('Administrator authorization required.', 'error');
  const db = getFirestoreInstance();
  if (!db) return Toast.show('Firestore is not available.', 'error');
  try {
    await db.collection('orders').doc(orderId).update({ orderStatus: newStatus, order_status: newStatus, updatedAt: window.firebase?.firestore?.FieldValue?.serverTimestamp ? window.firebase.firestore.FieldValue.serverTimestamp() : new Date() });
    Toast.show(`Order marked ${newStatus}.`, 'success');
  } catch (error) {
    console.error('Order status update error:', error);
    Toast.show('Could not update order. Check Firestore Rules.', 'error');
  }
}

export function initAdminOrdersEvents() {
  const refresh = document.getElementById('admin-orders-refresh');
  const search = document.getElementById('admin-orders-search');
  const status = document.getElementById('admin-orders-status');
  if (refresh) refresh.addEventListener('click', () => loadOrders().catch(e => Toast.show(e.message || 'Unable to load orders.', 'error')));
  if (search) search.addEventListener('input', e => { searchTerm = e.target.value; renderOrdersTable(); });
  if (status) status.addEventListener('change', e => { statusFilter = e.target.value; renderOrdersTable(); });
  document.querySelectorAll('[data-order-action]').forEach(btn => btn.addEventListener('click', () => updateOrderStatus(btn.dataset.orderId, btn.dataset.orderAction)));
  loadOrders().catch(e => Toast.show(e.message || 'Unable to load orders.', 'error'));
}
