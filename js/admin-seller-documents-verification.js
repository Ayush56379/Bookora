// Bookora — Admin Seller document/verification viewer enhancement.
// Adds a dedicated Documents & Verification section to the existing seller modal
// without changing the existing seller workflow or exposing documents elsewhere.
(() => {
  const SELLER_COLLECTION = 'sellers';
  const DOC_KEY_RE = /(document|doc|proof|kyc|identity|idcard|id_card|aadhaar|aadhar|pan|gst|tax|address|bank|certificate|license|passport|verification|incorporation|registration)/i;
  const URL_RE = /^https?:\/\//i;
  let sellers = [];
  let unsubscribe = null;
  let observer = null;
  let renderTimer = 0;

  const escapeHtml = value => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;').replace(/'/g, '&#039;');

  const isAdmin = () => {
    try {
      const s = window.__BOOKORA_STATE__;
      const u = s?.currentUser;
      return s?.isAdmin === true || u?.role === 'admin' || u?.isMasterAdmin === true || String(u?.email || '').toLowerCase() === 'ayushprajpati6@gmail.com';
    } catch (_) { return false; }
  };

  const getFirebase = () => {
    try {
      if (window.firebase?.firestore) return window.firebase.firestore();
    } catch (_) {}
    return null;
  };

  const labelize = key => String(key).replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\s+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());

  const isDocumentValue = (key, value) => {
    if (value == null || value === '') return false;
    if (URL_RE.test(String(value))) return true;
    return DOC_KEY_RE.test(key);
  };

  const flatten = (value, prefix = '') => {
    const out = [];
    if (Array.isArray(value)) {
      value.forEach((item, index) => out.push(...flatten(item, prefix ? `${prefix}[${index + 1}]` : `[${index + 1}]`)));
    } else if (value && typeof value === 'object' && typeof value.toDate !== 'function') {
      Object.entries(value).forEach(([key, item]) => out.push(...flatten(item, prefix ? `${prefix}.${key}` : key)));
    } else if (value != null && value !== '') {
      out.push({ key: prefix, value });
    }
    return out;
  };

  const collectDocuments = seller => {
    const entries = [];
    Object.entries(seller || {}).forEach(([key, value]) => {
      if (key === 'id' || key === 'uid' || key === 'user_id') return;
      if (!isDocumentValue(key, value)) return;
      flatten(value, key).forEach(item => {
        if (item?.value != null && item.value !== '') entries.push(item);
      });
    });
    const seen = new Set();
    return entries.filter(item => {
      const sig = `${item.key}|${String(item.value)}`;
      if (seen.has(sig)) return false;
      seen.add(sig);
      return true;
    });
  };

  const findSeller = () => {
    const content = document.getElementById('seller-detail-content');
    if (!content) return null;
    const first = content.querySelector('.seller-detail-item strong');
    const appIdItem = [...content.querySelectorAll('.seller-detail-item')].find(el => /Application ID/i.test(el.querySelector('small')?.textContent || ''));
    const appId = appIdItem?.querySelector('strong')?.textContent?.trim();
    if (appId) {
      const match = sellers.find(s => String(s.applicationId || s.id || '') === appId);
      if (match) return match;
    }
    const title = document.getElementById('seller-detail-title')?.textContent?.trim();
    return sellers.find(s => String(s.publisherName || s.store_name || s.name || '') === title) || null;
  };

  const renderDocuments = () => {
    const content = document.getElementById('seller-detail-content');
    const modal = document.getElementById('seller-detail-modal');
    if (!content || !modal || modal.hidden) return;
    if (!isAdmin()) return;
    const seller = findSeller();
    if (!seller) return;
    const marker = 'data-bookora-seller-documents';
    content.querySelector(`[${marker}]`)?.remove();

    const docs = collectDocuments(seller);
    const section = document.createElement('div');
    section.className = 'seller-detail-section';
    section.setAttribute(marker, '1');
    section.innerHTML = `
      <h3>Documents & Verification</h3>
      <div class="seller-doc-verification-grid">
        ${docs.length ? docs.map((doc, index) => {
          const raw = String(doc.value);
          const isUrl = URL_RE.test(raw);
          const display = isUrl ? raw : raw.length > 180 ? `${raw.slice(0, 180)}…` : raw;
          return `<div class="seller-doc-card">
            <div class="seller-doc-card-head"><strong>${escapeHtml(labelize(doc.key || `Document ${index + 1}`))}</strong><span>${isUrl ? 'DOCUMENT' : 'DETAIL'}</span></div>
            <div class="seller-doc-value">${escapeHtml(display)}</div>
            ${isUrl ? `<a class="seller-doc-open" href="${escapeHtml(raw)}" target="_blank" rel="noopener noreferrer">Open / View Document</a>` : ''}
          </div>`;
        }).join('') : '<div class="seller-doc-empty">No document/proof links were found in this seller application record.</div>'}
      </div>
      <div class="seller-verification-note">Documents are visible only inside the administrator seller-review screen. Sensitive financial/identity numbers remain masked when the stored record is masked.</div>
    `;
    content.appendChild(section);
  };

  const start = async () => {
    if (!isAdmin()) return;
    const db = getFirebase();
    if (db && !unsubscribe) {
      try {
        unsubscribe = db.collection(SELLER_COLLECTION).onSnapshot(snapshot => {
          sellers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          renderDocuments();
        }, error => console.warn('[Bookora Seller Documents] Firestore listener:', error));
      } catch (error) { console.warn('[Bookora Seller Documents] unable to attach listener:', error); }
    }
    const root = document.getElementById('app') || document.body;
    if (!observer && root) {
      observer = new MutationObserver(() => {
        clearTimeout(renderTimer);
        renderTimer = setTimeout(renderDocuments, 40);
      });
      observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    }
    renderDocuments();
  };

  const boot = () => setTimeout(start, 350);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
  window.addEventListener('beforeunload', () => { try { unsubscribe?.(); observer?.disconnect(); } catch (_) {} }, { once: true });
})();
