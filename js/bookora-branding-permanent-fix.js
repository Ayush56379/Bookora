/* Bookora branding + clean Brevo-style loader.
   Loading must show only the centered Bookora wordmark. */
(() => {
  const fixText = node => {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const value = node.nodeValue || '';
    const fixed = value.replace(/Bookora\s+Store/gi, 'Bookora').replace(/Buocora/gi, 'Bookora');
    if (fixed !== value) node.nodeValue = fixed;
  };

  const normalizeAdded = root => {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) { fixText(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) fixText(node);
  };

  const installLoader = () => {
    if (!document.body || document.getElementById('bookora-brevo-loader')) return;

    const style = document.createElement('style');
    style.id = 'bookora-brevo-loader-style';
    style.textContent = `
      #bookora-brevo-loader {
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fff;
        opacity: 1;
        visibility: visible;
        transition: opacity .18s ease, visibility .18s ease;
      }
      #bookora-brevo-loader.is-hidden {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
      }
      #bookora-brevo-loader .bookora-loader-word {
        margin: 0;
        padding: 0;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: clamp(56px, 7vw, 88px);
        line-height: 1;
        font-weight: 600;
        letter-spacing: -0.055em;
        color: #12a879;
        animation: bookora-loader-color 2.8s ease-in-out infinite;
        user-select: none;
      }
      @keyframes bookora-loader-color {
        0%, 100% { color: #12a879; }
        25% { color: #7750e8; }
        50% { color: #2563eb; }
        75% { color: #e24b8f; }
      }
      @media (prefers-reduced-motion: reduce) {
        #bookora-brevo-loader .bookora-loader-word { animation: none; }
      }
    `;
    document.head.appendChild(style);

    const loader = document.createElement('div');
    loader.id = 'bookora-brevo-loader';
    loader.setAttribute('role', 'status');
    loader.setAttribute('aria-label', 'Loading Bookora');
    const word = document.createElement('div');
    word.className = 'bookora-loader-word';
    word.textContent = 'Bookora';
    loader.appendChild(word);
    document.body.appendChild(loader);

    const hide = () => {
      const el = document.getElementById('bookora-brevo-loader');
      if (!el) return;
      el.classList.add('is-hidden');
      setTimeout(() => el.remove(), 220);
    };
    window.__BOOKORA_HIDE_LOADER__ = hide;

    if (document.readyState === 'complete') setTimeout(hide, 80);
    else window.addEventListener('load', () => setTimeout(hide, 80), { once: true });
    // Never leave the overlay permanently stuck if another script delays load.
    setTimeout(hide, 8000);
  };

  const redirectAuthenticatedAuthRoute = () => {
    const path = (location.hash || '#/').split('?')[0];
    if (!['#/login', '#/signup', '#/register'].includes(path)) return;
    const goHome = () => {
      try {
        const profile = JSON.parse(localStorage.getItem('bookora_user_profile') || 'null');
        if (profile?.uid || profile?.firebaseUid || profile?.bookoraUserId) {
          location.hash = '#/';
          return true;
        }
      } catch (_) {}
      try {
        const user = window.firebase?.auth?.()?.currentUser;
        if (user) { location.hash = '#/'; return true; }
      } catch (_) {}
      return false;
    };
    if (goHome()) return;
    const check = setInterval(() => { if (goHome()) clearInterval(check); }, 250);
    setTimeout(() => clearInterval(check), 5000);
  };

  const start = () => {
    installLoader();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) fixText(node);

    let scheduled = false;
    const pending = new Set();
    const flush = () => {
      scheduled = false;
      const items = Array.from(pending); pending.clear();
      items.slice(0, 80).forEach(normalizeAdded);
    };
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) mutation.addedNodes?.forEach(node => pending.add(node));
      if (!scheduled && pending.size) {
        scheduled = true;
        (window.requestAnimationFrame || (fn => setTimeout(fn, 0)))(flush);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.__BOOKORA_BRANDING_GUARD__ = observer;
  };

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });

  window.addEventListener('hashchange', redirectAuthenticatedAuthRoute);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', redirectAuthenticatedAuthRoute, { once: true });
  else redirectAuthenticatedAuthRoute();
})();
