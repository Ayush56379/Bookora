// Bookora - Real eBook Publishing Wizard
// PDF + Cover -> Google Drive -> Book record -> Admin moderation

import { state } from '../state.js';
import { apiFetch } from '../config.js';
import { updateSEO } from '../utils/seo.js';
import { formatPrice } from '../utils/formatters.js';
import { Toast } from '../components/Toast.js';

const MAX_PDF_SIZE = 15 * 1024 * 1024; // 15 MB
const MAX_COVER_SIZE = 5 * 1024 * 1024; // 5 MB

let selectedPDF = null;
let selectedCover = null;
let activeGradient =
  'linear-gradient(135deg,#1E3A8A 0%,#3B82F6 100%)';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.split(',')[1] || '');
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function validateStep1() {
  const title =
    document.getElementById('pub-title')?.value.trim();

  const author =
    document.getElementById('pub-author')?.value.trim();

  const category =
    document.getElementById('pub-category')?.value.trim();

  const description =
    document.getElementById('pub-description')?.value.trim();

  if (!title || title.length < 3) {
    Toast.show('Please enter a valid eBook title.', 'warning');
    return false;
  }

  if (!author) {
    Toast.show('Please enter the author name.', 'warning');
    return false;
  }

  if (!category) {
    Toast.show('Please select a category.', 'warning');
    return false;
  }

  if (!description || description.length < 20) {
    Toast.show(
      'Description must contain at least 20 characters.',
      'warning'
    );
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
    Toast.show(
      'PDF is too large. Maximum allowed size is 15 MB.',
      'warning'
    );
    return false;
  }

  if (
    selectedPDF.type !== 'application/pdf' &&
    !selectedPDF.name.toLowerCase().endsWith('.pdf')
  ) {
    Toast.show('Only PDF files are supported.', 'warning');
    return false;
  }

  if (!selectedCover) {
    Toast.show('Please select a cover image.', 'warning');
    return false;
  }

  if (selectedCover.size > MAX_COVER_SIZE) {
    Toast.show(
      'Cover image is too large. Maximum allowed size is 5 MB.',
      'warning'
    );
    return false;
  }

  return true;
}

function validateStep3() {
  const price =
    Number(document.getElementById('pub-price')?.value || 0);

  const sale =
    Number(document.getElementById('pub-saleprice')?.value || 0);

  if (!price || price <= 0) {
    Toast.show('Please enter a valid price.', 'warning');
    return false;
  }

  if (sale && sale <= 0) {
    Toast.show('Sale price must be greater than zero.', 'warning');
    return false;
  }

  if (sale && sale >= price) {
    Toast.show(
      'Sale price must be lower than the list price.',
      'warning'
    );
    return false;
  }

  return true;
}

async function getPDFPageCount(file) {
  // Try PDF.js if available.
  if (!window.pdfjsLib) {
    return null;
  }

  try {
    const buffer = await file.arrayBuffer();

    const pdf =
      await window.pdfjsLib.getDocument({
        data: buffer
      }).promise;

    return pdf.numPages;

  } catch (error) {
    console.warn('PDF page count unavailable:', error);
    return null;
  }
}

function updateFileUI() {
  const pdfName =
    document.getElementById('pdf-file-name');

  const coverName =
    document.getElementById('cover-file-name');

  const pdfStatus =
    document.getElementById('pdf-status');

  const coverStatus =
    document.getElementById('cover-status');

  if (pdfName) {
    pdfName.textContent =
      selectedPDF
        ? selectedPDF.name
        : 'No PDF selected';
  }

  if (coverName) {
    coverName.textContent =
      selectedCover
        ? selectedCover.name
        : 'No cover selected';
  }

  if (pdfStatus) {
    pdfStatus.textContent =
      selectedPDF
        ? `${(selectedPDF.size / 1024 / 1024).toFixed(2)} MB`
        : 'Required';
  }

  if (coverStatus) {
    coverStatus.textContent =
      selectedCover
        ? `${(selectedCover.size / 1024 / 1024).toFixed(2)} MB`
        : 'Required';
  }
}

function updateCoverPreview() {
  const preview =
    document.getElementById('preview-cover-box');

  if (!preview) return;

  if (selectedCover) {
    const url =
      URL.createObjectURL(selectedCover);

    preview.style.backgroundImage =
      `url("${url}")`;

    preview.style.backgroundSize = 'cover';
    preview.style.backgroundPosition = 'center';
  } else {
    preview.style.backgroundImage = 'none';
    preview.style.background = activeGradient;
  }
}

