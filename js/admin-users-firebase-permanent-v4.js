/* Bookora Admin Users — permanent Firebase/Firestore source of truth.
   This runtime intentionally does not call /api/admin/users. The Admin Users
   screen must stay populated from Firebase even if another optional runtime
   returns an empty API response or re-renders the page.
*/
(() => {
  'use strict';
  if (window.__BOOKORA_ADMIN_USERS_FIREBASE_V4__) return;
  window.__BOOKORA_ADMIN_USERS_FIREBASE_V4__ = true;

  const MASTER_ADMIN_EMAIL = 'ayushprajpati6@gmail.com';
  let unsubscribe = null;
  let retryTimer = null;
  let lastUsers = [];
  let rendering = false;

  const isUsersRoute = () => String(location.hash || '').split('?')[0].replace(/\/+$/, '') === '#/admin/users';
  const esc = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const initials = (name, email) => String(name || email || 'U').split(/\s+/).filter(Boolean).slice(0,2).map(v => v.charAt(0)).join('').toUpperCase() || 'U';
  const isMaster = user => user?.isMasterAdmin === true || String(user?.email || '').toLowerCase() === MASTER_ADMIN_EMAIL;
  const dateText = value => {
    if (!value) return '—';
    try {
      if (typeof value?.toDate === 'function') return value.toDate().toLocaleString();
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
    } catch (_) { return '—'; }
  };

  const updateStats = users => {
    const active = users.filter(u => !u.disabled && String(u.status || 'active').toLowerCase() === 'active').length;
    const sellers = users.filter(u => String(u.seller_status || '').toLowerCase() === 'approved' || ['seller','creator'].includes(String(u.role || '').toLowerCase())).length;
    const admins = users.filter(u => isMaster(u) || String(u.role || '').toLowerCase() === 'admin').length;
    document.getElementById('users-total')?.replaceChildren(document.createTextNode(String(users.length)));
    document.getElementById('users-active')?.replaceChildren(document.createTextNode(String(active)));
    document.getElementById('users-sellers')?.replaceChildren(document.createTextNode(String(sellers)));
    document.getElementById('users-admins')?.replaceChildren(document.createTextNode(String(admins)));
  };

  const render = () => {
    if (!isUsersRoute() || rendering) return;
    const tbody = document.getElementById('admin-users-list');
    if (!tbody) return;
    const term = String(document.getElementById('admin-users-search')?.value || '').trim().toLowerCase();
    const users = lastUsers.filter(u => !term || `${u.name || ''} ${u.email || ''} ${u.uid || ''}`.toLowerCase().includes(term)).slice().sort((a,b) => String(a.name || a.email || '').localeCompare(String(b.name || b.email || '')));
    updateStats(lastUsers);
    rendering = true;
    try {
      if (!users.length) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:55px;color:#64748b">No users found.</td></tr>`;
        return;
      }
      tbody.innerHTML = users.map(user => {
        const id = String(user.id || user.uid || user.firebaseUid || '');
        const master = isMaster(user);
        const role = String(user.role || 'buyer').toLowerCase();
        const status = user.disabled ? 'suspended' : String(user.status || 'active').toLowerCase();
        const seller = String(user.seller_status || 'none');
        return `<tr class="admin-user-row" data-user-id="${esc(id)}">
          <td class="admin-user-cell"><div style="display:flex;align-items:center;gap:11px"><div style="width:38px;height:38px;flex:0 0 38px;border-radius:50%;background:#dbeafe;color:#2563eb;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px">${esc(initials(user.name,user.email))}</div><div><div style="font-weight:750;color:#0f172a">${esc(user.name || 'Bookora User')}</div>${master ? '<span class="master-badge">👑 MASTER ADMIN</span>' : ''}</div></div></td>
          <td class="admin-user-cell">${esc(user.email || '—')}</td>
          <td class="admin-user-cell">${master ? '<span class="master-badge">ADMIN</span>' : `<select class="admin-user-select" data-admin-user-role="${esc(id)}"><option value="buyer" ${role==='buyer'?'selected':''}>Buyer</option><option value="creator" ${role==='creator'?'selected':''}>Creator</option><option value="seller" ${role==='seller'?'selected':''}>Seller</option><option value="admin" ${role==='admin'?'selected':''}>Admin</option></select>`}</td>
          <td class="admin-user-cell">${master ? '<span class="admin-user-status status-active">ACTIVE</span>' : `<span class="admin-user-status ${status==='active'?'status-active':status==='suspended'?'status-suspended':status==='pending'?'status-pending':'status-default'}">${esc(status.toUpperCase())}</span>`}</td>
          <td class="admin-user-cell"><span style="font-size:12px;font-weight:700;color:${seller==='approved'?'#15803d':'#64748b'}">${esc(seller)}</span></td>
          <td class="admin-user-cell">${esc(dateText(user.created_at || user.createdAt || user.createdAtMs))}</td>
          <td class="admin-user-cell">${master ? '<span style="color:#64748b;font-size:12px">Protected</span>' : '<span style="color:#64748b;font-size:12px">Firebase</span>'}</td>
        </tr>`;
      }).join('');
    } finally { rendering = false; }
  };

  const startListener = () => {
    if (!isUsersRoute()) {
      if (unsubscribe) { try { unsubscribe(); } catch (_) {} unsubscribe = null; }
      return;
    }
    if (!window.firebase?.firestore) {
      clearTimeout(retryTimer);
      retryTimer = setTimeout(startListener, 400);
      return;
    }
    if (unsubscribe) return;
    try {
      const db = window.firebase.firestore();
      unsubscribe = db.collection('users').onSnapshot(snapshot => {
        lastUsers = snapshot.docs.map(doc => ({ id: String(doc.id), ...doc.data() }));
        window.__BOOKORA_FIREBASE_ADMIN_USERS__ = lastUsers;
        render();
        window.dispatchEvent(new CustomEvent('bookora:admin-users-firebase-ready', { detail: { count: lastUsers.length } }));
      }, error => {
        console.error('[Bookora Admin Users Firebase]', error);
        if (!lastUsers.length) {
          const tbody = document.getElementById('admin-users-list');
          if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:55px;color:#64748b">Waiting for Firebase users…</td></tr>';
        }
      });
    } catch (error) {
      console.error('[Bookora Admin Users Firebase init]', error);
      unsubscribe = null;
      clearTimeout(retryTimer);
      retryTimer = setTimeout(startListener, 800);
    }
  };

  const bind = () => {
    if (!isUsersRoute()) return;
    startListener();
    const search = document.getElementById('admin-users-search');
    if (search && !search.dataset.firebaseUsersBound) {
      search.dataset.firebaseUsersBound = '1';
      search.addEventListener('input', render);
    }
    if (lastUsers.length) render();
  };

  window.addEventListener('hashchange', () => {
    if (!isUsersRoute() && unsubscribe) { try { unsubscribe(); } catch (_) {} unsubscribe = null; }
    setTimeout(bind, 50);
  });
  window.addEventListener('bookora:route-ready', () => setTimeout(bind, 0));
  document.addEventListener('DOMContentLoaded', () => setTimeout(bind, 100));
  [250, 750, 1500, 3000].forEach(delay => setTimeout(bind, delay));
  bind();
})();
