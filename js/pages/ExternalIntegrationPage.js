import { apiFetch } from '../config.js';
import { getFreshFirebaseIdToken } from '../firebase-authenticated-fetch.js?v=20260823-3';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

const esc = (v='') => String(v).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

async function authToken() {
  const token = await getFreshFirebaseIdToken(true).catch(() => null);
  if (token) return token;
  try { const saved = String(localStorage.getItem('bookora_auth_token') || '').trim(); if (saved) return saved; } catch (_) {}
  throw new Error('Seller authentication required. Please sign in again.');
}

function codeBox(id, title, description, code) {
  return `<section style="margin-top:1.1rem;border:1px solid #dbe4f0;border-radius:16px;overflow:hidden;background:#fff"><div style="padding:1rem 1.1rem;border-bottom:1px solid #e5e7eb;background:#f8fafc"><div style="font-weight:800;color:#0f172a">${esc(title)}</div><div style="font-size:.78rem;color:#64748b;margin-top:.25rem;line-height:1.5">${esc(description)}</div></div><div style="padding:1rem"><textarea id="${esc(id)}" readonly rows="4" style="width:100%;box-sizing:border-box;padding:.85rem;border:1px solid #cbd5e1;border-radius:11px;background:#0b1220;color:#e2e8f0;font:12px/1.55 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;resize:vertical">${esc(code)}</textarea><button type="button" class="btn btn-primary ext-copy-btn" data-copy-id="${esc(id)}" style="margin-top:.65rem">Copy Full Code</button></div></section>`;
}

export function renderExternalIntegrationPage() {
  updateSEO({ title: 'External Website Integration Setup', description: 'Install one Bookora master code and verify the seller website connection.' });
  return `<main class="external-integration-page animate-fade-in" style="min-height:85vh;background:#f6f8fc;padding:2.2rem 0 5rem"><div class="container" style="max-width:1050px"><div style="text-align:center;margin-bottom:1.5rem"><span id="ext-master-status" style="display:inline-flex;padding:.35rem .7rem;border-radius:999px;background:#fef3c7;color:#92400e;font-size:.72rem;font-weight:800">VERIFYING WEBSITE CONNECTION…</span><h1 style="font-family:var(--font-display);font-size:2.2rem;margin:.65rem 0;color:#0f172a">Connect Your Website to Bookora</h1><p style="max-width:780px;margin:auto;color:#64748b;line-height:1.65">Install <strong>one master Bookora code</strong> on your seller website. The same code works across the entire website. Bookora will automatically verify when the code is actually running.</p></div><div id="ext-integration-loading" style="background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:2rem;text-align:center;color:#64748b">Loading secure integration details…</div><div id="ext-integration-content" style="display:none"><div id="ext-book-summary"></div><div id="ext-code-sections"></div></div></div></main>`;
}

function bindCopyButtons() {
  document.querySelectorAll('.ext-copy-btn').forEach(btn => btn.addEventListener('click', async () => {
    const el = document.getElementById(btn.dataset.copyId); const value = el?.value || ''; if (!value) return;
    try { await navigator.clipboard.writeText(value); } catch (_) { el.select(); document.execCommand('copy'); }
    Toast.show('Master Bookora code copied.', 'success');
  }));
}

async function loadMasterIntegration(token, book) {
  let current = await apiFetch('/api/external/integrations/current', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
  let data = await current.json();
  if (!current.ok) throw new Error(data.error || 'Could not load website integration.');
  if (!data.connected) {
    const websiteUrl = String(book.source_url || book.canonical_url || book.sourceUrl || '').trim();
    if (!websiteUrl) throw new Error('Seller website URL is missing from this external eBook.');
    const create = await apiFetch('/api/external/integrations', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ websiteUrl, websiteName: book.website_name || book.websiteName || '' }) });
    data = await create.json();
    if (!create.ok || !data.success) throw new Error(data.error || 'Could not create the master integration.');
    data.connected = true; data.integration = data.integration || {}; data.integration.scriptTag = data.scriptTag || '';
  }
  return data.integration || {};
}

async function verifyMasterIntegration(token, integrationId) {
  if (!integrationId) return null;
  const res = await apiFetch(`/api/external/integrations/${encodeURIComponent(integrationId)}/verify`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && !!data.verified, data };
}

function renderStatus(integration) {
  const badge = document.getElementById('ext-master-status'); if (!badge) return;
  const connected = String(integration.status || '').toLowerCase() === 'connected' || !!integration.codeInstallationVerified || !!integration.verifiedAt;
  if (connected) { badge.textContent = '✓ WEBSITE CONNECTED & VERIFIED'; badge.style.background = '#dcfce7'; badge.style.color = '#166534'; }
  else { badge.textContent = 'CODE INSTALLATION PENDING'; badge.style.background = '#fef3c7'; badge.style.color = '#92400e'; }
}

