import test from "node:test";
import assert from "node:assert/strict";
import {daylight} from "../../src/lib/ui/daylight";
import {daylightBootstrap} from "../../src/lib/ui/daylight-bootstrap";
import vm from "node:vm";
test("daylight respects explicit appearance across the entire local day",()=>{for(let h=0;h<24;h+=.25){assert.equal(daylight(h,"light").theme,"light");assert.equal(daylight(h,"dark").theme,"dark");}});
test("Auto keeps approved noon and full night after 22:30",()=>{assert.equal(daylight(13,"auto").styles["--background"],"rgb(245 245 242)");assert.equal(daylight(22.5,"auto").theme,"dark");assert.equal(daylight(4.99,"auto").theme,"dark");assert.equal(daylight(8,"auto").theme,"light");});
test("civil clock wraps midnight and invalid input has a deterministic fallback",()=>{assert.deepEqual(daylight(24,"auto"),daylight(0,"auto"));assert.deepEqual(daylight(NaN,"auto"),daylight(8,"auto"));});
test("approved evening curve matches the accepted 19:15 reference",()=>{
  assert.equal(daylight(19.25,"auto").styles["--background"],"rgb(97 106 94)");
  assert.equal(daylight(19.25,"auto").theme,"dark");
});
test("twilight keeps foreground contrast across all three surfaces each minute",()=>{
  const luminance=(color:string)=>{
    const channels=color.startsWith("#") ? color.slice(1).match(/../g)!.map(v=>parseInt(v,16)) : color.match(/[\d.]+/g)!.map(Number);
    return channels.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  };
  for(let minute=18*60+1;minute<22*60+30;minute++){
    const {styles}=daylight(minute/60,"auto");
    for(const name of ["--background","--surface","--surface-muted"]){
      const a=luminance(styles["--foreground"]), b=luminance(styles[name]);
      assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,`${minute}: ${name}`);
    }
  }
});
test("pre-paint bootstrap and hydrated resolver use identical local time",()=>{
  for (const [hours, minutes] of [[0,0],[4,59],[5,0],[13,0],[19,15],[22,30],[23,59]]) {
    const properties: Record<string,string> = {};
    const root = {dataset: {theme:""},style:{setProperty:(name:string,value:string)=>{properties[name]=value;}}};
    class FixedDate extends Date { getHours(){return hours;} getMinutes(){return minutes;} }
    vm.runInNewContext(daylightBootstrap,{Date:FixedDate,document:{documentElement:root}});
    const expected=daylight(hours+minutes/60,"auto");
    assert.equal(root.dataset.theme,expected.theme);
    assert.deepEqual(properties,expected.styles);
  }
});
