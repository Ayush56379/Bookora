(() => {
  const add = () => {
    if (document.getElementById('bookora-review-support-entry')) return;
    if ((location.hash || '#/').split('?')[0] === '#/review-support') return;
    const b = document.createElement('button');
    b.id = 'bookora-review-support-entry';
    b.type = 'button';
    b.innerHTML = '<span>AI Bookora Support</span>';
    Object.assign(b.style,{position:'fixed',right:'18px',bottom:'18px',zIndex:'45',display:'flex',alignItems:'center',justifyContent:'center',padding:'11px 15px',borderRadius:'999px',border:'0',background:'#2563eb',color:'#fff',font:'700 13px Inter,system-ui,sans-serif',textDecoration:'none',boxShadow:'0 10px 28px rgba(37,99,235,.28)',whiteSpace:'nowrap',cursor:'pointer'});
    b.addEventListener('click', () => {
      // Reuse the existing Bookora AI assistant. Do not navigate away or open
      // a separate support page; the existing drawer handles the help chat.
      const trigger = document.getElementById('bookora-ai-trigger-btn');
      if (trigger) {
        trigger.click();
        return;
      }
      // If the AI root is still mounting, give it a short chance to appear.
      let tries = 0;
      const timer = setInterval(() => {
        const aiTrigger = document.getElementById('bookora-ai-trigger-btn');
        if (aiTrigger) {
          clearInterval(timer);
          aiTrigger.click();
        } else if (++tries >= 20) {
          clearInterval(timer);
          console.warn('[Bookora Support] AI assistant is not ready yet.');
        }
      }, 100);
    });
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

  const refresh=()=>{
    const b=document.getElementById('bookora-review-support-entry');
    const isPage=(location.hash||'').split('?')[0]==='#/review-support';
    if(isPage){b?.remove();}
    else add();
    installHeroAnimation();
  };
  window.addEventListener('hashchange',refresh);
  new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',refresh,{once:true});
  else refresh();
})();