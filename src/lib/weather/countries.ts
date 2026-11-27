// ISO 3166-1 alpha-2 identifiers. Display names come from the runtime's CLDR data.
const codes = 'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(' ');
const aliases:Record<string,string> = {uk:'GB',usa:'US','united states of america':'US','great britain':'GB'};
function normalized(value:string){
 return value.trim().normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/ł/g,'l').replace(/\s+/g,' ');
}
export function countryOptions(locale:'pl'|'en'){
 const names=new Intl.DisplayNames([locale],{type:'region'});
 return codes.map(code=>({code,name:names.of(code)??code})).sort((a,b)=>a.name.localeCompare(b.name,locale));
}
const byName=new Map<string,string>();
for(const locale of ['pl','en'] as const)for(const option of countryOptions(locale))byName.set(normalized(option.name),option.code);
export function resolveCountry(value:unknown):string|null {
 if(typeof value!=='string'||value.length>120)return null;
 const code=value.trim().toUpperCase();
 if(codes.includes(code))return code;
 const name=normalized(value);
 return aliases[name]??byName.get(name)??null;
}
