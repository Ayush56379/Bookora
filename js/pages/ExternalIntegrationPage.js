import { apiFetch } from '../config.js';
import { getFreshFirebaseIdToken } from '../firebase-authenticated-fetch.js?v=20260823-3';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

const esc = (v='') => String(v).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const fmt = (v) => Number(v || 0).toLocaleString('en-IN');
const date = (v) => v ? new Date(v).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}) : 'Never';

async function authToken(){
  const token=await getFreshFirebaseIdToken(true).catch(()=>null);
  if(token) return token;
  try { const saved=String(localStorage.getItem('bookora_auth_token')||'').trim(); if(saved) return saved; } catch(_){ }
  throw new Error('Seller authentication required. Please sign in again.');
}

function codeBox(code){
  return `<section style="margin-top:1rem;border:1px solid #dbe4f0;border-radius:16px;overflow:hidden;background:#fff"><div style="padding:1rem 1.1rem;border-bottom:1px solid #e5e7eb;background:#f8fafc"><b>ONE Master Bookora Code</b><div style="font-size:.78rem;color:#64748b;margin-top:.25rem">Install this once in the external website's global Header / Footer / Custom Code area. No separate code is required for individual pages or books.</div></div><div style="padding:1rem"><textarea id="ext-master-code" readonly rows="4" style="width:100%;box-sizing:border-box;padding:.85rem;border:1px solid #cbd5e1;border-radius:11px;background:#0b1220;color:#e2e8f0;font:12px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace;resize:vertical">${esc(code)}</textarea><button id="ext-copy-code" type="button" class="btn btn-primary" style="margin-top:.65rem">Copy Full Code</button></div></section>`;
}

function metric(label,value,sub=''){
  return `<div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:1rem"><div style="font-size:.72rem;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.04em">${esc(label)}</div><div style="font-size:1.35rem;font-weight:850;color:#0f172a;margin-top:.3rem">${esc(value)}</div>${sub?`<div style="font-size:.72rem;color:#64748b;margin-top:.2rem">${esc(sub)}</div>`:''}</div>`;
}

function statusPill(ok,label){
  return `<span style="display:inline-flex;align-items:center;gap:.35rem;padding:.32rem .65rem;border-radius:999px;font-size:.7rem;font-weight:800;background:${ok?'#dcfce7':'#fee2e2'};color:${ok?'#166534':'#991b1b'}">${ok?'✓':'●'} ${esc(label)}</span>`;
}

function renderStatus(integration){
  const badge=document.getElementById('ext-master-status');
  const host=document.getElementById('ext-status-dashboard');
  if(!integration) return;
  const status=String(integration.status||'').toLowerCase();
  const hb=integration.lastHeartbeatAt ? Date.now()-new Date(integration.lastHeartbeatAt).getTime() : Infinity;
  const runtime=hb<90000;
  const reachable=!!integration.lastSyncAt || !!integration.verifiedAt;
  const verified=status==='connected' || !!integration.codeInstallationVerified || !!integration.verifiedAt;
  const healthy=verified && (runtime || reachable);
  if(badge){ badge.textContent=healthy?'✓ WEBSITE CONNECTED & VERIFIED':(verified?'⚠ WEBSITE VERIFIED — RUNTIME IDLE':'CODE INSTALLATION PENDING'); badge.style.background=healthy?'#dcfce7':verified?'#fef3c7':'#fee2e2'; badge.style.color=healthy?'#166534':verified?'#92400e':'#991b1b'; }
  if(!host) return;
  host.innerHTML=`<section style="margin-top:1rem;background:#fff;border:1px solid #dbe4f0;border-radius:18px;padding:1.15rem"><div style="display:flex;justify-content:space-between;gap:.8rem;align-items:center;flex-wrap:wrap"><div><div style="font-size:.72rem;color:#64748b;font-weight:800;text-transform:uppercase">Website health</div><h3 style="margin:.25rem 0;color:#0f172a">${esc(integration.websiteName||integration.websiteDomain||'External Website')}</h3><div style="font-size:.78rem;color:#64748b">${esc(integration.websiteUrl||'')}</div></div><div style="display:flex;gap:.4rem;flex-wrap:wrap">${statusPill(verified,'Bookora verified')}${statusPill(runtime,'Runtime active')}</div></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.65rem;margin-top:1rem">${metric('Tracked pages',fmt(integration.trackedPages))}${metric('Active pages',fmt(integration.activePages))}${metric('Visitors',fmt(integration.visitorCount))}${metric('Referrals',fmt(integration.referralCount))}${metric('Orders',fmt(integration.orderCount))}${metric('Successful payments',fmt(integration.successfulPayments))}${metric('Pending payments',fmt(integration.pendingPayments))}${metric('Failed payments',fmt(integration.failedPayments))}${metric('Library access',fmt(integration.libraryAccessGranted))}${metric('Revenue',`₹${Number(integration.revenue||0).toLocaleString('en-IN',{maximumFractionDigits:2})}`)}</div><div style="margin-top:1rem;padding:.8rem;background:#f8fafc;border-radius:12px;font-size:.76rem;color:#475569;line-height:1.7"><b>Last runtime heartbeat:</b> ${esc(date(integration.lastHeartbeatAt))}<br><b>Last website sync/check:</b> ${esc(date(integration.lastSyncAt))}<br><b>Verified at:</b> ${esc(date(integration.verifiedAt))}<br><b>Integration ID:</b> ${esc(integration.integrationId||'')}</div></section>`;
  const pages=Array.isArray(integration.pages)?integration.pages:[];
  const pageHost=document.getElementById('ext-pages-list');
  if(pageHost){
    pageHost.innerHTML=`<section style="margin-top:1rem;background:#fff;border:1px solid #dbe4f0;border-radius:18px;padding:1.1rem"><div style="font-weight:800;color:#0f172a">Website pages detected by Bookora <span style="font-size:.7rem;color:#64748b">(${pages.length})</span></div>${pages.length?`<div style="margin-top:.7rem;max-height:330px;overflow:auto">${pages.slice(0,150).map(p=>`<div style="display:flex;justify-content:space-between;gap:.7rem;padding:.65rem 0;border-bottom:1px solid #eef2f7"><div style="min-width:0"><div style="font-size:.8rem;font-weight:700;color:#334155;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.title||p.url||'Untitled page')}</div><div style="font-size:.7rem;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.url||'')}</div></div><div style="font-size:.66rem;color:#64748b;white-space:nowrap">${p.lastHeartbeatAt?'Active':'Discovered'}</div></div>`).join('')}</div>`:'<div style="margin-top:.6rem;color:#64748b;font-size:.8rem">No pages have been discovered yet. Run a website scan from the External Publisher.</div>'}</section>`;
  }
}

