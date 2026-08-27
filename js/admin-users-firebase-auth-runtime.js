// Bookora Admin Users: Firebase Authentication is the authoritative user list.
// Firestore is used only for Bookora profile/role/status metadata.
import { apiFetch, waitForAuthenticatedFirebaseUser } from './config.js';

(() => {
  'use strict';
  if (window.__BOOKORA_ADMIN_AUTH_USERS_RUNTIME_V3__) return;
  window.__BOOKORA_ADMIN_AUTH_USERS_RUNTIME_V3__ = true;

  const CACHE_KEY = 'bookora_admin_auth_users_v3';
  const CACHE_TTL = 5 * 60 * 1000;
  const state = { users: [], loaded: false, fetching: false, rendering: false, route: false, cacheLoaded: false };

  const routeIsUsers = () => String(location.hash || '').split('?')[0].replace(/\/+$/, '') === '#/admin/users';
  const esc = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');
  const initials = (name, email) => String(name || email || 'U').split(' ').slice(0,2).map(v => v.charAt(0)).join('').toUpperCase();
  const formatDate = value => { if (!value) return '—'; try { const d = new Date(value); return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString(); } catch (_) { return '—'; } };
  const isMaster = user => user?.isMasterAdmin === true || String(user?.email || '').toLowerCase() === 'ayushprajpati6@gmail.com';

  const loadCache = () => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (!cached || !Array.isArray(cached.users) || !cached.users.length || Date.now() - Number(cached.savedAt || 0) > CACHE_TTL) return false;
      state.users = cached.users; state.loaded = true; state.cacheLoaded = true; render(); return true;
    } catch (_) { return false; }
  };
  const saveCache = () => { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), users: state.users })); } catch (_) {} };

  const updateStats = users => {
    const active = users.filter(u => String(u.status || 'active').toLowerCase() === 'active' && !u.disabled).length;
    const sellers = users.filter(u => String(u.seller_status || '').toLowerCase() === 'approved' || ['seller','creator'].includes(String(u.role || '').toLowerCase())).length;
    const admins = users.filter(isMaster).length;
    document.getElementById('users-total')?.replaceChildren(document.createTextNode(String(users.length)));
    document.getElementById('users-active')?.replaceChildren(document.createTextNode(String(active)));
    document.getElementById('users-sellers')?.replaceChildren(document.createTextNode(String(sellers)));
    document.getElementById('users-admins')?.replaceChildren(document.createTextNode(String(admins)));
  };

  function render() {
    if (!routeIsUsers() || state.rendering) return;
    const tbody = document.getElementById('admin-users-list');
    if (!tbody) return;
    const term = String(document.getElementById('admin-users-search')?.value || '').trim().toLowerCase();
    const users = state.users.filter(user => !term || `${user.name || ''} ${user.email || ''} ${user.uid || ''}`.toLowerCase().includes(term)).slice().sort((a,b) => String(a.name || a.email || '').localeCompare(String(b.name || b.email || '')));
    updateStats(state.users);
    state.rendering = true;
    try {
      if (!users.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:55px;color:#64748b">No users found.</td></tr>'; return; }
      tbody.innerHTML = users.map(user => {
        const master = isMaster(user), role = String(user.role || 'buyer').toLowerCase();
        const status = user.disabled ? 'suspended' : String(user.status || 'active').toLowerCase();
        const seller = String(user.seller_status || 'none');
        return `<tr class="admin-user-row" data-user-id="${esc(user.id)}"><td class="admin-user-cell"><div style="display:flex;align-items:center;gap:11px"><div style="width:38px;height:38px;flex:0 0 38px;border-radius:50%;background:#dbeafe;color:#2563eb;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px">${esc(initials(user.name,user.email))}</div><div><div style="font-weight:750;color:#0f172a">${esc(user.name || 'Bookora User')}</div>${master ? '<span class="master-badge">👑 MASTER ADMIN</span>' : ''}</div></div></td><td class="admin-user-cell">${esc(user.email || '—')}</td><td class="admin-user-cell">${master ? '<span class="master-badge">ADMIN</span>' : `<select class="admin-user-select auth-user-role" data-id="${esc(user.id)}"><option value="buyer" ${role==='buyer'?'selected':''}>Buyer</option><option value="creator" ${role==='creator'?'selected':''}>Creator</option><option value="seller" ${role==='seller'?'selected':''}>Seller</option><option value="admin" ${role==='admin'?'selected':''}>Admin</option></select>`}</td><td class="admin-user-cell">${master ? '<span class="master-badge status-active">ACTIVE</span>' : `<select class="admin-user-select auth-user-status" data-id="${esc(user.id)}"><option value="active" ${status==='active'?'selected':''}>Active</option><option value="suspended" ${status==='suspended'?'selected':''}>Suspended</option><option value="pending" ${status==='pending'?'selected':''}>Pending</option></select>`}</td><td class="admin-user-cell"><span style="font-size:12px;font-weight:700;color:${seller==='approved'?'#15803d':'#64748b'}">${esc(seller)}</span></td><td class="admin-user-cell">${esc(formatDate(user.created_at || user.createdAt))}</td><td class="admin-user-cell">${master ? '<span style="color:#64748b;font-size:12px">Protected</span>' : `<button type="button" class="admin-user-action auth-user-save" data-id="${esc(user.id)}">Save</button>`}</td></tr>`;
      }).join('');
    } finally { state.rendering = false; }
  }

  async function fetchUsers(force) {
    if (!routeIsUsers() || state.fetching) return;
    if (!force && state.loaded && !state.cacheLoaded) return;
    state.fetching = true;
    try {
      const firebaseUser = await waitForAuthenticatedFirebaseUser();
      if (!firebaseUser) throw new Error('Firebase authentication is not ready.');
      const response = await apiFetch('/api/admin/users', { method: 'GET', cache: 'no-store' });
      if (!response.ok) throw new Error(`Admin users API ${response.status}`);
      const payload = await response.json();
      state.users = Array.isArray(payload) ? payload : (Array.isArray(payload?.users) ? payload.users : []);
      state.loaded = true; state.cacheLoaded = false; saveCache(); render();
      window.dispatchEvent(new CustomEvent('bookora:admin-auth-users-loaded', { detail: { count: state.users.length, source: payload?.source || 'firebase_auth' } }));
    } catch (error) { console.warn('[Admin Auth Users] load failed:', error); render(); }
    finally { state.fetching = false; }
  }

  async function saveUser(button) {
    const id = String(button?.dataset?.id || ''), user = state.users.find(item => String(item.id) === id);
    if (!user || isMaster(user)) return;
    const role = document.querySelector(`.auth-user-role[data-id="${CSS.escape(id)}"]`)?.value || user.role || 'buyer';
    const status = document.querySelector(`.auth-user-status[data-id="${CSS.escape(id)}"]`)?.value || user.status || 'active';
    if (!window.confirm(`Update ${user.name || user.email}?\n\nRole: ${role}\nStatus: ${status}`)) return;
    button.disabled = true; button.textContent = 'Saving...';
    try {
      if (!window.firebase?.firestore) throw new Error('Firebase Firestore is not ready.');
      const uid = String(user.firebaseUid || user.uid || user.id);
      await window.firebase.firestore().collection('users').doc(uid).set({ firebaseUid: uid, uid, role, status, updatedAt: window.firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      user.role = role; user.status = status; saveCache(); render();
    } catch (error) { console.error('[Admin Auth Users] save:', error); alert(error?.message || 'Unable to update user.'); button.disabled = false; button.textContent = 'Save'; }
  }

  function bind() {
    if (!routeIsUsers()) { state.route = false; return; }
    if (!state.route) { state.route = true; loadCache(); void fetchUsers(true); }
    const search = document.getElementById('admin-users-search');
    if (search && !search.dataset.authUsersBound) { search.dataset.authUsersBound = '1'; search.addEventListener('input', render); }
    const refresh = document.getElementById('admin-users-refresh');
    if (refresh && !refresh.dataset.authUsersBound) { refresh.dataset.authUsersBound = '1'; refresh.addEventListener('click', () => { state.cacheLoaded = false; void fetchUsers(true); }); }
    render();
  }

  document.addEventListener('click', event => {
    const button = event.target?.closest?.('.auth-user-save');
    if (!button) return;
    event.preventDefault(); event.stopImmediatePropagation(); void saveUser(button);
  }, true);

  // Event-driven only: no global MutationObserver and no 1-second polling.
  // The core route guard emits route-ready after each completed SPA render.
  window.addEventListener('bookora:route-ready', () => bind());
  window.addEventListener('hashchange', () => setTimeout(bind, 30));
  [100, 500, 1500].forEach(delay => setTimeout(bind, delay));
  bind();
})();
