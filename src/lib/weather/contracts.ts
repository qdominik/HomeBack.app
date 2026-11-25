import type { Appearance } from '../ui/daylight';

export type WeatherKind = 'none'|'clear'|'cloud'|'rain'|'snow'|'fog'|'storm';
export type Preferences = {mode:Appearance; weatherEnabled:boolean; motion:boolean; intensity:'subtle'|'standard'; revision:number};
export const defaultPreferences:Preferences={mode:'auto',weatherEnabled:true,motion:true,intensity:'subtle',revision:0};
export type LocationRow={household_id:string;city:string;postal_code:string;country:string;revision:number;provider_id:number|null;name:string|null;region:string|null;provider_country:string|null;latitude:number|null;longitude:number|null;timezone:string|null;updated_at:string};
export type PreferenceRow={profil_id:string;household_id:string;mode:Appearance;weather_enabled:boolean;motion:boolean;intensity:'subtle'|'standard';revision:number;updated_at:string};
export type Candidate={id:number;name:string;region:string;country:string;lat:number;lon:number};
export type Conditions={epoch:number;code:number;temperature:number;wind:number;precipitation:number};
export type Snapshot={fetchedAt:number;timezone:string;current:Conditions;hours:Conditions[];solar:{date:string;sunrise:number|null;sunset:number|null}};
export type WeatherStatus='ready'|'no_location'|'missing_key'|'cache_unavailable'|'unavailable'|'stale'|'pending'|'database_unavailable';
export type WeatherResult={status:WeatherStatus;snapshot:Snapshot|null};
export type Atmosphere={renderedAt:number;userId:string;preferences:Preferences;location:LocationRow|null;canEditLocation:boolean;weather:WeatherResult;preferencesAvailable:boolean};
export type MutationResult<T>={ok:true;data:T}|{ok:false;error:'unauthorized'|'forbidden'|'invalid'|'conflict'|'unavailable'|'missing_key'};

export function parsePreferences(value:unknown):Omit<Preferences,'revision'>|null {
 if(!value||typeof value!=='object')return null;
 const v=value as Record<string,unknown>;
 if(typeof v.mode!=='string'||!['auto','light','dark'].includes(v.mode)||typeof v.intensity!=='string'||!['subtle','standard'].includes(v.intensity)||typeof v.motion!=='boolean'||typeof v.weatherEnabled!=='boolean')return null;
 return {mode:v.mode as Appearance,intensity:v.intensity as Preferences['intensity'],motion:v.motion,weatherEnabled:v.weatherEnabled};
}
export function validTimezone(value:unknown):value is string {
 if(typeof value!=='string'||value.length>100)return false;
 try{new Intl.DateTimeFormat('en',{timeZone:value});return true;}catch{return false;}
}
