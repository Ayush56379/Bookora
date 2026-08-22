// UserSettingsPage Component — buyer profile, region, currency and notification settings
import { state } from '../state.js';
import { updateSEO } from '../utils/seo.js';
import { Toast } from '../components/Toast.js';

const REGION_FALLBACK = { IN:{name:'India',currency:'INR',symbol:'₹',locale:'en-IN'},US:{name:'United States',currency:'USD',symbol:'$',locale:'en-US'},GB:{name:'United Kingdom',currency:'GBP',symbol:'£',locale:'en-GB'},CA:{name:'Canada',currency:'CAD',symbol:'CA$',locale:'en-CA'},AU:{name:'Australia',currency:'AUD',symbol:'A$',locale:'en-AU'},AE:{name:'United Arab Emirates',currency:'AED',symbol:'د.إ',locale:'ar-AE'},SG:{name:'Singapore',currency:'SGD',symbol:'S$',locale:'en-SG'},DE:{name:'Germany',currency:'EUR',symbol:'€',locale:'de-DE'},FR:{name:'France',currency:'EUR',symbol:'€',locale:'fr-FR'},JP:{name:'Japan',currency:'JPY',symbol:'¥',locale:'ja-JP'},CN:{name:'China',currency:'CNY',symbol:'¥',locale:'zh-CN'},KR:{name:'South Korea',currency:'KRW',symbol:'₩',locale:'ko-KR'},BR:{name:'Brazil',currency:'BRL',symbol:'R$',locale:'pt-BR'},MX:{name:'Mexico',currency:'MXN',symbol:'MX$',locale:'es-MX'},ZA:{name:'South Africa',currency:'ZAR',symbol:'R',locale:'en-ZA'}};

