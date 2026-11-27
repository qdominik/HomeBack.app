import type {Conditions,LocationRow} from '../../lib/weather/contracts';

type DetailsCopy={source:string;updated:string;wind:string};
export function WeatherDetails({conditions,location,windy,showAttribution,copy,locale}:{conditions:Conditions;location:LocationRow|null;windy:boolean;showAttribution:boolean;copy:DetailsCopy;locale:string}){
 return <div className="text-sm text-muted"><p>{location?.name}, {location?.provider_country} {windy?`· ${copy.wind} ${Math.round(conditions.wind)} km/h`:''}</p>{showAttribution?<p className="mt-1"><a className="underline" href="https://www.weatherapi.com/" target="_blank" rel="noreferrer">{copy.source}</a> · {copy.updated}: {new Intl.DateTimeFormat(locale,{timeZone:location?.timezone??undefined,hour:'2-digit',minute:'2-digit'}).format(conditions.epoch)}</p>:null}</div>;
}
