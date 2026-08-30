import { apiFetch } from './config.js';

let panel = null;
let installedFor = '';

const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const money = value => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

async function loadDonations(){
  const response = await apiFetch('/api/admin/support');
  const data = await response.json().catch(() => ({}));
  if(!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

function closePanel(){ panel?.remove(); panel=null; }

async function openPanel(){
  if(panel){ closePanel(); return; }
  panel=document.createElement('div');
  panel.id='bookora-admin-donations-panel';
  panel.innerHTML=`<div style="position:fixed;inset:0;background:rgba(15,23,42,.45);z-index:1000;display:grid;place-items:center;padding:20px"><section style="width:min(920px,100%);max-height:88vh;overflow:auto;background:#fff;border-radius:20px;box-shadow:0 25px 80px rgba(15,23,42,.25);padding:22px"><div style="display:flex;align-items:center;justify-content:space-between;gap:16px"><div><div style="font:800 12px Inter,sans-serif;color:#64748b;text-transform:uppercase;letter-spacing:.08em">Firebase • Cashfree</div><h2 style="margin:4px 0 0;font:800 24px Inter,sans-serif;color:#0f172a">Bookora Donations</h2></div><button id="bookora-donation-close" type="button" style="border:0;background:#f1f5f9;border-radius:10px;padding:9px 12px;cursor:pointer">✕</button></div><div id="bookora-donation-content" style="margin-top:18px"><div style="padding:28px;text-align:center;color:#64748b">Loading donation records…</div></div></section></div>`;
  document.body.appendChild(panel);
  panel.querySelector('#bookora-donation-close')?.addEventListener('click',closePanel);
  panel.querySelector('div[style*="position:fixed"]')?.addEventListener('click',e=>{if(e.target===e.currentTarget)closePanel();});
  const content=panel.querySelector('#bookora-donation-content');
  try{
    const data=await loadDonations();
    const rows=Array.isArray(data.transactions)?data.transactions:[];
    content.innerHTML=`<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:18px"><div style="padding:16px;border:1px solid #e2e8f0;border-radius:14px;background:#f8fafc"><div style="font:700 12px Inter,sans-serif;color:#64748b">TOTAL RECEIVED</div><div style="margin-top:5px;font:900 28px Inter,sans-serif;color:#059669">${money(data.total)}</div></div><div style="padding:16px;border:1px solid #e2e8f0;border-radius:14px;background:#f8fafc"><div style="font:700 12px Inter,sans-serif;color:#64748b">PAID SUPPORTS</div><div style="margin-top:5px;font:900 28px Inter,sans-serif;color:#0f172a">${rows.filter(x=>String(x.paymentStatus||'').toUpperCase()==='PAID').length}</div></div><div style="padding:16px;border:1px solid #e2e8f0;border-radius:14px;background:#f8fafc"><div style="font:700 12px Inter,sans-serif;color:#64748b">CURRENCY</div><div style="margin-top:5px;font:900 28px Inter,sans-serif;color:#0f172a">${esc(data.currency||'INR')}</div></div></div>${rows.length?`<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font:500 13px Inter,sans-serif"><thead><tr style="background:#f8fafc;text-align:left"><th style="padding:11px">Order ID</th><th style="padding:11px">Supporter</th><th style="padding:11px">Amount</th><th style="padding:11px">Status</th><th style="padding:11px">Date</th></tr></thead><tbody>${rows.map(x=>`<tr style="border-top:1px solid #e2e8f0"><td style="padding:11px;font-family:monospace">${esc(x.orderId)}</td><td style="padding:11px">${esc(x.name||'Bookora Supporter')}</td><td style="padding:11px;font-weight:800">${money(x.amount)}</td><td style="padding:11px"><span style="display:inline-block;padding:4px 8px;border-radius:999px;background:${String(x.paymentStatus||'').toUpperCase()==='PAID'?'#dcfce7':'#f1f5f9'};color:${String(x.paymentStatus||'').toUpperCase()==='PAID'?'#166534':'#475569'}">${esc(x.paymentStatus||'PENDING')}</span></td><td style="padding:11px;color:#64748b">${esc(x.createdAt?new Date(x.createdAt).toLocaleString('en-IN'):'—')}</td></tr>`).join('')}</tbody></table></div>`:'<div style="padding:32px;text-align:center;color:#64748b">No donation records yet.</div>'}`;
  }catch(error){ content.innerHTML=`<div style="padding:28px;text-align:center;color:#b91c1c">${esc(error.message||'Unable to load donation records.')}</div>`; }
}

function install(){
  const path=(location.hash||'#/').split('?')[0];
  if(!path.startsWith('#/admin')){installedFor='';return;}
  const nav=document.querySelector('.admin-dashboard .container > div:nth-child(2)');
  if(!nav)return;
  if(installedFor===location.hash && nav.querySelector('#bookora-admin-donations-btn'))return;
  installedFor=location.hash;
  nav.querySelector('#bookora-admin-donations-btn')?.remove();
  const button=document.createElement('a');
  button.id='bookora-admin-donations-btn';
  button.href='#';
  button.className='nav-link';
  button.style.cssText='font-size:.85rem;font-weight:800;border-radius:var(--radius-md);padding:.5rem 1rem;white-space:nowrap';
  button.innerHTML='Donations';
  button.addEventListener('click',e=>{e.preventDefault();openPanel();});
  nav.appendChild(button);
}

window.addEventListener('hashchange',()=>setTimeout(install,250));
const observer=new MutationObserver(()=>setTimeout(install,0));
observer.observe(document.body,{childList:true,subtree:true});
setTimeout(install,500);
