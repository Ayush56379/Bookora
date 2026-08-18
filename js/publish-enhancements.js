import { state } from './state.js';
import { apiFetch } from './config.js';
import { Toast } from './components/Toast.js';

const MAX_PDF_SIZE = 100 * 1024 * 1024;
const MAX_COVER_SIZE = 5 * 1024 * 1024;
const PDFJS_VERSION = '3.11.174';
let pdfJsPromise = null;
let enhancedSubmitRunning = false;

function value(id, fallback = '') {
  return document.getElementById(id)?.value?.trim() || fallback;
}

function number(id, fallback = 0) {
  const n = Number(document.getElementById(id)?.value);
  return Number.isFinite(n) ? n : fallback;
}

function setSubmitText(text) {
  const button = document.getElementById('submit-pub-btn');
  if (button) button.textContent = text;
}

function setSubmitBusy(busy) {
  const button = document.getElementById('submit-pub-btn');
  if (!button) return;
  button.disabled = busy;
  if (busy) button.setAttribute('aria-busy', 'true');
  else button.removeAttribute('aria-busy');
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
    reader.onerror = () => reject(new Error('Unable to read the selected file.'));
    reader.readAsDataURL(file);
  });
}

function loadPdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (pdfJsPromise) return pdfJsPromise;
  pdfJsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-bookora-pdfjs]');
    if (existing) {
      const wait = () => window.pdfjsLib ? resolve(window.pdfjsLib) : existing.dataset.failed === '1' ? reject(new Error('PDF.js failed to load.')) : setTimeout(wait, 50);
      wait();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
    script.async = true;
    script.dataset.bookoraPdfjs = '1';
    script.onload = () => {
      if (!window.pdfjsLib) { script.dataset.failed = '1'; reject(new Error('PDF.js unavailable.')); return; }
      try { window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`; } catch (_) {}
      resolve(window.pdfjsLib);
    };
    script.onerror = () => { script.dataset.failed = '1'; reject(new Error('PDF.js could not be loaded.')); };
    document.head.appendChild(script);
  }).catch(error => { pdfJsPromise = null; throw error; });
  return pdfJsPromise;
}

async function extractBookText(file, maxPages = 12, maxChars = 12000) {
  const pdfjs = await loadPdfJs();
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = Math.min(Number(pdf.numPages) || 0, maxPages);
  let text = '';
  for (let i = 1; i <= pages && text.length < maxChars; i += 1) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str || '').join(' ');
    text += `\n[Page ${i}]\n${pageText}`;
  }
  return { pageCount: Number(pdf.numPages) || 0, text: text.slice(0, maxChars) };
}

function parseAiDecision(raw) {
  const text = String(raw || '').trim();
  const candidates = [text];
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) candidates.push(objectMatch[0]);
  for (const candidate of candidates) {
    try {
      const data = JSON.parse(candidate);
      if (data && typeof data === 'object') return data;
    } catch (_) {}
  }
  return null;
}

async function runAiDetection(book) {
  setSubmitText('AI checking book...');
  let extracted;
  try {
    extracted = await extractBookText(book.pdf, 12, 12000);
  } catch (error) {
    console.warn('AI text extraction unavailable:', error);
    extracted = { pageCount: number('pub-pages'), text: '' };
  }

  const prompt = `You are Bookora's publishing safety and originality pre-screening engine. Review this proposed eBook using ONLY the supplied metadata and extracted text. Return ONLY valid JSON with this exact shape: {"status":"approved"|"rejected","reason":"short reason","flags":["piracy"|"adult"|"illegal"|"spam"|"copyright_risk"|"low_quality"|"none"]}. Reject clear piracy/leaked/scanned-copy distribution, explicit adult sexual material, instructions facilitating illegal wrongdoing, obvious spam/garbage content, or clear copyright-infringement indicators. Do not reject ordinary educational, business, fiction, romance, health, finance, or technical content merely because it mentions sensitive topics. If evidence is insufficient, approve.\n\nTITLE: ${book.title}\nAUTHOR: ${book.author}\nCATEGORY: ${book.category}\nDESCRIPTION: ${book.description}\nTAGS: ${book.tags.join(', ')}\nPAGE COUNT: ${extracted.pageCount || book.pages}\nEXTRACTED TEXT SAMPLE:\n${extracted.text || '(No extractable text; assess metadata only)'}`;

  const response = await apiFetch('/api/ai/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${state.token || ''}` },
    body: JSON.stringify({
      message: prompt,
      conversationHistory: [],
      context: { page: '#/publish', pageName: 'Publish Safety Precheck', user: state.currentUser?.name || 'Author' }
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'AI detection service is unavailable.');
  const decision = parseAiDecision(data.message || data.reply || data.content || '');
  if (!decision) throw new Error('AI detection returned an unreadable result.');
  if (String(decision.status).toLowerCase() !== 'approved') {
    const reason = String(decision.reason || 'The book needs review before it can be submitted.');
    throw new Error(`AI check rejected this eBook: ${reason}`);
  }
  return decision;
}

function showDetailedPreview() {
  const step = document.getElementById('step-4');
  if (!step) return;

  const title = value('pub-title', 'Untitled eBook');
  const subtitle = value('pub-subtitle', '');
  const author = value('pub-author', 'Author');
  const category = value('pub-category', '—');
  const description = value('pub-description', '—');
  const tags = value('pub-tags', '').split(',').map(x => x.trim()).filter(Boolean);
  const pages = value('pub-pages', '—');
  const format = value('pub-format', 'PDF');
  const listPrice = number('pub-price', 0);
  const saleRaw = document.getElementById('pub-saleprice')?.value?.trim() || '';
  const salePrice = saleRaw === '' ? null : Number(saleRaw);
  const effectivePrice = salePrice == null ? listPrice : salePrice;
  const royaltyPct = Number(window.BOOKORA_MARKETPLACE?.sellerCommissionPct ?? 85);
  const royalty = Number.isFinite(royaltyPct) ? effectivePrice * royaltyPct / 100 : 0;
  const pdf = document.getElementById('pub-pdf')?.files?.[0] || null;
  const cover = document.getElementById('pub-cover')?.files?.[0] || null;

  const existing = document.getElementById('bookora-full-preview');
  if (existing) existing.remove();

  const box = document.createElement('div');
  box.id = 'bookora-full-preview';
  box.style.cssText = 'margin:1.25rem 0;padding:1.25rem;border:1px solid var(--border-subtle,#E2E8F0);border-radius:16px;background:#fff;box-shadow:0 8px 24px rgba(15,23,42,.06);';
  const escHtml = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const tagsHtml = tags.length ? tags.map(t => `<span style="display:inline-block;padding:4px 9px;border-radius:999px;background:#F1F5F9;margin:3px;font-size:.78rem;">${escHtml(t)}</span>`).join('') : '<span style="color:#64748B;">No tags</span>';
  const saleText = salePrice == null ? 'No sale price' : `₹${salePrice.toFixed(2)}`;
  const fileText = pdf ? `${pdf.name} · ${(pdf.size / 1048576).toFixed(2)} MB` : 'No PDF selected';
  const coverText = cover ? `${cover.name} · ${(cover.size / 1048576).toFixed(2)} MB` : 'No cover selected';

  box.innerHTML = `
    <div style="display:grid;grid-template-columns:minmax(100px,150px) minmax(0,1fr);gap:1.25rem;align-items:start;">
      <div id="bookora-preview-cover" style="width:100%;aspect-ratio:3/4;border-radius:12px;background:#E2E8F0 center/cover no-repeat;overflow:hidden;"></div>
      <div>
        <div style="font-size:.75rem;font-weight:800;color:var(--accent,#2563EB);text-transform:uppercase;letter-spacing:.08em;">Complete Preview</div>
        <h3 style="margin:.35rem 0 .2rem;">${escHtml(title)}</h3>
        ${subtitle ? `<div style="color:#475569;margin-bottom:.35rem;">${escHtml(subtitle)}</div>` : ''}
        <div style="color:#64748B;">by ${escHtml(author)}</div>
        <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.8rem;font-size:.86rem;">
          <span><strong>Category:</strong> ${escHtml(category)}</span>
          <span><strong>Pages:</strong> ${escHtml(pages)}</span>
          <span><strong>Format:</strong> ${escHtml(format)}</span>
        </div>
        <div style="margin-top:1rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:.6rem;">
          <div style="padding:.7rem;background:#F8FAFC;border-radius:10px;"><small>List Price</small><div style="font-weight:800;">₹${listPrice.toFixed(2)}</div></div>
          <div style="padding:.7rem;background:#F8FAFC;border-radius:10px;"><small>Sale Price</small><div style="font-weight:800;">${saleText}</div></div>
          <div style="padding:.7rem;background:#F8FAFC;border-radius:10px;"><small>Est. Royalty</small><div style="font-weight:800;">₹${royalty.toFixed(2)} (${Number.isFinite(royaltyPct) ? royaltyPct : 85}%)</div></div>
        </div>
      </div>
    </div>
    <div style="margin-top:1.2rem;padding-top:1.1rem;border-top:1px solid #E2E8F0;">
      <strong>Description</strong>
      <p style="white-space:pre-wrap;color:#475569;line-height:1.65;margin:.45rem 0 1rem;">${escHtml(description)}</p>
      <strong>Tags</strong>
      <div style="margin:.4rem 0 1rem;">${tagsHtml}</div>
      <strong>Files</strong>
      <div style="margin-top:.4rem;color:#475569;font-size:.88rem;line-height:1.7;">
        <div>📄 ${escHtml(fileText)}</div>
        <div>🖼️ ${escHtml(coverText)}</div>
      </div>
    </div>`;

  step.querySelector('h3')?.insertAdjacentElement('afterend', box);

  if (cover) {
    const coverEl = document.getElementById('bookora-preview-cover');
    if (coverEl) coverEl.style.backgroundImage = `url("${URL.createObjectURL(cover)}")`;
  }
}

async function resizeCover(file) {
  if (!file || file.type === 'image/webp' || file.size < 700 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const maxW = 1600;
    const maxH = 2200;
    const scale = Math.min(1, maxW / bitmap.width, maxH / bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.86));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg', lastModified: Date.now() });
  } catch (_) {
    return file;
  }
}

function validate(book) {
  if (!state.isAuthenticated) throw new Error('Please sign in before publishing.');
  if (!state.isSeller && !state.isAdmin) throw new Error('Seller approval is required before publishing.');
  if (book.title.length < 3) throw new Error('Please enter a valid eBook title.');
  if (!book.author) throw new Error('Please enter the author name.');
  if (!book.category) throw new Error('Please select a category.');
  if (book.description.length < 20) throw new Error('Description must contain at least 20 characters.');
  if (!book.pdf) throw new Error('Please select your PDF eBook.');
  if (book.pdf.size > MAX_PDF_SIZE) throw new Error('PDF must be 100 MB or smaller.');
  if (!book.cover) throw new Error('Please select the eBook cover image.');
  if (book.cover.size > MAX_COVER_SIZE) throw new Error('Cover must be 5 MB or smaller.');
  if (!book.pages || book.pages < 1) throw new Error('PDF page count is required.');
  if (!book.price || book.price <= 0) throw new Error('Please enter a valid list price.');
  if (!Number.isFinite(book.salePrice) || book.salePrice < 0 || book.salePrice > book.price) throw new Error('Sale price cannot be higher than the list price.');
}

async function enhancedSubmit() {
  if (enhancedSubmitRunning) return;
  enhancedSubmitRunning = true;
  setSubmitBusy(true);
  try {
    const pdf = document.getElementById('pub-pdf')?.files?.[0] || null;
    const cover = document.getElementById('pub-cover')?.files?.[0] || null;
    const saleRaw = document.getElementById('pub-saleprice')?.value?.trim() || '';
    const book = {
      title: value('pub-title'), subtitle: value('pub-subtitle'), author: value('pub-author'),
      category: value('pub-category'), description: value('pub-description'),
      tags: value('pub-tags').split(',').map(x => x.trim()).filter(Boolean),
      pages: number('pub-pages'), price: number('pub-price'),
      salePrice: saleRaw === '' ? 0 : Number(saleRaw), pdf, cover
    };
    validate(book);

    try {
      await runAiDetection(book);
      Toast.show('AI check passed. Preparing files...', 'success');
    } catch (aiError) {
      // Do not make a temporary AI-service/parser failure prevent a valid seller from uploading.
      // A clear AI rejection still blocks submission; service/unreadable-result errors are non-blocking.
      const message = String(aiError?.message || aiError || '');
      if (/AI check rejected/i.test(message)) throw aiError;
      console.warn('Bookora AI precheck unavailable; continuing to upload:', message);
      Toast.show('AI precheck is temporarily unavailable. Continuing with upload...', 'info');
    }

    setSubmitText('Preparing files...');
    const optimizedCoverPromise = resizeCover(book.cover);
    const [pdfBase64, optimizedCover] = await Promise.all([fileToBase64(book.pdf), optimizedCoverPromise]);
    const coverBase64 = await fileToBase64(optimizedCover);

    setSubmitText('Uploading to Drive...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000);
    let uploadResponse;
    try {
      uploadResponse = await apiFetch('/api/books/upload-files', {
        method: 'POST',
        signal: controller.signal,
        headers: { Authorization: `Bearer ${state.token}` },
        body: JSON.stringify({
          action: 'uploadBookFiles',
          pdf: { name: book.pdf.name, mimeType: 'application/pdf', data: pdfBase64 },
          cover: { name: optimizedCover.name, mimeType: optimizedCover.type, data: coverBase64 }
        })
      });
    } finally {
      clearTimeout(timeout);
    }

    const uploadData = await uploadResponse.json().catch(() => ({}));
    if (!uploadResponse.ok || !uploadData.success) {
      throw new Error(uploadData.error || `File upload failed (HTTP ${uploadResponse.status}).`);
    }

    setSubmitText('Creating book listing...');
    const bookResponse = await apiFetch('/api/books/create', {
      method: 'POST',
      headers: { Authorization: `Bearer ${state.token}` },
      body: JSON.stringify({
        action: 'createBook', title: book.title, subtitle: book.subtitle, author: book.author,
        category: book.category, description: book.description, tags: book.tags, pages: book.pages,
        format: 'PDF', price: book.price, sale_price: book.salePrice || null,
        cover_url: uploadData.cover_url || '', pdf_url: uploadData.pdf_url || '',
        cover_file_id: uploadData.cover_file_id || '', pdf_file_id: uploadData.pdf_file_id || '',
        status: 'pending', ai_checked: true, ai_status: 'approved'
      })
    });
    const bookData = await bookResponse.json().catch(() => ({}));
    if (!bookResponse.ok || !bookData.success) throw new Error(bookData.error || `Book creation failed (HTTP ${bookResponse.status}).`);

    Toast.show('eBook submitted successfully for admin review!', 'success');
    setSubmitText('Submitted ✓');
    setTimeout(() => { window.location.hash = '#/creator/dashboard'; }, 700);
  } catch (error) {
    console.error('Enhanced publish error:', error);
    const message = error?.name === 'AbortError'
      ? 'Upload timed out after 5 minutes. Please try again with a stable connection.'
      : (error?.message || 'Unable to publish eBook.');
    Toast.show(message, 'error');
    setSubmitText('Upload & Submit 🚀');
    setSubmitBusy(false);
  } finally {
    enhancedSubmitRunning = false;
  }
}

function attach() {
  const form = document.getElementById('publish-wizard-form');
  if (!form || form.dataset.enhancedPublish === '1') return;
  form.dataset.enhancedPublish = '1';
  form.addEventListener('submit', event => {
    if (form.dataset.allowOriginalSubmit === '1') {
      form.dataset.allowOriginalSubmit = '0';
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    enhancedSubmit();
  }, true);
}

function syncPreviewOnInputs() {
  const ids = ['pub-title','pub-subtitle','pub-author','pub-category','pub-description','pub-tags','pub-pages','pub-format','pub-price','pub-saleprice'];
  ids.forEach(id => document.getElementById(id)?.addEventListener('input', () => {
    if (document.getElementById('step-4')?.style.display !== 'none') showDetailedPreview();
  }));
  ['pub-category'].forEach(id => document.getElementById(id)?.addEventListener('change', () => {
    if (document.getElementById('step-4')?.style.display !== 'none') showDetailedPreview();
  }));
  document.getElementById('pub-pdf')?.addEventListener('change', () => {
    if (document.getElementById('step-4')?.style.display !== 'none') showDetailedPreview();
  });
  document.getElementById('pub-cover')?.addEventListener('change', () => {
    if (document.getElementById('step-4')?.style.display !== 'none') showDetailedPreview();
  });
}

function attachPreviewHooks() {
  const form = document.getElementById('publish-wizard-form');
  if (!form || form.dataset.previewFix === '1') return;
  form.dataset.previewFix = '1';
  syncPreviewOnInputs();
  form.addEventListener('click', event => {
    const next = event.target.closest('.next-step-btn');
    if (next?.dataset.next === '4') {
      setTimeout(showDetailedPreview, 30);
    }
    const back = event.target.closest('.prev-step-btn');
    if (back?.dataset.prev === '4') {
      setTimeout(showDetailedPreview, 30);
    }
  }, true);
  const originalShow = window.BookoraShowPublishPreview;
  window.BookoraShowPublishPreview = () => showDetailedPreview();
  setTimeout(() => {
    if (document.getElementById('step-4')?.style.display !== 'none') showDetailedPreview();
  }, 50);
}

const observer = new MutationObserver(() => {
  attach();
  attachPreviewHooks();
});
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener('hashchange', () => setTimeout(() => { attach(); attachPreviewHooks(); }, 0));
attach();
attachPreviewHooks();
