// Bookora permanent publishing upload runtime v3.
// One authoritative submit handler: binary resumable upload, automatic recovery,
// then create the pending book so the existing Admin AI Review Center receives it.
import { state } from './state.js';
import { apiFetch, API_BASE_URL, waitForAuthenticatedFirebaseUser } from './config.js';
import { Toast } from './components/Toast.js';

const MAX_RETRIES = 6;
const REQUEST_TIMEOUT_MS = 12 * 60 * 1000;
let installedForForm = null;
let running = false;

const value = (id, fallback = '') => document.getElementById(id)?.value?.trim() || fallback;
const number = (id, fallback = 0) => { const n = Number(document.getElementById(id)?.value); return Number.isFinite(n) ? n : fallback; };
const auth = () => ({ Authorization: `Bearer ${state.token || ''}` });

function progress(text, pct, detail = '') {
  const box = document.getElementById('upload-progress-box');
  const label = document.getElementById('upload-progress-label');
  const fill = document.getElementById('upload-progress-fill');
  if (box) box.style.display = 'block';
  if (label) label.textContent = detail ? `${text} ${Math.round(pct)}% · ${detail}` : `${text} ${Math.round(pct)}%`;
  if (fill) fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  const button = document.getElementById('submit-pub-btn');
  if (button) button.textContent = text === 'Upload complete ✓' ? 'Upload complete ✓' : text;
}

function formatSpeed(bytesPerSecond) {
  if (!Number.isFinite(bytesPerSecond) || bytesPerSecond <= 0) return '';
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  let n = bytesPerSecond, i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i += 1; }
  return `${n.toFixed(n >= 10 ? 0 : 1)} ${units[i]}`;
}
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function jsonRequest(endpoint, options = {}, attempts = MAX_RETRIES) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await apiFetch(endpoint, options);
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success !== false) return data;
      const error = new Error(data.error || `Request failed (${response.status})`);
      error.status = response.status; error.data = data;
      if (![408, 409, 425, 429, 500, 502, 503, 504].includes(response.status)) throw error;
      lastError = error;
    } catch (error) { lastError = error; }
    await sleep(Math.min(8000, 700 * (2 ** attempt)) + Math.random() * 400);
  }
  throw lastError || new Error('Network request failed.');
}

async function startSession(file, kind) {
  const data = await jsonRequest('/api/books/upload-session/start', {
    method: 'POST', headers: { ...auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name, mimeType: kind === 'pdf' ? 'application/pdf' : (file.type || 'image/jpeg'), size: file.size, kind })
  });
  if (!data.upload_token) throw new Error('Upload server did not create a resumable session.');
  return { token: data.upload_token, chunkSize: Math.max(256 * 1024, Number(data.chunk_size) || 8 * 1024 * 1024), offset: Number(data.next_offset) || 0 };
}

function uploadChunkXHR(file, kind, session, start, onProgress) {
  return new Promise((resolve, reject) => {
    const end = Math.min(file.size, start + session.chunkSize);
    const blob = file.slice(start, end);
    const xhr = new XMLHttpRequest();
    const startedAt = performance.now();
    let settled = false;
    const finish = (fn, value) => { if (settled) return; settled = true; fn(value); };
    xhr.open('POST', `${API_BASE_URL}/api/books/upload-session/chunk-binary`, true);
    xhr.timeout = REQUEST_TIMEOUT_MS;
    xhr.setRequestHeader('Authorization', `Bearer ${state.token || ''}`);
    xhr.setRequestHeader('X-Bookora-Upload-Token', session.token);
    xhr.setRequestHeader('X-Bookora-Offset', String(start));
    xhr.setRequestHeader('Content-Type', kind === 'pdf' ? 'application/pdf' : (file.type || 'application/octet-stream'));
    xhr.upload.onprogress = event => {
      if (!event.lengthComputable) return;
      const sent = start + event.loaded;
      const elapsed = Math.max(0.001, (performance.now() - startedAt) / 1000);
      onProgress(Math.min(file.size, sent), event.loaded / elapsed);
    };
    xhr.onload = () => {
      let data = {};
      try { data = JSON.parse(xhr.responseText || '{}'); } catch (_) {}
      if (xhr.status >= 200 && xhr.status < 300 && data.success) return finish(resolve, data);
      const error = new Error(data.error || `Chunk upload failed (${xhr.status || 'network'})`);
      error.status = xhr.status; error.data = data; finish(reject, error);
    };
    xhr.onerror = () => finish(reject, new Error('Network connection interrupted while uploading.'));
    xhr.ontimeout = () => finish(reject, new Error('Upload request timed out.'));
    xhr.onabort = () => finish(reject, new Error('Upload request was interrupted.'));
    try { xhr.send(blob); } catch (error) { finish(reject, error); }
  });
}

