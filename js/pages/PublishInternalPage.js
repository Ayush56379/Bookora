import { state } from '../state.js';
import { apiFetch } from '../config.js';
import { updateSEO } from '../utils/seo.js';
import { formatPrice } from '../utils/formatters.js';
import { Toast } from '../components/Toast.js';

const DEFAULT_MAX_PDF_MB = 100;
const MAX_ADMIN_PDF_MB = 100;
const MAX_COVER_MB = 5;
const PDFJS_VERSION = '3.11.174';
const UPLOAD_RETRIES = 4;
const REQUEST_TIMEOUT_MS = 240000;

let selectedPDF = null;
let selectedCover = null;
let pdfPageDetectionPromise = null;
let uploadConfig = { maxPdfMb: DEFAULT_MAX_PDF_MB };

const esc = value => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/\"/g, '&quot;').replace(/'/g, '&#039;');

function getValue(id, fallback = '') { return document.getElementById(id)?.value?.trim() || fallback; }
function getNumber(id, fallback = 0) { const value = Number(document.getElementById(id)?.value); return Number.isFinite(value) ? value : fallback; }
function authHeaders() { return { Authorization: `Bearer ${state.token}` }; }

// FIRESTORE_AUTH_RETRY_PATCH_V2
// Firebase Auth can finish restoring the session slightly after the publish
// wizard is rendered. Wait for the real Firebase user before writing metadata.
async function waitForFirebaseUser(timeoutMs = 15000) {
  const auth = window.firebase?.auth?.();
  if (!auth) return null;
  const immediate = auth.currentUser;
  if (immediate) return immediate;
  return await new Promise(resolve => {
    let settled = false;
    let unsubscribe = null;
    const finish = user => {
      if (settled) return;
      settled = true;
      try { unsubscribe?.(); } catch (_) {}
      resolve(user || null);
    };
    try { unsubscribe = auth.onAuthStateChanged(finish); } catch (_) { finish(null); return; }
    setTimeout(() => finish(auth.currentUser || null), timeoutMs);
  });
}

// Firestore is the permanent source of truth for book metadata. Google Drive
// stores only the binary PDF and cover; this write contains metadata plus the
// Drive references, never the binary file contents.
async function persistBookMetadataToFirestore(book, input) {
  const firestoreSdk = window.firebase;
  if (!firestoreSdk?.firestore) throw new Error('Firebase Firestore is not available. The book was uploaded, but its metadata could not be saved.');

  const authUser = await waitForFirebaseUser();
  if (!authUser) throw new Error('Firebase authentication is not ready. The book was uploaded, but its metadata could not be saved. Please retry once the session finishes loading.');

  const db = firestoreSdk.firestore();
  const bookId = String(book?.id || book?.bookId || '').trim();
  if (!bookId) throw new Error('The server did not return a stable book ID, so the Firestore record cannot be created.');

  const now = new Date().toISOString();
  const safe = value => value === undefined || value === null ? '' : value;
  const tags = Array.isArray(input.tags) ? input.tags : [];
  const metadata = {
    id: bookId,
    bookId,
    slug: safe(book.slug || input.slug || bookId),
    title: safe(input.title || book.title),
    subtitle: safe(input.subtitle || book.subtitle),
    author: safe(input.author || book.author),
    description: safe(input.description || book.description),
    category: safe(input.category || book.category || 'Other'),
    categoryId: safe(book.category_id || book.categoryId || ''),
    tags,
    pages: Number(input.pages || book.pages || 0),
    format: 'PDF',
    language: safe(book.language || 'English'),
    price: Number(input.price || book.price || 0),
    salePrice: input.sale_price === null || input.sale_price === undefined ? (book.salePrice ?? book.sale_price ?? null) : input.sale_price,
    sale_price: input.sale_price === null || input.sale_price === undefined ? (book.sale_price ?? null) : input.sale_price,
    coverUrl: safe(input.cover_url || book.cover_url || book.coverUrl),
    cover_url: safe(input.cover_url || book.cover_url || book.coverUrl),
    coverDriveFileId: safe(input.cover_file_id || book.cover_file_id || book.coverFileId),
    coverFileId: safe(input.cover_file_id || book.cover_file_id || book.coverFileId),
    cover_file_id: safe(input.cover_file_id || book.cover_file_id || book.coverFileId),
    pdfUrl: safe(input.pdf_url || book.pdf_url || book.pdfUrl),
    pdf_url: safe(input.pdf_url || book.pdf_url || book.pdfUrl),
    driveFileId: safe(input.pdf_file_id || book.pdf_file_id || book.pdfFileId || book.driveFileId),
    pdfFileId: safe(input.pdf_file_id || book.pdf_file_id || book.pdfFileId || book.driveFileId),
    pdf_file_id: safe(input.pdf_file_id || book.pdf_file_id || book.pdfFileId || book.driveFileId),
    sourceType: 'internal',
    source_type: 'internal',
    creatorId: safe(book.creator_id || book.creatorId || state.currentUser?.id),
    creator_id: safe(book.creator_id || book.creatorId || state.currentUser?.id),
    creatorUid: authUser.uid,
    firebaseUid: authUser.uid,
    sellerId: safe(book.seller_id || book.sellerId || book.creator_id || state.currentUser?.id),
    seller_id: safe(book.seller_id || book.sellerId || book.creator_id || state.currentUser?.id),
    sellerName: safe(book.seller_name || book.sellerName || input.author),
    seller_name: safe(book.seller_name || book.sellerName || input.author),
    status: 'pending',
    isFeatured: false,
    is_featured: false,
    isTrending: false,
    is_trending: false,
    isBestseller: false,
    is_bestseller: false,
    isNew: true,
    is_new: true,
    rating: Number(book.rating || 0),
    reviewCount: Number(book.review_count || book.reviewCount || 0),
    review_count: Number(book.review_count || book.reviewCount || 0),
    createdAt: book.createdAt || book.created_at || now,
    created_at: book.created_at || book.createdAt || now,
    updatedAt: now,
    updated_at: now,
    backendBookId: bookId,
    backendSynced: true,
    metadataSource: 'firestore',
    driveStorage: 'files-only'
  };

  const ref = db.collection('books').doc(bookId);
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await ref.set(metadata, { merge: true });
      // A successful Firestore set() is the authoritative write acknowledgement.
      // Do not require a follow-up read: creator rules may permit writes while
      // restricting reads, and that used to incorrectly turn a successful write
      // into a failed upload. Admin/public readers can read the same document.
      return { id: bookId, ...metadata };
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 800 * attempt));
    }
  }
  throw new Error(`Firebase could not save the book metadata: ${lastError?.message || 'permission or network error'}`);
}

