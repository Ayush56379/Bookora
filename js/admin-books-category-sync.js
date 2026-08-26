// Keep Admin eBook editor Category identical to Bookora upload/category data.
(() => {
  'use strict';
  if (window.__BOOKORA_ADMIN_BOOK_CATEGORY_SYNC__) return;
  window.__BOOKORA_ADMIN_BOOK_CATEGORY_SYNC__ = true;

  const esc = v => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const db = () => {
    try { return window.firebase?.firestore ? window.firebase.firestore() : null; } catch (_) { return null; }
  };

  const normalize = item => {
    if (typeof item === 'string') return { name: item, slug: item.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') };
    const name = String(item?.name || item?.title || item?.label || '').trim();
    if (!name) return null;
    return { name, slug: String(item?.slug || name).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') };
  };

  async function getCategories(currentValue) {
    const map = new Map();
    try {
      const module = await import('./data/initialCategories.js?v=20260826-category-edit');
      (module.initialCategories || []).map(normalize).filter(Boolean).forEach(c => map.set(c.name.toLowerCase(), c));
    } catch (_) {}

    // The upload flow uses the same Firebase-backed categories state. Mirror it here.
    try {
      const firestore = db();
      if (firestore) {
        const snapshot = await firestore.collection('categories').get();
        snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).map(normalize).filter(Boolean).forEach(c => map.set(c.name.toLowerCase(), c));
      }
    } catch (error) { console.warn('[Admin Category Sync] Firebase categories:', error?.message || error); }

    // Never lose an older category that is already stored on the eBook.
    const current = normalize(currentValue);
    if (current) map.set(current.name.toLowerCase(), current);
    return Array.from(map.values()).sort((a,b) => a.name.localeCompare(b.name));
  }

  async function syncEditor() {
    const input = document.querySelector('#bookora-admin-edit-modal #bae-form input[name="category"]');
    if (!input || input.dataset.categorySynced === '1') return;
    input.dataset.categorySynced = '1';
    const current = input.value;
    const categories = await getCategories(current);
    if (!input.isConnected) return;

    const select = document.createElement('select');
    select.name = 'category';
    select.dataset.categorySynced = '1';
    select.setAttribute('aria-label', 'Category');
    select.innerHTML = categories.map(c => `<option value="${esc(c.name)}" data-slug="${esc(c.slug)}">${esc(c.name)}</option>`).join('');
    const match = categories.find(c => c.name.toLowerCase() === String(current).trim().toLowerCase());
    if (match) select.value = match.name;
    else if (current) {
      const option = document.createElement('option'); option.value = current; option.textContent = current; select.appendChild(option); select.value = current;
    }
    input.replaceWith(select);
  }

  const observer = new MutationObserver(() => {
    if (location.hash.split('?')[0] === '#/admin/books') void syncEditor();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('hashchange', () => setTimeout(syncEditor, 100));
  setInterval(syncEditor, 700);
})();
