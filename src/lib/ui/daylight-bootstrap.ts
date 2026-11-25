import { daylight } from "./daylight";

// Run the same self-contained resolver before paint and after hydration.
// Only fixed application code is embedded; no user input is interpolated.
export const daylightBootstrap = `(()=>{const now=new Date(),result=(${daylight.toString()})(now.getHours()+now.getMinutes()/60,"auto"),root=document.documentElement;root.dataset.theme=result.theme;root.dataset.rhythmPhase=["dawn","morning","noon","evening","night"][result.phase];for(const [name,value] of Object.entries(result.styles))root.style.setProperty(name,value)})()`;
