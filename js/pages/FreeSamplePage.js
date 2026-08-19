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
    .bookora-sample-open{overflow:hidden!important}
    .bs-overlay{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.68);backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;animation:bsFade .16s ease}
    .bs-modal{position:relative;width:min(980px,100%);height:min(94vh,920px);background:#f4f7fb;border-radius:18px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.30);display:flex;flex-direction:column}
    .bs-modal-head{height:70px;flex:0 0 70px;background:rgba(255,255,255,.98);border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;padding:0 18px;box-sizing:border-box;position:relative;z-index:2}
    .bs-modal-info{min-width:0;padding-left:4px}.bs-modal-kicker{font-size:10px;font-weight:900;letter-spacing:.08em;color:#2563eb}.bs-modal-title{margin:3px 0 0;font-size:16px;font-weight:850;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .bs-head-actions{display:flex;align-items:center;gap:8px;flex:0 0 auto}.bs-icon-btn{width:42px;height:42px;border:1px solid #dbe3ee;border-radius:12px;background:#fff;color:#1e293b;display:grid;place-items:center;cursor:pointer;font-size:20px;font-weight:800;line-height:1;box-shadow:0 4px 14px rgba(15,23,42,.06);transition:.15s ease}.bs-icon-btn:hover{background:#f8fafc;transform:translateY(-1px);box-shadow:0 8px 18px rgba(15,23,42,.10)}.bs-icon-btn.close{font-size:25px}.bs-icon-btn.back{font-size:22px}
    .bs-scroll{overflow:auto;flex:1;min-height:0;padding:20px 18px 30px;scroll-behavior:smooth}.bs-scroll::-webkit-scrollbar{width:9px}.bs-scroll::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px;border:2px solid #f4f7fb}
    .bs-title{text-align:center;margin:0 auto 16px}.bs-title h1{margin:0;font-family:var(--font-display,Inter,sans-serif);font-size:clamp(24px,4vw,36px);line-height:1.08;letter-spacing:-.04em;color:#0b1328}.bs-title p{margin:7px auto 0;color:#64748b;font-size:12px}
    .bs-pages{display:flex;flex-direction:column;align-items:center;gap:16px}.bs-page-card{width:min(780px,100%);background:#fff;border:1px solid #dbe3ee;border-radius:7px;overflow:hidden;box-shadow:0 10px 28px rgba(15,23,42,.10)}.bs-page-card img{display:block;width:100%;height:auto;background:#fff;user-select:none;-webkit-user-drag:none}.bs-page-number{padding:6px 10px;text-align:center;background:#fff;border-top:1px solid #eef2f7;color:#94a3b8;font-size:10px;font-weight:800}
    .bs-loading{width:min(780px,100%);box-sizing:border-box;background:#fff;border:1px solid #dbe3ee;border-radius:12px;padding:70px 20px;text-align:center;color:#64748b;font-size:13px;font-weight:800}.bs-error{width:min(780px,100%);box-sizing:border-box;background:#fff;border:1px solid #fecaca;border-radius:14px;padding:34px 20px;text-align:center;color:#991b1b}.bs-error p{color:#64748b;margin:8px 0 18px;font-size:13px}.bs-actions{display:flex;justify-content:center;gap:9px;flex-wrap:wrap}.bs-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 15px;border-radius:10px;text-decoration:none;font-size:12px;font-weight:800}.bs-secondary{background:#fff;color:#334155;border:1px solid #dbe3ee}
    .bs-buybar{margin:18px auto 0;width:min(780px,100%);box-sizing:border-box;background:#fff;border:1px solid #dbe3ee;border-radius:13px;padding:11px 13px;display:flex;align-items:center;justify-content:center;gap:13px}.bs-buytext{font-size:11px;font-weight:800;color:#475569}.bs-buy{display:inline-flex;align-items:center;justify-content:center;min-height:39px;padding:0 17px;border-radius:10px;background:#2563eb;color:#fff;text-decoration:none;font-size:12px;font-weight:900}
    @keyframes bsFade{from{opacity:0}to{opacity:1}}
    @media(max-width:640px){.bs-overlay{padding:0}.bs-modal{width:100%;height:100%;border-radius:0}.bs-modal-head{height:62px;flex-basis:62px;padding:0 12px}.bs-modal-info{padding-left:2px}.bs-modal-kicker{font-size:8px}.bs-modal-title{font-size:14px}.bs-head-actions{gap:6px}.bs-icon-btn{width:40px;height:40px;border-radius:11px}.bs-scroll{padding:14px 8px 22px}.bs-title{margin-bottom:13px}.bs-title h1{font-size:25px}.bs-pages{gap:10px}.bs-page-card{border-radius:4px}.bs-buybar{margin-top:12px}.bs-buytext{display:none}.bs-buy{width:min(100%,320px)}}
  `;
  document.head.appendChild(style);
}

export function renderFreeSamplePage(book) {
  const title = book?.title || 'eBook Sample';
  updateSEO({ title: `${title} — Free Sample`, description: `Preview selected sample pages from ${title} on Bookora.` });
  sampleStyles();
  const slug = encodeURIComponent(book?.slug || book?.id || '');

  return `
    <div class="bs-overlay" id="bookora-free-sample-page" role="dialog" aria-modal="true" aria-label="Free sample">
      <div class="bs-modal">
        <div class="bs-modal-head">
          <div class="bs-modal-info">
            <div class="bs-modal-kicker">FREE SAMPLE · 6 SELECTED PAGES</div>
            <div class="bs-modal-title">${esc(title)}</div>
          </div>
          <div class="bs-head-actions">
            <button type="button" class="bs-icon-btn back" id="bookora-sample-back" aria-label="Back to book" title="Back to book">←</button>
            <button type="button" class="bs-icon-btn close" id="bookora-sample-close" aria-label="Close sample" title="Close">×</button>
          </div>
        </div>
        <div class="bs-scroll" id="bookora-sample-scroll">
          <header class="bs-title"><h1>${esc(title)}</h1><p>Preview 6 selected pages from the opening, middle and ending of this eBook.</p></header>
          <section id="bookora-sample-stack" class="bs-pages"><div class="bs-loading">Preparing 6 sample pages…</div></section>
          <div class="bs-buybar"><span class="bs-buytext">Enjoy the preview? Read the complete eBook.</span><a class="bs-buy" href="#/checkout/${slug}" id="bookora-sample-buy">Buy Full eBook →</a></div>
        </div>
      </div>
    </div>`;
}

export function closeFreeSamplePage() {
  const overlay = document.getElementById('bookora-free-sample-page');
  if (!overlay) return;
  overlay.remove();
  document.body.classList.remove('bookora-sample-open');
}

async function fetchSamplePdf(book) {
  const candidates = [book?.id, book?.slug].filter(Boolean).map(String).filter((v,i,a)=>a.indexOf(v)===i);
  let lastError = null;

  // Preferred path: backend generates a six-page PDF.
  for (const key of candidates) {
    try {
      const response = await fetch(`${API}/api/books/${encodeURIComponent(key)}/sample?mode=selected`, { cache:'no-store', headers:{Accept:'application/pdf'} });
      if (response.ok) return response;
      lastError = new Error(`Sample endpoint returned ${response.status}.`);
      if (response.status !== 404) break;
    } catch (error) { lastError = error; }
  }

  // Recovery path: use the approved book's own PDF URL and select exactly six pages in the browser.
  const directUrl = book?.pdf_url || book?.pdfUrl || book?.pdf || book?.file_url || book?.fileUrl || '';
  if (directUrl && /^https?:\/\//i.test(String(directUrl))) {
    try {
      const response = await fetch(String(directUrl), { cache:'no-store', headers:{Accept:'application/pdf'} });
      if (response.ok) return response;
      lastError = new Error(`Book PDF returned ${response.status}.`);
    } catch (error) { lastError = error; }
  }

  // Last recovery: refresh approved books and find the exact book, then try its PDF URL or sample endpoint.
  try {
    const listResponse = await fetch(`${API}/api/books`, { cache:'no-store', headers:{Accept:'application/json'} });
    if (listResponse.ok) {
      const raw = await listResponse.json();
      const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.books) ? raw.books : []);
      const wantedId = String(book?.id || '').trim().toLowerCase();
      const wantedSlug = String(book?.slug || '').trim().toLowerCase();
      const wantedTitle = String(book?.title || '').trim().toLowerCase();
      const match = list.find(item => {
        const id = String(item?.id || '').trim().toLowerCase();
        const slug = String(item?.slug || '').trim().toLowerCase();
        const title = String(item?.title || '').trim().toLowerCase();
        return (wantedId && id === wantedId) || (wantedSlug && slug === wantedSlug) || (wantedTitle && title === wantedTitle);
      });
      if (match) {
        const url = match.pdf_url || match.pdfUrl || match.pdf || match.file_url || match.fileUrl || '';
        if (url && /^https?:\/\//i.test(String(url))) {
          const response = await fetch(String(url), { cache:'no-store', headers:{Accept:'application/pdf'} });
          if (response.ok) return response;
        }
        for (const key of [match.id, match.slug].filter(Boolean)) {
          const response = await fetch(`${API}/api/books/${encodeURIComponent(key)}/sample?mode=selected`, { cache:'no-store', headers:{Accept:'application/pdf'} });
          if (response.ok) return response;
        }
      }
    }
  } catch (error) { lastError = error; }

  throw lastError || new Error('Sample PDF is unavailable.');
}

function getSixPageIndexes(total) {
  if (total <= 0) return [];
  if (total <= 6) return Array.from({length: total}, (_, i) => i);
  const wanted = [0, 1, Math.floor((total - 1) / 2), Math.floor(total / 2), total - 2, total - 1];
  return [...new Set(wanted)].slice(0, 6);
}

export async function initFreeSamplePage(book) {
  const stack = document.getElementById('bookora-sample-stack');
  const close = document.getElementById('bookora-sample-close');
  const back = document.getElementById('bookora-sample-back');
  const overlay = document.getElementById('bookora-free-sample-page');
  if (!stack || !book || !overlay) return;

  close?.addEventListener('click', closeFreeSamplePage);
  back?.addEventListener('click', closeFreeSamplePage);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeFreeSamplePage(); });
  const onKey = e => { if (e.key === 'Escape') closeFreeSamplePage(); };
  document.addEventListener('keydown', onKey, { once:true });

  try {
    const response = await fetchSamplePdf(book);
    const type = (response.headers.get('content-type') || '').toLowerCase();
    if (!type.includes('application/pdf')) throw new Error('Invalid PDF response.');

    const bytes = new Uint8Array(await response.arrayBuffer());
    const pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
    const pdf = await pdfjs.getDocument({data:bytes}).promise;
    const indexes = getSixPageIndexes(pdf.numPages);
    if (!indexes.length) throw new Error('The PDF contains no readable pages.');

    stack.innerHTML = '';
    const width = Math.min(780, stack.clientWidth || 780);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const fragment = document.createDocumentFragment();

    for (let position = 0; position < indexes.length; position++) {
      const pageIndex = indexes[position];
      const page = await pdf.getPage(pageIndex + 1);
      const base = page.getViewport({scale:1});
      const viewport = page.getViewport({scale:width / base.width});
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      await page.render({canvasContext:canvas.getContext('2d',{alpha:false}),viewport,transform:ratio!==1?[ratio,0,0,ratio,0,0]:null}).promise;

      const img = document.createElement('img');
      img.src = canvas.toDataURL('image/jpeg', .90);
      img.alt = `${titleFor(book)} sample page ${pageIndex + 1}`;
      img.draggable = false;
      img.decoding = 'async';

      const card = document.createElement('article');
      card.className = 'bs-page-card';
      const number = document.createElement('div');
      number.className = 'bs-page-number';
      number.textContent = `Sample page ${position + 1} of ${indexes.length}`;
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
    // Do not leave the reader in a broken-looking state. Give one clear retry action.
    stack.innerHTML = `<div class="bs-error"><b>Sample is temporarily unavailable</b><p>Please try opening the free sample again.</p><div class="bs-actions"><button type="button" class="bs-btn bs-secondary" id="bs-error-retry">Try Again</button></div></div>`;
    document.getElementById('bs-error-retry')?.addEventListener('click', () => {
      stack.innerHTML = '<div class="bs-loading">Preparing 6 sample pages…</div>';
      initFreeSamplePage(book);
    }, {once:true});
  }
}

function titleFor(book) { return String(book?.title || 'eBook Sample'); }
