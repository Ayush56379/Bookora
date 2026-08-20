import { updateSEO } from '../utils/seo.js';
import { API_BASE_URL } from '../config.js';

const API=(window.BOOKORA_API_URL||API_BASE_URL||'https://bookora-backend-x08l.onrender.com').replace(/\/$/,'');
const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const bytesFromBase64=value=>{const s=String(value||'').replace(/^data:application\/pdf;base64,/i,'').replace(/\s/g,'');if(!s)throw Error('PREVIEW_DATA_MISSING');const b=atob(s),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;};

// Keep successful preview responses in memory for the current SPA session.
// This avoids downloading/decoding the same sample again when the user closes
// and reopens a book, while never caching the full purchased PDF.
const previewMemoryCache=new Map();
let pdfjsPromise=null;

function styles(){if(document.getElementById('bookora-free-sample-style'))return;const s=document.createElement('style');s.id='bookora-free-sample-style';s.textContent=`.bookora-sample-open{overflow:hidden!important}.bs-overlay{position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.68);backdrop-filter:blur(7px);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}.bs-modal{width:min(980px,100%);height:min(94vh,920px);background:#f4f7fb;border-radius:18px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.3);display:flex;flex-direction:column}.bs-head{height:70px;flex:0 0 70px;background:#fff;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;padding:0 18px}.bs-kicker{font-size:10px;font-weight:900;letter-spacing:.08em;color:#2563eb}.bs-head-title{margin-top:3px;font-size:16px;font-weight:850;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bs-actions{display:flex;gap:8px}.bs-icon{width:42px;height:42px;border:1px solid #dbe3ee;border-radius:12px;background:#fff;color:#1e293b;display:grid;place-items:center;cursor:pointer;font-size:20px;font-weight:800}.bs-scroll{overflow:auto;flex:1;padding:20px 18px 30px;box-sizing:border-box;min-width:0}.bs-title{text-align:center;margin:0 auto 16px}.bs-title h1{margin:0;font-size:clamp(24px,4vw,36px);line-height:1.08;color:#0b1328}.bs-title p{margin:7px 0 0;color:#64748b;font-size:12px}.bs-pages{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;width:min(780px,100%);margin:auto;box-sizing:border-box;min-width:0}.bs-page{width:100%;min-width:0;box-sizing:border-box;background:#fff;border:1px solid #dbe3ee;border-radius:7px;overflow:hidden;box-shadow:0 10px 28px rgba(15,23,42,.1);display:flex;justify-content:center;align-items:flex-start}.bs-page canvas{display:block;max-width:100%;height:auto;background:#fff}.bs-loading,.bs-error{grid-column:1/-1;background:#fff;border:1px solid #dbe3ee;border-radius:12px;padding:60px 20px;text-align:center;color:#64748b;font-size:13px;font-weight:800}.bs-error p{color:#64748b;margin:8px 0 18px;font-weight:500}.bs-btn{min-height:40px;padding:0 15px;border-radius:10px;font-size:12px;font-weight:800;background:#fff;color:#334155;border:1px solid #dbe3ee;cursor:pointer}.bs-buybar{margin:18px auto 0;width:min(780px,100%);box-sizing:border-box;background:#fff;border:1px solid #dbe3ee;border-radius:13px;padding:11px 13px;display:flex;align-items:center;justify-content:center}.bs-buy{display:inline-flex;align-items:center;justify-content:center;min-height:39px;padding:0 17px;border-radius:10px;background:#2563eb;color:#fff;text-decoration:none;font-size:12px;font-weight:900}@media(max-width:640px){.bs-overlay{padding:0}.bs-modal{width:100%;height:100%;border-radius:0}.bs-head{height:62px;flex-basis:62px;padding:0 12px}.bs-scroll{padding:14px 8px 22px}.bs-pages{grid-template-columns:1fr;gap:10px}.bs-page{border-radius:6px}}`;document.head.appendChild(s);}

