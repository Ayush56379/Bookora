import { apiFetch } from '../config.js';
import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

let submitting = false;

const esc = value => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/\"/g, '&quot;').replace(/'/g, '&#039;');

const input = (id, label, type = 'text', placeholder = '', required = true, extra = '') => `
  <div class="quick-field">
    <label for="${id}">${label}${required ? ' *' : ''}</label>
    <input id="${id}" type="${type}" placeholder="${esc(placeholder)}" ${required ? 'required' : ''} ${extra}>
  </div>`;

const area = (id, label, placeholder, required = true) => `
  <div class="quick-field full">
    <label for="${id}">${label}${required ? ' *' : ''}</label>
    <textarea id="${id}" rows="4" placeholder="${esc(placeholder)}" ${required ? 'required' : ''}></textarea>
  </div>`;

const check = (id, text) => `<label class="quick-check"><input id="${id}" type="checkbox" required><span>${text}</span></label>`;

const value = id => document.getElementById(id)?.value?.trim() || '';
const checked = id => document.getElementById(id)?.checked === true;

export function renderSellerApplyPage() {
  updateSEO({
    title: 'Become a Bookora Seller',
    description: 'Quick seller onboarding for authors and publishers on Bookora.'
  });

  const status = String(state.currentUser?.seller_status || 'none').toLowerCase();
  if (status === 'pending') return `
    <main class="quick-seller-page"><div class="quick-card quick-result">
      <div class="quick-icon">✓</div><h1>Application Already Submitted</h1>
      <p>Your seller application is under review. You do not need to submit it again.</p>
      <a class="btn btn-primary" href="#/">Back to Bookora</a>
    </div></main>`;
  if (status === 'approved') return `
    <main class="quick-seller-page"><div class="quick-card quick-result">
      <div class="quick-icon">✓</div><h1>Seller Account Approved</h1>
      <p>You already have seller access.</p>
      <a class="btn btn-primary" href="#/seller/dashboard">Open Seller Dashboard</a>
    </div></main>`;

  return `
    <main class="quick-seller-page">
      <div class="quick-card">
        <div class="quick-badge">QUICK SELLER ONBOARDING</div>
        <h1>Become a Bookora Seller</h1>
        <p class="quick-intro">Only the information needed for initial seller review is requested here. Payout and other profile details can be completed later from Seller Settings.</p>

        <form id="quick-seller-form" novalidate>
          <section class="quick-section">
            <h2>Basic details</h2>
            <div class="quick-grid">
              ${input('quick-store', 'Publisher / Store Name', 'text', 'Your author or publishing name')}
              ${input('quick-legal', 'Legal / Full Name', 'text', 'Your full name')}
              ${input('quick-email', 'Email', 'email', state.currentUser?.email || '', true, 'readonly')}
              ${input('quick-phone', 'Phone Number', 'tel', '+91 9876543210', true, 'autocomplete="tel" inputmode="tel"')}
              <div class="quick-field"><label for="quick-type">Publisher Type *</label><select id="quick-type" required><option value="">Select</option><option value="Individual Author">Individual Author</option><option value="Publisher">Publisher</option><option value="Small Publishing House">Small Publishing House</option><option value="Educational Publisher">Educational Publisher</option></select></div>
              <div class="quick-field"><label for="quick-category">Main Category *</label><select id="quick-category" required><option value="">Select</option><option>Fiction</option><option>Romance</option><option>Business</option><option>Finance</option><option>Education</option><option>Technology</option><option>Self Help</option><option>Productivity</option><option>Biography</option><option>Children</option><option>Health & Wellness</option><option>Exam Preparation</option><option>Other</option></select></div>
              <div class="quick-field"><label for="quick-language">Main Publishing Language *</label><select id="quick-language" required><option value="">Select</option><option>English</option><option>Hindi</option><option>Marathi</option><option>Bengali</option><option>Tamil</option><option>Telugu</option><option>Kannada</option><option>Malayalam</option><option>Gujarati</option><option>Punjabi</option><option>Urdu</option><option>Other</option></select></div>
              <div class="quick-field"><label for="quick-format">Ebook Format *</label><select id="quick-format" required><option value="">Select</option><option>EPUB</option><option>PDF</option><option>Both EPUB and PDF</option></select></div>
            </div>
            ${area('quick-bio', 'Author / Publishing Bio', 'Briefly describe who you are and what you publish. Minimum 20 characters.')}
            ${area('quick-catalogue', 'What do you plan to publish?', 'Briefly describe the ebooks you plan to publish on Bookora. Minimum 20 characters.')}
            ${area('quick-rights', 'Rights Declaration', 'Confirm that you own or have permission to distribute the ebooks you submit.')}
          </section>

          <section class="quick-section">
            <h2>Confirm & submit</h2>
            <div class="quick-checks">
              ${check('quick-rights-confirm', 'I confirm that I own the copyright or have the necessary rights to publish my content.')}
              ${check('quick-original', 'I confirm that the content I submit is original or lawfully licensed.')}
              ${check('quick-distribution', 'I confirm that I have digital distribution rights for the content I submit.')}
              ${check('quick-terms', 'I accept the Bookora Seller Agreement, marketplace rules and current royalty/pricing terms.')}
              ${check('quick-privacy', 'I acknowledge the Bookora Privacy Policy and seller-data processing.')}
              ${check('quick-content', 'I allow Bookora to review submitted content for copyright and policy compliance.')}
              ${check('quick-pricing', 'I accept the seller royalty/commission settings configured by administration.')}
            </div>
            <button id="quick-seller-submit" type="submit" class="btn btn-primary quick-submit">Submit Seller Application</button>
            <div id="quick-seller-status" class="quick-status" aria-live="polite"></div>
          </section>
        </form>
      </div>
    </main>
    <style>
      .quick-seller-page{min-height:85vh;background:var(--bg-secondary);padding:32px 16px 64px}.quick-card{max-width:820px;margin:auto;background:#fff;border:1px solid var(--border-subtle);border-radius:20px;padding:clamp(20px,4vw,40px);box-shadow:var(--shadow-md)}
      .quick-badge{display:inline-block;padding:6px 10px;border-radius:999px;background:#eef2ff;color:#4338ca;font-size:11px;font-weight:800;letter-spacing:.06em}.quick-card h1{margin:12px 0 8px;font-size:clamp(28px,4vw,38px);color:var(--text-primary)}.quick-intro{margin:0 0 24px;color:var(--text-secondary);line-height:1.6}.quick-section{border-top:1px solid #e5e7eb;padding-top:24px;margin-top:24px}.quick-section h2{margin:0 0 16px;font-size:18px;color:var(--text-primary)}.quick-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.quick-field{margin:0}.quick-field.full{margin-top:14px}.quick-field label{display:block;font-size:13px;font-weight:700;color:#0f172a;margin-bottom:6px}.quick-field input,.quick-field select,.quick-field textarea{width:100%;box-sizing:border-box;padding:11px 12px;border:1px solid var(--border-medium);border-radius:10px;background:#fff;color:var(--text-primary);font:inherit}.quick-field textarea{resize:vertical}.quick-field input:focus,.quick-field select:focus,.quick-field textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(124,58,237,.1)}.quick-checks{display:grid;gap:10px}.quick-check{display:flex;align-items:flex-start;gap:9px;color:#334155;font-size:13px;line-height:1.45}.quick-check input{margin-top:3px}.quick-submit{margin-top:20px;width:100%;min-height:48px}.quick-status{min-height:24px;margin-top:12px;font-size:13px;text-align:center;color:#475569}.quick-result{text-align:center;margin-top:8vh}.quick-icon{font-size:42px;margin-bottom:8px}.quick-result p{color:var(--text-secondary);margin:0 0 20px}.quick-submit[disabled]{opacity:.65;cursor:not-allowed}@media(max-width:680px){.quick-grid{grid-template-columns:1fr}}
    </style>`;
}

