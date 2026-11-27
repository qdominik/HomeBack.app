import test from "node:test";
import assert from "node:assert/strict";
import {daylight} from "../../src/lib/ui/daylight";
import {daylightBootstrap, appearanceBootstrap} from "../../src/lib/ui/daylight-bootstrap";
import {startMinuteClock} from "../../src/lib/ui/minute-clock";
import vm from "node:vm";
import { readFileSync } from "node:fs";
test("minute timer aligns, immediately refreshes after resume and cleans up", () => {
  let now = 125_500, nextId = 0, ticks = 0;
  const pending = new Map<number, { callback: () => void; delay: number }>();
  const clock = startMinuteClock(() => { ticks++; }, {
    now: () => now,
    setTimeout: (callback, delay) => { const id = ++nextId; pending.set(id, { callback, delay }); return id; },
    clearTimeout: id => { pending.delete(id); },
  });
  assert.equal(ticks, 1);
  assert.equal(pending.get(1)?.delay, 54_500);
  now = 3_602_345;
  clock.update();
  assert.equal(ticks, 2);
  assert.equal(pending.size, 1);
  assert.equal(pending.get(2)?.delay, 57_655);
  const callback = pending.get(2)!.callback;
  clock.stop();
  assert.equal(pending.size, 0);
  callback();
  clock.update();
  assert.equal(ticks, 2);
  assert.equal(pending.size, 0);
});
test("daylight respects explicit appearance across the entire local day",()=>{for(let h=0;h<24;h+=.25){assert.equal(daylight(h,"light").theme,"light");assert.equal(daylight(h,"dark").theme,"dark");}});
test("Auto keeps approved noon and full night after 22:30",()=>{assert.equal(daylight(13,"auto").styles["--background"],"rgb(245 245 242)");assert.equal(daylight(22.5,"auto").theme,"dark");assert.equal(daylight(4.99,"auto").theme,"dark");assert.equal(daylight(8,"auto").theme,"light");});
test("civil clock wraps midnight and invalid input has a deterministic fallback",()=>{assert.deepEqual(daylight(24,"auto"),daylight(0,"auto"));assert.deepEqual(daylight(NaN,"auto"),daylight(8,"auto"));});
test("each phase changes at its documented local-time boundary", () => {
  for (const [minute, phase] of [[0,4],[299,4],[300,0],[419,0],[420,1],[659,1],[660,2],[959,2],[960,3],[1349,3],[1350,4],[1439,4]]) {
    assert.equal(daylight(minute / 60, "auto").phase, phase, `minute ${minute}`);
  }
});
test("approved evening curve matches the accepted 19:15 reference",()=>{
  assert.equal(daylight(19.25,"auto").styles["--background"],"rgb(97 106 94)");
  assert.equal(daylight(19.25,"auto").theme,"dark");
});
test("semantic status colors retain their approved palette and paired contrast during twilight", () => {
  for (let minute = 18 * 60 + 1; minute < 22 * 60 + 30; minute++) {
    const { styles, theme } = daylight(minute / 60, "auto");
    for (const role of ["success", "danger", "warning", "info"]) {
      assert.equal(styles[`--${role}`], undefined, `${minute}: theme's chromatic ${role} must not be neutralized`);
      assert.ok(contrastRatio(cssColor(`status-${role}-text`, theme), cssColor(`status-${role}-surface`, theme)) >= 4.5,
        `${minute}: ${role} paired text`);
    }
  }
});
test("twilight keeps a visible accent fill separate from its readable text", () => {
  for (let minute = 18 * 60 + 1; minute < 22 * 60 + 30; minute++) {
    const { styles } = daylight(minute / 60, "auto");
    assert.equal(styles["--primary"], undefined, `${minute}: do not neutralize the green fill`);
    assert.ok(styles["--accent-text"], `${minute}: adaptive text role`);
    for (const surface of ["background", "surface", "surface-muted"]) {
      assert.ok(contrastRatio(styles["--accent-text"], styles[`--${surface}`]) >= 4.55, `${minute}: accent text on ${surface}`);
      assert.ok(contrastRatio(styles["--primary-graphic"], styles[`--${surface}`]) >= 3, `${minute}: green graphic on ${surface}`);
    }
    const [red, green, blue] = channels(styles["--primary-graphic"]);
    assert.ok(green - Math.max(red, blue) >= 16, `${minute}: graphic remains recognizably green`);
  }
});
test("twilight keeps cards separate from the approved background", () => {
  for (let minute = 18 * 60 + 1; minute < 22 * 60 + 30; minute++) {
    const { styles } = daylight(minute / 60, "auto");
    const background = channels(styles["--background"]), surface = channels(styles["--surface"]);
    assert.ok(Math.max(...surface.map((v,i) => Math.abs(v-background[i]))) >= 5, `${minute}: card separation`);
  }
});
test("twilight keeps foreground contrast across all three surfaces each minute",()=>{
  const luminance=(color:string)=>{
    const channels=color.startsWith("#") ? color.slice(1).match(/../g)!.map(v=>parseInt(v,16)) : color.match(/[\d.]+/g)!.map(Number);
    return channels.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  };
  for(let minute=18*60+1;minute<22*60+30;minute++){
    const {styles}=daylight(minute/60,"auto");
    for(const name of ["--background","--surface","--surface-muted"]){
      const b=luminance(styles[name]);
      for(const role of ["foreground","foreground-secondary","foreground-muted","placeholder"]){
        const a=luminance(styles[`--${role}`]);
        assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,`${minute}: ${role} on ${name}`);
      }
    }
  }
});
test("pre-paint bootstrap and hydrated resolver use identical local time",()=>{
  for (const [hours, minutes] of [[0,0],[4,59],[5,0],[6,59],[7,0],[10,59],[11,0],[13,0],[15,59],[16,0],[18,0],[18,1],[19,15],[20,0],[22,29],[22,30],[23,59]]) {
    const properties: Record<string,string> = {};
    const root = {dataset: {theme:""},style:{setProperty:(name:string,value:string)=>{properties[name]=value;}}};
    class FixedDate extends Date { getHours(){return hours;} getMinutes(){return minutes;} }
    vm.runInNewContext(daylightBootstrap,{Date:FixedDate,document:{documentElement:root}});
    const expected=daylight(hours+minutes/60,"auto");
    assert.equal(root.dataset.theme,expected.theme);
    assert.deepEqual(properties,expected.styles);
  }
});