export function renderPublishInternalPage() {

  updateSEO({
    title: 'Publish an eBook on Bookora',
    description:
      'Publish your digital eBook on Bookora.'
  });

  const categories =
    Array.isArray(state.categories)
      ? state.categories
      : [];

  return `
    <div
      class="publish-page"
      style="
        background:var(--bg-secondary);
        min-height:85vh;
        padding:3rem 0 5rem;
      "
    >

      <div
        class="container"
        style="max-width:860px;"
      >

        <div
          style="
            text-align:center;
            margin-bottom:2.5rem;
          "
        >

          <div
            class="badge badge-bookora"
            style="margin-bottom:.5rem;"
          >
            Author Studio
          </div>

          <h1
            style="
              font-family:var(--font-display);
              font-size:2.4rem;
              font-weight:800;
              color:var(--text-primary);
            "
          >
            Publish Your eBook
          </h1>

          <p
            style="
              color:var(--text-secondary);
            "
          >
            Upload your real PDF and cover.
            Your book will be reviewed by an admin before publishing.
          </p>

        </div>


        <!-- STEPS -->

        <div
          style="
            display:flex;
            justify-content:space-between;
            position:relative;
            margin-bottom:3rem;
          "
        >

          ${[
            '1. Info',
            '2. Files',
            '3. Pricing',
            '4. Preview',
            '5. Submit'
          ].map((step, index) => `

            <div
              class="wizard-step-node"
              data-step="${index + 1}"
              style="
                position:relative;
                z-index:2;
                text-align:center;
              "
            >

              <div
                class="step-num"
                style="
                  width:36px;
                  height:36px;
                  border-radius:50%;
                  background:${index === 0 ? 'var(--accent)' : '#fff'};
                  color:${index === 0 ? '#fff' : 'var(--text-muted)'};
                  border:2px solid ${index === 0 ? 'var(--accent)' : 'var(--border-medium)'};
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  font-weight:700;
                  margin:auto;
                "
              >
                ${index + 1}
              </div>

              <span
                class="step-title"
                style="
                  font-size:.75rem;
                  font-weight:600;
                  color:${index === 0 ? 'var(--accent)' : 'var(--text-muted)'};
                "
              >
                ${step}
              </span>

            </div>

          `).join('')}

        </div>


        <div
          style="
            background:#fff;
            border:1px solid var(--border-subtle);
            border-radius:var(--radius-xl);
            padding:2.5rem;
            box-shadow:var(--shadow-sm);
          "
        >

          <form id="publish-wizard-form">


            <!-- STEP 1 -->

            <div
              id="step-1"
              class="wizard-section"
            >

              <h3>Step 1: Book Information</h3>

              <div style="margin:1.25rem 0;">

                <label>eBook Title *</label>

                <input
                  id="pub-title"
                  type="text"
                  placeholder="Enter your book title"
                  required
                  style="width:100%;padding:.75rem;"
                >

              </div>


              <div style="margin-bottom:1.25rem;">

                <label>Subtitle</label>

                <input
                  id="pub-subtitle"
                  type="text"
                  placeholder="Optional subtitle"
                  style="width:100%;padding:.75rem;"
                >

              </div>


              <div
                style="
                  display:grid;
                  grid-template-columns:1fr 1fr;
                  gap:1rem;
                  margin-bottom:1.25rem;
                "
              >

                <div>

                  <label>Author Name *</label>

                  <input
                    id="pub-author"
                    type="text"
                    value="${escapeHtml(state.currentUser?.name || '')}"
                    required
                    style="width:100%;padding:.75rem;"
                  >

                </div>


                <div>

                  <label>Category *</label>

                  <select
                    id="pub-category"
                    required
                    style="width:100%;padding:.75rem;"
                  >

                    <option value="">
                      Select category
                    </option>

                    ${categories.map(c => `
                      <option value="${escapeHtml(c.name)}">
                        ${escapeHtml(c.name)}
                      </option>
                    `).join('')}

                  </select>

                </div>

              </div>


              <div style="margin-bottom:1.25rem;">

                <label>Description *</label>

                <textarea
                  id="pub-description"
                  rows="5"
                  minlength="20"
                  placeholder="Describe your eBook..."
                  required
                  style="width:100%;padding:.75rem;"
                ></textarea>

              </div>


              <div style="margin-bottom:1.5rem;">

                <label>Tags</label>

                <input
                  id="pub-tags"
                  type="text"
                  placeholder="Productivity, Business, Finance"
                  style="width:100%;padding:.75rem;"
                >

              </div>


              <div style="text-align:right;">

                <button
                  type="button"
                  class="btn btn-primary next-step-btn"
                  data-next="2"
                >
                  Next: Files →
                </button>

              </div>

            </div>


            <!-- STEP 2 -->

            <div
              id="step-2"
              class="wizard-section"
              style="display:none;"
            >

              <h3>Step 2: Cover & Files</h3>


              <div
                style="
                  border:2px dashed var(--border-medium);
                  border-radius:16px;
                  padding:2rem;
                  text-align:center;
                  margin:1.5rem 0;
                "
              >

                <div style="font-size:38px;">
                  📄
                </div>

                <h4>
                  Upload eBook PDF
                </h4>

                <p
                  style="
                    color:var(--text-secondary);
                    font-size:.85rem;
                  "
                >
                  PDF only · Maximum 15 MB
                </p>

                <input
                  id="pub-pdf"
                  type="file"
                  accept="application/pdf,.pdf"
                  style="display:none;"
                >

                <label
                  for="pub-pdf"
                  class="btn btn-primary"
                  style="cursor:pointer;display:inline-block;"
                >
                  Choose PDF
                </label>

                <div
                  id="pdf-file-name"
                  style="
                    margin-top:12px;
                    font-weight:700;
                  "
                >
                  No PDF selected
                </div>

                <div
                  id="pdf-status"
                  style="
                    color:var(--text-muted);
                    font-size:.8rem;
                  "
                >
                  Required
                </div>

              </div>


              <div
                style="
                  border:2px dashed var(--border-medium);
                  border-radius:16px;
                  padding:2rem;
                  text-align:center;
                  margin-bottom:1.5rem;
                "
              >

                <div style="font-size:38px;">
                  🖼️
                </div>

                <h4>
                  Upload Cover
                </h4>

                <p
                  style="
                    color:var(--text-secondary);
                    font-size:.85rem;
                  "
                >
                  JPG, PNG or WEBP · Maximum 5 MB
                </p>

                <input
                  id="pub-cover"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style="display:none;"
                >

                <label
                  for="pub-cover"
                  class="btn btn-primary"
                  style="cursor:pointer;display:inline-block;"
                >
                  Choose Cover
                </label>

                <div
                  id="cover-file-name"
                  style="
                    margin-top:12px;
                    font-weight:700;
                  "
                >
                  No cover selected
                </div>

                <div
                  id="cover-status"
                  style="
                    color:var(--text-muted);
                    font-size:.8rem;
                  "
                >
                  Required
                </div>

              </div>


              <div
                style="
                  display:grid;
                  grid-template-columns:1fr 1fr;
                  gap:1rem;
                  margin-bottom:1.5rem;
                "
              >

                <div>

                  <label>Page Count *</label>

                  <input
                    id="pub-pages"
                    type="number"
                    min="1"
                    placeholder="Automatically detected"
                    required
                    style="width:100%;padding:.75rem;"
                  >

                </div>


                <div>

                  <label>Format</label>

                  <input
                    id="pub-format"
                    type="text"
                    value="PDF"
                    readonly
                    style="width:100%;padding:.75rem;background:#f8fafc;"
                  >

                </div>

              </div>


              <div
                style="
                  display:flex;
                  justify-content:space-between;
                "
              >

                <button
                  type="button"
                  class="btn btn-secondary prev-step-btn"
                  data-prev="1"
                >
                  ← Back
                </button>

                <button
                  type="button"
                  class="btn btn-primary next-step-btn"
                  data-next="3"
                >
                  Next: Pricing →
                </button>

              </div>

            </div>


            <!-- STEP 3 -->

            <div
              id="step-3"
              class="wizard-section"
              style="display:none;"
            >

              <h3>Step 3: Pricing</h3>


              <div
                style="
                  display:grid;
                  grid-template-columns:1fr 1fr;
                  gap:1rem;
                  margin:1.5rem 0;
                "
              >

                <div>

                  <label>
                    List Price (USD) *
                  </label>

                  <input
                    id="pub-price"
                    type="number"
                    min="1"
                    step=".01"
                    placeholder="Enter price"
                    required
                    style="
                      width:100%;
                      padding:.75rem;
                    "
                  >

                </div>


                <div>

                  <label>
                    Sale Price
                  </label>

                  <input
                    id="pub-saleprice"
                    type="number"
                    min="0"
                    step=".01"
                    placeholder="Optional"
                    style="
                      width:100%;
                      padding:.75rem;
                    "
                  >

                </div>

              </div>


              <div
                style="
                  padding:1.25rem;
                  background:var(--accent-light);
                  border-radius:14px;
                  margin-bottom:1.5rem;
                "
              >

                <strong>
                  Estimated Author Royalty: 85%
                </strong>

                <div
                  id="pub-royalty-calc"
                  style="
                    font-size:1.3rem;
                    font-weight:800;
                    margin-top:8px;
                  "
                >
                  $0.00 per sale
                </div>

              </div>


              <div
                style="
                  display:flex;
                  justify-content:space-between;
                "
              >

                <button
                  type="button"
                  class="btn btn-secondary prev-step-btn"
                  data-prev="2"
                >
                  ← Back
                </button>

                <button
                  type="button"
                  class="btn btn-primary next-step-btn"
                  data-next="4"
                >
                  Next: Preview →
                </button>

              </div>

            </div>


            <!-- STEP 4 -->

            <div
              id="step-4"
              class="wizard-section"
              style="display:none;"
            >

              <h3>Step 4: Preview</h3>


              <div
                style="
                  background:var(--bg-secondary);
                  border-radius:16px;
                  padding:1.5rem;
                  margin:1.5rem 0;
                "
              >

                <div
                  style="
                    display:flex;
                    gap:1.5rem;
                    align-items:center;
                  "
                >

                  <div
                    id="preview-cover-box"
                    style="
                      width:110px;
                      height:150px;
                      border-radius:10px;
                      background:${activeGradient};
                      background-size:cover;
                      background-position:center;
                      flex-shrink:0;
                    "
                  ></div>


                  <div>

                    <h3 id="preview-title">
                      Your Book
                    </h3>

                    <div
                      id="preview-author"
                      style="color:var(--text-secondary);"
                    >
                      Author
                    </div>

                    <div
                      id="preview-pages"
                      style="
                        color:var(--text-secondary);
                        margin-top:5px;
                      "
                    >
                      Pages: —
                    </div>

                    <div
                      id="preview-price"
                      style="
                        color:var(--accent);
                        font-size:1.3rem;
                        font-weight:800;
                        margin-top:10px;
                      "
                    >
                      $0.00
                    </div>

                  </div>

                </div>

              </div>


              <div
                style="
                  display:flex;
                  justify-content:space-between;
                "
              >

                <button
                  type="button"
                  class="btn btn-secondary prev-step-btn"
                  data-prev="3"
                >
                  ← Back
                </button>

                <button
                  type="button"
                  class="btn btn-primary next-step-btn"
                  data-next="5"
                >
                  Continue →
                </button>

              </div>

            </div>


            <!-- STEP 5 -->

            <div
              id="step-5"
              class="wizard-section"
              style="display:none;"
            >

              <h3>
                Step 5: Submit for Admin Review
              </h3>

              <div
                style="
                  padding:1.5rem;
                  background:#eff6ff;
                  border-radius:14px;
                  margin:1.5rem 0;
                  line-height:1.7;
                "
              >

                Your eBook will be uploaded to
                <strong>Google Drive</strong> and a
                pending book record will be created.

                <br><br>

                The book will appear in the marketplace
                only after an administrator approves it.

              </div>


              <div
                style="
                  display:flex;
                  justify-content:space-between;
                "
              >

                <button
                  type="button"
                  class="btn btn-secondary prev-step-btn"
                  data-prev="4"
                >
                  ← Back
                </button>

                <button
                  type="submit"
                  id="submit-pub-btn"
                  class="btn btn-primary btn-lg"
                >
                  Upload & Submit 🚀
                </button>

              </div>

            </div>


          </form>

        </div>

      </div>

    </div>
  `;
}


