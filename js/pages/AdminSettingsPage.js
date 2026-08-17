// Bookora Admin Settings - Firebase/Firestore backed
import { state } from '../state.js';
import { Toast } from '../components/Toast.js';
import { updateSEO } from '../utils/seo.js';

const DEFAULTS = {
  general: { website_name: 'Bookora', tagline: 'Discover. Read. Publish.', description: 'Bookora is a modern digital eBook marketplace.', support_email: 'support@bookora.com', contact_email: 'contact@bookora.com' },
  branding: { primary_accent: '#2563EB', secondary_accent: '#1D4ED8' },
  marketplace: { seller_commission_pct: 85, platform_commission_pct: 15, seller_approval_required: true, book_approval_required: true, reviews_enabled: true, wishlist_enabled: true, downloads_enabled: true, pdf_preview_enabled: true },
  payments: { cashfree_environment: 'SANDBOX', cashfree_app_id: '', api_version: '2023-08-01' },
  currency: { default_display_currency: 'INR', currency_symbol: '₹', currency_position: 'prefix', decimal_places: 2, payment_currency: 'INR' },
  maintenance: { enabled: false, message: 'Bookora is undergoing scheduled platform enhancements.' },
  books_config: { max_pdf_size_mb: 100, preview_page_limit: 5, allowed_file_types: ['PDF', 'EPUB'] },
  external_config: { external_listings_enabled: true, allowed_protocols: ['https:'], require_redirect_confirmation: true },
  ai_config: { groq_model: 'llama-3.3-70b-versatile' }
};

const clone = value => JSON.parse(JSON.stringify(value));

function mergedSettings() {
  const src = state.settings || {};
  return {
    ...clone(DEFAULTS),
    ...src,
    general: { ...DEFAULTS.general, ...(src.general || {}) },
    branding: { ...DEFAULTS.branding, ...(src.branding || {}) },
    marketplace: { ...DEFAULTS.marketplace, ...(src.marketplace || {}) },
    payments: { ...DEFAULTS.payments, ...(src.payments || {}) },
    currency: { ...DEFAULTS.currency, ...(src.currency || {}) },
    maintenance: { ...DEFAULTS.maintenance, ...(src.maintenance || {}) },
    books_config: { ...DEFAULTS.books_config, ...(src.books_config || {}) },
    external_config: { ...DEFAULTS.external_config, ...(src.external_config || {}) },
    ai_config: { ...DEFAULTS.ai_config, ...(src.ai_config || {}) }
  };
}

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

