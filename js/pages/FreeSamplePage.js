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
    .bs-page{background:#f6f8fc;min-height:calc(100vh - 72px);padding:28px 0 100px;color:#0f172a}
    .bs-wrap{width:min(980px,calc(100% - 32px));margin:auto}
    .bs-head{text-align:center;margin:8px auto 26px}.bs-badge{display:inline-flex;padding:7px 11px;border-radius:999px;background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe;font-size:10px;font-weight:800;letter-spacing:.06em}.bs-head h1{margin:12px 0 8px;font-family:var(--font-display,Inter,sans-serif);font-size:clamp(28px,4.5vw,46px);line-height:1.08;letter-spacing:-.04em}.bs-head p{margin:0 auto;color:#64748b;max-width:680px;font-size:14px;line-height:1.65}
    .bs-note{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px 16px;margin:0 auto 22px;text-align:center;color:#475569;font-size:12px;font-weight:700;box-shadow:0 5px 18px rgba(15,23,42,.04)}
    .bs-stack{display:flex;flex-direction:column;align-items:center;gap:24px}.bs-sheet{width:min(820px,100%);background:#fff;border:1px solid #dbe3ee;border-radius:10px;overflow:hidden;box-shadow:0 12px 34px rgba(15,23,42,.10)}.bs-sheet img{display:block;width:100%;height:auto;background:#fff;user-select:none;-webkit-user-drag:none}.bs-caption{padding:9px 14px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;color:#64748b;font-size:11px;font-weight:800}.bs-loading{padding:100px 20px;text-align:center;color:#64748b;font-weight:700}.bs-error{background:#fff;border:1px solid #fecaca;border-radius:16px;padding:28px;text-align:center;color:#991b1b}.bs-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:18px}.bs-btn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 17px;border-radius:11px;text-decoration:none;font-size:13px;font-weight:800}.bs-primary{background:#2563eb;color:#fff}.bs-secondary{background:#fff;color:#334155;border:1px solid #dbe3ee}.bs-buybar{position:fixed;left:0;right:0;bottom:0;z-index:50;background:rgba(255,255,255,.96);backdrop-filter:blur(14px);border-top:1px solid #e2e8f0;padding:10px 16px;display:flex;align-items:center;justify-content:center;gap:14px}.bs-buytext{font-size:12px;font-weight:700;color:#475569}.bs-buy{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 18px;border-radius:11px;background:#2563eb;color:#fff;text-decoration:none;font-size:13px;font-weight:800;box-shadow:0 8px 18px rgba(37,99,235,.20)}
    @media(max-width:640px){.bs-page{padding:22px 0 92px}.bs-wrap{width:min(100% - 20px,980px)}.bs-head{margin-bottom:20px}.bs-head h1{font-size:29px}.bs-note{font-size:11px}.bs-buytext{display:none}.bs-buybar{padding:9px 12px}.bs-buy{width:min(100%,340px)}}
  `;
  document.head.appendChild(style);
}

export function renderFreeSamplePage(book) {
  const title = book?.title || 'eBook Sample';
  updateSEO({
    title: `${title} — Free Sample`,
    description: `Read a free selected-page sample of ${title} on Bookora.`
  });
  sampleStyles();
  const slug = encodeURIComponent(book?.slug || book?.id || '');
  return `
    <main class="bs-page" id="bookora-free-sample-page">
      <div class="bs-wrap">
        <header class="bs-head">
          <span class="bs-badge">FREE SAMPLE · 6 SELECTED PAGES</span>
          <h1>${esc(title)}</h1>
          <p>Preview selected opening, middle and ending pages before buying the complete eBook.</p>
        </header>
        <div class="bs-note">2 opening pages · 2 middle pages · 2 ending pages · Original PDF is never opened in the browser.</div>
        <section id="bookora-sample-stack" class="bs-stack"><div class="bs-sheet"><div class="bs-loading">Preparing your sample…</div></div></section>
      </div>
      <div class="bs-buybar"><span class="bs-buytext">Like what you see? Read the complete eBook.</span><a class="bs-buy" href="#/checkout/${slug}">Buy Full eBook →</a></div>
    </main>`;
}

export async function initFreeSamplePage(book) {
  const stack = document.getElementById('bookora-sample-stack');
  if (!stack || !book) return;
  try {
    const response = await fetch(`${API}/api/books/${encodeURIComponent(book.slug || book.id)}/sample?mode=selected`, {
      cache: 'no-store', headers: { Accept: 'application/pdf' }
    });
    if (!response.ok) {
      let message = `Sample could not be generated (${response.status}).`;
      try { const data = await response.json(); if (data.error) message = data.error; } catch (_) {}
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
    const width = Math.min(820, stack.clientWidth || 820);
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
      await page.render({ canvasContext: canvas.getContext('2d', { alpha: false }), viewport, transform: ratio !== 1 ? [ratio,0,0,ratio,0,0] : null }).promise;

      const img = document.createElement('img');
      img.src = canvas.toDataURL('image/jpeg', .88);
      img.alt = `${titleFor(book)} sample page ${i}`;
      img.draggable = false;

      const sheet = document.createElement('article');
      sheet.className = 'bs-sheet';
      const caption = document.createElement('div');
      caption.className = 'bs-caption';
      caption.textContent = `Sample page ${i}`;
      sheet.append(img, caption);
      fragment.appendChild(sheet);
      canvas.width = 1; canvas.height = 1;
      page.cleanup?.();
    }
    stack.appendChild(fragment);
    pdf.cleanup?.(); pdf.destroy?.();
  } catch (error) {
    console.error('Free sample failed:', error);
    const slug = encodeURIComponent(book.slug || book.id || '');
    stack.innerHTML = `<div class="bs-error"><b>Sample could not be opened</b><p>${esc(error?.message || 'Please try again.')}</p><div class="bs-actions"><a class="bs-btn bs-secondary" href="#/book/${slug}">← Back to Book</a><a class="bs-btn bs-primary" href="#/checkout/${slug}">Buy Full eBook</a></div></div>`;
  }
}

function titleFor(book) { return String(book?.title || 'eBook Sample'); }
