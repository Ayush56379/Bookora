// Bookora Admin Groq eBook Review Center.
// This is admin-only UI. It never blocks seller uploads and never changes
// approval status automatically; Groq only gives the admin a recommendation.
import { apiFetch } from './config.js';

(() => {
  'use strict';
  if (window.__BOOKORA_ADMIN_GROQ_REVIEW__) return;
  window.__BOOKORA_ADMIN_GROQ_REVIEW__ = true;

  const route = () => String(location.hash || '#/').split('?')[0].replace(/\/+$/, '');
  const isAdminBooks = () => route() === '#/admin/books';
  let bound = false;
  let queueRunning = false;
  let observer = null;

  const esc = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');

  const getDb = () => {
    try {
      if (!window.firebase?.firestore) return null;
      return window.firebase.firestore();
    } catch (_) { return null; }
  };

  const reviewOf = book => book?.adminAiReview || book?.admin_ai_review || null;

  function ensureStyles() {
    if (document.getElementById('bookora-groq-review-style')) return;
    const style = document.createElement('style');
    style.id = 'bookora-groq-review-style';
    style.textContent = `
      #bookora-groq-review{margin:0 0 18px;background:#fff;border:1px solid #e2e8f0;border-radius:18px;box-shadow:0 8px 30px rgba(15,23,42,.05);overflow:hidden}
      .bgr-head{padding:18px 20px;border-bottom:1px solid #e2e8f0;display:flex;align-items:flex-start;justify-content:space-between;gap:15px}
      .bgr-kicker{font-size:11px;font-weight:900;letter-spacing:.08em;color:#7c3aed}.bgr-head h2{margin:5px 0 3px;color:#0f172a;font-size:21px}.bgr-head p{margin:0;color:#64748b;font-size:12px;line-height:1.5}
      .bgr-actions{display:flex;gap:8px;flex-wrap:wrap}.bgr-btn{border:0;border-radius:9px;padding:9px 12px;font-weight:800;cursor:pointer}.bgr-primary{background:#7c3aed;color:#fff}.bgr-secondary{background:#f1f5f9;color:#334155}.bgr-btn:disabled{opacity:.55;cursor:wait}
      .bgr-meta{padding:12px 20px;background:#fafafa;display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:#475569}.bgr-meta b{color:#0f172a}
      .bgr-list{padding:12px 20px 20px;display:grid;gap:10px}.bgr-card{border:1px solid #e2e8f0;border-radius:13px;padding:13px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center}.bgr-title{font-weight:900;color:#0f172a}.bgr-sub{font-size:11px;color:#64748b;margin-top:3px;line-height:1.45}.bgr-badges{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.bgr-badge{font-size:9px;font-weight:900;text-transform:uppercase;border-radius:999px;padding:4px 7px}.bgr-pending{background:#fef3c7;color:#92400e}.bgr-running{background:#dbeafe;color:#1d4ed8}.bgr-approve{background:#dcfce7;color:#166534}.bgr-reject{background:#fee2e2;color:#991b1b}.bgr-manual{background:#ede9fe;color:#6d28d9}.bgr-error{background:#fee2e2;color:#991b1b}.bgr-detail{margin-top:9px;padding:10px;border-radius:10px;background:#f8fafc;color:#475569;font-size:11px;line-height:1.55}.bgr-detail strong{color:#0f172a}.bgr-checks{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.bgr-check{font-size:9px;border-radius:6px;padding:4px 6px;background:#fff;border:1px solid #e2e8f0}.bgr-card-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.bgr-card-actions button{border:0;border-radius:8px;padding:8px 10px;font-size:10px;font-weight:800;cursor:pointer}.bgr-analyze{background:#7c3aed;color:#fff}.bgr-open{background:#f1f5f9;color:#334155}.bgr-note{padding:18px 20px;color:#64748b;font-size:12px}
      @media(max-width:700px){.bgr-head{flex-direction:column}.bgr-card{grid-template-columns:1fr}.bgr-card-actions{justify-content:flex-start}}
    `;
    document.head.appendChild(style);
  }

  function badge(review) {
    if (!review) return '<span class="bgr-badge bgr-pending">AI NOT RUN</span>';
    const status = String(review.recommendation || 'needs_manual_review').toLowerCase();
    if (status === 'approve') return '<span class="bgr-badge bgr-approve">AI RECOMMENDS APPROVE</span>';
    if (status === 'reject') return '<span class="bgr-badge bgr-reject">AI RECOMMENDS REJECT</span>';
    return '<span class="bgr-badge bgr-manual">MANUAL REVIEW ADVISED</span>';
  }

  function checkHtml(review) {
    const checks = review?.checks || {};
    return Object.entries(checks).map(([key,value]) => `<span class="bgr-check"><strong>${esc(key.replaceAll('_',' '))}:</strong> ${esc(value)}</span>`).join('');
  }

  function card(book) {
    const review = reviewOf(book);
    const rec = String(review?.recommendation || '').toLowerCase();
    const running = book.__groqRunning;
    const error = book.__groqError;
    const title = book.title || 'Untitled eBook';
    const seller = book.seller_name || book.sellerName || book.seller_id || book.sellerId || 'Unknown seller';
    const reasons = Array.isArray(review?.reasons) ? review.reasons : [];
    const detail = review ? `<div class="bgr-detail"><strong>AI Summary:</strong> ${esc(review.summary || 'No summary')}<br><strong>Confidence:</strong> ${esc(review.confidence ?? 0)}% · <strong>Pages:</strong> ${esc(review.pageCount ?? '—')} · <strong>Text checked:</strong> ${esc(review.textChars ?? 0)} chars${review.adminAction ? `<br><strong>Admin suggestion:</strong> ${esc(review.adminAction)}` : ''}${reasons.length ? `<br><strong>Reasons:</strong> ${esc(reasons.join(' • '))}` : ''}<div class="bgr-checks">${checkHtml(review)}</div></div>` : '';
    return `<article class="bgr-card" data-bgr-id="${esc(book.id)}"><div><div class="bgr-title">${esc(title)}</div><div class="bgr-sub">${esc(book.author || 'Unknown author')} · ${esc(seller)} · status: ${esc(book.status || 'pending')}</div><div class="bgr-badges">${running ? '<span class="bgr-badge bgr-running">ANALYZING PDF…</span>' : badge(review)}${error ? `<span class="bgr-badge bgr-error">${esc(error)}</span>` : ''}</div>${detail}</div><div class="bgr-card-actions"><button class="bgr-analyze" data-bgr-analyze="${esc(book.id)}" ${running?'disabled':''}>${running?'Analyzing…':review?'Re-analyze':'Analyze PDF'}</button><button class="bgr-open" data-bgr-open="${esc(book.id)}">Open Book</button></div></article>`;
  }

  async function loadBooks() {
    const db = getDb();
    if (!db) return [];
    try {
      const snap = await db.collection('books').get();
      return snap.docs.map(doc => ({id:String(doc.id), ...doc.data()})).sort((a,b) => (Date.parse(b.updated_at||b.updatedAt||b.created_at||b.createdAt||'')||0) - (Date.parse(a.updated_at||a.updatedAt||a.created_at||a.createdAt||'')||0));
    } catch (error) {
      console.warn('[Bookora Groq Review] books read failed:', error);
      return [];
    }
  }

  function render(books) {
    if (!isAdminBooks()) return;
    const host = document.querySelector('.admin-books-page .ab-wrap');
    if (!host) return;
    ensureStyles();
    let panel = document.getElementById('bookora-groq-review');
    if (!panel) { panel = document.createElement('section'); panel.id='bookora-groq-review'; host.prepend(panel); }
    const candidates = books.filter(book => String(book.status || 'pending').toLowerCase() === 'pending');
    const unanalyzed = candidates.filter(book => !reviewOf(book) && !book.__groqRunning).length;
    panel.innerHTML = `<div class="bgr-head"><div><div class="bgr-kicker">PRIVATE ADMIN AI REVIEW</div><h2>Groq eBook Review Center</h2><p>Every uploaded eBook appears here. Groq reviews the stored PDF and gives you reasons + a recommendation. The AI never approves or rejects automatically.</p></div><div class="bgr-actions"><button class="bgr-btn bgr-primary" id="bgr-analyze-pending" ${queueRunning||!candidates.length?'disabled':''}>${queueRunning?'Analyzing queue…':`Analyze ${candidates.length} pending`}</button><button class="bgr-btn bgr-secondary" id="bgr-refresh">Refresh</button></div></div><div class="bgr-meta"><span>Pending: <b>${candidates.length}</b></span><span>Awaiting AI: <b>${unanalyzed}</b></span><span>Reviewed: <b>${candidates.length-unanalyzed}</b></span><span>Decision: <b>Admin only</b></span></div><div class="bgr-list">${candidates.length ? candidates.map(card).join('') : '<div class="bgr-note">No pending eBooks right now. New pending uploads will appear here automatically.</div>'}</div>`;
    bindPanel();
  }

  async function analyze(bookId) {
    const db = getDb();
    if (!db) throw new Error('Firebase is not ready.');
    const cardEl = document.querySelector(`[data-bgr-id="${CSS.escape(String(bookId))}"]`);
    const snap = await db.collection('books').doc(String(bookId)).get();
    if (!snap.exists) throw new Error('Book no longer exists.');
    const book = {id:String(snap.id), ...snap.data(), __groqRunning:true};
    const books = await loadBooks();
    const index = books.findIndex(item => String(item.id) === String(bookId));
    if (index >= 0) { books[index] = {...books[index], __groqRunning:true, __groqError:''}; render(books); }
    try {
      const response = await apiFetch('/api/admin/ebook-review/analyze', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({book_id:String(bookId)})});
      const data = await response.json().catch(()=>({}));
      if (!response.ok || !data.success) throw new Error(data.error || `AI review failed (HTTP ${response.status}).`);
      return data.review;
    } catch (error) {
      const latest = await loadBooks(); const idx=latest.findIndex(item=>String(item.id)===String(bookId));
      if(idx>=0){latest[idx].__groqError=error?.message||'Review failed';latest[idx].__groqRunning=false;render(latest);}
      throw error;
    } finally {
      const latest = await loadBooks(); const idx=latest.findIndex(item=>String(item.id)===String(bookId));
      if(idx>=0){latest[idx].__groqRunning=false;render(latest);}
    }
  }

  async function analyzePending() {
    if (queueRunning) return;
    queueRunning = true;
    try {
      let books = await loadBooks();
      const queue = books.filter(book => String(book.status || 'pending').toLowerCase() === 'pending' && !reviewOf(book));
      render(books);
      for (const book of queue) {
        try { await analyze(book.id); } catch (error) { console.warn('[Bookora Groq Review] queue item failed:', book.id, error); }
      }
    } finally {
      queueRunning = false;
      render(await loadBooks());
    }
  }

  function bindPanel() {
    const panel=document.getElementById('bookora-groq-review'); if(!panel||panel.dataset.bound==='1')return; panel.dataset.bound='1';
    panel.addEventListener('click', async event=>{
      const analyzeButton=event.target.closest('[data-bgr-analyze]');
      if(analyzeButton){const id=analyzeButton.dataset.bgrAnalyze;analyzeButton.disabled=true;try{await analyze(id);}catch(error){alert(error?.message||'Groq review failed.');}return;}
      if(event.target.closest('#bgr-analyze-pending')){await analyzePending();return;}
      if(event.target.closest('#bgr-refresh')){render(await loadBooks());return;}
      const open=event.target.closest('[data-bgr-open]');
      if(open){const id=open.dataset.bgrOpen;window.dispatchEvent(new CustomEvent('bookora:admin-open-book',{detail:{id}}));}
    });
  }

  async function boot() {
    if (!isAdminBooks()) return;
    const books = await loadBooks();
    render(books);
    // Automatically review newly uploaded pending books once, while keeping
    // the admin as the final approver. Existing reviewed books are skipped.
    const fresh = books.filter(book => String(book.status || 'pending').toLowerCase()==='pending' && !reviewOf(book));
    if (fresh.length && !queueRunning) {
      queueRunning = true;
      try { for (const book of fresh) { try { await analyze(book.id); } catch (_) {} } }
      finally { queueRunning=false; render(await loadBooks()); }
    }
  }

  const start = () => {
    if (observer) observer.disconnect();
    observer = new MutationObserver(() => { if(isAdminBooks() && document.querySelector('.admin-books-page .ab-wrap') && !document.getElementById('bookora-groq-review')) boot(); });
    observer.observe(document.body,{childList:true,subtree:true});
    boot();
  };

  window.addEventListener('hashchange',()=>{if(isAdminBooks())setTimeout(start,250);});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