export function initPublishInternalEvents() {

  const form =
    document.getElementById('publish-wizard-form');

  if (!form) return;


  // PDF

  document
    .getElementById('pub-pdf')
    ?.addEventListener('change', async event => {

      const file =
        event.target.files?.[0];

      if (!file) return;

      if (
        file.type !== 'application/pdf' &&
        !file.name.toLowerCase().endsWith('.pdf')
      ) {
        Toast.show(
          'Please select a PDF file.',
          'warning'
        );

        event.target.value = '';
        return;
      }

      if (file.size > MAX_PDF_SIZE) {

        Toast.show(
          'PDF must be 15 MB or smaller.',
          'warning'
        );

        event.target.value = '';
        return;
      }

      selectedPDF = file;

      updateFileUI();

      const pageInput =
        document.getElementById('pub-pages');

      const pages =
        await getPDFPageCount(file);

      if (pages && pageInput) {
        pageInput.value = pages;
      }

    });


  // Cover

  document
    .getElementById('pub-cover')
    ?.addEventListener('change', event => {

      const file =
        event.target.files?.[0];

      if (!file) return;

      if (!file.type.startsWith('image/')) {

        Toast.show(
          'Please select a valid cover image.',
          'warning'
        );

        event.target.value = '';
        return;
      }

      if (file.size > MAX_COVER_SIZE) {

        Toast.show(
          'Cover must be 5 MB or smaller.',
          'warning'
        );

        event.target.value = '';
        return;
      }

      selectedCover = file;

      updateFileUI();
      updateCoverPreview();

    });


  // Next buttons

  document
    .querySelectorAll('.next-step-btn')
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const next =
            Number(button.dataset.next);

          if (next === 2 && !validateStep1()) {
            return;
          }

          if (next === 3 && !validateStep2()) {
            return;
          }

          if (next === 4 && !validateStep3()) {
            return;
          }

          if (next === 5) {
            updatePreview();
          }

          showStep(next);

        }
      );

    });


  // Back buttons

  document
    .querySelectorAll('.prev-step-btn')
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          showStep(
            Number(button.dataset.prev)
          );

        }
      );

    });


  // Price

  const price =
    document.getElementById('pub-price');

  const sale =
    document.getElementById('pub-saleprice');

  const royalty =
    document.getElementById('pub-royalty-calc');


  function updateRoyalty() {

    const finalPrice =
      Number(sale?.value || price?.value || 0);

    const value =
      finalPrice * 0.85;

    if (royalty) {
      royalty.textContent =
        `${formatPrice(value)} per sale`;
    }

  }


  price?.addEventListener(
    'input',
    updateRoyalty
  );

  sale?.addEventListener(
    'input',
    updateRoyalty
  );


  // Submit

  form.addEventListener(
    'submit',
    async event => {

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


      const submit =
        document.getElementById(
          'submit-pub-btn'
        );

      submit.disabled = true;
      submit.textContent =
        'Uploading...';


      try {

        if (!state.isAuthenticated) {
          throw new Error(
            'Please sign in before publishing.'
          );
        }


        if (!state.isSeller && !state.isAdmin) {
          throw new Error(
            'Seller approval is required before publishing.'
          );
        }


        const title =
          document
            .getElementById('pub-title')
            .value.trim();

        const subtitle =
          document
            .getElementById('pub-subtitle')
            .value.trim();

        const author =
          document
            .getElementById('pub-author')
            .value.trim();

        const category =
          document
            .getElementById('pub-category')
            .value;

        const description =
          document
            .getElementById('pub-description')
            .value.trim();

        const tags =
          document
            .getElementById('pub-tags')
            .value
            .split(',')
            .map(x => x.trim())
            .filter(Boolean);

        const pages =
          Number(
            document
              .getElementById('pub-pages')
              .value
          );

        const price =
          Number(
            document
              .getElementById('pub-price')
              .value
          );

        const salePrice =
          Number(
            document
              .getElementById('pub-saleprice')
              .value || 0
          );


        submit.textContent =
          'Preparing files...';


        const pdfBase64 =
          await fileToBase64(selectedPDF);

        const coverBase64 =
          await fileToBase64(selectedCover);


        submit.textContent =
          'Uploading to Drive...';


        const uploadResponse =
          await apiFetch(
            '/api/books/upload-files',
            {
              method: 'POST',

              headers: {
                Authorization:
                  `Bearer ${state.token}`
              },

              body: JSON.stringify({

                action:
                  'uploadBookFiles',

                pdf: {
                  name:
                    selectedPDF.name,

                  mimeType:
                    'application/pdf',

                  data:
                    pdfBase64
                },

                cover: {
                  name:
                    selectedCover.name,

                  mimeType:
                    selectedCover.type,

                  data:
                    coverBase64
                }

              })

            }
          );


        const uploadData =
          await uploadResponse.json();


        if (
          !uploadResponse.ok ||
          !uploadData.success
        ) {

          throw new Error(
            uploadData.error ||
            'File upload failed.'
          );

        }


        submit.textContent =
          'Creating book listing...';


        const bookResponse =
          await apiFetch(
            '/api/books/create',
            {
              method: 'POST',

              headers: {
                Authorization:
                  `Bearer ${state.token}`
              },

              body: JSON.stringify({

                action:
                  'createBook',

                title,
                subtitle,
                author,
                category,
                description,
                tags,

                pages,

                format:
                  'PDF',

                price,

                sale_price:
                  salePrice || null,

                cover_url:
                  uploadData.cover_url,

                pdf_url:
                  uploadData.pdf_url,

                cover_file_id:
                  uploadData.cover_file_id,

                pdf_file_id:
                  uploadData.pdf_file_id,

                status:
                  'pending'

              })

            }
          );


        const bookData =
          await bookResponse.json();


        if (
          !bookResponse.ok ||
          !bookData.success
        ) {

          throw new Error(
            bookData.error ||
            'Book creation failed.'
          );

        }


        Toast.show(
          'eBook submitted successfully for admin review!',
          'success'
        );


        selectedPDF = null;
        selectedCover = null;


        setTimeout(() => {

          window.location.hash =
            '#/creator/dashboard';

        }, 800);


      } catch (error) {

        console.error(
          'Publish eBook error:',
          error
        );

        Toast.show(
          error.message ||
          'Unable to publish eBook.',
          'error'
        );

        submit.disabled = false;

        submit.textContent =
          'Upload & Submit 🚀';

      }

    }
  );


  function updatePreview() {

    const title =
      document
        .getElementById('pub-title')
        ?.value ||
      'Untitled eBook';

    const author =
      document
        .getElementById('pub-author')
        ?.value ||
      'Author';

    const priceValue =
      Number(
        document
          .getElementById('pub-saleprice')
          ?.value ||
        document
          .getElementById('pub-price')
          ?.value ||
        0
      );

    const pages =
      document
        .getElementById('pub-pages')
        ?.value ||
      '—';


    const titleEl =
      document.getElementById(
        'preview-title'
      );

    const authorEl =
      document.getElementById(
        'preview-author'
      );

    const priceEl =
      document.getElementById(
        'preview-price'
      );

    const pagesEl =
      document.getElementById(
        'preview-pages'
      );


    if (titleEl) {
      titleEl.textContent = title;
    }

    if (authorEl) {
      authorEl.textContent =
        `by ${author}`;
    }

    if (priceEl) {
      priceEl.textContent =
        formatPrice(priceValue);
    }

    if (pagesEl) {
      pagesEl.textContent =
        `Pages: ${pages}`;
    }

    updateCoverPreview();

  }


  function showStep(step) {

    document
      .querySelectorAll('.wizard-section')
      .forEach(section => {

        section.style.display =
          'none';

      });


    const target =
      document.getElementById(
        `step-${step}`
      );

    if (target) {
      target.style.display =
        'block';
    }


    document
      .querySelectorAll('.wizard-step-node')
      .forEach(node => {

        const number =
          Number(node.dataset.step);

        const circle =
          node.querySelector(
            '.step-num'
          );

        const title =
          node.querySelector(
            '.step-title'
          );


        if (number === step) {

          circle.style.background =
            'var(--accent)';

          circle.style.color =
            '#fff';

          circle.style.borderColor =
            'var(--accent)';

          title.style.color =
            'var(--accent)';

        } else if (number < step) {

          circle.style.background =
            '#ECFDF5';

          circle.style.color =
            '#059669';

          circle.style.borderColor =
            '#059669';

          title.style.color =
            '#059669';

        } else {

          circle.style.background =
            '#fff';

          circle.style.color =
            'var(--text-muted)';

          circle.style.borderColor =
            'var(--border-medium)';

          title.style.color =
            'var(--text-muted)';

        }

      });


    window.scrollTo({
      top:0,
      behavior:'smooth'
    });

  }

  updateFileUI();
  showStep(1);

}
