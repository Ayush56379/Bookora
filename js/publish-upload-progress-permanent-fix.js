/* Bookora publish submit + progress permanent fix v6.
 * Owns the Step 5 submit interaction so duplicate/early listeners cannot swallow the click.
 * Uses the selected browser files directly, authenticated Firebase ID tokens, the existing
 * direct-upload backend, and then creates the pending admin-review listing.
 */
(() => {
  if (window.__BOOKORA_PUBLISH_SUBMIT_V6__) return;
  window.__BOOKORA_PUBLISH_SUBMIT_V6__ = true;

  const MB = 1048576;
  const API = String(window.BOOKORA_API_URL || 'https://bookora-backend-x08l.onrender.com').replace(/\/$/, '');
  const MAX_COVER_MB = 5;
  let busy = false;

  const isPublish = () => ['#/publish', '#/publish/'].includes((location.hash || '').split('?')[0]);
  const fileOf = id => document.getElementById(id)?.files?.[0] || null;
  const value = (id, fallback = '') => document.getElementById(id)?.value?.trim() || fallback;
  const number = (id, fallback = 0) => { const n = Number(document.getElementById(id)?.value); return Number.isFinite(n) ? n : fallback; };
  const fmt = bytes => `${(Math.max(0, Number(bytes) || 0) / MB).toFixed(2)} MB`;

  function ui(text, percent = null, detail = '') {
    const box = document.getElementById('upload-progress-box');
    const label = document.getElementById('upload-progress-label');
    const fill = document.getElementById('upload-progress-fill');
    const button = document.getElementById('submit-pub-btn');
    if (box) box.style.display = 'block';
    if (label) label.innerHTML = `<strong>${text}</strong>${detail ? `<span style="display:block;color:#64748b;font-size:.8rem;margin-top:4px">${detail}</span>` : ''}`;
    if (fill && Number.isFinite(percent)) fill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    if (button) button.textContent = text;
  }

  function ensureDetails(pdf, cover, loadedPdf = 0, loadedCover = 0, speed = 0) {
    const box = document.getElementById('upload-progress-box');
    if (!box) return;
    let details = document.getElementById('upload-live-details');
    if (!details) {
      details = document.createElement('div');
      details.id = 'upload-live-details';
      details.style.cssText = 'display:grid;gap:8px;margin-top:14px;';
      box.appendChild(details);
    }
    const total = pdf.size + cover.size;
    const loaded = loadedPdf + loadedCover;
    details.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:12px;font-size:.82rem;color:#334155"><span>eBook</span><strong>${fmt(loadedPdf)} / ${fmt(pdf.size)}</strong></div>
      <div style="height:7px;background:#e2e8f0;border-radius:999px;overflow:hidden"><div style="height:100%;width:${pdf.size ? Math.min(100, loadedPdf / pdf.size * 100) : 0}%;background:var(--accent);transition:width .15s linear"></div></div>
      <div style="display:flex;justify-content:space-between;gap:12px;font-size:.82rem;color:#334155"><span>Cover</span><strong>${fmt(loadedCover)} / ${fmt(cover.size)}</strong></div>
      <div style="height:7px;background:#e2e8f0;border-radius:999px;overflow:hidden"><div style="height:100%;width:${cover.size ? Math.min(100, loadedCover / cover.size * 100) : 0}%;background:var(--accent);transition:width .15s linear"></div></div>
      <div style="display:flex;justify-content:space-between;gap:12px;font-size:.78rem;color:#64748b"><span>Total uploaded</span><strong>${fmt(loaded)} / ${fmt(total)}</strong></div>
      ${speed > 0 ? `<div style="font-size:.78rem;color:#64748b">Speed: <strong>${speed >= MB ? (speed / MB).toFixed(2) + ' MB/s' : (speed / 1024).toFixed(0) + ' KB/s'}</strong></div>` : ''}`;
  }

  function toast(message, type = 'error') {
    try { window.Toast?.show?.(message, type); } catch (_) {}
  }

  async function firebaseToken(force = false) {
    const auth = window.firebase?.auth?.();
    if (!auth) throw new Error('Sign-in is still loading. Please try again.');
    let user = auth.currentUser;
    if (!user) {
      user = await new Promise(resolve => {
        let done = false, unsub = null;
        const finish = u => { if (done) return; done = true; try { unsub?.(); } catch (_) {} resolve(u || null); };
        try { unsub = auth.onAuthStateChanged(finish); } catch (_) { finish(null); }
        setTimeout(() => finish(auth.currentUser || null), 12000);
      });
    }
    if (!user) throw new Error('Please sign in before submitting your eBook.');
    const token = await user.getIdToken(!!force);
    if (!token) throw new Error('Your sign-in session has expired. Please sign in again.');
    return { user, token };
  }

  async function request(path, options = {}, retries = 2) {
    let last = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const { token } = await firebaseToken(attempt > 0);
        const headers = new Headers(options.headers || {});
        headers.set('Authorization', `Bearer ${token}`);
        headers.set('Accept', 'application/json');
        if (options.body !== undefined && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 60000);
        let response;
        try { response = await fetch(`${API}${path}`, { ...options, headers, signal: controller.signal }); }
        finally { clearTimeout(timer); }
        let data = {};
        try { data = await response.json(); } catch (_) {}
        if (response.ok && data?.success !== false) return data;
        const error = new Error(data?.error || `Request failed (${response.status}).`);
        error.status = response.status;
        if (response.status === 401 && attempt < retries) { last = error; continue; }
        throw error;
      } catch (error) {
        last = error;
        if (attempt < retries && (!error?.status || error.status >= 500)) await new Promise(r => setTimeout(r, 900 * (attempt + 1)));
        else if (attempt >= retries) break;
      }
    }
    throw last || new Error('Unable to connect to the publishing service.');
  }

  async function startSession(file, kind) {
    const data = await request('/api/books/upload-direct-session/start', { method: 'POST', body: JSON.stringify({ name: file.name, mimeType: kind === 'pdf' ? 'application/pdf' : (file.type || 'application/octet-stream'), size: file.size, kind }) });
    if (!data?.upload_url) throw new Error('Upload could not be started. Please retry.');
    return data.upload_url;
  }

  function put(url, file, kind, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url, true);
      xhr.timeout = 15 * 60 * 1000;
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          let data = {};
          try { data = JSON.parse(xhr.responseText || '{}'); } catch (_) {}
          resolve(data);
        } else reject(new Error(`${kind === 'pdf' ? 'eBook' : 'Cover'} upload failed (HTTP ${xhr.status}).`));
      };
      xhr.onerror = () => reject(new Error('Upload connection was interrupted. Please retry.'));
      xhr.ontimeout = () => reject(new Error('Upload took too long. Please retry.'));
      xhr.upload.onprogress = event => { if (event.lengthComputable) onProgress(event.loaded, event.total || file.size); };
      xhr.send(file);
    });
  }

  async function finalize(fileId) {
    if (!fileId) throw new Error('Uploaded file could not be finalized.');
    const data = await request('/api/books/upload-direct-session/finalize', { method: 'POST', body: JSON.stringify({ file_id: fileId }) });
    if (!data?.file?.id) throw new Error('Uploaded file could not be finalized.');
    return data.file;
  }

  async function persistFirestore(book, input, pdfFile, coverFile, user) {
    try {
      const db = window.firebase?.firestore?.();
      if (!db || !user || !book?.id) return;
      const id = String(book.id);
      const now = new Date().toISOString();
      await db.collection('books').doc(id).set({
        id, bookId: id, slug: book.slug || id,
        title: input.title, subtitle: input.subtitle, author: input.author,
        description: input.description, category: input.category, tags: input.tags,
        pages: input.pages, format: 'PDF', price: input.price, salePrice: input.salePrice,
        sale_price: input.salePrice,
        coverUrl: coverFile.url || coverFile.webViewLink || coverFile.downloadUrl || '',
        cover_url: coverFile.url || coverFile.webViewLink || coverFile.downloadUrl || '',
        coverFileId: coverFile.id || '', cover_file_id: coverFile.id || '',
        pdfUrl: pdfFile.url || pdfFile.webViewLink || pdfFile.downloadUrl || '',
        pdf_url: pdfFile.url || pdfFile.webViewLink || pdfFile.downloadUrl || '',
        driveFileId: pdfFile.id || '', pdfFileId: pdfFile.id || '', pdf_file_id: pdfFile.id || '',
        sourceType: 'internal', source_type: 'internal',
        creatorId: book.creator_id || book.creatorId || '', creator_id: book.creator_id || book.creatorId || '',
        creatorUid: user.uid, firebaseUid: user.uid,
        sellerId: book.seller_id || book.sellerId || book.creator_id || '', seller_id: book.seller_id || book.sellerId || book.creator_id || '',
        sellerName: book.seller_name || book.sellerName || input.author, seller_name: book.seller_name || book.sellerName || input.author,
        status: 'pending', isNew: true, is_new: true, rating: 0, reviewCount: 0, review_count: 0,
        createdAt: book.createdAt || book.created_at || now, created_at: book.created_at || book.createdAt || now,
        updatedAt: now, updated_at: now, backendBookId: id, backendSynced: true, metadataSource: 'firestore'
      }, { merge: true });
    } catch (error) {
      console.warn('[Bookora publish] optional Firestore mirror skipped:', error);
    }
  }

  async function submit() {
    if (!isPublish() || busy) return;
    busy = true;
    const button = document.getElementById('submit-pub-btn');
    if (button) button.disabled = true;
    try {
      const pdf = fileOf('pub-pdf');
      const cover = fileOf('pub-cover');
      if (!pdf) throw new Error('Please select your PDF eBook.');
      if (!cover) throw new Error('Please select the eBook cover.');
      if (cover.size > MAX_COVER_MB * MB) throw new Error('Cover must be 5 MB or smaller.');
      const title = value('pub-title');
      const author = value('pub-author');
      const category = value('pub-category');
      const description = value('pub-description');
      const pages = number('pub-pages');
      const price = number('pub-price');
      const saleRaw = value('pub-saleprice');
      const salePrice = saleRaw === '' ? null : Number(saleRaw);
      if (title.length < 3) throw new Error('Please enter a valid eBook title.');
      if (!author) throw new Error('Please enter the author name.');
      if (!category) throw new Error('Please select a category.');
      if (description.length < 20) throw new Error('Description must contain at least 20 characters.');
      if (!pages || pages < 1) throw new Error('PDF page count is required.');
      if (!price || price <= 0) throw new Error('Please enter a valid list price.');
      if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice < 0 || salePrice > price)) throw new Error('Please enter a valid sale price.');

      const total = pdf.size + cover.size;
      let pdfLoaded = 0, coverLoaded = 0;
      const started = Date.now();
      const progress = stage => {
        const loaded = pdfLoaded + coverLoaded;
        const pct = total ? (loaded / total) * 100 : 0;
        const speed = loaded / Math.max(.25, (Date.now() - started) / 1000);
        ensureDetails(pdf, cover, pdfLoaded, coverLoaded, speed);
        ui(stage, pct, `${fmt(loaded)} / ${fmt(total)} uploaded`);
      };

      ensureDetails(pdf, cover, 0, 0, 0);
      ui('Preparing upload…', 1, `0.00 MB / ${fmt(total)} uploaded`);
      const { user } = await firebaseToken(false);
      ui('Preparing eBook upload…', 2, `0.00 MB / ${fmt(total)} uploaded`);
      const pdfSession = await startSession(pdf, 'pdf');
      progress('Uploading eBook…');
      const pdfRaw = await put(pdfSession, pdf, 'pdf', (loaded) => { pdfLoaded = loaded; progress('Uploading eBook…'); });
      pdfLoaded = pdf.size;
      progress('eBook uploaded ✓');

      ui('Preparing cover upload…', (pdf.size / total) * 100, `${fmt(pdf.size)} / ${fmt(total)} uploaded`);
      const coverSession = await startSession(cover, 'cover');
      const coverRaw = await put(coverSession, cover, 'cover', (loaded) => { coverLoaded = loaded; progress('Uploading cover…'); });
      coverLoaded = cover.size;
      progress('Files uploaded ✓');

      const pdfId = pdfRaw.id || pdfRaw.fileId || pdfRaw.file_id;
      const coverId = coverRaw.id || coverRaw.fileId || coverRaw.file_id;
      const [pdfFile, coverFile] = await Promise.all([finalize(pdfId), finalize(coverId)]);

      ui('Submitting for review…', 97, `${fmt(total)} / ${fmt(total)} uploaded`);
      const keyName = 'bookora_publish_idempotency_v2';
      let idempotency = '';
      try { idempotency = sessionStorage.getItem(keyName) || ''; } catch (_) {}
      if (!idempotency) { idempotency = `publish-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`; try { sessionStorage.setItem(keyName, idempotency); } catch (_) {} }
      const payload = {
        action: 'createBook', title, subtitle: value('pub-subtitle'), author, category, description,
        tags: value('pub-tags').split(',').map(x => x.trim()).filter(Boolean), pages, format: 'PDF', price,
        sale_price: salePrice, cover_url: coverFile.url || coverFile.webViewLink || coverFile.downloadUrl || '',
        pdf_url: pdfFile.url || pdfFile.webViewLink || pdfFile.downloadUrl || '', cover_file_id: coverFile.id,
        pdf_file_id: pdfFile.id, status: 'pending', idempotency_key: idempotency, publish_idempotency_key: idempotency
      };
      const response = await request('/api/books/create', { method: 'POST', body: JSON.stringify(payload) }, 2);
      if (!response?.book) throw new Error('Your eBook could not be submitted. Please retry.');
      await persistFirestore(response.book, { ...payload, salePrice }, pdfFile, coverFile, user);
      try { sessionStorage.removeItem(keyName); } catch (_) {}
      ensureDetails(pdf, cover, pdf.size, cover.size, 0);
      ui('Submitted successfully ✓', 100, `${fmt(total)} uploaded · Your eBook has been sent for admin review.`);
      toast('eBook submitted successfully for admin review!', 'success');
      if (button) button.textContent = 'Submitted ✓';
      setTimeout(() => { if (isPublish()) window.location.hash = '#/creator/dashboard'; }, 1000);
    } catch (error) {
      console.error('[Bookora publish submit]', error);
      if (button) { button.disabled = false; button.textContent = 'Retry Upload & Submit'; }
      ui('Submission failed — Retry', 0, String(error?.message || 'Something went wrong. Your files are still selected.'));
      toast(error?.message || 'Unable to submit the eBook.', 'error');
    } finally {
      busy = false;
    }
  }

  function intercept(event) {
    const target = event.target?.closest?.('#submit-pub-btn');
    if (!target || !isPublish()) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    void submit();
  }

  // Capture at document level so the publish module's older form listener cannot
  // swallow the button click before the reliable uploader receives it.
  document.addEventListener('click', intercept, true);
  document.addEventListener('submit', event => {
    if (!isPublish() || !event.target?.matches?.('#publish-wizard-form')) return;
    event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
    void submit();
  }, true);

  function patchFileSizes() {
    if (!isPublish()) return;
    const pdf = fileOf('pub-pdf'), cover = fileOf('pub-cover');
    if (!pdf && !cover) return;
    const box = document.getElementById('upload-progress-box');
    const details = document.getElementById('upload-live-details');
    if (box && details && pdf && cover && !busy) ensureDetails(pdf, cover, 0, 0, 0);
    const button = document.getElementById('submit-pub-btn');
    const label = document.getElementById('upload-progress-label');
    if (button && pdf && /Preparing cover upload/i.test(button.textContent || '') && !busy) {
      button.textContent = 'Upload & Submit 🚀';
      if (label) label.innerHTML = `<strong>Ready to upload</strong><span style="display:block;color:#64748b;font-size:.8rem;margin-top:4px;">eBook: ${fmt(pdf.size)} · Cover: ${cover ? fmt(cover.size) : '—'}</span>`;
    }
  }

  const observer = new MutationObserver(patchFileSizes);
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  setInterval(patchFileSizes, 700);
  patchFileSizes();
})();