async function loadUploadConfig() {
  const local = Number(state.settings?.books_config?.max_pdf_size_mb);
  if (Number.isFinite(local) && local > 0) uploadConfig.maxPdfMb = Math.min(MAX_ADMIN_PDF_MB, Math.max(1, Math.floor(local)));
  try {
    const response = await apiFetch('/api/settings/public');
    if (response.ok) {
      const data = await response.json();
      const remote = Number(data?.books_config?.max_pdf_size_mb);
      if (Number.isFinite(remote) && remote > 0) uploadConfig.maxPdfMb = Math.min(MAX_ADMIN_PDF_MB, Math.max(1, Math.floor(remote)));
    }
  } catch (error) { console.warn('Upload limit refresh skipped:', error); }
  updateUploadLimitLabels();
  return uploadConfig;
}

function updateUploadLimitLabels() {
  const label = `${uploadConfig.maxPdfMb} MB`;
  const text = document.getElementById('pdf-limit-text');
  const status = document.getElementById('pdf-limit-status');
  if (text) text.textContent = `PDF only · Maximum ${label}`;
  if (status) status.textContent = `Admin-configured limit: ${label}`;
}

async function validatePdfSignature(file) {
  if (!file) return false;
  try {
    const bytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    return String.fromCharCode(...bytes) === '%PDF-';
  } catch (_) { return false; }
}

function validateStep1() {
  const title = getValue('pub-title');
  const author = getValue('pub-author');
  const category = getValue('pub-category');
  const description = getValue('pub-description');
  if (title.length < 3) { Toast.show('Please enter a valid eBook title.', 'warning'); document.getElementById('pub-title')?.focus(); return false; }
  if (!author) { Toast.show('Please enter the author name.', 'warning'); document.getElementById('pub-author')?.focus(); return false; }
  if (!category) { Toast.show('Please select a category.', 'warning'); document.getElementById('pub-category')?.focus(); return false; }
  if (description.length < 20) { Toast.show('Description must contain at least 20 characters.', 'warning'); document.getElementById('pub-description')?.focus(); return false; }
  return true;
}

