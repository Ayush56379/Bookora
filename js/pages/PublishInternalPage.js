import { state } from '../state.js';
import { apiFetch } from '../config.js';
import { updateSEO } from '../utils/seo.js';
import { formatPrice } from '../utils/formatters.js';
import { Toast } from '../components/Toast.js';

const MAX_PDF_SIZE = 100 * 1024 * 1024;
const MAX_COVER_SIZE = 5 * 1024 * 1024;
const PDFJS_VERSION = '3.11.174';

let selectedPDF = null;
let selectedCover = null;
let pdfPageDetectionPromise = null;

const esc = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/\"/g, '&quot;')
  .replace(/'/g, '&#039;');

function getValue(id, fallback = '') {
  return document.getElementById(id)?.value?.trim() || fallback;
}

function getNumber(id, fallback = 0) {
  const value = Number(document.getElementById(id)?.value);
  return Number.isFinite(value) ? value : fallback;
}

function fileToBase64(file) {
  if (!file) return Promise.resolve('');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = () => reject(new Error('Unable to read the selected file.'));
    reader.readAsDataURL(file);
  });
}

function validateStep1() {
  const title = getValue('pub-title');
  const author = getValue('pub-author');
  const category = getValue('pub-category');
  const description = getValue('pub-description');

  if (title.length < 3) {
    Toast.show('Please enter a valid eBook title.', 'warning');
    document.getElementById('pub-title')?.focus();
    return false;
  }
  if (!author) {
    Toast.show('Please enter the author name.', 'warning');
    document.getElementById('pub-author')?.focus();
    return false;
  }
  if (!category) {
    Toast.show('Please select a category.', 'warning');
    document.getElementById('pub-category')?.focus();
    return false;
  }
  if (description.length < 20) {
    Toast.show('Description must contain at least 20 characters.', 'warning');
    document.getElementById('pub-description')?.focus();
    return false;
  }
  return true;
}

function validateStep2() {
  if (!selectedPDF) {
    Toast.show('Please select your PDF eBook.', 'warning');
    return false;
  }
  if (selectedPDF.size > MAX_PDF_SIZE) {
    Toast.show('PDF must be 100 MB or smaller.', 'warning');
    return false;
  }
  if (!selectedPDF.name.toLowerCase().endsWith('.pdf') && selectedPDF.type !== 'application/pdf') {
    Toast.show('Only PDF files are supported.', 'warning');
    return false;
  }
  if (!selectedCover) {
    Toast.show('Please select the eBook cover image.', 'warning');
    return false;
  }
  if (selectedCover.size > MAX_COVER_SIZE) {
    Toast.show('Cover must be 5 MB or smaller.', 'warning');
    return false;
  }
  const pages = getNumber('pub-pages');
  if (!pages || pages < 1) {
    Toast.show('PDF page count is required. Click Detect Pages or enter it manually.', 'warning');
    return false;
  }
  return true;
}

function validateStep3() {
  const price = getNumber('pub-price');
  const saleRaw = document.getElementById('pub-saleprice')?.value?.trim() || '';
  const sale = saleRaw === '' ? 0 : Number(saleRaw);

  if (!price || price <= 0) {
    Toast.show('Please enter a valid list price.', 'warning');
    document.getElementById('pub-price')?.focus();
    return false;
  }
  if (!Number.isFinite(sale) || sale < 0) {
    Toast.show('Please enter a valid sale price or leave it blank.', 'warning');
    document.getElementById('pub-saleprice')?.focus();
    return false;
  }
  // Equal sale/list price is allowed. It simply means there is no discount.
  if (sale > price) {
    Toast.show('Sale price cannot be higher than the list price.', 'warning');
    document.getElementById('pub-saleprice')?.focus();
    return false;
  }
  return true;
}

