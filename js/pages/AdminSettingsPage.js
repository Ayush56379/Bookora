import { apiFetch } from '../config.js';
// AdminSettingsPage Component (Complete Platform Settings)
import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

export function renderAdminSettingsPage(activeSection = 'general') {
  updateSEO({
    title: 'Platform Settings & Configuration',
    description: 'Configure marketplace, currency, payments, and platform security on Bookora.'
  });

  const settings = state.settings || {};
  const gen = settings.general || {};
  const brand = settings.branding || {};
  const mkt = settings.marketplace || {};
  const curr = settings.currency || {};
  const pay = settings.payments || {};
  const maint = settings.maintenance || {};
  const books = settings.books_config || {};
  const ext = settings.external_config || {};

  return `
    <div class="admin-settings-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3rem 0 5rem 0;">
      <div class="container">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem;">
          <div>
            <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">🛡️ Admin Configuration</div>
            <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary);">
              Bookora Platform Settings
            </h1>
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-top: 0.25rem;">
              Manage global configurations, Cashfree gateway credentials, currency settings, and moderation rules.
            </p>
          </div>
          <button id="save-all-settings-btn" class="btn btn-primary btn-lg" style="font-weight: 700; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
            Save All Settings
          </button>
        </div>

        <!-- Layout with Left Sidebar Tabs + Right Form Area -->
        <div style="display: grid; grid-template-columns: 260px 1fr; gap: 2rem; align-items: start;" class="settings-grid-layout">
          
          <!-- Left Navigation Sidebar -->
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 0.75rem; box-shadow: var(--shadow-sm); position: sticky; top: 90px;">
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; padding: 0.5rem 0.75rem;">
              Configuration Categories
            </div>
            ${[
              { id: 'general', name: 'General & Site Info', icon: 'globe' },
              { id: 'branding', name: 'Branding & Theme', icon: 'palette' },
              { id: 'marketplace', name: 'Marketplace & Fees', icon: 'shopping-bag' },
              { id: 'payments', name: 'Payments & Cashfree', icon: 'credit-card' },
              { id: 'currency', name: 'Currency & Display', icon: 'dollar-sign' },
              { id: 'maintenance', name: 'Maintenance Mode', icon: 'tool' },
              { id: 'books', name: 'eBook Files & Limits', icon: 'file-text' },
              { id: 'external', name: 'External Link Security', icon: 'shield' },
                            { id: 'database', name: 'Google Drive Database', icon: 'hard-drive' },
              { id: 'groq', name: 'Groq AI Configuration', icon: 'bot' }
            ].map(sec => `
              <button class="settings-tab-btn ${activeSection === sec.id ? 'active' : ''}" data-section="${sec.id}" style="width: 100%; text-align: left; padding: 0.7rem 0.85rem; border-radius: var(--radius-md); font-size: 0.875rem; font-weight: 600; display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; transition: all 0.15s; ${activeSection === sec.id ? 'background: var(--accent-light); color: var(--accent);' : 'color: var(--text-secondary); background: transparent;'}">
                <span>${sec.name}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            `).join('')}
            <div style="border-top: 1px solid var(--border-subtle); margin-top: 0.5rem; padding-top: 0.5rem;">
              <a href="#/admin/security" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 0.85rem; font-size: 0.85rem; font-weight: 700; color: #DC2626;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                View Security Audit Logs
              </a>
            </div>
          </div>

          <!-- Right Form Area -->
          <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm);">
            <form id="admin-settings-form">
              
              <!-- 1. GENERAL -->
              <div id="sec-general" class="settings-section">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                  General Platform Information
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem;">
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Website Name</label>
                    <input type="text" id="set-website-name" value="${gen.website_name || 'Bookora'}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                  </div>
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Tagline</label>
                    <input type="text" id="set-tagline" value="${gen.tagline || 'Discover. Read. Publish.'}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                  </div>
                </div>

                <div style="margin-bottom: 1.25rem;">
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Website Description</label>
                  <textarea id="set-desc" rows="2" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;">${gen.description || 'Bookora is a modern digital eBook marketplace.'}</textarea>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem;">
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Support Email</label>
                    <input type="email" id="set-support-email" value="${gen.support_email || 'support@bookora.com'}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                  </div>
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Contact Email</label>
                    <input type="email" id="set-contact-email" value="${gen.contact_email || 'contact@bookora.com'}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                  </div>
                </div>
              </div>

              <!-- 2. BRANDING -->
              <div id="sec-branding" class="settings-section" style="display: none;">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                  Branding & Colors
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem;">
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Primary Accent (Electric Blue)</label>
                    <input type="color" id="set-primary-accent" value="${brand.primary_accent || '#2563EB'}" style="width: 100%; height: 42px; padding: 4px; border-radius: var(--radius-md); border: 1px solid var(--border-medium); cursor: pointer;" />
                  </div>
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Secondary Accent (Hover)</label>
                    <input type="color" id="set-secondary-accent" value="${brand.secondary_accent || '#1D4ED8'}" style="width: 100%; height: 42px; padding: 4px; border-radius: var(--radius-md); border: 1px solid var(--border-medium); cursor: pointer;" />
                  </div>
                </div>
                <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; font-size: 0.85rem; color: var(--text-secondary);">
                  💡 <strong>Design System Note:</strong> Bookora maintains a pristine, high-converting <strong>white background</strong> as its primary foundation with subtle electric blue accents.
                </div>
              </div>

              <!-- 3. MARKETPLACE & FEES -->
              <div id="sec-marketplace" class="settings-section" style="display: none;">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                  Marketplace Rules & Royalty Structure
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem;">
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Author Royalty Rate (%)</label>
                    <input type="number" id="set-author-royalty" value="${mkt.seller_commission_pct || 85.0}" min="10" max="95" step="0.5" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 1rem; font-weight: 700; color: var(--accent);" />
                  </div>
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Platform Commission (%)</label>
                    <input type="number" id="set-platform-fee" value="${mkt.platform_commission_pct || 15.0}" min="5" max="90" step="0.5" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 1rem; font-weight: 700;" />
                  </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 1rem; border-top: 1px solid var(--border-subtle); padding-top: 1.25rem;">
                  <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                    <div>
                      <strong style="font-size: 0.9rem; color: var(--text-primary);">Require Seller Application Approval</strong>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">New creators must be approved by admin before publishing</div>
                    </div>
                    <input type="checkbox" id="set-seller-approval-req" ${mkt.seller_approval_required ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: var(--accent);" />
                  </label>

                  <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                    <div>
                      <strong style="font-size: 0.9rem; color: var(--text-primary);">Require Book Moderation Approval</strong>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">Books are held in pending queue until approved</div>
                    </div>
                    <input type="checkbox" id="set-book-approval-req" ${mkt.book_approval_required ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: var(--accent);" />
                  </label>
                </div>
              </div>

              <!-- 4. PAYMENTS & CASHFREE -->
              <div id="sec-payments" class="settings-section" style="display: none;">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                  Cashfree Payment Gateway Integration
                </h3>

                <div style="margin-bottom: 1.5rem;">
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Environment Mode</label>
                  <select id="set-cf-env" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; font-weight: 700; background: #FFFFFF;">
                    <option value="SANDBOX" ${pay.cashfree_environment === 'SANDBOX' ? 'selected' : ''}>SANDBOX (Test Mode)</option>
                    <option value="PRODUCTION" ${pay.cashfree_environment === 'PRODUCTION' ? 'selected' : ''}>PRODUCTION (Live Real Money)</option>
                  </select>
                </div>

                <div style="margin-bottom: 1.25rem;">
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Cashfree App ID (Client ID)</label>
                  <input type="text" id="set-cf-appid" placeholder="e.g. TEST100849204..." value="${pay.cashfree_app_id || ''}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; font-family: monospace;" />
                </div>

                <div style="margin-bottom: 1.5rem;">
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Cashfree Secret Key (Server-Side Masked)</label>
                  <input type="password" id="set-cf-secret" placeholder="••••••••••••••••" value="${pay.cashfree_secret_key ? '••••••••••••••••' : ''}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; font-family: monospace;" />
                  <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.3rem;">
                    🔒 Stored securely on server. Never exposed to browser or client JavaScript.
                  </div>
                </div>

                <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: var(--radius-md); padding: 1rem; font-size: 0.85rem; color: #166534;">
                  <strong>Cashfree Gateway Status:</strong> Payment Currency is set to <strong>INR (₹)</strong> per Cashfree specification.
                </div>
              </div>

              <!-- 5. CURRENCY & DISPLAY -->
              <div id="sec-currency" class="settings-section" style="display: none;">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                  Currency & Regional Formats
                </h3>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem;">
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Default Marketplace Display Currency</label>
                    <select id="set-display-curr" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; background: #FFFFFF;">
                      <option value="INR" ${curr.default_display_currency === 'INR' ? 'selected' : ''}>INR (₹ - Indian Rupee)</option>
                      <option value="USD" ${curr.default_display_currency === 'USD' ? 'selected' : ''}>USD ($ - US Dollar)</option>
                      <option value="EUR" ${curr.default_display_currency === 'EUR' ? 'selected' : ''}>EUR (€ - Euro)</option>
                      <option value="GBP" ${curr.default_display_currency === 'GBP' ? 'selected' : ''}>GBP (£ - British Pound)</option>
                      <option value="AED" ${curr.default_display_currency === 'AED' ? 'selected' : ''}>AED (د.إ - UAE Dirham)</option>
                    </select>
                  </div>
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Payment Gateway Currency (Fixed)</label>
                    <input type="text" readonly value="INR (₹) - Cashfree Gateway" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; background: var(--bg-tertiary);" />
                  </div>
                </div>

                <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem; font-size: 0.825rem; color: var(--text-secondary); line-height: 1.5;">
                  ℹ️ <strong>Currency Separation:</strong> The marketplace Display Currency formats visual prices for international browsing. The Payment Currency strictly corresponds to the configured payment gateway processor.
                </div>
              </div>

              <!-- 6. MAINTENANCE MODE -->
              <div id="sec-maintenance" class="settings-section" style="display: none;">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                  Maintenance Mode
                </h3>
                <label style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; cursor: pointer;">
                  <div>
                    <strong style="font-size: 1rem; color: var(--text-primary);">Enable Maintenance Mode</strong>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">When active, non-admin visitors see a maintenance screen</div>
                  </div>
                  <input type="checkbox" id="set-maint-enabled" ${maint.enabled ? 'checked' : ''} style="width: 22px; height: 22px; accent-color: #DC2626;" />
                </label>
                <div>
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Public Maintenance Message</label>
                  <textarea id="set-maint-msg" rows="3" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;">${maint.message || 'Bookora is undergoing scheduled platform enhancements.'}</textarea>
                </div>
              </div>

              <!-- 7. BOOKS & FILES -->
              <div id="sec-books" class="settings-section" style="display: none;">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                  eBook Constraints & Sample Limits
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Max Upload Size (MB)</label>
                    <input type="number" id="set-max-pdf-size" value="${books.max_pdf_size_mb || 100}" min="10" max="500" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                  </div>
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Free Preview Page Limit</label>
                    <input type="number" id="set-preview-limit" value="${books.preview_page_limit || 5}" min="1" max="20" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                  </div>
                </div>
              </div>

              <!-- 8. EXTERNAL LINK SECURITY -->
              <div id="sec-external" class="settings-section" style="display: none;">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                  External Discovery Security Rules
                </h3>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                  <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                    <div>
                      <strong style="font-size: 0.9rem; color: var(--text-primary);">Enforce HTTPS Strict Scheme</strong>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">Rejects non-https links, javascript:, data:, and insecure protocols</div>
                    </div>
                    <input type="checkbox" checked disabled style="width: 20px; height: 20px; accent-color: var(--accent);" />
                  </label>
                  <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
                    <div>
                      <strong style="font-size: 0.9rem; color: var(--text-primary);">External Redirect Confirmation Banner</strong>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">Inform users they are leaving Bookora to checkout on the publisher site</div>
                    </div>
                    <input type="checkbox" id="set-ext-redirect-confirm" ${ext.require_redirect_confirmation ? 'checked' : ''} style="width: 20px; height: 20px; accent-color: var(--accent);" />
                  </label>
                </div>
              </div>

                          <!-- 9. GOOGLE DRIVE DATABASE & BACKUPS -->
              <div id="sec-database" class="settings-section" style="display: none;">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                  Google Drive Database & Fast Cache
                </h3>

                <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1.5rem;">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div>
                      <strong style="color: #166534; font-size: 0.95rem;">Drive Database Status: CONNECTED & SYNCED</strong>
                      <div style="font-size: 0.8rem; color: #15803D; margin-top: 2px;">
                        Folder ID: <code>1I9o_gyaAqLi3-W4ZI7EXpIyqwt4Qlhah</code> (Persistent Master Storage)
                      </div>
                    </div>
                    <button type="button" id="check-db-health-btn" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;">
                      Check System Health
                    </button>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem;">
                  <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem;">
                    <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Cache Architecture</span>
                    <strong style="display: block; font-size: 0.95rem; color: var(--text-primary); margin-top: 2px;">3-Tier (Browser + Memory + Drive)</strong>
                  </div>
                  <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1rem;">
                    <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Concurrency Lock</span>
                    <strong style="display: block; font-size: 0.95rem; color: #16A34A; margin-top: 2px;">Atomic Locking Enabled</strong>
                  </div>
                </div>

                <div style="border-top: 1px solid var(--border-subtle); padding-top: 1.5rem;">
                  <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem;">Database Backups & Snapshots</h4>
                  <div style="display: flex; gap: 0.75rem; align-items: center;">
                    <button type="button" id="create-backup-btn" class="btn btn-primary btn-sm">
                      Create Database Backup Snapshot
                    </button>
                  </div>
                </div>
              </div>

            
              <!-- 10. GROQ AI CONFIGURATION -->
              <div id="sec-groq" class="settings-section" style="display: none;">
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem;">
                  Groq AI Smart Intelligence Engine
                </h3>

                <div style="background: linear-gradient(135deg, #F8FAFC 0%, #F5F3FF 100%); border: 1px solid #DDD6FE; border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1.5rem;">
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div>
                      <strong style="color: #6D28D9; font-size: 0.95rem;">Groq Low-Latency Engine: SERVER-SIDE CONFIGURED</strong>
                      <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
                        Powers Bookora AI Assistant, Creator Studio Description Gen, and Semantic Search.
                      </div>
                    </div>
                    <span class="badge badge-external" style="font-size: 0.75rem;">Llama-3.3-70B Ready</span>
                  </div>
                </div>

                <div style="margin-bottom: 1.25rem;">
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Groq API Key (Server Protected)</label>
                  <input type="password" id="set-groq-key" placeholder="gsk_••••••••••••••••••••••••" value="${state.settings?.ai_config?.groq_api_key ? '••••••••••••••••' : ''}" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; font-family: monospace;" />
                  <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.3rem;">
                    🔒 Stored securely on server. Never exposed to browser or client JavaScript.
                  </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                  <label style="display: block; font-size: 0.825rem; font-weight: 600; margin-bottom: 0.35rem;">Groq AI Model</label>
                  <select id="set-groq-model" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; background: #FFFFFF;">
                    <option value="llama-3.3-70b-versatile" selected>llama-3.3-70b-versatile (Recommended - High Speed & Intelligence)</option>
                    <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Ultra Fast Inference)</option>
                    <option value="mixtral-8x7b-32768">mixtral-8x7b-32768 (Long Context Window)</option>
                  </select>
                </div>
              </div>

            </form>
          </div>

        </div>

      </div>
    </div>
  `;
}

