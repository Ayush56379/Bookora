// BOOKORA_PUBLISH_FILE_NAME_MOBILE_FIX_V1
// Prevent long PDF/cover filenames from overflowing the upload cards on mobile.
(() => {
  const styleId = 'bookora-publish-file-name-mobile-fix';
  const apply = () => {
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        #step-2 #pdf-file-name,
        #step-2 #cover-file-name {
          display: block !important;
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
          word-break: normal !important;
          overflow-wrap: normal !important;
          padding: 0 8px !important;
          line-height: 1.45 !important;
        }
        #step-2 > * {
          min-width: 0;
        }
        @media (max-width: 600px) {
          #step-2 #pdf-file-name,
          #step-2 #cover-file-name {
            font-size: .88rem !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
    ['pdf-file-name', 'cover-file-name'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.maxWidth = '100%';
      el.style.minWidth = '0';
      el.style.overflow = 'hidden';
      el.style.textOverflow = 'ellipsis';
      el.style.whiteSpace = 'nowrap';
      el.title = el.textContent || '';
    });
  };
  const start = () => {
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
