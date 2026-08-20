import { updateSEO } from '../utils/seo.js';

const API = (window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com').replace(/\/$/, '');

function esc(value = '') { return String(value).replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#039;' }[c])); }

function sampleStyles() {
  if (document.getElementById('bookora-free-sample-style')) return;
  const style = document.createElement('style'); style.id = 'bookora-free-sample-style';
  style.textContent = `
    .bookora-sample-open{overflow:hidden!important}.bs-overlay{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.68);backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}.bs-modal{width:min(980px,100%);height:min(94vh,920px);background:#f4f7fb;border-radius:18px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.3);display:flex;flex-direction:column}.bs-modal-head{height:70px;flex:0 0 70px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;padding:0 18px;box-sizing:border-box}.bs-modal-info{min-width:0}.bs-modal-kicker{font-size:10px;font-weight:900;letter-spacing:.08em;color:#2563eb}.bs-modal-title{margin:3px 0 0;font-size:16px;font-weight:850;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bs-head-actions{display:flex;gap:8px}.bs-icon-btn{width:42px;height:42px;border:1px solid #dbe3ee;border-radius:12px;background:#fff;color:#1e293b;display:grid;place-items:center;cursor:pointer;font-size:20px;font-weight:800}.bs-icon-btn.close{font-size:25px}.bs-scroll{overflow:auto;flex:1;min-height:0;padding:20px 18px 30px}.bs-title{text-align:center;margin:0 auto 16px}.bs-title h1{margin:0;font-family:var(--font-display,Inter,sans-serif);font-size:clamp(24px,4vw,36px);line-height:1.08;letter-spacing:-.04em;color:#0b1328}.bs-title p{margin:7px auto 0;color:#64748b;font-size:12px}.bs-pages{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;width:min(780px,100%);margin:auto}.bs-page-card{background:#fff;border:1px solid #dbe3ee;border-radius:7px;overflow:hidden;box-shadow:0 10px 28px rgba(15,23,42,.1);user-select:none}.bs-page-card img{display:block;width:100%;height:auto;background:#fff;user-select:none;-webkit-user-drag:none;pointer-events:none}.bs-loading,.bs-error{grid-column:1/-1;background:#fff;border:1px solid #dbe3ee;border-radius:12px;padding:60px 20px;text-align:center;color:#64748b;font-size:13px;font-weight:800}.bs-error{border-color:#fecaca;color:#991b1b}.bs-error p{color:#64748b;margin:8px 0 18px;font-weight:500}.bs-btn{min-height:40px;padding:0 15px;border-radius:10px;font-size:12px;font-weight:800;background:#fff;color:#334155;border:1px solid #dbe3ee;cursor:pointer}.bs-buybar{margin:18px auto 0;width:min(780px,100%);box-sizing:border-box;background:#fff;border:1px solid #dbe3ee;border-radius:13px;padding:11px 13px;display:flex;align-items:center;justify-content:center;gap:13px}.bs-buytext{font-size:11px;font-weight:800;color:#475569}.bs-buy{display:inline-flex;align-items:center;justify-content:center;min-height:39px;padding:0 17px;border-radius:10px;background:#2563eb;color:#fff;text-decoration:none;font-size:12px;font-weight:900}@media(max-width:640px){.bs-overlay{padding:0}.bs-modal{width:100%;height:100%;border-radius:0}.bs-modal-head{height:62px;flex-basis:62px;padding:0 12px}.bs-scroll{padding:14px 8px 22px}.bs-title h1{font-size:25px}.bs-pages{grid-template-columns:1fr;gap:10px}.bs-buytext{display:none}.bs-buy{width:min(100%,320px)}}`;
  document.head.appendChild(style);
}

export function renderFreeSamplePage(book) {
  const title = book?.title || 'eBook Sample'; updateSEO({title:`${title} — Free Sample`,description:`Preview six selected sample pages from ${title} on Bookora.`}); sampleStyles();
  const slug = encodeURIComponent(book?.slug || book?.id || '');
  return `<div class="bs-overlay" id="bookora-free-sample-page" role="dialog" aria-modal="true"><div class="bs-modal"><div class="bs-modal-head"><div class="bs-modal-info"><div class="bs-modal-kicker">FREE SAMPLE · 6 PAGES</div><div class="bs-modal-title">${esc(title)}</div></div><div class="bs-head-actions"><button type="button" class="bs-icon-btn" id="bookora-sample-back">←</button><button type="button" class="bs-icon-btn close" id="bookora-sample-close">×</button></div></div><div class="bs-scroll"><header class="bs-title"><h1>${esc(title)}</h1><p>Six selected preview pages — the complete PDF is never loaded into the reader.</p></header><section id="bookora-sample-stack" class="bs-pages"><div class="bs-loading">Preparing 6 sample pages…</div></section><div class="bs-buybar"><span class="bs-buytext">Enjoy the preview? Read the complete eBook.</span><a class="bs-buy" href="#/checkout/${slug}">Buy Full eBook →</a></div></div></div></div>`;
}

export function closeFreeSamplePage() { document.getElementById('bookora-free-sample-page')?.remove(); document.body.classList.remove('bookora-sample-open'); }

async function fetchSamplePdf(book) {
  const key = String(book?.slug || book?.id || '').trim(); if (!key) throw new Error('Book identifier is missing.');
  const response = await fetch(`${API}/api/books/${encodeURIComponent(key)}/sample?mode=selected-6`,{cache:'no-store',headers:{Accept:'application/pdf'}});
  if (!response.ok) throw new Error(`Sample endpoint returned ${response.status}.`);
  if (!(response.headers.get('content-type') || '').toLowerCase().includes('application/pdf')) throw new Error('Sample endpoint did not return a PDF sample.');
  return response;
}

export async function initFreeSamplePage(book) {
  const stack=document.getElementById('bookora-sample-stack'), overlay=document.getElementById('bookora-free-sample-page'); if(!stack||!book||!overlay)return;
  document.body.classList.add('bookora-sample-open'); document.getElementById('bookora-sample-close')?.addEventListener('click',closeFreeSamplePage); document.getElementById('bookora-sample-back')?.addEventListener('click',closeFreeSamplePage); overlay.addEventListener('click',e=>{if(e.target===overlay)closeFreeSamplePage();});
  try {
    // SECURITY: only the backend-generated six-page sample is requested. The full PDF URL is never requested by the frontend.
    const response=await fetchSamplePdf(book), bytes=new Uint8Array(await response.arrayBuffer());
    const pdfjs=await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs'); pdfjs.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
    const pdf=await pdfjs.getDocument({data:bytes}).promise; const count=Math.min(6,pdf.numPages); if(!count)throw new Error('The sample contains no readable pages.');
    stack.innerHTML=''; const width=Math.min(780,stack.clientWidth||780),ratio=Math.min(window.devicePixelRatio||1,2),fragment=document.createDocumentFragment();
    for(let i=0;i<count;i++){
      const page=await pdf.getPage(i+1),base=page.getViewport({scale:1}),viewport=page.getViewport({scale:width/base.width}),canvas=document.createElement('canvas'); canvas.width=Math.floor(viewport.width*ratio); canvas.height=Math.floor(viewport.height*ratio);
      await page.render({canvasContext:canvas.getContext('2d',{alpha:false}),viewport,transform:ratio!==1?[ratio,0,0,ratio,0,0]:null}).promise;
      const img=document.createElement('img'); img.src=canvas.toDataURL('image/jpeg',.92); img.alt=`${book.title||'eBook'} sample page`; img.draggable=false; img.decoding='async'; img.addEventListener('contextmenu',e=>e.preventDefault());
      const card=document.createElement('article'); card.className='bs-page-card'; card.appendChild(img); fragment.appendChild(card); canvas.width=1;canvas.height=1;page.cleanup?.();
    }
    stack.appendChild(fragment); pdf.cleanup?.();pdf.destroy?.();
  } catch(error) {
    console.error('Free sample failed:',error); stack.innerHTML=`<div class="bs-error"><b>Sample is temporarily unavailable</b><p>${esc(error?.message||'Please try opening the free sample again.')}</p><button type="button" class="bs-btn" id="bs-error-retry">Try Again</button></div>`;
    document.getElementById('bs-error-retry')?.addEventListener('click',()=>{stack.innerHTML='<div class="bs-loading">Preparing 6 sample pages…</div>';initFreeSamplePage(book);},{once:true});
  }
}
