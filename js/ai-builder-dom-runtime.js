(()=>{
 if(window.__BOOKORA_AI_DOM_RUNTIME__)return;window.__BOOKORA_AI_DOM_RUNTIME__=true;
 const API=String(window.BOOKORA_API_URL||'').replace(/\/$/,'');
 const safeHtml=h=>{const t=document.createElement('template');t.innerHTML=String(h||'');if(t.content.querySelector('script,iframe,object,embed,form,input,link,meta'))return '';for(const el of t.content.querySelectorAll('*')){for(const a of [...el.attributes]){if(/^on/i.test(a.name)||/^javascript:/i.test(a.value)||/^https?:\/\//i.test(a.value))return ''}}return t.innerHTML};
 const validSelector=s=>{try{document.querySelector(s);return true}catch{return false}};
 const applyOps=ops=>{for(const op of Array.isArray(ops)?ops:[]){try{const els=document.querySelectorAll(String(op.selector||''));if(!els.length||!validSelector(String(op.selector||'')))continue;els.forEach(el=>{if(op.type==='add_class')el.classList.add(String(op.className||''));else if(op.type==='remove_class')el.classList.remove(String(op.className||''));else if(op.type==='set_attr'&&(op.name==='title'||op.name==='aria-label'||String(op.name||'').startsWith('data-')))el.setAttribute(op.name,String(op.value||''));else if(op.type==='set_text')el.textContent=String(op.text||'');else if(op.type==='insert_html'){const html=safeHtml(op.html);if(!html)return;el.insertAdjacentHTML(op.position,html)}})}catch(e){console.warn('[Bookora AI DOM]',e)}}};
 const inventory=()=>{const nodes=[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0}).slice(0,350);return nodes.map((e,i)=>{let selector='';if(e.id)selector='#'+CSS.escape(e.id);else{const parts=[];let n=e;for(let d=0;d<3&&n&&n.nodeType===1;d++,n=n.parentElement){let p=n.tagName.toLowerCase();if(n.classList.length)p+='.'+[...n.classList].slice(0,2).map(CSS.escape).join('.');parts.unshift(p)}selector=parts.join(' > ')}return {i,tag:e.tagName.toLowerCase(),id:e.id||'',classes:[...e.classList].slice(0,5),text:(e.textContent||'').trim().replace(/\s+/g,' ').slice(0,120),selector,rect:{w:Math.round(e.getBoundingClientRect().width),h:Math.round(e.getBoundingClientRect().height)}}})};
 const originalFetch=window.fetch.bind(window);
 window.fetch=async(input,init)=>{
  let url=typeof input==='string'?input:(input&&input.url)||'';
  if(!url.includes('/api/admin/ai-builder/prompts')||!init?.body)return originalFetch(input,init);
  try{const body=JSON.parse(init.body);if(body.action==='run'){body.domInventory=inventory();body.pageContext=location.hash||location.pathname;init={...init,body:JSON.stringify(body)}}}catch{}
  const response=await originalFetch(input,init);
  try{const clone=response.clone();const data=await clone.json();if(data?.job?.status==='success'){applyOps(data.job.domOps||[]);await refreshActive()}}catch{}
  return response;
 };
 async function refreshActive(){try{const r=await originalFetch(API+'/api/ai/active-patches',{cache:'no-store'});const j=await r.json();document.querySelectorAll('style[data-bookora-ai-patch]').forEach(x=>x.remove());for(const p of j.patches||[]){const st=document.createElement('style');st.dataset.bookoraAiPatch=p.jobId;st.textContent=String(p.cssPatch||'');document.head.appendChild(st);applyOps(p.domOps||[])}}catch(e){console.warn('[Bookora AI] active patch refresh failed',e)}}
 const obs=new MutationObserver(()=>{if(location.hash.startsWith('#/admin/settings'))setTimeout(refreshActive,150)});obs.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('hashchange',()=>setTimeout(refreshActive,300));setTimeout(refreshActive,1200);
})();
