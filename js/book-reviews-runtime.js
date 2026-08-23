// Bookora Reviews Runtime
// Firebase reviews are the source of truth for Book Detail reviews/rating.
// This runtime is route-gated: it does no review work outside #/book/* and
// uses a single realtime listener (onSnapshot already performs the initial read).
import { state } from './state.js';
import { Toast } from './components/Toast.js';
import { apiFetch } from './config.js';

const watched = new Map();
let booted = false;
const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
const stars = rating => { const r=Math.max(0,Math.min(5,Number(rating)||0)); return Array.from({length:5},(_,i)=>`<span aria-hidden="true" style="font-size:16px;line-height:1;color:${i+1<=Math.round(r)?'#f59e0b':'#cbd5e1'}">★</span>`).join(''); };
const getBook = () => { const hash=window.location.hash||''; const match=hash.match(/^#\/book\/([^?]+)/); return match?state.getBookBySlug(decodeURIComponent(match[1])):null; };
const getDb = () => window.firebase?.apps?.length ? window.firebase.firestore() : null;

async function ensureFirebaseReader(){
  let firebaseUser = window.firebase?.auth?.()?.currentUser || null;
  if(!firebaseUser && window.BookoraAuthReady){ try { firebaseUser = await Promise.race([window.BookoraAuthReady,new Promise(resolve=>setTimeout(()=>resolve(window.firebase?.auth?.()?.currentUser||null),2500))]); } catch (_) {} }
  if(!firebaseUser) firebaseUser=window.firebase?.auth?.()?.currentUser||null;
  if(firebaseUser){
    try {
      if(typeof state.loadAuthenticatedUser==='function' && (!state.isAuthenticated || String(state.currentUser?.uid||'')!==String(firebaseUser.uid))) await state.loadAuthenticatedUser(firebaseUser);
      else { state.isAuthenticated=true; state.currentUser={...(state.currentUser||{}),uid:firebaseUser.uid,firebaseUid:firebaseUser.uid,email:firebaseUser.email||state.currentUser?.email||'',name:state.currentUser?.name||firebaseUser.displayName||'Bookora User',photoURL:state.currentUser?.photoURL||firebaseUser.photoURL||''}; }
    } catch(error){ console.warn('[Reviews] auth hydration skipped:',error?.message||error); }
  }
  return firebaseUser||(state.isAuthenticated&&state.currentUser?.uid?{uid:state.currentUser.uid}:null);
}

function updateHeaderRating(book,reviews){
  const ratingEl=document.querySelector('.bd-author-line .bd-rating'); if(!ratingEl)return;
  const total=reviews.length,average=total?reviews.reduce((sum,r)=>sum+Number(r.rating||0),0)/total:0,display=total?average.toFixed(1):'—';
  ratingEl.innerHTML=`<span class="bd-rating-stars" aria-label="${esc(display)} out of 5 stars">${stars(average)}</span><span class="bd-rating-number">${display}</span><span class="bd-rating-count">(${total} ${total===1?'review':'reviews'})</span>`;
}

function renderReviews(bookId,reviews){
  if(!String(window.location.hash||'').startsWith('#/book/'))return;
  const list=document.getElementById('review-list'),summary=document.querySelector('[data-panel="reviews"] .bd-review-summary'),tab=document.querySelector('.bd-tab[data-tab="reviews"]');
  const book=state.getBookBySlug(bookId)||[...(state.books||[])].find(b=>String(b.id)===String(bookId));
  const unique=new Map();
  for(const review of Array.isArray(reviews)?reviews:[]){const id=String(review.id||review.review_id||`${review.book_id||review.bookId}|${review.user_id||review.userId||review.uid}|${review.created_at||review.createdAt||review.date||''}`);if(!unique.has(id))unique.set(id,review);}
  const sorted=[...unique.values()].sort((a,b)=>{const ta=a.created_at?.toDate?a.created_at.toDate().getTime():new Date(a.created_at||a.date||0).getTime(),tb=b.created_at?.toDate?b.created_at.toDate().getTime():new Date(b.created_at||b.date||0).getTime();return tb-ta;});
  updateHeaderRating(book,sorted); if(!list||!summary)return;
  const total=sorted.length,average=total?sorted.reduce((sum,r)=>sum+Number(r.rating||0),0)/total:0,score=summary.querySelector('.bd-score');
  if(score)score.innerHTML=`<div class="bd-score-number">${total?average.toFixed(1):'—'}</div><div class="bd-rating-stars">${stars(average)}</div><small>${total} reader ${total===1?'review':'reviews'}</small>`;
  if(tab)tab.textContent=`Reviews (${total})`;
  list.innerHTML=total?sorted.map(review=>{const date=review.created_at?.toDate?review.created_at.toDate():(review.date||review.createdAt||''),dateText=date?new Date(date).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'}):'',name=review.user_name||review.userName||'Bookora Reader';return `<article class="bd-review" data-review-id="${esc(review.id||'')}"><div class="bd-review-top"><div><div class="bd-rating-stars">${stars(review.rating)}</div><div class="bd-review-title">${esc(review.title||'Reader review')}</div></div><span class="bd-review-meta">${esc(dateText)}</span></div><p class="bd-review-comment">${esc(review.comment||'')}</p><div class="bd-review-meta">${esc(name)} ${review.verified_purchase?'<span class="bd-verified">• ✓ Verified Purchase</span>':'<span class="bd-verified">• Reader Review</span>'}</div></article>`;}).join(''):'<div class="bd-empty">No customer reviews yet. Be the first reader to share your feedback.</div>';
}

async function watchBook(book){
  const db=getDb(); if(!db||!book?.id)return;
  const key=String(book.id),existing=watched.get(key);
  if(existing){renderReviews(key,existing.reviews||[]);return;}
  try{
    const record={unsubscribe:null,reviews:[]};
    record.unsubscribe=db.collection('reviews').where('book_id','==',key).onSnapshot(snapshot=>{
      record.reviews=snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
      state.reviews=[...(Array.isArray(state.reviews)?state.reviews.filter(r=>String(r.book_id||r.bookId)!==key):[]),...record.reviews];
      renderReviews(key,record.reviews);
    },error=>console.warn('[Reviews] realtime listener unavailable:',error.message));
    watched.set(key,record);
  }catch(error){console.warn('[Reviews] listener setup failed:',error.message);}
}

function prepareWriteButton(book){const button=document.querySelector('[data-panel="reviews"] .bd-btn[data-review-write]')||[...document.querySelectorAll('[data-panel="reviews"] .bd-btn')].find(node=>/review/i.test(node.textContent||''));const formBox=document.getElementById('review-form-container');if(!button||button.dataset.buyerReviewBound==='1')return;button.dataset.buyerReviewBound='1';button.textContent='Write a Review';button.title='Share your rating and review for this eBook';button.addEventListener('click',async event=>{event.preventDefault();event.stopImmediatePropagation();const firebaseUser=await ensureFirebaseReader();if(!firebaseUser){Toast.show('Please sign in to write a review.','info');const returnTo=window.location.hash||`#/book/${book.slug||book.id}`;window.location.hash=`#/login?returnTo=${encodeURIComponent(returnTo)}`;return;}formBox?.classList.add('open');formBox?.scrollIntoView({behavior:'smooth',block:'center'});},true);}

async function submitVerifiedReview(book,form){const firebaseUser=await ensureFirebaseReader();if(!firebaseUser){Toast.show('Please sign in before submitting a review.','info');const returnTo=window.location.hash||`#/book/${book.slug||book.id}`;window.location.hash=`#/login?returnTo=${encodeURIComponent(returnTo)}`;return;}
  const rating=Math.max(1,Math.min(5,Number(form.querySelector('#review-rating-input')?.value||5))),title=String(form.querySelector('#review-title-input')?.value||'').trim(),comment=String(form.querySelector('#review-comment-input')?.value||'').trim();
  if(!title||!comment){Toast.show('Please complete the review before submitting.','warning');return;}
  const submit=form.querySelector('button[type="submit"]');if(submit){submit.disabled=true;submit.textContent='Publishing…';}
  try{const response=await apiFetch('/api/reviews',{method:'POST',body:JSON.stringify({book_id:String(book.id),rating,title,comment})});let payload={};try{payload=await response.json();}catch(_){}
    if(!response.ok||!payload.success){if(response.status===409)throw new Error(payload.error||'You have already reviewed this eBook.');throw new Error(payload.error||`Review service returned HTTP ${response.status}.`);}
    form.reset();document.getElementById('review-form-container')?.classList.remove('open');Toast.show(payload.review?.verified_purchase?'Your verified review has been published.':'Your review and rating have been published.','success');
  }catch(error){console.error('[Reviews] submit failed:',error);Toast.show(error?.message||'Could not publish your review.','error');}finally{if(submit){submit.disabled=false;submit.textContent='Submit Review';}}
}

function enhanceReviewForm(book){const form=document.getElementById('submit-review-form');if(!form||form.dataset.firebaseReviewsBound==='1')return;form.dataset.firebaseReviewsBound='1';form.addEventListener('submit',event=>{event.preventDefault();event.stopImmediatePropagation();submitVerifiedReview(book,form);},true);}
function refresh(){const book=getBook();if(!book)return;prepareWriteButton(book);enhanceReviewForm(book);watchBook(book);}
function boot(){if(booted)return;booted=true;const run=()=>{if(getBook())setTimeout(refresh,80);};window.addEventListener('hashchange',run);state.subscribe(event=>{if((event==='USER_LOGGED_IN'||event==='DATA_SYNCED')&&getBook())run();});run();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