function validateStep2() {
  if (!selectedPDF) { Toast.show('Please select your PDF eBook.', 'warning'); return false; }
  if (selectedPDF.size > uploadConfig.maxPdfMb * 1024 * 1024) { Toast.show(`PDF must be ${uploadConfig.maxPdfMb} MB or smaller.`, 'warning'); return false; }
  if (!selectedPDF.name.toLowerCase().endsWith('.pdf') && selectedPDF.type !== 'application/pdf') { Toast.show('Only PDF files are supported.', 'warning'); return false; }
  if (!selectedCover) { Toast.show('Please select the eBook cover image.', 'warning'); return false; }
  if (selectedCover.size > MAX_COVER_MB * 1024 * 1024) { Toast.show(`Cover must be ${MAX_COVER_MB} MB or smaller.`, 'warning'); return false; }
  const pages = getNumber('pub-pages');
  if (!pages || pages < 1) { Toast.show('PDF page count is required. Click Detect Pages or enter it manually.', 'warning'); return false; }
  return true;
}

function validateStep3() {
  const price = getNumber('pub-price');
  const saleRaw = document.getElementById('pub-saleprice')?.value?.trim() || '';
  const sale = saleRaw === '' ? 0 : Number(saleRaw);
  if (!price || price <= 0) { Toast.show('Please enter a valid list price.', 'warning'); return false; }
  if (!Number.isFinite(sale) || sale < 0) { Toast.show('Please enter a valid sale price or leave it blank.', 'warning'); return false; }
  if (sale > price) { Toast.show('Sale price cannot be higher than the list price.', 'warning'); return false; }
  return true;
}

