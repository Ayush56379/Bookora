/* Bookora Publish Wizard Navigation v4 — reliable SPA-safe step navigation */
(() => {
  'use strict';
  if (window.__BOOKORA_PUBLISH_NAV_V4__) return;
  window.__BOOKORA_PUBLISH_NAV_V4__ = true;

  const toast = (message, type = 'warning') => {
    try {
      const fn = window.Toast?.show || window.BookoraToast?.show;
      if (typeof fn === 'function') fn(message, type);
      else console.warn('[Bookora publish wizard]', message);
    } catch (_) { console.warn('[Bookora publish wizard]', message); }
  };
  const value = id => String(document.getElementById(id)?.value || '').trim();
  const number = id => Number(document.getElementById(id)?.value || 0);
  const file = id => document.getElementById(id)?.files?.[0] || null;

  function form() { return document.getElementById('publish-wizard-form'); }
  function currentStep() {
    for (let i = 1; i <= 5; i++) {
      const el = document.getElementById(`step-${i}`);
      if (el && getComputedStyle(el).display !== 'none') return i;
    }
    return 1;
  }

  function validate(step) {
    if (step === 1) {
      if (value('pub-title').length < 3) { toast('Please enter a valid eBook title.'); return false; }
      if (!value('pub-author')) { toast('Please enter the author name.'); return false; }
      if (!value('pub-category')) { toast('Please select a category.'); return false; }
      if (value('pub-description').length < 20) { toast('Description must contain at least 20 characters.'); return false; }
    }
    if (step === 2) {
      const pdf = file('pub-pdf'), cover = file('pub-cover');
      if (!pdf) { toast('Please select your PDF eBook.'); return false; }
      if (pdf.type !== 'application/pdf' && !pdf.name.toLowerCase().endsWith('.pdf')) { toast('Only PDF files are supported.'); return false; }
      if (pdf.size > 100 * 1024 * 1024) { toast('PDF must be 100 MB or smaller.'); return false; }
      if (!cover) { toast('Please select the eBook cover image.'); return false; }
      if (cover.size > 5 * 1024 * 1024) { toast('Cover must be 5 MB or smaller.'); return false; }
      if (number('pub-pages') < 1) { toast('PDF page count is required.'); return false; }
    }
    if (step === 3) {
      const price = number('pub-price');
      const rawSale = value('pub-saleprice');
      const sale = rawSale === '' ? null : Number(rawSale);
      if (!(price > 0)) { toast('Please enter a valid list price.'); return false; }
      if (sale !== null && (!Number.isFinite(sale) || sale < 0 || sale > price)) { toast('Please enter a valid sale price.'); return false; }
    }
    return true;
  }

  function go(step) {
    const target = Math.max(1, Math.min(5, Number(step) || 1));
    for (let i = 1; i <= 5; i++) {
      const section = document.getElementById(`step-${i}`);
      if (section) {
        section.style.display = i === target ? 'block' : 'none';
        section.hidden = i !== target;
      }
    }
    const active = document.getElementById(`step-${target}`);
    if (active) active.hidden = false;
    if (target === 4) {
      window.dispatchEvent(new CustomEvent('bookora:publish-preview')); 
    }
    window.dispatchEvent(new CustomEvent('bookora:publish-step-changed', { detail: { step: target } }));
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }

  function handle(event) {
    const root = form();
    if (!root) return;
    const button = event.target?.closest?.('button[data-next], button[data-prev], button.next-step-btn, button.prev-step-btn');
    if (!button || !root.contains(button)) return;
    const target = button.dataset.next != null ? Number(button.dataset.next) : Number(button.dataset.prev);
    if (!Number.isFinite(target)) return;
    const from = currentStep();

    // Let the wizard navigation own these controls. Prevent the old competing handlers.
    event.preventDefault();
    event.stopImmediatePropagation();

    if (target > from && !validate(from)) return;
    go(target);
  }

  // Capture phase handles dynamically rendered SPA forms before any stale page handler.
  document.addEventListener('click', handle, true);

  // Keep button behavior deterministic after SPA re-renders.
  const observer = new MutationObserver(() => {
    const root = form();
    if (!root) return;
    root.querySelectorAll('button[data-next],button[data-prev],button.next-step-btn,button.prev-step-btn').forEach(button => {
      button.type = 'button';
      button.disabled = false;
      button.style.pointerEvents = 'auto';
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