async function uploadFile(file, kind, basePercent, spanPercent) {
  let restart = 0;
  while (restart < 5) {
    let session;
    try {
      session = await startSession(file, kind);
      let offset = session.offset;
      let failures = 0;
      while (offset < file.size) {
        try {
          const response = await uploadChunkXHR(file, kind, session, offset, (sent, speed) => {
            const pct = basePercent + spanPercent * sent / file.size;
            progress(kind === 'pdf' ? 'Uploading PDF...' : 'Uploading cover...', pct, formatSpeed(speed));
          });
          const next = Number(response.next_offset);
          if (!Number.isFinite(next) || next <= offset || next > file.size) throw new Error('Upload server returned an invalid next offset.');
          offset = next; failures = 0;
        } catch (error) {
          failures += 1;
          if (error.status === 410 || /session expired/i.test(String(error.message || ''))) throw error;
          if (error.status === 409 && Number(error.data?.next_offset) >= 0) { offset = Math.min(file.size, Number(error.data.next_offset)); continue; }
          if (failures > MAX_RETRIES) throw error;
          progress('Retrying upload...', basePercent + spanPercent * offset / file.size, error.message || 'temporary network error');
          await sleep(Math.min(10000, 900 * (2 ** Math.min(4, failures - 1))) + Math.random() * 500);
        }
      }
      const final = await jsonRequest('/api/books/upload-session/status', {
        method: 'POST', headers: { ...auth(), 'Content-Type': 'application/json' }, body: JSON.stringify({ upload_token: session.token })
      });
      if (!final.done || !final.file) throw new Error('Upload reached 100% but storage did not confirm completion.');
      return final.file;
    } catch (error) {
      restart += 1;
      if (restart >= 5) throw error;
      progress('Recovering upload...', basePercent, 'starting a fresh resumable session');
      await sleep(800 * restart);
    }
  }
  throw new Error('Upload could not be recovered.');
}

function normalizeFileId(file) { return String(file?.id || file?.file_id || file?.fileId || '').trim(); }
function normalizeUrl(file) { return String(file?.url || file?.webViewLink || file?.downloadUrl || file?.download_url || '').trim(); }

async function writeFirestoreBook(book, input) {
  const db = window.firebase?.firestore?.();
  if (!db) throw new Error('Firebase Firestore is not available.');
  const id = String(book?.id || book?.bookId || '').trim();
  if (!id) throw new Error('The server did not return a book ID.');
  const user = await waitForAuthenticatedFirebaseUser();
  const now = new Date().toISOString();
  const metadata = {
    id, bookId: id, backendBookId: id, slug: book.slug || id,
    title: input.title, subtitle: input.subtitle, author: input.author, description: input.description,
    category: input.category, tags: input.tags, pages: input.pages, format: 'PDF', language: 'English',
    price: input.price, salePrice: input.sale_price, sale_price: input.sale_price,
    coverUrl: input.cover_url, cover_url: input.cover_url,
    coverDriveFileId: input.cover_file_id, coverFileId: input.cover_file_id, cover_file_id: input.cover_file_id,
    pdfUrl: input.pdf_url, pdf_url: input.pdf_url,
    driveFileId: input.pdf_file_id, pdfFileId: input.pdf_file_id, pdf_file_id: input.pdf_file_id,
    sourceType: 'internal', source_type: 'internal',
    creatorId: book.creator_id || state.currentUser?.id || user?.uid || '', creator_id: book.creator_id || state.currentUser?.id || user?.uid || '',
    creatorUid: user?.uid || '', firebaseUid: user?.uid || '', sellerId: book.seller_id || state.currentUser?.id || '', seller_id: book.seller_id || state.currentUser?.id || '',
    sellerName: book.seller_name || input.author, seller_name: book.seller_name || input.author,
    status: 'pending', isFeatured: false, is_featured: false, isTrending: false, is_trending: false,
    isBestseller: false, is_bestseller: false, isNew: true, rating: 0, reviewCount: 0, review_count: 0,
    createdAt: book.created_at || now, created_at: book.created_at || now, updatedAt: now, updated_at: now,
    aiReviewStatus: 'awaiting_admin_ai_review', ai_review_status: 'awaiting_admin_ai_review', adminAiReview: null, admin_ai_review: null
  };
  await db.collection('books').doc(id).set(metadata, { merge: true });
}