async function loadPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib;
  if (pdfPageDetectionPromise) return pdfPageDetectionPromise;
  pdfPageDetectionPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-bookora-pdfjs]');
    if (existing) {
      const wait = () => { if (window.pdfjsLib) resolve(window.pdfjsLib); else if (existing.dataset.failed === '1') reject(new Error('PDF.js failed to load.')); else setTimeout(wait, 50); };
      wait(); return;
    }
    const script = document.createElement('script');
    script.src = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
    script.async = true; script.dataset.bookoraPdfjs = '1';
    script.onload = () => {
      if (!window.pdfjsLib) { script.dataset.failed = '1'; reject(new Error('PDF.js loaded without the PDF library.')); return; }
      try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`; } catch (_) {}
      resolve(window.pdfjsLib);
    };
    script.onerror = () => { script.dataset.failed = '1'; reject(new Error('PDF page detector could not be loaded.')); };
    document.head.appendChild(script);
  }).catch(error => { pdfPageDetectionPromise = null; throw error; });
  return pdfPageDetectionPromise;
}

async function detectPages(file) {
  if (!file) return null;
  let objectUrl = '';
  try {
    const pdfjs = await loadPdfJs();
    objectUrl = URL.createObjectURL(file);
    const pdf = await pdfjs.getDocument({ url: objectUrl, disableAutoFetch: false, disableStream: false }).promise;
    return Number(pdf.numPages) || null;
  } catch (error) {
    console.warn('PDF page detection failed:', error);
    return null;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

async function detectAndSetPages() {
  if (!selectedPDF) { Toast.show('Select the PDF first.', 'warning'); return false; }
  const button = document.getElementById('detect-pages-btn'); const input = document.getElementById('pub-pages');
  if (button) { button.disabled = true; button.textContent = 'Detecting...'; }
  try {
    const pages = await detectPages(selectedPDF);
    if (!pages) { Toast.show('Automatic page detection failed. Please enter the PDF page count manually.', 'warning'); input?.focus(); return false; }
    if (input) input.value = String(pages);
    Toast.show(`${pages} PDF pages detected.`, 'success'); return true;
  } finally { if (button) { button.disabled = false; button.textContent = 'Detect Pages'; } }
}

function updateFilesUI() {
  const pdfName = document.getElementById('pdf-file-name'); const pdfStatus = document.getElementById('pdf-status');
  const coverName = document.getElementById('cover-file-name'); const coverStatus = document.getElementById('cover-status');
  if (pdfName) pdfName.textContent = selectedPDF ? selectedPDF.name : 'No PDF selected';
  if (pdfStatus) pdfStatus.textContent = selectedPDF ? `${(selectedPDF.size / 1048576).toFixed(2)} MB` : 'Required';
  if (coverName) coverName.textContent = selectedCover ? selectedCover.name : 'No cover selected';
  if (coverStatus) coverStatus.textContent = selectedCover ? `${(selectedCover.size / 1048576).toFixed(2)} MB` : 'Required';
  updateUploadLimitLabels();
}

function updateRoyalty() {
  const listPrice = getNumber('pub-price'); const saleRaw = document.getElementById('pub-saleprice')?.value?.trim() || '';
  const effectivePrice = saleRaw === '' ? listPrice : Number(saleRaw); const pct = Number(window.BOOKORA_MARKETPLACE?.sellerCommissionPct ?? 85);
  const royaltyPct = Number.isFinite(pct) ? pct : 85; const royalty = effectivePrice * royaltyPct / 100;
  const out = document.getElementById('pub-royalty-calc'); const label = document.getElementById('pub-royalty-label');
  if (label) label.textContent = `Estimated Author Royalty: ${royaltyPct}%`; if (out) out.textContent = `${formatPrice(royalty)} per sale`;
}

function updatePreview() {
  const title = getValue('pub-title', 'Untitled eBook'); const author = getValue('pub-author', 'Author'); const pages = getValue('pub-pages', '—');
  const listPrice = getNumber('pub-price'); const saleRaw = document.getElementById('pub-saleprice')?.value?.trim() || ''; const price = saleRaw === '' ? listPrice : Number(saleRaw);
  document.getElementById('preview-title')?.replaceChildren(document.createTextNode(title));
  document.getElementById('preview-author')?.replaceChildren(document.createTextNode(`by ${author}`));
  document.getElementById('preview-pages')?.replaceChildren(document.createTextNode(`Pages: ${pages}`));
  document.getElementById('preview-price')?.replaceChildren(document.createTextNode(formatPrice(price)));
  const box = document.getElementById('preview-cover-box');
  if (box && selectedCover) { if (box.dataset.url) URL.revokeObjectURL(box.dataset.url); const url = URL.createObjectURL(selectedCover); box.dataset.url = url; box.style.background = `url(\"${url}\") center/cover no-repeat`; }
}

function showStep(step) {
  const targetStep = Math.max(1, Math.min(5, Number(step) || 1));
  document.querySelectorAll('.wizard-section').forEach(section => { section.style.display = section.id === `step-${targetStep}` ? 'block' : 'none'; });
  document.querySelectorAll('.wizard-step-node').forEach(node => {
    const number = Number(node.dataset.step); const circle = node.querySelector('.step-num'); const title = node.querySelector('.step-title'); if (!circle || !title) return;
    if (number === targetStep) { circle.style.background = 'var(--accent)'; circle.style.color = '#fff'; circle.style.borderColor = 'var(--accent)'; title.style.color = 'var(--accent)'; }
    else if (number < targetStep) { circle.style.background = '#ECFDF5'; circle.style.color = '#059669'; circle.style.borderColor = '#059669'; title.style.color = '#059669'; }
    else { circle.style.background = '#fff'; circle.style.color = 'var(--text-muted)'; circle.style.borderColor = 'var(--border-medium)'; title.style.color = 'var(--text-muted)'; }
  });
  if (targetStep === 3) updateRoyalty(); if (targetStep === 4) requestAnimationFrame(updatePreview); window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setSubmitProgress(text, percent = null) {
  const button = document.getElementById('submit-pub-btn'); const label = document.getElementById('upload-progress-label'); const fill = document.getElementById('upload-progress-fill');
  if (button) button.textContent = text; if (label && percent !== null) label.textContent = `${text} ${Math.round(percent)}%`; if (fill && percent !== null) fill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
}

function base64FromArrayBuffer(buffer) {
  const bytes = new Uint8Array(buffer); const step = 0x8000; let binary = '';
  for (let i = 0; i < bytes.length; i += step) binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + step, bytes.length)));
  return btoa(binary);
}

function uploadKey(file, kind) { return `bookora_upload_${kind}_${file.name}_${file.size}_${file.lastModified}`; }

async function requestJson(endpoint, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const requestOptions = { ...options, signal: options?.signal || controller.signal };
    const response = await apiFetch(endpoint, requestOptions); let data = {};
    try { data = await response.json(); } catch (_) {}
    if (!response.ok || !data.success) { const error = new Error(data.error || `Request failed (${response.status}).`); error.status = response.status; error.data = data; throw error; }
    return data;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('The upload server took too long to respond. Please retry; resumable upload will continue from the last confirmed chunk.');
    throw error;
  } finally { clearTimeout(timeout); }
}

