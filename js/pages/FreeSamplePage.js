import { updateSEO } from '../utils/seo.js';

const API = (window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com').replace(/\/$/, '');

function esc(value = '') {
  return String(value).replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#039;' }[c]));
}

function sampleStyles() {
  if (document.getElementById('bookora-free-sample-style')) return;
  const style = document.createElement('style');
  style.id = 'bookora-free-sample-style';
  style.textContent = `
    .bs-page{background:#f3f6fb;min-height:calc(100vh - 72px);padding:22px 0 96px;color:#0f172a}
    .bs-wrap{width:min(900px,calc(100% - 28px));margin:auto}
    .bs-top{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:0 0 18px}
    .bs-back{display:inline-flex;align-items:center;gap:7px;padding:9px 13px;border:1px solid #dbe3ee;border-radius:10px;background:#fff;color:#334155;text-decoration:none;font-size:12px;font-weight:800;box-shadow:0 4px 14px rgba(15,23,42,.04)}
    .bs-label{font-size:11px;font-weight:900;letter-spacing:.06em;color:#2563eb;background:#eff6ff;border:1px solid #bfdbfe;border-radius:999px;padding:7px 10px}
    .bs-title{text-align:center;margin:4px auto 20px}.bs-title h1{margin:0;font-family:var(--font-display,Inter,sans-serif);font-size:clamp(28px,5vw,44px);line-height:1.06;letter-spacing:-.045em;color:#0b1328}.bs-title p{margin:8px auto 0;color:#64748b;font-size:13px;line-height:1.55}
    .bs-pages{display:flex;flex-direction:column;align-items:center;gap:18px}
    .bs-page-card{width:min(780px,100%);background:#fff;border:1px solid #dbe3ee;border-radius:8px;overflow:hidden;box-shadow:0 12px 30px rgba(15,23,42,.10)}
    .bs-page-card img{display:block;width:100%;height:auto;background:#fff;user-select:none;-webkit-user-drag:none}
    .bs-page-number{padding:7px 10px;text-align:center;background:#fff;border-top:1px solid #eef2f7;color:#94a3b8;font-size:10px;font-weight:800}
    .bs-loading{width:min(780px,100%);background:#fff;border:1px solid #dbe3ee;border-radius:12px;padding:90px 20px;text-align:center;color:#64748b;font-size:13px;font-weight:800;box-shadow:0 8px 24px rgba(15,23,42,.06)}
    .bs-error{width:min(780px,100%);background:#fff;border:1px solid #fecaca;border-radius:14px;padding:34px 20px;text-align:center;color:#991b1b;box-shadow:0 8px 24px rgba(15,23,42,.05)}
    .bs-error b{font-size:17px}.bs-error p{color:#64748b;margin:8px 0 18px;font-size:13px}
    .bs-actions{display:flex;justify-content:center;gap:9px;flex-wrap:wrap}.bs-btn{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border-radius:10px;text-decoration:none;font-size:12px;font-weight:800}.bs-primary{background:#2563eb;color:#fff}.bs-secondary{background:#fff;color:#334155;border:1px solid #dbe3ee}
    .bs-buybar{position:fixed;left:0;right:0;bottom:0;z-index:50;background:rgba(255,255,255,.96);backdrop-filter:blur(14px);border-top:1px solid #e2e8f0;padding:9px 14px;display:flex;align-items:center;justify-content:center;gap:13px}.bs-buytext{font-size:12px;font-weight:800;color:#475569}.bs-buy{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 18px;border-radius:10px;background:#2563eb;color:#fff;text-decoration:none;font-size:12px;font-weight:900;box-shadow:0 8px 18px rgba(37,99,235,.20)}
    @media(max-width:640px){.bs-page{padding:14px 0 88px}.bs-wrap{width:calc(100% - 14px)}.bs-top{margin-bottom:14px}.bs-back{padding:8px 10px}.bs-label{font-size:9px;padding:6px 8px}.bs-title{margin-bottom:14px}.bs-title h1{font-size:28px}.bs-title p{font-size:12px}.bs-pages{gap:12px}.bs-page-card{border-radius:5px}.bs-page-number{font-size:9px;padding:6px}.bs-buytext{display:none}.bs-buybar{padding:8px 10px}.bs-buy{width:min(100%,340px)}}
  `;
  document.head.appendChild(style);
}

export function renderFreeSamplePage(book) {
  const title = book?.title || 'eBook Sample';
  updateSEO({
    title: `${title} — Free Sample`,
    description: `Preview selected sample pages from ${title} on Bookora.`
  });
  sampleStyles();
  const slug = encodeURIComponent(book?.slug || book?.id || '');

  return `
    <main class="bs-page" id="bookora-free-sample-page">
      <div class="bs-wrap">
        <div class="bs-top">
          <a class="bs-back" href="#/book/${slug}">← Back to Book</a>
          <span class="bs-label">6 PAGE PREVIEW</span>
        </div>

        <header class="bs-title">
          <h1>${esc(title)}</h1>
          <p>Preview selected pages from the eBook before you buy.</p>
        </header>

        <section id="bookora-sample-stack" class="bs-pages">
          <div class="bs-loading">Preparing sample pages…</div>
        </section>
      </div>

      <div class="bs-buybar">
        <span class="bs-buytext">Enjoy the preview? Read the complete eBook.</span>
        <a class="bs-buy" href="#/checkout/${slug}">Buy Full eBook →</a>
      </div>
    </main>`;
}

export async function initFreeSamplePage(book) {
  const stack = document.getElementById('bookora-sample-stack');
  if (!stack || !book) return;

  try {
    const key = book.slug || book.id;
    const response = await fetch(`${API}/api/books/${encodeURIComponent(key)}/sample?mode=selected`, {
      cache: 'no-store',
      headers: { Accept: 'application/pdf' }
    });

    if (!response.ok) {
      let message = `Sample could not be generated (${response.status}).`;
      try {
        const data = await response.json();
        if (data.error) message = data.error;
      } catch (_) {}
      throw new Error(message);
    }

    const type = (response.headers.get('content-type') || '').toLowerCase();
    if (!type.includes('application/pdf')) throw new Error('Sample service returned an invalid file.');

    const bytes = new Uint8Array(await response.arrayBuffer());
    const pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
    const pdf = await pdfjs.getDocument({ data: bytes }).promise;

    if (!pdf.numPages) throw new Error('The sample contains no readable pages.');

    stack.innerHTML = '';
    const width = Math.min(780, stack.clientWidth || 780);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const fragment = document.createDocumentFragment();

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: width / base.width });

      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      await page.render({
        canvasContext: canvas.getContext('2d', { alpha: false }),
        viewport,
        transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : null
      }).promise;

      // Convert each selected PDF page into an image for the reader UI.
      const img = document.createElement('img');
      img.src = canvas.toDataURL('image/jpeg', 0.90);
      img.alt = `${titleFor(book)} sample page ${i}`;
      img.draggable = false;
      img.loading = i === 1 ? 'eager' : 'lazy';

      const card = document.createElement('article');
      card.className = 'bs-page-card';
      const number = document.createElement('div');
      number.className = 'bs-page-number';
      number.textContent = `Preview page ${i} of ${pdf.numPages}`;
      card.append(img, number);
      fragment.appendChild(card);

      canvas.width = 1;
      canvas.height = 1;
      page.cleanup?.();
    }

    stack.appendChild(fragment);
    pdf.cleanup?.();
    pdf.destroy?.();
  } catch (error) {
    console.error('Free sample failed:', error);
    const slug = encodeURIComponent(book.slug || book.id || '');
    stack.innerHTML = `<div class="bs-error"><b>Sample could not be opened</b><p>${esc(error?.message || 'Please try again.')}</p><div class="bs-actions"><a class="bs-btn bs-secondary" href="#/book/${slug}">← Back to Book</a><a class="bs-btn bs-primary" href="#/checkout/${slug}">Buy Full eBook</a></div></div>`;
  }
}

function titleFor(book) {
  return String(book?.title || 'eBook Sample');
}
