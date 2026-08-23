(() => {
  const add = () => {
    if (document.getElementById('bookora-review-support-entry')) return;
    if ((location.hash || '#/').split('?')[0] === '#/review-support') return;
    const b = document.createElement('a');
    b.id = 'bookora-review-support-entry';
    b.href = '#/review-support';
    b.innerHTML = '<span aria-hidden="true">★</span><span>Review & Support</span>';
    Object.assign(b.style,{position:'fixed',right:'18px',bottom:'18px',zIndex:'45',display:'flex',alignItems:'center',gap:'7px',padding:'11px 15px',borderRadius:'999px',background:'#2563eb',color:'#fff',font:'700 13px Inter,system-ui,sans-serif',textDecoration:'none',boxShadow:'0 10px 28px rgba(37,99,235,.28)'});
    document.body.appendChild(b);
  };
  const refresh=()=>{const b=document.getElementById('bookora-review-support-entry');const isPage=(location.hash||'').split('?')[0]==='#/review-support';if(isPage){b?.remove();}else add();};
  window.addEventListener('hashchange',refresh);
  new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true});
  setTimeout(refresh,1000);
})();