export function renderAdminSettingsPage(activeSection = 'general') {
  updateSEO({ title: 'Bookora Platform Settings', description: 'Manage Bookora platform configuration.' });
  const s = mergedSettings();
  const sections = [
    ['general','General & Site Info'], ['branding','Branding & Theme'], ['marketplace','Marketplace & Fees'],
    ['payments','Payments & Cashfree'], ['currency','Currency & Display'], ['maintenance','Maintenance Mode'],
    ['books','eBook Files & Limits'], ['external','External Link Security'], ['database','Google Drive Database'], ['groq','Groq AI Configuration']
  ];

  return `
  <div class="admin-settings-page" style="background:var(--bg-secondary);min-height:85vh;padding:2.5rem 0 5rem">
    <div class="container">
      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:1rem;margin-bottom:2rem;flex-wrap:wrap">
        <div><div class="badge badge-bookora">🛡️ Admin Configuration</div><h1 style="font-size:2.2rem;font-weight:800;margin:.5rem 0">Bookora Platform Settings</h1><p style="color:var(--text-secondary);margin:0">All settings below are connected to Firebase Cloud Firestore.</p></div>
        <button id="save-all-settings-btn" class="btn btn-primary btn-lg">Save All Settings</button>
      </div>
      <div class="settings-grid-layout" style="display:grid;grid-template-columns:260px minmax(0,1fr);gap:1.5rem;align-items:start">
        <aside style="background:#fff;border:1px solid var(--border-subtle);border-radius:16px;padding:.65rem;position:sticky;top:90px">
          <div style="font-size:.72rem;font-weight:800;color:var(--text-muted);text-transform:uppercase;padding:.65rem">Configuration Categories</div>
          ${sections.map(([id,name]) => `<button type="button" class="settings-tab-btn ${activeSection===id?'active':''}" data-section="${id}" style="width:100%;text-align:left;border:0;border-radius:10px;padding:.75rem .8rem;margin:2px 0;background:${activeSection===id?'var(--accent-light)':'transparent'};color:${activeSection===id?'var(--accent)':'var(--text-secondary)'};font-weight:700;cursor:pointer">${name}<span style="float:right">›</span></button>`).join('')}
        </aside>
        <section style="background:#fff;border:1px solid var(--border-subtle);border-radius:16px;padding:2rem">
          <form id="admin-settings-form">
            <div id="sec-general" class="settings-section" style="display:${activeSection==='general'?'block':'none'}"><h2>General Platform Information</h2><div class="settings-fields">
              ${input('set-website-name','Website Name',s.general.website_name)}${input('set-tagline','Tagline',s.general.tagline)}${textarea('set-desc','Website Description',s.general.description)}${input('set-support-email','Support Email',s.general.support_email,'email')}${input('set-contact-email','Contact Email',s.general.contact_email,'email')}
            </div></div>

            <div id="sec-branding" class="settings-section" style="display:${activeSection==='branding'?'block':'none'}"><h2>Branding & Theme</h2><div class="settings-fields">${color('set-primary-accent','Primary Accent',s.branding.primary_accent)}${color('set-secondary-accent','Secondary Accent',s.branding.secondary_accent)}</div><p class="settings-note">Saving these colors updates the stored platform branding configuration.</p></div>

            <div id="sec-marketplace" class="settings-section" style="display:${activeSection==='marketplace'?'block':'none'}"><h2>Marketplace Rules & Fees</h2><div class="settings-fields">${number('set-author-royalty','Seller/Author Royalty (%)',s.marketplace.seller_commission_pct,0,100,.5)}${number('set-platform-fee','Platform Commission (%)',s.marketplace.platform_commission_pct,0,100,.5)}</div>${toggle('set-seller-approval-req','Require Seller Application Approval',s.marketplace.seller_approval_required)}${toggle('set-book-approval-req','Require Book Approval',s.marketplace.book_approval_required)}${toggle('set-reviews-enabled','Reviews Enabled',s.marketplace.reviews_enabled)}${toggle('set-wishlist-enabled','Wishlist Enabled',s.marketplace.wishlist_enabled)}${toggle('set-downloads-enabled','Downloads Enabled',s.marketplace.downloads_enabled)}${toggle('set-preview-enabled','PDF Preview Enabled',s.marketplace.pdf_preview_enabled)}</div>

            <div id="sec-payments" class="settings-section" style="display:${activeSection==='payments'?'block':'none'}"><h2>Payments & Cashfree</h2><div class="settings-fields"><div><label>Environment</label><select id="set-cf-env"><option value="SANDBOX" ${s.payments.cashfree_environment==='SANDBOX'?'selected':''}>SANDBOX (Test)</option><option value="PRODUCTION" ${s.payments.cashfree_environment==='PRODUCTION'?'selected':''}>PRODUCTION (Live)</option></select></div>${input('set-cf-appid','Cashfree App ID',s.payments.cashfree_app_id)}${input('set-cf-api-version','Cashfree API Version',s.payments.api_version)}</div><div class="settings-note">For security, the Cashfree Secret Key is not stored by this browser page. Keep it in the server/Apps Script secret configuration.</div></div>

            <div id="sec-currency" class="settings-section" style="display:${activeSection==='currency'?'block':'none'}"><h2>Currency & Display</h2><div class="settings-fields"><div><label>Display Currency</label><select id="set-display-curr"><option value="INR" ${s.currency.default_display_currency==='INR'?'selected':''}>INR (₹)</option><option value="USD" ${s.currency.default_display_currency==='USD'?'selected':''}>USD ($)</option></select></div>${number('set-decimal-places','Decimal Places',s.currency.decimal_places,0,4,1)}</div></div>

            <div id="sec-maintenance" class="settings-section" style="display:${activeSection==='maintenance'?'block':'none'}"><h2>Maintenance Mode</h2>${toggle('set-maint-enabled','Enable Maintenance Mode',s.maintenance.enabled)}${textarea('set-maint-msg','Maintenance Message',s.maintenance.message)}</div>

            <div id="sec-books" class="settings-section" style="display:${activeSection==='books'?'block':'none'}"><h2>eBook Files & Limits</h2><div class="settings-fields">${number('set-max-pdf-size','Maximum Upload Size (MB)',s.books_config.max_pdf_size_mb,10,500,1)}${number('set-preview-limit','Free Preview Page Limit',s.books_config.preview_page_limit,1,20,1)}</div><div class="settings-note">Allowed file types: PDF, EPUB.</div></div>

            <div id="sec-external" class="settings-section" style="display:${activeSection==='external'?'block':'none'}"><h2>External Link Security</h2>${toggle('set-ext-enabled','External Listings Enabled',s.external_config.external_listings_enabled)}${toggle('set-ext-redirect-confirm','Show External Redirect Confirmation',s.external_config.require_redirect_confirmation)}<div class="settings-note">Only HTTPS external links should be accepted.</div></div>

            <div id="sec-database" class="settings-section" style="display:${activeSection==='database'?'block':'none'}"><h2>Firebase Database & Backups</h2><div class="settings-note"><strong>Database:</strong> Firebase Cloud Firestore<br><strong>Settings document:</strong> settings/public</div><div style="display:flex;gap:.75rem;flex-wrap:wrap;margin-top:1rem"><button type="button" id="check-db-health-btn" class="btn btn-secondary">Check Firestore Health</button><button type="button" id="reload-settings-btn" class="btn btn-secondary">Reload Settings</button></div></div>

            <div id="sec-groq" class="settings-section" style="display:${activeSection==='groq'?'block':'none'}"><h2>Groq AI Configuration</h2><div class="settings-fields"><div><label>Groq Model</label><select id="set-groq-model"><option value="llama-3.3-70b-versatile" ${s.ai_config.groq_model==='llama-3.3-70b-versatile'?'selected':''}>llama-3.3-70b-versatile</option><option value="llama-3.1-8b-instant" ${s.ai_config.groq_model==='llama-3.1-8b-instant'?'selected':''}>llama-3.1-8b-instant</option></select></div></div><div class="settings-note">Groq API keys must remain server-side. This page only stores the selected model.</div></div>
          </form>
        </section>
      </div>
    </div>
  </div>
  <style>.settings-section h2{font-size:1.35rem;margin:0 0 1.5rem;padding-bottom:.8rem;border-bottom:1px solid var(--border-subtle)}.settings-fields{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.2rem}.settings-fields>div:has(textarea){grid-column:1/-1}.settings-section label{display:block;font-size:.82rem;font-weight:700;margin-bottom:.35rem}.settings-section input,.settings-section select,.settings-section textarea{width:100%;box-sizing:border-box;padding:.72rem .85rem;border:1px solid var(--border-medium);border-radius:10px;background:#fff;font:inherit}.settings-section textarea{resize:vertical}.settings-note{padding:1rem;border-radius:10px;background:var(--bg-secondary);color:var(--text-secondary);font-size:.85rem;margin-top:1rem}.setting-toggle{display:flex;justify-content:space-between;align-items:center;padding:1rem 0;border-top:1px solid var(--border-subtle)}@media(max-width:800px){.settings-grid-layout{grid-template-columns:1fr!important}.settings-grid-layout aside{position:static;display:grid;grid-template-columns:1fr 1fr;gap:3px}.settings-grid-layout aside>div{grid-column:1/-1}.settings-fields{grid-template-columns:1fr}.settings-section{overflow:hidden}section{padding:1.2rem!important}}@media(max-width:480px){.settings-grid-layout aside{grid-template-columns:1fr}.admin-settings-page{padding-top:1rem!important}.admin-settings-page h1{font-size:1.65rem!important}}</style>`;
}

