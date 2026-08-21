import { apiFetch } from '../config.js';
import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';
import { formatPrice } from '../utils/formatters.js';
import { Toast } from '../components/Toast.js';

const esc = (v='') => String(v).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

export function renderPublishExternalPage() {
  updateSEO({ title: 'Add an External eBook Listing', description: 'Import real metadata, upload the authorized PDF and verify your external sales website before publishing.' });
  const categories = Array.isArray(state.categories) ? state.categories : [];
  return `
  <div class="publish-external-page animate-fade-in" style="background:var(--bg-secondary);min-height:85vh;padding:3rem 0 5rem">
    <div class="container" style="max-width:900px">
      <div style="text-align:center;margin-bottom:2rem">
        <div class="badge badge-external">EXTERNAL EBOOK • VERIFIED INTEGRATION</div>
        <h1 style="font-family:var(--font-display);font-size:2.35rem;font-weight:800;color:var(--text-primary);margin:.6rem 0">Add an eBook From Another Website</h1>
        <p style="color:var(--text-secondary);max-width:680px;margin:auto">Fetch the public book details, upload the authorized PDF that Bookora will protect and deliver, then verify that your external website contains the Bookora integration code.</p>
      </div>

      <div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:2rem;box-shadow:var(--shadow-sm)">
        <label style="display:block;font-weight:700;margin-bottom:.45rem">Original eBook Sales Page URL *</label>
        <div style="display:flex;gap:.7rem;flex-wrap:wrap">
          <input id="ext-url-input" type="url" placeholder="https://yourwebsite.com/ebook" style="flex:1;min-width:260px;padding:.8rem 1rem;border:1px solid var(--border-medium);border-radius:var(--radius-md)" />
          <button id="ext-fetch-btn" type="button" class="btn btn-primary">Fetch Book Information</button>
        </div>
        <div style="font-size:.75rem;color:var(--text-muted);margin-top:.4rem">Server-side SSRF protection. Only public HTTP/HTTPS pages are fetched.</div>

        <div id="ext-progress" style="display:none;margin-top:1.25rem;padding:1rem;border:1px solid var(--border-subtle);border-radius:var(--radius-lg);background:#f8fafc">
          <strong id="ext-progress-label">Fetching metadata…</strong>
          <div id="ext-progress-steps" style="margin-top:.6rem;font-size:.82rem;color:var(--text-secondary);line-height:1.8"></div>
        </div>

        <form id="ext-submit-form" style="display:none;margin-top:1.5rem">
          <div id="ext-import-banner" style="padding:1rem;border-radius:var(--radius-lg);background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;margin-bottom:1.25rem">Real public metadata imported. Review it before submitting.</div>

          <div style="margin-bottom:1rem"><label style="font-weight:600">Title *</label><input id="ext-title" required class="form-control" style="width:100%;padding:.7rem;margin-top:.3rem;border:1px solid var(--border-medium);border-radius:var(--radius-md)" /></div>
          <div style="margin-bottom:1rem"><label style="font-weight:600">Subtitle</label><input id="ext-subtitle" class="form-control" style="width:100%;padding:.7rem;margin-top:.3rem;border:1px solid var(--border-medium);border-radius:var(--radius-md)" /></div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem">
            <div><label style="font-weight:600">Author *</label><input id="ext-author" required style="width:100%;padding:.7rem;margin-top:.3rem;border:1px solid var(--border-medium);border-radius:var(--radius-md)" /></div>
            <div><label style="font-weight:600">Publisher / Platform</label><input id="ext-publisher" style="width:100%;padding:.7rem;margin-top:.3rem;border:1px solid var(--border-medium);border-radius:var(--radius-md)" /></div>
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
            <p style="font-size:.8rem;color:var(--text-secondary);margin:.35rem 0 .7rem">Upload the authorized PDF that the buyer will access from Bookora Library after the external payment is verified. The original website's private/paid PDF is never scraped.</p>
            <input id="ext-pdf" type="file" accept="application/pdf,.pdf" required />
            <div id="ext-pdf-status" style="font-size:.82rem;margin-top:.5rem;color:var(--text-secondary)">No PDF selected.</div>
          </div>

          <div style="padding:1.25rem;border:1px solid #bfdbfe;border-radius:var(--radius-lg);background:#eff6ff;margin-bottom:1rem">
            <strong>Website verification is required</strong>
            <p style="font-size:.82rem;color:#334155;margin:.35rem 0">After you submit, Bookora gives you a unique script. You may place that script <strong>anywhere in the external website HTML</strong> (header, body, footer, or template). Bookora will fetch the public page and verify that the exact code is present. Until verified, the external book stays hidden.</p>
            <div id="ext-integration-panel" style="display:none;margin-top:1rem"></div>
          </div>

          <label style="display:flex;gap:.7rem;align-items:flex-start;margin-bottom:1.2rem;cursor:pointer">
            <input id="ext-confirm-checkbox" type="checkbox" style="margin-top:4px;width:18px;height:18px" />
            <span style="font-size:.86rem;font-weight:600">I confirm I own or am authorized to sell/promote this eBook, upload this fulfillment PDF, and use the external sales website.</span>
          </label>

          <button id="ext-submit-btn" type="submit" class="btn btn-primary" disabled style="width:100%;padding:.9rem;opacity:.5">Upload PDF & Submit External Listing</button>
        </form>
      </div>
    </div>
  `;
}

