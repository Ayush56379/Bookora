import { state } from '../state.js';
import { apiUrl } from '../config.js';

const flows = new Map();
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function params() { return new URLSearchParams((window.location.hash || '').split('?')[1] || ''); }
function getOrderId() { return String(params().get('order_id') || '').trim(); }
function render(markup) { const el = document.getElementById('main-content'); if (el) el.innerHTML = markup; }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>\'\"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;' }[c])); }
function money(value, currency='INR') { const n = Number(value); if (!Number.isFinite(n)) return '—'; try { return new Intl.NumberFormat('en-IN', { style:'currency', currency: currency || 'INR', maximumFractionDigits:2 }).format(n); } catch (_) { return `₹${n.toFixed(2)}`; } }
function normalizeStatus(value) {
  const s = String(value ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (['PAID','SUCCESS','SUCCESSFUL','COMPLETED','PAYMENT_SUCCESS','FULFILLED'].includes(s)) return 'PAID';
  if (['FAILED','FAILURE','PAYMENT_FAILED','TERMINATED'].includes(s)) return 'FAILED';
  if (['CANCELLED','CANCELED','USER_DROPPED','USER_CANCELLED'].includes(s)) return 'CANCELLED';
  if (['EXPIRED','PAYMENT_EXPIRED'].includes(s)) return 'EXPIRED';
  if (['PENDING','ACTIVE','NOT_ATTEMPTED','INCOMPLETE','PROCESSING','CREATED','PAYMENT_PENDING'].includes(s)) return 'PENDING';
  return '';
}
function isFulfilled(data) {
  const f = String(data?.fulfillmentStatus || data?.fulfillment_status || data?.fulfillment?.status || '').trim().toUpperCase();
  const o = String(data?.orderStatus || data?.order_status || data?.order?.order_status || '').trim().toUpperCase();
  return ['FULFILLED','COMPLETED'].includes(f) || ['FULFILLED','COMPLETED'].includes(o);
}
function extractStatus(data) {
  const values = [
    data?.paymentStatus, data?.payment_state, data?.payment_status, data?.orderStatus, data?.order_status, data?.status,
    data?.cashfree?.payment_state, data?.cashfree?.payment_status, data?.cashfree?.order_status,
    data?.cashfree?.payment?.payment_status, data?.payment?.payment_status,
    data?.order?.payment_state, data?.order?.payment_status, data?.order?.order_status, data?.order?.status
  ];
  for (const value of values) { const s = normalizeStatus(value); if (s) return s; }
  if (data?.paid === true || data?.is_paid === true) return 'PAID';
  return 'PENDING';
}
function finalState(data) {
  const payment = extractStatus(data);
  if (['FAILED','CANCELLED','EXPIRED'].includes(payment)) return payment;
  if (payment === 'PAID' && isFulfilled(data)) return 'PAID';
  return payment === 'PAID' ? 'PROCESSING' : 'PENDING';
}
function details(orderId, data) {
  const order = data?.order || {};
  const cf = data?.cashfree || {};
  const payment = cf?.payment || data?.payment || {};
  const amount = cf?.order_amount ?? payment?.payment_amount ?? order?.order_amount ?? order?.amount ?? data?.finalAmount;
  const currency = cf?.order_currency || payment?.payment_currency || data?.currency || 'INR';
  const gatewayOrder = cf?.cf_order_id || cf?.order_id || order?.cf_order_id || order?.cashfree_order_id || data?.cashfreeOrderId || '—';
  const paymentId = payment?.cf_payment_id || order?.payment_id || data?.cashfreePaymentId || '—';
  const method = payment?.payment_group || payment?.payment_method || data?.paymentMethod || '—';
  const paymentStatus = payment?.payment_status || cf?.payment_status || data?.paymentStatus || data?.payment_status || '—';
  const orderStatus = cf?.order_status || order?.order_status || data?.orderStatus || data?.order_status || '—';
  const fulfillmentStatus = data?.fulfillmentStatus || data?.fulfillment_status || data?.fulfillment?.status || '—';
  const paidAt = payment?.payment_completion_time || payment?.payment_time || order?.paid_at || data?.paidAt || '—';
  const bankRef = payment?.bank_reference || data?.bankReference || data?.cashfree_transaction_reference || '—';
  const row = (label, value, mono=false) => `<div style="display:flex;justify-content:space-between;gap:1rem;padding:.5rem 0;border-bottom:1px solid var(--border-subtle)"><span style="color:var(--text-secondary)">${escapeHtml(label)}</span><strong style="${mono?'font-family:monospace;word-break:break-all;':''}text-align:right">${escapeHtml(value)}</strong></div>`;
  return `<div style="margin-top:1.6rem;background:var(--bg-secondary);border:1px solid var(--border-subtle);border-radius:14px;padding:1rem;text-align:left;font-size:.9rem">
    ${row('Bookora Order ID', orderId, true)}
    ${row('Amount', money(amount, currency))}
    ${row('Cashfree Order ID', gatewayOrder, true)}
    ${row('Payment ID', paymentId, true)}
    ${row('Payment Status', paymentStatus)}
    ${row('Order Status', orderStatus)}
    ${row('Fulfillment Status', fulfillmentStatus)}
    ${row('Payment Method', method)}
    ${row('Payment Time', paidAt)}
    ${bankRef !== '—' ? row('Bank Reference', bankRef, true) : ''}
  </div>`;
}
function shell(icon,title,text,actions='',extra='') {
  return `<div class="payment-result-page" style="background:var(--bg-secondary);min-height:85vh;padding:4rem 1rem;display:flex;align-items:center;justify-content:center"><div class="container" style="max-width:700px;width:100%"><div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:3rem 2.5rem;text-align:center;box-shadow:var(--shadow-lg)"><div style="width:72px;height:72px;border-radius:999px;background:#F8FAFC;border:2px solid #E2E8F0;color:#0F172A;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;font-size:32px">${icon}</div><h1 style="font-family:var(--font-display);font-size:2rem;font-weight:800;margin:0 0 .75rem">${title}</h1><p style="color:var(--text-secondary);line-height:1.6;margin:0">${text}</p>${extra}${actions?`<div style="display:flex;justify-content:center;gap:1rem;flex-wrap:wrap;margin-top:1.8rem">${actions}</div>`:''}</div></div></div>`;
}
function loadingMarkup(){return shell('◷','Checking Payment','Please wait while Bookora securely restores the verified payment result.');}
function pendingMarkup(id,data){return shell('◷','Payment Pending','Cashfree has not confirmed a completed payment yet. Your eBook remains locked until Bookora receives a verified successful payment.','',details(id,data)+'<div style="margin-top:1rem;color:var(--text-muted);font-size:.85rem">Waiting for the latest verified payment status.</div>');}
function processingMarkup(id,data){return shell('◷','Payment Received','Your payment has been received. Bookora is finishing your eBook access and seller settlement.','',details(id,data)+'<div style="margin-top:1rem;color:var(--text-muted);font-size:.85rem">This page will update automatically when fulfillment is complete.</div>');}
function pendingFinalMarkup(id,data){return shell('◷','Payment Verification Delayed','The payment is still pending. Please check again before starting another payment.','<button id="payment-refresh-status" class="btn btn-primary btn-lg">Check Again</button><a href="#/orders" class="btn btn-secondary btn-lg">My Orders</a><a href="#/explore" class="btn btn-secondary btn-lg">Continue Shopping</a>',details(id,data));}
function successMarkup(id,data){return shell('✓','Payment Successful','Your payment has been verified, your eBook is in your Library, and the seller/admin settlement has been recorded.','<a href="#/library" class="btn btn-primary btn-lg">Open My Library</a><a href="#/orders" class="btn btn-secondary btn-lg">View Order</a><a href="#/explore" class="btn btn-secondary btn-lg">Continue Shopping</a>',details(id,data));}
function cancelledMarkup(id,data){return shell('×','Payment Cancelled','The payment was cancelled or dropped. No eBook was unlocked.','<a href="#/orders" class="btn btn-secondary btn-lg">My Orders</a><a href="#/explore" class="btn btn-primary btn-lg">Try Again</a>',details(id,data));}
function failedMarkup(id,data){return shell('!','Payment Failed','The payment was not completed. Your eBook remains locked.','<a href="#/orders" class="btn btn-secondary btn-lg">My Orders</a><a href="#/explore" class="btn btn-primary btn-lg">Try Again</a>',details(id,data));}
function expiredMarkup(id,data){return shell('⌛','Payment Expired','This payment session expired before a successful payment was confirmed. Your eBook remains locked.','<a href="#/orders" class="btn btn-secondary btn-lg">My Orders</a><a href="#/explore" class="btn btn-primary btn-lg">Try Again</a>',details(id,data));}
function errorMarkup(message,id='',data={}){return shell('!','Payment Verification Delayed',escapeHtml(message||'Bookora could not verify the payment right now. Your eBook remains locked until a successful payment is confirmed.'),'<button id="payment-refresh-status" class="btn btn-primary btn-lg">Check Again</button><a href="#/orders" class="btn btn-secondary btn-lg">My Orders</a>',id?details(id,data):'');}

async function fetchJsonWithTimeout(url, options={}, timeoutMs=10000){
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, {...options, signal: controller.signal, cache:'no-store'}); }
  catch (error) { if (error?.name === 'AbortError') throw new Error('Payment verification timed out. Please check again.'); throw error; }
  finally { window.clearTimeout(timer); }
}

