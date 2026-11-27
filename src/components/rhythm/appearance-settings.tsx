'use client';
import {useEffect,useId,useState,useTransition} from 'react';
import {AppearanceControls,AmbientScene,WeatherCaption,WeatherInformation,phaseLabels,weatherLabels,useAppearance} from './appearance';
import {Button} from '@/components/ui/button';
import {Select} from '@/components/ui/select';
import {Input} from '@/components/ui/input';
import {Card} from '@/components/ui/card';
import {t} from '@/lib/i18n';
import {saveAppearance,saveHouseholdAddress,getLocationCandidates,confirmWeatherLocation,removeWeatherLocation} from '@/app/(app)/settings/appearance-actions';
import type {Candidate,LocationRow,Preferences,WeatherKind} from '@/lib/weather/contracts';
const c=t.weatherSettings;

export function AppearanceSettings(){
 const {data,setPreview,commit,refresh}=useAppearance();
 const [draft,setDraft]=useState(data.preferences),[phase,setPhase]=useState(-1),[weather,setWeather]=useState<WeatherKind|'live'>('live'),[message,setMessage]=useState(''),[pending,start]=useTransition();
 useEffect(()=>()=>setPreview(null),[setPreview]);
 function preview(p:Preferences,n=phase,w=weather){setDraft(p);setPhase(n);setWeather(w);setPreview({preferences:p,phase:n,weather:w});}
 return <div className="space-y-6">
  <Card className="space-y-5 p-4 sm:p-6"><h2 className="font-display text-section-title">{t.rhythm.appearance}</h2><p className="text-sm text-muted">{c.description}</p>
   <form className="space-y-5" onSubmit={e=>{e.preventDefault();start(async()=>{try{const result=await saveAppearance(draft,draft.revision);if(result.ok){commit(result.data);setDraft(result.data);setPhase(-1);setWeather('live');setMessage(c.saved);await refresh();}else setMessage(c.error[result.error]);}catch{setMessage(c.error.unavailable);}});}}>
    <AppearanceControls disabled={pending} value={draft} onChange={p=>preview(p)}/>
    <fieldset className="grid gap-3 sm:grid-cols-2"><legend className="mb-2 text-sm font-semibold">{t.rhythm.preview}</legend>
     <label className="ui-label">{t.rhythm.phase}<Select disabled={pending} value={phase} onChange={e=>preview(draft,Number(e.target.value))}><option value={-1}>{t.rhythm.now}</option>{phaseLabels.map((label,i)=><option key={label} value={i}>{label}</option>)}</Select></label>
     <label className="ui-label">{t.rhythm.weather}<Select disabled={pending} value={weather} onChange={e=>preview(draft,phase,e.target.value as WeatherKind|'live')}><option value="live">{t.rhythm.now}</option>{Object.entries(weatherLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</Select></label>
    </fieldset><p className="text-sm text-muted">{c.previewHint}</p>
    <div className="flex flex-wrap gap-3"><Button disabled={pending||!data.preferencesAvailable} type="submit">{pending?c.saving:c.save}</Button><Button disabled={pending} variant="secondary" onClick={()=>{setDraft(data.preferences);setPhase(-1);setWeather('live');setPreview(null);setMessage('');}}>{c.cancel}</Button><Button disabled={pending} variant="ghost" onClick={()=>start(async()=>{try{const next=await refresh();setDraft(next.preferences);setPreview(null);setMessage('');}catch{setMessage(c.error.unavailable);}})}>{c.reload}</Button></div>
    <p role="status" className="text-sm text-foreground">{message||(!data.preferencesAvailable?c.status.database_unavailable:'')}</p>
   </form>
  </Card>
  <section className="rhythm-welcome" aria-label={t.rhythm.preview}><AmbientScene/><div className="rhythm-caption"><WeatherCaption/></div></section>
  <WeatherInformation/>
  <LocationSettings/>
 </div>;
}

export function LocationSettings({addressEditor=false}:{addressEditor?:boolean}){
 const {data,refresh}=useAppearance();
 const [locationDraft,setLocation]=useState<LocationRow|null|undefined>(undefined),[cityDraft,setCity]=useState<string|undefined>(undefined),[postalDraft,setPostal]=useState<string|undefined>(undefined),[countryDraft,setCountry]=useState<string|undefined>(undefined),[candidates,setCandidates]=useState<Candidate[]|null>(null),[selected,setSelected]=useState<number|null>(null),[message,setMessage]=useState(''),[pending,start]=useTransition();
 const fieldId=useId();
 const allowed=data.canEditLocation;
 const location=locationDraft===undefined?data.location:locationDraft;
 const city=cityDraft??data.location?.city??'',postal=postalDraft??data.location?.postal_code??'',country=countryDraft??data.location?.country??'';
 function clearSelection(){setCandidates(null);setSelected(null);setMessage('');}
 function accept(row:LocationRow|null){setLocation(row);setCity(row?.city??'');setPostal(row?.postal_code??'');setCountry(row?.country??'');clearSelection();}
 async function lookup(row:LocationRow){clearSelection();const result=await getLocationCandidates(row.revision);if(result.ok){setCandidates(result.data);setMessage(result.data.length?'':c.noMatches);}else{setCandidates(null);setMessage(c.error[result.error]);}}
 function run(action:()=>Promise<void>){start(async()=>{setMessage('');try{await action();}catch{setMessage(c.error.unavailable);}});}
 return <Card className="space-y-4 p-4 sm:p-6">
  <h2 className="font-display text-section-title">{addressEditor?c.householdAddress:c.location}</h2>
  <p>{location?.name?[location.name,location.region,location.provider_country].filter(Boolean).join(', '):c.unknown}</p>
  {location?.timezone?<p className="text-sm text-muted">{location.timezone}</p>:null}
  <p className="text-sm leading-6 text-muted">{c.addressInfo}</p>
  {addressEditor&&allowed?<form className="space-y-4" onSubmit={e=>{e.preventDefault();run(async()=>{const result=await saveHouseholdAddress({city,postal_code:postal,country},location?.revision??0);if(result.ok){accept(result.data);await refresh();await lookup(result.data);}else setMessage(c.error[result.error]);});}}>
   <div className="grid gap-3 sm:grid-cols-3"><label className="ui-label">{c.city}<Input disabled={pending} name="city" value={city} required maxLength={120} autoComplete="address-level2" onChange={e=>{setCity(e.target.value);clearSelection();}}/></label><label className="ui-label">{c.postal}<Input disabled={pending} name="postal_code" value={postal} maxLength={20} autoComplete="postal-code" onChange={e=>{setPostal(e.target.value);clearSelection();}}/></label><label className="ui-label">{c.country}<Input disabled={pending} name="country" value={country} required maxLength={120} autoComplete="country-name" aria-describedby={`${fieldId}-country-hint`} onChange={e=>{setCountry(e.target.value);clearSelection();}}/></label></div>
   <p id={`${fieldId}-country-hint`} className="text-sm text-muted">{c.countryHint}</p><Button disabled={pending} type="submit">{pending?c.saving:c.saveAddress}</Button>
  </form>:!allowed?<p className="text-sm text-muted">{c.editNotAllowed}</p>:null}
  {allowed?<div className="flex flex-wrap gap-3">
   {location?<><Button disabled={pending} variant="secondary" onClick={()=>run(()=>lookup(location))}>{addressEditor?c.findLocation:c.editLocation}</Button><Button disabled={pending} variant="ghost" onClick={()=>run(async()=>{const result=await removeWeatherLocation(location.revision);if(result.ok){accept(null);setCandidates(null);await refresh();}else setMessage(c.error[result.error]);})}>{c.removeLocation}</Button></>:<a className="min-h-11 py-3 text-sm text-primary underline" href="/settings">{c.householdAddress}</a>}
   <Button disabled={pending} variant="ghost" onClick={()=>run(async()=>{const next=await refresh();accept(next.location);setCandidates(null);})}>{c.reload}</Button>
  </div>:null}
  {candidates?.length?<form onSubmit={e=>{e.preventDefault();if(selected===null||!location)return;run(async()=>{const result=await confirmWeatherLocation(selected,location.revision);if(result.ok){accept(result.data);await refresh();setMessage(c.locationSaved);}else setMessage(c.error[result.error]);});}} className="space-y-4">
   <fieldset disabled={pending} aria-describedby={`${fieldId}-selection-hint`} className="space-y-3"><legend className="mb-2 font-semibold">{c.chooseLocation}</legend>{candidates.map(candidate=><label className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-control border p-3 ${selected===candidate.id?'border-primary bg-surface-muted':'border-line bg-surface'}`} key={candidate.id}><input type="radio" name={`${fieldId}-town`} value={candidate.id} checked={selected===candidate.id} onChange={()=>setSelected(candidate.id)} className="h-5 w-5 shrink-0 accent-primary"/><span>{[candidate.name,candidate.region,candidate.country].filter(Boolean).join(', ')}</span></label>)}</fieldset>
   <p id={`${fieldId}-selection-hint`} className="text-sm text-muted">{c.selectionHint}</p>
   <Button type="submit" disabled={pending||selected===null}>{pending?c.saving:c.confirmLocation}</Button>
  </form>:null}
  <p role="status" className="text-sm text-foreground">{message}</p>
 </Card>;
}
