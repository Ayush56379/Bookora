import { state } from '../state.js';

const API = String(window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com').replace(/\/$/, '');
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
const WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';

function esc(value) {
  return String(value ?? '').replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[c]));
}

function slugFromPath() {
  const path = (location.hash || '#/').split('?')[0].replace(/^#/, '');
  return path.startsWith('/sample/') ? decodeURIComponent(path.slice('/sample/'.length)) : '';
}

function selectedLabels(total) {
  total = Math.max(1, Number(total) || 1);
  const raw = [0, 1, Math.floor((total - 1) / 2), Math.ceil((total - 1) / 2), total - 2, total - 1];
  const unique = [...new Set(raw.map(n => Math.max(0, Math.min(total - 1, n))))];
  return unique.map((n, i) => ({ index: n, label: i < 2 ? `Opening · Page ${n + 1}` : i >= unique.length - 2 ? `Ending · Page ${n + 1}` : `Middle · Page ${n + 1}` }));
}

function styles() {
  if (document.getElementById('bookora-sample-page-style')) return;
  const s = document.createElement('style');
  s.id = 'bookora-sample-page-style';
  s.textContent = `
    .sample-page{background:#f5f7fb;min-height:100%;color:#0f172a;padding-bottom:110px}
    .sample-top{max-width:1180px;margin:0 auto;padding:26px 24px 14px;display:flex;align-items:center;justify-content:space-between;gap:18px}
    .sample-back{display:inline-flex;align-items:center;gap:8px;text-decoration:none;color:#334155;font-weight:700;font-size:14px}
    .sample-back:hover{color:#2563eb}
    .sample-meta{text-align:right;color:#64748b;font-size:12px;font-weight:700}
    .sample-hero{max-width:1180px;margin:0 auto;padding:10px 24px 28px;display:flex;align-items:flex-end;justify-content:space-between;gap:28px}
    .sample-title{font:900 clamp(28px,4vw,46px)/1.05 'Plus Jakarta Sans',Inter,sans-serif;letter-spacing:-1.5px;margin:0 0 10px}
    .sample-sub{margin:0;color:#64748b;font-size:14px;line-height:1.6}
    .sample-buy{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:#2563eb;color:#fff;text-decoration:none;border-radius:12px;padding:13px 20px;font-weight:800;box-shadow:0 8px 20px rgba(37,99,235,.2);white-space:nowrap}
    .sample-buy:hover{background:#1d4ed8}
    .sample-stage{max-width:920px;margin:0 auto;padding:0 18px}
    .sample-note{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:13px 16px;margin-bottom:18px;color:#475569;font-size:12px;line-height:1.5;text-align:center;box-shadow:0 4px 14px rgba(15,23,42,.04)}
    .sample-stack{display:flex;flex-direction:column;align-items:center;gap:24px}
    .sample-sheet{width:min(820px,100%);background:#fff;border:1px solid #e2e8f0;border-radius:4px;box-shadow:0 12px 35px rgba(15,23,42,.12);overflow:hidden}
    .sample-sheet img{display:block;width:100%;height:auto;user-select:none;-webkit-user-drag:none}
    .sample-caption{padding:9px 14px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;text-align:center;font-size:11px;font-weight:800;letter-spacing:.02em}
    .sample-loading{padding:90px 20px;text-align:center;color:#64748b;font-weight:700}
    .sample-error{max-width:700px;margin:50px auto;background:#fff;border:1px solid #fecaca;border-radius:16px;padding:28px;text-align:center;color:#991b1b}
    .sample-error strong{display:block;color:#7f1d1d;font-size:18px;margin-bottom:8px}
    .sample-footerbar{position:fixed;left:0;right:0;bottom:0;z-index:50;background:rgba(255,255,255,.96);backdrop-filter:blur(12px);border-top:1px solid #e2e8f0;padding:12px 18px;display:flex;align-items:center;justify-content:center;gap:16px}
    .sample-footerbar span{color:#475569;font-size:12px;font-weight:700}
    @media(max-width:700px){.sample-top,.sample-hero{padding-left:14px;padding-right:14px}.sample-hero{align-items:stretch;flex-direction:column}.sample-buy{width:100%}.sample-stage{padding:0 10px}.sample-sheet{border-radius:3px}.sample-footerbar{padding:10px 12px;gap:10px}.sample-footerbar span{font-size:11px}.sample-footerbar .sample-buy{width:auto;padding:11px 16px}}
  `;
  document.head.appendChild(s);
}

export function renderSampleReaderPage(slug) {
  styles();
  const book = state.getBookBySlug(slug) || state.getApprovedBooks().find(b => String(b.id) === slug);
  const title = book?.title || 'eBook Sample';
  const pages = Number(book?.pages || book?.pageCount || 0);
  return `<div class="sample-page">
    <div class="sample-top">
      <a class="sample-back" href="#/book/${encodeURIComponent(slug)}">← Back to book</a>
      <div class="sample-meta">BOOKORA SAMPLE<br>6 SELECTED PAGES</div>
    </div>
    <section class="sample-hero">
      <div><h1 class="sample-title">${esc(title)}</h1><p class="sample-sub">A clean preview with selected opening, middle, and ending pages.</p></div>
      <a class="sample-buy" href="#/checkout/${encodeURIComponent(slug)}">Buy Full eBook →</a>
    </section>
    <main class="sample-stage">
      <div class="sample-note">Free preview · 2 opening pages + 2 middle pages + 2 ending pages · The original PDF is never opened in the browser.</div>
      <div id="bookora-sample-stack" class="sample-stack"><div class="sample-sheet"><div class="sample-loading">Preparing your sample…</div></div></div>
    </main>
    <div class="sample-footerbar"><span>Enjoying the preview? Get the complete book.</span><a class="sample-buy" href="#/checkout/${encodeURIComponent(slug)}">Buy Now</a></div>
  </div>`;
}

export async function initSampleReaderPage(slug) {
  const stack = document.getElementById('bookora-sample-stack');
  if (!stack) return;
  const book = state.getBookBySlug(slug) || state.getApprovedBooks().find(b => String(b.id) === slug);
  if (!book) {
    stack.innerHTML = `<div class="sample-error"><strong>Book not found</strong><p>This eBook is no longer available in the catalog.</p><a class="sample-buy" href="#/explore">Browse eBooks</a></div>`;
    return;
  }

  try {
    const response = await fetch(`${API}/api/books/${encodeURIComponent(book.slug || slug)}/sample?mode=selected`, { cache:'no-store', headers:{Accept:'application/pdf'} });
    if (!response.ok) {
      let message = `Sample could not be generated (${response.status}).`;
      try { const data = await response.json(); if (data?.error) message = data.error; } catch (_) {}
      throw new Error(message);
    }
    if (!String(response.headers.get('content-type') || '').toLowerCase().includes('application/pdf')) throw new Error('Sample service returned an invalid file.');
    const bytes = new Uint8Array(await response.arrayBuffer());
    const pdfjs = await import(PDFJS);
    pdfjs.GlobalWorkerOptions.workerSrc = WORKER;
    const pdf = await pdfjs.getDocument({data:bytes}).promise;
    const labels = selectedLabels(Number(book.pages || book.pageCount || 0));
    if (!pdf.numPages) throw new Error('The sample contains no readable pages.');
    stack.innerHTML = '';

    for (let i=1; i<=pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const base = page.getViewport({scale:1});
      const width = Math.min(820, Math.max(280, stack.clientWidth));
      const viewport = page.getViewport({scale:width/base.width});
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width*ratio); canvas.height = Math.floor(viewport.height*ratio);
      canvas.style.width = `${viewport.width}px`; canvas.style.height = `${viewport.height}px`;
      const ctx = canvas.getContext('2d',{alpha:false});
      await page.render({canvasContext:ctx,viewport,transform:ratio!==1?[ratio,0,0,ratio,0,0]:null}).promise;
      const img = document.createElement('img');
      img.src = canvas.toDataURL('image/jpeg',0.9); img.alt = `${title} sample page ${i}`; img.draggable=false;
      const sheet = document.createElement('article'); sheet.className='sample-sheet';
      const cap = document.createElement('div'); cap.className='sample-caption'; cap.textContent = labels[i-1]?.label || `Sample page ${i}`;
      sheet.append(img,cap); stack.appendChild(sheet);
      canvas.width=1; canvas.height=1; page.cleanup?.();
    }
    pdf.cleanup?.(); pdf.destroy?.();
  } catch (error) {
    console.error('[Bookora sample page]', error);
    stack.innerHTML = `<div class="sample-error"><strong>Sample could not be opened</strong><p>${esc(error?.message || 'Please try again.')}</p><a class="sample-buy" href="#/book/${encodeURIComponent(slug)}">Back to Book</a></div>`;
  }
}