async function loadPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib;
  if (pdfPageDetectionPromise) return pdfPageDetectionPromise;

  pdfPageDetectionPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-bookora-pdfjs]');
    if (existing) {
      const wait = () => {
        if (window.pdfjsLib) resolve(window.pdfjsLib);
        else if (existing.dataset.failed === '1') reject(new Error('PDF.js failed to load.'));
        else setTimeout(wait, 50);
      };
      wait();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
    script.async = true;
    script.dataset.bookoraPdfjs = '1';
    script.onload = () => {
      if (!window.pdfjsLib) {
        script.dataset.failed = '1';
        reject(new Error('PDF.js loaded without the PDF library.'));
        return;
      }
      try {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
      } catch (_) {}
      resolve(window.pdfjsLib);
    };
    script.onerror = () => {
      script.dataset.failed = '1';
      reject(new Error('PDF page detector could not be loaded.'));
    };
    document.head.appendChild(script);
  }).catch(error => {
    pdfPageDetectionPromise = null;
    throw error;
  });

  return pdfPageDetectionPromise;
}

async function detectPages(file) {
  if (!file) return null;
  try {
    const pdfjs = await loadPdfJs();
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    return Number(pdf.numPages) || null;
  } catch (error) {
    console.warn('PDF page detection failed:', error);
    return null;
  }
}

async function detectAndSetPages() {
  if (!selectedPDF) {
    Toast.show('Select the PDF first.', 'warning');
    return false;
  }

  const button = document.getElementById('detect-pages-btn');
  const input = document.getElementById('pub-pages');
  if (button) {
    button.disabled = true;
    button.textContent = 'Detecting...';
  }

  try {
    const pages = await detectPages(selectedPDF);
    if (!pages) {
      Toast.show('Automatic page detection failed. Please enter the PDF page count manually.', 'warning');
      input?.focus();
      return false;
    }
    if (input) input.value = String(pages);
    Toast.show(`${pages} PDF pages detected.`, 'success');
    return true;
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = 'Detect Pages';
    }
  }
}

function updateFilesUI() {
  const pdfName = document.getElementById('pdf-file-name');
  const pdfStatus = document.getElementById('pdf-status');
  const coverName = document.getElementById('cover-file-name');
  const coverStatus = document.getElementById('cover-status');

  if (pdfName) pdfName.textContent = selectedPDF ? selectedPDF.name : 'No PDF selected';
  if (pdfStatus) pdfStatus.textContent = selectedPDF
    ? `${(selectedPDF.size / 1048576).toFixed(2)} MB`
    : 'Required';
  if (coverName) coverName.textContent = selectedCover ? selectedCover.name : 'No cover selected';
  if (coverStatus) coverStatus.textContent = selectedCover
    ? `${(selectedCover.size / 1048576).toFixed(2)} MB`
    : 'Required';

  const preview = document.getElementById('step2-cover-preview');
  if (preview) {
    if (selectedCover) {
      if (preview.dataset.url) URL.revokeObjectURL(preview.dataset.url);
      const url = URL.createObjectURL(selectedCover);
      preview.dataset.url = url;
      preview.style.background = `url("${url}") center/cover no-repeat`;
      preview.style.display = 'block';
    } else {
      preview.style.background = 'linear-gradient(135deg,#1E3A8A,#3B82F6)';
      preview.style.display = 'none';
    }
  }
}

function updateRoyalty() {
  const listPrice = getNumber('pub-price');
  const saleRaw = document.getElementById('pub-saleprice')?.value?.trim() || '';
  const effectivePrice = saleRaw === '' ? listPrice : Number(saleRaw);
  const pct = Number(window.BOOKORA_MARKETPLACE?.sellerCommissionPct ?? 85);
  const royaltyPct = Number.isFinite(pct) ? pct : 85;
  const royalty = effectivePrice * royaltyPct / 100;
  const out = document.getElementById('pub-royalty-calc');
  const label = document.getElementById('pub-royalty-label');

  if (label) label.textContent = `Estimated Author Royalty: ${royaltyPct}%`;
  if (out) out.textContent = `${formatPrice(royalty)} per sale`;
}

