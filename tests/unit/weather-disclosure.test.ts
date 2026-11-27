import test from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {hasLiveWeather,WeatherDisclosure} from '../../src/components/rhythm/weather-disclosure';
import {WeatherDetails} from '../../src/components/rhythm/weather-details';
import {weatherCopyEn,weatherCopyPl} from '../../src/lib/weather/copy';
import type {Snapshot} from '../../src/lib/weather/contracts';

const now=1_800_000_000_000;
const snapshot:Snapshot={fetchedAt:now,timezone:'Europe/Warsaw',current:{epoch:now,code:1000,temperature:5,wind:4,precipitation:0},hours:[]};
test('disclosure is visible only when actual current provider conditions are displayed',()=>{
 assert.equal(hasLiveWeather(snapshot,now,false),true);
 assert.equal(hasLiveWeather(snapshot,now,true),false);
 assert.equal(hasLiveWeather(null,now,false),false);
 assert.equal(hasLiveWeather(snapshot,now+46*60000,false),false);
});
test('weather card details omit the attribution row while settings keep it',()=>{
 const location={household_id:'fixture',city:'Warszawa',postal_code:'',country:'PL',revision:1,provider_id:1,name:'Warszawa',region:'',provider_country:'Poland',latitude:52,longitude:21,timezone:'Europe/Warsaw',updated_at:''};
 for(const copy of [weatherCopyPl,weatherCopyEn]){
  const props={conditions:snapshot.current,location,windy:false,copy,locale:'pl'};
  const card=renderToStaticMarkup(createElement(WeatherDetails,{...props,showAttribution:false}));
  const settings=renderToStaticMarkup(createElement(WeatherDetails,{...props,showAttribution:true}));
  assert.ok(card.includes('Warszawa'));assert.ok(!card.includes('WeatherAPI.com'));assert.ok(!card.includes(copy.updated));
  assert.ok(settings.includes(copy.source));assert.ok(settings.includes(copy.updated));
 }
});
test('visible disclosure presents linked source and full explanation in both languages',()=>{
 for(const copy of [weatherCopyPl,weatherCopyEn]){
  const html=renderToStaticMarkup(createElement(WeatherDisclosure,{visible:true,copy}));
  assert.match(html,/href="https:\/\/www\.weatherapi\.com\/"/);
  assert.ok(html.includes(copy.disclosureSource));
  assert.ok(html.includes(copy.disclosure));
  assert.ok(html.includes(copy.disclosureTitle));
  assert.equal(renderToStaticMarkup(createElement(WeatherDisclosure,{visible:false,copy})), '');
 }
});