test("saved appearance bootstrap uses device time and the same 6A resolver", () => {
  for (const mode of ["auto", "light", "dark"] as const) {
    for (const [hours, minutes] of [[5, 0], [13, 0], [18, 0], [19, 15], [22, 30]]) {
      const properties: Record<string,string> = {};
      const root = {dataset: {theme:"", motion:"", rhythmPhase:""},style:{setProperty:(name:string,value:string)=>{properties[name]=value;}}};
      class FixedDate extends Date { getHours(){return hours;} getMinutes(){return minutes;} }
      vm.runInNewContext(appearanceBootstrap(mode, false), {Date:FixedDate, document:{documentElement:root}});
      const hour = hours + minutes / 60;
      const expected = daylight(mode === "light" ? 13 : hour, mode);
      assert.equal(root.dataset.theme, expected.theme);
      assert.equal(root.dataset.motion, "off");
      assert.equal(root.dataset.rhythmPhase, ["dawn","morning","noon","evening","night"][daylight(hour,"auto").phase]);
      assert.deepEqual(properties, expected.styles);
    }
  }
});

test("twilight focus and button text remain legible including destructive hover", () => {
  for (let minute = 18 * 60 + 1; minute < 22 * 60 + 30; minute++) {
    const { styles, theme } = daylight(minute / 60, "auto");
    for (const name of ["background", "surface", "surface-muted"]) {
      const surface = styles[`--${name}`];
      assert.ok(contrastRatio(styles["--focus"], surface) >= 3, `${minute}: focus on ${name}`);
      const onDanger = theme === "dark" ? "#351a15" : "#fffdf8";
      assert.ok(contrastRatio(onDanger, cssColor("danger-button", theme)) >= 4.5, `${minute}: destructive button`);
      assert.ok(contrastRatio(onDanger, cssColor("danger-button-hover", theme)) >= 4.5, `${minute}: destructive hover`);
    }
    const onPrimary = theme === "dark" ? "#122b29" : "#fffdf8";
    for (const fill of theme === "dark" ? ["#a2dfbb", "#c3ecd1"] : ["#0d5f47", "#0a4a38"]) {
      assert.ok(contrastRatio(onPrimary, fill) >= 4.5, `${minute}: button text on ${fill}`);
    }
  }
});

// The twilight roles are used for ordinary text as well as icons and controls.
const channels = (color: string) => color.startsWith("#")
  ? color.slice(1).match(/../g)!.map(value => parseInt(value, 16))
  : color.match(/[\d.]+/g)!.map(Number);
