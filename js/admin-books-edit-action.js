// Bookora Admin Books: guaranteed Edit action + Firebase editor.
(() => {
  'use strict';
  if (window.__BOOKORA_ADMIN_BOOKS_EDIT_ACTION_V2__) return;
  window.__BOOKORA_ADMIN_BOOKS_EDIT_ACTION_V2__ = true;

  const esc = value => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;').replace(/'/g, '&#039;');

  const routeIsBooks = () => String(location.hash || '').split('?')[0] === '#/admin/books';
  const db = () => {
    try {
      if (!window.firebase?.firestore) return null;
      return window.firebase.firestore();
    } catch (_) { return null; }
  };

  const getBookIdFromRow = row => {
    const remove = row?.querySelector?.('[data-ab-remove-id]');
    const edit = row?.querySelector?.('[data-ab-edit-id]');
    return edit?.dataset?.abEditId || remove?.dataset?.abRemoveId || '';
  };

  const findBook = id => {
    const pools = [window.__BOOKORA_ADMIN_BOOKS_FAST_STATE__?.books, window.__BOOKORA_FAST_BOOKS__, window.__BOOKORA_ADMIN_BOOKS__];
    for (const pool of pools) {
      if (Array.isArray(pool)) {
        const found = pool.find(b => String(b?.id) === String(id));
        if (found) return found;
      }
    }
    return null;
  };

  const ensureButtons = () => {
    if (!routeIsBooks()) return;
    document.querySelectorAll('#ab-list tr').forEach(row => {
      const id = getBookIdFromRow(row);
      if (!id || row.querySelector('[data-ab-edit-id]')) return;
      const actionCell = row.lastElementChild;
      if (!actionCell) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ab-btn';
      button.dataset.abEditId = id;
      button.style.cssText = 'background:#2563eb;color:#fff';
      button.textContent = 'Edit';
      actionCell.insertBefore(button, actionCell.firstChild);
    });
  };

  const getBook = async id => {
    const local = findBook(id);
    if (local) return local;
    const firestore = db();
    if (!firestore) throw new Error('Firebase is not ready. Please try again.');
    const snap = await firestore.collection('books').doc(String(id)).get();
    if (!snap.exists) throw new Error('eBook record was not found in Firebase.');
    return { id: snap.id, ...snap.data() };
  };

  const openEditor = async id => {
    document.getElementById('bookora-admin-edit-modal')?.remove();
    let book;
    try { book = await getBook(id); }
    catch (error) { alert(error?.message || 'Unable to load eBook details.'); return; }

    const modal = document.createElement('div');
    modal.id = 'bookora-admin-edit-modal';
    modal.innerHTML = `<div class="bae-overlay"></div><div class="bae-dialog" role="dialog" aria-modal="true">
      <div class="bae-header"><div><div class="bae-kicker">ADMIN EBOOK EDITOR</div><h2>Edit eBook</h2><p>Changes are saved directly to Firebase.</p></div><button type="button" class="bae-x" data-bae-close>×</button></div>
      <form id="bae-form">
        <div class="bae-grid">
          <label>Title<input name="title" value="${esc(book.title)}" required></label>
          <label>Subtitle<input name="subtitle" value="${esc(book.subtitle)}"></label>
          <label>Author<input name="author" value="${esc(book.author)}"></label>
          <label>Category<input name="category" value="${esc(book.category)}"></label>
          <label>Pages<input name="pages" type="number" min="0" value="${Number(book.pages || 0)}"></label>
          <label>Format<input name="format" value="${esc(book.format || 'PDF')}"></label>
          <label>Price (₹)<input name="price" type="number" min="0" step="0.01" value="${Number(book.price || 0)}"></label>
          <label>Sale Price (₹)<input name="sale_price" type="number" min="0" step="0.01" value="${book.sale_price == null ? '' : Number(book.sale_price)}"></label>
          <label>Status<select name="status"><option value="pending" ${book.status === 'pending' ? 'selected' : ''}>Pending</option><option value="approved" ${book.status === 'approved' ? 'selected' : ''}>Approved</option><option value="rejected" ${book.status === 'rejected' ? 'selected' : ''}>Rejected</option><option value="removed" ${book.status === 'removed' ? 'selected' : ''}>Removed</option></select></label>
          <label>Source Type<select name="source_type"><option value="internal" ${String(book.source_type || 'internal') === 'internal' ? 'selected' : ''}>Internal</option><option value="external" ${String(book.source_type) === 'external' ? 'selected' : ''}>External</option></select></label>
        </div>
        <label>Description<textarea name="description" rows="5">${esc(book.description)}</textarea>
        <label>Tags <span class="bae-help">comma separated</span><input name="tags" value="${esc(Array.isArray(book.tags) ? book.tags.join(', ') : book.tags)}"></label>
        <div class="bae-grid">
          <label>Cover URL<input name="cover_url" value="${esc(book.cover_url)}"></label>
          <label>PDF URL<input name="pdf_url" value="${esc(book.pdf_url)}"></label>
          <label>Source URL<input name="source_url" value="${esc(book.source_url)}"></label>
          <label>Buy URL<input name="buy_url" value="${esc(book.buy_url)}"></label>
        </div>
        <div class="bae-meta"><span>Book ID: ${esc(book.id)}</span><span>Seller: ${esc(book.seller_name || book.seller_email || book.seller_id || '—')}</span></div>
        <div class="bae-actions"><button type="button" class="bae-cancel" data-bae-close>Cancel</button><button type="submit" class="bae-save">Save changes</button></div>
      </form>
    </div>`;
    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelectorAll('[data-bae-close]').forEach(b => b.addEventListener('click', close));
    modal.querySelector('.bae-overlay')?.addEventListener('click', close);

    modal.querySelector('#bae-form')?.addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const save = form.querySelector('.bae-save');
      save.disabled = true; save.textContent = 'Saving…';
      try {
        const data = Object.fromEntries(new FormData(form).entries());
        const price = Number(data.price || 0);
        const sale = data.sale_price === '' ? null : Number(data.sale_price);
        const tags = String(data.tags || '').split(',').map(v => v.trim()).filter(Boolean);
        const patch = {
          title: String(data.title || '').trim() || 'Untitled', subtitle: String(data.subtitle || '').trim(),
          author: String(data.author || '').trim(), category: String(data.category || '').trim(),
          pages: Number(data.pages || 0), format: String(data.format || 'PDF').trim(),
          price, sale_price: Number.isFinite(sale) ? sale : null,
          discount: price > 0 && Number.isFinite(sale) ? Math.max(0, Math.round(((price - sale) / price) * 100)) : 0,
          status: String(data.status || 'pending'), source_type: String(data.source_type || 'internal'),
          description: String(data.description || '').trim(), tags,
          cover_url: String(data.cover_url || '').trim(), pdf_url: String(data.pdf_url || '').trim(),
          source_url: String(data.source_url || '').trim(), buy_url: String(data.buy_url || '').trim(),
          updated_at: new Date().toISOString(), updatedAt: new Date().toISOString()
        };
        const firestore = db();
        if (!firestore) throw new Error('Firebase is not ready.');
        await firestore.collection('books').doc(String(book.id)).set(patch, { merge: true });
        close();
        window.dispatchEvent(new CustomEvent('bookora:admin-book-updated', { detail: { id: String(book.id), patch } }));
        alert('eBook updated successfully.');
      } catch (error) {
        console.error('[Bookora Admin Edit]', error);
        alert(error?.message || 'Unable to save eBook changes.');
        save.disabled = false; save.textContent = 'Save changes';
      }
    });
  };

  const injectStyle = () => {
    if (document.getElementById('bae-style')) return;
    const style = document.createElement('style'); style.id = 'bae-style';
    style.textContent = `.bae-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:9998}.bae-dialog{position:fixed;z-index:9999;top:50%;left:50%;transform:translate(-50%,-50%);width:min(900px,calc(100vw - 28px));max-height:90vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 25px 70px rgba(15,23,42,.28);padding:24px;font-family:Inter,system-ui,sans-serif}.bae-header{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:18px}.bae-kicker{font-size:11px;font-weight:800;color:#2563eb;letter-spacing:.08em}.bae-header h2{margin:4px 0;font-size:24px;color:#0f172a}.bae-header p{margin:0;color:#64748b;font-size:13px}.bae-x{border:0;background:#f1f5f9;border-radius:10px;font-size:24px;width:38px;height:38px;cursor:pointer}.bae-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.bae-dialog label{display:block;font-size:12px;font-weight:700;color:#334155;margin-bottom:14px}.bae-dialog input,.bae-dialog select,.bae-dialog textarea{display:block;width:100%;box-sizing:border-box;margin-top:6px;padding:11px 12px;border:1px solid #cbd5e1;border-radius:10px;font:500 14px Inter,system-ui,sans-serif;color:#0f172a;background:#fff}.bae-dialog textarea{resize:vertical}.bae-help{font-weight:500;color:#94a3b8}.bae-meta{display:flex;flex-wrap:wrap;gap:18px;padding:12px;background:#f8fafc;border-radius:10px;color:#64748b;font-size:11px;margin:4px 0 18px}.bae-actions{display:flex;justify-content:flex-end;gap:10px;border-top:1px solid #e2e8f0;padding-top:16px}.bae-cancel,.bae-save{border:0;border-radius:10px;padding:11px 18px;font-weight:800;cursor:pointer}.bae-cancel{background:#e2e8f0;color:#334155}.bae-save{background:#2563eb;color:#fff}@media(max-width:650px){.bae-grid{grid-template-columns:1fr}.bae-dialog{padding:18px}}`;
    document.head.appendChild(style);
  };

  const bind = () => {
    if (!routeIsBooks()) return;
    injectStyle(); ensureButtons();
  };

  document.addEventListener('click', event => {
    const edit = event.target?.closest?.('[data-ab-edit-id]');
    if (!edit) return;
    event.preventDefault(); event.stopImmediatePropagation();
    openEditor(edit.dataset.abEditId);
  }, true);

  const observer = new MutationObserver(bind);
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('hashchange', () => setTimeout(bind, 50));
  setInterval(bind, 1000);
  bind();
})();
