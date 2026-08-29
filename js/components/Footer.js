// Bookora Footer — premium marketplace footer matching the approved visual reference.
// Replace the empty external URLs below when the real Bookora social/app pages are ready.
const FOOTER_SOCIAL_LINKS = { facebook: '', x: '', instagram: '', linkedin: '', youtube: '' };
const FOOTER_APP_LINKS = { android: '', ios: '' };

const icon = {
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3c-3.1 0-5 1.9-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.7.3-1 1-1Z"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4.7l3.3 4.5L16.8 4H19l-5 6 5.2 7H14.5l-3.6-4.9L6.7 17H4.5l5.1-6.1L5 4Zm3 1.7 7.3 9.8h1.3L9.3 5.7H8Z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.2" cy="6.9" r="1" fill="currentColor" stroke="none"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.2 8.2H3V21h3.2V8.2ZM4.6 3A2 2 0 1 0 4.6 7 2 2 0 0 0 4.6 3ZM21 13.7c0-3.8-2-5.8-4.8-5.8-2.2 0-3.2 1.2-3.8 2v-1.7H9.2V21h3.2v-6.3c0-1.7.3-3.3 2.4-3.3 2.1 0 2.1 1.9 2.1 3.4V21H21v-7.3Z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 8.2a2.8 2.8 0 0 0-2-2C17.2 5.7 12 5.7 12 5.7s-5.2 0-7 .5a2.8 2.8 0 0 0-2 2C2.5 10 2.5 12 2.5 12s0 2 .5 3.8a2.8 2.8 0 0 0 2 2c1.8.5 7 .5 7 .5s5.2 0 7-.5a2.8 2.8 0 0 0 2-2c.5-1.8.5-3.8.5-3.8s0-2-.5-3.8ZM10 15.5v-7l6 3.5-6 3.5Z"/></svg>'
};