async function readJsonResponse(response){const text=await response.text();if(!text)return {};try{return JSON.parse(text);}catch(_){return {success:false,error:`INVALID_JSON_HTTP_${response.status}`,message:text.slice(0,500)};}}

async function getPdfJs(){
  if(!pdfjsPromise){
    pdfjsPromise=import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs').then(pdfjs=>{
      pdfjs.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

async function renderPdf(stack,payload,requestId){
  const pdfjs=await getPdfJs();
  const data=payload?.preview?.data||payload?.pdf_base64;
  if(!data)throw Error('PREVIEW_DATA_MISSING');
  const pdf=await pdfjs.getDocument({data:bytesFromBase64(data)}).promise;
  if(requestId!==stack.dataset.requestId){pdf.destroy?.();return;}
  const count=Math.min(6,pdf.numPages,Number(payload.pageCount||payload.previewPages?.length||6));
  if(!count)throw Error('PREVIEW_HAS_NO_PAGES');

  const stackWidth=stack.getBoundingClientRect().width;
  const columns=window.matchMedia('(max-width: 640px)').matches?1:2;
  const gap=columns===2?16:10;
  const width=Math.max(1,Math.floor((stackWidth-gap*(columns-1))/columns));
  const ratio=Math.min(window.devicePixelRatio||1,2);
  const cards=[];
  for(let i=0;i<count;i++){
    const card=document.createElement('article');
    card.className='bs-page';
    card.dataset.page=String(i+1);
    cards.push(card);
  }
  if(requestId===stack.dataset.requestId){stack.innerHTML='';cards.forEach(card=>stack.appendChild(card));}

  // Render pages concurrently. The old implementation waited for page 1,
  // then page 2, then page 3, etc. A six-page sample therefore paid the full
  // render cost serially. Each page still has its own canvas and order remains
  // fixed by its pre-created card.
  await Promise.all(cards.map(async(card,i)=>{
    if(requestId!==stack.dataset.requestId)return;
    const page=await pdf.getPage(i+1);
    try{
      const base=page.getViewport({scale:1});
      const scale=width/base.width;
      const vp=page.getViewport({scale});
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.ceil(vp.width*ratio));
      canvas.height=Math.max(1,Math.ceil(vp.height*ratio));
      canvas.style.width=`${Math.ceil(vp.width)}px`;
      canvas.style.height=`${Math.ceil(vp.height)}px`;
      canvas.style.maxWidth='100%';
      canvas.style.display='block';
      await page.render({canvasContext:canvas.getContext('2d',{alpha:false}),viewport:vp,transform:ratio!==1?[ratio,0,0,ratio,0,0]:undefined}).promise;
      if(requestId===stack.dataset.requestId)card.replaceChildren(canvas);
    }finally{page.cleanup?.();}
  }));
  pdf.destroy?.();
}

async function requestPreview(book,signal){
  const key=String(book?.slug||book?.id||'').trim();
  if(!key)throw Error('BOOK_ID_MISSING');
  const cached=previewMemoryCache.get(key);
  if(cached){console.info('[Bookora Free Sample] memory cache hit',{bookId:book?.id||null,slug:book?.slug||null});return cached;}
  const url=`${API}/api/books/${encodeURIComponent(key)}/sample?mode=selected`;
  const meta={bookId:book?.id||null,slug:book?.slug||null,mode:'selected',url};
  console.info('[Bookora Free Sample] API request',meta);
  let response;
  try{response=await fetch(url,{cache:'no-store',credentials:'omit',headers:{Accept:'application/json'},signal});}
  catch(error){console.error('[Bookora Free Sample] API network failure',meta,{error:error?.message});throw Error(`PREVIEW_NETWORK_ERROR: ${error?.message||'request failed'}`);}
  const payload=await readJsonResponse(response);
  if(!response.ok||payload?.success!==true){console.error('[Bookora Free Sample] API failed',{...meta,status:response.status,response:payload});throw Error(`${payload?.error||`HTTP_${response.status}`}: ${payload?.message||'Preview pages could not be generated.'}`);}
  if(payload.bookId&&String(payload.bookId)!==key&&String(payload.bookId)!==String(book?.id||'')){console.error('[Bookora Free Sample] API book mismatch',{...meta,responseBookId:payload.bookId});throw Error('PREVIEW_BOOK_MISMATCH');}
  // Keep only the limited preview payload. Never cache or expose the source PDF.
  previewMemoryCache.set(key,payload);
  while(previewMemoryCache.size>3)previewMemoryCache.delete(previewMemoryCache.keys().next().value);
  console.info('[Bookora Free Sample] API success',{...meta,status:response.status,pageCount:payload.pageCount,limited:payload.limited,cached:payload.cached});
  return payload;
}

export function renderFreeSamplePage(book){styles();const title=book?.title||'eBook Sample';updateSEO({title:`${title} — Free Sample`,description:`Preview selected sample pages from ${title} on Bookora.`});const slug=encodeURIComponent(book?.slug||book?.id||'');return `<div class="bs-overlay" id="bookora-free-sample-page" role="dialog" aria-modal="true"><div class="bs-modal"><div class="bs-head"><div><div class="bs-kicker">FREE SAMPLE · UP TO 6 PAGES</div><div class="bs-head-title">${esc(title)}</div></div><div class="bs-actions"><button class="bs-icon" id="bookora-sample-back" type="button">←</button><button class="bs-icon" id="bookora-sample-close" type="button">×</button></div></div><div class="bs-scroll"><header class="bs-title"><h1>${esc(title)}</h1><p>Selected preview pages — the complete PDF is never loaded into the reader.</p></header><section id="bookora-sample-stack" class="bs-pages"><div class="bs-loading">Preparing your free sample…</div></section><div class="bs-buybar"><a class="bs-buy" href="#/checkout/${slug}">Buy Full eBook →</a></div></div></div></div>`;}

export function closeFreeSamplePage(){const o=document.getElementById('bookora-free-sample-page');if(o){o._bookoraPreviewAbort?.abort();o.dataset.closed='1';o.remove();}document.body.classList.remove('bookora-sample-open');}
export async function initFreeSamplePage(book){
  const o=document.getElementById('bookora-free-sample-page'),stack=o?.querySelector('#bookora-sample-stack');
  if(!o||!stack||!book)return;
  document.body.classList.add('bookora-sample-open');
  if(!o.dataset.listeners){o.dataset.listeners='1';o.querySelector('#bookora-sample-close')?.addEventListener('click',closeFreeSamplePage);o.querySelector('#bookora-sample-back')?.addEventListener('click',closeFreeSamplePage);o.addEventListener('click',e=>{if(e.target===o)closeFreeSamplePage();});}
  const requestId=crypto.randomUUID?.()||`${Date.now()}-${Math.random()}`;
  stack.dataset.requestId=requestId;
  stack.innerHTML='<div class="bs-loading">Preparing your free sample…</div>';
  o._bookoraPreviewAbort?.abort();
  const controller=new AbortController();o._bookoraPreviewAbort=controller;
  try{
    const payload=await requestPreview(book,controller.signal);
    if(o.dataset.closed==='1'||requestId!==stack.dataset.requestId)return;
    await renderPdf(stack,payload,requestId);
  }catch(error){
    if(error?.name==='AbortError'||o.dataset.closed==='1'||requestId!==stack.dataset.requestId)return;
    console.error('[Bookora Free Sample] preview unavailable',{bookId:book?.id,slug:book?.slug,error:error?.message});
    stack.innerHTML=`<div class="bs-error"><b>Free sample is temporarily unavailable.</b><p>We couldn't prepare the selected preview pages right now.</p><button class="bs-btn" id="bs-error-retry" type="button">Try Again</button></div>`;
    stack.querySelector('#bs-error-retry')?.addEventListener('click',()=>initFreeSamplePage(book),{once:true});
  }finally{if(o._bookoraPreviewAbort===controller)delete o._bookoraPreviewAbort;}
}