export async function initExternalIntegrationPage(bookId) {
  const loading = document.getElementById('ext-integration-loading'); const content = document.getElementById('ext-integration-content'); let pollTimer = null;
  try {
    const token = await authToken();
    const res = await apiFetch(`/api/external/integration/${encodeURIComponent(bookId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Integration details could not be loaded.');
    const book = data.book || {}; const integration = await loadMasterIntegration(token, book); renderStatus(integration);
    const masterCode = String(integration.scriptTag || data.master_code || '').trim();
    if (!masterCode) throw new Error('Bookora master integration code could not be generated.');

    document.getElementById('ext-book-summary').innerHTML = `<div style="background:#fff;border:1px solid #dbe4f0;border-radius:18px;padding:1.25rem;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:1rem;align-items:center"><div><div style="font-size:.72rem;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.06em">External eBook</div><h2 style="margin:.3rem 0;color:#0f172a;font-size:1.25rem">${esc(book.title || 'Your eBook')}</h2><div style="font-size:.82rem;color:#64748b">Book ID: ${esc(book.id || bookId)} • Website: ${esc(integration.websiteDomain || integration.websiteUrl || book.source_url || 'Seller website')}</div></div><div style="padding:.4rem .7rem;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:.72rem;font-weight:800">ONE-CODE SETUP</div></div>`;

    const instructions = `<div style="margin-top:1.1rem;padding:1.2rem;border:1px solid #bfdbfe;border-radius:16px;background:#eff6ff;color:#1e3a8a"><div style="font-weight:800;font-size:1rem">How it works</div><ol style="margin:.7rem 0 0 1.2rem;padding:0;line-height:1.8;font-size:.84rem"><li>Copy the <strong>single master code</strong> below.</li><li>Paste it once in the seller website's global Custom HTML / Header / Footer area, preferably before <code>&lt;/body&gt;</code>.</li><li>Do not create separate Bookora code for each page or each eBook.</li><li>The code identifies the seller website, tracks Bookora referrals and sends a secure heartbeat to Bookora.</li><li>After the code is live, Bookora automatically changes the integration to <strong>Connected & Verified</strong>.</li><li>Only Bookora's backend can decide whether a payment is genuinely verified before Library access is granted.</li></ol></div>`;
    const verifyButton = `<div style="margin-top:1.1rem;padding:1rem;border:1px solid #dbe4f0;border-radius:16px;background:#fff;display:flex;gap:.7rem;align-items:center;justify-content:space-between;flex-wrap:wrap"><div><strong style="color:#0f172a">Website verification</strong><div id="ext-verify-message" style="font-size:.78rem;color:#64748b;margin-top:.25rem">Waiting for the master code heartbeat…</div></div><button type="button" id="ext-verify-btn" class="btn btn-primary">Verify Website Now</button></div>`;

    let html = instructions;
    html += codeBox('ext-master-code', '1. Your ONE Master Bookora Code', 'Paste this exact code once on the seller website. It works across the complete website and is the only Bookora code the seller needs.', masterCode);
    html += verifyButton;
    html += `<section style="margin-top:1.1rem;padding:1.1rem;border:1px solid #dbe4f0;border-radius:16px;background:#fff"><div style="font-weight:800;color:#0f172a">2. What Bookora automatically tracks</div><ul style="margin:.65rem 0 0 1.1rem;padding:0;color:#475569;line-height:1.8;font-size:.82rem"><li>Seller website and integration identity</li><li>Visitor/referral activity and page heartbeats</li><li>Book/product attribution</li><li>Payment-session status when supported by the seller's payment flow</li><li>Verified orders and Library fulfillment</li></ul></section>`;
    html += `<section style="margin-top:1.1rem;padding:1.1rem;border:1px solid #fecaca;border-radius:16px;background:#fff7f7;color:#7f1d1d;font-size:.82rem;line-height:1.65"><strong>Security:</strong> The master code contains only a public opaque integration token. It never contains a Firebase service credential, Cashfree secret, or webhook secret. A successful browser redirect alone is never accepted as proof of payment.</section>`;
    html += `<div style="margin-top:1.3rem;display:flex;gap:.7rem;flex-wrap:wrap"><a class="btn btn-secondary" href="#/publish/external">Back to External Publisher</a><a class="btn btn-primary" href="#/library">Open Library</a></div>`;
    document.getElementById('ext-code-sections').innerHTML = html; loading.style.display = 'none'; content.style.display = 'block'; bindCopyButtons();

    const verifyBtn = document.getElementById('ext-verify-btn'); const verifyMsg = document.getElementById('ext-verify-message');
    verifyBtn?.addEventListener('click', async () => {
      verifyBtn.disabled = true; verifyBtn.textContent = 'Checking…';
      try {
        const result = await verifyMasterIntegration(token, integration.integrationId);
        if (result?.ok) { verifyMsg.textContent = '✓ Bookora found the master code on the public website.'; verifyMsg.style.color = '#166534'; Toast.show('Website verified successfully.', 'success'); renderStatus({ ...integration, status: 'connected', verifiedAt: new Date().toISOString(), codeInstallationVerified: true }); }
        else { verifyMsg.textContent = result?.data?.error || 'Bookora could not find the master code yet. Save the website changes and try again.'; verifyMsg.style.color = '#b91c1c'; }
      } catch (err) { verifyMsg.textContent = err.message || 'Verification failed.'; verifyMsg.style.color = '#b91c1c'; }
      finally { verifyBtn.disabled = false; verifyBtn.textContent = 'Verify Website Now'; }
    });

    pollTimer = setInterval(async () => {
      try {
        const r = await apiFetch('/api/external/integrations/current', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }); const d = await r.json();
        if (r.ok && d.success && d.integration) { renderStatus(d.integration); if (String(d.integration.status || '').toLowerCase() === 'connected' || d.integration.codeInstallationVerified) { if (verifyMsg) { verifyMsg.textContent = '✓ Master code is running on the seller website.'; verifyMsg.style.color = '#166534'; } } }
      } catch (_) {}
    }, 5000);
  } catch (err) { if (pollTimer) clearInterval(pollTimer); loading.innerHTML = `<div style="color:#b91c1c;font-weight:700">${esc(err.message || 'Integration details could not be loaded.')}</div><a class="btn btn-secondary" href="#/publish/external" style="display:inline-block;margin-top:1rem">Back</a>`; }
}
