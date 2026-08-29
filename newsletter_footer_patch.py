from pathlib import Path

P = Path('js/components/Footer.js')
s = P.read_text(encoding='utf-8')
MARK = '// BOOKORA_NEWSLETTER_FOOTER_V1'
if MARK in s:
    raise SystemExit('Newsletter footer patch already applied')

if not s.startswith("import { apiUrl } from '../config.js';"):
    s = "import { apiUrl } from '../config.js';\n\n" + s

s = s.replace(
    '<form class="bookora-footer__updates"',
    '<form class="bookora-footer__updates"',
    1
) if False else s

old = '<form class="bookora-footer__subscribe" onsubmit="return false"><input type="email" aria-label="Email address" placeholder="Enter your email address"><button type="button">Subscribe</button><small>No spam. Unsubscribe anytime.</small></form>'
new = '<form id="bookora-newsletter-form" class="bookora-footer__subscribe"><input id="bookora-newsletter-email" name="email" type="email" autocomplete="email" required aria-label="Email address" placeholder="Enter your email address"><button id="bookora-newsletter-submit" type="submit">Subscribe</button><small id="bookora-newsletter-msg">No spam. Unsubscribe anytime.</small></form>'
if old not in s:
    raise SystemExit('Newsletter form markup not found')
s = s.replace(old, new, 1)

needle = 'export async function initFooterEvents(){'
handler = r'''// BOOKORA_NEWSLETTER_FOOTER_V1
async function initNewsletterSubscription(){
  const form=document.getElementById('bookora-newsletter-form');
  if(!form || form.dataset.bound)return;
  form.dataset.bound='1';
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const input=document.getElementById('bookora-newsletter-email');
    const button=document.getElementById('bookora-newsletter-submit');
    const msg=document.getElementById('bookora-newsletter-msg');
    const email=String(input?.value||'').trim().toLowerCase();
    if(!email || !input?.checkValidity()){if(msg)msg.textContent='Please enter a valid email address.';return;}
    if(button){button.disabled=true;button.textContent='Subscribing…';}
    if(msg)msg.textContent='Saving your subscription…';
    try{
      const r=await fetch(apiUrl('/api/newsletter/subscribe'),{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({email})});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.error||'Unable to subscribe right now.');
      if(input)input.value='';
      if(msg)msg.textContent=d.alreadySubscribed?'You are already subscribed to Bookora updates.':'✓ You are subscribed to Bookora updates.';
    }catch(err){if(msg)msg.textContent=err.message||'Unable to subscribe right now. Please try again.';}
    finally{if(button){button.disabled=false;button.textContent='Subscribe';}}
  });
}

'''
if needle not in s:
    raise SystemExit('Footer init function not found')
s = s.replace(needle, handler + needle, 1)
s = s.replace(needle, needle + '\n  initNewsletterSubscription();', 1)
P.write_text(s, encoding='utf-8')
print('Newsletter footer patch applied')
