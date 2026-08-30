import { state } from '../state.js';
import { apiFetch } from '../config.js';

const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const api = async (path, options = {}) => {
  const r = await apiFetch(path, options);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`);
  return d;
};

export function renderReviewSupportPage(){return `<section class="rs-page"><div class="rs-hero"><div><span class="rs-kicker">BOOKORA COMMUNITY</span><h1>Review Bookora &amp; Support Us</h1><p>Your feedback helps us improve. If Bookora is useful to you, you can also voluntarily support its continued development.</p></div><div class="rs-hero-icon">♡</div></div><div class="rs-grid"><article class="rs-card"><div class="rs-card-head"><div><span class="rs-mini">YOUR VOICE</span><h2>Share your review</h2></div><span class="rs-star">★</span></div><form id="rs-review-form"><div class="rs-rating">${[1,2,3,4,5].map(n=>`<button type="button" class="rs-star-btn" data-rating="${n}">★</button>`).join('')}</div><input type="hidden" id="rs-rating" value="5"><select id="rs-category"><option value="overall">Overall Experience</option><option value="design">Website Design</option><option value="books">Books</option><option value="buying">Buying Experience</option><option value="performance">Performance</option><option value="suggestion">Suggestion</option><option value="bug">Bug Report</option></select><textarea id="rs-comment" minlength="10" maxlength="1000" required placeholder="Tell us what you liked or what we can improve..."></textarea><label class="rs-check"><input id="rs-public" type="checkbox" checked> Show my name with this review</label><button class="rs-primary" type="submit">Submit Review</button><div id="rs-review-msg" class="rs-msg"></div></form></article><article class="rs-card"><div class="rs-card-head"><div><span class="rs-mini">OPTIONAL SUPPORT</span><h2>Support Bookora</h2></div><span class="rs-heart">♥</span></div><p class="rs-muted">Choose an amount you are comfortable with. This is completely optional and does not affect your account or access.</p><div class="rs-amounts">${[10,25,50,100].map(v=>`<button type="button" data-amount="${v}">₹${v}</button>`).join('')}</div><div class="rs-custom"><span>₹</span><input id="rs-amount" inputmode="decimal" type="number" min="1" max="100000" step="1" placeholder="Custom amount"></div><input id="rs-phone" inputmode="numeric" maxlength="10" autocomplete="tel" placeholder="10-digit phone number for payment"><button class="rs-primary" id="rs-donate-btn" type="button">Continue to Support</button><div id="rs-donate-msg" class="rs-msg"></div><small class="rs-note">Payments are processed securely through Cashfree. Bookora does not collect card or UPI credentials.</small></article></div><section class="rs-reviews-section"><div class="rs-section-title"><div><span class="rs-mini">COMMUNITY FEEDBACK</span><h2>What readers say</h2></div><div id="rs-summary" class="rs-summary">Loading reviews…</div></div><div id="rs-reviews" class="rs-reviews-list"><div class="rs-empty">Loading reviews…</div></div></section></section>`;}

function setRating(v){const n=Math.max(1,Math.min(5,Number(v)||5));const input=document.getElementById('rs-rating');if(input)input.value=n;document.querySelectorAll('.rs-star-btn').forEach(b=>b.classList.toggle('active',Number(b.dataset.rating)<=n));}

async function loadReviews(){const d=await api('/api/reviews');const list=document.getElementById('rs-reviews');const s=document.getElementById('rs-summary');if(!list||!s)return;const a=Array.isArray(d.reviews)?d.reviews:[];s.textContent=a.length?`★ ${Number(d.averageRating||0).toFixed(1)} · ${a.length} review${a.length===1?'':'s'}`:'No reviews yet';list.innerHTML=a.length?a.map(r=>`<article class="rs-review"><div class="rs-review-top"><strong>${esc(r.displayName||'Bookora Reader')}</strong><span>${'★'.repeat(Math.max(0,Math.min(5,Number(r.rating)||0)))}${'☆'.repeat(Math.max(0,5-Math.min(5,Number(r.rating)||0)))}</span></div><p>${esc(r.comment)}</p><small>${esc(r.category||'overall')} · ${esc(new Date(r.createdAt||Date.now()).toLocaleDateString('en-IN'))}</small></article>`).join(''):'<div class="rs-empty">Be the first to share your experience.</div>';}

async function waitForSupportPayment(orderId){let last={paid:false,status:'PENDING',order_id:orderId};for(let i=0;i<5;i++){last=await api(`/api/support/verify?order_id=${encodeURIComponent(orderId)}`);if(last.paid)return last;if(i<4)await new Promise(r=>setTimeout(r,1500));}return last;}

async function donate(){
  const amount=Number(document.getElementById('rs-amount')?.value||0),phone=String(document.getElementById('rs-phone')?.value||'').replace(/\D/g,''),msg=document.getElementById('rs-donate-msg');
  if(!state.isAuthenticated){location.hash='#/login?returnTo=%2Freview-support';return;}
  if(amount<1||amount>100000){msg.textContent='Please enter an amount between ₹1 and ₹1,00,000.';return;}
  if(!/^\d{10}$/.test(phone)){msg.textContent='Please enter a valid 10-digit phone number.';return;}
  const button=document.getElementById('rs-donate-btn');if(button)button.disabled=true;msg.textContent='Creating secure payment…';
  try{
    const d=await api('/api/support/create-order',{method:'POST',body:JSON.stringify({amount,phone})});
    if(!d.payment_session_id)throw new Error('Payment session was not created.');
    if(!window.Cashfree)await new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://sdk.cashfree.com/js/v3/cashfree.js';s.onload=ok;s.onerror=()=>no(new Error('Cashfree payment service could not be loaded.'));document.head.appendChild(s);});
    const cf=window.Cashfree({mode:d.environment==='PRODUCTION'?'production':'sandbox'});
    const checkoutResult=await cf.checkout({paymentSessionId:d.payment_session_id,redirectTarget:'_modal'});
    if(checkoutResult?.error)throw new Error(checkoutResult.error.message||'Payment window could not be opened.');
    msg.textContent='Verifying payment…';
    const v=await waitForSupportPayment(d.order_id);
    if(v.paid){msg.textContent=`Thank you for supporting Bookora ❤️ Transaction: ${d.order_id}`;document.getElementById('rs-amount').value='';document.getElementById('rs-phone').value='';document.querySelectorAll('.rs-amounts button').forEach(x=>x.classList.remove('selected'));}
    else msg.textContent='Payment is not marked paid yet. If you completed the payment, please wait a moment and try again.';
  }catch(e){msg.textContent=e.message||'Unable to start payment.';}
  finally{if(button)button.disabled=false;}
}

export async function initReviewSupportEvents(){
  setRating(5);
  document.querySelectorAll('.rs-star-btn').forEach(b=>b.addEventListener('click',()=>setRating(b.dataset.rating)));
  document.querySelectorAll('.rs-amounts button').forEach(b=>b.addEventListener('click',()=>{document.getElementById('rs-amount').value=b.dataset.amount;document.querySelectorAll('.rs-amounts button').forEach(x=>x.classList.toggle('selected',x===b));}));
  document.getElementById('rs-review-form')?.addEventListener('submit',async e=>{
    e.preventDefault();const m=document.getElementById('rs-review-msg');
    if(!state.isAuthenticated){location.hash='#/login?returnTo=%2Freview-support';return;}
    m.textContent='Saving review to Firebase…';
    try{
      const payload={rating:Number(document.getElementById('rs-rating').value),category:document.getElementById('rs-category').value,comment:document.getElementById('rs-comment').value.trim(),publicName:document.getElementById('rs-public').checked};
      const d=await api('/api/reviews',{method:'POST',body:JSON.stringify(payload)});
      m.textContent=d.status==='approved'?'Review saved to Firebase and published successfully.':'Review submitted successfully.';
      document.getElementById('rs-comment').value='';
      await loadReviews();
    }catch(e){m.textContent=e.message||'Could not submit review.';}
  });
  document.getElementById('rs-donate-btn')?.addEventListener('click',donate);
  try{await loadReviews();}catch(e){const list=document.getElementById('rs-reviews');if(list)list.innerHTML='<div class="rs-empty">Reviews are temporarily unavailable. Please try again shortly.</div>';}
}