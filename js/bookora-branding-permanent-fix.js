/* Bookora branding + clean startup loader.
   Startup must show only the centered Bookora wordmark.
   Any orphan spinner/box injected by another bootstrap script is removed. */
(() => {
  const fixText = node => {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const value = node.nodeValue || '';
    const fixed = value.replace(/Bookora\s+Store/gi, 'Bookora').replace(/Buocora/gi, 'Bookora');
    if (fixed !== value) node.nodeValue = fixed;
  };

  const normalizeAdded = root => {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) { fixText(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) fixText(node);
  };

  const isStartupOrphanBox = el => {
    if (!(el instanceof HTMLElement)) return false;
    if (el.id === 'bookora-brevo-loader' || el.closest('#bookora-brevo-loader')) return false;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height || rect.width > 110 || rect.height > 110) return false;
    const cs = getComputedStyle(el);
    const bg = cs.backgroundColor || '';
    const pos = cs.position || '';
    const z = Number.parseInt(cs.zIndex, 10);
    const blue = /rgb\(\s*37\s*,\s*99\s*,\s*235\s*\)|rgb\(\s*59\s*,\s*130\s*,\s*246\s*\)/.test(bg);
    const centered = Math.abs((rect.left + rect.width / 2) - innerWidth / 2) < 140 && Math.abs((rect.top + rect.height / 2) - innerHeight / 2) < 140;
    const empty = !(el.textContent || '').trim() && !el.querySelector('img,svg,canvas,input,button,a');
    return blue && centered && empty && (pos === 'fixed' || pos === 'absolute' || Number.isFinite(z));
  };

  const removeStartupOrphanBoxes = root => {
    if (!root) return;
    const candidates = [];
    if (root instanceof HTMLElement) candidates.push(root);
    if (root.querySelectorAll) candidates.push(...root.querySelectorAll('*'));
    candidates.slice(0, 250).forEach(el => { try { if (isStartupOrphanBox(el)) el.remove(); } catch (_) {} });
  };

  const installLoader = () => {
    if (!document.body || document.getElementById('bookora-brevo-loader')) return;
    const style = document.createElement('style');
    style.id = 'bookora-brevo-loader-style';
    style.textContent = `
      #bookora-brevo-loader{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:#fff;opacity:1;visibility:visible;transition:opacity .18s ease,visibility .18s ease}
      #bookora-brevo-loader.is-hidden{opacity:0;visibility:hidden;pointer-events:none}
      #bookora-brevo-loader .bookora-loader-word{margin:0;padding:0;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:clamp(56px,7vw,88px);line-height:1;font-weight:600;letter-spacing:-.055em;color:#12a879;animation:bookora-loader-color 2.8s ease-in-out infinite;user-select:none}
      @keyframes bookora-loader-color{0%,100%{color:#12a879}25%{color:#7750e8}50%{color:#2563eb}75%{color:#e24b8f}}
      @media (prefers-reduced-motion:reduce){#bookora-brevo-loader .bookora-loader-word{animation:none}}
    `;
    document.head.appendChild(style);
    const loader = document.createElement('div');
    loader.id = 'bookora-brevo-loader';
    loader.setAttribute('role','status');
    loader.setAttribute('aria-label','Loading Bookora');
    const word = document.createElement('div');
    word.className = 'bookora-loader-word';
    word.textContent = 'Bookora';
    loader.appendChild(word);
    document.body.appendChild(loader);
    let hidden = false;
    const hide = () => {
      if (hidden) return;
      hidden = true;
      const el = document.getElementById('bookora-brevo-loader');
      if (!el) return;
      el.classList.add('is-hidden');
      setTimeout(() => el.remove(), 220);
    };
    window.__BOOKORA_HIDE_LOADER__ = hide;
    const appReadyObserver = new MutationObserver(() => {
      if (document.querySelector('#main-content')) { hide(); appReadyObserver.disconnect(); }
    });
    appReadyObserver.observe(document.body,{childList:true,subtree:true});
    if (document.querySelector('#main-content')) hide();
    setTimeout(hide,3500);
    window.addEventListener('load',() => setTimeout(hide,40),{once:true});
  };

  const redirectAuthenticatedAuthRoute = () => {
    const path = (location.hash || '#/').split('?')[0];
    if (!['#/login','#/signup','#/register'].includes(path)) return;
    const goHome = () => {
      try { const profile = JSON.parse(localStorage.getItem('bookora_user_profile') || 'null'); if (profile?.uid || profile?.firebaseUid || profile?.bookoraUserId) { location.hash='#/'; return true; } } catch (_) {}
      try { const user = window.firebase?.auth?.()?.currentUser; if (user) { location.hash='#/'; return true; } } catch (_) {}
      return false;
    };
    if (goHome()) return;
    const check = setInterval(() => { if (goHome()) clearInterval(check); },250);
    setTimeout(() => clearInterval(check),5000);
  };

  const start = () => {
    installLoader();
    removeStartupOrphanBoxes(document.body);
    const walker = document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) fixText(node);
    let scheduled = false;
    const pending = new Set();
    const flush = () => {
      scheduled = false;
      const items = Array.from(pending); pending.clear();
      items.slice(0,80).forEach(item => { normalizeAdded(item); removeStartupOrphanBoxes(item); });
    };
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) mutation.addedNodes?.forEach(n => pending.add(n));
      if (!scheduled && pending.size) { scheduled=true; (window.requestAnimationFrame || (fn=>setTimeout(fn,0)))(flush); }
    });
    observer.observe(document.body,{childList:true,subtree:true});
    window.__BOOKORA_BRANDING_GUARD__ = observer;
    const safetySweep = setInterval(() => removeStartupOrphanBoxes(document.body),400);
    window.__BOOKORA_LOADING_BOX_GUARD__ = safetySweep;
  };

  if (document.body) start(); else document.addEventListener('DOMContentLoaded',start,{once:true});
  window.addEventListener('hashchange',redirectAuthenticatedAuthRoute);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',redirectAuthenticatedAuthRoute,{once:true}); else redirectAuthenticatedAuthRoute();

  /* ------------------------------------------------------------
     Admin Users permanent Firebase source-of-truth guard.
     The old admin-users API runtime could fetch an empty response after the
     Firestore page listener had already populated the table. That made real
     Firebase users visibly disappear. Block that optional runtime and keep a
     single realtime Firestore listener for /admin/users.
  ------------------------------------------------------------ */
  window.__BOOKORA_ADMIN_AUTH_USERS_RUNTIME_V3__ = true;
  window.__BOOKORA_ADMIN_USERS_FIREBASE_V4__ = true;
  const initAdminUsersFirebase = () => {
    if (String(location.hash || '').split('?')[0].replace(/\/+$/, '') !== '#/admin/users') return;
    if (!window.firebase?.firestore) { setTimeout(initAdminUsersFirebase,400); return; }
    if (window.__BOOKORA_ADMIN_USERS_FIREBASE_LISTENER__) return;
    try {
      const db = window.firebase.firestore();
      window.__BOOKORA_ADMIN_USERS_FIREBASE_LISTENER__ = db.collection('users').onSnapshot(snapshot => {
        const users = snapshot.docs.map(doc => ({ id:String(doc.id), ...doc.data() }));
        window.__BOOKORA_FIREBASE_ADMIN_USERS__ = users;
        const tbody = document.getElementById('admin-users-list');
        if (!tbody) return;
        const term = String(document.getElementById('admin-users-search')?.value || '').trim().toLowerCase();
        const filtered = users.filter(u => !term || `${u.name || ''} ${u.email || ''} ${u.uid || ''}`.toLowerCase().includes(term)).sort((a,b) => String(a.name || a.email || '').localeCompare(String(b.name || b.email || '')));
        const active = users.filter(u => !u.disabled && String(u.status || 'active').toLowerCase() === 'active').length;
        const sellers = users.filter(u => String(u.seller_status || '').toLowerCase() === 'approved' || ['seller','creator'].includes(String(u.role || '').toLowerCase())).length;
        const admins = users.filter(u => u.isMasterAdmin === true || String(u.role || '').toLowerCase() === 'admin' || String(u.email || '').toLowerCase() === 'ayushprajpati6@gmail.com').length;
        document.getElementById('users-total')?.replaceChildren(document.createTextNode(String(users.length)));
        document.getElementById('users-active')?.replaceChildren(document.createTextNode(String(active)));
        document.getElementById('users-sellers')?.replaceChildren(document.createTextNode(String(sellers)));
        document.getElementById('users-admins')?.replaceChildren(document.createTextNode(String(admins)));
        if (!filtered.length) { tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:55px;color:#64748b">No users found.</td></tr>'; return; }
        tbody.innerHTML = filtered.map(user => {
          const master = user.isMasterAdmin === true || String(user.email || '').toLowerCase() === 'ayushprajpati6@gmail.com';
          const role = String(user.role || 'buyer').toLowerCase();
          const status = user.disabled ? 'suspended' : String(user.status || 'active').toLowerCase();
          const seller = String(user.seller_status || 'none');
          const safe = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');
          let created = '—';
          try { const v=user.created_at || user.createdAt; const d=typeof v?.toDate==='function'?v.toDate():new Date(v); if(v && !Number.isNaN(d.getTime())) created=d.toLocaleString(); } catch (_) {}
          const initials = safe(String(user.name || user.email || 'U').split(/\s+/).filter(Boolean).slice(0,2).map(v=>v.charAt(0)).join('').toUpperCase() || 'U');
          return `<tr class="admin-user-row" data-user-id="${safe(user.id)}"><td class="admin-user-cell"><div style="display:flex;align-items:center;gap:11px"><div style="width:38px;height:38px;flex:0 0 38px;border-radius:50%;background:#dbeafe;color:#2563eb;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px">${initials}</div><div><div style="font-weight:750;color:#0f172a">${safe(user.name || 'Bookora User')}</div>${master?'<span class="master-badge">👑 MASTER ADMIN</span>':''}</div></div></td><td class="admin-user-cell">${safe(user.email || '—')}</td><td class="admin-user-cell">${master?'<span class="master-badge">ADMIN</span>':`<select class="admin-user-select auth-user-role" data-id="${safe(user.id)}"><option value="buyer" ${role==='buyer'?'selected':''}>Buyer</option><option value="creator" ${role==='creator'?'selected':''}>Creator</option><option value="seller" ${role==='seller'?'selected':''}>Seller</option><option value="admin" ${role==='admin'?'selected':''}>Admin</option></select>`}</td><td class="admin-user-cell"><span class="admin-user-status ${status==='active'?'status-active':status==='suspended'?'status-suspended':status==='pending'?'status-pending':'status-default'}">${safe(status.toUpperCase())}</span></td><td class="admin-user-cell"><span style="font-size:12px;font-weight:700;color:${seller==='approved'?'#15803d':'#64748b'}">${safe(seller)}</span></td><td class="admin-user-cell">${safe(created)}</td><td class="admin-user-cell">${master?'<span style="color:#64748b;font-size:12px">Protected</span>':'<span style="color:#64748b;font-size:12px">Firebase</span>'}</td></tr>`;
        }).join('');
        window.dispatchEvent(new CustomEvent('bookora:admin-users-firebase-ready',{detail:{count:users.length}}));
      }, error => console.error('[Bookora Admin Users Firebase]',error));
    } catch (error) { console.error('[Bookora Admin Users Firebase init]',error); setTimeout(initAdminUsersFirebase,800); }
  };
  window.addEventListener('hashchange', () => setTimeout(initAdminUsersFirebase,80));
  window.addEventListener('bookora:route-ready', () => setTimeout(initAdminUsersFirebase,0));
  [250,800,1600,3000].forEach(delay => setTimeout(initAdminUsersFirebase,delay));
  initAdminUsersFirebase();
})();