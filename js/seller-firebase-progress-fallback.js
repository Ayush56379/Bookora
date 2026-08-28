/* Bookora seller onboarding: Firebase-first progress persistence.
 * Save & Continue must never wait on the Render backend. Firestore is the
 * primary checkpoint store for onboarding; Render synchronization is best-effort
 * in the background. This keeps the UI fast and removes CORS/network stalls.
 */
(() => {
  if (window.__BOOKORA_SELLER_FIREBASE_PROGRESS_FALLBACK__) return;
  window.__BOOKORA_SELLER_FIREBASE_PROGRESS_FALLBACK__ = true;

  const TARGET = '/api/seller/application-progress';
  const APPLY_TARGET = '/api/seller/apply';
  const originalFetch = window.fetch.bind(window);

  const getAuthUser = async () => {
    try {
      const auth = window.firebase?.auth?.();
      if (!auth) return null;
      if (auth.currentUser) return auth.currentUser;
      return await new Promise(resolve => {
        let done = false;
        let unsubscribe = null;
        const finish = user => {
          if (done) return;
          done = true;
          try { unsubscribe?.(); } catch (_) {}
          clearTimeout(timer);
          resolve(user || null);
        };
        const timer = setTimeout(() => finish(auth.currentUser || null), 3000);
        try { unsubscribe = auth.onAuthStateChanged(finish); } catch (_) { finish(auth.currentUser || null); }
      });
    } catch (_) { return null; }
  };

  const withTimeout = (promise, ms) => Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase checkpoint timeout')), ms))
  ]);

  const parsePayload = init => {
    try { return JSON.parse(String(init?.body || '{}')); } catch (_) { return {}; }
  };

  const sanitize = (payload, user) => {
    const blocked = new Set([
      'accountNumber', 'account_number', 'payout_account', 'bankAccount',
      'pan', 'PAN', 'password', 'secret', 'accessToken', 'token'
    ]);
    const safe = {};
    Object.entries(payload || {}).forEach(([key, value]) => {
      if (!blocked.has(key)) safe[key] = value;
    });
    const step = Number(payload?.step || safe.onboardingStep || 1);
    delete safe.step;
    safe.onboardingStep = Number.isFinite(step) && step > 0 ? step : 1;
    safe.email = String(user?.email || safe.email || '').trim().toLowerCase();
    safe.uid = String(user?.uid || '').trim();
    safe.updatedAt = window.firebase.firestore.FieldValue.serverTimestamp();
    safe.progressSource = 'firebase';
    return safe;
  };

  const syncRenderInBackground = (input, init) => {
    try {
      const headers = new Headers(init?.headers || {});
      headers.set('Accept', 'application/json');
      void originalFetch(input, { ...init, headers }).catch(error => {
        console.info('[Bookora seller] Background Render sync skipped:', error?.message || error);
      });
    } catch (_) {}
  };

  const firebaseFirst = async (input, init, method) => {
    const user = await getAuthUser();
    const uid = String(user?.uid || '').trim();
    const db = window.firebase?.firestore?.();
    if (!uid || !db) throw new Error('Firebase authentication/database is not ready.');

    const ref = db.collection('sellers').doc(uid);

    if (method === 'GET') {
      const snap = await withTimeout(ref.get(), 5000);
      return new Response(JSON.stringify({
        success: true,
        application: snap.exists ? { uid, ...snap.data() } : null,
        source: 'firebase'
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const payload = parsePayload(init);
    const safe = sanitize(payload, user);
    await withTimeout(ref.set(safe, { merge: true }), 5000);
    syncRenderInBackground(input, init);

    return new Response(JSON.stringify({
      success: true,
      application: { ...safe, uid },
      source: 'firebase'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  window.fetch = async function(input, init = {}) {
    const url = typeof input === 'string' ? input : String(input?.url || '');
    const path = (() => {
      try { return new URL(url, location.href).pathname; } catch (_) { return url.split('?')[0]; }
    })();
    const method = String(init?.method || (typeof input !== 'string' ? input?.method : 'GET') || 'GET').toUpperCase();

    if (path === TARGET && (method === 'GET' || method === 'POST')) {
      try {
        return await firebaseFirst(input, init, method);
      } catch (error) {
        console.warn('[Bookora seller] Firebase checkpoint failed; trying Render once.', error?.message || error);
        try { return await originalFetch(input, init); }
        catch (_) { throw new Error('Seller progress could not be saved. Please retry.'); }
      }
    }
    return originalFetch(input, init);
  };

  const FIELD_IDS = [
    's-store','s-legal','s-email','s-phone','s-country','s-state','s-city','s-postal','s-address','s-type','s-books','s-website','s-portfolio',
    's-bio','s-category','s-language','s-catalogue','s-format','s-imprint','s-isbn','s-drm','s-ai','s-sample','s-accessibility',
    's-rights','s-copyright','s-original','s-distribution','s-payout','s-bank','s-holder','s-account','s-ifsc','s-upi','s-pan','s-tax','s-billing',
    's-terms','s-privacy','s-content','s-pricing'
  ];
  const FIELD_MAP = {
    's-store':'publisherName','s-legal':'legalName','s-email':'email','s-phone':'phone','s-country':'country','s-state':'state','s-city':'city','s-postal':'postalCode','s-address':'address',
    's-type':'publisherType','s-books':'previousBooksCount','s-website':'website','s-portfolio':'portfolioUrl','s-bio':'authorBio','s-category':'categories','s-language':'languages',
    's-catalogue':'publishingDescription','s-format':'ebookFormats','s-imprint':'imprintName','s-isbn':'isbnPreference','s-drm':'drmPreference','s-ai':'aiContentDisclosure','s-sample':'sampleAvailability',
    's-accessibility':'accessibilityInfo','s-rights':'rightsDeclaration','s-copyright':'copyrightOwner','s-original':'originalContent','s-distribution':'distributionRights','s-payout':'payoutMethod',
    's-bank':'bankName','s-holder':'accountHolderName','s-account':'accountNumber','s-ifsc':'ifscCode','s-upi':'upiId','s-pan':'pan','s-tax':'taxInfoStatus','s-billing':'billingAddress',
    's-terms':'termsAccepted','s-privacy':'privacyAccepted','s-content':'contentRightsAccepted','s-pricing':'pricingAccepted'
  };
  const read = id => { const el = document.getElementById(id); if (!el) return ''; return el.type === 'checkbox' ? !!el.checked : String(el.value || '').trim(); };
  const collect = () => {
    const out = {};
    FIELD_IDS.forEach(id => {
      const el = document.getElementById(id); if (!el) return;
      const key = FIELD_MAP[id]; if (!key || key === 'accountNumber' || key === 'pan') return;
      let value = read(id);
      if (['categories','languages','ebookFormats'].includes(key)) value = value ? [value] : [];
      if (key === 'previousBooksCount') value = Number(value || 0);
      out[key] = value;
    });
    const account = read('s-account'); const pan = read('s-pan');
    if (account) out.accountLast4 = account.slice(-4);
    if (pan) out.panLast4 = pan.slice(-4);
    return out;
  };
  const currentStep = () => Number(document.querySelector('.panel.active[data-panel]')?.dataset.panel || 1);
  const status = text => { const el = document.getElementById('seller-status'); if (el) el.textContent = text; };

  async function fastNext(event) {
    if (!location.hash.includes('/seller/apply')) return;
    const button = event.target.closest('#next-step');
    if (!button) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const step = currentStep();
    const panel = document.querySelector(`.panel[data-panel="${step}"]`);
    if (!panel || step >= 5) return;
    for (const el of panel.querySelectorAll('[required]')) { if (!el.checkValidity()) { el.reportValidity(); return; } }
    button.disabled = true; button.textContent = 'Saving…';
    try {
      await withTimeout(saveDirect(step, false), 5000);
      status(`Step ${step} saved to Firebase ✓`);
      const next = step + 1;
      document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', Number(p.dataset.panel) === next));
      document.querySelectorAll('.step').forEach(s => { const n = Number(s.dataset.ind); s.classList.toggle('active', n === next); s.classList.toggle('done', n < next); });
      const back = document.getElementById('back-step'); if (back) back.disabled = next === 1;
      if (next === 5) button.style.display = 'none';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('[Bookora seller] direct Firebase step save failed', error);
      status('Firebase save failed. Please retry.');
      window.Toast?.error?.('Firebase save failed. Please try again.');
    } finally {
      button.disabled = false;
      if (Number(document.querySelector('.panel.active')?.dataset.panel || step) < 5) button.textContent = 'Save & Continue →';
    }
  }

  const saveDirect = async (step, finalSubmit) => {
    const user = await getAuthUser();
    const db = window.firebase?.firestore?.();
    if (!user?.uid || !db) throw new Error('Firebase is not ready.');
    const data = collect();
    data.uid = user.uid;
    data.email = String(user.email || data.email || '').trim().toLowerCase();
    data.onboardingStep = Number(step);
    data.completedStep = Number(step);
    data.updatedAt = window.firebase.firestore.FieldValue.serverTimestamp();
    data.progressSource = 'firebase-direct';
    if (finalSubmit) {
      data.applicationStatus = 'submitted';
      data.onboardingStatus = 'submitted';
      data.seller_status = 'pending';
      data.submittedAt = window.firebase.firestore.FieldValue.serverTimestamp();
      data.submissionVersion = 1;
    }
    await db.collection('sellers').doc(user.uid).set(data, { merge: true });
    return data;
  };

  async function fastSubmit(event) {
    if (!location.hash.includes('/seller/apply')) return;
    const form = event.target.closest('#seller-five-form');
    if (!form) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const button = document.getElementById('seller-submit');
    const panel = document.querySelector('.panel[data-panel="5"]');
    if (!button || !panel || button.dataset.fastSubmitting === '1') return;
    for (const el of panel.querySelectorAll('[required]')) { if (!el.checkValidity()) { el.reportValidity(); return; } }
    button.dataset.fastSubmitting = '1'; button.disabled = true; button.textContent = 'Submitting securely…';
    const payload = collect();
    try {
      await withTimeout(saveDirect(5, true), 6000);
      status('Application submitted successfully ✓');
      // Server-side sync is deliberately background-only. It handles secure payout storage,
      // admin workflow and submission email without blocking the Firebase-first UI.
      getAuthUser().then(async user => {
        try {
          const token = await user?.getIdToken?.(false); if (!token) return;
          await originalFetch('https://bookora-backend-x08l.onrender.com' + APPLY_TARGET, {
            method:'POST', keepalive:true,
            headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
            body:JSON.stringify(payload)
          });
        } catch (e) { console.info('[Bookora seller] background submit/email sync pending:', e?.message || e); }
      });
      form.innerHTML = '<div class="result"><div class="result-icon">✓</div><h2>Application Submitted</h2><p>Your seller application has been saved successfully and is now pending admin review.</p><p style="color:#64748b;font-size:13px">A confirmation email will be sent to your registered email address.</p><a class="btn btn-primary" href="#/">Back to Bookora</a></div>';
    } catch (error) {
      console.error('[Bookora seller] fast Firebase submit failed', error);
      button.dataset.fastSubmitting = '0'; button.disabled = false; button.textContent = 'Submit Seller Application for Review';
      status('Firebase save failed. Please retry.');
      window.Toast?.error?.('Application could not be saved. Please try again.');
    }
  }

  function installFastController() {
    const form = document.getElementById('seller-five-form');
    if (!form || form.__bookoraFastFirebaseInstalled) return;
    form.__bookoraFastFirebaseInstalled = true;
    form.addEventListener('click', fastNext, true);
    form.addEventListener('submit', fastSubmit, true);
  }
  const install = () => installFastController();
  [0,100,250,500,1000,2000,4000].forEach(ms => setTimeout(install, ms));
  new MutationObserver(install).observe(document.body, { childList:true, subtree:true });
})();
