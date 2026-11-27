// Ported verbatim from the approved UI-00 R2 scene (4673342).
// Markup is generated exclusively from fixed paths and seeded numbers, never user/API text.
export type SceneWeather = "none" | "clear" | "cloud" | "fog" | "rain" | "snow" | "storm";
  function snowfall(){
    // A fixed seed gives a reproducible, irregular scatter without a tiled texture.
    let seed=71893;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const flakes=Array.from({length:28},()=>{const x=(2+random()*96).toFixed(2),y=(random()*100).toFixed(2),size=(1.5+random()*3).toFixed(2),opacity=(.5+random()*.5).toFixed(2),fall=(8+random()*13).toFixed(2),delay=(-random()*24).toFixed(2),drift=(-22+random()*44).toFixed(2);return '<i class="snowflake" style="--x:'+x+'%;--y:'+y+'%;--size:'+size+'px;--flake-opacity:'+opacity+';--fall:'+fall+'s;--delay:'+delay+'s;--drift:'+drift+'px"></i>';}).join('');
    return '<div class="snowfall">'+flakes+'</div>';
  }
  function weatherClouds(){
    const shapes=[
      'M8 59C-2 40 16 24 38 30C45 8 78 7 90 24C107 11 133 16 139 34C156 19 185 27 190 45C218 32 249 38 253 57C279 47 304 58 308 74C270 86 242 78 217 81C187 91 157 79 131 84C101 92 73 80 48 84C24 85 8 77 8 59Z',
      'M7 60C-2 40 19 25 42 31C54 3 88 2 104 21C125 10 154 20 159 41C181 17 214 25 222 46C249 34 276 44 279 61C305 54 324 66 318 81C284 88 260 82 238 87C202 91 176 79 151 85C112 94 90 82 65 85C39 88 14 81 7 60Z',
      'M3 64C-4 43 16 29 38 36C48 12 75 10 93 25C119 7 150 21 151 44C173 30 194 32 208 49C233 34 261 47 264 64C294 54 321 68 313 83C276 92 251 83 224 87C191 95 166 83 141 87C106 96 81 83 57 87C29 90 9 81 3 64Z'
    ];
    return shapes.map((d,i)=>'<svg class="weather-cloud weather-cloud-'+i+'" viewBox="0 0 320 96" aria-hidden="true"><defs><linearGradient id="weather-cloud-'+i+'" x1="0" y1="0" x2=".2" y2="1"><stop stop-color="var(--cloud-light)"/><stop offset=".52" stop-color="var(--cloud-mid)"/><stop offset="1" stop-color="var(--cloud-shade)"/></linearGradient></defs><path d="'+d+'" fill="url(#weather-cloud-'+i+')"/></svg>').join('');
  }
  function rainfall(storm: boolean){
    let seed=storm?92873:36193;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const drops=Array.from({length:storm?58:36},(_,i)=>{const near=i%3===0;const x=(-8+random()*116).toFixed(2),y=(random()*100).toFixed(2),length=(near?14+random()*15:6+random()*10).toFixed(2),width=(near?1.1:.65),opacity=(near?.34+random()*.24:.13+random()*.19).toFixed(2),fall=(storm?.62+random()*.65:1.1+random()*1.1).toFixed(2),delay=(-random()*4).toFixed(2),wind=(storm?105+random()*30:38+random()*25).toFixed(2),angle=(storm?-22:-9);return '<i class="raindrop" style="--x:'+x+'%;--y:'+y+'%;--length:'+length+'px;--width:'+width+'px;--drop-opacity:'+opacity+';--fall:'+fall+'s;--delay:'+delay+'s;--wind:'+wind+'px;--angle:'+angle+'deg"></i>';}).join('');
    const ripples=Array.from({length:storm?10:6},()=>'<i class="rain-ripple" style="--x:'+(4+random()*90).toFixed(2)+'%;--bottom:'+(2+random()*13).toFixed(2)+'px;--ring:'+(5+random()*9).toFixed(2)+'px;--fall:'+(1.8+random()*2.5).toFixed(2)+'s;--delay:'+(-random()*5).toFixed(2)+'s"></i>').join('');
    return '<div class="rain-haze"></div><div class="rainfall">'+drops+'</div><div class="rain-surface">'+ripples+'</div>';
  }
  function skyScene(a: {weather: SceneWeather}){
    const snow=a.weather==='snow',fog=a.weather==='fog',cloud=a.weather==='cloud',wet=a.weather==='rain'||a.weather==='storm';
    const snowClouds=snow?'<svg class="cloud-bank" viewBox="0 0 400 120" preserveAspectRatio="none"><path d="M-20 53Q-3 21 31 29Q42-5 76 12Q102-8 127 18Q158 8 175 34Q207 11 237 31Q253 2 281 16Q319-4 342 31Q375 16 400 40L425 72Q383 92 339 78Q291 101 244 80Q192 104 146 78Q96 99 53 78Q12 91-20 71Z" fill="currentColor" opacity=".76"/><path d="M13 71Q43 46 70 57Q91 28 120 51Q150 42 170 63Q209 44 238 65Q268 36 298 58Q330 43 348 68Q384 51 420 79V105Q363 114 318 98Q263 113 215 97Q165 115 116 97Q64 113 13 94Z" fill="currentColor" opacity=".88"/></svg>':fog?'':'<div class="cloud"></div><div class="cloud second"></div>';
    const clouds=cloud||wet?weatherClouds():snowClouds;
    return '<div class="sky-scene" aria-hidden="true"><div class="orb"></div>'+clouds+'<svg class="landscape" viewBox="0 0 480 94" preserveAspectRatio="none"><path d="M0 75Q80 34 160 70T320 63T480 68V94H0Z" fill="currentColor" opacity=".4"/><path d="M0 90Q100 50 210 79T480 77V94H0Z" fill="currentColor"/>'+(snow?'<path class="snow-cover far" d="M0 73Q80 34 160 68T320 61T480 66V94H0Z"/><path class="snow-cover" d="M0 88Q100 50 210 77T480 75V94H0Z"/>':'')+'</svg><svg class="scene-house" viewBox="0 0 74 74"><path d="M9 67V31L37 9l28 22v36M3 32 37 3l34 29" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>'+(snow?'<path class="roof-snow" d="M3 29 37 1l34 28"/>':'')+'<path d="M23 39h10v14H23zM45 39h10v14H45z" class="house-window"/></svg>'+(fog?'<div class="fog-belt far"></div><div class="fog-belt middle"></div><div class="fog-belt near"></div>':'')+(snow?snowfall():wet?rainfall(a.weather==='storm'):'')+'</div>';
  }

