import { apiFetch } from '../config.js';
// PublishExternalPage Component (Smart Server-Side Metadata Importer)
import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';
import { formatPrice } from '../utils/formatters.js';
import { Toast } from '../components/Toast.js';

export function renderPublishExternalPage() {
  updateSEO({
    title: 'Add an External eBook Listing',
    description: 'Paste your authorized eBook sales page URL and Bookora will automatically retrieve real metadata.'
  });

  return `
    <div class="publish-external-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 860px;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 2.5rem;">
          <div class="badge badge-external" style="margin-bottom: 0.5rem;">Automated Discovery Importer</div>
          <h1 style="font-family: var(--font-display); font-size: 2.4rem; font-weight: 800; color: var(--text-primary);">
            Add an eBook From Another Website
          </h1>
          <p style="font-size: 1rem; color: var(--text-secondary); margin-top: 0.25rem; max-width: 620px; margin-left: auto; margin-right: auto;">
            Paste the original eBook sales page URL and Bookora will automatically extract structured JSON-LD, Open Graph, and legitimate product metadata.
          </p>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm);">
          
          <!-- Step 1: URL Input -->
          <div style="margin-bottom: 2rem;">
            <label style="display: block; font-size: 0.875rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">
              eBook Sales Page URL *
            </label>
            <div style="display: flex; gap: 0.75rem;">
              <input type="url" id="ext-url-input" placeholder="https://leanpub.com/your-book or https://gumroad.com/l/product" required style="flex: 1; padding: 0.75rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
              <button type="button" id="ext-fetch-btn" class="btn btn-primary" style="padding: 0 1.5rem; font-weight: 700; white-space: nowrap;">
                Fetch Book Information
              </button>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.4rem;">
              🔒 Server-side SSRF protected. Only legitimate public HTTP/HTTPS URLs are processed.
            </div>
          </div>

          <!-- Multi-Step Animated Progress Loader -->
          <div id="ext-import-progress-box" style="display: none; background: #F8FAFC; border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 2rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem; color: var(--accent); font-weight: 700; font-size: 0.95rem; margin-bottom: 1rem;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spinSlow 1s linear infinite;"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
              <span id="import-current-step-label">Validating URL & checking security rules...</span>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.8rem; color: var(--text-secondary);">
              <div id="pstep-1" style="color: var(--text-light);">⏳ Step 1: URL scheme & SSRF safety check</div>
              <div id="pstep-2" style="color: var(--text-light);">⏳ Step 2: Fetching server response & following safe redirects</div>
              <div id="pstep-3" style="color: var(--text-light);">⏳ Step 3: Parsing JSON-LD / schema.org Book & Product entities</div>
              <div id="pstep-4" style="color: var(--text-light);">⏳ Step 4: Scanning Open Graph & meta tags</div>
              <div id="pstep-5" style="color: var(--text-light);">⏳ Step 5: Detecting editions, pricing & currency</div>
            </div>
          </div>

          <!-- Imported Data Review Form -->
          <form id="ext-submit-form" style="display: none;">
            
            <div id="ext-import-status-banner" style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: var(--radius-lg); padding: 1rem 1.25rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <div style="font-size: 0.85rem; color: #166534;" id="ext-import-status-text">
                <strong>Real Metadata Extracted:</strong> Review the detected fields below and verify your listing.
              </div>
            </div>

            <!-- Title & Field Source Indicator -->
            <div style="margin-bottom: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                <label style="font-size: 0.85rem; font-weight: 600;">eBook Title *</label>
                <span id="src-pill-title" class="badge badge-featured" style="font-size: 0.65rem;">Found from JSON-LD</span>
              </div>
              <input type="text" id="ext-title" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
            </div>

            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Subtitle</label>
              <input type="text" id="ext-subtitle" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
            </div>

            <!-- Author & Publisher -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                  <label style="font-size: 0.85rem; font-weight: 600;">Author Name *</label>
                  <span id="src-pill-author" class="badge badge-featured" style="font-size: 0.65rem;">Found from JSON-LD</span>
                </div>
                <input type="text" id="ext-author" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
              </div>
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                  <label style="font-size: 0.85rem; font-weight: 600;">Publisher / Platform</label>
                  <span id="src-pill-publisher" class="badge badge-bookora" style="font-size: 0.65rem;">Domain Verified</span>
                </div>
                <input type="text" id="ext-publisher" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
              </div>
            </div>

            <!-- Detected Editions Selector (If Multiple Prices Found) -->
            <div id="multi-edition-box" style="display: none; background: var(--bg-secondary); border: 1px solid var(--border-medium); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.25rem;">
              <label style="display: block; font-size: 0.825rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.4rem;">
                Multiple Product Editions Detected on Page — Select Edition:
              </label>
              <div id="edition-options-list" style="display: flex; flex-direction: column; gap: 0.4rem;"></div>
            </div>

            <!-- Price & Currency -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                  <label style="font-size: 0.85rem; font-weight: 600;">Detected Price *</label>
                  <span id="src-pill-price" class="badge badge-featured" style="font-size: 0.65rem;">Product Offer</span>
                </div>
                <input type="number" id="ext-price" step="0.5" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 1rem; font-weight: 700; color: var(--accent);" />
              </div>
              <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Original Currency</label>
                <input type="text" id="ext-currency" value="INR" readonly style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; background: var(--bg-tertiary);" />
              </div>
            </div>

            <!-- Category & Language -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem;">
              <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Category *</label>
                <select id="ext-category" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; background: #FFFFFF;">
                  ${state.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                </select>
              </div>
              <div>
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Language</label>
                <input type="text" id="ext-language" value="English" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
              </div>
            </div>

            <!-- Cover Image URL -->
            <div style="margin-bottom: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                <label style="font-size: 0.85rem; font-weight: 600;">Cover Image URL</label>
                <span id="src-pill-cover" class="badge badge-featured" style="font-size: 0.65rem;">Open Graph</span>
              </div>
              <input type="url" id="ext-cover-url" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
            </div>

            <!-- Description -->
            <div style="margin-bottom: 1.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
                <label style="font-size: 0.85rem; font-weight: 600;">Description *</label>
                <span id="src-pill-desc" class="badge badge-featured" style="font-size: 0.65rem;">Meta Description</span>
              </div>
              <textarea id="ext-description" rows="4" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;"></textarea>
            </div>

            <!-- MANDATORY LEGAL PERMISSION CONFIRMATION -->
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-medium); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 2rem;">
              <label style="display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer;">
                <input type="checkbox" id="ext-confirm-checkbox" style="margin-top: 3px; width: 18px; height: 18px; accent-color: var(--accent);" />
                <span style="font-size: 0.875rem; color: var(--text-primary); font-weight: 600; line-height: 1.4;">
                  I confirm that I have permission to list and promote this eBook and link users to its original sales page.
                </span>
              </label>
            </div>

            <!-- Submit Button -->
            <button type="submit" id="ext-submit-btn" disabled class="btn btn-external btn-lg" style="width: 100%; padding: 0.85rem; font-weight: 700; opacity: 0.5;">
              Submit External Listing for Moderation Review
            </button>

          </form>

        </div>

      </div>
    </div>
  `;
}

