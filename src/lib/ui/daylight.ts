// UI-01 approved B, including the corrected evening transition.
export type Appearance = "auto" | "light" | "dark";
export function daylight(hour:number,mode:Appearance){
const palette={backgrounds:["#f4e4cb","#f6eddc","#f5f5f2","#eedbbd","#122b29"],surfaces:["#fff6e5","#fffbf2","#ffffff","#fff4df","#193431"],muted:["#ecdbc1","#ece5d8","#ebede7","#e6d5b9","#294a40"]};
const fromSrgb=(v: number)=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
const toSrgb=(v: number)=>Math.max(0,Math.min(1,v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055));
function toLab(hex: string){
  const values=hex.startsWith('#')?hex.slice(1).match(/../g)!.map(v=>parseInt(v,16)):hex.match(/[\d.]+/g)!.map(Number);
  const [r,g,b]=values.map(v=>fromSrgb(v/255));
  const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b);
  const m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b);
  const s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
  return [.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s];
}
function mix(a: string,b: string,t: number){
  const start=toLab(a),end=toLab(b),[L,A,B]=start.map((v,i)=>v+(end[i]-v)*t);
  const l=(L+.3963377774*A+.2158037573*B)**3,m=(L-.1055613458*A-.0638541728*B)**3,s=(L-.0894841775*A-1.291485548*B)**3;
  return `rgb(${[4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s].map(v=>Math.round(toSrgb(v)*255)).join(' ')})`;
}
function luminance(color: string){
  const values=color.startsWith('#')?color.slice(1).match(/../g)!.map(v=>parseInt(v,16)):color.match(/[\d.]+/g)!.map(Number);
  return values.map(v=>fromSrgb(v/255)).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
}
function contrast(a: string,b: string){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
function applyTwilight(panel: {style: {setProperty: (key: string,value: string)=>void}},palette: Record<string,string[]>,progress: number){
  // Bring the former B / 2500 K evening appearance (20:45) forward to 19:15.
  // Keep both segments continuous and retain full night at 22:30.
  const stop=5/18,reference=11/18;
  const dimming=progress<=stop?progress*reference/stop:reference+(progress-stop)*(1-reference)/(1-stop);
  const colors=['backgrounds','surfaces','muted'].map(key=>mix(palette[key][3],palette[key][4],dimming));
  const minimum=(color: string,backgrounds: string[])=>Math.min(...backgrounds.map(background=>contrast(color,background)));
  // Keep text readable throughout dimming, including the middle luminances.
  const ink=['#1e382e','#07110d','#000000','#f3f4e8','#ffffff'];
  let foreground=ink.find(color=>minimum(color,colors)>=4.55);
  if(!foreground){
    foreground=ink.find(color=>contrast(color,colors[0])>=4.55)!;
    for(let i=1;i<colors.length;i++)if(contrast(foreground,colors[i])<4.55){
      const end=luminance(foreground)>.5?'#000000':'#ffffff';
      let low=0,high=1;
      for(let n=0;n<12;n++){
        const middle=(low+high)/2;
        if(contrast(foreground,mix(colors[i],end,middle))>=4.55)high=middle;
        else low=middle;
      }
      colors[i]=mix(colors[i],end,high);
    }
  }
  for(const [i,role] of ['background','surface','surface-muted'].entries())panel.style.setProperty(`--${role}`,colors[i]);
  const lightText=luminance(foreground)>.5;
  panel.style.setProperty('--foreground',foreground);
  // Keep the approved endpoint roles: separators are decorative, while
  // muted text and control boundaries have their own contrast requirements.
  for(const [role,start,end,threshold] of [
    ['foreground-secondary','#465e53','#c3d4c8',4.55],
    ['foreground-muted','#506457','#b8cfc1',4.55],
    ['placeholder','#506457','#b8cfc1',4.55],
    ['control-border','#506457','#82a293',3],
    ['line','#d2d9cc','#507166',0],
  ] as const){
    let color=mix(start,end,dimming);
    if(minimum(color,colors)<threshold){
      let low=0,high=1;
      for(let i=0;i<12;i++){
        const middle=(low+high)/2;
        if(minimum(mix(color,foreground,middle),colors)>=threshold)high=middle;
        else low=middle;
      }
      color=mix(color,foreground,high);
    }
    panel.style.setProperty(`--${role}`,color);
  }
  // Graphics use chromatic endpoints. The separate text role may approach a
  // neutral endpoint when that is required for 4.55:1 on twilight surfaces.
  function accessibleColor(dark: string,light: string,darkEnd: string,lightEnd: string,threshold=4.5){
    const options=lightText?[[light,lightEnd],[dark,darkEnd]]:[[dark,darkEnd],[light,lightEnd]];
    for(const [base,end] of options){
      if(minimum(base,colors)>=threshold)return base;
      if(minimum(end,colors)>=threshold){
        let low=0,high=1;
        for(let i=0;i<12;i++){
          const middle=(low+high)/2;
          if(minimum(mix(base,end,middle),colors)>=threshold)high=middle;
          else low=middle;
        }
        return mix(base,end,high);
      }
    }
    // Surface adjustment ensures an appropriate endpoint is available.
    return lightText?lightEnd:darkEnd;
  }
  // A fill, text on an arbitrary twilight panel and a subtle selected surface
  // have different contrast constraints. Keep the approved chromatic primary
  // fills and use separate text / graphic roles over the interpolated panels.
  const accentText=accessibleColor('#0a3d30','#c3ecd1','#000000','#ffffff',4.55);
  const accentGraphic=accessibleColor('#0d5f47','#a2dfbb','#003a19','#d0ffd8',3.05);
  panel.style.setProperty('--accent-text',accentText);
  panel.style.setProperty('--primary-graphic',accentGraphic);
  panel.style.setProperty('--focus',accentText);
  // Control borders and icons have a 3:1 non-text requirement; a separate
  // graphic token can retain a recognizably red color near the crossover.
  panel.style.setProperty('--danger-graphic',accessibleColor('#9b352d','#ffb4a5','#4c0000','#ffe0d6',3));
  return lightText;
}


 hour=Number.isFinite(hour)?((hour%24)+24)%24:8;
 const phase=hour<5||hour>=22.5?4:hour<7?0:hour<11?1:hour<16?2:3;
 const styles:Record<string,string>={};
 let dark=mode==="dark"||(mode==="auto"&&(hour<5||hour>=22.5));
 if(!dark){styles["--foreground-muted"]="var(--ink-700)";let i=0,j=0,t=0;const hours=[5.75,8,13,18];if(hour>=18)i=j=3;else if(hour>5.75){j=hours.findIndex(v=>v>=hour);i=j-1;t=(hour-hours[i])/(hours[j]-hours[i]);}
 for(const [role,key] of [["background","backgrounds"],["surface","surfaces"],["surface-muted","muted"]])styles[`--${role}`]=mix(palette[key as keyof typeof palette][i],palette[key as keyof typeof palette][j],t);
 if(mode==="auto"&&hour>18&&hour<22.5)dark=applyTwilight({style:{setProperty:(k,v)=>{styles[k]=v;}}},palette,(hour-18)/4.5);
 if(hour>=16&&hour<=18)styles["--control-border"]="var(--ink-600)";
 }return {phase,theme:dark?"dark":"light",styles};
}
