import { apiFetch } from '../config.js';
import { updateSEO } from '../utils/seo.js';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const db = () => window.firebase?.firestore ? window.firebase.firestore() : null;
const reviewOf = b => b?.adminAiReview || b?.admin_ai_review || null;
const pendingStatus = b => ['pending','submitted','pending_review','awaiting_review','under_review'].includes(String(b?.status || '').toLowerCase());

async function load() {
  const d = db();
  if (!d) throw Error('Firebase is not ready.');
  const s = await d.collection('books').get();
  return s.docs.map(x => ({ id:String(x.id), ...x.data() }))
    .filter(pendingStatus)
    .sort((a,b) => (Date.parse(b.created_at || b.createdAt || b.updated_at || b.updatedAt || '') || 0) - (Date.parse(a.created_at || a.createdAt || a.updated_at || a.updatedAt || '') || 0));
}

async function run(id) {
  const r = await apiFetch('/api/admin/ebook-review/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({book_id:String(id)}) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.success) throw Error(d.error || `Review failed (HTTP ${r.status})`);
  return d.review;
}

function badge(b) {
  if (b.__run) return '<span class="ars-b running">ANALYZING PDF…</span>';
  if (b.__err) return `<span class="ars-b error">${esc(b.__err)}</span>`;
  const r = reviewOf(b), rec = String(r?.recommendation || 'manual_review').toLowerCase();
  if (!r) return '<span class="ars-b pending">AI REVIEW PENDING</span>';
  return `<span class="ars-b ${rec==='approve'?'ok':rec==='reject'?'bad':'manual'}">AI RECOMMENDS ${rec==='approve'?'APPROVE':rec==='reject'?'REJECT':'MANUAL REVIEW'}</span>`;
}

function card(b) {
  const r = reviewOf(b), reasons = Array.isArray(r?.reasons) ? r.reasons : [];
  const uid = b.seller_id || b.sellerId || b.creator_id || b.creatorId || 'Not available';
  const checks = Object.entries(r?.checks || {}).map(([k,v]) => `<span><b>${esc(k.replaceAll('_',' '))}:</b> ${esc(v)}</span>`).join('');
  return `<article class="ars-card" data-id="${esc(b.id)}">
    <div class="ars-main">
      <div class="ars-title">${esc(b.title || 'Untitled eBook')}</div>
      <div class="ars-sub">Author: ${esc(b.author || 'Unknown')} · Uploader: ${esc(uid)}</div>
      <div class="ars-sub">Category: ${esc(b.category || '—')} · Price: ₹${Number(b.sale_price ?? b.price ?? 0).toLocaleString('en-IN')} · Book ID: ${esc(b.id)}</div>
      <div class="ars-badges">${badge(b)}</div>
      ${r ? `<div class="ars-report"><div><b>AI Summary:</b> ${esc(r.summary || 'No summary')}</div><div><b>Recommendation:</b> ${esc(r.recommendation || 'Manual review')} · <b>Confidence:</b> ${esc(r.confidence ?? 0)}%</div><div><b>Pages:</b> ${esc(r.pageCount ?? '—')} · <b>Text checked:</b> ${esc(r.textChars ?? 0)} characters</div>${reasons.length ? `<div class="ars-reasons"><b>Reasons:</b><ul>${reasons.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}${checks ? `<div class="ars-checks">${checks}</div>` : ''}</div>` : '<div class="ars-wait">The stored PDF will be sent to the dedicated Groq review API. AI only recommends; Admin makes the final decision.</div>'}
    </div>
    <div class="ars-actions"><button class="ars-btn ai" data-review="${esc(b.id)}" ${b.__run?'disabled':''}>${b.__run?'Analyzing…':r?'Re-analyze':'Run Groq Review'}</button></div>
  </article>`;
}

function styles() {
  if (document.getElementById('ars-style')) return;
  const s = document.createElement('style'); s.id='ars-style'; s.textContent = `
    .ars-wrap{min-height:calc(100vh - 150px);background:#f8fafc;padding:32px 32px 64px;box-sizing:border-box}
    .ars-inner{max-width:1450px;margin:0 auto}
    .ars-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;margin-bottom:24px}
    .ars-kicker{color:#2563eb;font-weight:800;font-size:12px;letter-spacing:.03em}
    .ars-hero h1{margin:6px 0 4px;color:#0f172a;font-size:32px;line-height:1.15}
    .ars-hero p{margin:0;max-width:800px;color:#64748b;font-size:13px;line-height:1.6}
    .ars-hero p b{color:#334155}
    .ars-top-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap}
    .ars-btn{border:0;border-radius:10px;padding:11px 16px;font-weight:800;cursor:pointer;font-size:13px;background:#fff;color:#334155;border:1px solid #e2e8f0}
    .ars-btn.ai{background:#2563eb;color:#fff;border-color:#2563eb}
    .ars-btn:disabled{opacity:.55;cursor:wait}
    .ars-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:18px}
    .ars-stat{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:17px 18px;box-shadow:0 2px 10px rgba(15,23,42,.03)}
    .ars-stat small{display:block;color:#64748b;font-size:12px}.ars-stat b{display:block;color:#0f172a;font-size:25px;margin-top:5px}
    .ars-toolbar{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;margin-bottom:18px;display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap}
    .ars-toolbar span{font-size:13px;color:#64748b}.ars-toolbar b{color:#0f172a}
    .ars-list{display:grid;gap:12px}.ars-card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:18px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;box-shadow:0 2px 10px rgba(15,23,42,.03)}
    .ars-title{font-size:16px;font-weight:800;color:#0f172a}.ars-sub{font-size:12px;color:#64748b;margin-top:5px;word-break:break-word}.ars-badges{margin-top:10px}.ars-b{display:inline-block;padding:5px 9px;border-radius:999px;font-size:9px;font-weight:900}.pending{background:#fef3c7;color:#92400e}.running{background:#dbeafe;color:#1d4ed8}.ok{background:#dcfce7;color:#166534}.bad,.error{background:#fee2e2;color:#991b1b}.manual{background:#ede9fe;color:#6d28d9}
    .ars-report{margin-top:12px;padding:12px 14px;background:#f8fafc;border:1px solid #eef2f7;border-radius:10px;color:#475569;font-size:12px;line-height:1.65}.ars-report b{color:#0f172a}.ars-reasons ul{margin:4px 0 4px 18px;padding:0}.ars-checks{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.ars-checks span{background:#fff;border:1px solid #e2e8f0;border-radius:7px;padding:4px 7px;font-size:10px}.ars-wait{margin-top:10px;color:#64748b;font-size:11px;line-height:1.5}.ars-actions{display:flex;align-items:flex-start;justify-content:flex-end}.ars-empty{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:56px 20px;text-align:center;color:#64748b}
    @media(max-width:900px){.ars-wrap{padding:24px 18px 50px}.ars-stats{grid-template-columns:1fr 1fr}.ars-card{grid-template-columns:1fr}.ars-actions{justify-content:flex-start}}
    @media(max-width:600px){.ars-wrap{padding:20px 12px 40px}.ars-stats{grid-template-columns:1fr}.ars-hero h1{font-size:27px}.ars-card{padding:15px}.ars-btn{width:100%}.ars-top-actions{width:100%}}
  `; document.head.appendChild(s);
}

export function renderAdminReviewSubmissionsPage() {
  styles(); updateSEO({title:'Review Submissions — Admin',description:'Admin eBook moderation and dedicated Groq review queue.'});
  return `<main class="ars-wrap"><div class="ars-inner">
    <section class="ars-hero"><div><div class="ars-kicker">BOOK MANAGEMENT</div><h1>Review Submissions</h1><p>Review newly submitted eBooks before marketplace approval. The dedicated Groq API checks the stored PDF and provides a recommendation. <b>Admin always makes the final decision.</b></p></div><div class="ars-top-actions"><button class="ars-btn ai" id="ars-analyze-all">Analyze pending</button><button class="ars-btn" id="ars-refresh">↻ Refresh</button></div></section>
    <section class="ars-stats"><div class="ars-stat"><small>Pending Submissions</small><b id="ars-count">—</b></div><div class="ars-stat"><small>AI Reviewed</small><b id="ars-reviewed">—</b></div><div class="ars-stat"><small>Awaiting AI Review</small><b id="ars-awaiting">—</b></div></section>
    <section class="ars-toolbar"><span>Firebase submission queue <b id="ars-sync">Loading…</b></span><span>Auto-refresh: <b>15 sec</b></span></section>
    <section class="ars-list" id="ars-list"><div class="ars-empty">Loading submissions…</div></section>
  </div></main>`;
}

export async function initAdminReviewSubmissionsEvents() {
  const list=document.getElementById('ars-list'); if(!list) return;
  let runningAll=false;
  const draw=xs=>{document.getElementById('ars-count').textContent=xs.length;document.getElementById('ars-reviewed').textContent=xs.filter(x=>!!reviewOf(x)).length;document.getElementById('ars-awaiting').textContent=xs.filter(x=>!reviewOf(x)).length;document.getElementById('ars-sync').textContent='Connected';list.innerHTML=xs.length?xs.map(card).join(''):'<div class="ars-empty">✓ No pending eBook submissions right now.</div>';};
  const refresh=async()=>{try{draw(await load());}catch(e){document.getElementById('ars-sync').textContent='Error';list.innerHTML=`<div class="ars-empty">Could not load submissions.<br>${esc(e.message||'Please refresh.')}</div>`;}};
  const analyze=async id=>{const xs=await load(),i=xs.findIndex(x=>String(x.id)===String(id));if(i<0)throw Error('Submission no longer exists.');xs[i].__run=true;draw(xs);try{await run(id);}finally{await refresh();}};
  const analyzeAll=async()=>{if(runningAll)return;runningAll=true;const btn=document.getElementById('ars-analyze-all');btn.disabled=true;btn.textContent='Analyzing…';try{for(const b of await load()){if(!reviewOf(b)){try{await analyze(b.id);}catch(e){console.warn('[Bookora Review]',e);}}}}finally{runningAll=false;btn.disabled=false;btn.textContent='Analyze pending';await refresh();}};
  list.onclick=async e=>{const b=e.target.closest('[data-review]');if(!b)return;b.disabled=true;try{await analyze(b.dataset.review);}catch(err){alert(err.message||'Review failed.');await refresh();}};
  document.getElementById('ars-refresh')?.addEventListener('click',refresh);document.getElementById('ars-analyze-all')?.addEventListener('click',analyzeAll);
  await refresh();
  clearInterval(window.__ARS_TIMER);window.__ARS_TIMER=setInterval(()=>{if(String(location.hash).startsWith('#/admin/review-submissions'))refresh();},15000);
}
