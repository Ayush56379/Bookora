/* Bookora Publish Direct Drive Runtime
 *
 * The existing wizard UI remains intact. This runtime takes over only the final
 * submit event and replaces browser base64/chunk transport with:
 *
 *   Render -> secure Google Drive session
 *   Browser -> Google Drive (one PUT of the whole File)
 *   Render -> finalize Drive file + URL
 *   Render/Firebase -> metadata + pending admin review
 *
 * No PDF bytes are sent to Firebase and no PDF bytes pass through Render after
 * the session is created.
 */
(() => {
  if (window.__BOOKORA_DIRECT_DRIVE_PUBLISH_V2__) return;
  window.__BOOKORA_DIRECT_DRIVE_PUBLISH_V2__ = true;

  const API = 'https://bookora-backend-x08l.onrender.com';
  const MAX_COVER_MB = 5;
  const DEFAULT_MAX_PDF_MB = 100;
  const installed = new WeakSet();

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const value = (id, fallback = '') => document.getElementById(id)?.value?.trim() || fallback;
  const number = (id, fallback = 0) => {
    const n = Number(document.getElementById(id)?.value);
    return Number.isFinite(n) ? n : fallback;
  };
  const esc = v => String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;').replace(/'/g, '&#039;');

  async function authToken() {
    const auth = window.firebase?.auth?.();
    if (!auth) throw new Error('Firebase authentication is not ready. Please refresh once and try again.');
    let user = auth.currentUser;
    if (!user) {
      user = await new Promise(resolve => {
        let done = false;
        let unsubscribe = null;
        const finish = u => { if (done) return; done = true; try { unsubscribe?.(); } catch (_) {} resolve(u || null); };
        try { unsubscribe = auth.onAuthStateChanged(finish); } catch (_) { finish(null); }
        setTimeout(() => finish(auth.currentUser || null), 12000);
      });
    }
    if (!user) throw new Error('Please sign in before publishing.');
    const token = await user.getIdToken(false);
    if (!token) throw new Error('Could not create a secure upload session. Please sign in again.');
    return { user, token };
  }

  async function api(path, options = {}) {
    const { token } = await authToken();
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Accept', 'application/json');
    if (options.body !== undefined && !(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const response = await fetch(`${API}${path}`, { ...options, headers });
    let data = {};
    try { data = await response.json(); } catch (_) {}
    if (!response.ok || data.success === false) {
      const error = new Error(data.error || `Request failed (${response.status}).`);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  function setProgress(text, percent, detail = '') {
    const button = document.getElementById('submit-pub-btn');
    const box = document.getElementById('upload-progress-box');
    const label = document.getElementById('upload-progress-label');
    const fill = document.getElementById('upload-progress-fill');
    if (box) box.style.display = 'block';
    if (button) button.textContent = text;
    if (label) label.innerHTML = `<strong>${esc(text)}</strong>${detail ? `<span style="display:block;color:#64748b;font-size:.8rem;margin-top:4px;">${esc(detail)}</span>` : ''}`;
    if (fill && Number.isFinite(percent)) fill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  }

  function injectReviewDetails() {
    const section = document.getElementById('step-5');
    if (!section || document.getElementById('publish-review-details')) return;
    const title = value('pub-title', 'Untitled eBook');
    const subtitle = value('pub-subtitle');
    const author = value('pub-author', 'Author');
    const category = value('pub-category', 'Other');
    const description = value('pub-description', '');
    const tags = value('pub-tags', '');
    const pages = value('pub-pages', '—');
    const price = value('pub-price', '0');
    const sale = value('pub-saleprice', '');
    const pdf = document.getElementById('pub-pdf')?.files?.[0];
    const cover = document.getElementById('pub-cover')?.files?.[0];
    const existing = section.querySelector('p');
    if (existing) existing.textContent = 'Review every detail below. After submission, the eBook will be saved in Firebase with status Pending and sent to Admin Review.';

    const card = document.createElement('div');
    card.id = 'publish-review-details';
    card.style.cssText = 'margin:1.25rem 0;padding:1.25rem;border:1px solid #e2e8f0;border-radius:16px;background:#f8fafc;';
    const coverUrl = cover ? URL.createObjectURL(cover) : '';
    card.innerHTML = `
      <div style="display:flex;gap:1rem;align-items:flex-start;">
        <div style="width:92px;height:124px;flex:0 0 92px;border-radius:10px;background:#e2e8f0 ${coverUrl ? `url('${coverUrl}') center/cover no-repeat` : ''};"></div>
        <div style="min-width:0;flex:1;">
          <h3 style="margin:0 0 .25rem;word-break:break-word;">${esc(title)}</h3>
          ${subtitle ? `<div style="color:#475569;margin-bottom:.35rem;">${esc(subtitle)}</div>` : ''}
          <div style="color:#64748b;">by ${esc(author)}</div>
          <div style="display:flex;flex-wrap:wrap;gap:.45rem;margin-top:.65rem;">
            <span style="padding:4px 8px;border-radius:999px;background:#fff;border:1px solid #e2e8f0;font-size:.78rem;">${esc(category)}</span>
            <span style="padding:4px 8px;border-radius:999px;background:#fff;border:1px solid #e2e8f0;font-size:.78rem;">${esc(pages)} pages</span>
            <span style="padding:4px 8px;border-radius:999px;background:#fff;border:1px solid #e2e8f0;font-size:.78rem;">₹${esc(price)}</span>
            ${sale ? `<span style="padding:4px 8px;border-radius:999px;background:#fff;border:1px solid #e2e8f0;font-size:.78rem;">Sale ₹${esc(sale)}</span>` : ''}
          </div>
        </div>
      </div>
      <div style="margin-top:1rem;display:grid;gap:.7rem;">
        <div><strong>Description</strong><div style="color:#475569;white-space:pre-wrap;margin-top:4px;line-height:1.55;">${esc(description || '—')}</div></div>
        <div><strong>Tags</strong><div style="color:#475569;margin-top:4px;">${esc(tags || '—')}</div></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.7rem;">
          <div style="padding:.7rem;background:#fff;border:1px solid #e2e8f0;border-radius:10px;"><strong>PDF</strong><div style="font-size:.8rem;color:#64748b;word-break:break-word;margin-top:3px;">${esc(pdf?.name || 'Not selected')} · ${pdf ? (pdf.size / 1048576).toFixed(2) : '0'} MB</div></div>
          <div style="padding:.7rem;background:#fff;border:1px solid #e2e8f0;border-radius:10px;"><strong>Cover</strong><div style="font-size:.8rem;color:#64748b;word-break:break-word;margin-top:3px;">${esc(cover?.name || 'Not selected')} · ${cover ? (cover.size / 1048576).toFixed(2) : '0'} MB</div></div>
        </div>
      </div>`;
    const progress = document.getElementById('upload-progress-box');
    section.insertBefore(card, progress || section.querySelector('div:last-child'));
  }

  function validate() {
    const pdf = document.getElementById('pub-pdf')?.files?.[0];
    const cover = document.getElementById('pub-cover')?.files?.[0];
    const title = value('pub-title');
    const author = value('pub-author');
    const category = value('pub-category');
    const description = value('pub-description');
    const pages = number('pub-pages');
    const price = number('pub-price');
    const saleRaw = value('pub-saleprice');
    const sale = saleRaw === '' ? null : Number(saleRaw);
    if (title.length < 3) throw new Error('Please enter a valid eBook title.');
    if (!author) throw new Error('Please enter the author name.');
    if (!category) throw new Error('Please select a category.');
    if (description.length < 20) throw new Error('Description must contain at least 20 characters.');
    if (!pdf) throw new Error('Please select your PDF eBook.');
    if (!pdf.name.toLowerCase().endsWith('.pdf') && pdf.type !== 'application/pdf') throw new Error('Only PDF files are supported.');
    if (!cover) throw new Error('Please select the eBook cover image.');
    if (cover.size > MAX_COVER_MB * 1024 * 1024) throw new Error('Cover must be 5 MB or smaller.');
    if (!pages || pages < 1) throw new Error('PDF page count is required.');
    if (!price || price <= 0) throw new Error('Please enter a valid list price.');
    if (sale !== null && (!Number.isFinite(sale) || sale < 0 || sale > price)) throw new Error('Please enter a valid sale price.');
    return { pdf, cover, title, subtitle: value('pub-subtitle'), author, category, description, tags: value('pub-tags').split(',').map(x => x.trim()).filter(Boolean), pages, price, salePrice: sale };
  }

  async function startDirect(file, kind) {
    const data = await api('/api/books/upload-direct-session/start', {
      method: 'POST',
      body: JSON.stringify({ name: file.name, mimeType: kind === 'pdf' ? 'application/pdf' : file.type, size: file.size, kind })
    });
    if (!data.upload_url) throw new Error('Google Drive did not return a direct upload URL.');
    return data.upload_url;
  }

  function putWholeFile(uploadUrl, file, label, progress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText || '{}')); } catch (_) { resolve({}); }
          return;
        }
        reject(new Error(`${label} upload failed (${xhr.status}).`));
      };
      xhr.onerror = () => reject(new Error(`${label} could not connect directly to Google Drive. Please retry.`));
      xhr.onabort = () => reject(new Error(`${label} upload was cancelled.`));
      xhr.upload.onprogress = event => {
        if (event.lengthComputable) progress(event.loaded / event.total);
      };
      // Do not add Authorization here. The resumable session URL returned by
      // Render is the capability for this single Drive upload request.
      xhr.send(file);
    });
  }

  async function finalize(fileId) {
    const data = await api('/api/books/upload-direct-session/finalize', { method: 'POST', body: JSON.stringify({ file_id: fileId }) });
    if (!data.file?.id) throw new Error('Google Drive file finalization failed.');
    return data.file;
  }

  async function saveFirestore(book, input, pdfFile, coverFile) {
    const auth = window.firebase?.auth?.();
    const user = auth?.currentUser;
    const db = window.firebase?.firestore?.();
    if (!user || !db) throw new Error('Firebase is not ready. The Drive upload completed, but metadata could not be saved.');
    const bookId = String(book?.id || book?.bookId || '').trim();
    if (!bookId) throw new Error('The server did not return a stable book ID.');
    const now = new Date().toISOString();
    const safe = v => v === undefined || v === null ? '' : v;
    const metadata = {
      id: bookId, bookId,
      slug: safe(book.slug || bookId),
      title: input.title, subtitle: input.subtitle, author: input.author,
      description: input.description, category: input.category, categoryId: safe(book.category_id || book.categoryId),
      tags: input.tags, pages: input.pages, format: 'PDF', language: safe(book.language || 'English'),
      price: input.price, salePrice: input.salePrice, sale_price: input.salePrice,
      coverUrl: safe(coverFile.url || coverFile.webViewLink || coverFile.downloadUrl),
      cover_url: safe(coverFile.url || coverFile.webViewLink || coverFile.downloadUrl),
      coverDriveFileId: safe(coverFile.id), coverFileId: safe(coverFile.id), cover_file_id: safe(coverFile.id),
      pdfUrl: safe(pdfFile.url || pdfFile.webViewLink || pdfFile.downloadUrl),
      pdf_url: safe(pdfFile.url || pdfFile.webViewLink || pdfFile.downloadUrl),
      driveFileId: safe(pdfFile.id), pdfFileId: safe(pdfFile.id), pdf_file_id: safe(pdfFile.id),
      sourceType: 'internal', source_type: 'internal',
      creatorId: safe(book.creator_id || book.creatorId), creator_id: safe(book.creator_id || book.creatorId),
      creatorUid: user.uid, firebaseUid: user.uid,
      sellerId: safe(book.seller_id || book.sellerId || book.creator_id), seller_id: safe(book.seller_id || book.sellerId || book.creator_id),
      sellerName: safe(book.seller_name || book.sellerName || input.author), seller_name: safe(book.seller_name || book.sellerName || input.author),
      status: 'pending', isFeatured: false, is_featured: false, isTrending: false, is_trending: false,
      isBestseller: false, is_bestseller: false, isNew: true, is_new: true,
      rating: 0, reviewCount: 0, review_count: 0,
      createdAt: book.createdAt || book.created_at || now, created_at: book.created_at || book.createdAt || now,
      updatedAt: now, updated_at: now, backendBookId: bookId, backendSynced: true,
      metadataSource: 'firestore', driveStorage: 'files-only'
    };
    await db.collection('books').doc(bookId).set(metadata, { merge: true });
    return metadata;
  }

  async function submit(form) {
    const input = validate();
    const button = document.getElementById('submit-pub-btn');
    if (button) button.disabled = true;
    injectReviewDetails();
    try {
      setProgress('Creating secure Google Drive sessions...', 1, 'PDF and cover will upload directly to Drive.');
      const [pdfSession, coverSession] = await Promise.all([startDirect(input.pdf, 'pdf'), startDirect(input.cover, 'cover')]);
      const total = input.pdf.size + input.cover.size;
      let pdfPct = 0, coverPct = 0;
      const update = () => setProgress('Uploading directly to Google Drive...', ((pdfPct * input.pdf.size + coverPct * input.cover.size) / total) * 100, 'One direct request per file — no base64 and no browser chunks.');
      update();
      const [pdfRaw, coverRaw] = await Promise.all([
        putWholeFile(pdfSession, input.pdf, 'PDF', p => { pdfPct = p; update(); }),
        putWholeFile(coverSession, input.cover, 'Cover', p => { coverPct = p; update(); })
      ]);
      setProgress('Finalizing Google Drive files...', 96, 'Getting the permanent Drive URLs.');
      const pdfFile = await finalize(pdfRaw.id || pdfRaw.fileId || pdfRaw.file_id);
      const coverFile = await finalize(coverRaw.id || coverRaw.fileId || coverRaw.file_id);
      setProgress('Sending eBook to Admin Review...', 98, 'Saving the complete listing to Firebase.');

      const createPayload = {
        action: 'createBook', title: input.title, subtitle: input.subtitle, author: input.author,
        category: input.category, description: input.description, tags: input.tags, pages: input.pages,
        format: 'PDF', price: input.price, sale_price: input.salePrice,
        cover_url: coverFile.url || coverFile.webViewLink || coverFile.downloadUrl || '',
        pdf_url: pdfFile.url || pdfFile.webViewLink || pdfFile.downloadUrl || '',
        cover_file_id: coverFile.id, pdf_file_id: pdfFile.id, status: 'pending'
      };
      const bookResponse = await api('/api/books/create', { method: 'POST', body: JSON.stringify(createPayload) });
      if (!bookResponse.book) throw new Error('Book listing was not returned by the server.');
      await saveFirestore(bookResponse.book, input, pdfFile, coverFile);
      setProgress('Submitted for Admin Review ✓', 100, 'Your complete book details are saved in Firebase with status Pending.');
      if (button) button.textContent = 'Submitted ✓';
      if (window.Toast?.show) window.Toast.show('eBook submitted successfully for admin review!', 'success');
      else if (window.BookoraToast?.show) window.BookoraToast.show('eBook submitted successfully for admin review!', 'success');
      await sleep(1200);
      window.location.hash = '#/creator/dashboard';
    } catch (error) {
      console.error('[Bookora direct publish]', error);
      if (button) button.disabled = false;
      setProgress('Upload failed — Retry', 0, error?.message || 'Please try again.');
      if (window.Toast?.show) window.Toast.show(error?.message || 'Unable to publish eBook.', 'error');
      else alert(error?.message || 'Unable to publish eBook.');
    }
  }

  function install(form) {
    if (!form || installed.has(form)) return;
    installed.add(form);
    form.addEventListener('submit', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      injectReviewDetails();
      submit(form);
    }, true);
    const step5Observer = new MutationObserver(() => {
      if (document.getElementById('step-5')?.style.display !== 'none') injectReviewDetails();
    });
    step5Observer.observe(form, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
  }

  const scan = () => install(document.getElementById('publish-wizard-form'));
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  scan();
})();
