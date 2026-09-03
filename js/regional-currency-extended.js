// Bookora Extended Regional Currency Runtime
// Extends the existing regional currency runtime without changing its UI or unrelated flows.
import { state } from './state.js';

const EXTRA_REGIONS = {
  BD:{name:'Bangladesh',currency:'BDT',symbol:'৳',locale:'en-BD'},
  PK:{name:'Pakistan',currency:'PKR',symbol:'₨',locale:'en-PK'},
  LK:{name:'Sri Lanka',currency:'LKR',symbol:'Rs',locale:'en-LK'},
  NP:{name:'Nepal',currency:'NPR',symbol:'रू',locale:'ne-NP'},
  MM:{name:'Myanmar',currency:'MMK',symbol:'K',locale:'my-MM'},
  VN:{name:'Vietnam',currency:'VND',symbol:'₫',locale:'vi-VN'},
  KH:{name:'Cambodia',currency:'KHR',symbol:'៛',locale:'km-KH'},
  LA:{name:'Laos',currency:'LAK',symbol:'₭',locale:'lo-LA'},
  TW:{name:'Taiwan',currency:'TWD',symbol:'NT$',locale:'zh-TW'},
  TR:{name:'Türkiye',currency:'TRY',symbol:'₺',locale:'tr-TR'},
  IL:{name:'Israel',currency:'ILS',symbol:'₪',locale:'he-IL'},
  EG:{name:'Egypt',currency:'EGP',symbol:'E£',locale:'ar-EG'},
  NG:{name:'Nigeria',currency:'NGN',symbol:'₦',locale:'en-NG'},
  KE:{name:'Kenya',currency:'KES',symbol:'KSh',locale:'sw-KE'},
  GH:{name:'Ghana',currency:'GHS',symbol:'GH₵',locale:'en-GH'},
  MA:{name:'Morocco',currency:'MAD',symbol:'د.م.',locale:'fr-MA'},
  DZ:{name:'Algeria',currency:'DZD',symbol:'دج',locale:'ar-DZ'},
  TN:{name:'Tunisia',currency:'TND',symbol:'د.ت',locale:'ar-TN'},
  AR:{name:'Argentina',currency:'ARS',symbol:'AR$',locale:'es-AR'},
  CL:{name:'Chile',currency:'CLP',symbol:'CL$',locale:'es-CL'},
  CO:{name:'Colombia',currency:'COP',symbol:'COL$',locale:'es-CO'},
  PE:{name:'Peru',currency:'PEN',symbol:'S/',locale:'es-PE'},
  UY:{name:'Uruguay',currency:'UYU',symbol:'$U',locale:'es-UY'},
  PY:{name:'Paraguay',currency:'PYG',symbol:'₲',locale:'es-PY'},
  BO:{name:'Bolivia',currency:'BOB',symbol:'Bs.',locale:'es-BO'},
  CR:{name:'Costa Rica',currency:'CRC',symbol:'₡',locale:'es-CR'},
  GT:{name:'Guatemala',currency:'GTQ',symbol:'Q',locale:'es-GT'},
  DO:{name:'Dominican Republic',currency:'DOP',symbol:'RD$',locale:'es-DO'},
  JM:{name:'Jamaica',currency:'JMD',symbol:'J$',locale:'en-JM'},
  TT:{name:'Trinidad and Tobago',currency:'TTD',symbol:'TT$',locale:'en-TT'},
  IS:{name:'Iceland',currency:'ISK',symbol:'kr',locale:'is-IS'},
  PL:{name:'Poland',currency:'PLN',symbol:'zł',locale:'pl-PL'},
  CZ:{name:'Czechia',currency:'CZK',symbol:'Kč',locale:'cs-CZ'},
  HU:{name:'Hungary',currency:'HUF',symbol:'Ft',locale:'hu-HU'},
  RO:{name:'Romania',currency:'RON',symbol:'lei',locale:'ro-RO'},
  BG:{name:'Bulgaria',currency:'BGN',symbol:'лв',locale:'bg-BG'},
  RS:{name:'Serbia',currency:'RSD',symbol:'дин',locale:'sr-RS'},
  UA:{name:'Ukraine',currency:'UAH',symbol:'₴',locale:'uk-UA'},
  GE:{name:'Georgia',currency:'GEL',symbol:'₾',locale:'ka-GE'},
  AZ:{name:'Azerbaijan',currency:'AZN',symbol:'₼',locale:'az-AZ'},
  KZ:{name:'Kazakhstan',currency:'KZT',symbol:'₸',locale:'kk-KZ'},
  UZ:{name:'Uzbekistan',currency:'UZS',symbol:"so'm",locale:'uz-UZ'},
  KG:{name:'Kyrgyzstan',currency:'KGS',symbol:'сом',locale:'ky-KG'},
  MN:{name:'Mongolia',currency:'MNT',symbol:'₮',locale:'mn-MN'},
  RU:{name:'Russia',currency:'RUB',symbol:'₽',locale:'ru-RU'},
  IR:{name:'Iran',currency:'IRR',symbol:'﷼',locale:'fa-IR'},
  AF:{name:'Afghanistan',currency:'AFN',symbol:'؋',locale:'ps-AF'},
  BH:{name:'Bahrain',currency:'BHD',symbol:'.د.ب',locale:'ar-BH'},
  KW:{name:'Kuwait',currency:'KWD',symbol:'د.ك',locale:'ar-KW'},
  QA:{name:'Qatar',currency:'QAR',symbol:'ر.ق',locale:'ar-QA'},
  OM:{name:'Oman',currency:'OMR',symbol:'ر.ع.',locale:'ar-OM'},
  JO:{name:'Jordan',currency:'JOD',symbol:'د.ا',locale:'ar-JO'},
  LB:{name:'Lebanon',currency:'LBP',symbol:'ل.ل',locale:'ar-LB'},
  IQ:{name:'Iraq',currency:'IQD',symbol:'ع.د',locale:'ar-IQ'},
  YE:{name:'Yemen',currency:'YER',symbol:'﷼',locale:'ar-YE'},
  TZ:{name:'Tanzania',currency:'TZS',symbol:'TSh',locale:'sw-TZ'},
  UG:{name:'Uganda',currency:'UGX',symbol:'USh',locale:'en-UG'},
  RW:{name:'Rwanda',currency:'RWF',symbol:'RF',locale:'rw-RW'},
  BI:{name:'Burundi',currency:'BIF',symbol:'FBu',locale:'fr-BI'},
  ET:{name:'Ethiopia',currency:'ETB',symbol:'Br',locale:'am-ET'},
  MU:{name:'Mauritius',currency:'MUR',symbol:'₨',locale:'en-MU'},
  BW:{name:'Botswana',currency:'BWP',symbol:'P',locale:'en-BW'},
  NA:{name:'Namibia',currency:'NAD',symbol:'N$',locale:'en-NA'},
  SZ:{name:'Eswatini',currency:'SZL',symbol:'E',locale:'en-SZ'},
  SN:{name:'Senegal',currency:'XOF',symbol:'CFA',locale:'fr-SN'},
  CM:{name:'Cameroon',currency:'XAF',symbol:'FCFA',locale:'fr-CM'},
  NC:{name:'New Caledonia',currency:'XPF',symbol:'₣',locale:'fr-NC'}
};

