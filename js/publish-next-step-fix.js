/* Bookora Publish Wizard Navigation v5 — deterministic, non-blocking step navigation */
(() => {
  'use strict';
  if (window.__BOOKORA_PUBLISH_NAV_V5__) return;
  window.__BOOKORA_PUBLISH_NAV_V5__ = true;

  const toast = (message, type = 'warning') => {
    try {
      const fn = window.Toast?.show || window.BookoraToast?.show;
      if (typeof fn === 'function') fn(message, type);
      else console.warn('[Bookora publish wizard]', message);
    } catch (_) { console.warn('[Bookora publish wizard]', message); }
  };
  const el = id => document.getElementById(id);
  const value = id => String(el(id)?.value || '').trim();
  const number = id => Number(el(id)?.value || 0);
  const file = id => el(id)?.files?.[0] || null;
  const form = () => el('publish-wizard-form');

  function currentStep() {
    for (let i = 1; i <= 5; i++) {
      const section = el(`step-${i}`);
      if (!section) continue;
      if (section.hidden === false && getComputedStyle(section).display !== 'none') return i;
      if (section.hidden !== true && section.style.display !== 'none') return i;
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
      if (!(price > 0) || !Number.isFinite(price)) { toast('Please enter a valid list price.'); return false; }
      if (sale !== null && (!Number.isFinite(sale) || sale < 0 || sale > price)) { toast('Please enter a valid sale price.'); return false; }
    }
    return true;
  }

  function setStep(step) {
    const target = Math.max(1, Math.min(5, Number(step) || 1));
    const sections = [];
    for (let i = 1; i <= 5; i++) {
      const section = el(`step-${i}`);
      if (!section) continue;
      sections.push(section);
      const active = i === target;
      section.hidden = !active;
      section.setAttribute('aria-hidden', active ? 'false' : 'true');
      section.style.setProperty('display', active ? 'block' : 'none', 'important');
    }
    const active = el(`step-${target}`);
    if (!active) {
      toast('The next publish step is temporarily unavailable. Please retry.','error');
      return false;
    }
    active.hidden = false;
    active.removeAttribute('aria-hidden');
    active.style.setProperty('display', 'block', 'important');
    if (target === 4) window.dispatchEvent(new CustomEvent('bookora:publish-preview'));
    window.dispatchEvent(new CustomEvent('bookora:publish-step-changed', { detail: { step: target } }));
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    return true;
  }

  function handle(event) {
    const root = form();
    if (!root) return;
    const button = event.target?.closest?.('button[data-next], button[data-prev], button.next-step-btn, button.prev-step-btn');
    if (!button || !root.contains(button)) return;

    const rawTarget = button.dataset.next != null ? button.dataset.next : button.dataset.prev;
    const target = Number(rawTarget);
    if (!Number.isFinite(target)) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    const from = currentStep();
    if (target > from && !validate(from)) return;

    // Run outside the click call stack so competing legacy handlers cannot
    // immediately re-render the wizard back to the previous step.
    queueMicrotask(() => setStep(target));
  }

  // Capture phase owns wizard navigation before any older delegated handlers.
  document.addEventListener('click', handle, true);

  // Keep every wizard navigation button clickable after SPA renders/re-renders.
  const normalize = () => {
    const root = form();
    if (!root) return;
    root.querySelectorAll('button[data-next],button[data-prev],button.next-step-btn,button.prev-step-btn').forEach(button => {
      button.type = 'button';
      button.disabled = false;
      button.removeAttribute('aria-disabled');
      button.style.pointerEvents = 'auto';
    });
  };

  normalize();
  new MutationObserver(normalize).observe(document.documentElement, { childList: true, subtree: true });
})();
