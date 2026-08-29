from pathlib import Path

p = Path('js/components/Footer.js')
s = p.read_text(encoding='utf-8')
mark = '// BOOKORA_NEWSLETTER_FIX_V2'
if mark in s:
    raise SystemExit('Newsletter fix already applied')
if not s.startswith("import { apiUrl } from '../config.js';"):
    s = "import { apiUrl } from '../config.js';\n\n" + s
old = '<form class="bookora-footer__subscribe" onsubmit="return false"><input type="email" aria-label="Email address" placeholder="Enter your email address"><button type="button">Subscribe</button><small>No spam. Unsubscribe anytime.</small></form>'
new = '<form id="bookora-newsletter-form" class="bookora-footer__subscribe"><input id="bookora-newsletter-email" name="email" type="email" autocomplete="email" required aria-label="Email address" placeholder="Enter your email address"><button id="bookora-newsletter-submit" type="submit">Subscribe</button><small id="bookora-newsletter-msg">No spam. Unsubscribe anytime.</small></form>'
if old not in s:
    raise SystemExit('Expected newsletter form not found')
s = s.replace(old, new, 1)
needle = 'export async function initFooterEvents(){'
handler = r'''// BOOKORA_NEWSLETTER_FIX_V2
async function initNewsletterSubscription(){
  const form = document.getElementById('bookora-newsletter-form');
  if (!form || form.dataset.bound === '1') return;
  form.dataset.bound = '1';
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = document.getElementById('bookora-newsletter-email');
    const button = document.getElementById('bookora-newsletter-submit');
    const message = document.getElementById('bookora-newsletter-msg');
    const email = String(input?.value || '').trim().toLowerCase();
    if (!email || !input?.checkValidity()) {
      if (message) message.textContent = 'Please enter a valid email address.';
      input?.focus();
      return;
    }
    if (button) { button.disabled = true; button.textContent = 'Subscribing…'; }
    if (message) message.textContent = 'Saving your subscription…';
    try {
      const response = await fetch(apiUrl('/api/newsletter/subscribe'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to subscribe right now.');
      if (input) input.value = '';
      if (message) message.textContent = data.alreadySubscribed
        ? 'You are already subscribed to Bookora updates.'
        : '✓ You are subscribed to Bookora updates.';
    } catch (error) {
      console.error('[Bookora newsletter]', error);
      if (message) message.textContent = error.message || 'Unable to subscribe right now. Please try again.';
    } finally {
      if (button) { button.disabled = false; button.textContent = 'Subscribe'; }
    }
  });
}

'''
if needle not in s:
    raise SystemExit('Footer event initializer not found')
s = s.replace(needle, handler + needle, 1)
s = s.replace(needle, needle + '\n  initNewsletterSubscription();', 1)
p.write_text(s, encoding='utf-8')
print('Applied working newsletter subscription UI')