const API=(window.BOOKORA_API_URL||'https://bookora-backend-x08l.onrender.com').replace(/\/$/,'');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function mergeCatalog(){
  const regional=window.BookoraRegionalCurrency;
  if(!regional?.REGION_MAP)return false;
  Object.assign(regional.REGION_MAP,EXTRA_REGIONS);
  for(const meta of Object.values(EXTRA_REGIONS)) regional.CURRENCY_META[meta.currency]={symbol:meta.symbol,locale:meta.locale};
  const regionCodes=new Set(Object.keys(regional.REGION_MAP));
  regional.detectRegion=()=>{
    try{
      const locale=String(navigator.language||'').replace('_','-');
      const m=locale.match(/-([A-Z]{2})(?:-|$)/i);
      if(m&&regionCodes.has(m[1].toUpperCase()))return m[1].toUpperCase();
    }catch(_){ }
    try{
      const tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';
      for(const [code,meta] of Object.entries(regional.REGION_MAP)){
        const lang=String(meta.locale||'').split('-')[1]?.toUpperCase();
        if(lang&&tz.toUpperCase().includes(lang)&&regionCodes.has(code))return code;
      }
    }catch(_){ }
    return 'IN';
  };
  return true;
}

async function fetchAllRates(){
  const regional=window.BookoraRegionalCurrency;
  if(!regional?.REGION_MAP)return;
  const target=String(window.BOOKORA_REGIONAL_CURRENCY?.code||'INR').toUpperCase();
  const currencies=[target,...Object.values(regional.REGION_MAP).map(x=>String(x.currency||'').toUpperCase()),'INR'];
  const unique=[...new Set(currencies.filter(x=>/^[A-Z]{3}$/.test(x)))];
  const chunks=[];
  for(let i=0;i<unique.length;i+=35)chunks.push(unique.slice(i,i+35));
  const headers={Accept:'application/json'};
  if(state.token)headers.Authorization=`Bearer ${state.token}`;
  const merged={INR:1};
  for(const symbols of chunks){
    try{
      const res=await fetch(`${API}/api/fx/rates?base=INR&symbols=${encodeURIComponent(symbols.join(','))}`,{headers,cache:'no-store'});
      const data=await res.json().catch(()=>({}));
      if(res.ok&&data.rates)Object.assign(merged,data.rates);
    }catch(error){console.warn('[Bookora Extended Currency] FX batch failed:',error?.message||error);}
  }
  window.BOOKORA_FX_RATES=merged;
  try{localStorage.setItem('bookora_fx_cache_v2',JSON.stringify({savedAt:Date.now(),target,rates:merged,asOf:new Date().toISOString()}));}catch(_){ }
}

async function boot(){
  for(let i=0;i<80&&!mergeCatalog();i++)await sleep(50);
  if(!window.BookoraRegionalCurrency)return;
  await fetchAllRates();
  window.dispatchEvent(new CustomEvent('bookora:currency-catalog-ready'));
}

window.addEventListener('bookora:currency-ready',()=>{fetchAllRates().then(()=>window.dispatchEvent(new CustomEvent('bookora:currency-catalog-ready')));});
window.addEventListener('bookora:currency-catalog-ready',()=>{
  const app=window.__BOOKORA_APP_INSTANCE__;
  if(app?.route&&!app.routeRunning)app.route(true,false);
});

boot().catch(error=>console.warn('[Bookora Extended Currency] startup failed:',error));
