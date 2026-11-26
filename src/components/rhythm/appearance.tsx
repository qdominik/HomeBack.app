'use client';
import {createContext,useCallback,useContext,useEffect,useId,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {daylight} from '@/lib/ui/daylight';
import {startMinuteClock} from '@/lib/ui/minute-clock';
const phaseHours=[5.75,8,13,18,23];
import {t,activeLocale} from '@/lib/i18n';
import {Select} from '@/components/ui/select';
import {renderWeatherScene,sceneSky} from './weather-scene';
import {getAtmosphere} from '@/app/(app)/settings/appearance-actions';
import {currentConditions,weatherKind} from '@/lib/weather/model';
import type {Atmosphere,Preferences,WeatherKind} from '@/lib/weather/contracts';

const c=t.rhythm,copy=t.weatherSettings;
export const phaseLabels=[c.dawn,c.morning,c.day,c.evening,c.night];
export const weatherLabels={none:c.none,clear:c.clear,cloud:c.cloud,rain:c.rain,fog:c.fog,snow:c.snow,storm:c.storm};
export type AppearancePreview={preferences:Preferences;phase:number;weather:WeatherKind|'live'};
type ContextValue={data:Atmosphere;phase:number;theme:string;weather:WeatherKind;windy:boolean;sample:boolean;now:number;preferences:Preferences;setPreview:(value:AppearancePreview|null)=>void;commit:(value:Preferences)=>void;refresh:()=>Promise<Atmosphere>};
const Context=createContext<ContextValue|null>(null);
export function useAppearance(){const value=useContext(Context);if(!value)throw new Error('AppearanceProvider required');return value;}

const tokenRoles=['background','surface','surface-muted','foreground','foreground-secondary','foreground-muted','placeholder','control-border','line','primary','primary-hover','primary-strong','on-primary','focus','success','warning','danger','danger-graphic','info','accent-text','primary-graphic'];
function applyPalette(hour:number,preferences:Preferences){
 const root=document.documentElement,resolved=daylight(preferences.mode==='light'?13:hour,preferences.mode);
 root.dataset.theme=resolved.theme;root.dataset.motion=preferences.motion?'on':'off';root.dataset.rhythmPhase=['dawn','morning','noon','evening','night'][daylight(hour,'auto').phase];
 for(const name of tokenRoles)root.style.removeProperty(`--${name}`);
 for(const [name,value] of Object.entries(resolved.styles))root.style.setProperty(name,value);
}
export function AppearanceProvider({initial,children}:{initial:Atmosphere;children:ReactNode}){
 const [data,setData]=useState(initial),[preview,setPreview]=useState<AppearancePreview|null>(null),[now,setNow]=useState(initial.renderedAt),[dev,setDev]=useState(false),[ready,setReady]=useState(false);
 const pending=useRef(false),lastFetch=useRef(0);
 const refresh=useCallback(async()=>{
  if(pending.current)return data;
  pending.current=true;
  try{const next=await getAtmosphere();if(next.userId===initial.userId){setData(next);lastFetch.current=Date.now();}return next;}
  finally{pending.current=false;}
 },[initial.userId,data]);
 useEffect(()=>{
  const frame=requestAnimationFrame(()=>{setNow(Date.now());setReady(true);setDev(process.env.NODE_ENV==='development'&&new URLSearchParams(location.search).get('rhythmPreview')==='1');});
  return()=>cancelAnimationFrame(frame);
 },[]);
 useEffect(()=>{
  const tick=()=>{
   if(document.hidden||!initial.userId)return;
   const interval=data.weather.status==='pending'?30000:data.weather.status==='unavailable'?120000:30*60000;
   const due=Math.min(lastFetch.current+interval,data.weather.snapshot?data.weather.snapshot.fetchedAt+45*60000+5000:Infinity);
   if(Date.now()>=due)void refresh().catch(()=>{lastFetch.current=Date.now();setData(d=>({...d,weather:{status:'unavailable',snapshot:null}}));});
  };
  const timer=setInterval(tick,30000);document.addEventListener('visibilitychange',tick); tick();
  return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',tick);};
 },[refresh,data.weather.status,data.weather.snapshot,initial.userId]);
 useEffect(()=>{const clock=startMinuteClock(()=>setNow(Date.now()),{now:()=>Date.now(),setTimeout:(cb,ms)=>window.setTimeout(cb,ms),clearTimeout:id=>window.clearTimeout(id)});document.addEventListener('visibilitychange',clock.update);window.addEventListener('focus',clock.update);return()=>{clock.stop();document.removeEventListener('visibilitychange',clock.update);window.removeEventListener('focus',clock.update);};},[]);
 const preferences=preview?.preferences??data.preferences;
 const hour=preview&&preview.phase>=0?phaseHours[preview.phase]:new Date(now).getHours()+new Date(now).getMinutes()/60;
 const resolved={...daylight(preferences.mode==='light'?13:hour,preferences.mode),phase:daylight(hour,'auto').phase};
 const conditions=data.weather.snapshot?currentConditions(data.weather.snapshot,now):null;
 const sample=Boolean(preview&&preview.weather!=='live');
 const weather=preferences.weatherEnabled?(sample?preview!.weather as WeatherKind:weatherKind(conditions)):'none';
 const windy=preferences.weatherEnabled&&!sample&&Boolean(conditions&&conditions.wind>=25);
 useEffect(()=>{if(ready)applyPalette(hour,preferences);},[hour,preferences,ready,data.location?.timezone]);

 const commit=useCallback((preferences:Preferences)=>{setData(d=>({...d,preferences}));setPreview(null);},[]);
 return <Context.Provider value={{data,phase:resolved.phase,theme:resolved.theme,weather,windy,sample,now,preferences,setPreview,commit,refresh}}>
  {dev?<details open className="rhythm-preview"><summary>{c.preview}</summary><DevPreview/></details>:null}
  {children}
 </Context.Provider>;
}
function DevPreview(){
 const {data,setPreview}=useAppearance();
 const [preferences,setPreferences]=useState(data.preferences),[phase,setPhase]=useState(-1),[weather,setWeather]=useState<WeatherKind|'live'>('live');
 function update(p:Preferences,n:number,w:WeatherKind|'live'){setPreferences(p);setPhase(n);setWeather(w);setPreview({preferences:p,phase:n,weather:w});}
 return <div className="rhythm-controls"><AppearanceControls value={preferences} onChange={p=>update(p,phase,weather)}/><label>{c.phase}<Select value={phase} onChange={e=>update(preferences,Number(e.target.value),weather)}><option value={-1}>{c.now}</option>{phaseLabels.map((v,i)=><option value={i} key={v}>{v}</option>)}</Select></label><label>{c.weather}<Select value={weather} onChange={e=>update(preferences,phase,e.target.value as WeatherKind|'live')}><option value="live">{c.now}</option>{Object.entries(weatherLabels).map(([k,v])=><option value={k} key={k}>{v}</option>)}</Select></label></div>;
}
export function AppearanceControls({value,onChange,disabled=false}:{value:Preferences;onChange:(value:Preferences)=>void;disabled?:boolean}){
 return <div className="rhythm-controls"><label>{c.appearance}<Select disabled={disabled} value={value.mode} onChange={e=>onChange({...value,mode:e.target.value as Preferences['mode']})}>{(['auto','light','dark'] as const).map(mode=><option value={mode} key={mode}>{c[mode]}</option>)}</Select></label><label className="rhythm-motion"><input type="checkbox" role="switch" disabled={disabled} checked={value.weatherEnabled} onChange={e=>onChange({...value,weatherEnabled:e.target.checked})}/>{copy.enabled}</label><label className="rhythm-motion"><input type="checkbox" role="switch" disabled={disabled} checked={value.motion} onChange={e=>onChange({...value,motion:e.target.checked})}/>{c.motion}</label><label>{copy.intensity}<Select disabled={disabled} value={value.intensity} onChange={e=>onChange({...value,intensity:e.target.value as Preferences['intensity']})}><option value="subtle">{copy.subtle}</option><option value="standard">{copy.standard}</option></Select></label></div>;
}
export function AmbientScene(){
 const {data,now,sample,phase,theme,weather,windy,preferences}=useAppearance(),id=useId(),scene=useRef<HTMLDivElement>(null),sky=sceneSky(phase,theme==='dark',weather);
 const conditions=!sample&&data.weather.snapshot?currentConditions(data.weather.snapshot,now):null;
 const temperature=conditions?`${Math.round(conditions.temperature)} °C`:'— °C';
 useEffect(()=>{const node=scene.current;if(!node)return;let visible=true;const update=()=>{node.dataset.running=String(visible&&!document.hidden);};const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;update();});observer.observe(node);document.addEventListener('visibilitychange',update);update();return()=>{observer.disconnect();document.removeEventListener('visibilitychange',update);};},[]);
 return <div className="rhythm-landscape"><div ref={scene} className="ambient-scene-host" data-phase={['dawn','morning','noon','evening','night'][phase]} data-theme={theme} data-weather={weather} data-windy={windy} data-intensity={preferences.intensity} aria-hidden="true" style={{'--sky-a':sky[0],'--sky-b':sky[1]} as CSSProperties} dangerouslySetInnerHTML={{__html:renderWeatherScene(weather,id)}}/>
  <p className="rhythm-temperature" title={conditions?undefined:sample?c.sample:copy.temperatureUnavailable}><span className="rhythm-temperature-label">{copy.temperature}</span><span className="rhythm-temperature-value">{temperature}</span></p>
 </div>;
}
export function WeatherCaption({showAttribution=true}:{showAttribution?:boolean}){
 const {data,weather,sample,preferences,now,windy}=useAppearance();
 const conditions=data.weather.snapshot?currentConditions(data.weather.snapshot,now):null;
 const status=data.weather.status==='ready'&&!conditions?'stale':data.weather.status;
 const caption=!preferences.weatherEnabled?copy.disabled:sample?weatherLabels[weather]:status==='ready'?weatherLabels[weather]:conditions?copy.currentWeather:copy.status[status];
 return <><h2 className="font-display text-section-title">{caption}</h2>{sample?<p className="text-sm text-muted">{c.sample}</p>:conditions?<div className="text-sm text-muted"><p>{data.location?.name}, {data.location?.provider_country} {windy?`· ${copy.wind} ${Math.round(conditions.wind)} km/h`:''}</p>{showAttribution?<p className="mt-1"><a className="underline" href="https://www.weatherapi.com/" target="_blank" rel="noreferrer">{copy.source}</a> · {copy.updated}: {new Intl.DateTimeFormat(activeLocale,{timeZone:data.location?.timezone??undefined,hour:'2-digit',minute:'2-digit'}).format(conditions.epoch)}</p>:null}</div>:null}</>;
}
export function RhythmWelcome({count}:{count:{kind:'error'}|{kind:'success';data:number}}){
 const {phase}=useAppearance();return <section className="rhythm-welcome" aria-label={c.title}><AmbientScene/><div className="rhythm-caption"><p className="text-meta text-muted">{c.title} · {phaseLabels[phase]}</p><WeatherCaption showAttribution={false}/><p className="mt-3">{count.kind==='success'?<a className="underline" href="/items?view=unlocated">{c.unlocated}: {count.data}</a>:c.failed}</p></div></section>;
}
