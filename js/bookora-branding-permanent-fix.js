/* Bookora lightweight branding + auth route guard.
   Never scan the whole application on every DOM mutation. */
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
    // Only inspect newly-added subtrees, never the entire document.
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) fixText(node);
  };

  const start = () => {
    document.querySelectorAll('body *').forEach(() => {});
    const initial = document.body;
    if (initial) {
      const walker = document.createTreeWalker(initial, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) fixText(node);
    }
    let scheduled = false;
    const pending = new Set();
    const flush = () => {
      scheduled = false;
      const items = Array.from(pending); pending.clear();
      items.slice(0, 80).forEach(normalizeAdded);
    };
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        mutation.addedNodes?.forEach(node => pending.add(node));
      }
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

  // If an already-authenticated user lands on /login (for example from a
  // search result or an old bookmark), immediately return them to Bookora.
  // This uses the locally restored state first, then Firebase auth as a backup.
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
  window.addEventListener('hashchange', redirectAuthenticatedAuthRoute);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', redirectAuthenticatedAuthRoute, { once: true });
  else redirectAuthenticatedAuthRoute();
})();