async function waitForFirebaseUser(timeoutMs=8000){
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { const auth = window.firebase?.auth?.(); if (auth?.currentUser) return auth.currentUser; } catch (_) {}
    await sleep(250);
  }
  return null;
}

async function readFirebaseOrder(orderId){
  try {
    const user = await waitForFirebaseUser(8000);
    const firebase = window.firebase;
    if (!firebase || !user || typeof firebase.firestore !== 'function') return null;
    const db = firebase.firestore();
    const readPromise = db.collection('orders').doc(orderId).get({source:'server'});
    const snapshot = await Promise.race([readPromise, new Promise((_, reject) => window.setTimeout(() => reject(new Error('Firebase order read timed out')), 6000))]);
    if (!snapshot?.exists) return null;
    const raw = snapshot.data() || {};
    const sameUser = !raw.userId || String(raw.userId) === String(user.uid) || (raw.userEmail && String(raw.userEmail).toLowerCase() === String(user.email || '').toLowerCase());
    if (!sameUser) return null;
    const paymentStatus = String(raw.paymentStatus || raw.payment_status || '').toUpperCase();
    const orderStatus = String(raw.orderStatus || raw.order_status || '').toUpperCase();
    const fulfillmentStatus = String(raw.fulfillmentStatus || raw.fulfillment_status || '').toUpperCase();
    const normalized = normalizeStatus(paymentStatus) || normalizeStatus(orderStatus) || (fulfillmentStatus === 'FULFILLED' ? 'PAID' : 'PENDING');
    return {
      success: true,
      payment_state: normalized,
      paymentStatus: paymentStatus || 'PENDING',
      payment_status: paymentStatus || 'PENDING',
      orderStatus: orderStatus || 'PAYMENT_PENDING',
      order_status: orderStatus || 'PAYMENT_PENDING',
      fulfillmentStatus: fulfillmentStatus || 'PENDING',
      cashfreeOrderId: raw.cashfreeOrderId || raw.cashfree_order_id || '',
      cashfreePaymentId: raw.cashfreePaymentId || raw.cashfree_payment_id || '',
      finalAmount: raw.finalAmount ?? raw.amount,
      originalAmount: raw.originalAmount,
      discountAmount: raw.discountAmount,
      currency: raw.currency || 'INR',
      paymentMethod: raw.paymentMethod || '',
      paidAt: raw.paidAt || '',
      bankReference: raw.bankReference || raw.cashfree_transaction_reference || '',
      commission: raw.commission ?? raw.platform_commission_amount,
      sellerAmount: raw.sellerAmount ?? raw.seller_earning_amount ?? raw.seller_amount,
      order: { order_id: raw.cashfreeOrderId || '', cf_order_id: raw.cashfreeOrderId || '', order_amount: raw.finalAmount ?? raw.amount, order_currency: raw.currency || 'INR', order_status: raw.orderStatus || '' },
      payment: { cf_payment_id: raw.cashfreePaymentId || '', payment_status: raw.paymentStatus || '', payment_amount: raw.finalAmount ?? raw.amount, payment_currency: raw.currency || 'INR', payment_group: raw.paymentMethod || '', payment_completion_time: raw.paidAt || '' },
      firebase_mirror: true
    };
  } catch (error) { console.warn('Bookora Firebase payment mirror read unavailable:', error); return null; }
}

