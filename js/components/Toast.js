// Toast Notification System
export const Toast = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      Object.assign(this.container.style, {
        position: 'fixed',
        top: '88px',
        right: '24px',
        bottom: 'auto',
        left: 'auto',
        zIndex: '2147483647',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '10px',
        width: 'min(420px, calc(100vw - 32px))',
        pointerEvents: 'none'
      });
      document.body.appendChild(this.container);
    }
  },

  show(message, type = 'info', duration = 3200) {
    this.init();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    Object.assign(toast.style, {
      position: 'relative',
      width: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '13px 14px',
      borderRadius: '12px',
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      boxShadow: '0 14px 40px rgba(15, 23, 42, 0.16)',
      pointerEvents: 'auto',
      opacity: '1',
      transform: 'translateY(0)',
      transition: 'opacity .25s ease, transform .25s ease'
    });

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    } else if (type === 'warning') {
      iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0 1.73 3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    } else {
      iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `
      <div style="flex-shrink:0;display:flex;align-items:center;">${iconSvg}</div>
      <div style="font-size:.875rem;font-weight:600;color:#0f172a;flex:1;line-height:1.4;">${String(message || '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]))}</div>
      <button aria-label="Close notification" style="display:flex;align-items:center;justify-content:center;color:#64748b;background:none;border:0;cursor:pointer;margin-left:4px;padding:4px;" onclick="this.parentElement.remove()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-6px)';
      setTimeout(() => toast.remove(), 260);
    }, duration);
  }
};
