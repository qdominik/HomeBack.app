import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {getAppContext} from '@/lib/app-context';
import {getSupabaseConfig} from '@/lib/supabase/config';
import type {Database,Json} from '@/types/database';
import {defaultPreferences} from './contracts';
import type {Atmosphere,LocationRow,Preferences,PreferenceRow,Snapshot,WeatherResult} from './contracts';
import {currentConditions,weatherKind} from './model';
import {fetchForecast,ProviderFailure} from './weatherapi';

export function preferencesFromRow(row:PreferenceRow|null):Preferences{
 return row?{mode:row.mode,motion:row.motion,weatherEnabled:row.weather_enabled,intensity:row.intensity,revision:row.revision}:{...defaultPreferences};
}
export async function weatherForLocation(location:LocationRow|null):Promise<WeatherResult>{
 const fail=(status:WeatherResult['status']):WeatherResult=>({status,snapshot:null});
 if(!location?.timezone||location.latitude===null||location.longitude===null)return fail('no_location');
 if(!process.env.WEATHERAPI_KEY?.trim())return fail('missing_key');
 const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();if(!serviceKey)return fail('cache_unavailable');
 const {url}=getSupabaseConfig();
 const service=createClient<Database>(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(5000)})}});
 const cacheKey=`${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`;
 try{
  const {data,error}=await service.rpc('weather_cache_claim',{p_key:cacheKey});
  if(error||!data||typeof data!=='object'||Array.isArray(data))return fail('cache_unavailable');
  let snapshot:Snapshot;
  if(data.kind==='cached')snapshot=data.payload as unknown as Snapshot;
  else if(data.kind==='claimed'&&typeof data.token==='string'){
   try{
    snapshot=await fetchForecast(location.latitude,location.longitude);
    const finished=await service.rpc('weather_cache_finish',{p_key:cacheKey,p_token:data.token,p_payload:snapshot as unknown as Json,p_retry_seconds:120});
    if(finished.error||!finished.data)return fail('unavailable');
   }catch(error){
    await service.rpc('weather_cache_finish',{p_key:cacheKey,p_token:data.token,p_payload:null,p_retry_seconds:error instanceof ProviderFailure&&error.reason==='quota'?600:120});
    return fail('unavailable');
   }
  }else return fail('pending');
  if(snapshot.timezone!==location.timezone||!currentConditions(snapshot))return fail('stale');
  // An unsupported landscape code does not invalidate a fresh temperature or solar data.
  if(weatherKind(currentConditions(snapshot))==='none')return {status:'unavailable',snapshot};
  return {status:'ready',snapshot};
 }catch{return fail('unavailable');}
}
export async function loadAtmosphere():Promise<Atmosphere>{
 const {supabase,profile,userId}=await getAppContext();
 const base:Atmosphere={renderedAt:Date.now(),userId:userId??'',preferences:{...defaultPreferences},location:null,canEditLocation:false,weather:{status:'database_unavailable',snapshot:null},preferencesAvailable:false};
 if(!userId||!profile||profile.status!=='aktywny')return base;
 const [pref,loc]=await Promise.all([
  supabase.from('profile_appearance_preferences').select('*').eq('profil_id',userId).maybeSingle(),
  supabase.from('household_weather_location').select('*').eq('household_id',profile.household_id).maybeSingle(),
 ]);
 const preferences=preferencesFromRow(pref.data);
 const location=loc.data;
 let weather:WeatherResult=loc.error?base.weather:{status:'no_location',snapshot:null};
 if(!loc.error&&preferences.weatherEnabled)weather=await weatherForLocation(location);
 // An address edit during an outbound request invalidates that response.
 if(location){const latest=await supabase.from('household_weather_location').select('revision').eq('household_id',profile.household_id).maybeSingle();if(latest.error||latest.data?.revision!==location.revision)return {...base,preferences,preferencesAvailable:!pref.error,canEditLocation:profile.rola==='admin',weather:{status:'pending',snapshot:null}};}
 return {renderedAt:Date.now(),userId,preferences,preferencesAvailable:!pref.error,location,canEditLocation:profile.rola==='admin',weather};
}

export async function loadInitialAtmosphere():Promise<Atmosphere>{
 const {supabase,profile,userId}=await getAppContext();
 const base:Atmosphere={renderedAt:Date.now(),userId:userId??'',preferences:{...defaultPreferences},location:null,canEditLocation:false,weather:{status:'no_location',snapshot:null},preferencesAvailable:false};
 if(!userId||!profile||profile.status!=='aktywny')return base;
 const {data,error}=await supabase.from('profile_appearance_preferences').select('*').eq('profil_id',userId).maybeSingle();
 return {...base,preferences:preferencesFromRow(data),preferencesAvailable:!error,canEditLocation:profile.rola==='admin'};
}
