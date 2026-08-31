// Publish-page category enhancement only. Does not alter any other route.
(function () {
  const ID = 'bookora-publish-category-runtime';
  if (window[ID]) return;
  window[ID] = true;

  const CATEGORIES = [
    'Business','Education','Finance & Investing','Productivity','Technology','Artificial Intelligence','Programming',
    'Marketing','Sales','Entrepreneurship','Management','Accounting','Personal Finance','Self Improvement','Motivation',
    'Career & Jobs','Design & UX','Graphic Design','Photography','Writing & Creativity','Literature & Classics',
    'Fiction','Romance','Mystery & Thriller','Horror','Science Fiction','Fantasy','Poetry','Biography & Memoir',
    'History','Philosophy','Psychology','Society & Culture','Law','Politics & Government','Science','Mathematics',
    'Health & Wellness','Fitness & Sports','Cooking & Food','Travel','Lifestyle','Parenting & Family','Children',
    'Young Adult','Language Learning','Exam Preparation','Reference','Crafts & Hobbies','Religion & Spirituality',
    'Agriculture & Gardening','Pets & Animals','Arts & Culture','Music','Other'
  ];

  const $ = id => document.getElementById(id);
  const isPublish = () => String(location.hash || '').split('?')[0] === '#/publish';
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));

  function toast(message, type='warning') {
    try { window.Toast?.show?.(message, type); } catch (_) { console.warn(message); }
  }

  function ensureStyles() {
    if ($('bookora-publish-category-style')) return;
    const s = document.createElement('style');
    s.id = 'bookora-publish-category-style';
    s.textContent = `
      .bookora-custom-category{margin-top:10px;padding:14px 15px;border:1px solid #dbeafe;border-radius:12px;background:#f8fbff}
      .bookora-custom-category label{display:block;margin:0 0 7px;font-size:13px;font-weight:800;color:#0f172a}
      .bookora-custom-category label i{color:#ef4444;font-style:normal}
      .bookora-custom-category input{width:100%;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:10px;padding:12px 13px;font:inherit;color:#0f172a;background:#fff;outline:none}
      .bookora-custom-category input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.10)}
      .bookora-custom-category small{display:block;margin-top:6px;color:#64748b;font-size:11px;line-height:1.45}
    `;
    document.head.appendChild(s);
  }

  function install() {
    if (!isPublish()) return;
    const select = $('pub-category');
    if (!select || select.dataset.bookoraCategoryReady === '1') return;
    ensureStyles();

    const previous = String(select.value || '').trim();
    const originalWasOther = previous.toLowerCase() === 'other';
    const frag = document.createDocumentFragment();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select category';
    frag.appendChild(placeholder);
    CATEGORIES.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      frag.appendChild(option);
    });
    select.replaceChildren(frag);
    select.dataset.bookoraCategoryReady = '1';
    select.value = CATEGORIES.includes(previous) ? previous : (originalWasOther ? 'Other' : '');

    const field = document.createElement('div');
    field.className = 'bookora-custom-category';
    field.id = 'bookora-custom-category';
    field.hidden = true;
    field.innerHTML = `<label for="pub-custom-category">Custom Category <i>*</i></label><input id="pub-custom-category" type="text" maxlength="80" autocomplete="off" placeholder="Enter your own category"><small>Choose “Other” when your eBook does not fit the listed categories, then enter the category name yourself.</small>`;
    const anchor = select.closest('.field');
    if (anchor) anchor.appendChild(field);

    const input = $('pub-custom-category');
    let customOption = null;
    function syncOther() {
      const other = String(select.value || '').toLowerCase() === 'other' || select.options[select.selectedIndex]?.dataset.custom === '1';
      field.hidden = !other;
      if (other && input) input.focus({preventScroll:true});
      return other;
    }
    function syncCustomOption() {
      const text = String(input?.value || '').trim();
      if (!text) return false;
      if (!customOption) {
        customOption = document.createElement('option');
        customOption.dataset.custom = '1';
        select.appendChild(customOption);
      }
      customOption.value = text;
      customOption.textContent = `Other — ${text}`;
      select.value = text;
      return true;
    }
    function resetToOther() {
      if (customOption) customOption.remove();
      customOption = null;
      select.value = 'Other';
      field.hidden = false;
    }

    select.addEventListener('change', () => {
      if (String(select.value).toLowerCase() === 'other') syncOther();
      else { field.hidden = true; if (customOption) { customOption.remove(); customOption = null; } }
    });
    input?.addEventListener('input', () => {
      const text = String(input.value || '').trim();
      if (!text) { resetToOther(); return; }
      syncCustomOption();
    });
    if (originalWasOther) syncOther();

    // Capture the existing wizard's Continue/Submit handlers without replacing them.
    const form = $('publish-wizard-form');
    if (!form) return;
    const ensureCategory = e => {
      const current = String(select.value || '').trim();
      const other = current.toLowerCase() === 'other' || select.options[select.selectedIndex]?.dataset.custom === '1';
      if (!other) return;
      const text = String(input?.value || '').trim();
      if (!text) {
        e.preventDefault();
        e.stopImmediatePropagation();
        toast('Please enter your custom category.');
        input?.focus();
        return;
      }
      syncCustomOption();
    };
    form.addEventListener('click', e => {
      const button = e.target.closest('.v2-next, #submit-pub-btn');
      if (button) ensureCategory(e);
    }, true);
    form.addEventListener('submit', ensureCategory, true);
  }

  function watch() {
    if (!isPublish()) return;
    install();
  }
  const observer = new MutationObserver(watch);
  observer.observe(document.body, {childList:true, subtree:true});
  window.addEventListener('hashchange', () => setTimeout(watch, 0));
  setTimeout(watch, 0);
})();
