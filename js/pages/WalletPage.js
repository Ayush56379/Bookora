import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';
import { apiFetch } from '../config.js';
import { getFreshFirebaseIdToken } from '../firebase-authenticated-fetch.js?v=20260823-3';

const money = n => `₹${Number(n || 0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const date = v => { try { const d = v?.toDate?.() || (v ? new Date(v) : null); return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('en-IN') : '—'; } catch { return '—'; } };

async function authToken(){
  const token = await getFreshFirebaseIdToken(true).catch(()=>null);
  if(token) return token;
  const saved = String(localStorage.getItem('bookora_auth_token') || '').trim();
  if(saved) return saved;
  throw new Error('Please sign in again.');
}

async function savePayoutProfile(payload){
  const token = await authToken();
  const res = await apiFetch('/api/payouts/profile',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const data = await res.json().catch(()=>({}));
  if(!res.ok || !data.success) throw new Error(data.error || 'Unable to save payout details.');
  return data;
}

export async function renderWalletPage(){
  updateSEO({title:'Seller Wallet & Payouts',description:'Manage your Bookora creator earnings, withdrawal requests and Cashfree payouts.'});
  const uid = state.currentUser?.uid || state.currentUser?.id;
  if(!uid) return `<div class="container" style="padding:5rem 1rem;text-align:center"><h1>Sign in required</h1><a class="btn btn-primary" href="#/login">Sign In</a></div>`;

  let wallet = {}, transactions = [], payoutRequests = [], profile = state.currentUser || {};
  try {
    if(window.firebase?.firestore){
      const db=window.firebase.firestore();
      // Load independent Firebase documents/queries in parallel for a faster page.
      const [w,p,tx,pr] = await Promise.all([
        db.collection('wallets').doc(uid).get(),
        db.collection('users').doc(uid).get(),
        db.collection('walletTransactions').where('sellerId','==',uid).limit(30).get().catch(()=>null),
        db.collection('payoutRequests').where('sellerId','==',uid).limit(30).get().catch(()=>null)
      ]);
      if(w?.exists) wallet={id:w.id,...w.data()};
      if(p?.exists) profile={...profile,...p.data()};
      transactions=tx?.docs?.map(d=>({id:d.id,...d.data()})) || [];
      payoutRequests=pr?.docs?.map(d=>({id:d.id,...d.data()})) || [];
    }
  }catch(e){ console.warn('Wallet data load:',e); }

  const available=wallet.availableBalance ?? wallet.available ?? wallet.balance ?? 0;
  const pending=wallet.pendingBalance ?? wallet.pending ?? 0;
  const withdrawn=wallet.withdrawn ?? wallet.totalWithdrawn ?? 0;
  const lifetime=wallet.lifetimeEarnings ?? wallet.lifetime ?? wallet.totalEarned ?? (Number(available)+Number(pending)+Number(withdrawn));

  return `<div class="seller-wallet-page"><div class="container wallet-wrap">
    <div class="wallet-hero"><div><span class="wallet-kicker">CREATOR FINANCE</span><h1>Wallet & Payouts</h1><p>Track verified Bookora marketplace earnings and secure Cashfree withdrawals.</p></div><a class="btn btn-primary" href="#/seller/dashboard">← Seller Studio</a></div>
    <div class="wallet-stats">
      <div class="wallet-stat wallet-stat-main"><span>Available balance</span><strong>${money(available)}</strong><small>Ready for Cashfree withdrawal</small></div>
      <div class="wallet-stat"><span>Pending</span><strong>${money(pending)}</strong><small>Being processed</small></div>
      <div class="wallet-stat"><span>Lifetime earnings</span><strong>${money(lifetime)}</strong><small>Internal marketplace earnings</small></div>
      <div class="wallet-stat"><span>Withdrawn</span><strong>${money(withdrawn)}</strong><small>Paid through Cashfree</small></div>
    </div>
    <div class="wallet-grid">
      <section class="wallet-card"><div class="wallet-card-head"><div><span class="wallet-kicker">CASHFREE PAYOUT</span><h2>Request a withdrawal</h2></div><span class="wallet-safe">Server verified</span></div>
        <p class="wallet-muted">Minimum withdrawal: ₹100. Bookora verifies your Firebase identity and balance before sending the payout to Cashfree.</p>
        <form id="wallet-withdraw-form" class="wallet-form">
          <label>Amount<input id="wallet-amount" type="number" min="100" step="1" max="${Math.max(100,Number(available))}" placeholder="Enter amount" required></label>
          <label>Payout method<select id="wallet-method"><option value="UPI">UPI</option><option value="BANK">Bank transfer</option></select></label>
          <label>UPI ID / payout reference<input id="wallet-destination" value="${esc(profile.upiId || profile.upi_id || '')}" placeholder="example@upi" required></label>
          <button class="btn btn-primary btn-lg" type="submit">Request Cashfree payout →</button>
          <small class="wallet-note">The browser never writes payout requests directly to Firestore. The authenticated backend reserves the balance and talks to Cashfree.</small>
        </form>
      </section>
      <section class="wallet-card"><div class="wallet-card-head"><div><span class="wallet-kicker">PAYOUT PROFILE</span><h2>Your payout details</h2></div></div>
        <div class="profile-mini"><div class="profile-avatar">${esc((profile.name||'A').slice(0,1).toUpperCase())}</div><div><strong>${esc(profile.name||'Creator')}</strong><span>${esc(profile.email||'')}</span></div></div>
        <div class="wallet-detail"><span>Seller status</span><strong class="wallet-approved">${state.isAdmin?'ADMIN':(state.isSeller?'APPROVED':'PENDING')}</strong></div>
        <div class="wallet-detail"><span>UPI ID</span><strong id="wallet-upi-label">${esc(profile.upiId||profile.upi_id||'Not added')}</strong></div>
        <button id="wallet-save-upi" class="btn btn-secondary" type="button">Save UPI details</button>
        <div class="wallet-external-note"><strong>External eBooks</strong><span>External-website payments are not credited to this Bookora wallet. They remain with the seller's external payment gateway.</span></div>
      </section>
    </div>
    <section class="wallet-card wallet-table-card"><div class="wallet-card-head"><div><span class="wallet-kicker">ACTIVITY</span><h2>Recent transactions</h2></div><span class="wallet-count">${transactions.length} records</span></div>
      ${transactions.length?`<div class="wallet-table-scroll"><table><thead><tr><th>Date</th><th>Description</th><th>Status</th><th>Amount</th></tr></thead><tbody>${transactions.map(t=>`<tr><td>${esc(date(t.createdAt||t.created_at))}</td><td>${esc(t.description||t.type||'Wallet transaction')}</td><td><span class="wallet-status ${String(t.status||'').toLowerCase().includes('credit')?'success':''}">${esc(t.status||'completed')}</span></td><td class="wallet-amount ${Number(t.amount ?? t.sellerAmount)<0?'negative':''}">${Number(t.amount ?? t.sellerAmount)<0?'−':'+'}${money(Math.abs(Number(t.amount ?? t.sellerAmount)||0))}</td></tr>`).join('')}</tbody></table></div>`:`<div class="wallet-empty"><div>◎</div><h3>No wallet transactions yet</h3><p>Verified internal marketplace earnings and payout activity will appear here.</p></div>`}
    </section>
    <section class="wallet-card wallet-table-card"><div class="wallet-card-head"><div><span class="wallet-kicker">WITHDRAWALS</span><h2>Withdrawal requests</h2></div><span class="wallet-count">${payoutRequests.length} requests</span></div>
      ${payoutRequests.length?`<div class="wallet-table-scroll"><table><thead><tr><th>Date</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead><tbody>${payoutRequests.map(r=>`<tr><td>${esc(date(r.createdAt||r.created_at))}</td><td>${esc(r.method||'UPI')}</td><td class="wallet-amount">${money(r.amount)}</td><td><span class="wallet-status ${['approved','success','completed','received'].includes(String(r.status).toLowerCase())?'success':''}">${esc(r.status||'pending')}</span></td></tr>`).join('')}</tbody></table></div>`:`<div class="wallet-empty"><div>↗</div><h3>No withdrawal requests</h3><p>Your submitted Cashfree payouts will be tracked here.</p></div>`}
    </section>
    <div class="wallet-help"><strong>Need help?</strong><span>Keep your payout details correct. Cashfree status is confirmed by the Bookora backend.</span><a href="#/help">Open Help Center →</a></div>
  </div></div>`;
}

export function initWalletPageEvents(){
  // The Cashfree payout bridge owns the withdrawal submit flow. This page must
  // never write payoutRequests directly from the browser.
  document.getElementById('wallet-save-upi')?.addEventListener('click',async()=>{
    const current = state.currentUser?.upiId || state.currentUser?.upi_id || '';
    const upi=prompt('Enter your UPI ID:',current); if(!upi)return;
    try{
      await savePayoutProfile({upiId:upi.trim()});
      Toast.show('UPI details saved securely.','success');
      const label=document.getElementById('wallet-upi-label'); if(label) label.textContent=upi.trim();
    }catch(e){Toast.show(e.message||'Unable to save UPI details.','error');}
  });
}