function input(id,label,value,type='text'){return `<div><label for="${id}">${label}</label><input id="${id}" type="${type}" value="${esc(value)}"></div>`}
function textarea(id,label,value){return `<div style="grid-column:1/-1"><label for="${id}">${label}</label><textarea id="${id}" rows="3">${esc(value)}</textarea></div>`}
function color(id,label,value){return `<div><label for="${id}">${label}</label><input id="${id}" type="color" value="${esc(value)}" style="height:46px;padding:4px"></div>`}
function number(id,label,value,min,max,step){return `<div><label for="${id}">${label}</label><input id="${id}" type="number" value="${Number(value)}" min="${min}" max="${max}" step="${step}"></div>`}
function toggle(id,label,checked){return `<label class="setting-toggle"><span><strong>${label}</strong></span><input id="${id}" type="checkbox" ${checked?'checked':''} style="width:20px;height:20px;accent-color:var(--accent)"></label>`}

export function initAdminSettingsEvents(){
  document.querySelectorAll('.settings-tab-btn').forEach(btn=>btn.addEventListener('click',()=>{
    const id=btn.dataset.section;
    document.querySelectorAll('.settings-section').forEach(x=>x.style.display='none');
    document.getElementById(`sec-${id}`)?.style.setProperty('display','block');
    document.querySelectorAll('.settings-tab-btn').forEach(x=>{x.classList.remove('active');x.style.background='transparent';x.style.color='var(--text-secondary)'});
    btn.classList.add('active');btn.style.background='var(--accent-light)';btn.style.color='var(--accent)';
  }));

  document.getElementById('save-all-settings-btn')?.addEventListener('click', saveSettings);
  document.getElementById('reload-settings-btn')?.addEventListener('click', async()=>{await state.syncData();window.location.hash=window.location.hash;Toast.show('Settings reloaded from Firestore.','success');});
  document.getElementById('check-db-health-btn')?.addEventListener('click', async()=>{
    try{const {db}=await state.getFirebase();await db.collection('settings').doc('public').get();Toast.show('Firestore connection is working.','success');}
    catch(e){Toast.show(`Firestore error: ${e.message}`,'error');}
  });
}

