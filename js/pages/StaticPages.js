// StaticPages Component (Help, Guidelines, Terms, Privacy, Refund)
import { updateSEO } from '../utils/seo.js';

export function renderStaticPage(pageType) {
  let title = 'Help Center & Documentation';
  let desc = 'Learn how Bookora works, publishing rules, and customer protection.';
  let content = '';

  if (pageType === 'guidelines') {
    title = 'Creator & Author Publishing Guidelines';
    content = `
      <h2>1. Quality & Format Standards</h2>
      <p>All eBooks published on Bookora must be high-signal, properly formatted digital publications (PDF or EPUB). Content must have accurate metadata, high-resolution covers, and authentic authorship.</p>
      <h2>2. 85% Creator Royalties</h2>
      <p>Authors retain 85% of net sale proceeds. Payouts are transferred automatically via Cashfree Payouts directly into your verified bank account.</p>
      <h2>3. External Sales Page Verification</h2>
      <p>When submitting an external eBook sales page (Leanpub, Gumroad, Amazon, O'Reilly), you must confirm you have authorized rights to promote and link to the source domain. External listings redirect users directly to the publisher's website for checkout.</p>
    `;
  } else if (pageType === 'refund') {
    title = '30-Day Buyer Refund Policy';
    content = `
      <h2>1. 100% Satisfaction Guarantee</h2>
      <p>For native Bookora eBooks, we offer a no-questions-asked 30-day money-back guarantee if the publication does not meet your expectations.</p>
      <h2>2. Refund Processing</h2>
      <p>Refunds are credited back to your original payment method via Cashfree within 3 to 5 business days.</p>
      <h2>3. External Purchases Disclaimer</h2>
      <p>For external books purchased on third-party publisher websites (e.g. Leanpub, Gumroad, Amazon), refund requests must be handled according to the external publisher's specific terms.</p>
    `;
  } else if (pageType === 'terms') {
    title = 'Terms of Service';
    content = `
      <h2>1. Acceptance of Terms</h2>
      <p>By accessing or publishing on Bookora, you agree to comply with our platform policies, intellectual property guidelines, and applicable international laws.</p>
      <h2>2. Single-User License</h2>
      <p>Purchased Bookora eBooks grant a perpetual, non-exclusive single-user license to read and download the publication for personal use with digital watermark protection.</p>
    `;
  } else if (pageType === 'privacy') {
    title = 'Privacy & Security Policy';
    content = `
      <h2>1. Data Protection</h2>
      <p>We do not sell personal data. All payments are processed through PCI-DSS Level 1 certified Cashfree Payment Gateway with 256-bit AES encryption.</p>
      <h2>2. Account Security</h2>
      <p>Your reading history, library progress, and payment receipts are securely stored and encrypted.</p>
    `;
  } else {
    title = 'Help Center & Support';
    content = `
      <h2>Getting Help with Bookora</h2>
      <p>Welcome to the Bookora Help Center. Whether you are a reader looking to access your purchases, or an author wanting to scale your digital publications, our team is here for you.</p>
      <h2>Support Contact</h2>
      <p>For technical inquiries or author assistance, email <strong>support@bookora.com</strong>.</p>
    `;
  }

  updateSEO({ title, description: desc });

  return `
    <div class="static-page animate-fade-in" style="background: var(--bg-secondary); min-height: 80vh; padding: 4rem 0 6rem 0;">
      <div class="container" style="max-width: 800px;">
        <div style="background: #FFFFFF; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 3rem 2.5rem; box-shadow: var(--shadow-sm);">
          <div class="badge badge-bookora" style="margin-bottom: 0.75rem;">Documentation</div>
          <h1 style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 2rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem;">
            ${title}
          </h1>
          <div class="static-content" style="font-size: 1rem; color: var(--text-secondary); line-height: 1.8;">
            ${content}
          </div>
          <div style="margin-top: 3rem; border-top: 1px solid var(--border-subtle); padding-top: 1.5rem;">
            <a href="#/" class="btn btn-primary btn-sm">← Back to Homepage</a>
          </div>
        </div>
      </div>
    </div>
  `;
}
