// Bookora Admin Coupons UI. Adds a secure coupon manager to Admin Settings.
import { state } from './state.js';
import { Toast } from './components/Toast.js';

const API = (window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com').replace(/\/$/, '');
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function api(path, options = {}) {
  const headers = { Accept: 'application/json', ...(options.headers || {}) };
  if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const r = await fetch(`${API}${path}`, { ...options, headers, cache: 'no-store' });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

function renderManager() {
  return `<div id="bookora-coupons-panel" class="as-section" style="display:none"><h2>Coupon Management</h2>
  <p class="as-note">Create and manage Bookora promo codes. Final discount and eligibility are always calculated on the backend.</p>
  <form id="bookora-coupon-form" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px">
    <div class="as-field"><label>Coupon Code</label><input id="coupon-admin-code" maxlength="40" placeholder="BOOKORA20" required></div>
    <div class="as-field"><label>Discount Type</label><select id="coupon-admin-type"><option value="percentage">Percentage</option><option value="fixed">Fixed Amount</option></select></div>
    <div class="as-field"><label>Discount Value</label><input id="coupon-admin-value" type="number" min="0.01" step="0.01" required></div>
    <div class="as-field"><label>Maximum Discount (₹, 0 = none)</label><input id="coupon-admin-max" type="number" min="0" step="0.01" value="0"></div>
    <div class="as-field"><label>Minimum Order (₹)</label><input id="coupon-admin-min" type="number" min="0" step="0.01" value="0"></div>
    <div class="as-field"><label>Total Usage Limit (0 = unlimited)</label><input id="coupon-admin-limit" type="number" min="0" step="1" value="0"></div>
    <div class="as-field"><label>Per User Limit</label><input id="coupon-admin-user-limit" type="number" min="1" step="1" value="1"></div>
    <div class="as-field"><label>Start Date/Time</label><input id="coupon-admin-start" type="datetime-local"></div>
    <div class="as-field"><label>Expiry Date/Time</label><input id="coupon-admin-end" type="datetime-local"></div>
    <div class="as-field"><label>Product IDs (comma separated, blank = marketplace-wide)</label><input id="coupon-admin-products" placeholder="book-id-1,book-id-2"></div>
    <div class="as-field" style="display:flex;align-items:end"><button class="as-save" type="submit" style="width:100%">Create Coupon</button></div>
  </form>
  <div id="bookora-coupon-list" style="margin-top:22px"></div></div>`;
}

function toIso(id) {
  const v = document.getElementById(id)?.value || '';
  return v ? new Date(v).toISOString() : '';
}

async function loadCoupons() {
  const list = document.getElementById('bookora-coupon-list');
  if (!list) return;
  list.innerHTML = '<div class="as-note">Loading coupons…</div>';
  try {
    const data = await api('/api/admin/coupons');
    const coupons = data.coupons || [];
    if (!coupons.length) { list.innerHTML = '<div class="as-note">No coupons created yet.</div>'; return; }
    list.innerHTML = coupons.map(c => `<div style="display:flex;justify-content:space-between;gap:14px;align-items:center;border:1px solid #e2e8f0;border-radius:12px;padding:13px;margin-top:10px;flex-wrap:wrap"><div><b style="font-size:15px">${esc(c.code)}</b><div style="font-size:12px;color:#64748b;margin-top:3px">${esc(c.discount_type)} ${esc(c.discount_value)} · min ₹${Number(c.min_order_amount||0).toFixed(2)} · ${c.active===false?'Inactive':'Active'}</div></div><button class="as-secondary coupon-deactivate" data-id="${esc(c.id)}" ${c.active===false?'disabled':''}>${c.active===false?'Inactive':'Deactivate'}</button></div>`).join('');
  } catch (e) { list.innerHTML = `<div class="as-note" style="color:#b91c1c">${esc(e.message)}</div>`; }
}

function install() {
  if (!state.isAdmin) return;
  const side = document.querySelector('.as-side');
  const card = document.querySelector('.as-card');
  if (!side || !card || document.getElementById('bookora-coupons-tab')) return;
  const tab = document.createElement('button');
  tab.id = 'bookora-coupons-tab'; tab.className = 'as-tab'; tab.dataset.section = 'bookora-coupons'; tab.innerHTML = 'Coupons<span>›</span>';
  side.appendChild(tab);
  card.insertAdjacentHTML('beforeend', renderManager());

  tab.addEventListener('click', () => {
    card.querySelectorAll('.as-section').forEach(x => x.style.display = 'none');
    document.getElementById('bookora-coupons-panel').style.display = 'block';
    side.querySelectorAll('.as-tab').forEach(x => x.classList.remove('active')); tab.classList.add('active');
    loadCoupons();
  });

  document.addEventListener('submit', async e => {
    if (e.target?.id !== 'bookora-coupon-form') return;
    e.preventDefault();
    try {
      await api('/api/admin/coupons', { method:'POST', body:JSON.stringify({
        code: document.getElementById('coupon-admin-code').value,
        discount_type: document.getElementById('coupon-admin-type').value,
        discount_value: Number(document.getElementById('coupon-admin-value').value),
        max_discount: Number(document.getElementById('coupon-admin-max').value || 0),
        min_order_amount: Number(document.getElementById('coupon-admin-min').value || 0),
        usage_limit: Number(document.getElementById('coupon-admin-limit').value || 0),
        per_user_limit: Number(document.getElementById('coupon-admin-user-limit').value || 1),
        starts_at: toIso('coupon-admin-start'),
        expires_at: toIso('coupon-admin-end'),
        product_ids: document.getElementById('coupon-admin-products').value.split(',').map(x=>x.trim()).filter(Boolean),
        active: true
      })});
      Toast.show('Coupon created successfully.', 'success'); e.target.reset(); document.getElementById('coupon-admin-user-limit').value='1'; loadCoupons();
    } catch (err) { Toast.show(err.message, 'error'); }
  });

  document.addEventListener('click', async e => {
    const b = e.target.closest?.('.coupon-deactivate'); if (!b) return;
    b.disabled = true;
    try { await api(`/api/admin/coupons/${encodeURIComponent(b.dataset.id)}/deactivate`, {method:'POST'}); Toast.show('Coupon deactivated.', 'success'); loadCoupons(); }
    catch (err) { b.disabled=false; Toast.show(err.message,'error'); }
  });
}

new MutationObserver(install).observe(document.documentElement, {childList:true,subtree:true});
window.addEventListener('load', () => setTimeout(install, 200));
setTimeout(install, 500);