export function renderExternalIntegrationPage(){
  updateSEO({title:'External Website Integration Status',description:'View complete Bookora integration, website health, pages, traffic, referrals, payments and library fulfillment status.'});
  return `<main class="external-integration-page animate-fade-in" style="min-height:85vh;background:#f6f8fc;padding:2.2rem 0 5rem"><div class="container" style="max-width:1080px"><div style="text-align:center;margin-bottom:1.4rem"><span id="ext-master-status" style="display:inline-flex;padding:.35rem .7rem;border-radius:999px;background:#fef3c7;color:#92400e;font-size:.72rem;font-weight:800">CHECKING WEBSITE…</span><h1 style="font-family:var(--font-display);font-size:2.2rem;margin:.65rem 0;color:#0f172a">Complete Website Integration Status</h1><p style="max-width:800px;margin:auto;color:#64748b;line-height:1.65">Bookora shows the actual integration state of the seller website: verification, runtime heartbeat, website pages, visitors, referrals, orders, payments, fulfillment and latest activity.</p></div><div id="ext-integration-loading" style="background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:2rem;text-align:center;color:#64748b">Loading secure integration details…</div><div id="ext-integration-content" style="display:none"><div id="ext-book-summary"></div><div id="ext-status-dashboard"></div><div id="ext-pages-list"></div><div id="ext-code-sections"></div></div></div></main>`;
}

async function loadMasterIntegration(token,book){
  let r=await apiFetch('/api/external/integrations/current',{headers:{Authorization:`Bearer ${token}`},cache:'no-store'}); let d=await r.json();
  if(!r.ok) throw new Error(d.error||'Could not load website integration.');
  if(!d.connected){
    const websiteUrl=String(book.source_url||book.canonical_url||book.sourceUrl||'').trim();
    if(!websiteUrl) throw new Error('Seller website URL is missing from this external eBook.');
    const c=await apiFetch('/api/external/integrations',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({websiteUrl,websiteName:book.website_name||book.websiteName||''})});
    d=await c.json(); if(!c.ok||!d.success) throw new Error(d.error||'Could not create the master integration.');
    d.connected=true; d.integration=d.integration||{}; d.integration.scriptTag=d.scriptTag||'';
  }
  return d.integration||{};
}

async function verifyMasterIntegration(token,id){
  const r=await apiFetch(`/api/external/integrations/${encodeURIComponent(id)}/verify`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:'{}'}); const d=await r.json().catch(()=>({})); return {ok:r.ok&&!!d.verified,data:d};
}

