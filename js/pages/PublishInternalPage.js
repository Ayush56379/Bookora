// PublishInternalPage Component (5-Step Wizard)
import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';
import { formatPrice } from '../utils/formatters.js';
import { Toast } from '../components/Toast.js';

export function renderPublishInternalPage() {
  updateSEO({
    title: 'Publish an eBook on Bookora',
    description: 'Sell your digital publications with instant global delivery, in-browser reader, and 85% author royalties.'
  });

  return `
    <div class="publish-page animate-fade-in" style="background: var(--bg-secondary); min-height: 85vh; padding: 3.5rem 0 5rem 0;">
      <div class="container" style="max-width: 860px;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 2.5rem;">
          <div class="badge badge-bookora" style="margin-bottom: 0.5rem;">Author Studio</div>
          <h1 style="font-family: var(--font-display); font-size: 2.4rem; font-weight: 800; color: var(--text-primary);">
            Publish Your eBook on Bookora
          </h1>
          <p style="font-size: 1rem; color: var(--text-secondary); margin-top: 0.25rem;">
            Earn 85% royalties with instant global Cashfree payouts, in-browser reading, and protected downloads.
          </p>
        </div>

        <!-- Wizard Step Indicators -->
        <div style="display: flex; justify-content: space-between; position: relative; margin-bottom: 3rem;">
          <div style="position: absolute; top: 18px; left: 10%; right: 10%; height: 2px; background: var(--border-medium); z-index: 1;"></div>
          
          ${['1. Info', '2. Cover & Files', '3. Pricing', '4. Preview', '5. Submit'].map((step, idx) => `
            <div class="wizard-step-node ${idx === 0 ? 'active' : ''}" data-step="${idx + 1}" style="position: relative; z-index: 2; text-align: center; cursor: pointer;">
              <div class="step-num" style="width: 36px; height: 36px; border-radius: 99px; background: ${idx === 0 ? 'var(--accent)' : '#FFFFFF'}; color: ${idx === 0 ? '#FFFFFF' : 'var(--text-muted)'}; border: 2px solid ${idx === 0 ? 'var(--accent)' : 'var(--border-medium)'}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; margin: 0 auto 6px auto; transition: all 0.2s;">
                ${idx + 1}
              </div>
              <span class="step-title" style="font-size: 0.78rem; font-weight: 600; color: ${idx === 0 ? 'var(--accent)' : 'var(--text-muted)'};">${step}</span>
            </div>
          `).join('')}
        </div>

        <!-- Wizard Form Container -->
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 2.5rem; box-shadow: var(--shadow-sm);">
          <form id="publish-wizard-form">
            
            <!-- STEP 1: Book Information -->
            <div id="step-1" class="wizard-section">
              <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem;">
                Step 1: Book Information
              </h3>

              <div style="margin-bottom: 1.25rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">eBook Title *</label>
                <input type="text" id="pub-title" placeholder="e.g. The Cognitive Architecture of High Performance" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
              </div>

              <div style="margin-bottom: 1.25rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Subtitle</label>
                <input type="text" id="pub-subtitle" placeholder="e.g. A Practical Handbook for Modern Creators" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
                <div>
                  <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Author Name *</label>
                  <input type="text" id="pub-author" value="${state.currentUser?.name || ''}" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                </div>
                <div>
                  <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Primary Category *</label>
                  <select id="pub-category" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem; background: #FFFFFF;">
                    ${state.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div style="margin-bottom: 1.25rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Description & Table of Contents *</label>
                <textarea id="pub-description" rows="4" placeholder="Detail what readers will learn, core frameworks, and chapter summaries..." required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;"></textarea>
              </div>

              <div style="margin-bottom: 1.5rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Tags (comma separated)</label>
                <input type="text" id="pub-tags" placeholder="e.g. Focus, Habits, Mindset, Systems" value="Productivity, Systems, Habits" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
              </div>

              <div style="display: flex; justify-content: flex-end;">
                <button type="button" class="btn btn-primary next-step-btn" data-next="2">Next: Files & Cover →</button>
              </div>
            </div>

            <!-- STEP 2: Cover & Files -->
            <div id="step-2" class="wizard-section" style="display: none;">
              <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem;">
                Step 2: Cover Palette & Content
              </h3>

              <div style="margin-bottom: 1.5rem;">
                <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem;">Select Book Cover Theme</label>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.75rem;" id="cover-palette-selector">
                  ${[
                    { name: 'Electric Blue', grad: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)' },
                    { name: 'Deep Slate', grad: 'linear-gradient(135deg, #0F172A 0%, #334155 100%)' },
                    { name: 'Violet Indigo', grad: 'linear-gradient(135deg, #4338CA 0%, #7C3AED 100%)' },
                    { name: 'Emerald Forest', grad: 'linear-gradient(135deg, #047857 0%, #10B981 100%)' },
                    { name: 'Amber Gold', grad: 'linear-gradient(135deg, #B45309 0%, #F59E0B 100%)' },
                    { name: 'Crimson Rose', grad: 'linear-gradient(135deg, #831843 0%, #DB2777 100%)' }
                  ].map((p, idx) => `
                    <div class="cover-palette-option ${idx === 0 ? 'selected' : ''}" data-gradient="${p.grad}" style="height: 64px; border-radius: var(--radius-md); background: ${p.grad}; cursor: pointer; border: 3px solid ${idx === 0 ? 'var(--accent)' : 'transparent'}; box-shadow: var(--shadow-sm); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.75rem; font-weight: 700;">
                      ${p.name}
                    </div>
                  `).join('')}
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div>
                  <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Total Page Count *</label>
                  <input type="number" id="pub-pages" value="160" min="10" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                </div>
                <div>
                  <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Format</label>
                  <input type="text" id="pub-format" value="PDF + EPUB" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 0.95rem;" />
                </div>
              </div>

              <!-- Upload PDF Simulation -->
              <div style="border: 2px dashed var(--border-medium); border-radius: var(--radius-lg); padding: 2rem; text-align: center; margin-bottom: 1.5rem; background: var(--bg-secondary);">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" style="margin: 0 auto 0.75rem auto;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">eBook Document Loaded</div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">PDF, EPUB supported up to 100MB. DRM watermark applied automatically upon buyer purchase.</div>
              </div>

              <div style="display: flex; justify-content: space-between;">
                <button type="button" class="btn btn-secondary prev-step-btn" data-prev="1">← Back</button>
                <button type="button" class="btn btn-primary next-step-btn" data-next="3">Next: Pricing →</button>
              </div>
            </div>

            <!-- STEP 3: Pricing -->
            <div id="step-3" class="wizard-section" style="display: none;">
              <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem;">
                Step 3: Pricing & Royalties
              </h3>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div>
                  <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">List Price (USD) *</label>
                  <input type="number" id="pub-price" value="29.00" step="0.5" min="1" required style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 1.1rem; font-weight: 700;" />
                </div>
                <div>
                  <label style="display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">Promotional Sale Price (Optional)</label>
                  <input type="number" id="pub-saleprice" value="19.00" step="0.5" min="1" style="width: 100%; padding: 0.65rem 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-medium); font-size: 1.1rem; font-weight: 700; color: var(--accent);" />
                </div>
              </div>

              <!-- Royalty Breakdown -->
              <div style="background: var(--accent-light); border: 1px solid var(--accent-border); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1.75rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <span style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary);">Your Estimated Payout (85% Royalty):</span>
                  <span id="pub-royalty-calc" style="font-size: 1.25rem; font-weight: 800; color: var(--accent);">$16.15 per sale</span>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">
                  Deposited directly to your linked Cashfree Payout account with zero hidden processing surcharges.
                </div>
              </div>

              <div style="display: flex; justify-content: space-between;">
                <button type="button" class="btn btn-secondary prev-step-btn" data-prev="2">← Back</button>
                <button type="button" class="btn btn-primary next-step-btn" data-next="4">Next: Review Preview →</button>
              </div>
            </div>

            <!-- STEP 4: Live Preview -->
            <div id="step-4" class="wizard-section" style="display: none;">
              <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin-bottom: 1.5rem;">
                Step 4: Listing Preview
              </h3>

              <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1.5rem; margin-bottom: 2rem;">
                <div style="display: flex; gap: 1.5rem; align-items: center;">
                  <div id="preview-cover-box" style="width: 100px; height: 135px; border-radius: 8px; background: linear-gradient(135deg, #1E3A8A, #3B82F6); box-shadow: var(--shadow-md); flex-shrink: 0; position: relative;">
                    <div class="book-cover-spine"></div>
                  </div>
                  <div>
                    <span class="badge badge-bookora" style="font-size: 0.65rem; margin-bottom: 4px;">BOOKORA EXCLUSIVE</span>
                    <h4 id="preview-title" style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 2px;">Title Preview</h4>
                    <div id="preview-author" style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">by Author</div>
                    <div id="preview-price" style="font-size: 1.25rem; font-weight: 800; color: var(--accent);">$19.00</div>
                  </div>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between;">
                <button type="button" class="btn btn-secondary prev-step-btn" data-prev="3">← Back</button>
                <button type="submit" id="submit-pub-btn" class="btn btn-primary btn-lg">Submit for Moderation 🚀</button>
              </div>
            </div>

          </form>
        </div>

      </div>
    </div>
  `;
}