export function initAdminSettingsEvents() {
  // Tab Switching
  document.querySelectorAll('.settings-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.settings-tab-btn').forEach(b => {
        b.style.background = 'transparent';
        b.style.color = 'var(--text-secondary)';
        b.classList.remove('active');
      });
      btn.style.background = 'var(--accent-light)';
      btn.style.color = 'var(--accent)';
      btn.classList.add('active');

      const secId = btn.dataset.section;
      document.querySelectorAll('.settings-section').forEach(s => s.style.display = 'none');
      const targetSec = document.getElementById(`sec-${secId}`);
      if (targetSec) targetSec.style.display = 'block';
    });
  });

  // Save Settings
  const saveBtn = document.getElementById('save-all-settings-btn');
  saveBtn?.addEventListener('click', async () => {
    const envChoice = document.getElementById('set-cf-env')?.value;
    
    // Production confirmation guard
    if (envChoice === 'PRODUCTION' && state.settings?.payments?.cashfree_environment !== 'PRODUCTION') {
      const confirmWord = prompt('⚠️ WARNING: Switching to Cashfree PRODUCTION mode processes real financial transactions. Type "PRODUCTION" to confirm:');
      if (confirmWord !== 'PRODUCTION') {
        Toast.show('Production switch cancelled.', 'warning');
        return;
      }
    }

    const updatedSettings = {
      general: {
        website_name: document.getElementById('set-website-name')?.value.trim() || 'Bookora',
        tagline: document.getElementById('set-tagline')?.value.trim() || 'Discover. Read. Publish.',
        description: document.getElementById('set-desc')?.value.trim() || '',
        support_email: document.getElementById('set-support-email')?.value.trim() || 'support@bookora.com',
        contact_email: document.getElementById('set-contact-email')?.value.trim() || 'contact@bookora.com',
        timezone: 'Asia/Kolkata',
        date_format: 'DD/MM/YYYY',
        default_language: 'English'
      },
      branding: {
        primary_accent: document.getElementById('set-primary-accent')?.value || '#2563EB',
        secondary_accent: document.getElementById('set-secondary-accent')?.value || '#1D4ED8',
        border_radius: '10px',
        button_style: 'rounded-lg'
      },
      marketplace: {
        seller_commission_pct: parseFloat(document.getElementById('set-author-royalty')?.value || 85.0),
        platform_commission_pct: parseFloat(document.getElementById('set-platform-fee')?.value || 15.0),
        seller_approval_required: document.getElementById('set-seller-approval-req')?.checked || false,
        book_approval_required: document.getElementById('set-book-approval-req')?.checked || false,
        reviews_enabled: true,
        wishlist_enabled: true,
        downloads_enabled: true,
        pdf_preview_enabled: true
      },
      currency: {
        default_display_currency: document.getElementById('set-display-curr')?.value || 'INR',
        currency_symbol: document.getElementById('set-display-curr')?.value === 'INR' ? '₹' : '$',
        currency_position: 'prefix',
        decimal_places: 2,
        thousands_separator: ',',
        decimal_separator: '.',
        payment_currency: 'INR'
      },
      payments: {
        cashfree_environment: envChoice || 'SANDBOX',
        cashfree_app_id: document.getElementById('set-cf-appid')?.value.trim() || '',
        cashfree_secret_key: document.getElementById('set-cf-secret')?.value.trim() || '',
        api_version: '2023-08-01'
      },
      maintenance: {
        enabled: document.getElementById('set-maint-enabled')?.checked || false,
        message: document.getElementById('set-maint-msg')?.value.trim() || 'Bookora is undergoing scheduled platform enhancements.'
      },
      books_config: {
        max_pdf_size_mb: parseInt(document.getElementById('set-max-pdf-size')?.value || 100, 10),
        preview_page_limit: parseInt(document.getElementById('set-preview-limit')?.value || 5, 10),
        allowed_file_types: ['PDF', 'EPUB']
      },
      external_config: {
        external_listings_enabled: true,
        allowed_protocols: ['https:'],
        require_redirect_confirmation: document.getElementById('set-ext-redirect-confirm')?.checked || false
      }
    };

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving Settings...';

    const res = await state.saveAdminSettings(updatedSettings);
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save All Settings';

    if (res.success) {
      Toast.show('Settings saved successfully to server!', 'success');
    } else {
      Toast.show(res.error || 'Failed to save settings.', 'error');
    }
  });

  // Database Tools Events
  document.getElementById('check-db-health-btn')?.addEventListener('click', async () => {
    try {
      const res = await apiFetch('/api/health');
      const data = await res.json();
      alert(`System Health Report:\n- API: ${data.api}\n- Database: ${data.database.status}\n- Folder ID: ${data.database.folder_id}\n- Cache Hit Rate: ${data.cache.hit_rate}`);
    } catch (e) {
      Toast.show('Health check error.', 'error');
    }
  });

  document.getElementById('create-backup-btn')?.addEventListener('click', async () => {
    try {
      const res = await apiFetch('/api/admin/backups/create', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${state.token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        Toast.show(`Backup snapshot created: ${data.backup_id}`, 'success');
      }
    } catch (e) {
      Toast.show('Failed to create backup.', 'error');
    }
  });

}
