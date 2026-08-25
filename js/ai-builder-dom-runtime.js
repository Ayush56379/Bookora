(()=>{
 if(window.__BOOKORA_AI_DOM_RUNTIME__)return;window.__BOOKORA_AI_DOM_RUNTIME__=true;
 const API=String(window.BOOKORA_API_URL||'').replace(/\/$/,'');
 const safeHtml=h=>{const t=document.createElement('template');t.innerHTML=String(h||'');if(t.content.querySelector('script,iframe,object,embed,form,input,link,meta,style'))return '';for(const el of t.content.querySelectorAll('*'))for(const a of [...el.attributes])if(/^on/i.test(a.name)||/^javascript:/i.test(a.value)||/^https?:\/\//i.test(a.value))return '';return t.innerHTML};
 const applyOps=ops=>{for(const op of Array.isArray(ops)?ops:[]){try{const selector=String(op.selector||'');let els;try{els=document.querySelectorAll(selector)}catch{continue}if(!els.length)continue;els.forEach(el=>{if(op.type==='add_class')el.classList.add(String(op.className||''));else if(op.type==='remove_class')el.classList.remove(String(op.className||''));else if(op.type==='set_attr'&&(op.name==='title'||op.name==='aria-label'||String(op.name||'').startsWith('data-')))el.setAttribute(op.name,String(op.value||''));else if(op.type==='set_text')el.textContent=String(op.text||'');else if(op.type==='insert_html'){const html=safeHtml(op.html);if(html)el.insertAdjacentHTML(op.position,html)}})}catch(e){console.warn('[Bookora AI DOM]',e)}}};
 const nodeInventory=(root,limit=1200)=>{const nodes=[...root.querySelectorAll('body *')].slice(0,limit);return nodes.map((e,i)=>{const r=e.getBoundingClientRect();return({i,tag:e.tagName.toLowerCase(),id:e.id||'',classes:[...e.classList].slice(0,10),role:e.getAttribute('role')||'',text:(e.textContent||'').trim().replace(/\s+/g,' ').slice(0,180),selector:e.id?'#'+CSS.escape(e.id):e.tagName.toLowerCase()+(e.classList.length?'.'+[...e.classList].slice(0,2).map(CSS.escape).join('.'):''),rect:{w:Math.round(r.width),h:Math.round(r.height)},visible:r.width>0&&r.height>0})}).filter(x=>x.id||x.classes.length||x.role||x.text)};
 const inventory=()=>nodeInventory(document,1000);
 const sitePrompt=prompt=>{const p=String(prompt||'').toLowerCase();return /footer|header|navbar|navigation|menu|homepage|home page|website|site-wide|global|all pages|public page|book page|product page|explore|library|profile|login|signup|icon|badge|button|card|link|responsive|mobile|desktop|design|layout|style|add|remove|change|improve/.test(p)};
 let siteFrame=null,siteFramePromise=null;
 const publicSiteInventory=async(prompt)=>{if(!sitePrompt(prompt))return [];
   try{
     if(siteFrame?.contentDocument?.body?.children?.length)return nodeInventory(siteFrame.contentDocument,1400);
     if(!siteFramePromise){
       siteFramePromise=new Promise(resolve=>{
         const frame=document.createElement('iframe');siteFrame=frame;frame.setAttribute('aria-hidden','true');frame.dataset.bookoraAiSitePreview='1';frame.style.cssText='position:fixed;left:-12000px;top:-12000px;width:1440px;height:1800px;opacity:0;pointer-events:none;border:0;z-index:-1';
         const base=location.origin+location.pathname.replace(/\/[^/]*$/,'/');
         frame.src=(base||location.origin+'/Bookora/')+'#/';
         let done=false;const finish=()=>{if(done)return;done=true;resolve(frame)};
         frame.addEventListener('load',()=>{let tries=0;const poll=()=>{tries++;const doc=frame.contentDocument;const ready=doc?.body&&(doc.body.children.length>1||doc.querySelector('#main-content,footer,header,[role="main"]'));if(ready||tries>=30)return finish();setTimeout(poll,250)};poll()},{once:true});
         document.body.appendChild(frame);setTimeout(finish,9000);
       });
     }
     const frame=await siteFramePromise;await new Promise(r=>setTimeout(r,400));const doc=frame?.contentDocument;if(!doc?.body)return [];
     return nodeInventory(doc,1400);
   }catch(e){console.warn('[Bookora AI] public site inventory unavailable',e);return []}
 };
 const originalFetch=window.fetch.bind(window);
 window.fetch=async(input,init)=>{let url=typeof input==='string'?input:(input&&input.url)||'';if(!url.includes('/api/admin/ai-builder/prompts')||!init?.body)return originalFetch(input,init);try{const body=JSON.parse(init.body);if(body.action==='run'){const prompt=String(body.prompt||'');const current=inventory();const publicNodes=await publicSiteInventory(prompt);if(publicNodes.length){body.domInventory=[...publicNodes.map(x=>({...x,source:'public-site'})),...current.map(x=>({...x,source:'admin-control-panel'}))];body.pageContext='#/';body.targetContext='public-site';body.sitePreviewAvailable=true}else{body.domInventory=current;body.pageContext=location.hash||location.pathname;body.targetContext='current-page';body.sitePreviewAvailable=false}init={...init,body:JSON.stringify(body)}}}catch(e){console.warn('[Bookora AI] request context enrichment skipped',e)}const response=await originalFetch(input,init);try{const data=await response.clone().json();if(data?.job?.status==='success'){applyOps(data.job.domOps||[]);await refreshActive()}}catch{}return response};
 async function refreshActive(){try{const r=await originalFetch(API+'/api/ai/active-patches',{cache:'no-store'});if(!r.ok)return;const j=await r.json();document.querySelectorAll('style[data-bookora-ai-patch]').forEach(x=>x.remove());for(const p of j.patches||[]){if(p.cssPatch){const st=document.createElement('style');st.dataset.bookoraAiPatch=p.jobId;st.textContent=String(p.cssPatch||'');document.head.appendChild(st)}applyOps(p.domOps||[])}}catch(e){console.warn('[Bookora AI] active patch refresh failed',e)}}
 const obs=new MutationObserver(()=>{if(location.hash.startsWith('#/admin/settings'))setTimeout(refreshActive,150)});obs.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('hashchange',()=>setTimeout(refreshActive,300));setTimeout(refreshActive,1200);
})();
