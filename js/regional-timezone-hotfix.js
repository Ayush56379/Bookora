import { state } from './state.js';
// Keep timezone in lockstep with the selected region.
const REGION_TIMEZONES={IN:'Asia/Kolkata',US:'America/New_York',CA:'America/Toronto',GB:'Europe/London',AU:'Australia/Sydney',NZ:'Pacific/Auckland',AE:'Asia/Dubai',SA:'Asia/Riyadh',SG:'Asia/Singapore',MY:'Asia/Kuala_Lumpur',TH:'Asia/Bangkok',ID:'Asia/Jakarta',PH:'Asia/Manila',JP:'Asia/Tokyo',CN:'Asia/Shanghai',HK:'Asia/Hong_Kong',KR:'Asia/Seoul',DE:'Europe/Berlin',FR:'Europe/Paris',IT:'Europe/Rome',ES:'Europe/Madrid',NL:'Europe/Amsterdam',BE:'Europe/Brussels',AT:'Europe/Vienna',IE:'Europe/Dublin',PT:'Europe/Lisbon',CH:'Europe/Zurich',SE:'Europe/Stockholm',NO:'Europe/Oslo',DK:'Europe/Copenhagen',BR:'America/Sao_Paulo',MX:'America/Mexico_City',ZA:'Africa/Johannesburg'};
function timezoneForRegion(region){return REGION_TIMEZONES[String(region||'IN').toUpperCase()]||'UTC';}
function apply(){const p=window.BOOKORA_REGIONAL_PROFILE||{};const region=String(p.regionCode||p.countryCode||'IN').toUpperCase();const timezone=timezoneForRegion(region);window.BOOKORA_REGIONAL_PROFILE={...p,regionCode:region,countryCode:region,timezone};window.BOOKORA_REGION_TIMEZONES=REGION_TIMEZONES;window.BOOKORA_REGIONAL_TIMEZONE=timezone;document.documentElement.dataset.timezone=timezone;window.dispatchEvent(new CustomEvent('bookora:timezone-changed',{detail:{regionCode:region,timezone}}));return timezone;}
let saveInFlight=false;
async function persist(){if(saveInFlight||!state.isAuthenticated||!window.BookoraRegionalCurrency?.saveProfile)return;const p=window.BOOKORA_REGIONAL_PROFILE||{};const timezone=apply();saveInFlight=true;try{await window.BookoraRegionalCurrency.saveProfile({...p,timezone});}catch(e){console.warn('[Regional] timezone persistence failed:',e.message);}finally{saveInFlight=false;}}
window.BookoraRegionalTimezone={map:REGION_TIMEZONES,timezoneForRegion:timezoneForRegion,apply:apply,persist:persist};
window.addEventListener('bookora:region-changed',()=>{apply();persist();});
window.addEventListener('bookora:currency-ready',apply);
setTimeout(apply,0);
