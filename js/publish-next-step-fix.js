/* Bookora Publish Wizard Navigation Fix v1
 * Keeps step navigation independent from the upload runtime.
 * The existing page renders buttons with data-next/data-prev; this handler
 * guarantees those controls always switch the visible wizard section.
 */
(() => {
  if (window.__BOOKORA_PUBLISH_WIZARD_NAV_V1__) return;
  window.__BOOKORA_PUBLISH_WIZARD_NAV_V1__ = true;

  const toast = (message, type = 'warning') => {
    try {
      const fn = window.Toast?.show || window.BookoraToast?.show;
      if (typeof fn === 'function') fn(message, type);
      else console.warn('[Bookora publish wizard]', message);
    } catch (_) { console.warn('[Bookora publish wizard]', message); }
  };

  const value = id => String(document.getElementById(id)?.value || '').trim();
  const file = id => document.getElementById(id)?.files?.[0] || null;
  const number = id => Number(document.getElementById(id)?.value || 0);

  function currentStep() {
    for (let i = 1; i <= 5; i++) {
      const el = document.getElementById(`step-${i}`);
      if (el && getComputedStyle(el).display !== 'none') return i;
    }
    return 1;
  }

  function go(step) {
    const n = Math.max(1, Math.min(5, Number(step) || 1));
    for (let i = 1; i <= 5; i++) {
      const section = document.getElementById(`step-${i}`);
      if (section) section.style.display = i === n ? 'block' : 'none';
    }
    if (n === 4) updatePreview();
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    window.dispatchEvent(new CustomEvent('bookora:publish-step-changed', { detail: { step: n } }));
  }

  function validateStep(step) {
    if (step === 1) {
      if (value('pub-title').length < 3) { toast('Please enter a valid eBook title.', 'warning'); return false; }
      if (!value('pub-author')) { toast('Please enter the author name.', 'warning'); return false; }
      if (!value('pub-category')) { toast('Please select a category.', 'warning'); return false; }
      if (value('pub-description').length < 20) { toast('Description must contain at least 20 characters.', 'warning'); return false; }
    }
    if (step === 2) {
      const pdf = file('pub-pdf');
      const cover = file('pub-cover');
      if (!pdf) { toast('Please select your PDF eBook.', 'warning'); return false; }
      if (!pdf.name.toLowerCase().endsWith('.pdf') && pdf.type !== 'application/pdf') { toast('Only PDF files are supported.', 'warning'); return false; }
      if (pdf.size > 100 * 1024 * 1024) { toast('PDF must be 100 MB or smaller.', 'warning'); return false; }
      if (!cover) { toast('Please select the eBook cover image.', 'warning'); return false; }
      if (cover.size > 5 * 1024 * 1024) { toast('Cover must be 5 MB or smaller.', 'warning'); return false; }
      if (number('pub-pages') < 1) { toast('PDF page count is required.', 'warning'); return false; }
    }
    if (step === 3) {
      const price = number('pub-price');
      const saleRaw = value('pub-saleprice');
      const sale = saleRaw === '' ? null : Number(saleRaw);
      if (!(price > 0)) { toast('Please enter a valid list price.', 'warning'); return false; }
      if (sale !== null && (!Number.isFinite(sale) || sale < 0 || sale > price)) { toast('Please enter a valid sale price.', 'warning'); return false; }
    }
    return true;
  }

  function updatePreview() {
    const title = value('pub-title') || 'Your Book';
    const author = value('pub-author') || 'Author';
    const pages = value('pub-pages') || '—';
    const sale = value('pub-saleprice');
    const price = sale === '' ? number('pub-price') : Number(sale);
    document.getElementById('preview-title')?.replaceChildren(document.createTextNode(title));
    document.getElementById('preview-author')?.replaceChildren(document.createTextNode(`by ${author}`));
    document.getElementById('preview-pages')?.replaceChildren(document.createTextNode(`Pages: ${pages}`));
    document.getElementById('preview-price')?.replaceChildren(document.createTextNode(`₹${(Number(price) || 0).toFixed(2)}`));
  }

  function handleClick(event) {
    const button = event.target?.closest?.('button[data-next], button[data-prev], button.next-step-btn');
    if (!button) return;
    if (!document.getElementById('publish-wizard-form')) return;

    const next = button.dataset.next;
    const prev = button.dataset.prev;
    if (next == null && prev == null) return;

    const from = currentStep();
    const target = next != null ? Number(next) : Number(prev);
    if (!Number.isFinite(target)) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (target > from && !validateStep(from)) return;
    go(target);
  }

  // Capture phase runs before page-level handlers, fixing dead/competing buttons.
  document.addEventListener('click', handleClick, true);

  // Also support dynamically rendered wizard pages after SPA navigation.
  const observer = new MutationObserver(() => {
    if (document.getElementById('publish-wizard-form')) {
      const buttons = document.querySelectorAll('#publish-wizard-form button[data-next], #publish-wizard-form button[data-prev]');
      buttons.forEach(button => {
        button.setAttribute('type', 'button');
        button.style.pointerEvents = 'auto';
      });
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