function fileToDataUrl(file) {
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||''));
    reader.onerror=()=>reject(reader.error||new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

export function initPublishExternalEvents() {
  const fetchBtn=document.getElementById('ext-fetch-btn');
  const urlInput=document.getElementById('ext-url-input');
  const form=document.getElementById('ext-submit-form');
  const confirm=document.getElementById('ext-confirm-checkbox');
  const submit=document.getElementById('ext-submit-btn');
  const pdfInput=document.getElementById('ext-pdf');
  const pdfStatus=document.getElementById('ext-pdf-status');
  let imported=null;
  let createdBookId='';

  const setSubmit=()=>{ const ok=!!confirm?.checked && !!pdfInput?.files?.[0]; if(submit){submit.disabled=!ok;submit.style.opacity=ok?'1':'.5';} };
  confirm?.addEventListener('change',setSubmit);
  pdfInput?.addEventListener('change',()=>{const f=pdfInput.files?.[0]; if(pdfStatus) pdfStatus.textContent=f?`Selected: ${f.name} • ${(f.size/1024/1024).toFixed(2)} MB`:'No PDF selected.';setSubmit();});

  fetchBtn?.addEventListener('click',async()=>{
    const url=urlInput?.value.trim();
    if(!url){Toast.show('Please enter the external sales page URL.','warning');return;}
    const progress=document.getElementById('ext-progress');
    if(progress)progress.style.display='block';
    try{
      const res=await apiFetch('/api/external/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})});
      const result=await res.json();
      if(!res.ok||!result.success)throw new Error(result.error||'Metadata fetch failed.');
      imported=result.data||{};
      const set=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v??'';};
      set('ext-title',imported.title);set('ext-subtitle',imported.subtitle);set('ext-author',imported.author);set('ext-publisher',imported.publisher);set('ext-price',imported.price||'');set('ext-currency',imported.source_currency||'INR');set('ext-pages',imported.pages||'');set('ext-language',imported.language||'English');set('ext-format',imported.format||'PDF');set('ext-isbn',imported.isbn||'');set('ext-cover-url',imported.cover_url||'');set('ext-description',imported.description||'');
      const cat=document.getElementById('ext-category');if(cat&&imported.category){const opt=[...cat.options].find(o=>o.value.toLowerCase()===String(imported.category).toLowerCase());if(opt)cat.value=opt.value;}
      if(progress)progress.style.display='none';
      if(form)form.style.display='block';
      Toast.show('Complete public metadata fetched. Review and upload the authorized PDF.','success');
    }catch(err){if(progress)progress.style.display='none';Toast.show(err.message||'Could not fetch metadata.','error');}
  });

  form?.addEventListener('submit',async e=>{
    e.preventDefault();
    const pdf=pdfInput?.files?.[0];
    if(!state.token){Toast.show('Please sign in before submitting.','warning');return;}
    if(!pdf||pdf.type!=='application/pdf'){Toast.show('Please select a valid PDF file.','warning');return;}
    if(!confirm.checked){Toast.show('Please confirm authorization.','warning');return;}
    submit.disabled=true;submit.textContent='Uploading PDF…';
    try{
      const pdfData=await fileToDataUrl(pdf);
      const uploadRes=await apiFetch('/api/books/upload-files',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${state.token}`},body:JSON.stringify({pdf:{name:pdf.name,mimeType:'application/pdf',data:pdfData}})});
      const upload=await uploadRes.json();
      if(!uploadRes.ok||!upload.success)throw new Error(upload.error||'PDF upload failed.');
      submit.textContent='Creating listing…';
      const payload={title:document.getElementById('ext-title').value.trim(),subtitle:document.getElementById('ext-subtitle').value.trim(),author:document.getElementById('ext-author').value.trim(),publisher:document.getElementById('ext-publisher').value.trim(),price:Number(document.getElementById('ext-price').value),original_price:Number(document.getElementById('ext-price').value),original_currency:document.getElementById('ext-currency').value.trim()||'INR',category:document.getElementById('ext-category').value,language:document.getElementById('ext-language').value.trim(),pages:Number(document.getElementById('ext-pages').value||0),format:document.getElementById('ext-format').value.trim()||'PDF',isbn:document.getElementById('ext-isbn').value.trim(),cover_url:document.getElementById('ext-cover-url').value.trim(),description:document.getElementById('ext-description').value.trim(),source_url:urlInput.value.trim(),canonical_url:imported?.canonical_url||urlInput.value.trim(),source_domain:imported?.source_domain||'',pdf_file_id:upload.pdf_file_id||'',pdf_url:upload.pdf_url||''};
      const res=await apiFetch('/api/publish/external',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${state.token}`},body:JSON.stringify(payload)});
      const data=await res.json();
      if(!res.ok||!data.success)throw new Error(data.error||'External listing creation failed.');
      createdBookId=data.book?.id||'';
      const integration=data.integration||{};
      const panel=document.getElementById('ext-integration-panel');
      if(panel){panel.style.display='block';panel.innerHTML=`<div style="background:#fff;border:1px solid #93c5fd;border-radius:12px;padding:1rem"><div style="font-weight:800;color:#1e40af">Step 2 — Add this code anywhere on your external website</div><textarea id="ext-code-box" readonly rows="3" style="width:100%;margin-top:.6rem;padding:.7rem;font-family:monospace;font-size:.78rem;border:1px solid #cbd5e1;border-radius:8px">${esc(integration.header_code||'')}</textarea><button type="button" id="ext-copy-code" class="btn" style="margin-top:.6rem">Copy Code</button><button type="button" id="ext-verify-site" class="btn btn-primary" style="margin-top:.6rem;margin-left:.5rem">Verify Website</button><div id="ext-verify-result" style="margin-top:.7rem;font-size:.82rem;color:#475569">Listing is hidden until verification succeeds.</div></div>`;
        document.getElementById('ext-copy-code')?.addEventListener('click',async()=>{await navigator.clipboard?.writeText(integration.header_code||'');Toast.show('Verification code copied.','success');});
        document.getElementById('ext-verify-site')?.addEventListener('click',async()=>{
          const btn=document.getElementById('ext-verify-site');const out=document.getElementById('ext-verify-result');btn.disabled=true;btn.textContent='Checking website…';
          try{const vr=await apiFetch('/api/external/integration/verify',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${state.token}`},body:JSON.stringify({book_id:createdBookId})});const vd=await vr.json();if(!vr.ok||!vd.verified)throw new Error(vd.error||'Verification failed.');out.textContent='✓ Website verified. The listing can now proceed to Admin moderation. The buyer will pay on the external site and receive Bookora Library access only after verified seller-server payment confirmation.';out.style.color='#166534';Toast.show('External website verified successfully.','success');}catch(err){out.textContent='✗ '+(err.message||'Verification failed.');out.style.color='#b91c1c';}finally{btn.disabled=false;btn.textContent='Verify Website';}
        });
      }
      submit.textContent='PDF uploaded • Listing created';
      Toast.show('Listing created. Add the code to your external website and verify it.','success');
    }catch(err){Toast.show(err.message||'Submission failed.','error');submit.disabled=false;submit.textContent='Upload PDF & Submit External Listing';}
  });
}
