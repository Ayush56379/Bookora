/* Bookora branding guard — keeps the public brand text canonical. */
(() => {
  const normalize = (root = document) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    for (const textNode of nodes) {
      const value = textNode.nodeValue || '';
      if (!value) continue;
      const fixed = value
        .replace(/Bookora\s+Store/gi, 'Bookora')
        .replace(/Buocora/gi, 'Bookora');
      if (fixed !== value) textNode.nodeValue = fixed;
    }
  };

  const start = () => {
    normalize();
    const observer = new MutationObserver(() => normalize());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    window.__BOOKORA_BRANDING_GUARD__ = observer;
  };

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
