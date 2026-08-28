// PUBLISH_AUTHOR_EMPTY_PERMANENT_FIX
// The Author field on the internal eBook upload wizard must always start empty.
// Do not populate it from the signed-in user's profile or persisted form data.
// Once the seller manually edits the field, never clear their input.
// Keep a clear in-field placeholder so sellers know what to enter.
(() => {
  let userEditingAuthor = false;

  const isAuthorField = element => element?.id === 'pub-author';

  const clearAutoFilledAuthor = () => {
    const input = document.getElementById('pub-author');
    if (!input || userEditingAuthor) return;

    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocapitalize', 'words');
    input.setAttribute('spellcheck', 'true');
    input.setAttribute('placeholder', 'Enter author name');

    // Clear both the live value and the HTML default value so a browser/session
    // restore cannot repopulate the field from the old profile name.
    if (input.value) input.value = '';
    input.removeAttribute('value');
  };

  const markManualEdit = event => {
    if (isAuthorField(event.target)) userEditingAuthor = true;
  };

  document.addEventListener('beforeinput', markManualEdit, true);
  document.addEventListener('input', markManualEdit, true);
  document.addEventListener('paste', markManualEdit, true);
  document.addEventListener('drop', markManualEdit, true);
  document.addEventListener('keydown', event => {
    if (!isAuthorField(event.target)) return;
    if (event.key.length === 1 || ['Backspace', 'Delete'].includes(event.key)) {
      userEditingAuthor = true;
    }
  }, true);

  const observer = new MutationObserver(() => clearAutoFilledAuthor());

  const start = () => {
    clearAutoFilledAuthor();
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // Browser autofill can change an input's value without firing DOM mutation
    // events. Re-check briefly until the upload wizard has settled.
    let checks = 0;
    const timer = setInterval(() => {
      clearAutoFilledAuthor();
      checks += 1;
      if (checks >= 80 || !document.getElementById('pub-author')) clearAutoFilledAuthor();
      if (checks >= 80) clearInterval(timer);
    }, 250);

    window.addEventListener('hashchange', () => {
      userEditingAuthor = false;
      setTimeout(clearAutoFilledAuthor, 0);
      setTimeout(clearAutoFilledAuthor, 300);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
