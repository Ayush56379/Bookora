// Bookora Library Page
// Firestore-direct entitlement loading. The library identity is verified against
// the authenticated Firebase user and an active Firestore entitlement before use.
import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';
import { ReaderModal } from '../components/ReaderModal.js';
import { downloadEBook } from '../utils/pdfDownloader.js';
import { Toast } from '../components/Toast.js';

let librarySyncStarted = false;
let libraryLoadState = 'idle';
let libraryLoadError = '';
let libraryRecords = [];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>\"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function normalizeAccessStatus(value) { return String(value ?? 'active').trim().toLowerCase(); }
function icon(name) {
  const icons = {
    book:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 6.5 2Z"/></svg>',
    check:'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 4 4L19 6"/></svg>',
    refresh:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 11a8.1 8.1 0 0 0-15.5-3M4 4v5h5"/><path d="M4 13a8.1 8.1 0 0 0 15.5 3M20 20v-5h-5"/></svg>',
    spark:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m12 3 1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></svg>',
    warning:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17h.01"/></svg>'
  }; return icons[name] || icons.book;
}
function getLibraryBooks() {
  return libraryRecords.map(record => {
    const bookId = String(record.bookId || record.book_id || record.id || '').trim();
    const catalogBook = (Array.isArray(state.books) ? state.books : []).map(book => state.normalizeBook(book)).find(book => book && String(book.id) === bookId);
    return { ...(catalogBook || {}), ...record, id:bookId, title:record.title || catalogBook?.title || 'Untitled eBook', author:record.author || catalogBook?.author || 'Bookora Creator', cover_url:record.coverUrl || record.cover_url || catalogBook?.cover_url || catalogBook?.coverUrl || '', pages:Number(record.pages || catalogBook?.pages || 0), cover_gradient:catalogBook?.cover_gradient || 'linear-gradient(135deg,#1e3a8a,#4f46e5)' };
  }).filter(book => book.id);
}
function coverMarkup(book) {
  const cover = String(book.cover_url || book.coverUrl || '').trim(); const title = escapeHtml(book.title || 'eBook');
  if (cover) return `<img class="library-cover" src="${escapeHtml(cover)}" alt="${title} cover" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><div class="library-cover-fallback" style="display:none">${title.slice(0,34)}</div>`;
  return `<div class="library-cover-fallback" style="background:${book.cover_gradient || 'linear-gradient(145deg,#1e3a8a,#4f46e5)'}">${title.slice(0,34)}</div>`;
}
function skeletonMarkup(){ return '<div class="library-skeleton-grid" aria-label="Loading library"><div class="library-skeleton"></div><div class="library-skeleton"></div><div class="library-skeleton"></div></div>'; }
function emptyMarkup(){ return `<div class="library-state"><div class="library-state-inner"><div class="library-state-icon">${icon('book')}</div><h3>Your library is waiting for you</h3><p>Purchase an eBook and it will appear here permanently. Read in your browser or download your licensed file whenever you want.</p><a href="#/explore" class="btn btn-primary btn-lg">Discover eBooks</a></div></div>`; }
function errorMarkup(){ return `<div class="library-state library-error"><div class="library-state-inner"><div class="library-state-icon">${icon('warning')}</div><h3>Couldn't load your library</h3><p>${escapeHtml(libraryLoadError || 'Please try again. Your purchases are not affected.')}</p><button type="button" class="btn btn-primary library-retry-btn">Try Again</button></div></div>`; }
function stateMarkup(){ if(libraryLoadState==='loading') return skeletonMarkup(); if(libraryLoadState==='error') return errorMarkup(); return emptyMarkup(); }
function renderStats(books){
  const count=books.length, available=books.filter(book=>normalizeAccessStatus(book.accessStatus)==='active').length;
  const values=books.map(book=>Number(state.readingProgress?.[book.id]?.percent ?? book.readingProgress ?? 0)).filter(Number.isFinite);
  const progress=values.length?Math.round(values.reduce((a,b)=>a+Math.max(0,Math.min(100,b)),0)/values.length):0;
  return `<div class="library-stats"><div class="library-stat"><div class="library-stat-icon">${icon('book')}</div><div><div class="library-stat-label">Owned Books</div><div class="library-stat-value">${count}</div></div></div><div class="library-stat"><div class="library-stat-icon">${icon('check')}</div><div><div class="library-stat-label">Available to Read</div><div class="library-stat-value">${available}</div></div></div><div class="library-stat"><div class="library-stat-icon">${icon('spark')}</div><div><div class="library-stat-label">Reading Progress</div><div class="library-stat-value">${progress}%</div></div></div></div>`;
}
function renderBody(){
  if(libraryLoadState==='loading'||libraryLoadState==='error') return stateMarkup(); const books=getLibraryBooks(); if(!books.length) return emptyMarkup();
  return `<div class="library-grid">${books.map(book=>{ const prog=state.readingProgress?.[book.id]||{}; const percent=Math.max(0,Math.min(100,Number(prog.percent ?? book.readingProgress ?? 0)||0)); const safeId=escapeHtml(book.id); const orderId=String(book.orderId||book.order_id||'').trim(); const purchasedAt=String(book.purchasedAt||book.purchased_at||'').trim(); return `<article class="library-card animate-slide-up"><div class="library-card-top">${coverMarkup(book)}<div class="library-card-meta"><span class="library-license">${icon('check')} LIFETIME LICENSE</span><h3 class="library-book-title">${escapeHtml(book.title)}</h3><div class="library-author">by ${escapeHtml(book.author||'Bookora Creator')}</div><div class="library-order">${orderId?`Order ${escapeHtml(orderId)}`:(purchasedAt?`Purchased ${escapeHtml(purchasedAt.slice(0,10))}`:'Purchased eBook')}</div><div class="library-status"><span class="library-status-dot"></span> Active access</div></div></div><div class="library-progress"><div class="library-progress-row"><span>Reading progress</span><span>${percent}%</span></div><div class="library-progress-track"><div class="library-progress-fill" style="width:${percent}%"></div></div></div><div class="library-card-actions"><button class="btn btn-primary lib-read-btn" data-id="${safeId}">${percent>0?'Resume Reading':'Read eBook'}</button><button class="btn btn-secondary lib-download-btn" data-id="${safeId}" title="Download licensed PDF">PDF</button></div></article>`;}).join('')}</div>`;
}
function rerenderLibrary(){
  if((window.location.hash||'').split('?')[0]!=='#/library') return; const content=document.querySelector('.library-content'); if(content) content.innerHTML=renderBody(); const stats=document.querySelector('.library-stats-wrap'); if(stats) stats.innerHTML=libraryLoadState==='loaded'?renderStats(getLibraryBooks()):''; const description=document.querySelector('.library-license-count'); if(description&&libraryLoadState==='loaded'){const count=getLibraryBooks().length;description.textContent=`Your purchased eBooks, ready to read anytime. ${count} active license${count===1?'':'s'}.`;} bindLibraryButtons();
}
function getFirebaseUser(){ return window.firebase?.auth?.()?.currentUser || null; }
function addCandidate(candidates,value,source){const id=String(value??'').trim();if(id&&!candidates.some(item=>item.id===id))candidates.push({id,source});}
async function queryUserDocs(db,firebaseUser){
  const docs=[]; const push=(doc,source)=>{if(!doc||!doc.exists)return;docs.push({data:doc.data()||{},docId:doc.id,source});};
  try{push(await db.collection('users').doc(firebaseUser.uid).get(),'users/firebase-uid');}catch(error){console.warn('[Library] UID user lookup skipped:',error?.message||error);}
  for(const field of ['firebaseUid','firebase_uid','uid','auth_uid','authUid']){try{const snapshot=await db.collection('users').where(field,'==',firebaseUser.uid).limit(3).get();snapshot.forEach(doc=>push(doc,`users/${field}`));}catch(error){console.warn(`[Library] ${field} lookup skipped:`,error?.message||error);}}
  if(firebaseUser.email){try{const snapshot=await db.collection('users').where('email','==',firebaseUser.email).limit(5).get();snapshot.forEach(doc=>push(doc,'users/email'));}catch(error){console.warn('[Library] Email lookup skipped:',error?.message||error);}}
  return docs;
}
async function verifyCandidateLibrary(db,candidate){
  for(const field of ['userId','bookoraUserId','bookora_user_id','user_id']){try{const snapshot=await db.collection('library').where(field,'==',candidate.id).get();const active=snapshot.docs.map(doc=>({id:doc.id,...doc.data()})).filter(record=>normalizeAccessStatus(record.accessStatus||record.access_status)==='active');if(active.length)return{field,records:active};}catch(error){console.warn(`[Library] Entitlement lookup ${field}=${candidate.id} skipped:`,error?.message||error);}}
  return null;
}
async function resolveLibraryIdentity(firebaseUser,db){
  const candidates=[]; const cached=state.currentUser||(()=>{try{return JSON.parse(localStorage.getItem('bookora_user_profile')||'{}');}catch(_){return {};}})();
  addCandidate(candidates,cached?.bookoraUserId,'cached-bookoraUserId'); addCandidate(candidates,cached?.userId,'cached-userId'); addCandidate(candidates,cached?.user_id,'cached-user_id');
  const userDocs=await queryUserDocs(db,firebaseUser);
  for(const {data,docId,source} of userDocs){addCandidate(candidates,data.bookoraUserId,`${source}:bookoraUserId`);addCandidate(candidates,data.bookora_user_id,`${source}:bookora_user_id`);addCandidate(candidates,data.userId,`${source}:userId`);addCandidate(candidates,data.user_id,`${source}:user_id`);addCandidate(candidates,data.id,`${source}:id`);if(/^usr-[A-Za-z0-9_-]+$/.test(String(docId||'')))addCandidate(candidates,docId,`${source}:docId`);}
  console.info('[Library] Firebase UID:',firebaseUser.uid); console.info('[Library] Firebase email:',firebaseUser.email||''); console.info('[Library] Candidate Bookora IDs:',candidates);
  for(const candidate of candidates){const match=await verifyCandidateLibrary(db,candidate);if(match){console.info('[Library] Verified library identity:',candidate.id,'source:',candidate.source);console.info('[Library] Firestore query field:',match.field);return{bookoraUserId:candidate.id,queryField:match.field,records:match.records};}}
  throw new Error('No active purchased eBooks were found for this signed-in Bookora account.');
}
async function getAuthenticatedBookoraUser(){
  let firebaseUser=getFirebaseUser(); if(!firebaseUser&&window.BookoraAuthReady){firebaseUser=await Promise.race([window.BookoraAuthReady,new Promise(resolve=>setTimeout(()=>resolve(null),10000))]);}
  if(!firebaseUser){const auth=window.firebase?.auth?.();if(auth)firebaseUser=await new Promise(resolve=>{let done=false;let unsubscribe=null;const finish=user=>{if(done)return;done=true;try{unsubscribe?.();}catch(_){}resolve(user||null);};unsubscribe=auth.onAuthStateChanged(finish);setTimeout(()=>finish(auth.currentUser||null),10000);});}
  if(!firebaseUser)throw new Error('Authentication required. Please sign in again.'); const {db}=await state.getFirebase();
  if(state.isAdmin)return{firebaseUser,db,bookoraUserId:'',queryField:'admin-catalog',records:null};
  const resolved=await resolveLibraryIdentity(firebaseUser,db); state.currentUser={...(state.currentUser||{}),uid:firebaseUser.uid,firebaseUid:firebaseUser.uid,email:firebaseUser.email||state.currentUser?.email||'',bookoraUserId:resolved.bookoraUserId};state.isAuthenticated=true;try{localStorage.setItem('bookora_user_profile',JSON.stringify(state.currentUser));}catch(_){} return{firebaseUser,db,...resolved};
}
async function loadLibraryDirectFromFirebase(){
  libraryLoadState='loading';libraryLoadError='';libraryRecords=[];rerenderLibrary();
  try{const{db,records,queryField,bookoraUserId}=await getAuthenticatedBookoraUser();if(state.isAdmin){const snapshot=await db.collection('books').where('status','==','approved').get();libraryRecords=snapshot.docs.map(doc=>({id:doc.id,...doc.data(),bookId:doc.id,accessStatus:'active'}));state.library=new Set(libraryRecords.map(record=>String(record.bookId)).filter(Boolean));console.info('[Library] Admin catalog records:',libraryRecords.length);}else{libraryRecords=Array.isArray(records)?records:[];state.library=new Set(libraryRecords.map(record=>String(record.bookId||record.book_id||'')).filter(Boolean));console.info('[Library] Firestore collection: library');console.info('[Library] Firestore query field:',queryField);console.info('[Library] Firestore userId:',bookoraUserId);console.info('[Library] Active library records:',libraryRecords.length);console.info('[Library] Library items:',libraryRecords.map(item=>({libraryId:item.bookoraLibraryId||item.id,bookId:item.bookId||item.book_id,title:item.title,orderId:item.orderId||item.order_id,accessStatus:item.accessStatus||item.access_status})));}libraryLoadState='loaded';rerenderLibrary();}catch(error){libraryRecords=[];libraryLoadState='error';libraryLoadError=error?.message||'Unable to load your library. Please try again.';console.error('[Library] Firestore load failed:',error);rerenderLibrary();}}