function safeUrl(value){return /^https?:\/\//i.test(String(value||'')) ? String(value) : '';}

export function renderFooter() {
  const year = new Date().getFullYear();
  const social = Object.entries(FOOTER_SOCIAL_LINKS).filter(([,href])=>safeUrl(href)).map(([name,href])=>`<a class="bookora-footer__social" href="${href}" target="_blank" rel="noopener noreferrer" aria-label="Bookora on ${name}">${icon[name]}</a>`).join('');
  const android = safeUrl(FOOTER_APP_LINKS.android);
  const ios = safeUrl(FOOTER_APP_LINKS.ios);
  const appLinks = (android || ios) ? `<div class="bookora-footer__app-links" aria-label="Bookora app links">${android?`<a class="bookora-footer__app-badge" href="${android}" target="_blank" rel="noopener noreferrer"><span class="bookora-footer__app-icon">▶</span><span><small>GET IT ON</small><strong>Google Play</strong></span></a>`:''}${ios?`<a class="bookora-footer__app-badge" href="${ios}" target="_blank" rel="noopener noreferrer"><span class="bookora-footer__app-icon">●</span><span><small>Download on the</small><strong>App Store</strong></span></a>`:''}</div>` : `<div class="bookora-footer__app-links"><span class="bookora-footer__app-coming">App links will be added soon.</span></div>`;

  return `
    <footer class="bookora-footer" aria-label="Bookora footer">
      <div class="bookora-footer__container">
        <section class="bookora-footer__trust-strip" aria-label="Bookora service highlights">
          <div class="bookora-footer__trust-item"><span class="bookora-footer__trust-icon trust-blue">♢</span><div><strong>Secure Payments</strong><small>100% safe &amp; protected</small></div></div>
          <div class="bookora-footer__trust-item"><span class="bookora-footer__trust-icon trust-blue">ϟ</span><div><strong>Instant Access</strong><small>Download instantly</small></div></div>
          <div class="bookora-footer__trust-item"><span class="bookora-footer__trust-icon trust-green">✓</span><div><strong>Verified Content</strong><small>Quality checked eBooks</small></div></div>
          <div class="bookora-footer__trust-item"><span class="bookora-footer__trust-icon trust-purple">♧</span><div><strong>Creator Friendly</strong><small>Empowering creators</small></div></div>
          <div class="bookora-footer__trust-item"><span class="bookora-footer__trust-icon trust-orange">◌</span><div><strong>24/7 Support</strong><small>We're here to help</small></div></div>
        </section>

        <div class="bookora-footer__main">
          <section class="bookora-footer__brand">
            <a href="#/" class="bookora-footer__brand-link" aria-label="Bookora home"><span class="bookora-footer__logo" aria-hidden="true"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg></span><span>Bookora</span></a>
            <p class="bookora-footer__description">Discover digital books, read verified publications, and publish your own work through a modern eBook marketplace built for readers and creators.</p>
            <div class="bookora-footer__socials" aria-label="Bookora social links">${social || '<span class="bookora-footer__social-note">Social channels will be added soon.</span>'}</div>
            <div class="bookora-footer__security-card"><span class="bookora-footer__security-icon">🔒</span><div><strong>Secure payments &amp; protected content</strong><p>All transactions are handled through the platform's configured payment services and content-access controls.</p><a href="#/privacy">Learn more about security →</a></div></div>
          </section>

          <nav class="bookora-footer__column" aria-label="Explore Bookora"><h2>Explore</h2><a href="#/">Home</a><a href="#/explore">All eBooks</a><a href="#/new-releases">New Releases <span class="bookora-footer__new">New</span></a><a href="#/best-sellers">Best Sellers</a><a href="#/categories">Categories</a><a href="#/trending">Trending</a><a href="#/explore?free=true">Free eBooks</a><a href="#/explore?language=hindi">eBooks in Hindi</a><a href="#/explore?type=audiobook">Audiobooks</a></nav>
          <nav class="bookora-footer__column" aria-label="Creators and authors"><h2>For Creators</h2><a href="#/publish">Publish on Bookora</a><a href="#/creator/dashboard">Creator Studio</a><a href="#/seller/apply">Become a Creator</a><a href="#/seller-guidelines">Author Guidelines</a><a href="#/seller/settings">Creator Resources</a><a href="#/seller/settings">Creator Support</a></nav>
          <nav class="bookora-footer__column" aria-label="Support"><h2>Support</h2><a href="#/help">Help Center</a><a href="#/faq">FAQ</a><a href="#/how-it-works">How Bookora Works</a><a href="#/contact">Contact Support</a><a href="#/review-support">Review &amp; Support</a><a href="#/refund-policy">Refund Policy</a><a href="#/terms">Terms of Service</a><a href="#/privacy">Privacy Policy</a></nav>
          <nav class="bookora-footer__column" aria-label="Company"><h2>Company</h2><a href="#/about">About Bookora</a><a href="#/about">Our Mission</a><a href="#/contact">Careers <span class="bookora-footer__hiring">Hiring</span></a><a href="#/contact">Press &amp; Media</a><a href="#/contact">Partnerships</a><a href="#/explore">Blog</a><a href="#/about">Announcements</a></nav>
        </div>

        <section class="bookora-footer__updates" aria-label="Bookora updates"><div><span class="bookora-footer__updates-icon">✉</span><div><h2>Stay updated with Bookora</h2><p>Get new release alerts, offers, and platform updates in your inbox.</p></div></div><form class="bookora-footer__subscribe" onsubmit="return false"><input type="email" aria-label="Email address" placeholder="Enter your email address"><button type="button">Subscribe</button><small>No spam. Unsubscribe anytime.</small></form></section>

        <section class="bookora-footer__community" aria-label="Bookora community and apps">
          <div class="bookora-footer__community-block"><strong>Trusted by readers &amp; creators worldwide</strong><div id="bookora-footer-avatars" class="bookora-footer__avatars"><span>BR</span><span>AR</span><span>RS</span><span>AK</span><span>MK</span><span>SP</span></div><p id="bookora-footer-users">Join Bookora readers &amp; creators</p></div>
          <div class="bookora-footer__community-block bookora-footer__rating-block"><strong>Our users love Bookora</strong><div id="bookora-footer-rating" class="bookora-footer__rating-stars" aria-label="Bookora rating">★★★★★</div><p><b id="bookora-footer-rating-value">No rating yet</b> <span id="bookora-footer-rating-count"></span></p></div>
          <div class="bookora-footer__community-block bookora-footer__apps-block"><strong>Get the Bookora App</strong>${appLinks}</div>
        </section>

        <div class="bookora-footer__bottom"><p>© ${year} Bookora. All rights reserved.</p><div class="bookora-footer__bottom-links"><a href="#/review-support">Review &amp; Support</a><a href="#/terms">Terms</a><a href="#/privacy">Privacy</a><a href="#/refund-policy">Refunds</a><a href="#/contact">Contact</a></div><div class="bookora-footer__language">◉ English <span>⌄</span></div></div>
        <div class="bookora-footer__legal-note"><span>♢ DMCA Protected</span><b>•</b><a href="#/contact">Copyright Infringement Policy</a></div>
      </div>
    </footer>`;
}

export async function initFooterEvents(){
  try{
    const base = typeof window !== 'undefined' ? (window.BOOKORA_API_URL || '') : '';
    if(!base) return;
    const r = await fetch(`${base}/api/reviews`, {headers:{Accept:'application/json'}});
    if(!r.ok) return;
    const d = await r.json();
    const reviews = Array.isArray(d.reviews) ? d.reviews : [];
    const rating = Number(d.averageRating || 0);
    const count = reviews.length;
    const value = document.getElementById('bookora-footer-rating-value');
    const countEl = document.getElementById('bookora-footer-rating-count');
    const stars = document.getElementById('bookora-footer-rating');
    if(value) value.textContent = count ? `${rating.toFixed(1)}/5` : 'No rating yet';
    if(countEl) countEl.textContent = count ? `based on ${count.toLocaleString('en-IN')} review${count===1?'':'s'}` : '';
    if(stars && count){ const rounded=Math.round(rating); stars.textContent='★'.repeat(Math.max(0,Math.min(5,rounded)))+'☆'.repeat(5-Math.max(0,Math.min(5,rounded))); }
    const names=reviews.slice(0,6).map(r=>String(r.displayName||'Bookora Reader').trim()).filter(Boolean);
    const avatars=document.getElementById('bookora-footer-avatars');
    if(avatars && names.length){ avatars.innerHTML=names.map(name=>{const parts=name.split(/\s+/).filter(Boolean);const initials=(parts[0]?.[0]||'B')+(parts.length>1?(parts[parts.length-1]?.[0]||''):'');return `<span title="${name.replace(/"/g,'&quot;')}">${initials.toUpperCase().slice(0,2)}</span>`;}).join(''); }
    const users=document.getElementById('bookora-footer-users');
    if(users && count) users.textContent=`Join ${count.toLocaleString('en-IN')} reader${count===1?'':'s'} who shared feedback`;
  }catch(e){ console.warn('[Bookora footer] community data unavailable:',e); }
}