export function renderWeatherScene(weather: SceneWeather, idPrefix = "weather-cloud") {
  const safePrefix = idPrefix.replace(/[^a-zA-Z0-9_-]/g, "") || "weather-cloud";
  return skyScene({weather}).replaceAll('id="weather-cloud-', `id="${safePrefix}-`).replaceAll('url(#weather-cloud-', `url(#${safePrefix}-`);
}
export function sceneSky(phase: number, dark: boolean, weather: SceneWeather): string[] {
 const skies=[["#f8cda0","#cbdfe0"],["#d9ecd9","#b5dadd"],["#d3eaf0","#a8d1df"],["#eed2b2","#b6c8c4"],["#1f4549","#102e3a"]];
 let sky=skies[phase]??skies[1];
 // The approved 6A evening scene takes precedence over the dark palette.
 if(dark&&phase!==3&&phase!==4)sky=["#294c4b","#1c3941"];
 const weatherSkies={cloud:dark?["#344d59","#233c47"]:["#9fb8c2","#d2dfe2"],fog:dark?["#456268","#304b50"]:["#d8e2df","#bccdc8"],snow:dark?["#3b556d","#233c53"]:["#c5d8e5","#91afc5"],rain:dark?["#354e64","#1e3a4c"]:["#9fb5c4","#718fa4"],storm:dark?["#273f59","#142b40"]:["#657c91","#344f69"]};
 return weather==="none"||weather==="clear"?sky:weatherSkies[weather];
}
