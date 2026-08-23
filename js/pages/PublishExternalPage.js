import { apiFetch } from '../config.js';
import { state } from '../state.js';
import { getFreshFirebaseIdToken } from '../firebase-authenticated-fetch.js?v=20260823-3';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

const esc = (v='') => String(v).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

export function renderPublishExternalPage() {
  updateSEO({ title: 'External Website Integration', description: 'Connect one external seller website to Bookora with a single verified integration code.' });
  const categories = Array.isArray(state.categories) ? state.categories : [];
  return `
  <div class="publish-external-page animate-fade-in" style="background:var(--bg-secondary);min-height:85vh;padding:3rem 0 5rem">
    <div class="container" style="max-width:980px">
      <div style="text-align:center;margin-bottom:2rem">
        <div class="badge badge-external">EXTERNAL EBOOK • VERIFIED INTEGRATION</div>
        <h1 style="font-family:var(--font-display);font-size:2.35rem;font-weight:800;color:var(--text-primary);margin:.6rem 0">Connect an External Seller Website</h1>
        <p style="color:var(--text-secondary);max-width:720px;margin:auto">Register the seller website, scan its public pages, upload the authorized fulfillment PDF, then install <strong>one master Bookora code</strong>. The same code works across the entire website.</p>
      </div>

      <div id="ext-current-integration" style="margin-bottom:1rem"></div>

      <div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:2rem;box-shadow:var(--shadow-sm)">
        <div style="display:grid;grid-template-columns:1fr 280px;gap:1rem;margin-bottom:1rem">
          <div>
            <label style="display:block;font-weight:700;margin-bottom:.45rem">Website URL *</label>
            <input id="ext-url-input" type="url" placeholder="https://seller-example.com" style="width:100%;padding:.8rem 1rem;border:1px solid var(--border-medium);border-radius:var(--radius-md)" />
          </div>
          <div>
            <label style="display:block;font-weight:700;margin-bottom:.45rem">Website Name</label>
            <input id="ext-website-name" type="text" placeholder="My Book Store" style="width:100%;padding:.8rem 1rem;border:1px solid var(--border-medium);border-radius:var(--radius-md)" />
          </div>
        </div>
        <button id="ext-fetch-btn" type="button" class="btn btn-primary">Scan Website & Fetch Book Information</button>
        <div style="font-size:.75rem;color:var(--text-muted);margin-top:.5rem">HTTPS only. Server-side SSRF protection blocks localhost, private IPs, internal networks and unsafe redirects. Only public pages are processed.</div>

        <div id="ext-progress" style="display:none;margin-top:1.25rem;padding:1rem;border:1px solid var(--border-subtle);border-radius:var(--radius-lg);background:#f8fafc">
          <strong id="ext-progress-label">Working…</strong>
          <div id="ext-progress-steps" style="margin-top:.6rem;font-size:.82rem;color:var(--text-secondary);line-height:1.8"></div>
        </div>

        <div id="ext-pages-panel" style="display:none;margin-top:1rem"></div>

        <form id="ext-submit-form" style="display:none;margin-top:1.5rem">
          <div style="padding:1rem;border-radius:var(--radius-lg);background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;margin-bottom:1.25rem"><strong>Public metadata imported.</strong> Review it and upload the authorized fulfillment PDF.</div>
          <div style="margin-bottom:1rem"><label style="font-weight:600">Title *</label><input id="ext-title" required style="width:100%;padding:.7rem;margin-top:.3rem;border:1px solid var(--border-medium);border-radius:var(--radius-md)" /></div>
          <div style="margin-bottom:1rem"><label style="font-weight:600">Subtitle</label><input id="ext-subtitle" style="width:100%;padding:.7rem;margin-top:.3rem;border:1px solid var(--border-medium);border-radius:var(--radius-md)" /></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
            <div><label style="font-weight:600">Author *</label><input id="ext-author" required style="width:100%;padding:.7rem;margin-top:.3rem;border:1px solid var(--border-medium);border-radius:var(--radius-md)" /></div>
            <div><label style="font-weight:600">Publisher</label><input id="ext-publisher" style="width:100%;padding:.7rem;margin-top:.3rem;border:1px solid var(--border-medium);border-radius:var(--radius-md)" /></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-bottom:1rem">
            <div><label style="font-weight:600">Price *</label><input id="ext-price" type="number" min="1" step="0.01" required style="width:100%;padding:.7rem;margin-top:.3rem;border:1px solid var(--border-medium);border-radius:var(--radius-md)" /></div>
            <div><label style="font-weight:600">Currency</label><input id="ext-currency" readonly style="width:100%;padding:.7rem;margin-top:.3rem;border:1px solid var(--border-medium);border-radius:var(--radius-md);background:#f8fafc" /></div>
            <div><label style="font-weight:600">Pages</label><input id="ext-pages" type="number" readonly style="width:100%;padding:.7rem;margin-top:.3rem;border:1px solid var(--border-medium);border-radius:var(--radius-md);background:#f8fafc" /></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem;margin-bottom:1rem">
            <div><label style="font-weight:600">Category</label><select id="ext-category" style="width:100%;padding:.7rem;margin-top:.3rem;border:1px solid var(--border-medium);border-radius:var(--radius-md);background:#fff">${categories.map(c=>`<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('')}</select></div>
            <div><label style="font-weight:600">Language</label><input id="ext-language" style="width:100%;padding:.7rem;margin-top:.3rem;border:1px solid var(--border-medium);border-radius:var(--radius-md)" /></div>
            <div><label style="font-weight:600">Format</label><input id="ext-format" readonly style="width:100%;padding:.7rem;margin-top:.3rem;border:1px solid var(--border-medium);border-radius:var(--radius-md);background:#f8fafc" /></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
            <div><label style="font-weight:600">ISBN</label><input id="ext-isbn" readonly style="width:100%;padding:.7rem;margin-top:.3rem;border:1px solid var(--border-medium);border-radius:var(--radius-md);background:#f8fafc" /></div>
            <div><label style="font-weight:600">Cover URL</label><input id="ext-cover-url" type="url" style="width:100%;padding:.7rem;margin-top:.3rem;border:1px solid var(--border-medium);border-radius:var(--radius-md)" /></div>
          </div>
          <div style="margin-bottom:1rem"><label style="font-weight:600">Description *</label><textarea id="ext-description" rows="5" required style="width:100%;padding:.7rem;margin-top:.3rem;border:1px solid var(--border-medium);border-radius:var(--radius-md)"></textarea></div>
          <div style="padding:1.25rem;border:2px dashed var(--border-medium);border-radius:var(--radius-lg);background:#fafafa;margin-bottom:1rem">
            <label style="display:block;font-weight:700">Bookora Fulfillment PDF *</label>
            <p style="font-size:.8rem;color:var(--text-secondary);margin:.35rem 0 .7rem">Upload the authorized PDF Bookora will protect and deliver after a server-verified successful payment.</p>
            <input id="ext-pdf" type="file" accept="application/pdf,.pdf" required />
            <div id="ext-pdf-status" style="font-size:.82rem;margin-top:.5rem;color:var(--text-secondary)">No PDF selected.</div>
          </div>
          <div style="padding:1.25rem;border:1px solid #bfdbfe;border-radius:var(--radius-lg);background:#eff6ff;margin-bottom:1rem">
            <strong>One-code installation</strong>
            <p style="font-size:.82rem;color:#334155;margin:.35rem 0">The seller receives one master integration snippet. It can be placed on the homepage, product pages, book pages, checkout pages and other tracked pages. Do not create a new code for each page.</p>
            <div id="ext-integration-panel" style="display:none;margin-top:1rem"></div>
          </div>
          <label style="display:flex;gap:.7rem;align-items:flex-start;margin-bottom:1.2rem;cursor:pointer"><input id="ext-confirm-checkbox" type="checkbox" style="margin-top:4px;width:18px;height:18px" /><span style="font-size:.86rem;font-weight:600">I confirm I own or am authorized to sell/promote this eBook, upload this fulfillment PDF, and use the external website.</span></label>
          <button id="ext-submit-btn" type="submit" class="btn btn-primary" disabled style="width:100%;padding:.9rem;opacity:.5">Upload PDF & Create External Listing</button>
        </form>
      </div>
    </div>`;
}

function fileToBase64(file) {
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>{try{const result=String(reader.result||'');const comma=result.indexOf(',');const base64=comma>=0?result.slice(comma+1):result;if(!base64)throw new Error('Could not prepare the PDF for upload.');resolve(base64);}catch(e){reject(e);}};reader.onerror=()=>reject(reader.error||new Error('Could not read file.'));reader.readAsDataURL(file);});
}

async function authToken() {
  // Firebase is the primary authentication authority. Wait for persisted
  // Firebase state before falling back to the Bookora backend session.
  const token = await getFreshFirebaseIdToken(true).catch(()=>null);
  if (token) {
    state.token = token;
    state.isAuthenticated = true;
    return token;
  }

  // The header/session bridge can legitimately show a signed-in Bookora user
  // while Firebase is unavailable or still restoring. In that case reuse the
  // existing authenticated Bookora backend session rather than incorrectly
  // showing "Seller authentication required".
  let backendToken = '';
  try { backendToken = String(localStorage.getItem('bookora_auth_token') || '').trim(); } catch (_) {}
  if (!backendToken) backendToken = String(state.token || '').trim();
  if (backendToken) {
    state.token = backendToken;
    state.isAuthenticated = true;
    return backendToken;
  }

  throw new Error('Seller authentication required. Please sign in again if your session has expired.');
}

function renderCurrentIntegration(data) {
  const host = document.getElementById('ext-current-integration');
  if (!host) return;
  if (!data?.connected) { host.innerHTML=''; return; }
  const i=data.integration||{};
  host.innerHTML=`<div style="background:#fff;border:1px solid var(--border-subtle);border-radius:14px;padding:1.1rem 1.25rem;box-shadow:var(--shadow-sm)"><div style="display:flex;justify-content:space-between;gap:1rem;align-items:center;flex-wrap:wrap"><div><strong>External Website Integration</strong><div style="font-size:.82rem;color:var(--text-secondary);margin-top:.2rem">${esc(i.websiteName||i.websiteDomain||'')} • ${esc(i.websiteUrl||'')}</div></div><span style="padding:.3rem .65rem;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-weight:700;font-size:.75rem">${esc(i.status||'not_connected')}</span></div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.6rem;margin-top:.8rem;font-size:.78rem"><div>Pages<br><strong>${Number(i.trackedPages||0)}</strong></div><div>Visitors<br><strong>${Number(i.visitorCount||0)}</strong></div><div>Orders<br><strong>${Number(i.orderCount||0)}</strong></div><div>Last Sync<br><strong>${esc(i.lastSyncAt||'—')}</strong></div></div></div>`;
}

