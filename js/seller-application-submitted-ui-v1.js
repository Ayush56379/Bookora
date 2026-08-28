// Bookora seller application submitted screen — premium status UI.
// This is a route-scoped UI enhancement only. It does not change the seller
// submission API, Firebase persistence, authorization, or email delivery.
(() => {
  const route = () => (window.location.hash || '#/').split('?')[0].replace(/^#/, '') || '/';
  const esc = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  const styles = () => {
    if (document.getElementById('bookora-seller-submitted-ui-style')) return;
    const style = document.createElement('style');
    style.id = 'bookora-seller-submitted-ui-style';
    style.textContent = `
      .bookora-submitted-wrap{min-height:calc(100vh - 160px);background:linear-gradient(180deg,#f8fafc 0%,#f4f7fb 100%);padding:42px 16px 76px;display:flex;align-items:center;justify-content:center}
      .bookora-submitted-card{width:min(920px,100%);background:#fff;border:1px solid #e2e8f0;border-radius:28px;box-shadow:0 18px 55px rgba(15,23,42,.09);overflow:hidden}
      .bookora-submitted-top{height:7px;background:linear-gradient(90deg,#2563eb,#7c3aed)}
      .bookora-submitted-body{padding:clamp(28px,6vw,58px);text-align:center}
      .bookora-status-pill{display:inline-flex;align-items:center;gap:8px;padding:8px 13px;border-radius:999px;background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
      .bookora-success-mark{width:82px;height:82px;margin:24px auto 18px;border-radius:50%;display:grid;place-items:center;background:#ecfdf5;border:10px solid #f0fdf4;color:#16a34a;box-shadow:0 8px 24px rgba(22,163,74,.12)}
      .bookora-success-mark svg{width:40px;height:40px;display:block}
      .bookora-submitted-title{margin:0;color:#0f172a;font-size:clamp(30px,5vw,44px);line-height:1.12;font-weight:900;letter-spacing:-.03em}
      .bookora-submitted-lead{max-width:650px;margin:14px auto 0;color:#475569;font-size:16px;line-height:1.7}
      .bookora-submitted-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:30px auto 0;max-width:760px;text-align:left}
      .bookora-submitted-info{border:1px solid #e2e8f0;background:#f8fafc;border-radius:16px;padding:18px 18px 17px;display:flex;gap:13px;align-items:flex-start}
      .bookora-info-dot{width:38px;height:38px;min-width:38px;border-radius:11px;display:grid;place-items:center;background:#eef2ff;color:#4f46e5}
      .bookora-info-dot svg{width:20px;height:20px}
      .bookora-submitted-info h3{margin:1px 0 5px;color:#0f172a;font-size:14px;font-weight:850}
      .bookora-submitted-info p{margin:0;color:#64748b;font-size:13px;line-height:1.6}
      .bookora-submitted-info strong{color:#334155}
      .bookora-review-banner{max-width:760px;margin:18px auto 0;padding:16px 18px;border-radius:15px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;text-align:left;font-size:13px;line-height:1.6}
      .bookora-review-banner strong{font-weight:850}
      .bookora-submitted-actions{display:flex;justify-content:center;gap:11px;flex-wrap:wrap;margin-top:28px}
      .bookora-submitted-actions a{min-height:46px;padding:0 20px;border-radius:11px;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;font-size:13px;font-weight:850}
      .bookora-primary-action{background:#2563eb;color:#fff;box-shadow:0 7px 18px rgba(37,99,235,.2)}
      .bookora-secondary-action{background:#fff;color:#334155;border:1px solid #cbd5e1}
      .bookora-submitted-foot{margin-top:19px;color:#94a3b8;font-size:11px;line-height:1.5}
      @media(max-width:680px){.bookora-submitted-wrap{padding:24px 12px 55px;min-height:calc(100vh - 120px)}.bookora-submitted-card{border-radius:22px}.bookora-submitted-body{padding:28px 18px 32px}.bookora-success-mark{width:70px;height:70px;border-width:8px;margin-top:20px}.bookora-success-mark svg{width:34px;height:34px}.bookora-submitted-grid{grid-template-columns:1fr;margin-top:24px}.bookora-submitted-lead{font-size:14px}.bookora-review-banner{text-align:left}.bookora-submitted-actions{flex-direction:column}.bookora-submitted-actions a{width:100%;box-sizing:border-box}}
    `;
    document.head.appendChild(style);
  };

  const icon = (type) => {
    if (type === 'mail') return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></svg>`;
    if (type === 'clock') return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`;
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><path d="m5 12 4.2 4.2L19 6.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  };

  const renderSubmitted = card => {
    if (!card || card.dataset.bookoraSubmittedUi === '1') return;
    card.dataset.bookoraSubmittedUi = '1';
    styles();
    const email = (() => {
      try { return window.__BOOKORA_CURRENT_USER_EMAIL__ || ''; } catch (_) { return ''; }
    })();
    card.outerHTML = `
      <section class="bookora-submitted-wrap">
        <div class="bookora-submitted-card">
          <div class="bookora-submitted-top"></div>
          <div class="bookora-submitted-body">
            <div class="bookora-status-pill">${icon('check')} Submission received</div>
            <div class="bookora-success-mark" aria-hidden="true">${icon('check')}</div>
            <h1 class="bookora-submitted-title">Application submitted successfully</h1>
            <p class="bookora-submitted-lead">Your seller application and submitted details have been received. Your application is now <strong>pending admin review</strong>.</p>

            <div class="bookora-submitted-grid">
              <div class="bookora-submitted-info">
                <div class="bookora-info-dot">${icon('mail')}</div>
                <div><h3>Gmail updates</h3><p>${email ? `We’ll send updates to <strong>${esc(email)}</strong>.` : 'We’ll send updates to your registered Gmail address.'} You’ll receive a message when your seller account is approved.</p></div>
              </div>
              <div class="bookora-submitted-info">
                <div class="bookora-info-dot">${icon('clock')}</div>
                <div><h3>What happens next?</h3><p>Our team will review your submitted information. If anything is missing or needs correction, you’ll receive an email with the required next steps.</p></div>
              </div>
            </div>

            <div class="bookora-review-banner"><strong>Application status: Pending review</strong><br>Please keep an eye on your registered Gmail inbox for the next Bookora update.</div>

            <div class="bookora-submitted-actions">
              <a class="bookora-primary-action" href="#/">Back to Bookora</a>
              <a class="bookora-secondary-action" href="#/dashboard">Open My Account</a>
            </div>
            <div class="bookora-submitted-foot">No further action is required right now. Bookora will contact you when the review status changes.</div>
          </div>
        </div>
      </section>`;
  };

  const patch = () => {
    if (route() !== '/seller/apply') return;
    const result = document.querySelector('.seller-card.result');
    if (result) renderSubmitted(result);
    const intro = document.querySelector('.seller-card:not(.result) .intro');
    if (intro && !intro.dataset.bookoraIntroFixed) {
      intro.dataset.bookoraIntroFixed = '1';
      intro.textContent = 'Complete 5 steps to submit your seller application. Once submitted, your application will be reviewed by the Bookora team.';
    }
  };

  const start = () => {
    patch();
    const observer = new MutationObserver(() => patch());
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', () => setTimeout(patch, 50), { passive: true });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
