// Bookora Admin Books: permanent Edit-button guard.
// Re-inserts the Edit action after Firebase snapshots, filters, refreshes,
// route changes, or any other renderer replaces #ab-list rows.
(() => {
  'use strict';
  if (window.__BOOKORA_ADMIN_EDIT_PERMANENT_GUARD__) return;
  window.__BOOKORA_ADMIN_EDIT_PERMANENT_GUARD__ = true;

  const isBooksRoute = () => String(location.hash || '').split('?')[0] === '#/admin/books';

  const books = () => {
    const pools = [
      window.__BOOKORA_ADMIN_BOOKS_FAST_STATE__?.books,
      window.__BOOKORA_FAST_BOOKS__,
      window.__BOOKORA_ADMIN_BOOKS__
    ];
    return pools.find(pool => Array.isArray(pool) && pool.length) || [];
  };

  const rowBookId = row => {
    const direct = row?.querySelector?.('[data-ab-edit-id]')?.dataset?.abEditId
      || row?.querySelector?.('[data-ab-remove-id]')?.dataset?.abRemoveId
      || row?.dataset?.bookId;
    if (direct) return String(direct);

    const title = String(row?.cells?.[0]?.querySelector?.('b')?.textContent || '').trim();
    if (!title) return '';
    const match = books().find(book => String(book?.title || '').trim() === title);
    return match?.id ? String(match.id) : '';
  };

  const ensure = () => {
    if (!isBooksRoute()) return;
    const tbody = document.getElementById('ab-list');
    if (!tbody) return;

    tbody.querySelectorAll('tr').forEach(row => {
      if (row.querySelector('[data-ab-edit-id]')) return;
      const id = rowBookId(row);
      const actionCell = row.lastElementChild;
      if (!id || !actionCell) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ab-btn ab-edit-permanent';
      button.dataset.abEditId = id;
      button.dataset.bookoraPermanentEdit = 'true';
      button.textContent = 'Edit';
      button.style.cssText = 'background:#2563eb;color:#fff;display:inline-flex!important;visibility:visible!important;opacity:1!important;position:relative;z-index:5';
      actionCell.insertBefore(button, actionCell.firstChild);
    });
  };

  const observer = new MutationObserver(() => {
    if (isBooksRoute()) ensure();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener('hashchange', () => setTimeout(ensure, 50));
  window.addEventListener('bookora:admin-books-fast-loaded', () => setTimeout(ensure, 0));
  window.addEventListener('bookora:admin-book-updated', () => setTimeout(ensure, 0));
  setInterval(ensure, 300);
  setTimeout(ensure, 0);
})();