const contrastRatio = (first: string, second: string) => {
  const lum = (color: string) => channels(color).map(value => value / 255)
    .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
    .reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
  const a = lum(first), b = lum(second);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
};
const tokensCss = readFileSync("src/styles/ui-tokens.css", "utf8");
const cssColor = (name: string, theme: string) => {
  const values = [...tokensCss.matchAll(new RegExp(`--${name}:\\s*(#[a-f\\d]{6});`, "gi"))];
  assert.equal(values.length, 2, `expected light and dark values for ${name}`);
  return values[theme === "dark" ? 1 : 0][1];
};

test("evening accent text and hover have AA contrast on all surfaces every minute", () => {
  for (let minute = 18 * 60 + 1; minute < 22 * 60 + 30; minute++) {
    const { styles } = daylight(minute / 60, "auto");
    for (const role of ["accent-text"]) {
      for (const surface of ["background", "surface", "surface-muted"]) {
        assert.ok(contrastRatio(styles[`--${role}`], styles[`--${surface}`]) >= 4.5,
          `${minute}: ${role} on ${surface}`);
      }
    }
  }
});

test("danger borders and icons keep a red graphic role with 3:1 contrast", () => {
  for (let minute = 18 * 60 + 1; minute < 22 * 60 + 30; minute++) {
    const { styles } = daylight(minute / 60, "auto");
    const color = styles["--danger-graphic"];
    for (const surface of ["background", "surface", "surface-muted"]) {
      assert.ok(contrastRatio(color, styles[`--${surface}`]) >= 3, `${minute}: danger graphic on ${surface}`);
    }
    const [red, green, blue] = channels(color);
    assert.ok(red - Math.max(green, blue) >= 20, `${minute}: red graphic channel separation`);
  }
});

test("evening status roles retain red, amber, blue and green hues with AA contrast", () => {
  for (let minute = 18 * 60 + 1; minute < 22 * 60 + 30; minute++) {
    const theme = daylight(minute / 60, "auto").theme;
    const [dr, dg, db] = channels(cssColor("status-danger-text", theme));
    const [wr, wg, wb] = channels(cssColor("status-warning-text", theme));
    const [ir, ig, ib] = channels(cssColor("status-info-text", theme));
    const [sr, sg, sb] = channels(cssColor("status-success-text", theme));
    // A simple numerical guard against near-neutral colors; this is not a
    // substitute for checking the rendered status colors with a human reviewer.
    assert.ok(dr - Math.max(dg, db) >= 16, `${minute}: danger red-channel separation`);
    assert.ok(wr - wg >= 8 && wg - wb >= 8, `${minute}: warning amber-channel separation`);
    assert.ok(ib - ir >= 16 && ig > ir, `${minute}: info blue-channel separation`);
    assert.ok(sg - Math.max(sr, sb) >= 16, `${minute}: success green-channel separation`);
  }
});

test("status text stays readable on the paired surfaces used by badges and alerts", () => {
  for (let minute = 18 * 60 + 1; minute < 22 * 60 + 30; minute++) {
    const { theme } = daylight(minute / 60, "auto");
    for (const role of ["danger", "warning", "info", "success"]) {
      assert.ok(contrastRatio(cssColor(`status-${role}-text`, theme), cssColor(`status-${role}-surface`, theme)) >= 4.5,
        `${minute}: ${role} text on its rendered surface`);
    }
  }
});

test("accent soft surface keeps its paired text readable throughout twilight", () => {
  for (let minute = 18 * 60 + 1; minute < 22 * 60 + 30; minute++) {
    const { theme } = daylight(minute / 60, "auto");
    assert.ok(contrastRatio(cssColor("accent-soft-text", theme), cssColor("accent-soft", theme)) >= 4.5,
      `${minute}: soft accent text on paired surface`);
  }
});

test("twilight preserves separator and muted-text endpoints", () => {
  const check = (minute: number, expected: Record<string, string>) => {
    const { styles } = daylight(minute / 60, "auto");
    for (const [role, color] of Object.entries(expected)) {
      const actual = channels(styles[`--${role}`]);
      const baseline = channels(color);
      assert.ok(actual.every((value, index) => Math.abs(value - baseline[index]) <= 4),
        `${minute}: ${role} differs unexpectedly from the endpoint`);
    }
  };
  check(18 * 60 + 1, { line: "#d2d9cc", "control-border": "#506457", "foreground-muted": "#506457" });
  check(22 * 60 + 29, { line: "#507166", "control-border": "#82a293", "foreground-muted": "#b8cfc1" });
});