export function initPublishInternalEvents() {
  let activeGradient = 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)';

  // Palette selector
  document.querySelectorAll('.cover-palette-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.cover-palette-option').forEach(o => {
        o.style.borderColor = 'transparent';
        o.classList.remove('selected');
      });
      opt.style.borderColor = 'var(--accent)';
      opt.classList.add('selected');
      activeGradient = opt.dataset.gradient;
      const previewBox = document.getElementById('preview-cover-box');
      if (previewBox) previewBox.style.background = activeGradient;
    });
  });

  // Wizard navigation
  const showStep = (stepNum) => {
    document.querySelectorAll('.wizard-section').forEach(sec => sec.style.display = 'none');
    document.getElementById(`step-${stepNum}`).style.display = 'block';

    document.querySelectorAll('.wizard-step-node').forEach(node => {
      const n = parseInt(node.dataset.step, 10);
      const circle = node.querySelector('.step-num');
      const title = node.querySelector('.step-title');
      if (n === stepNum) {
        circle.style.background = 'var(--accent)';
        circle.style.color = '#FFFFFF';
        circle.style.borderColor = 'var(--accent)';
        title.style.color = 'var(--accent)';
      } else if (n < stepNum) {
        circle.style.background = '#ECFDF5';
        circle.style.color = '#059669';
        circle.style.borderColor = '#059669';
        title.style.color = '#059669';
      } else {
        circle.style.background = '#FFFFFF';
        circle.style.color = 'var(--text-muted)';
        circle.style.borderColor = 'var(--border-medium)';
        title.style.color = 'var(--text-muted)';
      }
    });

    // Update preview if entering step 4
    if (stepNum === 4) {
      const title = document.getElementById('pub-title').value || 'Untitled eBook';
      const author = document.getElementById('pub-author').value || (state.currentUser?.name || 'Author');
      const price = parseFloat(document.getElementById('pub-saleprice').value || document.getElementById('pub-price').value || 19);

      document.getElementById('preview-title').textContent = title;
      document.getElementById('preview-author').textContent = `by ${author}`;
      document.getElementById('preview-price').textContent = formatPrice(price);
    }
  };

  document.querySelectorAll('.next-step-btn').forEach(btn => {
    btn.addEventListener('click', () => showStep(parseInt(btn.dataset.next, 10)));
  });

  document.querySelectorAll('.prev-step-btn').forEach(btn => {
    btn.addEventListener('click', () => showStep(parseInt(btn.dataset.prev, 10)));
  });

  // Price calculations
  const priceInput = document.getElementById('pub-price');
  const saleInput = document.getElementById('pub-saleprice');
  const royaltyLabel = document.getElementById('pub-royalty-calc');

  const updateRoyalty = () => {
    const finalPrice = parseFloat(saleInput?.value || priceInput?.value || 0);
    const royalty = finalPrice * 0.85;
    if (royaltyLabel) royaltyLabel.textContent = `${formatPrice(royalty)} per sale`;
  };

  priceInput?.addEventListener('input', updateRoyalty);
  saleInput?.addEventListener('input', updateRoyalty);

  // Form submit
  document.getElementById('publish-wizard-form')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('pub-title').value.trim();
    const subtitle = document.getElementById('pub-subtitle').value.trim();
    const author = document.getElementById('pub-author').value.trim();
    const category = document.getElementById('pub-category').value;
    const description = document.getElementById('pub-description').value.trim();
    const tags = document.getElementById('pub-tags').value;
    const pages = document.getElementById('pub-pages').value;
    const format = document.getElementById('pub-format').value;
    const price = document.getElementById('pub-price').value;
    const sale_price = document.getElementById('pub-saleprice').value;

    const book = state.publishBook({
      title,
      subtitle,
      author,
      category,
      description,
      tags,
      pages,
      format,
      price,
      sale_price,
      cover_gradient: activeGradient
    });

    Toast.show(`eBook "${book.title}" submitted to Admin moderation!`, 'success');
    window.location.hash = '#/creator/dashboard';
  });
}