async function saveSettings(){
  if(!state.isAdmin){Toast.show('Admin authorization required.','error');return;}
  const btn=document.getElementById('save-all-settings-btn');
  const before=mergedSettings();
  const currency=document.getElementById('set-display-curr')?.value||before.currency.default_display_currency;
  const next={
    ...before,
    general:{website_name:v('set-website-name',before.general.website_name),tagline:v('set-tagline',before.general.tagline),description:v('set-desc',before.general.description),support_email:v('set-support-email',before.general.support_email),contact_email:v('set-contact-email',before.general.contact_email)},
    branding:{primary_accent:v('set-primary-accent',before.branding.primary_accent),secondary_accent:v('set-secondary-accent',before.branding.secondary_accent)},
    marketplace:{seller_commission_pct:n('set-author-royalty',before.marketplace.seller_commission_pct),platform_commission_pct:n('set-platform-fee',before.marketplace.platform_commission_pct),seller_approval_required:c('set-seller-approval-req'),book_approval_required:c('set-book-approval-req'),reviews_enabled:c('set-reviews-enabled'),wishlist_enabled:c('set-wishlist-enabled'),downloads_enabled:c('set-downloads-enabled'),pdf_preview_enabled:c('set-preview-enabled')},
    payments:{...before.payments,cashfree_environment:v('set-cf-env',before.payments.cashfree_environment),cashfree_app_id:v('set-cf-appid',before.payments.cashfree_app_id),api_version:v('set-cf-api-version',before.payments.api_version)},
    currency:{...before.currency,default_display_currency:currency,currency_symbol:currency==='INR'?'₹':'$',decimal_places:n('set-decimal-places',before.currency.decimal_places),payment_currency:'INR'},
    maintenance:{enabled:c('set-maint-enabled'),message:v('set-maint-msg',before.maintenance.message)},
    books_config:{...before.books_config,max_pdf_size_mb:n('set-max-pdf-size',before.books_config.max_pdf_size_mb),preview_page_limit:n('set-preview-limit',before.books_config.preview_page_limit),allowed_file_types:['PDF','EPUB']},
    external_config:{...before.external_config,external_listings_enabled:c('set-ext-enabled'),allowed_protocols:['https:'],require_redirect_confirmation:c('set-ext-redirect-confirm')},
    ai_config:{...before.ai_config,groq_model:v('set-groq-model',before.ai_config.groq_model)}
  };
  delete next.payments.cashfree_secret_key;
  delete next.ai_config.groq_api_key;
  try{
    btn.disabled=true;btn.textContent='Saving...';
    const {db}=await state.getFirebase();
    await db.collection('settings').doc('public').set({...next,updatedAt:new Date().toISOString(),updatedBy:state.currentUser?.uid||''},{merge:false});
    state.settings=next;state.notify('SETTINGS_UPDATED',next);
    if(next.branding?.primary_accent)document.documentElement.style.setProperty('--accent',next.branding.primary_accent);
    if(next.branding?.secondary_accent)document.documentElement.style.setProperty('--accent-hover',next.branding.secondary_accent);
    Toast.show('All settings saved to Firebase Firestore.','success');
  }catch(e){console.error(e);Toast.show(`Save failed: ${e.message}`,'error');}
  finally{btn.disabled=false;btn.textContent='Save All Settings'}
}
const el=id=>document.getElementById(id);
const v=(id,fallback='')=>el(id)?.value ?? fallback;
const n=(id,fallback=0)=>Number(el(id)?.value ?? fallback);
const c=id=>!!el(id)?.checked;
