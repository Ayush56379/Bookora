/* Bookora Publish File Selection Fix v1
 * Makes PDF/cover selection reliable on the SPA publish wizard.
 * The hidden file inputs remain native inputs; labels are made explicit triggers,
 * change events update the visible state, and file references are never replaced.
 */
(() => {
  if (window.__BOOKORA_PUBLISH_FILE_SELECTION_V1__) return;
  window.__BOOKORA_PUBLISH_FILE_SELECTION_V1__ = true;

  const MAX_PDF_MB = 100;
  const MAX_COVER_MB = 5;
  const toast = (message, type = 'warning') => {
    try {
      const fn = window.Toast?.show || window.BookoraToast?.show;
      if (typeof fn === 'function') fn(message, type);
    } catch (_) {}
  };

  function update(input) {
    if (!input) return;
    const isPdf = input.id === 'pub-pdf';
    const file = input.files?.[0] || null;
    const name = document.getElementById(isPdf ? 'pdf-file-name' : 'cover-file-name');
    const status = document.getElementById(isPdf ? 'pdf-status' : 'cover-status');
    if (!file) {
      if (name) name.textContent = isPdf ? 'No PDF selected' : 'No cover selected';
      if (status) status.textContent = 'Required';
      return;
    }
    if (isPdf) {
      const valid = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!valid) {
        input.value = '';
        update(input);
        toast('Only PDF files are supported.', 'warning');
        return;
      }
      if (file.size > MAX_PDF_MB * 1024 * 1024) {
        input.value = '';
        update(input);
        toast(`PDF must be ${MAX_PDF_MB} MB or smaller.`, 'warning');
        return;
      }
    } else {
      const valid = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
      if (!valid) {
        input.value = '';
        update(input);
        toast('Please select a JPG, PNG or WEBP cover.', 'warning');
        return;
      }
      if (file.size > MAX_COVER_MB * 1024 * 1024) {
        input.value = '';
        update(input);
        toast('Cover must be 5 MB or smaller.', 'warning');
        return;
      }
    }
    if (name) name.textContent = file.name;
    if (status) status.textContent = `${(file.size / 1048576).toFixed(2)} MB · Ready`;
    input.setAttribute('data-bookora-selected', 'true');
    window.dispatchEvent(new CustomEvent('bookora:file-selected', { detail: { kind: isPdf ? 'pdf' : 'cover', file } }));
  }

  function install(root = document) {
    const form = root.querySelector?.('#publish-wizard-form') || document.getElementById('publish-wizard-form');
    if (!form || form.dataset.fileSelectionFixInstalled === '1') return;
    form.dataset.fileSelectionFixInstalled = '1';

    ['pub-pdf', 'pub-cover'].forEach(id => {
      const input = form.querySelector(`#${id}`);
      if (!input) return;
      input.setAttribute('data-bookora-file-input', '1');
      input.addEventListener('change', () => update(input), false);
      input.addEventListener('click', () => { input.dataset.bookoraOpening = '1'; }, false);
      update(input);
    });

    // Some global click handlers can prevent a label's default action in this SPA.
    // Use capture phase only for the two upload labels and explicitly open the input.
    form.addEventListener('click', event => {
      const label = event.target?.closest?.('label[for="pub-pdf"], label[for="pub-cover"]');
      if (!label) return;
      const id = label.getAttribute('for');
      const input = document.getElementById(id);
      if (!input) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      input.focus({ preventScroll: true });
      input.click();
    }, true);
  }

  const scan = () => install(document);
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  scan();
  window.addEventListener('hashchange', () => setTimeout(scan, 0), { passive: true });
})();
