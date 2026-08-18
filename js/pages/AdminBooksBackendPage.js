import { apiFetch } from '../config.js';
import { state } from '../state.js';
import { Toast } from '../components/Toast.js';

let books = [];
let filter = 'all';
let search = '';

function esc(v) {
  return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function isAdmin() {
  return !!state.isAdmin;
}

export function renderAdminBooksPage() {
  if (!isAdmin()) return '<section style="padding:60px;text-align:center"><h2>Admin authorization required.</h2></section>';
  return `
    <section style="min-height:100vh;background:#f8fafc;padding:32px">
      <div style="max-width:1450px;margin:auto">
        <div style="display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap;margin-bottom:24px">
          <div><div style="color:#2563eb;font-weight:800;font-size:12px">BOOK MANAGEMENT</div><h1 style="margin:6px 0">Books</h1><p style="color:#64748b">Manage books stored by the Bookora backend.</p></div>
          <button id="admin-books-refresh" style="border:0;border-radius:10px;padding:12px 18px;background:#2563eb;color:white;font-weight:700">↻ Refresh</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:18px">
          <div class="ab-stat"><small>Total</small><b id="ab-total">0</b></div><div class="ab-stat"><small>Pending</small><b id="ab-pending">0</b></div><div class="ab-stat"><small>Approved</small><b id="ab-approved">0</b></div><div class="ab-stat"><small>Rejected</small><b id="ab-rejected">0</b></div>
        </div>
        <div style="background:white;border:1px solid #e2e8f0;border-radius:16px;padding:16px;display:flex;gap:10px;margin-bottom:18px">
          <input id="ab-search" placeholder="Search title, author..." style="flex:1;padding:12px;border:1px solid #cbd5e1;border-radius:10px">
          <select id="ab-filter" style="padding:12px;border:1px solid #cbd5e1;border-radius:10px"><option value="all">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select>
        </div>
        <div style="background:white;border:1px solid #e2e8f0;border-radius:16px;overflow:auto">
          <table style="width:100%;min-width:900px;border-collapse:collapse"><thead><tr style="background:#f8fafc"><th>BOOK</th><th>PRICE</th><th>SELLER</th><th>STATUS</th><th>CREATED</th><th>ACTION</th></tr></thead><tbody id="ab-list"><tr><td colspan="6" style="padding:50px;text-align:center">Loading…</td></tr></tbody></table>
        </div>
      </div>
    </section>
    <style>.ab-stat{background:white;border:1px solid #e2e8f0;border-radius:14px;padding:18px}.ab-stat small{display:block;color:#64748b}.ab-stat b{display:block;font-size:26px;margin-top:6px}th,td{text-align:left;padding:14px;border-bottom:1px solid #f1f5f9;font-size:13px}.ab-btn{border:0;border-radius:8px;padding:7px 10px;margin:2px;font-weight:700;cursor:pointer}.ab-ok{background:#dcfce7;color:#166534}.ab-no{background:#fee2e2;color:#991b1b}@media(max-width:700px){.ab-stat{padding:12px}}</style>
  `;
}

async function loadBooks() {
  const res = await apiFetch('/api/admin/books', { headers: { Authorization: `Bearer ${state.token || ''}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Unable to load books.');
  books = Array.isArray(data) ? data : [];
  renderTable();
}

function renderTable() {
  const term = search.trim().toLowerCase();
  const visible = books.filter(b => {
    const status = String(b.status || 'pending').toLowerCase();
    const text = `${b.title || ''} ${b.author || ''} ${b.seller_name || ''}`.toLowerCase();
    return (filter === 'all' || status === filter) && (!term || text.includes(term));
  });
  const count = s => books.filter(b => String(b.status || 'pending').toLowerCase() === s).length;
  document.getElementById('ab-total')?.replaceChildren(document.createTextNode(books.length));
  document.getElementById('ab-pending')?.replaceChildren(document.createTextNode(count('pending')));
  document.getElementById('ab-approved')?.replaceChildren(document.createTextNode(count('approved')));
  document.getElementById('ab-rejected')?.replaceChildren(document.createTextNode(count('rejected')));
  const tbody = document.getElementById('ab-list');
  if (!tbody) return;
  if (!visible.length) { tbody.innerHTML = '<tr><td colspan="6" style="padding:50px;text-align:center;color:#64748b">No books found.</td></tr>'; return; }
  tbody.innerHTML = visible.map(b => {
    const status = String(b.status || 'pending').toLowerCase();
    return `<tr><td><b>${esc(b.title || 'Untitled')}</b><div style="color:#94a3b8">${esc(b.author || '')}</div></td><td>₹${Number(b.price || 0).toLocaleString('en-IN')}</td><td>${esc(b.seller_name || b.seller_id || '—')}</td><td><b style="color:${status==='approved'?'#15803d':status==='rejected'?'#b91c1c':'#a16207'}">${esc(status.toUpperCase())}</b></td><td>${esc(b.created_at || '—')}</td><td>${status !== 'approved' ? `<button class="ab-btn ab-ok" data-ab-action="approved" data-ab-id="${esc(b.id)}">Approve</button>` : ''}${status !== 'rejected' ? `<button class="ab-btn ab-no" data-ab-action="rejected" data-ab-id="${esc(b.id)}">Reject</button>` : ''}</td></tr>`;
  }).join('');
}

export function initAdminBooksEvents() {
  if (!isAdmin()) return;
  document.getElementById('admin-books-refresh')?.addEventListener('click', async e => { e.currentTarget.disabled=true; try { await loadBooks(); Toast.show('Books refreshed.','success'); } catch(err) { Toast.show(err.message,'error'); } finally { e.currentTarget.disabled=false; } });
  document.getElementById('ab-search')?.addEventListener('input', e => { search=e.target.value; renderTable(); });
  document.getElementById('ab-filter')?.addEventListener('change', e => { filter=e.target.value; renderTable(); });
  document.addEventListener('click', async e => {
    const btn=e.target.closest('[data-ab-action]'); if(!btn) return;
    const id=btn.dataset.abId, status=btn.dataset.abAction;
    if(!id) return;
    btn.disabled=true;
    try {
      const res=await apiFetch(`/api/admin/books/${encodeURIComponent(id)}/status`,{method:'POST',headers:{Authorization:`Bearer ${state.token || ''}`},body:JSON.stringify({status})});
      const data=await res.json(); if(!res.ok) throw new Error(data.error || 'Update failed.');
      const index=books.findIndex(b=>b.id===id); if(index>=0) books[index]=data.book;
      renderTable(); Toast.show(status==='approved'?'Book approved.':'Book rejected.', 'success');
    } catch(err) { Toast.show(err.message,'error'); } finally { btn.disabled=false; }
  });
  loadBooks().catch(err => Toast.show(err.message,'error'));
}
