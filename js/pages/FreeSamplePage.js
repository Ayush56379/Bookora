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
    .bs-overlay{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.68);backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;animation:bsFade .16s ease}
    .bs-modal{position:relative;width:min(920px,100%);height:min(92vh,900px);background:#f4f7fb;border-radius:18px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.30);display:flex;flex-direction:column}
    .bs-modal-head{height:68px;flex:0 0 68px;background:rgba(255,255,255,.97);border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;padding:0 18px 0 22px;box-sizing:border-box;position:relative;z-index:2}
    .bs-modal-info{min-width:0}.bs-modal-kicker{font-size:10px;font-weight:900;letter-spacing:.08em;color:#2563eb}.bs-modal-title{margin:3px 0 0;font-size:16px;font-weight:850;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .bs-close{width:42px;height:42px;border:1px solid #dbe3ee;border-radius:11px;background:#fff;color:#334155;display:grid;place-items:center;cursor:pointer;font-size:25px;line-height:1;flex:0 0 auto;transition:.15s}.bs-close:hover{background:#f1f5f9;transform:scale(1.03)}
    .bs-scroll{overflow:auto;flex:1;min-height:0;padding:22px 18px 30px;scroll-behavior:smooth}.bs-scroll::-webkit-scrollbar{width:9px}.bs-scroll::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:99px;border:2px solid #f4f7fb}
    .bs-title{text-align:center;margin:0 auto 18px}.bs-title h1{margin:0;font-family:var(--font-display,Inter,sans-serif);font-size:clamp(24px,4vw,36px);line-height:1.08;letter-spacing:-.04em;color:#0b1328}.bs-title p{margin:7px auto 0;color:#64748b;font-size:12px}
    .bs-pages{display:flex;flex-direction:column;align-items:center;gap:16px}.bs-page-card{width:min(760px,100%);background:#fff;border:1px solid #dbe3ee;border-radius:7px;overflow:hidden;box-shadow:0 10px 28px rgba(15,23,42,.10)}.bs-page-card img{display:block;width:100%;height:auto;background:#fff;user-select:none;-webkit-user-drag:none}.bs-page-number{padding:6px 10px;text-align:center;background:#fff;border-top:1px solid #eef2f7;color:#94a3b8;font-size:10px;font-weight:800}
    .bs-loading{width:min(760px,100%);box-sizing:border-box;background:#fff;border:1px solid #dbe3ee;border-radius:12px;padding:90px 20px;text-align:center;color:#64748b;font-size:13px;font-weight:800}.bs-error{width:min(760px,100%);box-sizing:border-box;background:#fff;border:1px solid #fecaca;border-radius:14px;padding:34px 20px;text-align:center;color:#991b1b}.bs-error p{color:#64748b;margin:8px 0 18px;font-size:13px}.bs-actions{display:flex;justify-content:center;gap:9px;flex-wrap:wrap}.bs-btn{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 15px;border-radius:10px;text-decoration:none;font-size:12px;font-weight:800}.bs-primary{background:#2563eb;color:#fff}.bs-secondary{background:#fff;color:#334155;border:1px solid #dbe3ee}
    .bs-buybar{margin:18px auto 0;width:min(760px,100%);box-sizing:border-box;background:#fff;border:1px solid #dbe3ee;border-radius:13px;padding:11px 13px;display:flex;align-items:center;justify-content:center;gap:13px}.bs-buytext{font-size:11px;font-weight:800;color:#475569}.bs-buy{display:inline-flex;align-items:center;justify-content:center;min-height:39px;padding:0 17px;border-radius:10px;background:#2563eb;color:#fff;text-decoration:none;font-size:12px;font-weight:900}
    @keyframes bsFade{from{opacity:0}to{opacity:1}}
    @media(max-width:640px){.bs-overlay{padding:0}.bs-modal{width:100%;height:100%;border-radius:0}.bs-modal-head{height:62px;flex-basis:62px;padding:0 12px 0 16px}.bs-close{width:40px;height:40px}.bs-modal-title{font-size:14px}.bs-scroll{padding:15px 9px 22px}.bs-title{margin-bottom:14px}.bs-title h1{font-size:25px}.bs-pages{gap:10px}.bs-page-card{border-radius:4px}.bs-buybar{margin-top:12px}.bs-buytext{display:none}.bs-buy{width:min(100%,320px)}}
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
          <div class="bs-modal-info"><div class="bs-modal-kicker">FREE SAMPLE · 6 SELECTED PAGES</div><div class="bs-modal-title">${esc(title)}</div></div>
          <button type="button" class="bs-close" id="bookora-sample-close" aria-label="Close sample">×</button>
        </div>
        <div class="bs-scroll" id="bookora-sample-scroll">
          <header class="bs-title"><h1>${esc(title)}</h1><p>Selected pages from this eBook. Scroll to preview the sample.</p></header>
          <section id="bookora-sample-stack" class="bs-pages"><div class="bs-loading">Preparing sample pages…</div></section>
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

export async function initFreeSamplePage(book) {
  const stack = document.getElementById('bookora-sample-stack');
  const close = document.getElementById('bookora-sample-close');
  const overlay = document.getElementById('bookora-free-sample-page');
  if (!stack || !book || !overlay) return;

  close?.addEventListener('click', closeFreeSamplePage);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeFreeSamplePage(); });

  try {
    const key = book.slug || book.id;
    const response = await fetch(`${API}/api/books/${encodeURIComponent(key)}/sample?mode=selected`, { cache:'no-store', headers:{Accept:'application/pdf'} });
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
    const pdf = await pdfjs.getDocument({data:bytes}).promise;
    if (!pdf.numPages) throw new Error('The sample contains no readable pages.');

    stack.innerHTML = '';
    const width = Math.min(760, stack.clientWidth || 760);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const fragment = document.createDocumentFragment();
    for (let i=1;i<=pdf.numPages;i++) {
      const page = await pdf.getPage(i);
      const base = page.getViewport({scale:1});
      const viewport = page.getViewport({scale:width/base.width});
      const canvas = document.createElement('canvas');
      canvas.width=Math.floor(viewport.width*ratio); canvas.height=Math.floor(viewport.height*ratio);
      canvas.style.width=`${viewport.width}px`; canvas.style.height=`${viewport.height}px`;
      await page.render({canvasContext:canvas.getContext('2d',{alpha:false}),viewport,transform:ratio!==1?[ratio,0,0,ratio,0,0]:null}).promise;
      const img=document.createElement('img'); img.src=canvas.toDataURL('image/jpeg',.90); img.alt=`${titleFor(book)} sample page ${i}`; img.draggable=false;
      const card=document.createElement('article'); card.className='bs-page-card';
      const number=document.createElement('div'); number.className='bs-page-number'; number.textContent=`Preview page ${i} of ${pdf.numPages}`;
      card.append(img,number); fragment.appendChild(card);
      canvas.width=1; canvas.height=1; page.cleanup?.();
    }
    stack.appendChild(fragment); pdf.cleanup?.(); pdf.destroy?.();
  } catch(error) {
    console.error('Free sample failed:',error);
    stack.innerHTML=`<div class="bs-error"><b>Sample could not be opened</b><p>${esc(error?.message || 'Please try again.')}</p><div class="bs-actions"><button type="button" class="bs-btn bs-secondary" id="bs-error-close">Close</button></div></div>`;
    document.getElementById('bs-error-close')?.addEventListener('click',closeFreeSamplePage);
  }
}

function titleFor(book){ return String(book?.title || 'eBook Sample'); }
