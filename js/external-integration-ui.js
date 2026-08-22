const API_PUBLISH_PATH = '/api/publish/external';

if (!window.__bookoraExternalIntegrationCapture) {
  window.__bookoraExternalIntegrationCapture = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async function(input, init = {}) {
    const url = typeof input === 'string' ? input : (input?.url || '');
    const response = await originalFetch(input, init);
    if (String(url).includes(API_PUBLISH_PATH) && String(init?.method || 'GET').toUpperCase() === 'POST') {
      try {
        const data = await response.clone().json();
        if (data?.success && data?.integration) window.__bookoraExternalIntegration = data.integration;
      } catch (_) {}
    }
    return response;
  };
}

function esc(value = '') {
  return String(value).replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[c]));
}

function addIntegrationPanel() {
  const panel = document.getElementById('ext-integration-panel');
  const integration = window.__bookoraExternalIntegration;
  if (!panel || !integration || panel.dataset.paymentIntegrationAdded === '1') return;
  if (panel.style.display === 'none' || !panel.innerHTML.trim()) return;
  panel.dataset.paymentIntegrationAdded = '1';

  const publicCode = String(integration.header_code || '').trim();
  const webhookUrl = String(integration.webhook_url || 'https://bookora-backend-x08l.onrender.com/api/external/purchase/confirm').trim();
  const siteKey = String(integration.site_key || '').trim();
  const secret = String(integration.webhook_secret || '').trim();
  const serverCode = `// Run this ONLY from your website backend / payment webhook.\n// Never put BOOKORA_WEBHOOK_SECRET in public HTML or browser JavaScript.\n\nconst BOOKORA_WEBHOOK_URL = ${JSON.stringify(webhookUrl)};\nconst BOOKORA_SITE_KEY = ${JSON.stringify(siteKey)};\nconst BOOKORA_WEBHOOK_SECRET = process.env.BOOKORA_WEBHOOK_SECRET;\n\nasync function confirmBookoraPayment({ bookoraSession, externalOrderId, status, amount, currency }) {\n  const response = await fetch(BOOKORA_WEBHOOK_URL, {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify({\n      site_key: BOOKORA_SITE_KEY,\n      webhook_secret: BOOKORA_WEBHOOK_SECRET,\n      bookora_session: bookoraSession,\n      external_order_id: externalOrderId,\n      status,\n      amount,\n      currency\n    })\n  });\n  return response.json();\n}`;

  const box = document.createElement('div');
  box.style.cssText = 'margin-top:1rem;padding:1rem;border:1px solid #93c5fd;border-radius:12px;background:#fff;';
  box.innerHTML = `
    <div style="font-weight:800;color:#1e40af;margin-bottom:.55rem">Payment Integration — Secure Setup</div>
    <div style="font-size:.82rem;color:#334155;line-height:1.55;margin-bottom:.9rem">
      <strong>Step 1:</strong> The public Bookora bridge code below goes into the seller website HTML. It captures the Bookora purchase session and lets Bookora verify the website.
      <br><strong>Step 2:</strong> The seller's payment backend/webhook must call the Bookora webhook only after the payment provider confirms the payment as successful.
      <br><strong>Important:</strong> the private webhook secret must stay on the seller's server. Browser JavaScript is never trusted as payment proof.
    </div>
    <label style="display:block;font-size:.76rem;font-weight:800;color:#475569">PUBLIC WEBSITE CODE</label>
    <textarea id="bookora-public-code" readonly rows="3" style="width:100%;margin-top:.35rem;padding:.65rem;font-family:monospace;font-size:.74rem;border:1px solid #cbd5e1;border-radius:8px">${esc(publicCode)}</textarea>
    <button type="button" id="bookora-copy-public" class="btn" style="margin-top:.5rem">Copy Website Code</button>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.65rem;margin-top:.9rem">
      <div><label style="display:block;font-size:.72rem;font-weight:800;color:#475569">SITE KEY</label><input readonly value="${esc(siteKey)}" style="width:100%;padding:.55rem;border:1px solid #cbd5e1;border-radius:7px;background:#f8fafc;font-family:monospace;font-size:.72rem"></div>
      <div><label style="display:block;font-size:.72rem;font-weight:800;color:#475569">BOOKORA WEBHOOK URL</label><input readonly value="${esc(webhookUrl)}" style="width:100%;padding:.55rem;border:1px solid #cbd5e1;border-radius:7px;background:#f8fafc;font-family:monospace;font-size:.72rem"></div>
    </div>
    <label style="display:block;font-size:.76rem;font-weight:800;color:#475569;margin-top:.9rem">PRIVATE WEBHOOK SECRET — SERVER ONLY</label>
    <textarea id="bookora-secret" readonly rows="2" style="width:100%;margin-top:.35rem;padding:.65rem;font-family:monospace;font-size:.74rem;border:1px solid #fecaca;border-radius:8px;background:#fff7ed">${esc(secret)}</textarea>
    <button type="button" id="bookora-copy-secret" class="btn" style="margin-top:.5rem">Copy Secret</button>
    <label style="display:block;font-size:.76rem;font-weight:800;color:#475569;margin-top:.9rem">SERVER WEBHOOK EXAMPLE</label>
    <textarea id="bookora-server-code" readonly rows="12" style="width:100%;margin-top:.35rem;padding:.65rem;font-family:monospace;font-size:.72rem;border:1px solid #cbd5e1;border-radius:8px">${esc(serverCode)}</textarea>
    <button type="button" id="bookora-copy-server" class="btn" style="margin-top:.5rem">Copy Server Example</button>
    <div style="margin-top:.8rem;padding:.7rem;border-radius:8px;background:#f0fdf4;color:#166534;font-size:.75rem;line-height:1.5">
      The buyer gets Library access <strong>only after</strong> Bookora receives this authenticated server-to-server confirmation with a matching amount/currency and valid purchase session.
    </div>`;
  panel.appendChild(box);

  const copy = async (id, message) => {
    try { await navigator.clipboard.writeText(document.getElementById(id)?.value || document.getElementById(id)?.textContent || ''); alert(message); }
    catch (_) { alert('Copy failed. Please select and copy the code manually.'); }
  };
  document.getElementById('bookora-copy-public')?.addEventListener('click', () => copy('bookora-public-code', 'Website code copied.'));
  document.getElementById('bookora-copy-secret')?.addEventListener('click', () => copy('bookora-secret', 'Private webhook secret copied. Keep it on your server only.'));
  document.getElementById('bookora-copy-server')?.addEventListener('click', () => copy('bookora-server-code', 'Server example copied.'));
}

const observer = new MutationObserver(addIntegrationPanel);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener('load', addIntegrationPanel);
setInterval(addIntegrationPanel, 500);
