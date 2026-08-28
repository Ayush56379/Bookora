/* Bookora direct Drive upload progress.
 * Shows exact uploaded MB while the browser uploads a PDF/cover directly to Drive.
 * It does not read or copy file contents.
 */
(() => {
  if (window.__BOOKORA_DIRECT_UPLOAD_PROGRESS__) return;
  window.__BOOKORA_DIRECT_UPLOAD_PROGRESS__ = true;

  const originalFetch = window.fetch.bind(window);
  const MB = 1024 * 1024;
  let box = null;

  function ensureBox(total) {
    if (!box || !box.isConnected) {
      box = document.createElement('div');
      box.id = 'bookora-direct-upload-progress';
      box.style.cssText = 'margin-top:14px;padding:14px 16px;border:1px solid #dbe4f0;border-radius:12px;background:#f8fafc;font-family:Inter,system-ui,sans-serif;';
      const host = document.querySelector('#app') || document.body;
      host.appendChild(box);
    }
    box.innerHTML = '<div style="font-weight:800;color:#0f172a;margin-bottom:7px">Uploading directly to Google Drive</div>'
      + '<div data-bookora-upload-text style="font-size:14px;color:#475569;margin-bottom:8px">0.00 MB / ' + (total / MB).toFixed(2) + ' MB · 0%</div>'
      + '<div style="height:8px;border-radius:999px;background:#e2e8f0;overflow:hidden"><div data-bookora-upload-bar style="height:100%;width:0%;background:#2563eb;transition:width .12s linear"></div></div>';
    return box;
  }

  function setProgress(loaded, total) {
    if (!total) return;
    ensureBox(total);
    const pct = Math.max(0, Math.min(100, loaded / total * 100));
    const text = box.querySelector('[data-bookora-upload-text]');
    const bar = box.querySelector('[data-bookora-upload-bar]');
    if (text) text.textContent = loaded / MB .toFixed ? '' : '';
    if (text) text.textContent = loaded / MB .toFixed(2) + ' MB / ' + (total / MB).toFixed(2) + ' MB · ' + pct.toFixed(1) + '%';
    if (bar) bar.style.width = pct.toFixed(2) + '%';
  }

  function xhrUpload(url, init) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(String(init.method || 'PUT'), url, true);
      const headers = new Headers(init.headers || {});
      headers.forEach((value, key) => {
        if (key.toLowerCase() !== 'content-type') xhr.setRequestHeader(key, value);
      });
      const body = init.body;
      const total = body?.size || Number(headers.get('Content-Length')) || 0;
      ensureBox(total);
      xhr.upload.onprogress = e => setProgress(e.loaded, e.lengthComputable ? e.total : total);
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          if (total) setProgress(total, total);
          resolve(new Response(xhr.responseText || '', { status: xhr.status, statusText: xhr.statusText, headers: xhr.getAllResponseHeaders() }));
        } else reject(new Error('Google Drive upload failed (' + xhr.status + ').'));
      };
      xhr.onerror = () => reject(new Error('Google Drive upload network error.'));
      xhr.onabort = () => reject(new Error('Upload cancelled.'));
      xhr.send(body);
    });
  }

  window.fetch = function(input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url || '';
    const method = String(init.method || (typeof input !== 'string' ? input?.method : 'GET') || 'GET').toUpperCase();
    if (method === 'PUT' && /googleapis\.com|googleusercontent\.com/i.test(url) && init.body instanceof Blob) {
      return xhrUpload(url, init);
    }
    return originalFetch(input, init);
  };
})();
