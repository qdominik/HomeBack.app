import 'server-only';
import { request } from 'node:https';
import {parseCandidates,parseForecast} from './model';
import {validTimezone} from './contracts';
import type {Candidate,LocationRow} from './contracts';

export class ProviderFailure extends Error {
 constructor(public readonly reason:'missing_key'|'quota'|'unavailable'){super(reason);}
}
// Native HTTPS avoids framework fetch-URL logging of the provider's query-string key.
export function providerRequest(endpoint:'search'|'timezone'|'forecast',q:string):Promise<unknown>{
 const key=process.env.WEATHERAPI_KEY?.trim();if(!key)return Promise.reject(new ProviderFailure('missing_key'));
 return new Promise((resolve,reject)=>{
  const params=new URLSearchParams({key,q,...(endpoint==='forecast'?{days:'1',aqi:'no',alerts:'no'}:{})});
  const req=request({hostname:'api.weatherapi.com',path:`/v1/${endpoint}.json?${params}`,method:'GET'},res=>{
   let size=0;const chunks:Buffer[]=[];
   res.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>1024*1024){res.destroy();reject(new ProviderFailure('unavailable'));}else chunks.push(chunk);});
   res.on('error',()=>{clearTimeout(deadline);reject(new ProviderFailure('unavailable'));});
   res.on('end',()=>{clearTimeout(deadline);if(res.statusCode===429){reject(new ProviderFailure('quota'));return;}try{
    const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if(res.statusCode!==200){reject(new ProviderFailure(data?.error?.code===2007?'quota':'unavailable'));return;}
    resolve(data);
   }catch{reject(new ProviderFailure('unavailable'));}});
  });
  const deadline=setTimeout(()=>{req.destroy();reject(new ProviderFailure('unavailable'));},5000);
  req.on('error',()=>{clearTimeout(deadline);reject(new ProviderFailure('unavailable'));});req.end();
 });
}
export async function findLocations(address:Pick<LocationRow,'city'|'postal_code'|'country'>):Promise<Candidate[]>{
 const country=new Intl.DisplayNames(['en'],{type:'region'}).of(address.country)??address.country;
 const query=[address.city,country].filter(Boolean).join(' ');
 let candidates=parseCandidates(await providerRequest('search',query));
 if(!candidates.length)candidates=parseCandidates(await providerRequest('search',address.city));
 const aliases:Record<string,string[]>={US:['United States of America','USA'],GB:['UK','Great Britain'],KR:['South Korea'],RU:['Russian Federation']};
 const allowed=[country,...aliases[address.country]??[]].map(s=>s.toLowerCase());
 return candidates.filter(c=>allowed.includes(c.country.toLowerCase()));
}
export async function locationTimezone(candidate:Candidate){
 const data=await providerRequest('timezone',`${candidate.lat},${candidate.lon}`) as {location?:{tz_id?:unknown}};
 const tz=data?.location?.tz_id;if(!validTimezone(tz))throw new ProviderFailure('unavailable');return tz;
}
export async function fetchForecast(latitude:number,longitude:number){
 const data=parseForecast(await providerRequest('forecast',`${latitude},${longitude}`));
 if(!data)throw new ProviderFailure('unavailable');return data;
}
