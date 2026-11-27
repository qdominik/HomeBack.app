import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext} from "node:vm";
import {renderWeatherScene,sceneSky,type SceneWeather} from "../../src/components/rhythm/weather-scene";
const source=readFileSync("tests/fixtures/ui00-weather-reference.txt","utf8");
const reference=source;
const approved=runInNewContext(reference+"; skyScene") as (input:{weather:SceneWeather})=>string;
for(const weather of ["none","clear","cloud","fog","snow","rain","storm"] as const){test(`weather ${weather} preserves approved R2 markup exactly`,()=>assert.equal(renderWeatherScene(weather),approved({weather})));}
test("snow is reproducible and irregular, with white ground and roof",()=>{const html=renderWeatherScene("snow");assert.equal((html.match(/class="snowflake"/g)||[]).length,28);assert.ok(html.includes("roof-snow"));assert.ok(html.includes("snow-cover"));const positions=[...html.matchAll(/--x:([\d.]+)%;--y:([\d.]+)%/g)].map(v=>v[1]+","+v[2]);assert.equal(new Set(positions).size,28);});
test("rain and storm retain different particle counts and isolated gradient IDs",()=>{assert.equal((renderWeatherScene("rain").match(/class="raindrop"/g)||[]).length,36);assert.equal((renderWeatherScene("storm").match(/class="raindrop"/g)||[]).length,58);const html=renderWeatherScene("cloud","scene-two");assert.ok(html.includes('id="scene-two-0"'));assert.ok(html.includes('url(#scene-two-0)'));assert.ok(html.includes('class="weather-cloud weather-cloud-0"'));});
test("fog, cloud and snow keep their approved distinct skies",()=>{for(const dark of [false,true]){assert.notDeepEqual(sceneSky(2,dark,"fog"),sceneSky(2,dark,"cloud"));assert.notDeepEqual(sceneSky(2,dark,"snow"),sceneSky(2,dark,"cloud"));}});
test("neutral evening sky keeps 6A precedence even after dark palette activates",()=>{
 assert.deepEqual(sceneSky(3,true,"none"),["#eed2b2","#b6c8c4"]);
});