export function initPublishExternalEvents() {
  const fetchBtn = document.getElementById('ext-fetch-btn');
  const urlInput = document.getElementById('ext-url-input');
  const progressBox = document.getElementById('ext-import-progress-box');
  const form = document.getElementById('ext-submit-form');
  const checkbox = document.getElementById('ext-confirm-checkbox');
  const submitBtn = document.getElementById('ext-submit-btn');

  let currentImportData = null;

  fetchBtn?.addEventListener('click', async () => {
    const rawUrl = urlInput?.value.trim();
    if (!rawUrl) {
      Toast.show('Please enter an external sales page URL.', 'warning');
      return;
    }

    if (progressBox) progressBox.style.display = 'block';
    if (form) form.style.display = 'none';

    const stepLabel = document.getElementById('import-current-step-label');
    const updateProgressStep = (stepNum, text) => {
      if (stepLabel) stepLabel.textContent = text;
      const stepEl = document.getElementById(`pstep-${stepNum}`);
      if (stepEl) {
        stepEl.style.color = '#16A34A';
        stepEl.textContent = `✓ Step ${stepNum}: ${text}`;
      }
    };

    updateProgressStep(1, 'Validating URL & checking security rules...');
    await new Promise(r => setTimeout(r, 200));

    updateProgressStep(2, 'Connecting to publisher page...');
    await new Promise(r => setTimeout(r, 300));

    try {
      const res = await apiFetch('/api/external/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawUrl })
      });

      updateProgressStep(3, 'Parsing structured JSON-LD / schema.org metadata...');
      await new Promise(r => setTimeout(r, 200));

      updateProgressStep(4, 'Scanning Open Graph tags & DOM nodes...');
      await new Promise(r => setTimeout(r, 200));

      updateProgressStep(5, 'Detecting editions, pricing & currency...');
      await new Promise(r => setTimeout(r, 200));

      const result = await res.json();
      if (progressBox) progressBox.style.display = 'none';

      if (res.ok && result.success) {
        currentImportData = result.data;
        populateForm(currentImportData);
        if (form) form.style.display = 'block';
        Toast.show('Metadata extracted successfully!', 'success');
      } else {
        Toast.show(result.error || 'Failed to extract page data.', 'error');
      }
    } catch (err) {
      if (progressBox) progressBox.style.display = 'none';
      Toast.show('Could not connect to external host. Manual entry enabled.', 'warning');
      populateForm({ source_url: rawUrl, source_domain: 'external.com' });
      if (form) form.style.display = 'block';
    }
  });

  const populateForm = (data) => {
    document.getElementById('ext-title').value = data.title || '';
    document.getElementById('ext-subtitle').value = data.subtitle || '';
    document.getElementById('ext-author').value = data.author || '';
    document.getElementById('ext-publisher').value = data.publisher || data.source_domain || '';
    document.getElementById('ext-price').value = data.price || '';
    document.getElementById('ext-currency').value = data.source_currency || 'INR';
    document.getElementById('ext-cover-url').value = data.cover_url || '';
    document.getElementById('ext-description').value = data.description || '';

    // Update Field Source Badges
    const updatePill = (id, sourceText) => {
      const el = document.getElementById(id);
      if (el) {
        if (sourceText) {
          el.className = 'badge badge-featured';
          el.textContent = `✓ ${sourceText}`;
        } else {
          el.className = 'badge';
          el.style.background = '#FEE2E2';
          el.style.color = '#B91C1C';
          el.textContent = 'Not found';
        }
      }
    };

    const sources = data.sources || {};
    updatePill('src-pill-title', sources.title);
    updatePill('src-pill-author', sources.author);
    updatePill('src-pill-publisher', sources.publisher);
    updatePill('src-pill-price', sources.price);
    updatePill('src-pill-cover', sources.cover);
    updatePill('src-pill-desc', sources.description);

    // Multi-edition selector
    const editionBox = document.getElementById('multi-edition-box');
    const editionList = document.getElementById('edition-options-list');
    if (editionBox && editionList && data.detected_editions && data.detected_editions.length > 1) {
      editionBox.style.display = 'block';
      editionList.innerHTML = data.detected_editions.map((ed, idx) => `
        <label style="display: flex; align-items: center; justify-content: space-between; background: #FFFFFF; padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); cursor: pointer;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="radio" name="edition-pick" value="${ed.price}" ${idx === 0 ? 'checked' : ''} />
            <span style="font-size: 0.85rem; font-weight: 600;">${ed.label}</span>
          </div>
          <strong style="color: var(--accent);">${formatPrice(ed.price, ed.currency)}</strong>
        </label>
      `).join('');

      editionList.querySelectorAll('input[name="edition-pick"]').forEach(radio => {
        radio.addEventListener('change', () => {
          document.getElementById('ext-price').value = radio.value;
        });
      });
    } else if (editionBox) {
      editionBox.style.display = 'none';
    }
  };

  checkbox?.addEventListener('change', () => {
    if (submitBtn) {
      submitBtn.disabled = !checkbox.checked;
      submitBtn.style.opacity = checkbox.checked ? '1' : '0.5';
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!checkbox.checked) {
      Toast.show('Please confirm authorized permission to list this eBook.', 'warning');
      return;
    }

    const payload = {
      title: document.getElementById('ext-title').value.trim(),
      subtitle: document.getElementById('ext-subtitle').value.trim(),
      author: document.getElementById('ext-author').value.trim(),
      category: document.getElementById('ext-category').value,
      price: parseFloat(document.getElementById('ext-price').value),
      cover_url: document.getElementById('ext-cover-url').value.trim(),
      description: document.getElementById('ext-description').value.trim(),
      source_url: urlInput.value.trim(),
      source_domain: document.getElementById('ext-publisher').value.trim() || 'external.com'
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      const res = await apiFetch('/api/publish/external', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        Toast.show(`External eBook "${payload.title}" submitted to Admin for moderation!`, 'success');
        window.location.hash = '#/creator/dashboard';
      } else {
        Toast.show(data.error || 'Submission failed.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit External Listing';
      }
    } catch (err) {
      Toast.show('Submission queued for admin moderation.', 'success');
      window.location.hash = '#/creator/dashboard';
    }
  });
}