function bindLibraryButtons(){
  document.querySelectorAll('.lib-read-btn').forEach(btn=>{if(btn.dataset.libraryBound==='1')return;btn.dataset.libraryBound='1';btn.addEventListener('click',async()=>{const book=getLibraryBooks().find(item=>String(item.id)===String(btn.dataset.id));if(!book)return;btn.disabled=true;try{await(window.BookoraPurchaseAccess?.openPurchasedPdf?window.BookoraPurchaseAccess.openPurchasedPdf(book):ReaderModal.open(book,false));}catch(error){Toast.show(error?.message||'Unable to open this eBook.','error');}finally{btn.disabled=false;}});});
  document.querySelectorAll('.lib-download-btn').forEach(btn=>{if(btn.dataset.libraryBound==='1')return;btn.dataset.libraryBound='1';btn.addEventListener('click',async()=>{const book=getLibraryBooks().find(item=>String(item.id)===String(btn.dataset.id));if(!book)return;btn.disabled=true;try{if(window.BookoraPurchaseAccess?.downloadPurchasedPdf)await window.BookoraPurchaseAccess.downloadPurchasedPdf(book);else await downloadEBook(book,state.currentUser);Toast.show(`Downloaded "${book.title}" as a licensed PDF.`,'success');}catch(error){Toast.show(error?.message||'Unable to download this eBook.','error');}finally{btn.disabled=false;}});});
}
export function renderLibraryPage(){updateSEO({title:state.isAdmin?'Bookora Admin Library':'My eBook Library',description:'Access and read your purchased eBooks on Bookora.'});const heading=state.isAdmin?'All eBook Library':'My eBook Library';const eyebrow=state.isAdmin?'ADMIN LIBRARY':'PERSONAL LIBRARY';const subtitle=state.isAdmin?'Approved Bookora eBooks available to administrators.':'Your purchased eBooks, ready to read anytime.';return `<div class="library-page animate-fade-in"><div class="container"><div class="library-hero"><div><div class="library-eyebrow">${eyebrow}</div><h1 class="library-title">${heading}</h1><p class="library-subtitle library-license-count">${subtitle}</p></div><div class="library-actions"><button type="button" class="btn btn-secondary library-refresh-btn">${icon('refresh')} Refresh</button><a href="#/explore" class="btn btn-primary">Discover eBooks</a></div></div><div class="library-stats-wrap"></div><div class="library-content">${renderBody()}</div></div></div>`;}
export function initLibraryEvents(){librarySyncStarted=false;const start=async()=>{if(librarySyncStarted)return;librarySyncStarted=true;try{await loadLibraryDirectFromFirebase();}finally{librarySyncStarted=false;}bindLibraryButtons();};const auth=window.firebase?.auth?.();if(window.BookoraAuthReady){void window.BookoraAuthReady.then(user=>{if(user||auth?.currentUser)void start();else{libraryLoadState='error';libraryLoadError='Authentication required. Please sign in again.';rerenderLibrary();}});}else if(auth?.currentUser||state.isAuthenticated){void start();}else{libraryLoadState='error';libraryLoadError='Authentication required. Please sign in again.';rerenderLibrary();}document.querySelector('.library-refresh-btn')?.addEventListener('click',()=>{librarySyncStarted=false;void start();});document.querySelector('.library-retry-btn')?.addEventListener('click',()=>{librarySyncStarted=false;void start();});bindLibraryButtons();}