function esc(v){return String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function getRegional(){return window.BookoraRegionalCurrency || null;}
function getProfile(){
  const r=getRegional();
  if(r?.profile)return r.profile();
  const u=state.currentUser||{};const code=String(u.regionCode||'IN').toUpperCase();const m=REGION_FALLBACK[code]||REGION_FALLBACK.IN;
  return {...u,regionCode:code,countryName:u.countryName||m.name,currency:m.currency,currencySymbol:m.symbol,locale:u.locale||m.locale,timezone:u.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone||'Asia/Kolkata'};
}
function renderRegionOptions(selected){
  const map=getRegional()?.REGION_MAP||REGION_FALLBACK;
  return Object.entries(map).sort((a,b)=>a[1].name.localeCompare(b[1].name)).map(([code,m])=>`<option value="${code}" ${code===selected?'selected':''}>${esc(m.name)} (${m.currency} ${m.symbol})</option>`).join('');
}

export function renderUserSettingsPage() {
  updateSEO({title:'Account Settings & Regional Preferences',description:'Manage your Bookora profile, country or region, local currency, language, timezone and notification preferences.'});
  const user=state.currentUser||{};const p=getProfile();const n=user.notifications||p.notifications||{};
  return `
    <div class="user-settings-page animate-fade-in" style="background:var(--bg-secondary);min-height:85vh;padding:3.5rem 0 5rem;">
      <div class="container" style="max-width:900px;">
        <div style="margin-bottom:2.5rem;"><div class="badge badge-bookora" style="margin-bottom:.5rem;">Account Center</div><h1 style="font-family:var(--font-display);font-size:2.2rem;font-weight:800;color:var(--text-primary);">Account Settings</h1><p style="font-size:.95rem;color:var(--text-secondary);margin-top:.25rem;">Your profile, location, currency and shopping preferences stay synced across Bookora.</p></div>
        <div style="background:#fff;border:1px solid var(--border-subtle);border-radius:var(--radius-xl);padding:2.5rem;box-shadow:var(--shadow-sm);">
          <form id="user-settings-form">
            <section style="margin-bottom:2rem;border-bottom:1px solid var(--border-subtle);padding-bottom:1.7rem;">
              <h3 style="font-size:1.15rem;font-weight:800;color:var(--text-primary);margin-bottom:1.25rem;">1. Personal Profile</h3>
              <div class="bookora-settings-avatar-row" style="display:flex;align-items:center;gap:1.25rem;margin-bottom:1.5rem;">
                <img id="user-set-avatar-preview" src="${esc(user.avatar||user.photoURL||'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150')}" alt="${esc(user.name||'Bookora User')}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #fff;box-shadow:0 4px 16px rgba(15,23,42,.12);" />
                <div style="flex:1;"><label style="display:block;font-size:.8rem;font-weight:600;color:var(--text-secondary);margin-bottom:.35rem;">Avatar URL</label><input type="url" id="user-set-avatar" value="${esc(user.avatar||user.photoURL||'')}" placeholder="https://..." style="width:100%;padding:.65rem .85rem;border-radius:var(--radius-md);border:1px solid var(--border-medium);font-size:.85rem;" /></div>
              </div>
              <div class="bookora-settings-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;">
                <div><label style="display:block;font-size:.825rem;font-weight:600;margin-bottom:.35rem;">Full Name</label><input type="text" id="user-set-name" value="${esc(user.name||'')}" required maxlength="100" style="width:100%;padding:.65rem .85rem;border-radius:var(--radius-md);border:1px solid var(--border-medium);font-size:.95rem;" /></div>
                <div><label style="display:block;font-size:.825rem;font-weight:600;margin-bottom:.35rem;">Email Address</label><input type="email" id="user-set-email" value="${esc(user.email||'')}" readonly aria-readonly="true" style="width:100%;padding:.65rem .85rem;border-radius:var(--radius-md);border:1px solid var(--border-medium);font-size:.95rem;background:#F8FAFC;color:#64748B;cursor:not-allowed;" /><small style="display:block;margin-top:.35rem;color:var(--text-muted);font-size:.7rem;">Authentication email is managed by your sign-in provider.</small></div>
              </div>
            </section>

            <section style="margin-bottom:2rem;border-bottom:1px solid var(--border-subtle);padding-bottom:1.7rem;">
              <h3 style="font-size:1.15rem;font-weight:800;color:var(--text-primary);margin-bottom:.35rem;">2. Country, Region & Currency</h3>
              <p style="font-size:.82rem;color:var(--text-secondary);margin-bottom:1.25rem;">Bookora automatically uses your selected region to choose the display currency. Prices are converted using the latest available FX reference rate.</p>
              <div class="bookora-settings-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;">
                <div><label style="display:block;font-size:.825rem;font-weight:600;margin-bottom:.35rem;">Country / Region</label><select id="user-set-region" style="width:100%;padding:.65rem .85rem;border-radius:var(--radius-md);border:1px solid var(--border-medium);font-size:.95rem;background:#fff;">${renderRegionOptions(p.regionCode)}</select></div>
                <div><label style="display:block;font-size:.825rem;font-weight:600;margin-bottom:.35rem;">Your Currency</label><div id="user-set-currency-display" style="width:100%;padding:.65rem .85rem;border-radius:var(--radius-md);border:1px solid #BFDBFE;background:#EFF6FF;font-size:.95rem;font-weight:700;color:#1D4ED8;">${esc(p.currency||'INR')} ${esc(p.currencySymbol||'₹')}</div><small style="display:block;margin-top:.35rem;color:var(--text-muted);font-size:.7rem;">Currency changes automatically with your region.</small></div>
              </div>
              <div style="margin-top:1rem;display:flex;gap:.75rem;align-items:center;flex-wrap:wrap;"><button type="button" id="detect-region-btn" class="btn btn-secondary btn-sm" style="font-weight:700;">Detect My Region</button><span id="region-detect-status" style="font-size:.78rem;color:var(--text-muted);">Current: ${esc(p.countryName||'India')} · ${esc(p.timezone||'Asia/Kolkata')}</span></div>
              <div style="margin-top:1rem;padding:1rem;border-radius:12px;background:linear-gradient(135deg,#EFF6FF,#F8FAFC);border:1px solid #DBEAFE;"><div style="font-size:.8rem;font-weight:800;color:#1E3A8A;">Live currency pricing</div><div id="live-fx-status" style="font-size:.76rem;color:#475569;margin-top:.25rem;">Prices on Bookora will use ${esc(p.currency||'INR')} after your region is saved.</div></div>
            </section>

            <section style="margin-bottom:2rem;border-bottom:1px solid var(--border-subtle);padding-bottom:1.7rem;">
              <h3 style="font-size:1.15rem;font-weight:800;color:var(--text-primary);margin-bottom:1.25rem;">3. Language, Timezone & Date Format</h3>
              <div class="bookora-settings-grid" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.25rem;">
                <div><label style="display:block;font-size:.825rem;font-weight:600;margin-bottom:.35rem;">Language</label><select id="user-set-language" style="width:100%;padding:.65rem .85rem;border-radius:var(--radius-md);border:1px solid var(--border-medium);font-size:.95rem;background:#fff;"><option value="English" selected>English</option><option value="Hindi">Hindi</option></select></div>
                <div><label style="display:block;font-size:.825rem;font-weight:600;margin-bottom:.35rem;">Timezone</label><input id="user-set-timezone" value="${esc(p.timezone||'Asia/Kolkata')}" readonly style="width:100%;padding:.65rem .85rem;border-radius:var(--radius-md);border:1px solid var(--border-medium);font-size:.85rem;background:#F8FAFC;" /></div>
                <div><label style="display:block;font-size:.825rem;font-weight:600;margin-bottom:.35rem;">Date Format</label><select id="user-set-date-format" style="width:100%;padding:.65rem .85rem;border-radius:var(--radius-md);border:1px solid var(--border-medium);font-size:.95rem;background:#fff;"><option value="DD MMM YYYY" ${(p.dateFormat||'DD MMM YYYY')==='DD MMM YYYY'?'selected':''}>22 Aug 2026</option><option value="DD/MM/YYYY" ${p.dateFormat==='DD/MM/YYYY'?'selected':''}>22/08/2026</option><option value="MM/DD/YYYY" ${p.dateFormat==='MM/DD/YYYY'?'selected':''}>08/22/2026</option></select></div>
              </div>
            </section>

            <section style="margin-bottom:2rem;border-bottom:1px solid var(--border-subtle);padding-bottom:1.7rem;">
              <h3 style="font-size:1.15rem;font-weight:800;color:var(--text-primary);margin-bottom:1.25rem;">4. Notification Preferences</h3>
              <div style="display:flex;flex-direction:column;gap:.9rem;">
                <label style="display:flex;align-items:center;justify-content:space-between;gap:1rem;cursor:pointer;"><span style="font-size:.9rem;color:var(--text-primary);">Order receipts and license delivery emails</span><input type="checkbox" id="user-notif-orders" ${n.orders!==false?'checked':''} style="width:18px;height:18px;accent-color:var(--accent);" /></label>
                <label style="display:flex;align-items:center;justify-content:space-between;gap:1rem;cursor:pointer;"><span style="font-size:.9rem;color:var(--text-primary);">Wishlist price reductions & promotions</span><input type="checkbox" id="user-notif-wishlist" ${n.wishlist!==false?'checked':''} style="width:18px;height:18px;accent-color:var(--accent);" /></label>
                <label style="display:flex;align-items:center;justify-content:space-between;gap:1rem;cursor:pointer;"><span style="font-size:.9rem;color:var(--text-primary);">New releases in followed categories</span><input type="checkbox" id="user-notif-releases" ${n.releases!==false?'checked':''} style="width:18px;height:18px;accent-color:var(--accent);" /></label>
              </div>
            </section>

            <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;"><div style="font-size:.75rem;color:var(--text-muted);">Changes are saved to your Bookora account and reused on future visits.</div><button type="submit" class="btn btn-primary btn-lg" style="font-weight:800;min-width:210px;">Save Account Preferences</button></div>
          </form>
        </div>
      </div>
      <style>.bookora-settings-grid input,.bookora-settings-grid select{box-sizing:border-box}@media(max-width:700px){.user-settings-page{padding:2rem 0 4rem!important}.user-settings-page .container{padding-left:1rem;padding-right:1rem}.user-settings-page form>section{margin-bottom:1.5rem!important}.bookora-settings-grid{grid-template-columns:1fr!important}.bookora-settings-avatar-row{align-items:flex-start!important;flex-direction:column!important}.user-settings-page>div>div:last-child{padding:1.25rem!important}}</style>
    </div>
  `;
}

export function initUserSettingsEvents(){
  const form=document.getElementById('user-settings-form');if(!form)return;
  const regionEl=document.getElementById('user-set-region');const currencyEl=document.getElementById('user-set-currency-display');const statusEl=document.getElementById('region-detect-status');const fxEl=document.getElementById('live-fx-status');const avatar=document.getElementById('user-set-avatar');const avatarPreview=document.getElementById('user-set-avatar-preview');
  const regional=getRegional();
  const syncRegionUI=()=>{const code=String(regionEl?.value||'IN').toUpperCase();const map=regional?.REGION_MAP||REGION_FALLBACK;const m=map[code]||REGION_FALLBACK.IN;if(currencyEl)currencyEl.textContent=`${m.currency} ${m.symbol}`;if(statusEl)statusEl.textContent=`Selected: ${m.name} · ${Intl.DateTimeFormat().resolvedOptions().timeZone||'Local timezone'}`;if(fxEl)fxEl.textContent=`${m.currency} is automatically selected for ${m.name}. Bookora will convert catalog prices using the latest available rate.`;};
  regionEl?.addEventListener('change',syncRegionUI);
  document.getElementById('detect-region-btn')?.addEventListener('click',()=>{const code=regional?.detectRegion?.()||'IN';if(regionEl)regionEl.value=code;syncRegionUI();Toast.show('Region detected. Save your preferences to apply it everywhere.','info');});
  avatar?.addEventListener('input',()=>{if(avatarPreview&&avatar.value.trim())avatarPreview.src=avatar.value.trim();});
  form.addEventListener('submit',async e=>{e.preventDefault();const btn=form.querySelector('button[type="submit"]');const original=btn?.textContent;try{if(!state.isAuthenticated)throw new Error('Please sign in first.');const code=String(regionEl?.value||'IN').toUpperCase();const map=regional?.REGION_MAP||REGION_FALLBACK;const m=map[code]||REGION_FALLBACK.IN;const p={...(getProfile()),regionCode:code,countryCode:code,countryName:m.name,currency:m.currency,currencySymbol:m.symbol,locale:m.locale,timezone:document.getElementById('user-set-timezone')?.value||Intl.DateTimeFormat().resolvedOptions().timeZone||'Asia/Kolkata',dateFormat:document.getElementById('user-set-date-format')?.value||'DD MMM YYYY',notifications:{orders:!!document.getElementById('user-notif-orders')?.checked,wishlist:!!document.getElementById('user-notif-wishlist')?.checked,releases:!!document.getElementById('user-notif-releases')?.checked},name:document.getElementById('user-set-name')?.value.trim(),avatar:avatar?.value.trim()||state.currentUser?.avatar||state.currentUser?.photoURL||''};if(!p.name)throw new Error('Full name is required.');if(btn){btn.disabled=true;btn.textContent='Saving...';}if(regional?.saveProfile){await regional.saveProfile(p);}else{state.currentUser={...state.currentUser,...p};localStorage.setItem('bookora_user_profile',JSON.stringify(state.currentUser));state.notify('USER_UPDATED',state.currentUser);}Toast.show(`Saved. ${m.name} now uses ${m.currency} pricing.`,'success');setTimeout(()=>window.dispatchEvent(new Event('hashchange')),250);}catch(err){console.error('[Settings] save failed:',err);Toast.show(err.message||'Unable to save preferences.','error');}finally{if(btn){btn.disabled=false;btn.textContent=original||'Save Account Preferences';}}});
  syncRegionUI();
}
