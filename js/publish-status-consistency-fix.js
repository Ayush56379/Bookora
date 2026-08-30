// Keep publish result cards mutually exclusive.
// A failed retry must never leave the previous success card visible.
(() => {
  if (window.__BOOKORA_PUBLISH_STATUS_CONSISTENCY_FIX__) return;
  window.__BOOKORA_PUBLISH_STATUS_CONSISTENCY_FIX__ = true;

  const sync = () => {
    const success = document.getElementById('publish-success');
    const failure = document.getElementById('publish-failure');
    if (!success || !failure) return;
    const failureVisible = !failure.hasAttribute('hidden') && getComputedStyle(failure).display !== 'none';
    const successVisible = !success.hasAttribute('hidden') && getComputedStyle(success).display !== 'none';
    if (failureVisible && successVisible) success.setAttribute('hidden', '');
  };

  new MutationObserver(sync).observe(document.documentElement, {subtree:true, childList:true, attributes:true, attributeFilter:['hidden','style','class']});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync, {once:true});
  else sync();
})();
