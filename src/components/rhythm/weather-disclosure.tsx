import {currentConditions} from '../../lib/weather/model';
import type {Snapshot} from '../../lib/weather/contracts';

export function hasLiveWeather(snapshot:Snapshot|null,now:number,sample:boolean):boolean {
 return !sample && snapshot!==null && currentConditions(snapshot,now)!==null;
}

type DisclosureCopy={disclosureTitle:string;disclosureSource:string;disclosure:string};
export function WeatherDisclosure({visible,copy}:{visible:boolean;copy:DisclosureCopy}){
 if(!visible)return null;
 return <section aria-label={copy.disclosureTitle} className="rounded-card border border-line bg-surface px-4 py-4 text-sm leading-6 text-foreground sm:px-6">
  <p><a className="text-primary underline" href="https://www.weatherapi.com/" target="_blank" rel="noreferrer">{copy.disclosureSource}</a></p>
  <p className="mt-2">{copy.disclosure}</p>
 </section>;
}
