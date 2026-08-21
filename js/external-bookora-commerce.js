import { state } from './state.js';
import { apiFetch } from './config.js';
import { Toast } from './components/Toast.js';

const STYLE_ID = 'bookora-external-commerce-style';
const BOX_ID = 'bookora-external-fulfillment-box';
let installed = false;
let uploadBusy = false;

function esc(value = '') {
  return String(value).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
}

function addStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .bookora-ext-fulfillment{margin:0 0 1.5rem;padding:1.2rem;border:1px solid #dbe4f0;border-radius:16px;background:linear-gradient(180deg,#fbfdff,#f8fafc)}
    .bookora-ext-fulfillment h3{margin:0 0 6px;font-size:15px;color:#0f172a}.bookora-ext-fulfillment p{margin:0 0 12px;font-size:12px;line-height:1.55;color:#64748b}
    .bookora-ext-file{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px dashed #94a3b8;border-radius:12px;background:#fff;cursor:pointer}.bookora-ext-file:hover{border-color:#2563eb;background:#f8fbff}
    .bookora-ext-file input{display:none}.bookora-ext-file-main{display:flex;align-items:center;gap:10px;min-width:0}.bookora-ext-file-icon{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;background:#eff6ff;color:#2563eb;font-weight:900}.bookora-ext-file-name{font-size:12px;font-weight:800;color:#0f172a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.bookora-ext-file-meta{font-size:10px;color:#94a3b8;margin-top:2px}.bookora-ext-status{margin-top:10px;font-size:11px;font-weight:700;color:#64748b}.bookora-ext-progress{height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;margin-top:8px}.bookora-ext-progress>span{display:block;height:100%;width:0;background:linear-gradient(90deg,#2563eb,#7c3aed);transition:width .2s ease}
    .bookora-external-disclosure{margin-top:12px;padding:10px 12px;border-radius:11px;background:#f5f3ff;border:1px solid #ddd6fe;color:#5b21b6;font-size:11px;line-height:1.5}.bookora-external-disclosure a{font-weight:800;color:#4c1d95}
  `;
  document.head.appendChild(style);
}

function bytes(size) {
  if (!Number.isFinite(size)) return '';
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function getToken() {
  return String(state.token || '').trim();
}

function toBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').split(',', 2)[1] || '');
    reader.onerror = () => reject(reader.error || new Error('Could not read file chunk.'));
    reader.readAsDataURL(blob);
  });
}

async function uploadPdf(file, onProgress) {
  if (!file) throw new Error('Choose a PDF file first.');
  if (file.type && file.type !== 'application/pdf') throw new Error('Only PDF files are accepted.');
  if (file.size <= 0) throw new Error('The selected PDF is empty.');
  if (file.size > 100 * 1024 * 1024) throw new Error('PDF must be 100 MB or smaller.');
  const token = getToken();
  if (!token) throw new Error('Please sign in again before uploading the fulfillment file.');

  const startRes = await apiFetch('/api/books/upload-session/start', {
    method: 'POST', headers: {'Content-Type':'application/json','Authorization':`Bearer ${token}`},
    body: JSON.stringify({name:file.name, mimeType:'application/pdf', size:file.size, kind:'pdf'})
  });
  const start = await startRes.json().catch(() => ({}));
  if (!startRes.ok || !start.success) throw new Error(start.error || 'Could not start the PDF upload.');

  const uploadToken = start.upload_token;
  const chunkSize = Number(start.chunk_size || 4 * 1024 * 1024);
  let offset = Number(start.next_offset || 0);
  let finalFile = null;

  while (offset < file.size) {
    const chunk = file.slice(offset, Math.min(offset + chunkSize, file.size));
    const data = await toBase64(chunk);
    const res = await apiFetch('/api/books/upload-session/chunk', {
      method: 'POST', headers: {'Content-Type':'application/json','Authorization':`Bearer ${token}`},
      body: JSON.stringify({upload_token:uploadToken, offset, data})
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result.success) throw new Error(result.error || 'PDF upload failed.');
    offset = Number(result.next_offset ?? (offset + chunk.size));
    if (result.file) finalFile = result.file;
    onProgress?.(Math.min(100, Math.round((offset / file.size) * 100)));
  }

  if (!finalFile) {
    const statusRes = await apiFetch('/api/books/upload-session/status', {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
      body: JSON.stringify({upload_token:uploadToken})
    });
    const status = await statusRes.json().catch(() => ({}));
    if (!statusRes.ok || !status.success || !status.done || !status.file) throw new Error(status.error || 'PDF upload did not finish.');
    finalFile = status.file;
  }

  const fileId = String(finalFile.pdf_file_id || finalFile.pdfFileId || finalFile.file_id || finalFile.fileId || finalFile.id || '').trim();
  if (!fileId) throw new Error('Upload completed but Bookora did not receive a secure file ID.');
  return {fileId, file:finalFile};
}

function installFulfillmentBox(form) {
  if (!form || form.querySelector(`#${BOX_ID}`)) return;
  addStyles();
  const submit = document.getElementById('ext-submit-btn');
  const box = document.createElement('div');
  box.id = BOX_ID;
  box.className = 'bookora-ext-fulfillment';
  box.innerHTML = `
    <h3>Bookora Digital Fulfillment</h3>
    <p>Upload the authorized PDF that Bookora will securely deliver after a verified Bookora payment. The original sales page is used for public metadata only.</p>
    <label class="bookora-ext-file">
      <input id="bookora-ext-pdf" type="file" accept="application/pdf,.pdf">
      <span class="bookora-ext-file-main"><span class="bookora-ext-file-icon">PDF</span><span><span id="bookora-ext-pdf-name" class="bookora-ext-file-name">Choose authorized PDF</span><span id="bookora-ext-pdf-meta" class="bookora-ext-file-meta">Maximum 100 MB</span></span></span>
      <strong style="font-size:11px;color:#2563eb">Browse</strong>
    </label>
    <div id="bookora-ext-status" class="bookora-ext-status">No fulfillment file selected.</div>
    <div class="bookora-ext-progress"><span id="bookora-ext-progress-bar"></span></div>
  `;
  const legalBox = form.querySelector('#ext-confirm-checkbox')?.closest('div');
  if (legalBox) legalBox.parentNode.insertBefore(box, legalBox);
  else if (submit) form.insertBefore(box, submit);
  else form.appendChild(box);

  const input = box.querySelector('#bookora-ext-pdf');
  input?.addEventListener('change', () => {
    const file = input.files?.[0];
    const name = box.querySelector('#bookora-ext-pdf-name');
    const meta = box.querySelector('#bookora-ext-pdf-meta');
    const status = box.querySelector('#bookora-ext-status');
    if (!file) {
      name.textContent = 'Choose authorized PDF'; meta.textContent = 'Maximum 100 MB'; status.textContent = 'No fulfillment file selected.'; return;
    }
    name.textContent = file.name; meta.textContent = `${bytes(file.size)} • PDF`;
    status.textContent = 'Ready to upload when you submit the listing.';
  });
}

function setStatus(text, percent = 0) {
  const status = document.getElementById('bookora-ext-status');
  const bar = document.getElementById('bookora-ext-progress-bar');
  if (status) status.textContent = text;
  if (bar) bar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
}

async function submitExternalForm(form) {
  if (uploadBusy) return;
  const checkbox = document.getElementById('ext-confirm-checkbox');
  const file = document.getElementById('bookora-ext-pdf')?.files?.[0];
  const submit = document.getElementById('ext-submit-btn');
  const url = document.getElementById('ext-url-input')?.value.trim();
  if (!checkbox?.checked) { Toast.show('Please confirm that you have authorization to sell and distribute this eBook.', 'warning'); return; }
  if (!file) { Toast.show('Please upload the authorized PDF that Bookora will deliver after purchase.', 'warning'); return; }
  if (!url) { Toast.show('Original sales-page URL is required.', 'warning'); return; }

  uploadBusy = true;
  if (submit) { submit.disabled = true; submit.textContent = 'Uploading secure fulfillment file…'; }
  try {
    setStatus('Uploading PDF securely to Bookora storage…', 1);
    const uploaded = await uploadPdf(file, p => setStatus(`Uploading PDF… ${p}%`, p));
    setStatus('Upload complete. Creating your external Bookora listing…', 100);

    const sourceCurrency = document.getElementById('ext-currency')?.value.trim() || 'INR';
    const price = Number(document.getElementById('ext-price')?.value || 0);
    const title = document.getElementById('ext-title')?.value.trim() || '';
    const payload = {
      title,
      subtitle: document.getElementById('ext-subtitle')?.value.trim() || '',
      author: document.getElementById('ext-author')?.value.trim() || '',
      publisher: document.getElementById('ext-publisher')?.value.trim() || '',
      category: document.getElementById('ext-category')?.value || 'Other',
      language: document.getElementById('ext-language')?.value.trim() || 'English',
      pages: 0,
      price,
      original_price: price,
      original_currency: sourceCurrency,
      source_currency: sourceCurrency,
      cover_url: document.getElementById('ext-cover-url')?.value.trim() || '',
      description: document.getElementById('ext-description')?.value.trim() || '',
      source_url: url,
      canonical_url: url,
      pdf_file_id: uploaded.fileId,
      rights_confirmed: true
    };

    const res = await apiFetch('/api/publish/external', {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${getToken()}`}, body:JSON.stringify(payload)
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result.success) throw new Error(result.error || 'External listing could not be created.');

    Toast.show(result.book?.status === 'approved' ? 'External eBook is now live on Bookora.' : 'External eBook submitted for admin moderation.', 'success');
    window.location.hash = result.book?.status === 'approved' ? `#/book/${encodeURIComponent(result.book.slug)}` : '#/creator/dashboard';
  } catch (error) {
    console.error('Bookora external listing failed:', error);
    setStatus(error?.message || 'Upload failed.', 0);
    Toast.show(error?.message || 'External listing failed. Please try again.', 'error');
    if (submit) { submit.disabled = false; submit.textContent = 'Submit External Listing for Moderation Review'; }
  } finally {
    uploadBusy = false;
  }
}

function interceptExternalSubmit(event) {
  const form = event.target instanceof HTMLFormElement ? event.target : null;
  if (!form || form.id !== 'ext-submit-form') return;
  event.preventDefault();
  event.stopImmediatePropagation();
  submitExternalForm(form);
}

function enhanceExternalBookDetailClicks(event) {
  const target = event.target instanceof Element ? event.target.closest('a,button') : null;
  const page = document.querySelector('.bd-page[data-book-id]');
  if (!target || !page) return;
  const bookId = page.dataset.bookId;
  const book = state.getApprovedBooks().find(b => String(b.id) === String(bookId)) || state.getBookBySlug((window.location.hash.split('/book/')[1] || '').split('?')[0]);
  if (!book || !book.external_imported || !book.bookora_sale_enabled || !book.bookora_fulfillment_enabled) return;
  if (!target.closest('.bd-purchase')) return;
  const href = target.getAttribute('href') || '';
  if (href.startsWith('http') || href.includes('source_url') || target.id === 'external-buy-missing') {
    event.preventDefault(); event.stopImmediatePropagation();
    window.location.hash = `#/checkout/${encodeURIComponent(book.slug || book.id)}`;
  }
}

function observe() {
  addStyles();
  const observer = new MutationObserver(() => {
    const form = document.getElementById('ext-submit-form');
    if (form) installFulfillmentBox(form);
  });
  observer.observe(document.documentElement, {subtree:true, childList:true});
  const existing = document.getElementById('ext-submit-form');
  if (existing) installFulfillmentBox(existing);
}

if (!installed) {
  installed = true;
  document.addEventListener('submit', interceptExternalSubmit, true);
  document.addEventListener('click', enhanceExternalBookDetailClicks, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe, {once:true}); else observe();
}
