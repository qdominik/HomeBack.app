'use server';
import {getAppContext} from '@/lib/app-context';
import {revalidatePath} from 'next/cache';
import {loadAtmosphere,preferencesFromRow} from '@/lib/weather/server';
import {parsePreferences} from '@/lib/weather/contracts';
import {resolveCountry} from '@/lib/weather/countries';
import type {Candidate,LocationRow,MutationResult,Preferences} from '@/lib/weather/contracts';
import {findLocations,locationTimezone,ProviderFailure} from '@/lib/weather/weatherapi';

export async function getAtmosphere(){return loadAtmosphere();}
export async function saveAppearance(input:unknown,revision:number):Promise<MutationResult<Preferences>>{
 const values=parsePreferences(input);if(!values||!Number.isSafeInteger(revision)||revision<0)return {ok:false,error:'invalid'};
 const {supabase,profile,userId}=await getAppContext();if(!userId||profile?.status!=='aktywny')return {ok:false,error:'unauthorized'};
 const row={mode:values.mode,motion:values.motion,weather_enabled:values.weatherEnabled,intensity:values.intensity};
 const query=revision===0?supabase.from('profile_appearance_preferences').insert({...row,profil_id:userId,household_id:profile.household_id}):supabase.from('profile_appearance_preferences').update(row).eq('profil_id',userId).eq('revision',revision);
 const {data,error}=await query.select().maybeSingle();
 if(error||!data)return {ok:false,error:error?.code==='23505'||!error?'conflict':'unavailable'};
 revalidatePath('/settings');return {ok:true,data:preferencesFromRow(data)};
}
export async function saveHouseholdAddress(input:unknown,revision:number):Promise<MutationResult<LocationRow>>{
 if(!input||typeof input!=='object'||!Number.isSafeInteger(revision)||revision<0)return {ok:false,error:'invalid'};
 const v=input as Record<string,unknown>;
 if(typeof v.city!=='string'||typeof v.postal_code!=='string'||typeof v.country!=='string')return {ok:false,error:'invalid'};
 const city=v.city.trim(),postal_code=v.postal_code.trim(),country=resolveCountry(v.country);
 if(!city||city.length>120||postal_code.length>20||!country||/[\p{C}]/u.test(city+postal_code))return {ok:false,error:'invalid'};
 const {supabase,profile,userId}=await getAppContext();if(!userId||profile?.status!=='aktywny')return {ok:false,error:'unauthorized'};
 if(profile.rola!=='admin')return {ok:false,error:'forbidden'};
 const row={city,postal_code,country,provider_id:null,name:null,region:null,provider_country:null,latitude:null,longitude:null,timezone:null};
 const query=revision===0?supabase.from('household_weather_location').insert({...row,household_id:profile.household_id}):supabase.from('household_weather_location').update(row).eq('household_id',profile.household_id).eq('revision',revision);
 const {data,error}=await query.select().maybeSingle();
 if(error||!data)return {ok:false,error:error?.code==='23505'||!error?'conflict':'unavailable'};
 revalidatePath('/settings');return {ok:true,data};
}
export async function getLocationCandidates(revision:number):Promise<MutationResult<Candidate[]>>{
 if(!Number.isSafeInteger(revision)||revision<1)return {ok:false,error:'invalid'};
 const {supabase,profile,userId}=await getAppContext();if(!userId||profile?.status!=='aktywny')return {ok:false,error:'unauthorized'};
 if(profile.rola!=='admin')return {ok:false,error:'forbidden'};
 const {data,error}=await supabase.from('household_weather_location').select('*').eq('household_id',profile.household_id).maybeSingle();
 if(error||!data)return {ok:false,error:'unavailable'};
 if(data.revision!==revision)return {ok:false,error:'conflict'};
 try{return {ok:true,data:await findLocations(data)};}catch(e){return {ok:false,error:e instanceof ProviderFailure&&e.reason==='missing_key'?'missing_key':'unavailable'};}
}
export async function confirmWeatherLocation(id:number,revision:number):Promise<MutationResult<LocationRow>>{
 if(!Number.isSafeInteger(id)||!Number.isSafeInteger(revision))return {ok:false,error:'invalid'};
 const matches=await getLocationCandidates(revision);if(!matches.ok)return matches;
 const candidate=matches.data.find(c=>c.id===id);if(!candidate)return {ok:false,error:'invalid'};
 const {supabase,profile}=await getAppContext();if(!profile||profile.rola!=='admin'||profile.status!=='aktywny')return {ok:false,error:'forbidden'};
 try{
  const timezone=await locationTimezone(candidate);
  const {data,error}=await supabase.from('household_weather_location').update({provider_id:candidate.id,name:candidate.name,region:candidate.region,provider_country:candidate.country,latitude:candidate.lat,longitude:candidate.lon,timezone}).eq('household_id',profile.household_id).eq('revision',revision).select().maybeSingle();
  if(error||!data)return {ok:false,error:error?'unavailable':'conflict'};
  revalidatePath('/settings');return {ok:true,data};
 }catch{return {ok:false,error:'unavailable'};}
}
export async function removeWeatherLocation(revision:number):Promise<MutationResult<null>>{
 if(!Number.isSafeInteger(revision)||revision<1)return {ok:false,error:'invalid'};
 const {supabase,profile,userId}=await getAppContext();if(!userId||profile?.status!=='aktywny')return {ok:false,error:'unauthorized'};
 if(profile.rola!=='admin')return {ok:false,error:'forbidden'};
 const {data,error}=await supabase.from('household_weather_location').delete().eq('household_id',profile.household_id).eq('revision',revision).select('household_id');
 if(error||!data?.length)return {ok:false,error:error?'unavailable':'conflict'};
 revalidatePath('/settings');return {ok:true,data:null};
}
