// Bookora - Admin Plans Management
import { getFirestoreInstance } from '../services/firebase.js';
import { state } from '../state.js';
import { Toast } from '../components/Toast.js';

const DEFAULT_PLANS = [
  { id: '15-days', name: '15 Days Plan', price: 399, durationDays: 15, description: 'Access Bookora premium features for 15 days.', active: true },
  { id: '30-days', name: '30 Days Plan', price: 799, durationDays: 30, description: 'Access Bookora premium features for 30 days.', active: true },
  { id: '1-year', name: '1 Year Plan', price: 3599, durationDays: 365, description: 'Access Bookora premium features for one year.', active: true }
];
let plans = [];
let unsubscribe = null;

function admin() {
  const u = state.currentUser || {};
  return state.isAdmin || u.role === 'admin' || u.isMasterAdmin || String(u.email || '').toLowerCase() === 'ayushprajpati6@gmail.com';
}
function esc(v) { return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
function money(v) { return `₹${Number(v || 0).toLocaleString('en-IN')}`; }

export function renderAdminPlansPage() {
  if (!admin()) return `<section style="min-height:70vh;display:flex;align-items:center;justify-content:center;background:#f8fafc;padding:30px"><div style="background:#fff;border:1px solid #e2e8f0;border-radius:20px;padding:40px;text-align:center"><h2>🔒 Access Denied</h2><p>Administrator authorization is required.</p></div></section>`;
  return `
  <section style="min-height:100vh;background:#f8fafc;padding:32px">
    <div style="max-width:1200px;margin:auto">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px;flex-wrap:wrap;margin-bottom:28px">
        <div><span style="display:inline-flex;padding:7px 12px;border-radius:999px;background:#eff6ff;color:#2563eb;font-size:11px;font-weight:800">💳 SUBSCRIPTION PLANS</span><h1 style="margin:12px 0 5px;color:#0f172a;font-size:32px">Plans</h1><p style="margin:0;color:#64748b">Create and manage Bookora subscription plans.</p></div>
        <button id="plans-seed" style="border:0;background:#2563eb;color:#fff;border-radius:12px;padding:13px 18px;font-weight:700;cursor:pointer">＋ Add Default Plans</button>
      </div>
      <div id="admin-plans-list" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px"><div style="padding:40px;text-align:center;color:#64748b">Loading plans...</div></div>
    </div>
  </section>
  <style>.plan-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:24px;box-shadow:0 2px 8px rgba(15,23,42,.03)}.plan-price{font-size:30px;font-weight:800;color:#0f172a;margin:14px 0}.plan-meta{color:#64748b;font-size:13px;line-height:1.6}.plan-actions{display:flex;gap:8px;margin-top:18px;flex-wrap:wrap}.plan-btn{border:0;border-radius:9px;padding:9px 12px;font-weight:700;cursor:pointer;font-size:12px}.toggle{background:#dbeafe;color:#1d4ed8}.delete{background:#fee2e2;color:#991b1b}</style>`;
}

function renderList() {
  const el = document.getElementById('admin-plans-list'); if (!el) return;
  if (!plans.length) { el.innerHTML = '<div style="grid-column:1/-1;background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:50px;text-align:center;color:#64748b">No plans found. Click <b>Add Default Plans</b> to create the Bookora plans.</div>'; return; }
  el.innerHTML = plans.map(p => `<article class="plan-card"><div style="display:flex;justify-content:space-between;gap:10px"><strong style="color:#0f172a;font-size:18px">${esc(p.name)}</strong><span style="font-size:11px;font-weight:800;color:${p.active===false?'#991b1b':'#166534'}">${p.active===false?'INACTIVE':'ACTIVE'}</span></div><div class="plan-price">${money(p.price)}</div><div class="plan-meta">Duration: <b>${esc(p.durationDays || p.duration_days || '—')} days</b><br>${esc(p.description || '')}</div><div class="plan-actions"><button class="plan-btn toggle" data-plan-toggle="${esc(p.id)}">${p.active===false?'Activate':'Deactivate'}</button><button class="plan-btn delete" data-plan-delete="${esc(p.id)}">Delete</button></div></article>`).join('');
  el.querySelectorAll('[data-plan-toggle]').forEach(b=>b.addEventListener('click',()=>togglePlan(b.dataset.planToggle)));
  el.querySelectorAll('[data-plan-delete]').forEach(b=>b.addEventListener('click',()=>deletePlan(b.dataset.planDelete)));
}

async function loadPlans() {
  const db = getFirestoreInstance();
  if (!db) { plans = DEFAULT_PLANS; renderList(); return; }
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  unsubscribe = db.collection('plans').onSnapshot(snap => { plans = snap.docs.map(d=>({id:d.id,...d.data()})); renderList(); }, err => { console.error(err); Toast.show('Unable to load plans. Check Firestore Rules.','error'); plans = DEFAULT_PLANS; renderList(); });
}

async function seedPlans() {
  const db = getFirestoreInstance();
  if (!db) return Toast.show('Firestore is not available.','error');
  try {
    const batch = db.batch();
    DEFAULT_PLANS.forEach(p => batch.set(db.collection('plans').doc(p.id), {...p, updatedAt:new Date()} , {merge:true}));
    await batch.commit(); Toast.show('Default plans saved successfully.','success');
  } catch(e) { console.error(e); Toast.show('Could not save plans. Check Firestore Rules.','error'); }
}
async function togglePlan(id) { const db=getFirestoreInstance(); if(!db)return; try { const p=plans.find(x=>x.id===id); await db.collection('plans').doc(id).update({active:p?.active===false,updatedAt:new Date()}); Toast.show('Plan status updated.','success'); } catch(e){Toast.show('Could not update plan.','error');} }
async function deletePlan(id) { if(!confirm('Delete this subscription plan?')) return; const db=getFirestoreInstance(); if(!db)return; try { await db.collection('plans').doc(id).delete(); Toast.show('Plan deleted.','success'); } catch(e){Toast.show('Could not delete plan.','error');} }

export function initAdminPlansEvents() { const b=document.getElementById('plans-seed'); if(b)b.addEventListener('click',seedPlans); loadPlans(); }
