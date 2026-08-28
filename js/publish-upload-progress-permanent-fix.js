// Bookora publish upload progress permanent fix.
// Keeps the selected PDF size visible even while the cover session is preparing.
(() => {
  if (window.__BOOKORA_PUBLISH_PROGRESS_PERMANENT_FIX__) return;
  window.__BOOKORA_PUBLISH_PROGRESS_PERMANENT_FIX__ = true;

  const MB = 1048576;
  const isPublish = () => ['#/publish', '#/publish/'].includes((location.hash || '').split('?')[0]);
  const fileOf = id => document.getElementById(id)?.files?.[0] || null;
  const fmt = bytes => `${(Math.max(0, Number(bytes) || 0) / MB).toFixed(2)} MB`;

  function patch() {
    if (!isPublish()) return;
    const pdf = fileOf('pub-pdf');
    const cover = fileOf('pub-cover');
    if (!pdf && !cover) return;

    const box = document.getElementById('upload-progress-box');
    const details = document.getElementById('upload-live-details');
    if (!box || !details) return;

    const rows = details.querySelectorAll('div');
    const pdfRow = rows[0];
    const coverRow = rows[2];
    const totalRow = rows[4];

    if (pdf && pdfRow) {
      const strong = pdfRow.querySelector('strong');
      if (strong) {
        const current = strong.textContent || '';
        const loadedMatch = current.match(/^([0-9.]+\s*MB)\s*\//i);
        strong.textContent = `${loadedMatch ? loadedMatch[1] : '0.00 MB'} / ${fmt(pdf.size)}`;
      }
      const pdfBar = rows[1]?.querySelector('div');
      if (pdfBar && !pdfBar.dataset.realProgress) {
        pdfBar.style.width = '0%';
      }
    }

    if (cover && coverRow) {
      const strong = coverRow.querySelector('strong');
      if (strong) {
        const current = strong.textContent || '';
        const loadedMatch = current.match(/^([0-9.]+\s*MB)\s*\//i);
        strong.textContent = `${loadedMatch ? loadedMatch[1] : '0.00 MB'} / ${fmt(cover.size)}`;
      }
    }

    if (totalRow && pdf && cover) {
      const strong = totalRow.querySelector('strong');
      if (strong) {
        const current = strong.textContent || '';
        const loadedMatch = current.match(/^([0-9.]+\s*MB)\s*\//i);
        strong.textContent = `${loadedMatch ? loadedMatch[1] : '0.00 MB'} / ${fmt(pdf.size + cover.size)}`;
      }
    }

    // The old runtime can briefly let the cover preparation message overwrite the
    // main eBook preparation message while the PDF session is still being created.
    // Keep the user-facing state neutral instead of making it look like the PDF was skipped.
    const button = document.getElementById('submit-pub-btn');
    const label = document.getElementById('upload-progress-label');
    const text = button?.textContent || '';
    if (pdf && /Preparing cover upload/i.test(text) && !/Uploading/i.test(text)) {
      if (button) button.textContent = 'Preparing eBook upload…';
      if (label) label.innerHTML = `<strong>Preparing eBook upload…</strong><span style="display:block;color:#64748b;font-size:.8rem;margin-top:4px;">PDF: ${fmt(pdf.size)} · Cover: ${cover ? fmt(cover.size) : '—'}</span>`;
    }
  }

  const observe = () => {
    patch();
    const observer = new MutationObserver(patch);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    setInterval(patch, 500);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, { once: true });
  else observe();
})();
