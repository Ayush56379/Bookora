// Stable Firebase persistence layer for the five-step seller onboarding form.
// Uses the authenticated backend endpoint so seller data is tied to the verified
// Firebase/Bookora account. Sensitive payout identifiers are intentionally never
// sent to Firestore in raw form; the backend stores only masked/last-4 values.
import { apiFetch } from './config.js';

(() => {
  if (window.__BOOKORA_SELLER_FIRESTORE_STABLE__) return;
  window.__BOOKORA_SELLER_FIRESTORE_STABLE__ = true;

  const FIELD_MAP = {
    's-store':'publisherName','s-legal':'legalName','s-email':'email','s-phone':'phone',
    's-country':'country','s-state':'state','s-city':'city','s-postal':'postalCode','s-address':'address',
    's-type':'publisherType','s-books':'previousBooksCount','s-website':'website','s-portfolio':'portfolioUrl',
    's-bio':'authorBio','s-category':'categories','s-language':'languages','s-catalogue':'publishingDescription',
    's-format':'ebookFormats','s-imprint':'imprintName','s-isbn':'isbnPreference','s-drm':'drmPreference',
    's-ai':'aiContentDisclosure','s-sample':'sampleAvailability','s-accessibility':'accessibilityInfo',
    's-rights':'rightsDeclaration','s-payout':'payoutMethod','s-bank':'bankName','s-holder':'accountHolderName',
    's-ifsc':'ifscCode','s-upi':'upiId','s-pan':'pan','s-tax':'taxInfoStatus','s-billing':'billingAddress',
    's-copyright':'copyrightOwner','s-original':'originalContent','s-distribution':'distributionRights',
    's-terms':'termsAccepted','s-privacy':'privacyAccepted','s-content':'contentRightsAccepted','s-pricing':'pricingAccepted'
  };

  const esc = value => String(value ?? '');
  const get = id => document.getElementById(id);
  const value = id => {
    const el = get(id);
    if (!el) return '';
    if (el.type === 'checkbox') return !!el.checked;
    return String(el.value ?? '').trim();
  };

  const currentStep = () => {
    const active = document.querySelector('.seller-page .panel.active[data-panel]');
    return Number(active?.getAttribute('data-panel') || 1);
  };

  const collect = () => {
    const payload = { step: currentStep() };
    Object.entries(FIELD_MAP).forEach(([id,key]) => {
      const el = get(id);
      if (!el) return;
      let v = value(id);
      if (key === 'previousBooksCount') v = Number(v || 0);
      if (key === 'categories' || key === 'languages' || key === 'ebookFormats') v = v ? [v] : [];
      payload[key] = v;
    });

    // The profile image uploader already has its own upload flow. Reuse its
    // public URL/ID if exposed by the page without duplicating the file upload.
    const imageUrl = String(window.__BOOKORA_SELLER_PROFILE_IMAGE_URL__ || '').trim();
    const imageId = String(window.__BOOKORA_SELLER_PROFILE_IMAGE_ID__ || '').trim();
    if (imageUrl) payload.profileImageUrl = imageUrl;
    if (imageId) payload.profileImageId = imageId;
    return payload;
  };

  let saving = false;
  let queued = null;

  async function save(step = currentStep(), silent = false) {
    const payload = collect();
    payload.step = step;
    if (saving) { queued = payload; return false; }
    saving = true;
    try {
      const result = await apiFetch('/api/seller/application-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!result?.success) throw new Error(result?.error || 'Firebase save failed');
      window.__BOOKORA_SELLER_FIREBASE_LAST_SAVE__ = Date.now();
      if (!silent) {
        const status = get('seller-status');
        if (status) status.textContent = 'Saved securely to Firebase.';
      }
      return true;
    } catch (error) {
      console.error('[Bookora seller Firebase] save failed:', error);
      const status = get('seller-status');
      if (status) status.textContent = 'Could not save this step to Firebase. Please retry.';
      return false;
    } finally {
      saving = false;
      if (queued) { const next = queued; queued = null; await save(next.step, true); }
    }
  }

  function apply(application) {
    if (!application) return;
    Object.entries(FIELD_MAP).forEach(([id,key]) => {
      const el = get(id);
      if (!el || application[key] === undefined || application[key] === null) return;
      if (el.type === 'checkbox') el.checked = !!application[key];
      else if (Array.isArray(application[key])) el.value = application[key][0] || '';
      else el.value = esc(application[key]);
    });
  }

  async function restore() {
    try {
      const result = await apiFetch('/api/seller/application-progress');
      if (result?.success && result.application) {
        apply(result.application);
        window.__BOOKORA_SELLER_FIREBASE_PROGRESS__ = result.application;
      }
    } catch (error) {
      console.warn('[Bookora seller Firebase] restore skipped:', error);
    }
  }

  function install() {
    const form = get('seller-five-form');
    if (!form || form.__firebaseStableInstalled) return !!form;
    form.__firebaseStableInstalled = true;

    form.addEventListener('click', event => {
      const button = event.target.closest('#next-step,#back-step');
      if (!button) return;
      const step = currentStep();
      // Save before the existing navigation handler changes the visible panel.
      void save(step, false);
    }, true);

    form.addEventListener('change', () => {
      // Debounced background checkpoint; never blocks the form.
      clearTimeout(window.__BOOKORA_SELLER_CHECKPOINT_TIMER__);
      window.__BOOKORA_SELLER_CHECKPOINT_TIMER__ = setTimeout(() => void save(currentStep(), true), 450);
    }, true);

    form.addEventListener('submit', () => {
      // The existing submit handler remains authoritative. This checkpoint only
      // guarantees the final form state is persisted before submission completes.
      void save(5, true);
    }, true);

    void restore();
    return true;
  }

  const tryInstall = () => install();
  [250, 750, 1500, 3000].forEach(ms => setTimeout(tryInstall, ms));
  const observer = new MutationObserver(tryInstall);
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 15000);

  window.BookoraSellerFirebaseProgress = { save, restore };
})();
