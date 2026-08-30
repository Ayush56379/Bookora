/* Bookora Publish Wizard — DOM enhancement layer */
(() => {
  'use strict';
  const STEPS = [
    ['1','Book Information'],
    ['2','Cover & Files'],
    ['3','Pricing'],
    ['4','Preview'],
    ['5','Submit']
  ];

  function getForm(){ return document.getElementById('publish-wizard-form'); }

  function blankFields(form){
    if(form.dataset.bookoraBlanked === '1') return;
    ['pub-title','pub-subtitle','pub-author','pub-description','pub-tags','pub-pages','pub-price','pub-saleprice'].forEach(id => {
      const el = document.getElementById(id);
      if(el && el.value) el.value = '';
    });
    const category = document.getElementById('pub-category');
    if(category) category.value = '';
    form.dataset.bookoraBlanked = '1';
  }

  function buildHeader(form){
    if(document.getElementById('publish-wizard-header')) return;
    const card = form.closest('div[style*="border:1px solid var(--border-subtle)"]') || form.parentElement;
    if(!card) return;
    card.id = 'publish-wizard-card';
    const shell = card.parentElement;
    if(shell && shell.id !== 'publish-wizard-shell'){
      shell.id = 'publish-wizard-shell';
    }
    const header = document.createElement('div');
    header.id = 'publish-wizard-header';
    header.innerHTML = `
      <div class="publish-wizard-kicker">Publish eBook</div>
      <h1 class="publish-wizard-title">Publish your eBook</h1>
      <p class="publish-wizard-subtitle">Complete all 5 steps. Your information will only be used when you submit the eBook.</p>
      <div class="publish-wizard-progress" role="list" aria-label="eBook publishing steps">
        ${STEPS.map(([n,label]) => `<div class="publish-wizard-progress-item is-locked" data-step="${n}" role="listitem"><span class="pwi-number">${n}</span><span class="pwi-label">${label}</span></div>`).join('')}
      </div>
      <div class="publish-wizard-status"><span>Current step: <strong id="publish-wizard-current-label">Book Information</strong></span><span><strong id="publish-wizard-current-number">1</strong> of 5</span></div>
    `;
    card.insertBefore(header, form);
  }

  function currentStep(form){
    for(let i=1;i<=5;i++){
      const section=document.getElementById(`step-${i}`);
      if(section && getComputedStyle(section).display !== 'none') return i;
    }
    return 1;
  }

  function updateProgress(form){
    const n=currentStep(form);
    const items=form.parentElement?.querySelectorAll('.publish-wizard-progress-item') || [];
    items.forEach(item=>{
      const s=Number(item.dataset.step);
      item.classList.toggle('is-active',s===n);
      item.classList.toggle('is-complete',s<n);
      item.classList.toggle('is-locked',s>n);
      item.setAttribute('aria-current',s===n?'step':'false');
    });
    const label=STEPS[n-1]?.[1] || 'Book Information';
    const l=document.getElementById('publish-wizard-current-label');
    const num=document.getElementById('publish-wizard-current-number');
    if(l) l.textContent=label;
    if(num) num.textContent=String(n);
    const active=document.querySelector(`.publish-wizard-progress-item[data-step="${n}"]`);
    active?.scrollIntoView({block:'nearest',inline:'center'});
  }

  function improveMarkup(form){
    form.querySelectorAll('.wizard-section').forEach(section=>{
      section.querySelectorAll(':scope > div').forEach(div=>{
        const text=(div.textContent||'').trim();
        if((div.querySelector('.prev-step-btn') || div.querySelector('.next-step-btn') || div.querySelector('#submit-pub-btn')) && !div.classList.contains('publish-action-row')){
          div.classList.add('publish-action-row');
          const buttons=[...div.querySelectorAll('.prev-step-btn,.next-step-btn,#submit-pub-btn')];
          if(buttons.length){
            const group=document.createElement('div');
            buttons.forEach(b=>group.appendChild(b));
            div.appendChild(group);
          }
        }
      });
    });

    const pdfBox=document.getElementById('pub-pdf')?.closest('div[style*="dashed"]');
    const coverBox=document.getElementById('pub-cover')?.closest('div[style*="dashed"]');
    [pdfBox,coverBox].forEach(box=>{
      if(box && !box.classList.contains('publish-upload-card')){
        box.classList.add('publish-upload-card');
        const icon=box.querySelector('div[style*="font-size:38px"]');
        if(icon) icon.classList.add('publish-upload-icon');
      }
    });
  }

  function wire(form){
    if(form.dataset.bookoraWired==='1') return;
    form.dataset.bookoraWired='1';
    form.addEventListener('click',()=>setTimeout(()=>updateProgress(form),40),true);
    form.addEventListener('input',()=>updateProgress(form),true);
    window.addEventListener('hashchange',()=>setTimeout(()=>updateProgress(form),80));
  }

  function enhance(){
    const form=getForm();
    if(!form) return false;
    blankFields(form);
    buildHeader(form);
    improveMarkup(form);
    wire(form);
    updateProgress(form);
    return true;
  }

  const observer=new MutationObserver(()=>{ if(getForm()) enhance(); });
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',enhance,{once:true});
  setTimeout(enhance,150);
  setTimeout(enhance,700);
  setTimeout(enhance,1600);
})();
