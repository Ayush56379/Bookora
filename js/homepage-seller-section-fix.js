// Bookora homepage seller section cleanup
// Keep the public homepage buyer-first while retaining a small, accurate seller information block.
(() => {
  const STYLE_ID = 'bookora-homepage-seller-section-fix';
  const app = document.getElementById('app');
  if (!app) return;

  let running = false;

  function fixSellerSection() {
    if (running || !document.querySelector('.homepage')) return;
    running = true;

    try {
      const sections = [...document.querySelectorAll('.homepage section')];
      const section = sections.find(section => {
        const text = (section.textContent || '').replace(/\s+/g, ' ').trim();
        return /Have an eBook to Sell\?/i.test(text) || /Add External Sales Page/i.test(text) || /Creator Studio/i.test(text);
      });

      if (!section) return;

      section.innerHTML = `
        <div class="container">
          <div class="bookora-seller-info-card">
            <div class="bookora-seller-info-copy">
              <span class="badge bookora-seller-info-badge">SELLER CENTER</span>
              <h2>Sell Your eBooks on Bookora</h2>
              <p>
                Become a verified Bookora seller and reach readers through the marketplace.
                After seller approval, you can manage your eBooks, pricing, orders and earnings
                from the seller area.
              </p>
              <ul>
                <li><strong>Seller approval:</strong> Apply first and wait for verification.</li>
                <li><strong>Manage your catalog:</strong> Approved sellers can publish and manage eBooks from the seller area.</li>
                <li><strong>Track sales:</strong> View orders, earnings and wallet information in one place.</li>
              </ul>
              <div class="bookora-seller-info-actions">
                <a href="#/seller-apply" class="btn btn-primary btn-lg">Become a Seller <span aria-hidden="true">→</span></a>
                <a href="#/explore" class="btn btn-secondary btn-lg">Explore eBooks</a>
              </div>
            </div>
            <div class="bookora-seller-info-side" aria-hidden="true">
              <div class="bookora-seller-step"><strong>01</strong><span>Apply</span></div>
              <div class="bookora-seller-step"><strong>02</strong><span>Get Verified</span></div>
              <div class="bookora-seller-step"><strong>03</strong><span>Manage &amp; Earn</span></div>
            </div>
          </div>
        </div>
      `;

      if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
          .bookora-seller-info-card{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(220px,.7fr);gap:2rem;align-items:center;background:#111827;color:#fff;border-radius:28px;padding:3.2rem;box-shadow:0 18px 50px rgba(15,23,42,.14);overflow:hidden;}
          .bookora-seller-info-copy{min-width:0;}
          .bookora-seller-info-badge{margin-bottom:1rem;background:rgba(255,255,255,.1)!important;color:#93C5FD!important;border-color:rgba(255,255,255,.2)!important;}
          .bookora-seller-info-card h2{font-family:var(--font-display);font-size:clamp(1.8rem,4vw,2.7rem);line-height:1.12;font-weight:800;letter-spacing:-.025em;margin:0 0 1rem;color:#fff;}
          .bookora-seller-info-card p{font-size:1rem;line-height:1.7;color:#CBD5E1;max-width:700px;margin:0 0 1.25rem;}
          .bookora-seller-info-card ul{margin:0 0 1.6rem;padding-left:1.2rem;color:#CBD5E1;line-height:1.7;}
          .bookora-seller-info-card li{margin:.35rem 0;}
          .bookora-seller-info-card li strong{color:#fff;}
          .bookora-seller-info-actions{display:flex;flex-wrap:wrap;gap:.75rem;}
          .bookora-seller-info-side{display:grid;gap:.75rem;}
          .bookora-seller-step{display:flex;align-items:center;gap:1rem;padding:1.15rem 1.2rem;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:rgba(255,255,255,.05);}
          .bookora-seller-step strong{font-family:var(--font-display);font-size:1.5rem;color:#60A5FA;}
          .bookora-seller-step span{font-weight:700;color:#F8FAFC;}
          @media(max-width:700px){
            .bookora-seller-info-card{grid-template-columns:1fr;padding:2rem 1.25rem;border-radius:24px;gap:1.5rem;}
            .bookora-seller-info-card p{font-size:.95rem;line-height:1.6;}
            .bookora-seller-info-card ul{font-size:.86rem;}
            .bookora-seller-info-actions{display:grid;grid-template-columns:1fr;}
            .bookora-seller-info-actions .btn{width:100%;box-sizing:border-box;justify-content:center;}
            .bookora-seller-info-side{grid-template-columns:1fr 1fr 1fr;gap:.5rem;}
            .bookora-seller-step{flex-direction:column;text-align:center;gap:.25rem;padding:.8rem .45rem;}
            .bookora-seller-step strong{font-size:1.25rem;}
            .bookora-seller-step span{font-size:.72rem;}
          }
        `;
        document.head.appendChild(style);
      }
    } finally {
      running = false;
    }
  }

  const observer = new MutationObserver(() => requestAnimationFrame(fixSellerSection));
  observer.observe(app, { childList: true, subtree: true });
  window.addEventListener('hashchange', () => setTimeout(fixSellerSection, 80));
  setTimeout(fixSellerSection, 150);
  setTimeout(fixSellerSection, 700);
})();
