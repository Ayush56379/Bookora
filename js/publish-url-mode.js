import { state } from './state.js';

(function () {
  const PATCH_ID = 'bookora-publish-url-mode-v2';
  const STYLE_ID = 'bookora-publish-url-mode-v2-style';
  let busy = false;
  let observer = null;

  const $ = id => document.getElementById(id);
  const val = (id, fallback = '') => String($(id)?.value || '').trim() || fallback;
  const toast = (message, type = 'warning') => {
    try { window.Toast?.show?.(message, type); } catch (_) { console.warn(message); }
  };
  const httpUrl = value => {
    try { const u = new URL(String(value || '').trim()); return u.protocol === 'http:' || u.protocol === 'https:'; }
    catch (_) { return false; }
  };
  const driveId = value => {
    try {
      const u = new URL(String(value || '').trim());
      const m = u.pathname.match(/\/file\/d\/([^/]+)/i);
      return m?.[1] || u.searchParams.get('id') || '';
    } catch (_) { return ''; }
  };
  const resolvedUrl = (value, kind) => {
    const raw = String(value || '').trim();
    const id = driveId(raw);
    if (!id) return raw;
    return kind === 'cover'
      ? `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`
      : `https://drive.google.com/uc?export=download&id=${encodeURIComponent(id)}`;
  };

  function addStyles() {
    if ($(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .publish-url-grid{display:grid;grid-template-columns:1fr;gap:16px;margin-top:18px}
      .publish-url-card{border:1px solid #dbe3ee;border-radius:16px;background:#fff;padding:18px}
      .publish-url-card h3{margin:0 0 6px;color:#0f172a;font-size:16px}
      .publish-url-card p{margin:0 0 10px;color:#64748b;font-size:12px;line-height:1.5}
      .publish-url-card input{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:11px;padding:13px 14px;font:inherit;color:#0f172a;background:#fff}
      .publish-url-card input:focus{outline:none;border-color:#4f46e5;box-shadow:0 0 0 3px rgba(79,70,229,.10)}
      .publish-url-status{margin-top:7px;font-size:11px;font-weight:700;color:#64748b;min-height:16px}
      .publish-url-status.ok{color:#15803d}.publish-url-status.bad{color:#b91c1c}
      .publish-cover-preview{display:flex;gap:12px;align-items:center;margin-top:10px;padding:9px;border:1px solid #e2e8f0;border-radius:11px;background:#f8fafc}
      .publish-cover-preview img{width:52px;height:68px;object-fit:cover;border-radius:6px;display:none;background:#e2e8f0}.publish-cover-preview img.ready{display:block}
      .publish-cover-preview span{font-size:11px;color:#64748b;line-height:1.4}
      .publish-url-note{margin-top:14px;padding:12px 14px;border:1px solid #dbeafe;border-radius:12px;background:#eff6ff;color:#334155;font-size:11px;line-height:1.5}
      .publish-url-note b{color:#1d4ed8}
      .publish-url-fast{margin-top:10px;font-size:11px;color:#15803d;font-weight:700}
      @media(max-width:700px){.publish-url-card{padding:14px}}
    `;
    document.head.appendChild(s);
  }

  function markup() {
    return `
      <div class="publish-url-grid" id="publish-url-inputs">
        <div class="publish-url-card">
          <h3>eBook PDF Link <i>*</i></h3>
          <p>Paste the public/shareable URL of your PDF. Bookora will save the link; the PDF is not uploaded here.</p>
          <input id="pub-pdf-url" type="url" inputmode="url" autocomplete="url" placeholder="Paste PDF link" required>
          <div id="pub-pdf-url-status" class="publish-url-status">Required</div>
        </div>
        <div class="publish-url-card">
          <h3>Cover Image Link <i>*</i></h3>
          <p>Paste the public/shareable URL of your cover image.</p>
          <input id="pub-cover-url" type="url" inputmode="url" autocomplete="url" placeholder="Paste cover image link" required>
          <div class="publish-cover-preview"><img id="pub-cover-url-preview" alt="Cover preview"><span id="pub-cover-url-preview-text">Cover preview will appear here.</span></div>
          <div id="pub-cover-url-status" class="publish-url-status">Required</div>
        </div>
      </div>
      <div class="page-count-row">
        <div class="field"><label for="pub-pages">PDF Page Count <i>*</i></label><input id="pub-pages" type="number" min="1" placeholder="Enter page count"></div>
      </div>
      <div class="publish-url-note"><b>Fast URL publishing:</b> No PDF upload, no cover upload and no upload progress. Only your links and book details are saved.</div>
      <div class="publish-url-fast">✓ Publishing uses direct Firebase metadata save for a faster submission.</div>
    `;
  }

  function status(id, text, good = false) {
    const el = $(id); if (!el) return;
    el.textContent = text;
    el.className = `publish-url-status ${good ? 'ok' : text === 'Required' ? '' : 'bad'}`;
  }

  function validateUrls(show = true) {
    const pdf = val('pub-pdf-url');
    const cover = val('pub-cover-url');
    const pages = Number($('pub-pages')?.value || 0);
    if (!pdf || !httpUrl(pdf)) { if (show) toast('Please paste a valid PDF link.'); return false; }
    if (!cover || !httpUrl(cover)) { if (show) toast('Please paste a valid cover image link.'); return false; }
    if (!(pages >= 1)) { if (show) toast('PDF page count is required.'); return false; }
    return true;
  }

  function updateUrlUI() {
    const pdf = val('pub-pdf-url');
    const cover = val('pub-cover-url');
    status('pub-pdf-url-status', !pdf ? 'Required' : httpUrl(pdf) ? 'PDF link ready ✓' : 'Enter a valid http/https link', !!pdf && httpUrl(pdf));
    status('pub-cover-url-status', !cover ? 'Required' : httpUrl(cover) ? 'Loading preview…' : 'Enter a valid http/https link', !!cover && httpUrl(cover));
    const img = $('pub-cover-url-preview');
    const text = $('pub-cover-url-preview-text');
    if (!img) return;
    img.classList.remove('ready');
    img.removeAttribute('src');
    if (!httpUrl(cover)) { if (text) text.textContent = 'Cover preview will appear here.'; return; }
    img.onload = () => { img.classList.add('ready'); if (text) text.textContent = 'Cover image ready ✓'; status('pub-cover-url-status', 'Cover link ready ✓', true); };
    img.onerror = () => { if (text) text.textContent = 'Preview unavailable. Make sure the image is publicly accessible.'; status('pub-cover-url-status', 'Check that the cover link is public', false); };
    img.src = resolvedUrl(cover, 'cover');
  }

  function replaceButton(button, handler) {
    if (!button || button.dataset.urlPatched === '1') return button;
    const clone = button.cloneNode(true);
    clone.dataset.urlPatched = '1';
    button.replaceWith(clone);
    clone.addEventListener('click', e => { e.preventDefault(); handler(e); });
    return clone;
  }

  function showStep(n) {
    const target = Math.max(1, Math.min(5, Number(n) || 1));
    for (let i = 1; i <= 5; i++) {
      const section = $(`step-${i}`); if (!section) continue;
      const active = i === target;
      section.hidden = !active;
      section.style.setProperty('display', active ? 'block' : 'none', 'important');
    }
    document.querySelectorAll('.publish-steps-top .top-step').forEach((el, i) => el.classList.toggle('active', i === target - 1));
    if (target === 4) updatePreview();
    if (target === 5) $('submit-review-title')?.replaceChildren(document.createTextNode(val('pub-title','Your eBook')));
    $(`step-${target}`)?.scrollIntoView({behavior:'auto',block:'start'});
  }

  function updatePreview() {
    const cover = val('pub-cover-url');
    const img = $('v2-preview-cover');
    if (img) {
      img.hidden = !httpUrl(cover);
      if (httpUrl(cover)) img.src = resolvedUrl(cover, 'cover'); else img.removeAttribute('src');
    }
    $('v2-preview-cover-empty')?.toggleAttribute('hidden', httpUrl(cover));
  }

  async function currentUser() {
    const auth = window.firebase?.auth?.();
    if (!auth) throw new Error('Firebase is not ready. Please try again.');
    if (auth.currentUser) return auth.currentUser;
    return new Promise((resolve, reject) => {
      let done = false, unsub;
      const finish = user => { if (done) return; done = true; try { unsub?.(); } catch (_) {} user ? resolve(user) : reject(new Error('Please sign in again to publish your eBook.')); };
      try { unsub = auth.onAuthStateChanged(finish); } catch (_) { finish(null); }
      setTimeout(() => finish(auth.currentUser || null), 10000);
    });
  }

  async function submitFast() {
    if (busy) return;
    if (!validateUrls(true)) return;
    if (!state.isAuthenticated || (!state.isSeller && !state.isAdmin)) { toast('Please sign in with an approved seller account to publish.', 'error'); return; }
    const button = $('submit-pub-btn');
    if (!button) return;
    busy = true;
    button.disabled = true;
    button.textContent = 'Submitting…';
    const success = $('publish-success');
    const failure = $('publish-failure');
    success?.setAttribute('hidden','');
    failure?.setAttribute('hidden','');
    try {
      const user = await currentUser();
      const db = window.firebase?.firestore?.();
      if (!db) throw new Error('Firebase Firestore is not ready. Please try again.');
      const price = Number($('pub-price')?.value || 0);
      const saleRaw = val('pub-saleprice');
      const sale = saleRaw === '' ? null : Number(saleRaw);
      if (!(price > 0) || !Number.isFinite(price)) throw new Error('Please enter a valid list price.');
      if (sale !== null && (!Number.isFinite(sale) || sale < 0 || sale > price)) throw new Error('Sale price must be between ₹0 and the list price.');

      const now = new Date().toISOString();
      const id = `book_${user.uid}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      const pdfUrl = val('pub-pdf-url');
      const coverUrl = val('pub-cover-url');
      const data = {
        id, bookId:id,
        title:val('pub-title'), subtitle:val('pub-subtitle'), author:val('pub-author'),
        category:val('pub-category'), description:val('pub-description'),
        tags:val('pub-tags').split(',').map(x => x.trim()).filter(Boolean),
        pages:Number($('pub-pages')?.value || 0), pageCount:Number($('pub-pages')?.value || 0), format:'PDF',
        price, salePrice:sale, sale_price:sale,
        pdfUrl, pdf_url:pdfUrl, pdfResolvedUrl:resolvedUrl(pdfUrl,'pdf'),
        coverUrl, cover_url:coverUrl, coverResolvedUrl:resolvedUrl(coverUrl,'cover'),
        pdfSource:'external_url', coverSource:'external_url',
        creatorId:user.uid, creator_id:user.uid, creatorUid:user.uid,
        sellerId:user.uid, seller_id:user.uid, sellerUid:user.uid,
        publisherId:user.uid, publisherEmail:user.email || '', firebaseUid:user.uid,
        status:'pending', reviewStatus:'pending', review_status:'pending',
        isNew:true, is_new:true,
        createdAt:now, created_at:now, updatedAt:now, updated_at:now,
        metadataSource:'firebase_direct', driveStorage:'external_url',
        backendSynced:false, directFirebasePublish:true
      };
      await db.collection('books').doc(id).set(data, {merge:true});
      $('publish-progress-label')?.replaceChildren(document.createTextNode('Submitted successfully ✓'));
      $('publish-progress-percent')?.replaceChildren(document.createTextNode('100%'));
      $('publish-progress-fill')?.style.setProperty('width','100%');
      $('publish-success-title')?.replaceChildren(document.createTextNode(data.title));
      $('publish-success-detail')?.replaceChildren(document.createTextNode('Your eBook is now pending admin review.'));
      success?.removeAttribute('hidden');
      $('publish-status-text')?.replaceChildren(document.createTextNode('PDF link + cover link + metadata saved directly to Firebase.'));
      button.textContent = 'Submitted ✓';
      toast('eBook submitted successfully.', 'success');
    } catch (e) {
      console.error('[Bookora URL publish]', e);
      $('publish-failure-message')?.replaceChildren(document.createTextNode(e?.message || 'Your eBook could not be submitted. Please retry.'));
      failure?.removeAttribute('hidden');
      button.disabled = false;
      button.textContent = 'Submit for Review';
      toast(e?.message || 'Your eBook could not be submitted.', 'error');
    } finally {
      busy = false;
    }
  }

  function patchForm(form) {
    if (!form || form.dataset[PATCH_ID] === '1') return;
    form.dataset[PATCH_ID] = '1';
    addStyles();
    const step2 = $('step-2');
    if (!step2) return;

    const heading = step2.querySelector('.section-heading h2');
    const desc = step2.querySelector('.section-heading p');
    if (heading) heading.textContent = 'PDF & Cover Links';
    if (desc) desc.textContent = 'Paste your PDF link and cover image link. No files are uploaded to Bookora.';
    step2.querySelector('.upload-order-note')?.remove();
    step2.querySelector('.upload-grid')?.remove();
    step2.querySelector('.file-policy')?.remove();
    step2.querySelector('.page-count-row')?.remove();
    const actions = step2.querySelector('.v2-actions');
    const holder = document.createElement('div');
    holder.innerHTML = markup();
    const block = holder.firstElementChild;
    if (actions) step2.insertBefore(block, actions); else step2.appendChild(block);
    const pageRow = holder.lastElementChild?.previousElementSibling;
    // markup is inserted as one wrapper; restore page count and notes from its inner HTML.
    if (!step2.querySelector('#pub-pages')) {
      const temp = document.createElement('div'); temp.innerHTML = markup();
      while (temp.firstElementChild) step2.insertBefore(temp.firstElementChild, actions);
    }

    $('pub-pdf-url')?.addEventListener('input', updateUrlUI);
    $('pub-cover-url')?.addEventListener('input', updateUrlUI);

    const next2 = step2.querySelector('.v2-next[data-next="3"]');
    replaceButton(next2, () => { if (validateUrls(true)) showStep(3); });

    document.querySelectorAll('.v2-next').forEach(btn => {
      const next = Number(btn.dataset.next);
      if (next === 3 || btn.dataset.urlPatched === '1') return;
      replaceButton(btn, () => {
        if (next === 2) showStep(2);
        else if (next === 4) {
          if (!validateUrls(true)) { showStep(2); return; }
          const price = Number($('pub-price')?.value || 0);
          if (!(price > 0)) { toast('Please enter a valid list price.'); showStep(3); return; }
          showStep(4);
        } else if (next === 5) showStep(5);
      });
    });
    document.querySelectorAll('.v2-prev').forEach(btn => replaceButton(btn, () => showStep(Number(btn.dataset.prev))));

    const submit = $('submit-pub-btn');
    if (submit && submit.dataset.urlPatched !== '1') {
      const clone = submit.cloneNode(true);
      clone.dataset.urlPatched = '1';
      clone.textContent = 'Submit for Review';
      submit.replaceWith(clone);
      clone.addEventListener('click', e => { e.preventDefault(); submitFast(); });
    }
    form.addEventListener('submit', e => { e.preventDefault(); submitFast(); }, {capture:true});
    updateUrlUI();
  }

  function scan() {
    const form = $('publish-wizard-form');
    if (form) patchForm(form);
    if (!observer && document.body) {
      observer = new MutationObserver(() => {
        const f = $('publish-wizard-form');
        if (f && f.dataset[PATCH_ID] !== '1') patchForm(f);
      });
      observer.observe(document.body, {childList:true,subtree:true});
    }
  }

  function start() {
    scan();
    [100,300,700,1500,3000].forEach(ms => setTimeout(scan, ms));
    window.addEventListener('hashchange', () => setTimeout(scan, 50));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();