export async function initSellerApplyEvents() {
  const form = document.getElementById('quick-seller-form');
  if (!form) return;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting) return;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (value('quick-bio').length < 20 || value('quick-catalogue').length < 20) {
      Toast.error?.('Please enter at least 20 characters in the bio and catalogue description.');
      return;
    }
    const submit = document.getElementById('quick-seller-submit');
    const status = document.getElementById('quick-seller-status');
    submitting = true;
    submit.disabled = true;
    submit.textContent = 'Submitting…';
    status.textContent = 'Checking your application and saving it securely…';
    try {
      const selectedCategory = value('quick-category');
      const selectedLanguage = value('quick-language');
      const payload = {
        publisherName: value('quick-store'),
        legalName: value('quick-legal'),
        email: value('quick-email'),
        phone: value('quick-phone'),
        publisherType: value('quick-type'),
        authorBio: value('quick-bio'),
        categories: selectedCategory ? [selectedCategory] : [],
        languages: selectedLanguage ? [selectedLanguage] : [],
        publishingDescription: value('quick-catalogue'),
        ebookFormats: value('quick-format') ? [value('quick-format')] : [],
        copyrightOwner: checked('quick-rights-confirm'),
        originalContent: checked('quick-original'),
        distributionRights: checked('quick-distribution'),
        rightsDeclaration: value('quick-rights'),
        termsAccepted: checked('quick-terms'),
        privacyAccepted: checked('quick-privacy'),
        contentRightsAccepted: checked('quick-content'),
        pricingAccepted: checked('quick-pricing'),
        termsVersion: '1.0',
        privacyVersion: '1.0',
        agreementVersion: '1.0'
      };
      const response = await apiFetch('/api/seller/apply', { method: 'POST', body: JSON.stringify(payload) });
      let data = {};
      try { data = await response.json(); } catch (_) {}
      if (!response.ok || !data.success) {
        const fields = Array.isArray(data.fields) ? data.fields.slice(0, 4).join(', ') : '';
        throw new Error(data.error || fields || `Application failed (${response.status})`);
      }
      state.currentUser = { ...(state.currentUser || {}), seller_status: 'pending', sellerStatus: 'inactive' };
      try { localStorage.setItem('bookora_user_profile', JSON.stringify(state.currentUser)); } catch (_) {}
      status.textContent = 'Application submitted successfully.';
      Toast.success?.('Seller application submitted successfully.');
      form.innerHTML = `<div class="quick-result"><div class="quick-icon">✓</div><h2>Application Submitted</h2><p>Your application is now pending admin review.</p><a class="btn btn-primary" href="#/">Back to Bookora</a></div>`;
    } catch (error) {
      console.error('[Bookora seller quick apply]', error);
      status.textContent = error?.message || 'Application could not be submitted. Please try again.';
      Toast.error?.(error?.message || 'Seller application could not be submitted.');
      submit.disabled = false;
      submit.textContent = 'Submit Seller Application';
    } finally {
      submitting = false;
    }
  });
}
