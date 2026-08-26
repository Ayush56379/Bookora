// Bookora Admin Books fast Firebase catalog + editor.
// Loads every Firestore book immediately (all users, all statuses), shows cached
// data first, then keeps the admin table synchronized in the background.
(() => {
  'use strict';
  if (window.__BOOKORA_ADMIN_BOOKS_FAST_EDIT__) return;
  window.__BOOKORA_ADMIN_BOOKS_FAST_EDIT__ = true;

  const CACHE_KEY = 'bookora_admin_books_v1';
  const state = { books: [], loaded: false, bound: false, loading: false, timer: 0, routeBooted: false };

  const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;').replace(/'/g, '&#039;');

  const isAdminBooksRoute = () => {
    const h = String(location.hash || '#/').split('?')[0].replace(/\/+$/, '');
    return h === '#/admin/books';
  };

  const getDb = () => {
    try {
      if (!window.firebase?.firestore) return null;
      if (!window.firebase.apps?.length) {
        window.firebase.initializeApp({
          apiKey: 'AIzaSyDgPa6d8gxRhrJEaPyKuki2hbTbSfAU-94',
          authDomain: 'bookora-676bf.firebaseapp.com',
          projectId: 'bookora-676bf',
          storageBucket: 'bookora-676bf.firebasestorage.app',
          messagingSenderId: '520063789526',
          appId: '1:520063789526:web:e85773de48d2a56034dc77',
          measurementId: 'G-JB9D643JNT'
        });
      }
      return window.firebase.firestore();
    } catch (error) {
      console.warn('[Admin Books Fast] Firebase init:', error?.message || error);
      return null;
    }
  };

  const normalizeBook = doc => ({ id: String(doc.id), ...(doc.data ? doc.data() : doc) });

  const saveCache = () => {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), books: state.books })); } catch (_) {}
  };

  const loadCache = () => {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (Array.isArray(cached?.books) && cached.books.length) {
        state.books = cached.books;
        render();
        return true;
      }
    } catch (_) {}
    return false;
  };

  const sorted = books => books.slice().sort((a, b) => {
    const ad = Date.parse(a.updated_at || a.updatedAt || a.created_at || a.createdAt || '') || 0;
    const bd = Date.parse(b.updated_at || b.updatedAt || b.created_at || b.createdAt || '') || 0;
    return bd - ad;
  });

  const render = () => {
    if (!isAdminBooksRoute()) return;
    const tbody = document.getElementById('ab-list');
    if (!tbody || !state.books.length) return;
    const search = String(document.getElementById('ab-search')?.value || '').trim().toLowerCase();
    const filter = String(document.getElementById('ab-filter')?.value || 'all');
    const all = sorted(state.books);
    const visible = all.filter(book => {
      const status = String(book.status || 'pending').toLowerCase();
      const text = `${book.title || ''} ${book.author || ''} ${book.seller_name || ''} ${book.seller_email || ''} ${book.seller_id || ''} ${book.id || ''} ${book.category || ''}`.toLowerCase();
      return (filter === 'all' || status === filter) && (!search || text.includes(search));
    });
    const count = status => all.filter(book => String(book.status || 'pending').toLowerCase() === status).length;
    document.getElementById('ab-total')?.replaceChildren(document.createTextNode(String(all.length)));
    document.getElementById('ab-pending')?.replaceChildren(document.createTextNode(String(count('pending'))));
    document.getElementById('ab-approved')?.replaceChildren(document.createTextNode(String(count('approved'))));
    document.getElementById('ab-rejected')?.replaceChildren(document.createTextNode(String(count('rejected'))));
    document.getElementById('ab-removed')?.replaceChildren(document.createTextNode(String(count('removed'))));

    if (!visible.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="padding:50px;text-align:center;color:#64748b">No books found.</td></tr>';
      return;
    }

    tbody.innerHTML = visible.map(book => {
      const status = String(book.status || 'pending').toLowerCase();
      const source = String(book.source_type || book.sourceType || 'internal').toLowerCase() === 'external' ? 'external' : 'internal';
      const statusColor = status === 'approved' ? '#15803d' : status === 'rejected' ? '#b91c1c' : status === 'removed' ? '#64748b' : '#a16207';
      const created = book.created_at || book.createdAt || book.created_at_iso || '—';
      const seller = book.seller_name || book.seller_email || book.seller_id || '—';
      const action = status === 'removed'
        ? '<span style="color:#64748b;font-weight:700">Removed</span>'
        : `${status !== 'approved' ? `<button class="ab-btn ab-ok" data-ab-action="approved" data-ab-id="${esc(book.id)}">Approve</button>` : ''}${status !== 'rejected' ? `<button class="ab-btn ab-no" data-ab-action="rejected" data-ab-id="${esc(book.id)}">Reject</button>` : ''}<button class="ab-btn" style="background:#2563eb;color:#fff" data-ab-edit-id="${esc(book.id)}">Edit</button><button class="ab-btn ab-remove" data-ab-remove-id="${esc(book.id)}">Remove</button>`;
      return `<tr><td><b class="${status === 'removed' ? 'ab-status-removed' : ''}">${esc(book.title || 'Untitled')}</b><div style="color:#94a3b8">${esc(book.author || '')}</div><div style="color:#94a3b8;font-size:11px">${esc(book.category || '')}</div></td><td><span class="ab-source ab-source-${source}">${source.toUpperCase()}</span></td><td>₹${Number(book.price || 0).toLocaleString('en-IN')}</td><td>${esc(seller)}</td><td><b style="color:${statusColor}">${esc(status.toUpperCase())}</b></td><td>${esc(created)}</td><td>${action}</td></tr>`;
    }).join('');
  };

  const injectEditorStyles = () => {
    if (document.getElementById('bookora-admin-book-editor-css')) return;
    const style = document.createElement('style');
    style.id = 'bookora-admin-book-editor-css';
    style.textContent = `.baeb-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.48);backdrop-filter:blur(3px);z-index:9998}.baeb-modal{position:fixed;z-index:9999;left:50%;top:50%;transform:translate(-50%,-50%);width:min(760px,calc(100vw - 28px));max-height:calc(100vh - 32px);overflow:auto;background:#fff;border:1px solid #e2e8f0;border-radius:20px;box-shadow:0 25px 70px rgba(15,23,42,.25);padding:24px;font-family:Inter,system-ui,sans-serif}.baeb-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;margin-bottom:20px}.baeb-kicker{font-size:11px;font-weight:800;color:#2563eb;letter-spacing:.08em}.baeb-head h2{margin:5px 0 4px;color:#0f172a;font-size:26px}.baeb-head p{margin:0;color:#64748b;font-size:13px}.baeb-close{width:36px;height:36px;border:0;border-radius:10px;background:#f1f5f9;color:#334155;font-size:24px;cursor:pointer}.baeb-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.baeb-modal label{display:flex;flex-direction:column;gap:7px;color:#334155;font-size:13px;font-weight:700;margin-bottom:14px}.baeb-modal input,.baeb-modal select,.baeb-modal textarea{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:10px;padding:11px 12px;background:#fff;color:#0f172a;font:500 14px Inter,system-ui,sans-serif;outline:none}.baeb-modal input:focus,.baeb-modal select:focus,.baeb-modal textarea:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.1)}.baeb-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:8px}.baeb-cancel,.baeb-save{border:0;border-radius:10px;padding:11px 18px;font-weight:800;cursor:pointer}.baeb-cancel{background:#f1f5f9;color:#334155}.baeb-save{background:#2563eb;color:#fff}.baeb-save:disabled{opacity:.65;cursor:wait}@media(max-width:650px){.baeb-grid{grid-template-columns:1fr}.baeb-modal{padding:18px}}`;
    document.head.appendChild(style);
  };

  const loadAll = async (showCache = true) => {
    if (state.loading) return;
    const db = getDb();
    if (!db) return;
    if (showCache) loadCache();
    state.loading = true;
    try {
      const snapshot = await db.collection('books').get();
      state.books = snapshot.docs.map(normalizeBook);
      state.loaded = true;
      saveCache();
      render();
      window.dispatchEvent(new CustomEvent('bookora:admin-books-fast-loaded', { detail: { count: state.books.length } }));
    } catch (error) {
      console.warn('[Admin Books Fast] all-books query:', error?.message || error);
    } finally {
      state.loading = false;
    }
  };

  const subscribe = () => {
    const db = getDb();
    if (!db || window.__BOOKORA_ADMIN_BOOKS_FAST_LISTENER__) return;
    window.__BOOKORA_ADMIN_BOOKS_FAST_LISTENER__ = true;
    try {
      db.collection('books').onSnapshot(snapshot => {
        state.books = snapshot.docs.map(normalizeBook);
        state.loaded = true;
        saveCache();
        render();
      }, error => console.warn('[Admin Books Fast] listener:', error?.message || error));
    } catch (error) {
      console.warn('[Admin Books Fast] listener setup:', error?.message || error);
    }
  };

  const openEditor = id => {
    const book = state.books.find(item => String(item.id) === String(id));
    if (!book) return;
    injectEditorStyles();
    document.getElementById('bookora-admin-book-editor')?.remove();
    const modal = document.createElement('div');
    modal.id = 'bookora-admin-book-editor';
    modal.innerHTML = `<div class="baeb-backdrop"></div><div class="baeb-modal" role="dialog" aria-modal="true" aria-label="Edit eBook"><div class="baeb-head"><div><div class="baeb-kicker">ADMIN EBOOK EDITOR</div><h2>Edit eBook</h2><p>Edit the selected user's eBook directly in Firebase.</p></div><button type="button" class="baeb-close" data-baeb-close>×</button></div><form id="baeb-form"><div class="baeb-grid"><label>Title<input name="title" value="${esc(book.title || '')}" required></label><label>Author<input name="author" value="${esc(book.author || '')}"></label><label>Category<input name="category" value="${esc(book.category || '')}"></label><label>Price (₹)<input name="price" type="number" min="0" step="0.01" value="${Number(book.price || 0)}"></label><label>Sale Price (₹)<input name="sale_price" type="number" min="0" step="0.01" value="${book.sale_price == null ? '' : Number(book.sale_price)}"></label><label>Status<select name="status"><option value="pending" ${String(book.status) === 'pending' ? 'selected' : ''}>Pending</option><option value="approved" ${String(book.status) === 'approved' ? 'selected' : ''}>Approved</option><option value="rejected" ${String(book.status) === 'rejected' ? 'selected' : ''}>Rejected</option><option value="removed" ${String(book.status) === 'removed' ? 'selected' : ''}>Removed</option></select></label></div><label>Description<textarea name="description" rows="5">${esc(book.description || '')}</textarea><div class="baeb-actions"><button type="button" class="baeb-cancel" data-baeb-close>Cancel</button><button type="submit" class="baeb-save">Save changes</button></div></form></div>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelectorAll('[data-baeb-close]').forEach(button => button.addEventListener('click', close));
    modal.querySelector('.baeb-backdrop')?.addEventListener('click', close);
    modal.querySelector('#baeb-form')?.addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = form.querySelector('.baeb-save');
      button.disabled = true; button.textContent = 'Saving…';
      try {
        const data = Object.fromEntries(new FormData(form).entries());
        const db = getDb();
        if (!db) throw new Error('Firebase is not ready.');
        const price = Number(data.price || 0);
        const sale = data.sale_price === '' ? null : Number(data.sale_price);
        const patch = {
          title: String(data.title || '').trim() || 'Untitled',
          author: String(data.author || '').trim(),
          category: String(data.category || '').trim(),
          price,
          sale_price: Number.isFinite(sale) ? sale : null,
          discount: price > 0 && Number.isFinite(sale) ? Math.max(0, Math.round(((price - sale) / price) * 100)) : 0,
          status: String(data.status || 'pending'),
          description: String(data.description || '').trim(),
          updated_at: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await db.collection('books').doc(String(book.id)).update(patch);
        const index = state.books.findIndex(item => String(item.id) === String(book.id));
        if (index >= 0) state.books[index] = { ...state.books[index], ...patch };
        saveCache(); render(); close();
        window.dispatchEvent(new CustomEvent('bookora:admin-book-updated', { detail: { id: book.id, patch } }));
      } catch (error) {
        console.error('[Admin Books Fast] save:', error);
        alert(error?.message || 'Unable to save eBook changes.');
        button.disabled = false; button.textContent = 'Save changes';
      }
    });
  };

  const bind = () => {
    if (state.bound) return;
    state.bound = true;
    document.addEventListener('click', event => {
      const edit = event.target?.closest?.('[data-ab-edit-id]');
      if (edit) { event.preventDefault(); event.stopPropagation(); openEditor(edit.dataset.abEditId); return; }
      if (event.target?.closest?.('#admin-books-refresh')) {
        setTimeout(() => loadAll(false), 0);
      }
    }, true);
  };

  const boot = () => {
    if (!isAdminBooksRoute()) { state.routeBooted = false; return; }
    injectEditorStyles();
    bind();
    if (!state.routeBooted) {
      state.routeBooted = true;
      loadCache();
      if (state.books.length) render();
      if (!state.loaded) loadAll(false);
      subscribe();
    } else if (document.getElementById('ab-list') && state.books.length) {
      render();
    }
  };

  window.addEventListener('hashchange', () => boot());
  const observer = new MutationObserver(() => {
    if (isAdminBooksRoute()) boot();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  setInterval(() => boot(), 2500);
})();