async function startUpload(file, kind) {
  const data = await requestJson('/api/books/upload-session/start', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ name: file.name, mimeType: kind === 'pdf' ? 'application/pdf' : file.type, size: file.size, kind }) });
  if (!data.upload_token) throw new Error('Upload server did not create a resumable session.');
  return { token: data.upload_token, chunkSize: Math.max(256 * 1024, Number(data.chunk_size) || 2 * 1024 * 1024), offset: Number(data.next_offset) || 0 };
}

async function uploadFileResumable(file, kind, onProgress) {
  const storageKey = uploadKey(file, kind); let cachedState = null;
  try { const cached = sessionStorage.getItem(storageKey); if (cached) cachedState = JSON.parse(cached); } catch (_) {}
  let session = cachedState?.token ? { token: cachedState.token, chunkSize: Number(cachedState.chunkSize) || 2 * 1024 * 1024, offset: 0, resumed: true } : null;
  let restartCount = 0;

  while (restartCount <= 2) {
    try {
      if (!session) session = await startUpload(file, kind);
      if (session.resumed) {
        const status = await requestJson('/api/books/upload-session/status', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ upload_token: session.token }) });
        session.offset = Math.max(0, Math.min(file.size, Number(status.next_offset) || 0));
        if (status.done && status.file) { sessionStorage.removeItem(storageKey); return status.file; }
        session.resumed = false;
      } else {
        session.offset = 0;
      }
      onProgress(session.offset / file.size);

      while (session.offset < file.size) {
        const start = session.offset; const end = Math.min(file.size, start + session.chunkSize); const chunk = await file.slice(start, end).arrayBuffer(); const data = base64FromArrayBuffer(chunk);
        let completed = false;
        for (let attempt = 1; attempt <= UPLOAD_RETRIES && !completed; attempt += 1) {
          try {
            const response = await requestJson('/api/books/upload-session/chunk', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ upload_token: session.token, offset: start, data }) });
            const next = Number(response.next_offset);
            if (!Number.isFinite(next) || next <= start || next > file.size) throw new Error('Server returned an invalid upload offset.');
            session.offset = next; completed = true;
            sessionStorage.setItem(storageKey, JSON.stringify({ token: session.token, chunkSize: session.chunkSize, offset: session.offset }));
            onProgress(session.offset / file.size);
          } catch (error) {
            if (error.status === 409 && Number(error.data?.next_offset) >= 0) { session.offset = Math.min(file.size, Number(error.data.next_offset)); completed = true; onProgress(session.offset / file.size); break; }
            if (error.status === 410) throw error;
            if (attempt >= UPLOAD_RETRIES) throw error;
            await new Promise(resolve => setTimeout(resolve, Math.min(5000, 700 * attempt)));
          }
        }
      }

      const finalStatus = await requestJson('/api/books/upload-session/status', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ upload_token: session.token }) });
      if (!finalStatus.done || !finalStatus.file) throw new Error('Upload finished without a Google Drive file reference.');
      sessionStorage.removeItem(storageKey); onProgress(1); return finalStatus.file;
    } catch (error) {
      if (error.status === 410 && restartCount < 2) { session = null; restartCount += 1; try { sessionStorage.removeItem(storageKey); } catch (_) {} continue; }
      throw error;
    }
  }
  throw new Error('Upload session could not be recovered. Please try again.');
}