async function createPendingBook(input, uploads) {
  const payload = {
    action: 'createBook', title: input.title, subtitle: input.subtitle, author: input.author, category: input.category,
    description: input.description, tags: input.tags, pages: input.pages, format: 'PDF', price: input.price, sale_price: input.sale_price,
    cover_url: normalizeUrl(uploads.cover), pdf_url: normalizeUrl(uploads.pdf), cover_file_id: normalizeFileId(uploads.cover), pdf_file_id: normalizeFileId(uploads.pdf),
    status: 'pending', ai_checked: false, ai_status: 'awaiting_admin_review'
  };
  try {
    const response = await jsonRequest('/api/books/create', { method: 'POST', headers: { ...auth(), 'Content-Type': 'application/json', 'Idempotency-Key': input.client_submission_id }, body: JSON.stringify(payload) });
    if (!response.book) throw new Error('The book listing was not returned by the server.');
    await writeFirestoreBook(response.book, payload);
    return response.book;
  } catch (error) {
    if (error.status === 409) throw new Error('This eBook was already submitted. Refresh the dashboard to verify its review status.');
    throw error;
  }
}

function validate() {
  if (!state.isAuthenticated) throw new Error('Please sign in before publishing.');
  if (!state.isSeller && !state.isAdmin) throw new Error('Seller approval is required before publishing.');
  const pdf = document.getElementById('pub-pdf')?.files?.[0] || null;
  const cover = document.getElementById('pub-cover')?.files?.[0] || null;
  if (!pdf) throw new Error('Please select your PDF eBook.');
  if (!cover) throw new Error('Please select the eBook cover image.');
  if (!pdf.name.toLowerCase().endsWith('.pdf') && pdf.type !== 'application/pdf') throw new Error('Only PDF files are supported.');
  if (pdf.size > 100 * 1024 * 1024) throw new Error('PDF must be 100 MB or smaller.');
  if (!['image/jpeg','image/png','image/webp'].includes(cover.type)) throw new Error('Please select a JPG, PNG or WEBP cover.');
  if (cover.size > 5 * 1024 * 1024) throw new Error('Cover must be 5 MB or smaller.');
  const title = value('pub-title'); const author = value('pub-author'); const category = value('pub-category'); const description = value('pub-description');
  if (title.length < 3) throw new Error('Please enter a valid eBook title.');
  if (!author) throw new Error('Please enter the author name.');
  if (!category) throw new Error('Please select a category.');
  if (description.length < 20) throw new Error('Description must contain at least 20 characters.');
  const pages = number('pub-pages'); const price = number('pub-price'); const saleRaw = value('pub-saleprice'); const sale = saleRaw === '' ? null : Number(saleRaw);
  if (!pages || pages < 1) throw new Error('PDF page count is required.');
  if (!price || price <= 0) throw new Error('Please enter a valid list price.');
  if (sale !== null && (!Number.isFinite(sale) || sale < 0 || sale > price)) throw new Error('Sale price cannot be higher than the list price.');
  return { title, subtitle: value('pub-subtitle'), author, category, description, tags: value('pub-tags').split(',').map(x => x.trim()).filter(Boolean), pages, price, sale_price: sale,
    client_submission_id: `pub-${crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`, pdf, cover };
}

async function submit(event) {
  if (running) return;
  running = true; event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
  const button = document.getElementById('submit-pub-btn'); if (button) button.disabled = true;
  try {
    const input = validate();
    progress('Preparing upload...', 0);
    const pdf = await uploadFile(input.pdf, 'pdf', 0, 92);
    progress('PDF uploaded ✓', 92);
    const cover = await uploadFile(input.cover, 'cover', 92, 6);
    progress('Upload complete ✓', 98, 'files confirmed in storage');
    await createPendingBook(input, { pdf, cover });
    progress('Submitted successfully ✓', 100, 'sent to Admin AI Review');
    Toast.show('Upload successful! eBook sent to Admin AI Review.', 'success');
    if (button) button.textContent = 'Submitted successfully ✓';
    await sleep(1200);
    window.location.hash = '#/creator/dashboard';
  } catch (error) {
    console.error('[Bookora permanent publish v3]', error);
    Toast.show(error?.message || 'Upload failed. Please try again.', 'error');
    progress('Retry upload', 0, error?.message || 'temporary network error');
    if (button) { button.disabled = false; button.textContent = 'Retry upload'; }
  } finally { running = false; }
}

function install() {
  const form = document.getElementById('publish-wizard-form');
  if (!form || installedForForm === form) return;
  installedForForm = form;
  form.addEventListener('submit', submit, true);
}
const observer = new MutationObserver(install);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener('hashchange', () => setTimeout(install, 0));
install();