export async function initPublishExternalEvents() {
  const fetchBtn=document.getElementById('ext-fetch-btn');
  const urlInput=document.getElementById('ext-url-input');
  const nameInput=document.getElementById('ext-website-name');
  const form=document.getElementById('ext-submit-form');
  const confirm=document.getElementById('ext-confirm-checkbox');
  const submit=document.getElementById('ext-submit-btn');
  const pdfInput=document.getElementById('ext-pdf');
  const pdfStatus=document.getElementById('ext-pdf-status');
  let imported=null; let integration=null; let createdBookId=''; let token='';

  try {
    token = await authToken();
    const current=await apiFetch('/api/external/integrations/current',{headers:{Authorization:`Bearer ${token}`}}); renderCurrentIntegration(await current.json());
  } catch (_) {
    // Do not disable the button while Firebase is still warming up. Clicking it retries authentication.
  }

  const setSubmit=()=>{const ok=!!confirm?.checked&&!!pdfInput?.files?.[0];if(submit){submit.disabled=!ok;submit.style.opacity=ok?'1':'.5';}};
  confirm?.addEventListener('change',setSubmit);
  pdfInput?.addEventListener('change',()=>{const f=pdfInput.files?.[0];if(pdfStatus)pdfStatus.textContent=f?`Selected: ${f.name} • ${(f.size/1024/1024).toFixed(2)} MB`:'No PDF selected.';setSubmit();});

  fetchBtn?.addEventListener('click',async()=>{
    const url=urlInput?.value.trim(); if(!url){Toast.show('Please enter the external website URL.','warning');return;}
    fetchBtn.disabled=true;fetchBtn.textContent='Scanning website…';
    const progress=document.getElementById('ext-progress');if(progress)progress.style.display='block';
    const steps=document.getElementById('ext-progress-steps');
    try{
      token=await authToken();
      if(steps)steps.innerHTML='✓ Secure seller session<br>✓ Validating public website<br>✓ Fetching public book metadata';
      const metaRes=await apiFetch('/api/external/import',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({url})});
      const meta=await metaRes.json();if(!metaRes.ok||!meta.success)throw new Error(meta.error||'Metadata fetch failed.');imported=meta.data||{};
      const intRes=await apiFetch('/api/external/integrations',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({websiteUrl:url,websiteName:nameInput?.value.trim()||new URL(url).hostname})});
      const intData=await intRes.json();if(!intRes.ok||!intData.success)throw new Error(intData.error||'Integration creation failed.');integration=intData.integration;
      const scanRes=await apiFetch(`/api/external/integrations/${encodeURIComponent(integration.integrationId)}/scan`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:'{}'});const scan=await scanRes.json();if(!scanRes.ok||!scan.success)throw new Error(scan.error||'Website scan failed.');
      const pagePanel=document.getElementById('ext-pages-panel');if(pagePanel){const pages=scan.pages||[];pagePanel.style.display='block';pagePanel.innerHTML=`<div style="padding:1rem;border:1px solid var(--border-subtle);border-radius:12px;background:#f8fafc"><strong>Discovered ${pages.length} public page(s)</strong><div style="max-height:180px;overflow:auto;margin-top:.6rem;font-size:.78rem;color:#475569">${pages.slice(0,40).map(p=>`<div style="padding:.25rem 0">✓ ${esc(p.title||p.canonicalUrl||p.url)}</div>`).join('')}${pages.length>40?`<div>+ ${pages.length-40} more tracked pages</div>`:''}</div></div>`;}
      const set=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v??'';};set('ext-title',imported.title);set('ext-subtitle',imported.subtitle);set('ext-author',imported.author);set('ext-publisher',imported.publisher);set('ext-price',imported.price);set('ext-currency',imported.currency||'INR');set('ext-pages',imported.pages||0);set('ext-language',imported.language);set('ext-format',imported.format||'PDF');set('ext-isbn',imported.isbn);set('ext-cover-url',imported.cover_url);set('ext-description',imported.description);if(form)form.style.display='block';if(progress)progress.style.display='none';fetchBtn.textContent='Website Scanned ✓';
    }catch(err){if(progress)progress.style.display='none';Toast.show(err.message||'Website scan failed.','error');fetchBtn.disabled=false;fetchBtn.textContent='Scan Website & Fetch Book Information';}
  });

  form?.addEventListener('submit',async e=>{
    e.preventDefault();
    if(!confirm.checked){Toast.show('Please confirm authorization.','warning');return;}
    const pdf=pdfInput.files?.[0];if(!pdf){Toast.show('Please select the fulfillment PDF.','warning');return;}
    submit.disabled=true;submit.textContent='Uploading PDF…';
    try{
      token=await authToken();const pdfData=await fileToBase64(pdf);const authHeaders={'Content-Type':'application/json',Authorization:`Bearer ${token}`};
      const uploadRes=await apiFetch('/api/books/upload-files',{method:'POST',headers:authHeaders,body:JSON.stringify({pdf:{name:pdf.name,mimeType:'application/pdf',data:pdfData}})});const upload=await uploadRes.json();if(!uploadRes.ok||!upload.success)throw new Error(upload.error||'PDF upload failed.');
      submit.textContent='Creating listing…';const price=Number(document.getElementById('ext-price').value);const payload={title:document.getElementById('ext-title').value.trim(),subtitle:document.getElementById('ext-subtitle').value.trim(),author:document.getElementById('ext-author').value.trim(),publisher:document.getElementById('ext-publisher').value.trim(),price,original_price:price,original_currency:document.getElementById('ext-currency').value.trim()||'INR',category:document.getElementById('ext-category').value,language:document.getElementById('ext-language').value.trim(),pages:Number(document.getElementById('ext-pages').value||0),format:document.getElementById('ext-format').value.trim()||'PDF',isbn:document.getElementById('ext-isbn').value.trim(),cover_url:document.getElementById('ext-cover-url').value.trim(),description:document.getElementById('ext-description').value.trim(),source_url:urlInput.value.trim(),canonical_url:imported?.canonical_url||urlInput.value.trim(),source_domain:imported?.source_domain||'',pdf_file_id:upload.pdf_file_id||'',pdf_url:upload.pdf_url||'',rights_confirmed:true};
      const res=await apiFetch('/api/publish/external',{method:'POST',headers:authHeaders,body:JSON.stringify(payload)});const data=await res.json();if(!res.ok||!data.success)throw new Error(data.error||'External listing creation failed.');createdBookId=data.book?.id||'';
      if(integration?.integrationId&&createdBookId){const bind=await apiFetch(`/api/external/integrations/${encodeURIComponent(integration.integrationId)}/bind-book`,{method:'POST',headers:authHeaders,body:JSON.stringify({bookId:createdBookId})});const bd=await bind.json();if(!bind.ok||!bd.success)throw new Error(bd.error||'Could not bind the book to the master integration.');}
      submit.textContent='PDF uploaded • Integration linked';Toast.show('External listing created and linked to the single master integration. Admin approval still applies.','success');
    }catch(err){Toast.show(err.message||'Submission failed.','error');submit.disabled=false;submit.textContent='Upload PDF & Create External Listing';}
  });
}