async function ensureSession(force=false){
  if (window.BookoraPurchaseAccess?.ensureBackendSession) {
    return !!(await Promise.race([window.BookoraPurchaseAccess.ensureBackendSession(force), new Promise(resolve => window.setTimeout(() => resolve(false), 9000))]));
  }
  if(!force&&state.token)return true;
  const user=await waitForFirebaseUser(4000); if(!user)return false;
  const idToken=await user.getIdToken(force);
  const api=String(window.BOOKORA_API_URL||apiUrl('')).replace(/\/$/,'');
  const response=await fetchJsonWithTimeout(`${api}/api/auth/firebase`,{method:'POST',headers:{Authorization:`Bearer ${idToken}`,Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({role:state.currentUser?.role||'buyer'})},9000);
  const data=await response.json().catch(()=>({}));
  if(!response.ok||!data.token)return false;
  state.token=data.token;state.isAuthenticated=true;if(data.user)state.currentUser={...(state.currentUser||{}),...data.user};
  try{localStorage.setItem('bookora_auth_token',data.token);}catch(_){ }
  return true;
}

async function verifyOrder(orderId){
  const firebaseData = await readFirebaseOrder(orderId);
  const firebaseState = firebaseData ? finalState(firebaseData) : '';
  if (firebaseData && ['PAID','FAILED','CANCELLED','EXPIRED'].includes(firebaseState)) return firebaseData;

  const api=String(window.BOOKORA_API_URL||apiUrl('')).replace(/\/$/,'');
  for(let attempt=0;attempt<2;attempt++){
    if(!(await ensureSession(attempt>0))){await sleep(300);continue;}
    const response=await fetchJsonWithTimeout(`${api}/api/orders/${encodeURIComponent(orderId)}/status`,{headers:{Accept:'application/json',Authorization:`Bearer ${state.token}`}},10000);
    const data=await response.json().catch(()=>({}));
    if(response.status===401){state.token='';try{localStorage.removeItem('bookora_auth_token');}catch(_){}continue;}
    if(response.status===404)return firebaseData || {success:true,payment_state:'PENDING',order_not_found:true};
    if(response.status===409 && data?.payment_state)return data;
    if(!response.ok)throw new Error(data.error||`Payment verification failed (${response.status}).`);
    const backendState=finalState(data);
    if(firebaseData && ['PAID','FAILED','CANCELLED','EXPIRED'].includes(firebaseState) && backendState==='PENDING') return firebaseData;
    return data;
  }
  if(firebaseData) return firebaseData;
  throw new Error('Unable to restore the secure payment session.');
}
function attachRefresh(flow){
  document.getElementById('payment-refresh-status')?.addEventListener('click',()=>{
    if(flow.timer)window.clearTimeout(flow.timer); flow.polls=0;flow.running=false;flow.done=false;runFlow(flow.orderId);
  },{once:true});
}
async function runFlow(orderId){
  const flow=flows.get(orderId);if(!flow||flow.running||flow.done)return;flow.running=true;
  try{
    const data=await verifyOrder(orderId);const status=finalState(data);flow.status=status;flow.data=data;
    if(status==='PAID'){flow.done=true;flow.running=false;render(successMarkup(orderId,data));return;}
    if(status==='CANCELLED'){flow.done=true;flow.running=false;render(cancelledMarkup(orderId,data));return;}
    if(status==='FAILED'){flow.done=true;flow.running=false;render(failedMarkup(orderId,data));return;}
    if(status==='EXPIRED'){flow.done=true;flow.running=false;render(expiredMarkup(orderId,data));return;}
    flow.running=false;
    if(status==='PROCESSING'){
      if(flow.polls>=9){flow.done=true;render(processingMarkup(orderId,data));attachRefresh(flow);return;}
      render(processingMarkup(orderId,data));
    } else {
      if(flow.polls>=9){flow.done=true;render(pendingFinalMarkup(orderId,data));attachRefresh(flow);return;}
      render(pendingMarkup(orderId,data));
    }
    flow.polls++; flow.timer=window.setTimeout(()=>runFlow(orderId),2500);
  }catch(error){
    console.error('Bookora payment verification:',error); flow.running=false;flow.done=true;
    render(errorMarkup(error?.message,orderId,flow.data||{}));attachRefresh(flow);
  }
}

export function renderPaymentSuccessPage(){window.setTimeout(()=>initPaymentSuccessEvents(),0);return loadingMarkup();}
export function initPaymentSuccessEvents(){
  const orderId=getOrderId();if(!orderId){render(errorMarkup('No payment order was supplied. Please return to My Orders and try again.'));return;}
  const existing=flows.get(orderId);if(existing?.done||existing?.running)return;
  const flow=existing||{orderId,status:'PENDING',polls:0,running:false,done:false,timer:null,data:null};flows.set(orderId,flow);runFlow(orderId);
}
