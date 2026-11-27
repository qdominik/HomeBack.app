import { daylight } from "./daylight";

// Run the same self-contained resolver before paint and after hydration.
// Only fixed application code is embedded; no user input is interpolated.
export const daylightBootstrap = `(()=>{const now=new Date(),result=(${daylight.toString()})(now.getHours()+now.getMinutes()/60,"auto"),root=document.documentElement;root.dataset.theme=result.theme;root.dataset.rhythmPhase=["dawn","morning","noon","evening","night"][result.phase];for(const [name,value] of Object.entries(result.styles))root.style.setProperty(name,value)})()`;

// Preferences are server-validated; the same resolver also drives the hydrated clock.
export function appearanceBootstrap(mode: "auto" | "light" | "dark", motion: boolean) {
  return `(()=>{const now=new Date(),mode=${JSON.stringify(mode)},clock=now.getHours()+now.getMinutes()/60,resolve=(${daylight.toString()}),result=resolve(mode==="light"?13:clock,mode),root=document.documentElement;root.dataset.theme=result.theme;root.dataset.motion=${JSON.stringify(motion ? "on" : "off")};root.dataset.rhythmPhase=["dawn","morning","noon","evening","night"][resolve(clock,"auto").phase];for(const [name,value] of Object.entries(result.styles))root.style.setProperty(name,value)})()`;
}