export function renderPublishInternalPage() {
  updateSEO({ title: 'Publish an eBook on Bookora', description: 'Publish your digital eBook on Bookora.' });
  const categories = Array.isArray(state.categories) ? state.categories : [];
  return `<div class="publish-page" style="background:var(--bg-secondary);min-height:85vh;padding:2rem 0 5rem;"><div class="container" style="max-width:900px;"><div style="text-align:center;margin-bottom:2rem;"><div class="badge badge-bookora" style="margin-bottom:.5rem;">Author Studio</div><h1>Publish Your eBook</h1><p style="color:var(--text-secondary);">Complete the steps below to publish your eBook.</p></div>
  <div style="display:flex;gap:.35rem;justify-content:space-between;margin-bottom:2rem;">${['Info','Files','Pricing','Preview','Submit'].map((step,index)=>`<div class="wizard-step-node" data-step="${index+1}" style="text-align:center;flex:1;"><div class="step-num" style="width:36px;height:36px;border-radius:50%;background:${index===0?'var(--accent)':'#fff'};color:${index===0?'#fff':'var(--text-muted)'};border:2px solid ${index===0?'var(--accent)':'var(--border-medium)'};display:flex;align-items:center;justify-content:center;font-weight:700;margin:auto;">${index+1}</div><span class="step-title" style="font-size:.72rem;font-weight:600;">${index+1}. ${step}</span></div>`).join('')}</div>
  <div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:clamp(1rem,4vw,2.5rem);box-shadow:var(--shadow-sm);"><form id="publish-wizard-form">
    <section id="step-1" class="wizard-section"><h3>Step 1: Book Information</h3><label>eBook Title *</label><input id="pub-title" required placeholder="Enter your book title" style="width:100%;padding:.75rem;margin:.4rem 0 1rem;"><label>Subtitle</label><input id="pub-subtitle" placeholder="Optional subtitle" style="width:100%;padding:.75rem;margin:.4rem 0 1rem;"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;"><div><label>Author Name *</label><input id="pub-author" value="${esc(state.currentUser?.name || '')}" required style="width:100%;padding:.75rem;margin:.4rem 0 1rem;"></div><div><label>Category *</label><select id="pub-category" required style="width:100%;padding:.75rem;margin:.4rem 0 1rem;"><option value="">Select category</option>${categories.map(category=>`<option value="${esc(category.name)}">${esc(category.name)}</option>`).join('')}</select></div></div><label>Description *</label><textarea id="pub-description" rows="5" minlength="20" required placeholder="Describe your eBook..." style="width:100%;padding:.75rem;margin:.4rem 0 1rem;"></textarea><label>Tags</label><input id="pub-tags" placeholder="Productivity, Business, Finance" style="width:100%;padding:.75rem;margin:.4rem 0 1.5rem;"><div style="text-align:right;"><button type="button" class="btn btn-primary next-step-btn" data-next="2">Next: Files →</button></div></section>
    <section id="step-2" class="wizard-section" style="display:none;"><h3>Step 2: Cover & Files</h3><div style="border:2px dashed var(--border-medium);border-radius:16px;padding:2rem;text-align:center;margin:1.5rem 0;"><div style="font-size:38px;">📄</div><h4>Upload eBook PDF</h4><p id="pdf-limit-text" style="color:var(--text-secondary);font-size:.85rem;">PDF only · Maximum ${DEFAULT_MAX_PDF_MB} MB</p><input id="pub-pdf" type="file" accept="application/pdf,.pdf" style="display:none;"><label for="pub-pdf" class="btn btn-primary" style="cursor:pointer;display:inline-block;">Choose PDF</label><div id="pdf-file-name" style="margin-top:12px;font-weight:700;">No PDF selected</div><div id="pdf-status" style="color:var(--text-muted);font-size:.8rem;">Required</div><div id="pdf-limit-status" style="color:#2563eb;font-size:.78rem;margin-top:5px;">Admin-configured limit: ${DEFAULT_MAX_PDF_MB} MB</div></div><div style="border:2px dashed var(--border-medium);border-radius:16px;padding:2rem;text-align:center;margin-bottom:1.5rem;"><div style="font-size:38px;">🖼️</div><h4>Upload Cover</h4><p style="color:var(--text-secondary);font-size:.85rem;">JPG, PNG or WEBP · Maximum ${MAX_COVER_MB} MB · Required</p><input id="pub-cover" type="file" accept="image/jpeg,image/png,image/webp" style="display:none;"><label for="pub-cover" class="btn btn-primary" style="cursor:pointer;display:inline-block;">Choose Cover</label><div id="cover-file-name" style="margin-top:12px;font-weight:700;">No cover selected</div><div id="cover-status" style="color:var(--text-muted);font-size:.8rem;">Required</div><div id="step2-cover-preview" style="display:none;width:90px;height:120px;border-radius:10px;margin:14px auto 0;background:#e2e8f0;background-size:cover;background-position:center;"></div></div><div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:1rem;align-items:end;margin-bottom:1.5rem;"><div><label>Page Count *</label><input id="pub-pages" type="number" min="1" required placeholder="Automatically detected" style="width:100%;padding:.75rem;"></div><button type="button" id="detect-pages-btn" class="btn btn-secondary" style="white-space:nowrap;">Detect Pages</button></div><div style="display:flex;justify-content:space-between;gap:1rem;"><button type="button" class="btn btn-secondary prev-step-btn" data-prev="1">← Back</button><button type="button" class="btn btn-primary next-step-btn" data-next="3">Next: Pricing →</button></div></section>
    <section id="step-3" class="wizard-section" style="display:none;"><h3>Step 3: Pricing</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin:1.5rem 0;"><div><label>List Price *</label><input id="pub-price" type="number" min="1" step=".01" required placeholder="e.g. 499" style="width:100%;padding:.75rem;"></div><div><label>Sale Price</label><input id="pub-saleprice" type="number" min="0" step=".01" placeholder="Optional" style="width:100%;padding:.75rem;"></div></div><div style="padding:1.25rem;background:var(--accent-light);border-radius:14px;margin-bottom:1.5rem;"><strong id="pub-royalty-label">Estimated Author Royalty: 85%</strong><div id="pub-royalty-calc" style="font-size:1.3rem;font-weight:800;margin-top:8px;">₹0.00 per sale</div></div><div style="display:flex;justify-content:space-between;gap:1rem;"><button type="button" class="btn btn-secondary prev-step-btn" data-prev="2">← Back</button><button type="button" class="btn btn-primary next-step-btn" data-next="4">Next: Preview →</button></div></section>
    <section id="step-4" class="wizard-section" style="display:none;"><h3>Step 4: Preview</h3><div style="background:var(--bg-secondary);border-radius:16px;padding:1.5rem;margin:1.5rem 0;display:flex;gap:1.5rem;align-items:center;"><div id="preview-cover-box" style="width:110px;height:150px;border-radius:10px;background:#e2e8f0;background-size:cover;background-position:center;flex-shrink:0;"></div><div style="min-width:0;"><h3 id="preview-title" style="margin:0 0 .35rem;">Your Book</h3><div id="preview-author" style="color:var(--text-secondary);">Author</div><div id="preview-pages" style="color:var(--text-secondary);margin-top:5px;">Pages: —</div><div id="preview-price" style="color:var(--accent);font-size:1.3rem;font-weight:800;margin-top:10px;">₹0.00</div></div></div><div style="display:flex;justify-content:space-between;gap:1rem;"><button type="button" class="btn btn-secondary prev-step-btn" data-prev="3">← Back</button><button type="button" class="btn btn-primary next-step-btn" data-next="5">Continue →</button></div></section>
    <section id="step-5" class="wizard-section" style="display:none;"><h3>Step 5: Submit for Admin Review</h3><p style="color:var(--text-secondary);">Everything is ready. Submit your eBook to send it for review. You can check the full book information in the Preview step before submitting.</p><div id="upload-progress-box" style="display:none;margin:1.5rem 0;padding:1rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;"><div id="upload-progress-label" style="font-weight:700;margin-bottom:8px;">Preparing upload...</div><div style="height:10px;background:#e2e8f0;border-radius:999px;overflow:hidden;"><div id="upload-progress-fill" style="height:100%;width:0%;background:var(--accent);transition:width .2s ease;"></div></div></div><div style="display:flex;justify-content:space-between;gap:1rem;"><button type="button" class="btn btn-secondary prev-step-btn" data-prev="4">← Back</button><button id="submit-pub-btn" type="submit" class="btn btn-primary">Upload & Submit 🚀</button></div></section>
  </form></div></div></div>`;
}

