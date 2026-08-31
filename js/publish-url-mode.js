import { state } from './state.js';

(function () {
  const PATCH_ID = 'bookora-publish-url-mode';
  const STYLE_ID = 'bookora-publish-url-mode-style';
  let patchedForm = null;
  let patchTimer = null;

  const $ = id => document.getElementById(id);
  const val = (id, fallback = '') => String($(id)?.value || '').trim() || fallback;
  const toast = (message, type = 'warning') => {
    try { window.Toast?.show?.(message, type); } catch (_) { console.warn(message); }
  };

  function isHttpUrl(value) {
    try {
      const u = new URL(String(value).trim());
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch (_) { return false; }
  }

  function driveId(value) {
    try {
      const u = new URL(String(value).trim());
      const m = u.pathname.match(/\/file\/d\/([^/]+)/i);
      if (m?.[1]) return m[1];
      const q = u.searchParams.get('id');
      if (q) return q;
      return '';
    } catch (_) { return ''; }
  }

  function usableUrl(value, kind) {
    const raw = String(value || '').trim();
    const id = driveId(raw);
    if (id) return kind === 'cover'
      ? `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`
      : `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
    return raw;
  }

  function addStyles() {
    if ($(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .publish-url-grid{display:grid;grid-template-columns:1fr;gap:18px;margin-top:18px}
      .publish-url-card{border:1px solid #e2e8f0;border-radius:16px;background:#fff;padding:18px;box-shadow:0 3px 14px rgba(15,23,42,.04)}
      .publish-url-card h3{margin:0 0 6px;color:#0f172a;font-size:16px}
      .publish-url-card p{margin:0 0 12px;color:#64748b;font-size:12px;line-height:1.55}
      .publish-url-card input{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:11px;padding:13px 14px;font:inherit;color:#0f172a;background:#fff;outline:none}
      .publish-url-card input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.10)}
      .publish-url-help{margin-top:8px;font-size:11px;color:#64748b}
      .publish-url-status{margin-top:9px;min-height:17px;font-size:11px;font-weight:700;color:#64748b}
      .publish-url-status.ok{color:#15803d}.publish-url-status.bad{color:#b91c1c}
      .publish-cover-preview{display:flex;gap:14px;align-items:center;margin-top:13px;padding:10px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc}
      .publish-cover-preview img{width:64px;height:84px;object-fit:cover;border-radius:7px;background:#e2e8f0;display:none}
      .publish-cover-preview img.ready{display:block}.publish-cover-preview span{font-size:11px;color:#64748b;line-height:1.45}
      .publish-url-note{margin-top:16px;padding:13px 15px;border:1px solid #dbeafe;border-radius:12px;background:#eff6ff;color:#334155;font-size:11px;line-height:1.55}
      .publish-url-note b{color:#1d4ed8}
      .publish-url-actions{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-top:18px}
      @media(max-width:700px){.publish-url-actions{flex-direction:column-reverse;align-items:stretch}.publish-url-actions button{width:100%}}
    `;
    document.head.appendChild(s);
  }

  function inputMarkup() {
    return `
      <div class="publish-url-grid" id="publish-url-inputs">
        <div class="publish-url-card">
          <h3>eBook PDF URL <i>*</i></h3>
          <p>Upload your PDF to your own file storage, make it accessible, then paste its shareable URL here. Bookora will store the URL only.</p>
          <input id="pub-pdf-url" type="url" inputmode="url" autocomplete="url" placeholder="Paste your eBook PDF URL" aria-label="eBook PDF URL" required>
          <div class="publish-url-help">HTTPS links are recommended. A shareable Google Drive file link is also accepted.</div>
          <div id="pub-pdf-url-status" class="publish-url-status">Required</div>
        </div>
        <div class="publish-url-card">
          <h3>Cover Image URL <i>*</i></h3>
          <p>Upload your cover image to your own image/file storage, make it accessible, then paste its shareable URL here.</p>
          <input id="pub-cover-url" type="url" inputmode="url" autocomplete="url" placeholder="Paste your cover image URL" aria-label="Cover Image URL" required>
          <div class="publish-cover-preview"><img id="pub-cover-url-preview" alt="Cover preview"><span id="pub-cover-url-preview-text">Cover preview will appear here after you enter a valid image URL.</span></div>
          <div id="pub-cover-url-status" class="publish-url-status">Required</div>
        </div>
      </div>
      <div class="page-count-row">
        <div class="field"><label for="pub-pages">PDF Page Count <i>*</i></label><input id="pub-pages" type="number" min="1" placeholder="Enter page count"></div>
      </div>
      <div class="publish-url-note"><b>No file upload:</b> Bookora does not upload or copy your PDF or cover. Only the URLs and book metadata are saved to the existing Firebase <code>books</code> record.</div>
    `;
  }

  function setStatus(id, message, ok = false) {
    const el = $(id); if (!el) return;
    el.textContent = message;
    el.className = `publish-url-status ${ok ? 'ok' : message === 'Required' ? '' : 'bad'}`;
  }

  function validateUrls(showToast = true) {
    const pdf = val('pub-pdf-url');
    const cover = val('pub-cover-url');
    const pages = Number($('pub-pages')?.value || 0);
    if (!pdf) { if (showToast) toast('Please paste your eBook PDF URL.'); return false; }
    if (!isHttpUrl(pdf)) { if (showToast) toast('Please enter a valid PDF URL.'); return false; }
    if (!cover) { if (showToast) toast('Please paste your cover image URL.'); return false; }
    if (!isHttpUrl(cover)) { if (showToast) toast('Please enter a valid cover image URL.'); return false; }
    if (!(pages >= 1)) { if (showToast) toast('PDF page count is required.'); return false; }
    return true;
  }

  function updateUrlStatuses() {
    const pdf = val('pub-pdf-url');
    const cover = val('pub-cover-url');
    setStatus('pub-pdf-url-status', !pdf ? 'Required' : isHttpUrl(pdf) ? 'Valid URL ✓' : 'Enter a valid http/https URL', !!pdf && isHttpUrl(pdf));
    setStatus('pub-cover-url-status', !cover ? 'Required' : isHttpUrl(cover) ? 'Checking image URL…' : 'Enter a valid http/https URL', !!cover && isHttpUrl(cover));
    const img = $('pub-cover-url-preview');
    const text = $('pub-cover-url-preview-text');
    if (img) {
      img.classList.remove('ready');
      img.removeAttribute('src');
      if (isHttpUrl(cover)) {
        img.onload = () => { img.classList.add('ready'); if (text) text.textContent = 'Cover image loaded successfully.'; setStatus('pub-cover-url-status','Image URL ready ✓',true); };
        img.onerror = () => { if (text) text.textContent = 'Cover could not be loaded. Check that the file is publicly accessible.'; setStatus('pub-cover-url-status','Cover image could not be loaded',false); };
        img.src = usableUrl(cover, 'cover');
      } else if (text) text.textContent = 'Cover preview will appear here after you enter a valid image URL.';
    }
  }

  function showStep(target) {
    const n = Math.max(1, Math.min(5, Number(target) || 1));
    for (let i = 1; i <= 5; i++) {
      const section = $(`step-${i}`); if (!section) continue;
      const active = i === n;
      section.hidden = !active;
      section.setAttribute('aria-hidden', active ? 'false' : 'true');
      section.style.setProperty('display', active ? 'block' : 'none', 'important');
    }
    document.querySelectorAll('.publish-steps-top .top-step').forEach((el, i) => el.classList.toggle('active', i === n - 1));
    if (n === 4) updatePreview();
    if (n === 5) {
      const title = val('pub-title','Your eBook');
      $('submit-review-title')?.replaceChildren(document.createTextNode(title));
      $('publish-status-text')?.replaceChildren(document.createTextNode('Ready to save PDF URL + cover URL + book metadata directly to Firebase.'));
    }
    document.getElementById(`step-${n}`)?.scrollIntoView({behavior:'auto',block:'start'});
  }

  function updatePreview() {
    const cover = val('pub-cover-url');
    const img = $('v2-preview-cover');
    if (img) {
      img.hidden = !isHttpUrl(cover);
      if (isHttpUrl(cover)) img.src = usableUrl(cover, 'cover'); else img.removeAttribute('src');
    }
    $('v2-preview-cover-empty')?.toggleAttribute('hidden', isHttpUrl(cover));
    const pdfNote = $('v2-preview-pdf-url');
    if (pdfNote) pdfNote.textContent = val('pub-pdf-url') || '—';
  }

  function authUser() {
    const auth = window.firebase?.auth?.();
    if (!auth) return Promise.reject(new Error('Firebase is not ready. Please try again.'));
    if (auth.currentUser) return Promise.resolve(auth.currentUser);
    return new Promise((resolve,reject) => {
      let finished = false, unsub;
      const done = u => { if (finished) return; finished = true; try { unsub?.(); } catch (_) {} u ? resolve(u) : reject(new Error('Please sign in again to publish your eBook.')); };
      try { unsub = auth.onAuthStateChanged(done); } catch (_) { done(null); }
      setTimeout(() => done(auth.currentUser || null), 12000);
    });
  }

  function formInput() {
    return {
      title: val('pub-title'),
      subtitle: val('pub-subtitle'),
      author: val('pub-author'),
      category: val('pub-category'),
      description: val('pub-description'),
      tags: val('pub-tags').split(',').map(x => x.trim()).filter(Boolean),
      pages: Number($('pub-pages')?.value || 0),
      price: Number($('pub-price')?.value || 0),
      sale_price: val('pub-saleprice') === '' ? null : Number(val('pub-saleprice')),
      pdfUrl: val('pub-pdf-url'),
      coverUrl: val('pub-cover-url')
    };
  }

  async function saveDirectlyToFirebase() {
    if (!validateUrls(true)) return;
    if (!state.isAuthenticated || (!state.isSeller && !state.isAdmin)) {
      toast('Please sign in with an approved seller account to publish.', 'error');
      return;
    }
    const user = await authUser();
    const db = window.firebase?.firestore?.();
    if (!db) throw new Error('Firebase Firestore is not ready. Please try again.');

    const input = formInput();
    if (!(input.price > 0) || !Number.isFinite(input.price)) throw new Error('Please enter a valid list price.');
    if (input.sale_price !== null && (!Number.isFinite(input.sale_price) || input.sale_price < 0 || input.sale_price > input.price)) throw new Error('Sale price must be between ₹0 and the list price.');

    const id = `book_${user.uid}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const now = new Date().toISOString();
    const data = {
      id, bookId:id,
      title:input.title, subtitle:input.subtitle, author:input.author,
      description:input.description, category:input.category, tags:input.tags,
      pages:input.pages, pageCount:input.pages, format:'PDF',
      price:input.price, salePrice:input.sale_price, sale_price:input.sale_price,
      coverUrl:input.coverUrl, cover_url:input.coverUrl,
      pdfUrl:input.pdfUrl, pdf_url:input.pdfUrl,
      coverResolvedUrl:usableUrl(input.coverUrl,'cover'),
      pdfResolvedUrl:usableUrl(input.pdfUrl,'pdf'),
      coverSource:'external_url', pdfSource:'external_url',
      creatorId:user.uid, creator_id:user.uid, creatorUid:user.uid,
      sellerId:user.uid, seller_id:user.uid, sellerUid:user.uid,
      publisherId:user.uid, publisherEmail:user.email || '',
      firebaseUid:user.uid,
      status:'pending', reviewStatus:'pending', review_status:'pending',
      isNew:true, is_new:true,
      createdAt:now, created_at:now, updatedAt:now, updated_at:now,
      metadataSource:'firebase_direct', driveStorage:'external_url',
      backendSynced:false, directFirebasePublish:true
    };

    await db.collection('books').doc(id).set(data, {merge:true});
    return { id, data };
  }

  function replaceButton(button, handler) {
    if (!button) return null;
    const clone = button.cloneNode(true);
    button.replaceWith(clone);
    clone.addEventListener('click', e => { e.preventDefault(); handler(e); });
    return clone;
  }

  function patchForm(form) {
    if (!form || form.dataset[PATCH_ID] === '1') return;
    form.dataset[PATCH_ID] = '1';
    patchedForm = form;
    addStyles();

    const step2 = $('step-2');
    if (!step2) return;
    const heading = step2.querySelector('.section-heading h2');
    const desc = step2.querySelector('.section-heading p');
    if (heading) heading.textContent = 'PDF & Cover URLs';
    if (desc) desc.textContent = 'Paste your externally hosted PDF and cover URLs. Bookora will save the links directly to Firebase.';
    step2.querySelector('.upload-order-note')?.remove();
    step2.querySelector('.upload-grid')?.remove();
    step2.querySelector('.file-policy')?.remove();
    step2.querySelector('.page-count-row')?.remove();
    const oldUrl = $('publish-url-inputs'); oldUrl?.remove();
    const oldNote = step2.querySelector('.publish-url-note'); oldNote?.remove();
    const anchor = step2.querySelector('.v2-actions');
    const wrapper = document.createElement('div'); wrapper.innerHTML = inputMarkup();
    anchor ? step2.insertBefore(wrapper.firstElementChild, anchor) : step2.appendChild(wrapper.firstElementChild);
    const note = wrapper.firstElementChild;
    if (note) anchor ? step2.insertBefore(note, anchor) : step2.appendChild(note);

    $('pub-pdf-url')?.addEventListener('input', updateUrlStatuses);
    $('pub-cover-url')?.addEventListener('input', updateUrlStatuses);

    const next2 = step2.querySelector('.v2-next[data-next="3"]');
    replaceButton(next2, () => { if (validateUrls(true)) showStep(3); });

    document.querySelectorAll('.v2-prev').forEach(btn => {
      const prev = Number(btn.dataset.prev);
      replaceButton(btn, () => showStep(prev));
    });
    document.querySelectorAll('.v2-next').forEach(btn => {
      const next = Number(btn.dataset.next);
      if (next === 3) return;
      replaceButton(btn, () => {
        if (next === 2) showStep(2);
        else if (next === 4) {
          if (!validateUrls(true)) { showStep(2); return; }
          showStep(4);
        } else if (next === 5) showStep(5);
      });
    });

    const submit = $('submit-pub-btn');
    replaceButton(submit, async () => {
      const b = $('submit-pub-btn');
      if (!b || b.disabled) return;
      if (!validateUrls(true)) { showStep(2); return; }
      b.disabled = true; b.setAttribute('aria-busy','true'); b.textContent = 'Saving to Firebase…';
      const success = $('publish-success'), failure = $('publish-failure');
      success?.setAttribute('hidden',''); failure?.setAttribute('hidden','');
      try {
        const result = await saveDirectlyToFirebase();
        $('publish-progress-label')?.replaceChildren(document.createTextNode('Firebase record created ✓'));
        $('publish-progress-percent')?.replaceChildren(document.createTextNode('100%'));
        const fill = $('publish-progress-fill'); if (fill) fill.style.width = '100%';
        $('publish-stage-1')?.classList.add('done'); $('publish-stage-2')?.classList.add('done'); $('publish-stage-3')?.classList.add('done'); $('publish-stage-4')?.classList.add('active');
        $('publish-success-title')?.replaceChildren(document.createTextNode(result.data.title));
        $('publish-success-detail')?.replaceChildren(document.createTextNode('Your eBook metadata, PDF URL and cover URL were saved directly to Firebase and submitted for admin review.'));
        success?.removeAttribute('hidden');
        b.textContent = 'Published to Firebase ✓';
        toast('eBook saved to Firebase and submitted for admin review.', 'success');
        setTimeout(() => { window.location.hash = '#/creator/dashboard'; }, 1600);
      } catch (error) {
        console.error('[Bookora direct Firebase publish]', error);
        b.disabled = false; b.removeAttribute('aria-busy'); b.textContent = 'Save & Submit for Review';
        $('publish-failure-message')?.replaceChildren(document.createTextNode(error?.message || 'Could not save the eBook to Firebase. Please retry.'));
        failure?.removeAttribute('hidden');
        toast(error?.message || 'Could not save the eBook to Firebase. Please retry.', 'error');
      }
    });

    form.addEventListener('submit', e => { e.preventDefault(); e.stopImmediatePropagation(); }, true);
    showStep(1);
  }

  function patch() {
    const shell = document.querySelector('.publish-v2-shell');
    const form = shell?.querySelector('#publish-wizard-form');
    if (!form) return;
    if (form !== patchedForm) {
      patchedForm = null;
      patchForm(form);
    }
  }

  function boot() {
    patch();
    const app = document.getElementById('app');
    if (app && !window[PATCH_ID]) {
      window[PATCH_ID] = true;
      const observer = new MutationObserver(() => {
        clearTimeout(patchTimer);
        patchTimer = setTimeout(patch, 20);
      });
      observer.observe(app, {childList:true,subtree:true});
      window.addEventListener('hashchange', () => setTimeout(patch, 30));
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
