// Bookora — Admin Seller document/verification viewer enhancement.
(() => {
  const SELLER_COLLECTION = 'sellers';
  const ROUTE = '#/admin/sellers';
  const DOC_KEY_RE = /(document|doc|proof|kyc|identity|idcard|id_card|aadhaar|aadhar|pan|gst|tax|address|bank|certificate|license|passport|verification|incorporation|registration)/i;
  const URL_RE = /^https?:\/\//i;
  let sellers = [], unsubscribe = null, observer = null, renderTimer = 0;
  const isRoute = () => (window.location.hash || '#/').split('?')[0] === ROUTE;
  const escapeHtml = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;');
  const getFirebase = () => { try { return window.firebase?.firestore ? window.firebase.firestore() : null; } catch (_) { return null; } };
  const labelize = key => String(key).replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\s+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());
  const isDocumentValue = (key, value) => value != null && value !== '' && (URL_RE.test(String(value)) || DOC_KEY_RE.test(key));
  const flatten = (value, prefix = '') => {
    const out = [];
    if (Array.isArray(value)) value.forEach((item, index) => out.push(...flatten(item, prefix ? `${prefix}[${index + 1}]` : `[${index + 1}]`)));
    else if (value && typeof value === 'object' && typeof value.toDate !== 'function') Object.entries(value).forEach(([key, item]) => out.push(...flatten(item, prefix ? `${prefix}.${key}` : key)));
    else if (value != null && value !== '') out.push({ key: prefix, value });
    return out;
  };
  const collectDocuments = seller => {
    const entries = [];
    Object.entries(seller || {}).forEach(([key, value]) => { if (key !== 'id' && key !== 'uid' && key !== 'user_id' && isDocumentValue(key, value)) flatten(value, key).forEach(item => { if (item?.value != null && item.value !== '') entries.push(item); }); });
    const seen = new Set();
    return entries.filter(item => { const sig = `${item.key}|${String(item.value)}`; if (seen.has(sig)) return false; seen.add(sig); return true; });
  };
  const findSeller = () => {
    const content = document.getElementById('seller-detail-content'); if (!content) return null;
    const appIdItem = [...content.querySelectorAll('.seller-detail-item')].find(el => /Application ID/i.test(el.querySelector('small')?.textContent || ''));
    const appId = appIdItem?.querySelector('strong')?.textContent?.trim();
    if (appId) { const match = sellers.find(s => String(s.applicationId || s.id || '') === appId); if (match) return match; }
    const title = document.getElementById('seller-detail-title')?.textContent?.trim();
    return sellers.find(s => String(s.publisherName || s.store_name || s.name || '') === title) || null;
  };
  const addStyles = () => {
    if (document.getElementById('bookora-seller-doc-style')) return;
    const style = document.createElement('style'); style.id = 'bookora-seller-doc-style';
    style.textContent = `.seller-doc-verification-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.seller-doc-card{border:1px solid #dbe3ee;border-radius:12px;padding:13px;background:#f8fafc}.seller-doc-card-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:8px}.seller-doc-card-head strong{font-size:13px;color:#0f172a;word-break:break-word}.seller-doc-card-head span{font-size:9px;font-weight:800;color:#64748b;background:#e2e8f0;padding:4px 6px;border-radius:999px;white-space:nowrap}.seller-doc-value{font-size:12px;color:#475569;word-break:break-word;line-height:1.45}.seller-doc-open{display:inline-flex;margin-top:10px;text-decoration:none;background:#2563eb;color:#fff!important;border-radius:8px;padding:8px 10px;font-size:12px;font-weight:700}.seller-doc-empty{padding:14px;border:1px dashed #cbd5e1;border-radius:10px;color:#64748b;font-size:12px}.seller-verification-note{margin-top:10px;padding:10px;border-radius:9px;background:#f1f5f9;color:#64748b;font-size:11px;line-height:1.45}@media(max-width:700px){.seller-doc-verification-grid{grid-template-columns:1fr}}`;
    document.head.appendChild(style);
  };
  const renderDocuments = () => {
    if (!isRoute()) return; const content = document.getElementById('seller-detail-content'); const modal = document.getElementById('seller-detail-modal'); if (!content || !modal || modal.hidden) return;
    const seller = findSeller(); if (!seller) return; addStyles(); content.querySelector('[data-bookora-seller-documents]')?.remove();
    const docs = collectDocuments(seller); const section = document.createElement('div'); section.className = 'seller-detail-section'; section.setAttribute('data-bookora-seller-documents', '1');
    section.innerHTML = `<h3>Documents & Verification</h3><div class="seller-doc-verification-grid">${docs.length ? docs.map((doc, index) => { const raw = String(doc.value); const isUrl = URL_RE.test(raw); const display = isUrl ? raw : raw.length > 180 ? `${raw.slice(0, 180)}…` : raw; return `<div class="seller-doc-card"><div class="seller-doc-card-head"><strong>${escapeHtml(labelize(doc.key || `Document ${index + 1}`))}</strong><span>${isUrl ? 'DOCUMENT' : 'DETAIL'}</span></div><div class="seller-doc-value">${escapeHtml(display)}</div>${isUrl ? `<a class="seller-doc-open" href="${escapeHtml(raw)}" target="_blank" rel="noopener noreferrer">Open / View Document</a>` : ''}</div>`; }).join('') : '<div class="seller-doc-empty">No document/proof links were found in this seller application record.</div>'}</div><div class="seller-verification-note">Documents are shown only inside the seller-review screen. Sensitive identity and financial numbers remain masked when the stored record is masked.</div>`;
    content.appendChild(section);
  };
  const stopListener = () => { try { unsubscribe?.(); } catch (_) {} unsubscribe = null; };
  const start = () => {
    if (!isRoute()) { stopListener(); return; } addStyles(); const db = getFirebase();
    if (db && !unsubscribe) try { unsubscribe = db.collection(SELLER_COLLECTION).onSnapshot(snapshot => { sellers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); renderDocuments(); }, error => console.warn('[Bookora Seller Documents] Firestore listener:', error)); } catch (error) { console.warn('[Bookora Seller Documents] listener:', error); }
    const root = document.getElementById('app') || document.body;
    if (!observer && root) { observer = new MutationObserver(() => { clearTimeout(renderTimer); renderTimer = setTimeout(renderDocuments, 40); }); observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] }); }
    renderDocuments();
  };
  const boot = () => setTimeout(start, 350);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
  window.addEventListener('hashchange', () => setTimeout(start, 50), true);
  window.addEventListener('beforeunload', () => { stopListener(); observer?.disconnect(); }, { once: true });
})();
