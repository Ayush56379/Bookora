import { apiFetch } from '../config.js';
import { getFreshFirebaseIdToken } from '../firebase-authenticated-fetch.js?v=20260823-3';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

const esc = (v='') => String(v).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

async function authToken() {
  const token = await getFreshFirebaseIdToken(true).catch(() => null);
  if (token) return token;
  try {
    const saved = String(localStorage.getItem('bookora_auth_token') || '').trim();
    if (saved) return saved;
  } catch (_) {}
  throw new Error('Seller authentication required. Please sign in again.');
}

function codeBox(id, title, description, code) {
  return `<section style="margin-top:1.1rem;border:1px solid #dbe4f0;border-radius:16px;overflow:hidden;background:#fff">
    <div style="padding:1rem 1.1rem;border-bottom:1px solid #e5e7eb;background:#f8fafc">
      <div style="font-weight:800;color:#0f172a">${esc(title)}</div>
      <div style="font-size:.78rem;color:#64748b;margin-top:.25rem;line-height:1.5">${esc(description)}</div>
    </div>
    <div style="padding:1rem">
      <textarea id="${esc(id)}" readonly rows="6" style="width:100%;box-sizing:border-box;padding:.85rem;border:1px solid #cbd5e1;border-radius:11px;background:#0b1220;color:#e2e8f0;font:12px/1.55 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;resize:vertical">${esc(code)}</textarea>
      <button type="button" class="btn btn-primary ext-copy-btn" data-copy-id="${esc(id)}" style="margin-top:.65rem">Copy Full Code</button>
    </div>
  </section>`;
}

export function renderExternalIntegrationPage() {
  updateSEO({ title: 'External Website Integration Setup', description: 'Complete Bookora integration instructions and seller website connection code.' });
  return `<main class="external-integration-page animate-fade-in" style="min-height:85vh;background:#f6f8fc;padding:2.2rem 0 5rem">
    <div class="container" style="max-width:1050px">
      <div style="text-align:center;margin-bottom:1.5rem">
        <span style="display:inline-flex;padding:.35rem .7rem;border-radius:999px;background:#dcfce7;color:#166534;font-size:.72rem;font-weight:800">BOOKORA BACKEND CONNECTED</span>
        <h1 style="font-family:var(--font-display);font-size:2.2rem;margin:.65rem 0;color:#0f172a">External Website Integration</h1>
        <p style="max-width:760px;margin:auto;color:#64748b;line-height:1.65">Your eBook is uploaded. This page gives the seller everything required to connect their website with Bookora checkout, payment verification and Library fulfillment.</p>
      </div>
      <div id="ext-integration-loading" style="background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:2rem;text-align:center;color:#64748b">Loading secure integration details…</div>
      <div id="ext-integration-content" style="display:none">
        <div id="ext-book-summary"></div>
        <div id="ext-code-sections"></div>
      </div>
    </div>
  </main>`;
}

function bindCopyButtons() {
  document.querySelectorAll('.ext-copy-btn').forEach(btn => btn.addEventListener('click', async () => {
    const el = document.getElementById(btn.dataset.copyId);
    const value = el?.value || '';
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch (_) {
      el.select(); document.execCommand('copy');
    }
    Toast.show('Full integration code copied.', 'success');
  }));
}

