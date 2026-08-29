/* Bookora Publish Side Illustrations v1 */
(() => {
  if (window.__BOOKORA_PUBLISH_SIDE_ILLUSTRATIONS_V1__) return;
  window.__BOOKORA_PUBLISH_SIDE_ILLUSTRATIONS_V1__ = true;

  const css = `
    .bookora-publish-visual-layout{width:min(1440px,calc(100% - 32px));margin:34px auto 70px;display:grid;grid-template-columns:minmax(150px,220px) minmax(0,760px) minmax(150px,220px);gap:28px;align-items:center}
    .bookora-publish-visual-layout>.bookora-publish-side{grid-row:1}
    .bookora-publish-visual-layout>.bookora-publish-form-host{grid-row:1;min-width:0}
    .bookora-publish-side{min-height:360px;display:flex;align-items:center;justify-content:center;pointer-events:none}
    .bookora-publish-art{position:relative;width:100%;max-width:210px;min-height:330px;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:28px;background:radial-gradient(circle at 50% 40%,rgba(111,91,255,.14),rgba(255,255,255,0) 68%)}
    .bookora-publish-art svg{width:100%;height:auto;overflow:visible;filter:drop-shadow(0 18px 24px rgba(49,46,129,.12))}
    .bookora-book-float{animation:bookoraFloat 4.8s ease-in-out infinite;transform-origin:center}
    .bookora-book-float-delay{animation:bookoraFloat 5.6s ease-in-out .5s infinite;transform-origin:center}
    .bookora-spark{animation:bookoraSpark 2.8s ease-in-out infinite}
    .bookora-spark:nth-child(2){animation-delay:.7s}.bookora-spark:nth-child(3){animation-delay:1.3s}
    .bookora-publish-side.left .bookora-art{animation:bookoraSideIn .8s ease both}
    .bookora-publish-side.right .bookora-art{animation:bookoraSideInRight .8s ease both}
    .bookora-publish-side-caption{position:absolute;bottom:20px;left:50%;transform:translateX(-50%);white-space:nowrap;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.88);box-shadow:0 8px 25px rgba(30,41,59,.08);font:600 11px/1.1 Inter,system-ui,sans-serif;color:#26345d;border:1px solid rgba(99,102,241,.12)}
    @keyframes bookoraFloat{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-12px) rotate(1deg)}}
    @keyframes bookoraSpark{0%,100%{opacity:.25;transform:scale(.7)}50%{opacity:1;transform:scale(1.15)}}
    @keyframes bookoraSideIn{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:translateX(0)}}
    @keyframes bookoraSideInRight{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:translateX(0)}}
    @media (prefers-reduced-motion:reduce){.bookora-book-float,.bookora-book-float-delay,.bookora-spark,.bookora-publish-side.left .bookora-art,.bookora-publish-side.right .bookora-art{animation:none!important}}
    @media (max-width:1100px){.bookora-publish-visual-layout{grid-template-columns:110px minmax(0,760px) 110px;gap:12px;width:calc(100% - 20px)}.bookora-publish-side{min-height:300px}.bookora-art{max-width:120px;min-height:260px}.bookora-publish-side-caption{font-size:10px;padding:7px 9px}}
    @media (max-width:800px){.bookora-publish-visual-layout{display:block;width:min(680px,calc(100% - 24px));margin:18px auto 48px}.bookora-publish-side{display:none}.bookora-publish-form-host{width:100%}.bookora-publish-form-host form{width:100%}}
    @media (min-width:801px){.bookora-publish-form-host{width:100%}}
  `;

  const style = document.createElement('style');
  style.id = 'bookora-publish-side-illustrations-css';
  style.textContent = css;
  document.head.appendChild(style);

  const palettes = [
    {left:'info',right:'ideas',caption:'Shape your story'},
    {left:'cover',right:'pdf',caption:'Upload your eBook'},
    {left:'price',right:'rights',caption:'Set your terms'},
    {left:'preview',right:'publish',caption:'Ready to publish'},
    {left:'success',right:'review',caption:'Sent for review'}
  ];

  const art = (kind, side) => {
    const label = kind==='info'?'BOOK':kind==='cover'?'COVER':kind==='pdf'?'PDF':kind==='price'?'₹':kind==='rights'?'✓':kind==='preview'?'PREVIEW':kind==='publish'?'★':kind==='success'?'✓':'AI';
    const secondary = kind==='pdf'?'PDF FILE':kind==='cover'?'YOUR COVER':kind==='price'?'FAIR PRICE':kind==='rights'?'RIGHTS OK':kind==='preview'?'READY':kind==='publish'?'SUBMIT':'BOOKORA';
    return `<div class="bookora-art" data-kind="${kind}" aria-hidden="true">
      <svg viewBox="0 0 220 340" role="presentation">
        <defs>
          <linearGradient id="bgrad-${kind}-${side}" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#635BFF"/><stop offset="1" stop-color="#3B82F6"/></linearGradient>
          <linearGradient id="pgrad-${kind}-${side}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#EEF2FF"/></linearGradient>
        </defs>
        <ellipse cx="110" cy="292" rx="76" ry="16" fill="#6D5EF6" opacity=".12"/>
        <g class="bookora-spark"><path d="M35 75l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#8B5CF6"/></g>
        <g class="bookora-spark"><path d="M184 105l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#60A5FA"/></g>
        <g class="bookora-spark"><circle cx="54" cy="160" r="4" fill="#A78BFA"/></g>
        <g class="bookora-book-float">
          <rect x="55" y="95" width="110" height="154" rx="10" fill="url(#bgrad-${kind}-${side})" transform="rotate(-7 110 170)"/>
          <rect x="64" y="105" width="92" height="132" rx="7" fill="url(#pgrad-${kind}-${side})" transform="rotate(-7 110 170)" opacity=".97"/>
          <rect x="72" y="118" width="76" height="92" rx="6" fill="url(#bgrad-${kind}-${side})" transform="rotate(-7 110 170)"/>
          <text x="110" y="151" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="13" font-weight="800" fill="#fff" transform="rotate(-7 110 170)">${label}</text>
          <text x="110" y="174" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="8" font-weight="700" fill="#E0E7FF" transform="rotate(-7 110 170)">${secondary}</text>
          <path d="M79 218h62" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round" transform="rotate(-7 110 170)"/>
          <path d="M83 226h45" stroke="#CBD5E1" stroke-width="3" stroke-linecap="round" transform="rotate(-7 110 170)"/>
        </g>
        <g class="bookora-book-float-delay">
          <rect x="48" y="240" width="125" height="16" rx="8" fill="#4338CA" opacity=".25"/>
          <rect x="59" y="255" width="103" height="12" rx="6" fill="#60A5FA" opacity=".45"/>
        </g>
        ${kind==='pdf'||kind==='publish'?'<g transform="translate(138 214)"><circle cx="22" cy="22" r="20" fill="#10B981"/><path d="M12 22l7 7 13-15" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>':''}
      </svg>
      <span class="bookora-publish-side-caption">${kind==='info'?'Book information':kind==='cover'?'Cover & files':kind==='pdf'?'Secure upload':kind==='price'?'Pricing':kind==='rights'?'Rights':kind==='preview'?'Preview':kind==='publish'?'Submit':'Bookora'}</span>
    </div>`;
  };

  function currentStep(){
    for(let i=1;i<=5;i++){
      const el=document.getElementById(`step-${i}`);
      if(el && getComputedStyle(el).display!=='none') return i;
    }
    return 1;
  }

  function render(){
    const form = document.getElementById('publish-wizard-form');
    if(!form) return false;
    if(form.closest('.bookora-publish-visual-layout')) return true;
    const host=form.parentElement;
    if(!host) return false;
    const layout=document.createElement('div');
    layout.className='bookora-publish-visual-layout';
    const left=document.createElement('aside'); left.className='bookora-publish-side left';
    const center=document.createElement('div'); center.className='bookora-publish-form-host';
    const right=document.createElement('aside'); right.className='bookora-publish-side right';
    center.appendChild(form);
    layout.append(left,center,right);
    host.appendChild(layout);
    update();
    return true;
  }

  function update(){
    const layout=document.querySelector('.bookora-publish-visual-layout');
    if(!layout) return;
    const step=Math.min(5,currentStep());
    const p=palettes[step-1];
    const left=layout.querySelector('.bookora-publish-side.left');
    const right=layout.querySelector('.bookora-publish-side.right');
    if(left) left.innerHTML=art(p.left,'left');
    if(right) right.innerHTML=art(p.right,'right');
  }

  const boot=()=>{if(render()) update(); else setTimeout(boot,250)};
  boot();
  window.addEventListener('bookora:publish-step-changed',update);
  document.addEventListener('click',e=>{if(e.target?.closest?.('#publish-wizard-form button[data-next],#publish-wizard-form button[data-prev],#publish-wizard-form .next-step-btn'))setTimeout(update,80)},true);
  new MutationObserver(()=>{if(!document.querySelector('.bookora-publish-visual-layout'))render(); update()}).observe(document.documentElement,{childList:true,subtree:true});
})();
