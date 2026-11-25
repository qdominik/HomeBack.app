import type {Candidate,Conditions,Snapshot,WeatherKind} from './contracts';
import {validTimezone} from './contracts';

const object=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'?v as Record<string,unknown>:{};
const number=(v:unknown,min:number,max:number)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
export function parseCandidates(value:unknown):Candidate[]{
 if(!Array.isArray(value))return [];
 return value.slice(0,30).flatMap(v=>{const r=object(v);return Number.isSafeInteger(r.id)&&number(r.lat,-90,90)&&number(r.lon,-180,180)&&['name','region','country'].every(k=>typeof r[k]==='string'&&(r[k] as string).length<=160)?[{id:r.id as number,name:r.name as string,region:r.region as string,country:r.country as string,lat:r.lat as number,lon:r.lon as number}]:[];});
}
function conditions(value:unknown,epochField:string):Conditions|null {
 const r=object(value),c=object(r.condition);
 if(!number(r[epochField],1,4102444800)||!Number.isSafeInteger(c.code)||!number(r.temp_c,-100,70)||!number(r.wind_kph,0,500)||!number(r.precip_mm,0,2000))return null;
 return {epoch:(r[epochField] as number)*1000,code:c.code as number,temperature:r.temp_c as number,wind:r.wind_kph as number,precipitation:r.precip_mm as number};
}
export function solarTime(v:unknown):number|null {
 if(typeof v!=='string')return null;
 const m=/^(0?[1-9]|1[0-2]):([0-5]\d) (AM|PM)$/i.exec(v);if(!m)return null;
 return Number(m[1])%12+(m[3].toUpperCase()==='PM'?12:0)+Number(m[2])/60;
}
export function parseForecast(value:unknown,now=Date.now()):Snapshot|null {
 const r=object(value),l=object(r.location),f=object(r.forecast);
 if(!validTimezone(l.tz_id)||!Array.isArray(f.forecastday))return null;
 const day=object(f.forecastday[0]),astro=object(day.astro),current=conditions(r.current,'last_updated_epoch');
 if(!current||typeof day.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day.date)||!Array.isArray(day.hour))return null;
 const hours=day.hour.slice(0,25).flatMap(h=>{const c=conditions(h,'time_epoch');return c?[c]:[];});
 return {fetchedAt:now,timezone:l.tz_id,current,hours,solar:{date:day.date,sunrise:solarTime(astro.sunrise),sunset:solarTime(astro.sunset)}};
}
export function currentConditions(snapshot:Snapshot,now=Date.now()):Conditions|null {
 if(now-snapshot.fetchedAt>45*60000||snapshot.fetchedAt-now>5*60000)return null;
 const age=now-snapshot.current.epoch;
 if(age>=-5*60000&&age<=60*60000)return snapshot.current;
 return snapshot.hours.find(h=>h.epoch<=now&&now<h.epoch+3600000)??null;
}
export function weatherKind(c:Conditions|null):WeatherKind {
 if(!c)return 'none';
 // Provider codes marked "possible" are not evidence of precipitation now.
 if([1063,1066,1069,1072,1087].includes(c.code)&&c.precipitation===0)return 'cloud';
 if([1087,1273,1276].includes(c.code))return 'storm';
 if([1030,1135,1147].includes(c.code))return 'fog';
 if([1066,1069,1114,1117,1204,1207,1210,1213,1216,1219,1222,1225,1237,1249,1252,1255,1258,1261,1264,1279,1282].includes(c.code))return 'snow';
 if([1063,1072,1150,1153,1168,1171,1180,1183,1186,1189,1192,1195,1198,1201,1240,1243,1246].includes(c.code))return c.code===1063&&c.precipitation===0?'cloud':'rain';
 if([1003,1006,1009].includes(c.code))return 'cloud';
 return c.code===1000?'clear':'none';
}
export function zonedClock(now:number,timezone?:string|null){
 const d=new Date(now);
 if(!validTimezone(timezone))return {hour:d.getHours()+d.getMinutes()/60,date:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d).map(p=>[p.type,p.value]));
 return {hour:Number(parts.hour)+Number(parts.minute)/60,date:`${parts.year}-${parts.month}-${parts.day}`};
}
// Remap local solar anchors onto the approved B palette, retaining its complete twilight.
export function solarHour(now:number,timezone:string|null,snapshot:Snapshot|null):number {
 const clock=zonedClock(now,timezone);
 const solar=snapshot?.solar;
 if(!solar||solar.date!==clock.date||solar.sunrise===null||solar.sunset===null||solar.sunset-solar.sunrise<3||solar.sunset-solar.sunrise>21)return clock.hour;
 const rise=solar.sunrise,set=solar.sunset,day=set-rise;
 const anchors=[[0,0],[Math.max(.1,rise-.75),5],[rise,5.75],[rise+day*.2,8],[rise+day*.5,13],[set,18],[Math.min(23.9,set+Math.min(2,(24-day)*.35)),22.5],[24,24]];
 if(anchors.some((anchor,i)=>i>0&&anchor[0]<=anchors[i-1][0]))return clock.hour;
 const i=anchors.findIndex(a=>a[0]>clock.hour);if(i<1)return clock.hour;
 const [a,b]=[anchors[i-1],anchors[i]];
 return a[1]+(b[1]-a[1])*(clock.hour-a[0])/(b[0]-a[0]);
}
