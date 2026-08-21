import { state } from './state.js';
import { apiFetch } from './config.js';
import { Toast } from './components/Toast.js';

let installed = false;
let submitBusy = false;

function clean(value = '') {
  return String(value || '').trim();
}

function getToken() {
  return clean(state.token);
}

function hideOldFulfillmentUI(form) {
  // Older deployments inserted a PDF fulfillment box. External listings no longer
  // host or deliver the source eBook, so remove any stale UI if the page is cached.
  form?.querySelectorAll('#bookora-external-fulfillment-box, .bookora-ext-fulfillment').forEach(el => el.remove());
}

async function submitExternalForm(form) {
  if (submitBusy) return;
  const checkbox = document.getElementById('ext-confirm-checkbox');
  const submit = document.getElementById('ext-submit-btn');
  const url = clean(document.getElementById('ext-url-input')?.value);

  if (!checkbox?.checked) {
    Toast.show('Please confirm that you have permission to list and promote this eBook.', 'warning');
    return;
  }
  if (!url) {
    Toast.show('Original sales-page URL is required.', 'warning');
    return;
  }
  if (!/^https?:\/\//i.test(url)) {
    Toast.show('Please enter a valid public HTTP/HTTPS sales-page URL.', 'warning');
    return;
  }
  if (!getToken()) {
    Toast.show('Please sign in again before submitting the external listing.', 'error');
    return;
  }

  submitBusy = true;
  if (submit) {
    submit.disabled = true;
    submit.textContent = 'Submitting external listing…';
  }

  try {
    const price = Number(document.getElementById('ext-price')?.value || 0);
    const payload = {
      title: clean(document.getElementById('ext-title')?.value),
      subtitle: clean(document.getElementById('ext-subtitle')?.value),
      author: clean(document.getElementById('ext-author')?.value),
      publisher: clean(document.getElementById('ext-publisher')?.value),
      category: document.getElementById('ext-category')?.value || 'Other',
      language: clean(document.getElementById('ext-language')?.value) || 'English',
      pages: Number(document.getElementById('ext-pages')?.value || 0),
      format: clean(document.getElementById('ext-format')?.value) || 'Digital eBook',
      isbn: clean(document.getElementById('ext-isbn')?.value),
      price,
      original_price: price,
      original_currency: clean(document.getElementById('ext-currency')?.value) || 'INR',
      source_currency: clean(document.getElementById('ext-currency')?.value) || 'INR',
      cover_url: clean(document.getElementById('ext-cover-url')?.value),
      description: clean(document.getElementById('ext-description')?.value),
      source_url: url,
      canonical_url: url,
      rights_confirmed: true
    };

    const res = await apiFetch('/api/publish/external', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(payload)
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result.success) {
      throw new Error(result.error || 'External listing could not be created.');
    }

    Toast.show(
      result.book?.status === 'approved'
        ? 'External eBook is now live on Bookora.'
        : 'External eBook submitted for admin moderation.',
      'success'
    );

    window.location.hash = result.book?.status === 'approved'
      ? `#/book/${encodeURIComponent(result.book.slug)}`
      : '#/creator/dashboard';
  } catch (error) {
    console.error('Bookora external listing failed:', error);
    Toast.show(error?.message || 'External listing failed. Please try again.', 'error');
    if (submit) {
      submit.disabled = false;
      submit.textContent = 'Submit External Listing for Moderation Review';
    }
  } finally {
    submitBusy = false;
  }
}

function interceptExternalSubmit(event) {
  const form = event.target instanceof HTMLFormElement ? event.target : null;
  if (!form || form.id !== 'ext-submit-form') return;
  event.preventDefault();
  event.stopImmediatePropagation();
  hideOldFulfillmentUI(form);
  submitExternalForm(form);
}

function removeLegacyCheckoutInterception() {
  // Intentionally no click interception here. External books must remain external.
  // The detail-page UI sets the purchase button directly to source_url.
}

function observe() {
  const form = document.getElementById('ext-submit-form');
  if (form) hideOldFulfillmentUI(form);
}

if (!installed) {
  installed = true;
  document.addEventListener('submit', interceptExternalSubmit, true);
  removeLegacyCheckoutInterception();
  const observer = new MutationObserver(observe);
  observer.observe(document.documentElement, { subtree: true, childList: true });
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observe, { once: true });
  } else {
    observe();
  }
}
