// BOOKORA LIVE UPLOAD PROGRESS + STEP 5 SPACING
(() => {
  const MB = 1024 * 1024;
  const sessions = new Map();
  const totals = { pdf: 0, cover: 0 };
  const completed = { pdf: 0, cover: 0 };
  let lastPercent = -1;

  const isPublish = () => {
    const r = (window.location.hash || '').split('?')[0];
    return r === '#/publish' || r === '#/publish/';
  };

  function ensureUI() {
    const step = document.getElementById('step-5');
    if (!step) return null;
    let box = document.getElementById('bookora-live-upload-progress');
    if (!box) {
      box = document.createElement('div');
      box.id = 'bookora-live-upload-progress';
      box.style.cssText = 'display:none;margin:1.25rem 0 1.5rem;padding:1rem 1.1rem;border:1px solid #dbe4f0;border-radius:14px;background:#f8fafc;box-sizing:border-box;width:100%;overflow:hidden;';
      box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;"><strong id="bookora-upload-progress-title" style="font-size:.95rem;color:#0f172a;">Upload progress</strong><strong id="bookora-upload-progress-percent" style="font-size:.95rem;color:#2563eb;">0%</strong></div><div style="height:10px;width:100%;background:#e2e8f0;border-radius:999px;overflow:hidden;"><div id="bookora-upload-progress-fill" style="height:100%;width:0%;border-radius:999px;background:#2563eb;transition:width .2s ease;"></div></div><div id="bookora-upload-progress-bytes" style="margin-top:8px;font-size:.84rem;color:#64748b;line-height:1.45;">0 MB / 0 MB uploaded</div>';
      const submit = document.getElementById('submit-pub-btn');
      const actions = submit?.closest('div');
      if (actions && actions.parentElement === step) step.insertBefore(box, actions);
      else step.appendChild(box);
    }

    const submit = document.getElementById('submit-pub-btn');
    const back = step.querySelector('.prev-step-btn');
    const actions = submit?.closest('div');
    if (actions) {
      actions.style.display = 'flex';
      actions.style.flexWrap = 'wrap';
      actions.style.justifyContent = 'space-between';
      actions.style.alignItems = 'center';
      actions.style.gap = '16px';
      actions.style.marginTop = '20px';
      actions.style.paddingTop = '4px';
      actions.style.width = '100%';
      actions.style.boxSizing = 'border-box';
    }
    [back, submit].forEach(button => {
      if (!button) return;
      button.style.margin = '0';
      button.style.boxSizing = 'border-box';
      button.style.minHeight = '48px';
      button.style.flexShrink = '0';
    });
    if (submit) submit.style.marginLeft = 'auto';
    return box;
  }

  function setProgress(title, percent, uploaded, total) {
    const box = ensureUI();
    if (!box) return;
    const p = Math.max(0, Math.min(100, Math.round(percent)));
    box.style.display = 'block';
    const titleEl = document.getElementById('bookora-upload-progress-title');
    const percentEl = document.getElementById('bookora-upload-progress-percent');
    const fill = document.getElementById('bookora-upload-progress-fill');
    const bytes = document.getElementById('bookora-upload-progress-bytes');
    if (titleEl) titleEl.textContent = title || 'Upload progress';
    if (percentEl) percentEl.textContent = `${p}%`;
    if (fill) fill.style.width = `${p}%`;
    if (bytes) bytes.textContent = `${(Math.max(0, uploaded) / MB).toFixed(2)} MB / ${(Math.max(0, total) / MB).toFixed(2)} MB uploaded`;
    lastPercent = p;
  }

  function parseBody(body) {
    if (typeof body !== 'string') return null;
    try { return JSON.parse(body); } catch (_) { return null; }
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : input?.url || '';
    const body = init?.body;
    let path = url;
    try { path = new URL(url, location.href).pathname; } catch (_) {}

    if (!isPublish() || !path.includes('/api/books/upload-session/')) return originalFetch(input, init);

    const payload = parseBody(body);
    const result = await originalFetch(input, init);

    try {
      if (path.endsWith('/start') && payload?.kind && Number(payload.size) > 0) {
        const data = await result.clone().json().catch(() => ({}));
        const token = String(data.upload_token || '').trim();
        if (token) {
          const kind = String(payload.kind).toLowerCase() === 'cover' ? 'cover' : 'pdf';
          sessions.set(token, { kind, size: Number(payload.size), completed: Number(data.next_offset) || 0 });
          totals[kind] = Number(payload.size);
          completed[kind] = Number(data.next_offset) || 0;
          render();
        }
      } else if (path.endsWith('/chunk') && payload?.upload_token) {
        const session = sessions.get(String(payload.upload_token));
        if (session) {
          const data = await result.clone().json().catch(() => ({}));
          const next = Number(data.next_offset);
          if (result.ok && Number.isFinite(next)) {
            session.completed = Math.max(session.completed, Math.min(session.size, next));
            completed[session.kind] = session.completed;
            render();
          }
        }
      } else if (path.endsWith('/status') && payload?.upload_token) {
        const session = sessions.get(String(payload.upload_token));
        if (session) {
          const data = await result.clone().json().catch(() => ({}));
          if (data.done) {
            session.completed = session.size;
            completed[session.kind] = session.size;
            render();
          }
        }
      }
    } catch (error) { console.warn('[Bookora upload progress]', error); }
    return result;
  };

  function render() {
    const total = totals.pdf + totals.cover;
    if (!total) return;
    const uploaded = Math.min(totals.pdf, completed.pdf) + Math.min(totals.cover, completed.cover);
    const percent = uploaded / total * 100;
    const title = completed.pdf < totals.pdf ? 'Uploading PDF to Drive...' : completed.cover < totals.cover ? 'Uploading cover to Drive...' : 'Files uploaded ✓';
    setProgress(title, percent, uploaded, total);
  }

  function watch() {
    ensureUI();
    const observer = new MutationObserver(() => {
      ensureUI();
      const button = document.getElementById('submit-pub-btn');
      const text = button?.textContent || '';
      if (/Uploading PDF|Uploading cover/i.test(text) && totals.pdf + totals.cover > 0 && lastPercent < 0) {
        setProgress(text, 0, 0, totals.pdf + totals.cover);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    window.addEventListener('hashchange', () => setTimeout(ensureUI, 50));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch, { once: true });
  else watch();
})();