export function initPublishInternalEvents() {
  const form = document.getElementById('publish-wizard-form'); if (!form) return;
  const pdfInput = document.getElementById('pub-pdf'); const coverInput = document.getElementById('pub-cover'); const detectPagesButton = document.getElementById('detect-pages-btn'); const priceInput = document.getElementById('pub-price'); const saleInput = document.getElementById('pub-saleprice');
  loadUploadConfig().catch(() => {});

  pdfInput?.addEventListener('change', async event => {
    const file = event.target.files?.[0]; if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') { Toast.show('Please select a PDF file.', 'warning'); event.target.value = ''; return; }
    if (file.size > uploadConfig.maxPdfMb * 1024 * 1024) { Toast.show(`PDF must be ${uploadConfig.maxPdfMb} MB or smaller.`, 'warning'); event.target.value = ''; return; }
    if (!(await validatePdfSignature(file))) { Toast.show('The selected file is not a valid PDF.', 'warning'); event.target.value = ''; return; }
    selectedPDF = file; updateFilesUI(); await detectAndSetPages();
  });

  coverInput?.addEventListener('change', event => {
    const file = event.target.files?.[0]; if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { Toast.show('Please select a JPG, PNG or WEBP cover.', 'warning'); event.target.value = ''; return; }
    if (file.size > MAX_COVER_MB * 1024 * 1024) { Toast.show(`Cover must be ${MAX_COVER_MB} MB or smaller.`, 'warning'); event.target.value = ''; return; }
    selectedCover = file; updateFilesUI(); const preview = document.getElementById('step2-cover-preview');
    if (preview) { if (preview.dataset.url) URL.revokeObjectURL(preview.dataset.url); const url = URL.createObjectURL(file); preview.dataset.url = url; preview.style.backgroundImage = `url(\"${url}\")`; preview.style.display = 'block'; }
  });

  detectPagesButton?.addEventListener('click', () => detectAndSetPages()); priceInput?.addEventListener('input', updateRoyalty); saleInput?.addEventListener('input', updateRoyalty);
  form.addEventListener('click', event => {
    const nextButton = event.target.closest('.next-step-btn'); const previousButton = event.target.closest('.prev-step-btn');
    if (nextButton) { event.preventDefault(); const nextStep = Number(nextButton.dataset.next); if (nextStep === 2 && !validateStep1()) return; if (nextStep === 3 && !validateStep2()) return; if (nextStep === 4 && !validateStep3()) return; showStep(nextStep); return; }
    if (previousButton) { event.preventDefault(); showStep(Number(previousButton.dataset.prev)); }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!validateStep1()) { showStep(1); return; } if (!validateStep2()) { showStep(2); return; } if (!validateStep3()) { showStep(3); return; }
    if (!state.isAuthenticated) { Toast.show('Please sign in before publishing.', 'error'); return; }
    if (!state.isSeller && !state.isAdmin) { Toast.show('Seller approval is required before publishing.', 'error'); return; }
    const submitButton = document.getElementById('submit-pub-btn'); const progressBox = document.getElementById('upload-progress-box'); if (submitButton) submitButton.disabled = true; if (progressBox) progressBox.style.display = 'block';
    try {
      await loadUploadConfig(); if (!validateStep2()) throw new Error('The upload limit changed. Please re-check your files.');
      const title = getValue('pub-title'); const subtitle = getValue('pub-subtitle'); const author = getValue('pub-author'); const category = getValue('pub-category'); const description = getValue('pub-description'); const tags = getValue('pub-tags').split(',').map(tag => tag.trim()).filter(Boolean); const pages = getNumber('pub-pages'); const price = getNumber('pub-price'); const saleRaw = document.getElementById('pub-saleprice')?.value?.trim() || ''; const salePrice = saleRaw === '' ? null : Number(saleRaw);
      const totalBytes = selectedPDF.size + selectedCover.size;
      setSubmitProgress('Starting PDF upload...', 0);
      const pdfFile = await uploadFileResumable(selectedPDF, 'pdf', ratio => setSubmitProgress('Uploading PDF...', ratio * selectedPDF.size / totalBytes * 100));
      setSubmitProgress('Uploading cover...', selectedPDF.size / totalBytes * 100);
      const coverFile = await uploadFileResumable(selectedCover, 'cover', ratio => setSubmitProgress('Uploading cover...', (selectedPDF.size + ratio * selectedCover.size) / totalBytes * 100));
      setSubmitProgress('Files uploaded. Creating listing...', 100);
      const createPayload = { action: 'createBook', title, subtitle, author, category, description, tags, pages, format: 'PDF', price, sale_price: salePrice, cover_url: coverFile?.url || coverFile?.webViewLink || coverFile?.downloadUrl || '', pdf_url: pdfFile?.url || pdfFile?.webViewLink || pdfFile?.downloadUrl || '', cover_file_id: coverFile?.id || coverFile?.file_id || coverFile?.fileId || '', pdf_file_id: pdfFile?.id || pdfFile?.file_id || pdfFile?.fileId || '', status: 'pending' };
      const bookResponse = await requestJson('/api/books/create', { method: 'POST', headers: authHeaders(), body: JSON.stringify(createPayload) });
      if (!bookResponse.book) throw new Error('Book listing was not returned by the server.');

      setSubmitProgress('Saving book metadata to Firebase...', 100);
      await persistBookMetadataToFirestore(bookResponse.book, createPayload);

      Toast.show('eBook submitted successfully for admin review!', 'success');
      selectedPDF = null; selectedCover = null;
      updateFilesUI();
      setTimeout(() => { window.location.hash = '#/creator/dashboard'; }, 800);
    } catch (error) {
      console.error('Publish eBook error:', error); Toast.show(error?.message || 'Unable to publish eBook. Your upload can be retried safely.', 'error'); if (submitButton) submitButton.disabled = false; setSubmitProgress('Retry upload', 0);
    }
  });
  updateFilesUI(); updateRoyalty(); showStep(1);
}