function updatePreview() {
  const title = getValue('pub-title', 'Untitled eBook');
  const author = getValue('pub-author', 'Author');
  const pages = getValue('pub-pages', '—');
  const listPrice = getNumber('pub-price');
  const saleRaw = document.getElementById('pub-saleprice')?.value?.trim() || '';
  const price = saleRaw === '' ? listPrice : Number(saleRaw);

  const titleEl = document.getElementById('preview-title');
  const authorEl = document.getElementById('preview-author');
  const pagesEl = document.getElementById('preview-pages');
  const priceEl = document.getElementById('preview-price');

  if (titleEl) titleEl.textContent = title;
  if (authorEl) authorEl.textContent = `by ${author}`;
  if (pagesEl) pagesEl.textContent = `Pages: ${pages}`;
  if (priceEl) priceEl.textContent = formatPrice(price);

  const box = document.getElementById('preview-cover-box');
  if (box && selectedCover) {
    if (box.dataset.url) URL.revokeObjectURL(box.dataset.url);
    const url = URL.createObjectURL(selectedCover);
    box.dataset.url = url;
    box.style.background = `url("${url}") center/cover no-repeat`;
    box.style.backgroundSize = 'cover';
    box.style.backgroundPosition = 'center';
  }
}

function showStep(step) {
  const targetStep = Math.max(1, Math.min(5, Number(step) || 1));

  document.querySelectorAll('.wizard-section').forEach(section => {
    section.style.display = section.id === `step-${targetStep}` ? 'block' : 'none';
  });

  document.querySelectorAll('.wizard-step-node').forEach(node => {
    const number = Number(node.dataset.step);
    const circle = node.querySelector('.step-num');
    const title = node.querySelector('.step-title');
    if (!circle || !title) return;

    if (number === targetStep) {
      circle.style.background = 'var(--accent)';
      circle.style.color = '#fff';
      circle.style.borderColor = 'var(--accent)';
      title.style.color = 'var(--accent)';
    } else if (number < targetStep) {
      circle.style.background = '#ECFDF5';
      circle.style.color = '#059669';
      circle.style.borderColor = '#059669';
      title.style.color = '#059669';
    } else {
      circle.style.background = '#fff';
      circle.style.color = 'var(--text-muted)';
      circle.style.borderColor = 'var(--border-medium)';
      title.style.color = 'var(--text-muted)';
    }
  });

  if (targetStep === 3) updateRoyalty();
  if (targetStep === 4) {
    // Run after the section becomes visible so the preview always reads the latest values.
    requestAnimationFrame(() => updatePreview());
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function renderPublishInternalPage() {
  updateSEO({
    title: 'Publish an eBook on Bookora',
    description: 'Publish your digital eBook on Bookora.'
  });

  const categories = Array.isArray(state.categories) ? state.categories : [];

  return `
    <div class="publish-page" style="background:var(--bg-secondary);min-height:85vh;padding:2rem 0 5rem;">
      <div class="container" style="max-width:860px;">
        <div style="text-align:center;margin-bottom:2rem;">
          <div class="badge badge-bookora" style="margin-bottom:.5rem;">Author Studio</div>
          <h1>Publish Your eBook</h1>
          <p style="color:var(--text-secondary);">Complete the steps below. Your book will be reviewed before publishing.</p>
        </div>

        <div style="display:flex;gap:.35rem;justify-content:space-between;margin-bottom:2rem;">
          ${['Info','Files','Pricing','Preview','Submit'].map((step, index) => `
            <div class="wizard-step-node" data-step="${index + 1}" style="text-align:center;flex:1;">
              <div class="step-num" style="width:36px;height:36px;border-radius:50%;background:${index === 0 ? 'var(--accent)' : '#fff'};color:${index === 0 ? '#fff' : 'var(--text-muted)'};border:2px solid ${index === 0 ? 'var(--accent)' : 'var(--border-medium)'};display:flex;align-items:center;justify-content:center;font-weight:700;margin:auto;">${index + 1}</div>
              <span class="step-title" style="font-size:.72rem;font-weight:600;">${index + 1}. ${step}</span>
            </div>
          `).join('')}
        </div>

        <div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:clamp(1rem,4vw,2.5rem);box-shadow:var(--shadow-sm);">
          <form id="publish-wizard-form">
            <section id="step-1" class="wizard-section">
              <h3>Step 1: Book Information</h3>
              <label>eBook Title *</label>
              <input id="pub-title" required placeholder="Enter your book title" style="width:100%;padding:.75rem;margin:.4rem 0 1rem;">

              <label>Subtitle</label>
              <input id="pub-subtitle" placeholder="Optional subtitle" style="width:100%;padding:.75rem;margin:.4rem 0 1rem;">

              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;">
                <div>
                  <label>Author Name *</label>
                  <input id="pub-author" value="${esc(state.currentUser?.name || '')}" required style="width:100%;padding:.75rem;margin:.4rem 0 1rem;">
                </div>
                <div>
                  <label>Category *</label>
                  <select id="pub-category" required style="width:100%;padding:.75rem;margin:.4rem 0 1rem;">
                    <option value="">Select category</option>
                    ${categories.map(category => `<option value="${esc(category.name)}">${esc(category.name)}</option>`).join('')}
                  </select>
                </div>
              </div>

              <label>Description *</label>
              <textarea id="pub-description" rows="5" minlength="20" required placeholder="Describe your eBook..." style="width:100%;padding:.75rem;margin:.4rem 0 1rem;"></textarea>

              <label>Tags</label>
              <input id="pub-tags" placeholder="Productivity, Business, Finance" style="width:100%;padding:.75rem;margin:.4rem 0 1.5rem;">

              <div style="text-align:right;">
                <button type="button" class="btn btn-primary next-step-btn" data-next="2">Next: Files →</button>
              </div>
            </section>

            <section id="step-2" class="wizard-section" style="display:none;">
              <h3>Step 2: Cover & Files</h3>

              <div style="border:2px dashed var(--border-medium);border-radius:16px;padding:2rem;text-align:center;margin:1.5rem 0;">
                <div style="font-size:38px;">📄</div>
                <h4>Upload eBook PDF</h4>
                <p style="color:var(--text-secondary);font-size:.85rem;">PDF only · Maximum 100 MB</p>
                <input id="pub-pdf" type="file" accept="application/pdf,.pdf" style="display:none;">
                <label for="pub-pdf" class="btn btn-primary" style="cursor:pointer;display:inline-block;">Choose PDF</label>
                <div id="pdf-file-name" style="margin-top:12px;font-weight:700;">No PDF selected</div>
                <div id="pdf-status" style="color:var(--text-muted);font-size:.8rem;">Required</div>
              </div>

              <div style="border:2px dashed var(--border-medium);border-radius:16px;padding:2rem;text-align:center;margin-bottom:1.5rem;">
                <div style="font-size:38px;">🖼️</div>
                <h4>Upload Cover</h4>
                <p style="color:var(--text-secondary);font-size:.85rem;">JPG, PNG or WEBP · Maximum 5 MB · Required</p>
                <input id="pub-cover" type="file" accept="image/jpeg,image/png,image/webp" style="display:none;">
                <label for="pub-cover" class="btn btn-primary" style="cursor:pointer;display:inline-block;">Choose Cover</label>
                <div id="cover-file-name" style="margin-top:12px;font-weight:700;">No cover selected</div>
                <div id="cover-status" style="color:var(--text-muted);font-size:.8rem;">Required</div>
                <div id="step2-cover-preview" style="display:none;width:90px;height:120px;border-radius:10px;margin:14px auto 0;background:linear-gradient(135deg,#1E3A8A,#3B82F6);background-size:cover;background-position:center;"></div>
              </div>

              <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:1rem;align-items:end;margin-bottom:1.5rem;">
                <div>
                  <label>Page Count *</label>
                  <input id="pub-pages" type="number" min="1" required placeholder="Automatically detected" style="width:100%;padding:.75rem;">
                </div>
                <button type="button" id="detect-pages-btn" class="btn btn-secondary" style="white-space:nowrap;">Detect Pages</button>
              </div>

              <div style="margin-bottom:1.5rem;">
                <label>Format</label>
                <input id="pub-format" value="PDF" readonly style="width:100%;padding:.75rem;background:#f8fafc;">
              </div>

              <div style="display:flex;justify-content:space-between;gap:1rem;">
                <button type="button" class="btn btn-secondary prev-step-btn" data-prev="1">← Back</button>
                <button type="button" class="btn btn-primary next-step-btn" data-next="3">Next: Pricing →</button>
              </div>
            </section>

            <section id="step-3" class="wizard-section" style="display:none;">
              <h3>Step 3: Pricing</h3>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin:1.5rem 0;">
                <div>
                  <label>List Price *</label>
                  <input id="pub-price" type="number" min="1" step=".01" required placeholder="e.g. 499" style="width:100%;padding:.75rem;">
                </div>
                <div>
                  <label>Sale Price</label>
                  <input id="pub-saleprice" type="number" min="0" step=".01" placeholder="Optional" style="width:100%;padding:.75rem;">
                </div>
              </div>

              <div style="padding:1.25rem;background:var(--accent-light);border-radius:14px;margin-bottom:1.5rem;">
                <strong id="pub-royalty-label">Estimated Author Royalty: 85%</strong>
                <div id="pub-royalty-calc" style="font-size:1.3rem;font-weight:800;margin-top:8px;">₹0.00 per sale</div>
              </div>

              <div style="display:flex;justify-content:space-between;gap:1rem;">
                <button type="button" class="btn btn-secondary prev-step-btn" data-prev="2">← Back</button>
                <button type="button" class="btn btn-primary next-step-btn" data-next="4">Next: Preview →</button>
              </div>
            </section>

            <section id="step-4" class="wizard-section" style="display:none;">
              <h3>Step 4: Preview</h3>
              <div style="background:var(--bg-secondary);border-radius:16px;padding:1.5rem;margin:1.5rem 0;display:flex;gap:1.5rem;align-items:center;">
                <div id="preview-cover-box" style="width:110px;height:150px;border-radius:10px;background:linear-gradient(135deg,#1E3A8A,#3B82F6);background-size:cover;background-position:center;flex-shrink:0;"></div>
                <div style="min-width:0;">
                  <h3 id="preview-title" style="margin:0 0 .35rem;">Your Book</h3>
                  <div id="preview-author" style="color:var(--text-secondary);">Author</div>
                  <div id="preview-pages" style="color:var(--text-secondary);margin-top:5px;">Pages: —</div>
                  <div id="preview-price" style="color:var(--accent);font-size:1.3rem;font-weight:800;margin-top:10px;">₹0.00</div>
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;gap:1rem;">
                <button type="button" class="btn btn-secondary prev-step-btn" data-prev="3">← Back</button>
                <button type="button" class="btn btn-primary next-step-btn" data-next="5">Continue →</button>
              </div>
            </section>

            <section id="step-5" class="wizard-section" style="display:none;">
              <h3>Step 5: Submit for Admin Review</h3>
              <div style="padding:1.5rem;background:#eff6ff;border-radius:14px;margin:1.5rem 0;line-height:1.7;">
                Your PDF and cover will be uploaded to Google Drive. A pending book record will then be created for admin review.
              </div>
              <div style="display:flex;justify-content:space-between;gap:1rem;">
                <button type="button" class="btn btn-secondary prev-step-btn" data-prev="4">← Back</button>
                <button type="submit" id="submit-pub-btn" class="btn btn-primary btn-lg">Upload & Submit 🚀</button>
              </div>
            </section>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function initPublishInternalEvents() {
  const form = document.getElementById('publish-wizard-form');
  if (!form) return;

  selectedPDF = null;
  selectedCover = null;
  pdfPageDetectionPromise = null;

  const pdfInput = document.getElementById('pub-pdf');
  const coverInput = document.getElementById('pub-cover');
  const detectPagesButton = document.getElementById('detect-pages-btn');
  const priceInput = document.getElementById('pub-price');
  const saleInput = document.getElementById('pub-saleprice');

  pdfInput?.addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      Toast.show('Please select a PDF file.', 'warning');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_PDF_SIZE) {
      Toast.show('PDF must be 100 MB or smaller.', 'warning');
      event.target.value = '';
      return;
    }

    selectedPDF = file;
    updateFilesUI();
    await detectAndSetPages();
  });

  coverInput?.addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      Toast.show('Please select a JPG, PNG or WEBP cover.', 'warning');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_COVER_SIZE) {
      Toast.show('Cover must be 5 MB or smaller.', 'warning');
      event.target.value = '';
      return;
    }

    selectedCover = file;
    updateFilesUI();
    updatePreview();
  });

  detectPagesButton?.addEventListener('click', () => {
    detectAndSetPages();
  });

  priceInput?.addEventListener('input', updateRoyalty);
  saleInput?.addEventListener('input', updateRoyalty);

  form.addEventListener('click', event => {
    const nextButton = event.target.closest('.next-step-btn');
    const previousButton = event.target.closest('.prev-step-btn');

    if (nextButton) {
      event.preventDefault();
      const nextStep = Number(nextButton.dataset.next);

      if (nextStep === 2 && !validateStep1()) return;
      if (nextStep === 3 && !validateStep2()) return;
      if (nextStep === 4 && !validateStep3()) return;

      showStep(nextStep);
      return;
    }

    if (previousButton) {
      event.preventDefault();
      showStep(Number(previousButton.dataset.prev));
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();

    if (!validateStep1()) {
      showStep(1);
      return;
    }
    if (!validateStep2()) {
      showStep(2);
      return;
    }
    if (!validateStep3()) {
      showStep(3);
      return;
    }

    if (!state.isAuthenticated) {
      Toast.show('Please sign in before publishing.', 'error');
      return;
    }
    if (!state.isSeller && !state.isAdmin) {
      Toast.show('Seller approval is required before publishing.', 'error');
      return;
    }

    const submitButton = document.getElementById('submit-pub-btn');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Preparing files...';
    }

    try {
      const title = getValue('pub-title');
      const subtitle = getValue('pub-subtitle');
      const author = getValue('pub-author');
      const category = getValue('pub-category');
      const description = getValue('pub-description');
      const tags = getValue('pub-tags').split(',').map(tag => tag.trim()).filter(Boolean);
      const pages = getNumber('pub-pages');
      const price = getNumber('pub-price');
      const saleRaw = document.getElementById('pub-saleprice')?.value?.trim() || '';
      const salePrice = saleRaw === '' ? 0 : Number(saleRaw);

      const pdfBase64 = await fileToBase64(selectedPDF);
      const coverBase64 = await fileToBase64(selectedCover);

      if (submitButton) submitButton.textContent = 'Uploading to Drive...';

      const uploadResponse = await apiFetch('/api/books/upload-files', {
        method: 'POST',
        headers: { Authorization: `Bearer ${state.token}` },
        body: JSON.stringify({
          action: 'uploadBookFiles',
          pdf: {
            name: selectedPDF.name,
            mimeType: 'application/pdf',
            data: pdfBase64
          },
          cover: {
            name: selectedCover.name,
            mimeType: selectedCover.type,
            data: coverBase64
          }
        })
      });

      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok || !uploadData.success) {
        throw new Error(uploadData.error || 'File upload failed.');
      }

      if (submitButton) submitButton.textContent = 'Creating book listing...';

      const bookResponse = await apiFetch('/api/books/create', {
        method: 'POST',
        headers: { Authorization: `Bearer ${state.token}` },
        body: JSON.stringify({
          action: 'createBook',
          title,
          subtitle,
          author,
          category,
          description,
          tags,
          pages,
          format: 'PDF',
          price,
          sale_price: salePrice || null,
          cover_url: uploadData.cover_url || '',
          pdf_url: uploadData.pdf_url || '',
          cover_file_id: uploadData.cover_file_id || '',
          pdf_file_id: uploadData.pdf_file_id || '',
          status: 'pending'
        })
      });

      const bookData = await bookResponse.json();
      if (!bookResponse.ok || !bookData.success) {
        throw new Error(bookData.error || 'Book creation failed.');
      }

      Toast.show('eBook submitted successfully for admin review!', 'success');
      selectedPDF = null;
      selectedCover = null;

      setTimeout(() => {
        window.location.hash = '#/creator/dashboard';
      }, 800);
    } catch (error) {
      console.error('Publish eBook error:', error);
      Toast.show(error?.message || 'Unable to publish eBook.', 'error');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Upload & Submit 🚀';
      }
    }
  });

  updateFilesUI();
  updateRoyalty();
  showStep(1);
}
