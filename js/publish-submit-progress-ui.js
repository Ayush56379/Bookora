// BOOKORA_PUBLISH_SUBMIT_PROGRESS_UI_V3
// Clear overall upload progress (percent + uploaded/total MB).
// IMPORTANT: never show "Upload successful" before the real upload reaches 100%.
(() => {
  const MB = 1024 * 1024;
  const getTotalBytes = () => {
    const pdf = document.getElementById('pub-pdf')?.files?.[0];
    const cover = document.getElementById('pub-cover')?.files?.[0];
    return (pdf?.size || 0) + (cover?.size || 0);
  };

  const showSuccessOnlyAt100 = label => {
    if (!label || label.dataset.bookoraUploadComplete === '1') return false;
    const text = label.textContent || '';
    const match = text.match(/(\d+(?:\.\d+)?)\s*%/);
    if (!match) return false;
    const percent = Number(match[1]);
    if (!Number.isFinite(percent) || percent < 100) return false;
    label.dataset.bookoraUploadComplete = '1';
    label.dataset.progressPercent = '100';
    label.innerHTML = '<strong>Upload successful</strong><span class="bookora-upload-mb" style="display:block;margin-top:5px;font-weight:600;color:var(--text-secondary);font-size:.86rem;">100% uploaded</span>';
    return true;
  };

  const updateProgressDetails = () => {
    const label = document.getElementById('upload-progress-label');
    if (!label) return;
    if (showSuccessOnlyAt100(label)) return;

    const total = getTotalBytes();
    if (!total) return;
    const existing = label.querySelector('.bookora-upload-mb');
    const baseText = existing
      ? label.firstChild?.textContent?.trim() || label.dataset.baseText || ''
      : label.textContent.trim();
    const match = baseText.match(/(\d+(?:\.\d+)?)\s*%/);
    if (!match) return;
    const percent = Math.max(0, Math.min(100, Number(match[1])));
    if (percent >= 100) {
      showSuccessOnlyAt100(label);
      return;
    }
    const uploaded = total * percent / 100;
    const mbText = `${(uploaded / MB).toFixed(2)} MB / ${(total / MB).toFixed(2)} MB uploaded`;
    if (label.dataset.progressPercent === String(percent) && existing?.textContent === mbText) return;
    label.dataset.baseText = baseText;
    label.dataset.progressPercent = String(percent);
    if (!existing) {
      label.innerHTML = `${baseText}<span class="bookora-upload-mb" style="display:block;margin-top:5px;font-weight:600;color:var(--text-secondary);font-size:.86rem;">${mbText}</span>`;
    } else {
      existing.textContent = mbText;
    }
  };

  const styleStep5 = () => {
    const step = document.getElementById('step-5');
    if (!step || step.dataset.progressUiStyled === '1') return;
    step.dataset.progressUiStyled = '1';
    const progress = document.getElementById('upload-progress-box');
    const actions = step.querySelector(':scope > div:last-child');
    if (progress) progress.style.margin = '1.5rem 0 1.75rem';
    if (actions) {
      actions.style.gap = '1rem';
      actions.style.marginTop = '0.25rem';
      actions.style.alignItems = 'center';
    }
    const back = step.querySelector('.prev-step-btn');
    const submit = document.getElementById('submit-pub-btn');
    [back, submit].forEach(button => {
      if (!button) return;
      button.style.minHeight = '44px';
      button.style.padding = '0.7rem 1.15rem';
      button.style.margin = '0';
    });
  };

  const refresh = () => {
    styleStep5();
    updateProgressDetails();
  };

  const start = () => {
    refresh();
    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    document.addEventListener('change', event => {
      if (event.target?.id === 'pub-pdf' || event.target?.id === 'pub-cover') refresh();
    }, true);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
