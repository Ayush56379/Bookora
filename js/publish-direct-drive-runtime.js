/* Bookora Publish Direct Upload Runtime v3 */
(() => {
  if (window.__BOOKORA_DIRECT_DRIVE_PUBLISH_V3__) return;
  window.__BOOKORA_DIRECT_DRIVE_PUBLISH_V3__ = true;

  const API = 'https://bookora-backend-x08l.onrender.com';
  const MAX_COVER_MB = 5;
  const installed = new WeakSet();
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const value = (id, fallback='') => document.getElementById(id)?.value?.trim() || fallback;
  const number = (id, fallback=0) => { const n=Number(document.getElementById(id)?.value); return Number.isFinite(n)?n:fallback; };
  const esc = v => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');

  function setProgress(text, percent=null, detail='') {
    const button=document.getElementById('submit-pub-btn');
    const box=document.getElementById('upload-progress-box');
    const label=document.getElementById('upload-progress-label');
    const fill=document.getElementById('upload-progress-fill');
    if(box) box.style.display='block';
    if(button) button.textContent=text;
    if(label) label.innerHTML=`<strong>${esc(text)}</strong>${detail?`<span style="display:block;color:#64748b;font-size:.8rem;margin-top:4px;">${esc(detail)}</span>`:''}`;
    if(fill && Number.isFinite(percent)) fill.style.width=`${Math.max(0,Math.min(100,percent))}%`;
  }

  function cleanSubmitStep() {
    const section=document.getElementById('step-5');
    if(!section) return;
    const paragraphs=section.querySelectorAll('p');
    paragraphs.forEach(p=>{
      if(/resumable|chunk|Render|Drive|Firebase|upload(ed)? in small|server restart/i.test(p.textContent||'')) {
        p.textContent='Everything is ready. Submit your eBook to send it for review. You can check the full book information in the Preview step before submitting.';
      }
    });
    const old=section.querySelector('#publish-review-details');
    if(old) old.remove();
  }

  async function getToken(force=false) {
    const auth=window.firebase?.auth?.();
    if(!auth) throw new Error('Sign-in is still loading. Please try again in a moment.');
    let user=auth.currentUser;
    if(!user) user=await new Promise(resolve=>{let done=false,unsub=null;const finish=u=>{if(done)return;done=true;try{unsub?.();}catch(_){}resolve(u||null)};try{unsub=auth.onAuthStateChanged(finish)}catch(_){finish(null)};setTimeout(()=>finish(auth.currentUser||null),12000)});
    if(!user) throw new Error('Please sign in before submitting your eBook.');
    const token=await user.getIdToken(!!force);
    if(!token) throw new Error('Your session expired. Please sign in again.');
    return {user,token};
  }

  async function api(path, options={}, retry=2) {
    let lastError=null;
    for(let attempt=0;attempt<=retry;attempt++){
      try{
        const {token}=await getToken(attempt>0);
        const headers=new Headers(options.headers||{});
        headers.set('Authorization',`Bearer ${token}`);
        headers.set('Accept','application/json');
        if(options.body!==undefined && !(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type','application/json');
        const controller=new AbortController();
        const timer=setTimeout(()=>controller.abort(),45000);
        let response;
        try{response=await fetch(`${API}${path}`,{...options,headers,signal:controller.signal});}
        finally{clearTimeout(timer)}
        let data={}; try{data=await response.json()}catch(_){}
        if(!response.ok || data.success===false){const e=new Error(data.error||`Request failed (${response.status}).`);e.status=response.status;e.data=data;throw e}
        return data;
      }catch(e){
        lastError=e?.name==='AbortError'?new Error('The service took too long to respond. Retrying automatically…'):e;
        if(attempt<retry) await sleep(800*(attempt+1));
      }
    }
    throw lastError||new Error('Unable to connect to the publishing service. Please retry.');
  }

  function validate(){
    const pdf=document.getElementById('pub-pdf')?.files?.[0];
    const cover=document.getElementById('pub-cover')?.files?.[0];
    const title=value('pub-title'), author=value('pub-author'), category=value('pub-category'), description=value('pub-description');
    const pages=number('pub-pages'), price=number('pub-price');
    const saleRaw=value('pub-saleprice'), sale=saleRaw===''?null:Number(saleRaw);
    if(title.length<3) throw new Error('Please enter a valid eBook title.');
    if(!author) throw new Error('Please enter the author name.');
    if(!category) throw new Error('Please select a category.');
    if(description.length<20) throw new Error('Description must contain at least 20 characters.');
    if(!pdf) throw new Error('Please select your PDF eBook.');
    if(!pdf.name.toLowerCase().endsWith('.pdf') && pdf.type!=='application/pdf') throw new Error('Only PDF files are supported.');
    if(!cover) throw new Error('Please select the eBook cover.');
    if(cover.size>MAX_COVER_MB*1024*1024) throw new Error('Cover must be 5 MB or smaller.');
    if(!pages || pages<1) throw new Error('PDF page count is required.');
    if(!price || price<=0) throw new Error('Please enter a valid list price.');
    if(sale!==null && (!Number.isFinite(sale)||sale<0||sale>price)) throw new Error('Please enter a valid sale price.');
    return {pdf,cover,title,subtitle:value('pub-subtitle'),author,category,description,tags:value('pub-tags').split(',').map(x=>x.trim()).filter(Boolean),pages,price,salePrice:sale};
  }

  async function startDirect(file,kind){
    const data=await api('/api/books/upload-direct-session/start',{method:'POST',body:JSON.stringify({name:file.name,mimeType:kind==='pdf'?'application/pdf':file.type,size:file.size,kind})});
    if(!data.upload_url) throw new Error('Secure upload session could not be created.');
    return data.upload_url;
  }

  function putFile(url,file,label,onProgress){
    return new Promise((resolve,reject)=>{
      const xhr=new XMLHttpRequest();
      xhr.open('PUT',url,true);
      xhr.timeout=15*60*1000;
      xhr.onload=()=>{if(xhr.status>=200&&xhr.status<300){try{resolve(JSON.parse(xhr.responseText||'{}'))}catch(_){resolve({})};return}reject(new Error(`${label} upload failed. Please retry.`))};
      xhr.onerror=()=>reject(new Error('The upload connection was interrupted. Please retry.'));
      xhr.ontimeout=()=>reject(new Error('The upload took too long. Please retry.'));
      xhr.upload.onprogress=e=>{if(e.lengthComputable)onProgress(e.loaded/e.total)};
      xhr.send(file);
    });
  }

  async function finalize(fileId){
    if(!fileId) throw new Error('Upload could not be finalized.');
    const data=await api('/api/books/upload-direct-session/finalize',{method:'POST',body:JSON.stringify({file_id:fileId})});
    if(!data.file?.id) throw new Error('Upload could not be finalized.');
    return data.file;
  }

  async function saveFirestore(book,input,pdfFile,coverFile,user){
    const db=window.firebase?.firestore?.();
    if(!db||!user) throw new Error('Book details could not be saved. Please retry.');
    const id=String(book?.id||book?.bookId||'').trim();
    if(!id) throw new Error('A stable book ID was not returned.');
    const safe=v=>v==null?'':v; const now=new Date().toISOString();
    const metadata={id,bookId:id,slug:safe(book.slug||id),title:input.title,subtitle:input.subtitle,author:input.author,description:input.description,category:input.category,categoryId:safe(book.category_id||book.categoryId),tags:input.tags,pages:input.pages,format:'PDF',language:safe(book.language||'English'),price:input.price,salePrice:input.salePrice,sale_price:input.salePrice,coverUrl:safe(coverFile.url||coverFile.webViewLink||coverFile.downloadUrl),cover_url:safe(coverFile.url||coverFile.webViewLink||coverFile.downloadUrl),coverDriveFileId:safe(coverFile.id),coverFileId:safe(coverFile.id),cover_file_id:safe(coverFile.id),pdfUrl:safe(pdfFile.url||pdfFile.webViewLink||pdfFile.downloadUrl),pdf_url:safe(pdfFile.url||pdfFile.webViewLink||pdfFile.downloadUrl),driveFileId:safe(pdfFile.id),pdfFileId:safe(pdfFile.id),pdf_file_id:safe(pdfFile.id),sourceType:'internal',source_type:'internal',creatorId:safe(book.creator_id||book.creatorId),creator_id:safe(book.creator_id||book.creatorId),creatorUid:user.uid,firebaseUid:user.uid,sellerId:safe(book.seller_id||book.sellerId||book.creator_id),seller_id:safe(book.seller_id||book.sellerId||book.creator_id),sellerName:safe(book.seller_name||book.sellerName||input.author),seller_name:safe(book.seller_name||book.sellerName||input.author),status:'pending',isFeatured:false,is_featured:false,isTrending:false,is_trending:false,isBestseller:false,is_bestseller:false,isNew:true,is_new:true,rating:0,reviewCount:0,review_count:0,createdAt:book.createdAt||book.created_at||now,created_at:book.created_at||book.createdAt||now,updatedAt:now,updated_at:now,backendBookId:id,backendSynced:true,metadataSource:'firestore',driveStorage:'files-only'};
    await db.collection('books').doc(id).set(metadata,{merge:true});
  }

  async function submit(){
    cleanSubmitStep();
    const input=validate();
    const button=document.getElementById('submit-pub-btn'); if(button)button.disabled=true;
    try{
      setProgress('Preparing secure upload…',2,'Getting everything ready.');
      const {user}=await getToken(false);
      const [pdfSession,coverSession]=await Promise.all([startDirect(input.pdf,'pdf'),startDirect(input.cover,'cover')]);
      const total=input.pdf.size+input.cover.size; let pp=0,cp=0;
      const progress=()=>setProgress('Uploading eBook…',((pp*input.pdf.size+cp*input.cover.size)/total)*92,'Please keep this page open until the upload finishes.');
      progress();
      const [pdfRaw,coverRaw]=await Promise.all([putFile(pdfSession,input.pdf,'eBook',p=>{pp=p;progress()}),putFile(coverSession,input.cover,'Cover',p=>{cp=p;progress()})]);
      setProgress('Finishing submission…',95,'Almost done.');
      const [pdfFile,coverFile]=await Promise.all([finalize(pdfRaw.id||pdfRaw.fileId||pdfRaw.file_id),finalize(coverRaw.id||coverRaw.fileId||coverRaw.file_id)]);
      const payload={action:'createBook',title:input.title,subtitle:input.subtitle,author:input.author,category:input.category,description:input.description,tags:input.tags,pages:input.pages,format:'PDF',price:input.price,sale_price:input.salePrice,cover_url:coverFile.url||coverFile.webViewLink||coverFile.downloadUrl||'',pdf_url:pdfFile.url||pdfFile.webViewLink||pdfFile.downloadUrl||'',cover_file_id:coverFile.id,pdf_file_id:pdfFile.id,status:'pending'};
      const bookResponse=await api('/api/books/create',{method:'POST',body:JSON.stringify(payload)});
      if(!bookResponse.book) throw new Error('The book could not be created. Please retry.');
      await saveFirestore(bookResponse.book,input,pdfFile,coverFile,user);
      setProgress('Submitted successfully ✓',100,'Your eBook has been sent for review.');
      if(button)button.textContent='Submitted ✓';
      const toast=window.Toast?.show||window.BookoraToast?.show; if(toast)toast('eBook submitted successfully for review.','success');
      await sleep(900); window.location.hash='#/creator/dashboard';
    }catch(error){
      console.error('[Bookora publish]',error);
      if(button)button.disabled=false;
      setProgress('Submission failed — Retry',0,'Something went wrong. Your selected files are still here; try again.');
      const toast=window.Toast?.show||window.BookoraToast?.show; if(toast)toast(error?.message||'Unable to submit the eBook.','error');
    }
  }

  function install(form){
    if(!form||installed.has(form))return;
    installed.add(form);
    cleanSubmitStep();
    form.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();submit()},true);
    const observer=new MutationObserver(()=>cleanSubmitStep()); observer.observe(form,{childList:true,subtree:true});
  }
  const scan=()=>install(document.getElementById('publish-wizard-form'));
  new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
  scan();
})();
