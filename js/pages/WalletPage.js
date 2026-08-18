import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

const money = n => `₹${Number(n || 0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

export async function renderWalletPage(){
  updateSEO({title:'Seller Wallet & Payouts',description:'Manage your Bookora creator earnings, withdrawal requests and payout details.'});
  const uid = state.currentUser?.uid || state.currentUser?.id;
  if(!uid) return `<div class="container" style="padding:5rem 1rem;text-align:center"><h1>Sign in required</h1><a class="btn btn-primary" href="#/login">Sign In</a></div>`;

  let wallet = {}, transactions = [], payoutRequests = [], profile = state.currentUser || {};
  try {
    if(window.firebase?.firestore){
      const db=window.firebase.firestore();
      const w=await db.collection('wallets').doc(uid).get();
      if(w.exists) wallet={id:w.id,...w.data()};
      const p=await db.collection('users').doc(uid).get();
      if(p.exists) profile={...profile,...p.data()};
      try{ const q=await db.collection('walletTransactions').where('sellerId','==',uid).limit(30).get(); transactions=q.docs.map(d=>({id:d.id,...d.data()})); }catch{}
      try{ const q=await db.collection('payoutRequests').where('sellerId','==',uid).limit(30).get(); payoutRequests=q.docs.map(d=>({id:d.id,...d.data()})); }catch{}
    }
  }catch(e){ console.warn('Wallet data load:',e); }

  const available=wallet.availableBalance ?? wallet.available ?? wallet.balance ?? 0;
  const pending=wallet.pendingBalance ?? wallet.pending ?? 0;
  const withdrawn=wallet.withdrawn ?? wallet.totalWithdrawn ?? 0;
  const lifetime=wallet.lifetimeEarnings ?? wallet.lifetime ?? wallet.totalEarned ?? (Number(available)+Number(pending)+Number(withdrawn));

  return `<div class="seller-wallet-page"><div class="container wallet-wrap">
    <div class="wallet-hero"><div><span class="wallet-kicker">CREATOR FINANCE</span><h1>Wallet & Payouts</h1><p>Track your Bookora earnings, pending royalties and withdrawal requests.</p></div><a class="btn btn-primary" href="#/seller/dashboard">← Seller Studio</a></div>
    <div class="wallet-stats">
      <div class="wallet-stat wallet-stat-main"><span>Available balance</span><strong>${money(available)}</strong><small>Ready for withdrawal</small></div>
      <div class="wallet-stat"><span>Pending</span><strong>${money(pending)}</strong><small>Being processed</small></div>
      <div class="wallet-stat"><span>Lifetime earnings</span><strong>${money(lifetime)}</strong><small>Total creator earnings</small></div>
      <div class="wallet-stat"><span>Withdrawn</span><strong>${money(withdrawn)}</strong><small>Paid out so far</small></div>
    </div>
    <div class="wallet-grid">
      <section class="wallet-card"><div class="wallet-card-head"><div><span class="wallet-kicker">PAYOUT</span><h2>Request a withdrawal</h2></div><span class="wallet-safe">Secure</span></div>
        <p class="wallet-muted">Minimum withdrawal: ₹100. Requests are reviewed before payout.</p>
        <form id="wallet-withdraw-form" class="wallet-form">
          <label>Amount<input id="wallet-amount" type="number" min="100" step="1" max="${Math.max(100,Number(available))}" placeholder="Enter amount" required></label>
          <label>Payout method<select id="wallet-method"><option value="UPI">UPI</option><option value="BANK">Bank transfer</option></select></label>
          <label>UPI ID / payout reference<input id="wallet-destination" value="${esc(profile.upiId || profile.upi_id || '')}" placeholder="example@upi" required></label>
          <button class="btn btn-primary btn-lg" type="submit">Request withdrawal →</button>
          <small class="wallet-note">Your request will be recorded as pending. The balance is not reduced until the payout is approved.</small>
        </form>
      </section>
      <section class="wallet-card"><div class="wallet-card-head"><div><span class="wallet-kicker">PAYOUT PROFILE</span><h2>Your payout details</h2></div></div>
        <div class="profile-mini"><div class="profile-avatar">${esc((profile.name||'A').slice(0,1).toUpperCase())}</div><div><strong>${esc(profile.name||'Creator')}</strong><span>${esc(profile.email||'')}</span></div></div>
        <div class="wallet-detail"><span>Seller status</span><strong class="wallet-approved">${state.isAdmin?'ADMIN':(state.isSeller?'APPROVED':'PENDING')}</strong></div>
        <div class="wallet-detail"><span>UPI ID</span><strong id="wallet-upi-label">${esc(profile.upiId||profile.upi_id||'Not added')}</strong></div>
        <button id="wallet-save-upi" class="btn btn-secondary" type="button">Save UPI details</button>
      </section>
    </div>
    <section class="wallet-card wallet-table-card"><div class="wallet-card-head"><div><span class="wallet-kicker">ACTIVITY</span><h2>Recent transactions</h2></div><span class="wallet-count">${transactions.length} records</span></div>
      ${transactions.length?`<div class="wallet-table-scroll"><table><thead><tr><th>Date</th><th>Description</th><th>Status</th><th>Amount</th></tr></thead><tbody>${transactions.map(t=>`<tr><td>${esc(t.createdAt?.toDate?.()?.toLocaleDateString('en-IN')||t.date||'—')}</td><td>${esc(t.description||t.type||'Wallet transaction')}</td><td><span class="wallet-status">${esc(t.status||'completed')}</span></td><td class="wallet-amount ${Number(t.amount)<0?'negative':''}">${Number(t.amount)<0?'−':'+'}${money(Math.abs(Number(t.amount)||0))}</td></tr>`).join('')}</tbody></table></div>`:`<div class="wallet-empty"><div>◎</div><h3>No wallet transactions yet</h3><p>Your earnings and payout activity will appear here.</p></div>`}
    </section>
    <section class="wallet-card wallet-table-card"><div class="wallet-card-head"><div><span class="wallet-kicker">WITHDRAWALS</span><h2>Withdrawal requests</h2></div><span class="wallet-count">${payoutRequests.length} requests</span></div>
      ${payoutRequests.length?`<div class="wallet-table-scroll"><table><thead><tr><th>Date</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead><tbody>${payoutRequests.map(r=>`<tr><td>${esc(r.createdAt?.toDate?.()?.toLocaleDateString('en-IN')||r.date||'—')}</td><td>${esc(r.method||'UPI')}</td><td class="wallet-amount">${money(r.amount)}</td><td><span class="wallet-status ${String(r.status).toLowerCase()==='approved'?'success':''}">${esc(r.status||'pending')}</span></td></tr>`).join('')}</tbody></table></div>`:`<div class="wallet-empty"><div>↗</div><h3>No withdrawal requests</h3><p>Your submitted requests will be tracked here.</p></div>`}
    </section>
    <div class="wallet-help"><strong>Need help?</strong><span>Check your payout details before submitting a request.</span><a href="#/help">Open Help Center →</a></div>
  </div></div>`;
}

export function initWalletPageEvents(){
  const uid=state.currentUser?.uid||state.currentUser?.id;
  document.getElementById('wallet-withdraw-form')?.addEventListener('submit',async e=>{
    e.preventDefault();
    const amount=Number(document.getElementById('wallet-amount').value||0), method=document.getElementById('wallet-method').value, destination=document.getElementById('wallet-destination').value.trim();
    if(amount<100){Toast.show('Minimum withdrawal is ₹100.','warning');return;}
    try{
      if(!window.firebase?.firestore) throw new Error('Firebase is not ready');
      const db=window.firebase.firestore();
      const w=await db.collection('wallets').doc(uid).get(); const data=w.exists?w.data():{}; const available=Number(data.availableBalance??data.available??data.balance??0);
      if(amount>available){Toast.show('Withdrawal amount exceeds your available balance.','error');return;}
      await db.collection('payoutRequests').add({sellerId:uid,userId:uid,amount,method,destination,status:'pending',createdAt:firebase.firestore.FieldValue.serverTimestamp()});
      Toast.show('Withdrawal request submitted successfully.','success'); setTimeout(()=>location.reload(),700);
    }catch(err){console.error(err);Toast.show('Could not submit withdrawal. Please try again.','error');}
  });
  document.getElementById('wallet-save-upi')?.addEventListener('click',async()=>{
    const upi=prompt('Enter your UPI ID:',state.currentUser?.upiId||state.currentUser?.upi_id||''); if(!upi)return;
    try{const db=window.firebase.firestore();await db.collection('users').doc(uid).set({upiId:upi,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});Toast.show('UPI details saved.','success');document.getElementById('wallet-upi-label').textContent=upi;}catch(e){Toast.show('Unable to save UPI details.','error');}
  });
}