export async function initExternalIntegrationPage(bookId) {
  const loading = document.getElementById('ext-integration-loading');
  const content = document.getElementById('ext-integration-content');
  try {
    const token = await authToken();
    const res = await apiFetch(`/api/external/integration/${encodeURIComponent(bookId)}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store'
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Integration details could not be loaded.');

    const book = data.book || {};
    const siteKey = String(data.site_key || '').trim();
    const buyCode = String(data.buy_page_code || '').trim();
    const successCode = String(data.success_page_code || '').trim();
    const webhookUrl = String(data.webhook_url || '').trim();
    const secret = String(data.webhook_secret || '').trim();

    document.getElementById('ext-book-summary').innerHTML = `<div style="background:#fff;border:1px solid #dbe4f0;border-radius:18px;padding:1.25rem;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:1rem;align-items:center">
      <div><div style="font-size:.72rem;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.06em">External eBook</div><h2 style="margin:.3rem 0;color:#0f172a;font-size:1.25rem">${esc(book.title || 'Your eBook')}</h2><div style="font-size:.82rem;color:#64748b">Book ID: ${esc(book.id || bookId)} • Site Key: ${esc(siteKey)}</div></div>
      <div style="padding:.4rem .7rem;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:.72rem;font-weight:800">INTEGRATION READY</div>
    </div>`;

    const serverExample = `// Seller server: call this ONLY after your own payment gateway confirms PAID/SUCCESS\nconst BOOKORA_BACKEND = '${webhookUrl.replace(/\/api\/external\/purchase\/confirm$/, '')}';\n\nawait fetch('${webhookUrl}', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: JSON.stringify({\n    site_key: '${siteKey}',\n    webhook_secret: '${secret || 'YOUR_PRIVATE_BOOKORA_WEBHOOK_SECRET'}',\n    bookora_session: bookoraSession,\n    external_order_id: yourPaymentOrderId,\n    status: 'PAID'\n  })\n});`;

    const instructions = `<div style="margin-top:1.1rem;padding:1.2rem;border:1px solid #bfdbfe;border-radius:16px;background:#eff6ff;color:#1e3a8a">
      <div style="font-weight:800;font-size:1rem">How the connection works</div>
      <ol style="margin:.7rem 0 0 1.2rem;padding:0;line-height:1.8;font-size:.84rem">
        <li>Put the <strong>Buy Page Code</strong> on the seller website's buy/checkout page or site-wide custom-code area.</li>
        <li>Put the <strong>Payment Success Code</strong> only on the final payment-success/access page.</li>
        <li>When a buyer starts from Bookora, Bookora creates a secure purchase session and sends the buyer to the seller website.</li>
        <li>The seller's payment system confirms the payment. Their server then calls the Bookora confirmation endpoint below.</li>
        <li>Bookora verifies the private webhook secret and purchase session. Only then is the buyer's Bookora Library access activated.</li>
      </ol>
    </div>`;

    const security = `<div style="margin-top:1.1rem;padding:1.1rem;border:1px solid #fecaca;border-radius:16px;background:#fff7f7;color:#7f1d1d;font-size:.82rem;line-height:1.65"><strong>Security:</strong> Never put the webhook secret in public HTML, browser JavaScript, GitHub Pages, or frontend source code. The seller keeps the secret on their private server. The browser code only carries the opaque Bookora session.</div>`;

    let html = instructions;
    html += codeBox('ext-buy-code', '1. Buy Page Code', 'Add this complete script to the seller website buy/checkout page. It carries the Bookora purchase session through the seller site.', buyCode);
    html += codeBox('ext-success-code', '2. Payment Success Page Code', 'Add this complete script only to the page displayed after payment. It checks Bookora for the server-verified fulfillment status.', successCode);
    html += codeBox('ext-server-code', '3. Seller Backend → Bookora Confirmation', 'Use this server-side example after the seller payment gateway reports a genuine successful payment. Replace bookoraSession and yourPaymentOrderId with values from the seller payment flow.', serverExample);
    html += `<section style="margin-top:1.1rem;border:1px solid #dbe4f0;border-radius:16px;background:#fff;padding:1.1rem"><div style="font-weight:800;color:#0f172a">4. Bookora Confirmation Endpoint</div><div style="margin-top:.55rem;padding:.8rem;border-radius:10px;background:#f8fafc;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;overflow:auto;word-break:break-all">${esc(webhookUrl)}</div><div style="font-size:.78rem;color:#64748b;margin-top:.55rem">Required values: <code>site_key</code>, <code>webhook_secret</code>, <code>bookora_session</code>, <code>external_order_id</code>, <code>status=PAID</code>.</div></section>`;
    if (secret) html += `<section style="margin-top:1.1rem;border:1px solid #fde68a;border-radius:16px;background:#fffbeb;padding:1.1rem"><div style="font-weight:800;color:#92400e">Private Webhook Secret</div><textarea readonly rows="2" style="width:100%;box-sizing:border-box;margin-top:.6rem;padding:.75rem;border:1px solid #fcd34d;border-radius:10px;background:#fff;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace">${esc(secret)}</textarea><div style="font-size:.76rem;color:#92400e;margin-top:.5rem">Copy this once to the seller's private backend environment. Do not publish it.</div></section>`;
    html += security;
    html += `<div style="margin-top:1.3rem;display:flex;gap:.7rem;flex-wrap:wrap"><a class="btn btn-secondary" href="#/publish/external">Back to External Publisher</a><a class="btn btn-primary" href="#/library">Open Library</a></div>`;

    document.getElementById('ext-code-sections').innerHTML = html;
    loading.style.display = 'none'; content.style.display = 'block'; bindCopyButtons();
  } catch (err) {
    loading.innerHTML = `<div style="color:#b91c1c;font-weight:700">${esc(err.message || 'Integration details could not be loaded.')}</div><a class="btn btn-secondary" href="#/publish/external" style="display:inline-block;margin-top:1rem">Back</a>`;
  }
}
