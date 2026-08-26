import { apiFetch } from '../config.js';
import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

let applicationState = null;
let loadingApplication = false;

const esc = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/\"/g, '&quot;')
  .replace(/'/g, '&#039;');

const field = (id, label, type = 'text', placeholder = '', required = true, extra = '') => `
  <div class="seller-field">
    <label for="${id}">${label}${required ? ' *' : ''}</label>
    <input id="${id}" type="${type}" placeholder="${esc(placeholder)}" ${required ? 'required' : ''} ${extra}>
  </div>`;

const textarea = (id, label, placeholder = '', required = true, rows = 4) => `
  <div class="seller-field">
    <label for="${id}">${label}${required ? ' *' : ''}</label>
    <textarea id="${id}" rows="${rows}" placeholder="${esc(placeholder)}" ${required ? 'required' : ''}></textarea>
  </div>`;

const checkbox = (id, text, required = true) => `
  <label class="seller-check"><input id="${id}" type="checkbox" ${required ? 'required' : ''}><span>${text}${required ? ' *' : ''}</span></label>`;

function statusBanner() {
  const status = String(applicationState?.status || state.currentUser?.seller_status || 'none').toLowerCase();
  if (status === 'approved') return `<div class="seller-status-banner approved"><strong>Seller account approved.</strong><span>You can use Author Studio and upload digital books.</span></div>`;
  if (status === 'pending') return `<div class="seller-status-banner pending"><strong>Application under review.</strong><span>Your application is already in the moderation queue. You cannot submit another application until it is reviewed.</span></div>`;
  if (status === 'rejected') return `<div class="seller-status-banner rejected"><strong>Application rejected.</strong><span>${esc(applicationState?.rejectionReason || 'Please review your information and contact Bookora support if you need clarification.')}</span></div>`;
  if (status === 'suspended') return `<div class="seller-status-banner suspended"><strong>Seller access suspended.</strong><span>${esc(applicationState?.suspensionReason || 'Seller upload access is currently disabled by administration.')}</span></div>`;
  return '';
}

function inputValue(id) { return document.getElementById(id)?.value?.trim() || ''; }
function checked(id) { return document.getElementById(id)?.checked === true; }
function selectedValues(id) { return [...(document.getElementById(id)?.selectedOptions || [])].map(o => o.value).filter(Boolean); }

export function renderSellerApplyPage() {
  updateSEO({
    title: 'Become an Author / Seller on Bookora',
    description: 'Apply for authorized creator privileges to publish and sell digital eBooks on Bookora.'
  });

  const locked = ['pending', 'approved', 'suspended'].includes(String(applicationState?.status || state.currentUser?.seller_status || '').toLowerCase());

  return `
    <div class="seller-apply-page animate-fade-in">
      <div class="container seller-apply-container">
        <div class="seller-apply-card">
          <div class="badge badge-external">CREATOR ONBOARDING</div>
          <h1>Apply for Seller Privileges</h1>
          <p class="seller-intro">Publish original digital books on Bookora, manage your catalogue and receive seller payouts after approval. Complete the information below so the moderation team can verify your publishing profile.</p>
          ${statusBanner()}

          <form id="seller-apply-form" ${locked ? 'class="is-locked"' : ''}>
            <section class="seller-section">
              <div class="seller-section-heading"><span>1</span><div><h2>Identity & Publisher Profile</h2><p>Use the legal and publishing details that should appear in your seller records.</p></div></div>
              <div class="seller-grid two">
                ${field('apply-store-name', 'Publisher / Store Name', 'text', 'e.g. Acme Tech Publications')}
                ${field('apply-legal-name', 'Legal / Full Name', 'text', 'Your legal name')}
                ${field('apply-email', 'Email', 'email', state.currentUser?.email || '', true, 'readonly')}
                ${field('apply-phone', 'Phone Number', 'tel', '+91 9876543210', true, 'inputmode="tel" autocomplete="tel"')}
                ${field('apply-country', 'Country', 'text', 'India')}
                ${field('apply-state', 'State', 'text', 'State / Province')}
                ${field('apply-city', 'City', 'text', 'City')}
                ${field('apply-postal', 'Postal / PIN Code', 'text', 'e.g. 110001')}
              </div>
              ${textarea('apply-address', 'Address', 'Full billing / contact address', true, 3)}
              <div class="seller-grid two">
                <div class="seller-field"><label for="apply-publisher-type">Publisher Type *</label><select id="apply-publisher-type" required><option value="">Select publisher type</option><option>Individual Author</option><option>Publisher</option><option>Small Publishing House</option><option>Educational Publisher</option><option>Other</option></select></div>
                ${field('apply-previous-books', 'Previously Published Books', 'number', '0', true, 'min="0" step="1"')}
                ${field('apply-website', 'Website', 'url', 'https://example.com', false)}
                ${field('apply-portfolio', 'Portfolio / Author Profile URL', 'url', 'https://...', false)}
              </div>
            </section>

            <section class="seller-section">
              <div class="seller-section-heading"><span>2</span><div><h2>Publishing Experience</h2><p>Tell Bookora what you publish and which readers you serve.</p></div></div>
              ${textarea('apply-bio', 'Author Bio & Publishing Experience', 'Tell us about your writing, publishing experience and previous publications. Minimum 20 characters.', true, 5)}
              <div class="seller-grid two">
                <div class="seller-field"><label for="apply-categories">Genres / Categories *</label><select id="apply-categories" multiple required><option>Fiction</option><option>Romance</option><option>Business</option><option>Finance</option><option>Education</option><option>Technology</option><option>Self Help</option><option>Productivity</option><option>Biography</option><option>Children</option><option>Health & Wellness</option><option>Exam Preparation</option><option>Other</option></select><small>Use Ctrl/Cmd to select multiple categories.</small></div>
                <div class="seller-field"><label for="apply-languages">Publishing Languages *</label><select id="apply-languages" multiple required><option>English</option><option>Hindi</option><option>Marathi</option><option>Bengali</option><option>Tamil</option><option>Telugu</option><option>Kannada</option><option>Malayalam</option><option>Gujarati</option><option>Punjabi</option><option>Urdu</option><option>Other</option></select><small>Select every language you plan to publish.</small></div>
              </div>
              ${textarea('apply-publishing-description', 'Planned Digital Catalogue', 'Describe the types of ebooks you plan to publish on Bookora. Minimum 20 characters.', true, 4)}
            </section>

            <section class="seller-section">
              <div class="seller-section-heading"><span>3</span><div><h2>Digital Ebook & Rights Information</h2><p>These declarations help Bookora review digital publishing rights before accepting uploads.</p></div></div>
              <div class="seller-field"><label for="apply-formats">Ebook Formats *</label><select id="apply-formats" multiple required><option>EPUB</option><option>PDF</option><option>Both EPUB and PDF</option></select><small>Choose the formats you intend to publish.</small></div>
              <div class="seller-grid two">
                <div class="seller-field"><label for="apply-imprint">Publisher / Imprint Name</label><input id="apply-imprint" placeholder="Optional imprint name"></div>
                <div class="seller-field"><label for="apply-isbn">ISBN Preference</label><select id="apply-isbn"><option value="">Select</option><option>ISBN available</option><option>Will provide ISBN</option><option>No ISBN / not applicable</option></select></div>
                <div class="seller-field"><label for="apply-drm">DRM Preference</label><select id="apply-drm"><option value="">Default / Admin configured</option><option>DRM preferred</option><option>No DRM preferred</option></select></div>
                <div class="seller-field"><label for="apply-ai-disclosure">AI-generated Content Disclosure</label><select id="apply-ai-disclosure"><option value="No AI-generated material">No AI-generated material</option><option value="Contains AI-assisted material">Contains AI-assisted material</option><option value="Contains AI-generated material">Contains AI-generated material</option></select></div>
              </div>
              ${textarea('apply-rights', 'Content / Distribution Rights Declaration', 'Explain that you own or have permission to distribute the digital content you submit.', true, 4)}
              <div class="seller-grid two">
                <div class="seller-field"><label for="apply-accessibility">Accessibility Information</label><textarea id="apply-accessibility" rows="3" placeholder="Optional: accessible text, alt text, screen-reader considerations, etc."></textarea></div>
                <div class="seller-field"><label for="apply-samples">Sample / Preview Availability</label><select id="apply-samples"><option value="Available">Sample available</option><option value="Will provide">Will provide sample</option><option value="Not available">No sample</option></select></div>
              </div>
              <div class="seller-check-group">
                ${checkbox('apply-copyright', 'I confirm that I own the copyright or have the necessary rights to publish this content on Bookora.')}
                ${checkbox('apply-original', 'I confirm that the ebooks I submit are original or lawfully licensed for digital distribution.')}
                ${checkbox('apply-distribution', 'I have the digital distribution rights for every title I submit.')}
              </div>
            </section>

            <section class="seller-section">
              <div class="seller-section-heading"><span>4</span><div><h2>Payout & Tax Profile</h2><p>Bank information is sent to the protected backend. Only masked payout identifiers are mirrored to the admin-facing Firestore seller record.</p></div></div>
              <div class="seller-grid two">
                <div class="seller-field"><label for="apply-payout-method">Payout Method *</label><select id="apply-payout-method" required><option value="">Select payout method</option><option value="Bank Transfer">Bank Transfer</option><option value="UPI">UPI</option></select></div>
                ${field('apply-bank', 'Bank Name', 'text', 'e.g. HDFC Bank')}
                ${field('apply-account-holder', 'Account Holder Name', 'text', 'Name on bank account')}
                ${field('apply-account', 'Account Number', 'password', 'Enter bank account number', true, 'autocomplete="off" inputmode="numeric"')}
                ${field('apply-ifsc', 'IFSC Code', 'text', 'e.g. HDFC0001234', true, 'autocomplete="off"')}
                ${field('apply-upi', 'UPI ID', 'text', 'Optional UPI ID', false, 'autocomplete="off"')}
                ${field('apply-pan', 'PAN / Tax ID', 'text', 'Applicable tax identifier', false, 'autocomplete="off"')}
                <div class="seller-field"><label for="apply-tax-status">Tax Information Status</label><select id="apply-tax-status"><option value="">Select</option><option>Individual / Sole proprietor</option><option>Business / Company</option><option>Tax information available</option><option>Will provide when requested</option><option>Not applicable</option></select></div>
              </div>
              ${textarea('apply-billing-address', 'Billing / Tax Address', 'Optional if the same as the address above; otherwise provide the tax/billing address.', false, 3)}
            </section>

            <section class="seller-section">
              <div class="seller-section-heading"><span>5</span><div><h2>Agreements & Submission</h2><p>Read Bookora's seller terms and submit only when the declarations are accurate.</p></div></div>
              <div class="seller-agreement-box">
                ${checkbox('apply-terms', 'I accept the Bookora Seller Agreement, marketplace rules and the current royalty/pricing terms.')}
                ${checkbox('apply-privacy', 'I acknowledge the Bookora Privacy Policy and consent to processing the information required for seller onboarding.')}
                ${checkbox('apply-content-rights', 'I confirm that Bookora may review submitted digital content for copyright, rights and policy compliance.')}
                ${checkbox('apply-pricing', 'I accept that Bookora may apply the seller royalty/commission settings configured by administration.')}
              </div>
              <input id="apply-terms-version" type="hidden" value="1.0">
              <input id="apply-privacy-version" type="hidden" value="1.0">
              <input id="apply-agreement-version" type="hidden" value="1.0">
              <button id="seller-apply-submit" type="submit" class="btn btn-primary btn-lg seller-submit" ${locked ? 'disabled' : ''}>Submit Seller Application for Review</button>
              <p class="seller-security-note">Your application is validated on the backend. Seller approval, Firestore synchronization and ebook-upload authorization are handled server-side.</p>
            </section>
          </form>
        </div>
      </div>
    </div>

    <style>
      .seller-apply-page{background:var(--bg-secondary);min-height:85vh;padding:3rem 0 6rem}
      .seller-apply-container{max-width:900px}
      .seller-apply-card{background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:clamp(1.25rem,4vw,3rem);box-shadow:var(--shadow-md)}
      .seller-apply-card h1{font-family:var(--font-display);font-size:clamp(1.8rem,4vw,2.35rem);font-weight:800;color:var(--text-primary);margin:.6rem 0 .5rem}
      .seller-intro{color:var(--text-secondary);line-height:1.65;margin:0 0 1.75rem}
      .seller-section{border-top:1px solid #e5e7eb;padding:2rem 0 0;margin-top:2rem}
      .seller-section-heading{display:flex;gap:12px;align-items:flex-start;margin-bottom:1.35rem}
      .seller-section-heading>span{width:32px;height:32px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;flex:none}
      .seller-section-heading h2{margin:0;font-size:1.15rem;color:var(--text-primary)}
      .seller-section-heading p{margin:.25rem 0 0;color:var(--text-secondary);font-size:.85rem;line-height:1.45}
      .seller-grid{display:grid;gap:1rem}.seller-grid.two{grid-template-columns:repeat(2,minmax(0,1fr))}
      .seller-field{margin-bottom:1rem}.seller-field label{display:block;font-size:.83rem;font-weight:700;color:#0f172a;margin-bottom:.4rem}.seller-field input,.seller-field textarea,.seller-field select{width:100%;box-sizing:border-box;padding:.72rem .82rem;border:1px solid var(--border-medium);border-radius:10px;background:#fff;color:var(--text-primary);font:inherit;outline:none}.seller-field textarea{resize:vertical}.seller-field select[multiple]{min-height:120px}.seller-field small{display:block;margin-top:.35rem;color:#64748b;font-size:.72rem;line-height:1.4}
      .seller-field input:focus,.seller-field textarea:focus,.seller-field select:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(124,58,237,.10)}
      .seller-check-group,.seller-agreement-box{display:grid;gap:.75rem;margin-top:.75rem}.seller-check{display:flex;align-items:flex-start;gap:.65rem;color:#334155;font-size:.85rem;line-height:1.5;cursor:pointer}.seller-check input{margin-top:.22rem;accent-color:var(--accent)}
      .seller-agreement-box{padding:1rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px}
      .seller-submit{width:100%;margin-top:1.25rem;font-weight:800}.seller-submit:disabled{opacity:.55;cursor:not-allowed}
      .seller-security-note{text-align:center;color:#64748b;font-size:.75rem;line-height:1.5;margin:.8rem 0 0}
      .seller-status-banner{display:flex;flex-direction:column;gap:3px;padding:1rem 1.1rem;border-radius:12px;margin:0 0 1.5rem;border:1px solid}.seller-status-banner strong{font-size:.9rem}.seller-status-banner span{font-size:.78rem;line-height:1.45}.seller-status-banner.approved{background:#ecfdf5;border-color:#a7f3d0;color:#065f46}.seller-status-banner.pending{background:#fffbeb;border-color:#fde68a;color:#92400e}.seller-status-banner.rejected{background:#fef2f2;border-color:#fecaca;color:#991b1b}.seller-status-banner.suspended{background:#f1f5f9;border-color:#cbd5e1;color:#475569}
      @media(max-width:700px){.seller-apply-page{padding:1.25rem 0 4rem}.seller-grid.two{grid-template-columns:1fr}.seller-apply-card{border-radius:14px;padding:1rem}.seller-section{padding-top:1.5rem;margin-top:1.5rem}}
    </style>
  `;
}

async function loadSellerApplication() {
  if (loadingApplication || !state.token) return;
  loadingApplication = true;
  try {
    const res = await apiFetch('/api/seller/application', { headers: { Authorization: `Bearer ${state.token}` } });
    if (res.ok) {
      const data = await res.json();
      applicationState = data.application || null;
      if (data.seller_status && state.currentUser) state.currentUser.seller_status = data.seller_status;
      if (applicationState?.status === 'pending') Toast.show('Your seller application is already under review.', 'info');
      const root = document.querySelector('.seller-apply-page');
      if (root) {
        const container = root.parentElement;
        if (container && window.location.hash.includes('/seller/apply')) {
          const scrollY = window.scrollY;
          container.innerHTML = renderSellerApplyPage();
          initSellerApplyEvents();
          window.scrollTo({ top: scrollY, behavior: 'instant' });
        }
      }
    }
  } catch (error) {
    console.warn('Seller application status load skipped:', error);
  } finally {
    loadingApplication = false;
  }
}

function buildPayload() {
  return {
    publisherName: inputValue('apply-store-name'),
    legalName: inputValue('apply-legal-name'),
    email: inputValue('apply-email'),
    phone: inputValue('apply-phone'),
    country: inputValue('apply-country'),
    state: inputValue('apply-state'),
    city: inputValue('apply-city'),
    address: inputValue('apply-address'),
    postalCode: inputValue('apply-postal'),
    publisherType: inputValue('apply-publisher-type'),
    authorBio: inputValue('apply-bio'),
    previousBooksCount: Number(inputValue('apply-previous-books') || 0),
    website: inputValue('apply-website'),
    portfolioUrl: inputValue('apply-portfolio'),
    categories: selectedValues('apply-categories'),
    languages: selectedValues('apply-languages'),
    publishingDescription: inputValue('apply-publishing-description'),
    ebookFormats: selectedValues('apply-formats'),
    copyrightOwner: checked('apply-copyright'),
    originalContent: checked('apply-original'),
    distributionRights: checked('apply-distribution'),
    rightsDeclaration: inputValue('apply-rights'),
    aiContentDisclosure: inputValue('apply-ai-disclosure'),
    drmPreference: inputValue('apply-drm'),
    accessibilityInfo: inputValue('apply-accessibility'),
    sampleAvailability: inputValue('apply-samples'),
    isbnPreference: inputValue('apply-isbn'),
    imprintName: inputValue('apply-imprint'),
    payoutMethod: inputValue('apply-payout-method'),
    bankName: inputValue('apply-bank'),
    accountHolderName: inputValue('apply-account-holder'),
    accountNumber: inputValue('apply-account'),
    ifscCode: inputValue('apply-ifsc').toUpperCase(),
    upiId: inputValue('apply-upi'),
    pan: inputValue('apply-pan').toUpperCase(),
    taxInfoStatus: inputValue('apply-tax-status'),
    billingAddress: inputValue('apply-billing-address'),
    termsAccepted: checked('apply-terms'),
    privacyAccepted: checked('apply-privacy'),
    contentRightsAccepted: checked('apply-content-rights'),
    pricingAccepted: checked('apply-pricing'),
    termsVersion: inputValue('apply-terms-version') || '1.0',
    privacyVersion: inputValue('apply-privacy-version') || '1.0',
    agreementVersion: inputValue('apply-agreement-version') || '1.0'
  };
}

export function initSellerApplyEvents() {
  const form = document.getElementById('seller-apply-form');
  if (!form) return;

  loadSellerApplication();

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!state.token) {
      Toast.show('Please sign in before applying for seller privileges.', 'warning');
      window.location.hash = '#/login';
      return;
    }
    const submit = document.getElementById('seller-apply-submit');
    if (submit?.disabled) return;
    const payload = buildPayload();
    if (payload.authorBio.length < 20 || payload.publishingDescription.length < 20) {
      Toast.show('Please provide at least 20 characters for your publishing experience and catalogue description.', 'warning');
      return;
    }
    submit.disabled = true;
    submit.textContent = 'Submitting application...';
    try {
      const res = await apiFetch('/api/seller/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.token}` },
        body: JSON.stringify(payload)
      });
      let data = {};
      try { data = await res.json(); } catch (_) {}
      if (!res.ok || !data.success) {
        const detail = Array.isArray(data.fields) && data.fields.length ? ` ${data.fields.slice(0, 3).join(', ')}${data.fields.length > 3 ? '...' : ''}` : '';
        throw new Error((data.error || 'Seller application could not be submitted.') + detail);
      }
      applicationState = data.application || { status: 'pending' };
      if (state.currentUser) state.currentUser.seller_status = 'pending';
      Toast.show('Seller application submitted. Admin review is now pending.', 'success');
      const root = document.querySelector('.seller-apply-page');
      const container = root?.parentElement;
      if (container) {
        container.innerHTML = renderSellerApplyPage();
        initSellerApplyEvents();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error('Seller application submit error:', error);
      Toast.show(error.message || 'Unable to submit seller application.', 'error');
      submit.disabled = false;
      submit.textContent = 'Submit Seller Application for Review';
    }
  });
}
