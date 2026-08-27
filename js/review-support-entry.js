(() => {
  let aiOpening = false;

  const openBookoraAI = async () => {
    if (aiOpening) return;
    aiOpening = true;
    try {
      let trigger = document.getElementById('bookora-ai-trigger-btn');
      if (!trigger) {
        const mod = await import('./components/BookoraAIEnhanced.js');
        const ai = mod?.BookoraAI;
        if (ai?.init) ai.init();
        trigger = document.getElementById('bookora-ai-trigger-btn');
        if (trigger) {
          ai?.open?.();
          return;
        }
      }
      if (trigger) trigger.click();
      else console.warn('[Bookora Support] Bookora AI could not be initialized.');
    } catch (error) {
      console.warn('[Bookora Support] AI assistant failed to open.', error);
    } finally {
      aiOpening = false;
    }
  };

  const isSupportPage = () => (location.hash || '').split('?')[0] === '#/review-support';

  const add = () => {
    if (isSupportPage() || document.getElementById('bookora-review-support-entry')) return;
    const b = document.createElement('button');
    b.id = 'bookora-review-support-entry';
    b.type = 'button';
    b.innerHTML = '<span>AI Bookora Support</span>';
    Object.assign(b.style, {
      position:'fixed', right:'18px', bottom:'18px', zIndex:'45', display:'flex',
      alignItems:'center', justifyContent:'center', padding:'11px 15px',
      borderRadius:'999px', border:'0', background:'#2563eb', color:'#fff',
      font:'700 13px Inter,system-ui,sans-serif', textDecoration:'none',
      boxShadow:'0 10px 28px rgba(37,99,235,.28)', whiteSpace:'nowrap', cursor:'pointer'
    });
    b.addEventListener('click', openBookoraAI);
    document.body.appendChild(b);
  };

  const installHeroAnimation = () => {
    if (document.getElementById('bookora-home-device-animation')) return;
    const style = document.createElement('style');
    style.id = 'bookora-home-device-animation';
    style.textContent = `
      .home-hero-art .home-art-device{
        animation:bookoraDeviceFloat 4.8s ease-in-out infinite;
        transform-origin:center center;
        will-change:transform;
      }
      @keyframes bookoraDeviceFloat{
        0%,100%{transform:translate3d(0,0,0) rotate(7deg)}
        50%{transform:translate3d(0,-10px,0) rotate(7deg)}
      }
      @media (prefers-reduced-motion:reduce){.home-hero-art .home-art-device{animation:none!important}}
    `;
    document.head.appendChild(style);
  };

  const refresh = () => {
    const b = document.getElementById('bookora-review-support-entry');
    if (isSupportPage()) b?.remove();
    else add();
    installHeroAnimation();
  };

  window.addEventListener('hashchange', refresh);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refresh, { once:true });
  } else {
    refresh();
  }
})();
