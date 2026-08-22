// Keep timezone in lockstep with the selected region.
const REGION_TIMEZONES={IN:'Asia/Kolkata',US:'America/New_York',CA:'America/Toronto',GB:'Europe/London',AU:'Australia/Sydney',NZ:'Pacific/Auckland',AE:'Asia/Dubai',SA:'Asia/Riyadh',SG:'Asia/Singapore',MY:'Asia/Kuala_Lumpur',TH:'Asia/Bangkok',ID:'Asia/Jakarta',PH:'Asia/Manila',JP:'Asia/Tokyo',CN:'Asia/Shanghai',HK:'Asia/Hong_Kong',KR:'Asia/Seoul',DE:'Europe/Berlin',FR:'Europe/Paris',IT:'Europe/Rome',ES:'Europe/Madrid',NL:'Europe/Amsterdam',BE:'Europe/Brussels',AT:'Europe/Vienna',IE:'Europe/Dublin',PT:'Europe/Lisbon',CH:'Europe/Zurich',SE:'Europe/Stockholm',NO:'Europe/Oslo',DK:'Europe/Copenhagen',BR:'America/Sao_Paulo',MX:'America/Mexico_City',ZA:'Africa/Johannesburg'};
const original=window.BookoraRegionalCurrency;
if(original){
  const baseSave=original.saveProfile;
  original.regionTimezone=(region)=>REGION_TIMEZONES[String(region||'IN').toUpperCase()]||'UTC';
  original.saveProfile=async(profile={})=>{const region=String(profile.regionCode||profile.countryCode||'IN').toUpperCase();const timezone=REGION_TIMEZONES[region]||'UTC';return baseSave({...profile,regionCode:region,countryCode:region,timezone});};
  const current=original.profile?.();if(current&&REGION_TIMEZONES[current.regionCode]){current.timezone=REGION_TIMEZONES[current.regionCode];window.BOOKORA_REGIONAL_PROFILE={...window.BOOKORA_REGIONAL_PROFILE,timezone:current.timezone};}
}
window.BOOKORA_REGION_TIMEZONES=REGION_TIMEZONES;
