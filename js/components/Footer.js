import { apiUrl } from '../config.js';

const FOOTER_SOCIAL_LINKS = { facebook: '', x: '', instagram: '', linkedin: '', youtube: '' };
const FOOTER_APP_LINKS = { android: '', ios: '' };
function safeUrl(value){return /^https?:\/\//i.test(String(value||'')) ? String(value) : '';}

export function renderFooter() {
  const year = new Date().getFullYear();
  const social = Object.entries(FOOTER_SOCIAL_LINKS).filter(([,href])=>safeUrl(href)).map(([name,href])=>`<a class="bookora-footer__social" href="${href}" target="_blank" rel="noopener noreferrer" aria-label="Bookora on ${name}">${name}</a>`).join('');
  const android = safeUrl(FOOTER_APP_LINKS.android), ios = safeUrl(FOOTER_APP_LINKS.ios);
  const appLinks = (android || ios) ? `<div class="bookora-footer__app-links">${android?`<a class="bookora-footer__app-badge" href="${android}">Google Play</a>`:''}${ios?`<a class="bookora-footer__app-badge" href="${ios}">App Store</a>`:''}</div>` : `<div class="bookora-footer__app-links"><span class="bookora-footer__app-coming">App links will be added soon.</span></div>`;
  setTimeout(()=>initFooterEvents(),0);
  return `<footer class="bookora-footer" aria-label="Bookora footer"><div class="bookora-footer__container">
    <section class="bookora-footer__trust-strip" aria-label="Bookora service highlights"><div class="bookora-footer__trust-item"><span class="bookora-footer__trust-icon trust-blue">♢</span><div><strong>Secure Payments</strong><small>100% safe &amp; protected</small></div></div><div class="bookora-footer__trust-item"><span class="bookora-footer__trust-icon trust-blue">ϟ</span><div><strong>Instant Access</strong><small>Download instantly</small></div></div><div class="bookora-footer__trust-item"><span class="bookora-footer__trust-icon trust-green">✓</span><div><strong>Verified Content</strong><small>Quality checked eBooks</small></div></div><div class="bookora-footer__trust-item"><span class="bookora-footer__trust-icon trust-purple">♧</span><div><strong>Creator Friendly</strong><small>Empowering creators</small></div></div><div class="bookora-footer__trust-item"><span class="bookora-footer__trust-icon trust-orange">◌</span><div><strong>24/7 Support</strong><small>We're here to help</small></div></div></section>
    <div class="bookora-footer__main">
      <section class="bookora-footer__brand"><a href="#/" class="bookora-footer__brand-link" aria-label="Bookora home"><span class="bookora-footer__logo">B</span><span>Bookora</span></a><p class="bookora-footer__description">Discover digital books, read verified publications, and publish your own work through a modern eBook marketplace built for readers and creators.</p><div class="bookora-footer__socials">${social || '<span class="bookora-footer__social-note">Social channels will be added soon.</span>'}</div><div class="bookora-footer__security-card"><span class="bookora-footer__security-icon">🔒</span><div><strong>Secure payments &amp; protected content</strong><p>All transactions are handled through the platform's configured payment services and content-access controls.</p><a href="#/privacy">Learn more about security →</a></div></div></section>
      <nav class="bookora-footer__column" aria-label="Explore Bookora"><h2>Explore</h2><a href="#/">Home</a><a href="#/explore">All eBooks</a><a href="#/new-releases">New Releases <span class="bookora-footer__new">New</span></a><a href="#/best-sellers">Best Sellers</a><a href="#/categories">Categories</a><a href="#/trending">Trending</a><a href="#/explore?free=true">Free eBooks</a><a href="#/explore?language=hindi">eBooks in Hindi</a><a href="#/explore?type=audiobook">Audiobooks</a></nav>
      <nav class="bookora-footer__column" aria-label="Creators and authors"><h2>For Creators</h2><a href="#/publish">Publish on Bookora</a><a href="#/creator/dashboard">Creator Studio</a><a href="#/seller/apply">Become a Creator</a><a href="#/seller-guidelines">Author Guidelines</a><a href="#/seller/settings">Creator Resources</a><a href="#/seller/settings">Creator Support</a></nav>
      <nav class="bookora-footer__column" aria-label="Support"><h2>Support</h2><a href="#/help">Help Center</a><a href="#/faq">FAQ</a><a href="#/how-it-works">How Bookora Works</a><a href="#/contact">Contact Support</a><a href="#/review-support">Review &amp; Support</a><a href="#/refund-policy">Refund Policy</a><a href="#/terms">Terms of Service</a><a href="#/privacy">Privacy Policy</a></nav>
      <nav class="bookora-footer__column" aria-label="Company"><h2>Company</h2><a href="#/about">About Bookora</a><a href="#/about">Our Mission</a><a href="#/contact">Careers <span class="bookora-footer__hiring">Hiring</span></a><a href="#/contact">Press &amp; Media</a><a href="#/contact">Partnerships</a><a href="#/explore">Blog</a><a href="#/about">Announcements</a></nav>
    </div>
    <section class="bookora-footer__updates" aria-label="Bookora updates"><div><span class="bookora-footer__updates-icon">✉</span><div><h2>Stay updated with Bookora</h2><p>Get new release alerts, offers, and platform updates in your inbox.</p></div></div><form id="bookora-newsletter-form" class="bookora-footer__subscribe"><input id="bookora-newsletter-email" name="email" type="email" autocomplete="email" required aria-label="Email address" placeholder="Enter your email address"><button id="bookora-newsletter-submit" type="submit">Subscribe</button><small id="bookora-newsletter-msg">No spam. Unsubscribe anytime.</small></form></section>
    <section class="bookora-footer__community" aria-label="Bookora community and reviews">
      <div class="bookora-footer__community-block"><strong>Trusted by readers &amp; creators worldwide</strong><div id="bookora-footer-avatars" class="bookora-footer__avatars" aria-label="Users who submitted reviews"></div></div>
      <div class="bookora-footer__community-block bookora-footer__rating-block"><strong>Our users love Bookora</strong><div id="bookora-footer-rating" class="bookora-footer__rating-stars" aria-label="Bookora average rating">☆☆☆☆☆</div></div>
      <div class="bookora-footer__community-block bookora-footer__apps-block"><strong>Get the Bookora App</strong>${appLinks}</div>
    </section>
    <div class="bookora-footer__bottom"><p>© ${year} Bookora. All rights reserved.</p><div class="bookora-footer__bottom-links"><a href="#/review-support">Review &amp; Support</a><a href="#/terms">Terms</a><a href="#/privacy">Privacy</a><a href="#/refund-policy">Refunds</a><a href="#/contact">Contact</a></div><div class="bookora-footer__language">◉ English <span>⌄</span></div></div><div class="bookora-footer__legal-note"><span>♢ DMCA Protected</span><b>•</b><a href="#/contact">Copyright Infringement Policy</a></div>
  </div></footer>`;
}

async function initNewsletterSubscription(){
  const form=document.getElementById('bookora-newsletter-form'); if(!form || form.dataset.bound)return; form.dataset.bound='1';
  form.addEventListener('submit',async e=>{e.preventDefault();const input=document.getElementById('bookora-newsletter-email'),button=document.getElementById('bookora-newsletter-submit'),msg=document.getElementById('bookora-newsletter-msg');const email=String(input?.value||'').trim().toLowerCase();if(!email||!input?.checkValidity()){if(msg)msg.textContent='Please enter a valid email address.';return;}if(button){button.disabled=true;button.textContent='Subscribing…';}if(msg)msg.textContent='Saving your subscription…';try{const r=await fetch(apiUrl('/api/newsletter/subscribe'),{method:'POST',headers:{Accept:'application/json'},body:JSON.stringify({email})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Unable to subscribe right now.');if(input)input.value='';if(msg)msg.textContent=d.alreadySubscribed?'You are already subscribed to Bookora updates.':'✓ You are subscribed to Bookora updates.';}catch(err){if(msg)msg.textContent=err.message||'Unable to subscribe right now. Please try again.';}finally{if(button){button.disabled=false;button.textContent='Subscribe';}}});
}

export async function initFooterEvents(){
  initNewsletterSubscription();
  try{
    const base=typeof window!=='undefined'?(window.BOOKORA_API_URL||''):''; if(!base)return;
    const r=await fetch(`${base}/api/reviews`,{headers:{Accept:'application/json'}}); if(!r.ok)return;
    const d=await r.json(); const reviews=Array.isArray(d.reviews)?d.reviews:[]; const rating=Number(d.averageRating||0);
    const stars=document.getElementById('bookora-footer-rating');
    if(stars){const rounded=Math.max(0,Math.min(5,Math.round(rating)));stars.textContent=reviews.length?'★'.repeat(rounded)+'☆'.repeat(5-rounded):'☆☆☆☆☆';}
    const avatars=document.getElementById('bookora-footer-avatars');
    if(avatars){avatars.innerHTML=reviews.slice(0,6).map(r=>{const name=String(r.displayName||'Bookora Reader').trim()||'Bookora Reader';const photo=safeUrl(r.photoURL||r.photoUrl||r.avatarUrl||r.avatar||r.profileImage||r.profilePhoto||'');return photo?`<span class="bookora-footer__avatar-image" title="${name.replace(/"/g,'&quot;')}"><img src="${photo}" alt="${name.replace(/"/g,'&quot;')}" loading="lazy" referrerpolicy="no-referrer"></span>`:'';}).filter(Boolean).join('');}
  }catch(e){console.warn('[Bookora footer] community data unavailable:',e);}
}