export async function initExternalIntegrationPage(bookId){
  const loading=document.getElementById('ext-integration-loading'); const content=document.getElementById('ext-integration-content'); let pollTimer=null;
  try{
    const token=await authToken();
    const res=await apiFetch(`/api/external/integration/${encodeURIComponent(bookId)}`,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'}); const data=await res.json();
    if(!res.ok||!data.success) throw new Error(data.error||'Integration details could not be loaded.');
    const book=data.book||{}; let integration=await loadMasterIntegration(token,book);
    const masterCode=String(integration.scriptTag||data.master_code||'').trim(); if(!masterCode) throw new Error('Bookora master integration code could not be generated.');
    document.getElementById('ext-book-summary').innerHTML=`<div style="background:#fff;border:1px solid #dbe4f0;border-radius:18px;padding:1.15rem;display:flex;justify-content:space-between;gap:1rem;align-items:center;flex-wrap:wrap"><div><div style="font-size:.7rem;font-weight:800;color:#64748b;text-transform:uppercase">External eBook</div><h2 style="margin:.25rem 0;color:#0f172a;font-size:1.2rem">${esc(book.title||'Your eBook')}</h2><div style="font-size:.78rem;color:#64748b">Book ID: ${esc(book.id||bookId)} • Website: ${esc(integration.websiteDomain||integration.websiteUrl||book.source_url||'Seller website')}</div></div><a class="btn btn-secondary" href="${esc(integration.websiteUrl||book.source_url||'#')}" target="_blank" rel="noopener">Open Website ↗</a></div>`;
    renderStatus(integration);
    let html=`<div style="margin-top:1rem;padding:1.1rem;border:1px solid #bfdbfe;border-radius:16px;background:#eff6ff;color:#1e3a8a;line-height:1.75;font-size:.82rem"><b>How the protection works</b><ol style="margin:.45rem 0 0 1.1rem;padding:0"><li>The seller installs one master Bookora code once site-wide.</li><li>Bookora verifies that the public code is actually present on the registered website.</li><li>The live code sends a domain-bound heartbeat so Bookora can show runtime health.</li><li>Direct seller-site access can be blocked by the seller-side integration; Bookora referrals carry the valid purchase session.</li><li>Payment and Library access remain backend-controlled and are never granted from a browser redirect alone.</li></ol></div>`;
    html+=codeBox(masterCode);
    html+=`<div style="margin-top:1rem;padding:1rem;border:1px solid #dbe4f0;border-radius:16px;background:#fff;display:flex;gap:.7rem;align-items:center;justify-content:space-between;flex-wrap:wrap"><div><b>Live verification</b><div id="ext-verify-message" style="font-size:.76rem;color:#64748b;margin-top:.2rem">Checking the registered website…</div></div><button id="ext-verify-btn" type="button" class="btn btn-primary">Check Website Now</button></div>`;
    html+=`<div style="margin-top:1rem;display:flex;gap:.7rem;flex-wrap:wrap"><a class="btn btn-secondary" href="#/publish/external">Back to External Publisher</a><a class="btn btn-primary" href="#/library">Open Library</a></div>`;
    document.getElementById('ext-code-sections').innerHTML=html; loading.style.display='none'; content.style.display='block';
    document.getElementById('ext-copy-code')?.addEventListener('click',async()=>{const el=document.getElementById('ext-master-code');try{await navigator.clipboard.writeText(el.value);Toast.show('Master Bookora code copied.','success');}catch(_){el.select();document.execCommand('copy');Toast.show('Master Bookora code copied.','success');}});
    const verifyBtn=document.getElementById('ext-verify-btn'); const verifyMsg=document.getElementById('ext-verify-message');
    const doVerify=async()=>{verifyBtn.disabled=true;verifyBtn.textContent='Checking…';try{const result=await verifyMasterIntegration(token,integration.integrationId);if(result.ok){verifyMsg.textContent=`✓ Public website is reachable and Bookora code was found (${date(new Date().toISOString())}).`;verifyMsg.style.color='#166534';integration={...integration,status:'connected',verifiedAt:new Date().toISOString(),lastSyncAt:new Date().toISOString(),codeInstallationVerified:true};renderStatus(integration);Toast.show('Website verified successfully.','success');}else{verifyMsg.textContent=result.data?.error||'Bookora could not find the master code on the registered website.';verifyMsg.style.color='#b91c1c';}}catch(e){verifyMsg.textContent=e.message||'Website verification failed.';verifyMsg.style.color='#b91c1c';}finally{verifyBtn.disabled=false;verifyBtn.textContent='Check Website Now';}};
    verifyBtn?.addEventListener('click',doVerify); doVerify();
    pollTimer=setInterval(async()=>{try{const r=await apiFetch('/api/external/integrations/current',{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});const d=await r.json();if(r.ok&&d.success&&d.integration){integration=d.integration;renderStatus(integration);}}catch(_){ }},5000);
  }catch(err){if(pollTimer)clearInterval(pollTimer);loading.innerHTML=`<div style="color:#b91c1c;font-weight:700">${esc(err.message||'Integration details could not be loaded.')}</div><a class="btn btn-secondary" href="#/publish/external" style="display:inline-block;margin-top:1rem">Back</a>`;}
}
