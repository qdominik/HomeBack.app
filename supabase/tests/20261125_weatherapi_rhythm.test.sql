begin;
create extension if not exists pgtap with schema extensions;
set search_path=extensions,public,auth;
select no_plan();
insert into auth.users(id,email,email_confirmed_at) values
 ('a6000000-0000-0000-0000-000000000001','admin@weather.test',now()),
 ('a6000000-0000-0000-0000-000000000002','adult@weather.test',now()),
 ('a6000000-0000-0000-0000-000000000003','child@weather.test',now()),
 ('a6000000-0000-0000-0000-000000000004','foreign@weather.test',now());
insert into public.household(id,nazwa,typ) values
 ('b6000000-0000-0000-0000-000000000001','Weather A','dom'),
 ('b6000000-0000-0000-0000-000000000002','Weather B','dom');
insert into public.profile(id,household_id,imie,email,rola,status) values
 ('a6000000-0000-0000-0000-000000000001','b6000000-0000-0000-0000-000000000001','Admin','admin@weather.test','admin','aktywny'),
 ('a6000000-0000-0000-0000-000000000002','b6000000-0000-0000-0000-000000000001','Adult','adult@weather.test','dorosły','aktywny'),
 ('a6000000-0000-0000-0000-000000000003','b6000000-0000-0000-0000-000000000001','Child','child@weather.test','dziecko','aktywny'),
 ('a6000000-0000-0000-0000-000000000004','b6000000-0000-0000-0000-000000000002','Other','foreign@weather.test','admin','aktywny');
select ok(not has_table_privilege('anon','public.household_weather_location','select'),'anonymous location access denied');
select ok(not has_table_privilege('authenticated','public.weather_location_cache','select'),'provider cache not exposed to members');
select ok(not has_function_privilege('authenticated','public.weather_cache_claim(text)','execute'),'members cannot obtain provider cache leases');
select ok(not has_function_privilege('anon','public.weather_cache_finish(text,uuid,jsonb,integer)','execute'),'anonymous cannot poison provider cache');
select ok((select relrowsecurity from pg_class where oid='public.weather_location_cache'::regclass),'cache has RLS');
select ok((select relrowsecurity from pg_class where oid='public.household_weather_location'::regclass),'location has RLS');
select ok((select relrowsecurity from pg_class where oid='public.profile_appearance_preferences'::regclass),'preferences have RLS');

set local role authenticated;
set local "request.jwt.claims"='{"sub":"a6000000-0000-0000-0000-000000000001","role":"authenticated"}';
select lives_ok($$insert into public.household_weather_location(household_id,city,country) values(public.current_household_id(),'Warszawa','PL')$$,'active admin can save household locality');
select is((select revision from public.household_weather_location),1,'initial location revision');
select throws_ok($$insert into public.household_weather_location(household_id,city,country) values('b6000000-0000-0000-0000-000000000002','Foreign','PL')$$,'42501',null,'admin cannot write another household');
select throws_ok($$update public.household_weather_location set provider_id=1,name='Warszawa',latitude=52.23,longitude=21.01,timezone='invented/timezone'$$,'23514',null,'invalid timezone rejected by database');
select lives_ok($$update public.household_weather_location set provider_id=1,name='Warszawa',latitude=52.23,longitude=21.01,timezone='Europe/Warsaw' where revision=1$$,'resolved locality can be saved');
select is((select revision from public.household_weather_location),2,'resolution advances revision');
with changed as (update public.household_weather_location set city='Krakow' where revision=1 returning *) select is((select count(*)::int from changed),0,'stale concurrent address write changes no rows');
select lives_ok($$update public.household_weather_location set city='Krakow' where revision=2$$,'new address saved');
select is((select timezone from public.household_weather_location),null::text,'address edit invalidates previous timezone');
select is((select latitude from public.household_weather_location),null::double precision,'address edit invalidates previous coordinates');
with changed as (update public.household_weather_location set name='Old result',provider_id=1,latitude=52.23,longitude=21.01,timezone='Europe/Warsaw' where revision=2 returning *) select is((select count(*)::int from changed),0,'late geocode cannot overwrite new address');
select lives_ok($$insert into public.profile_appearance_preferences(profil_id,household_id,mode) values(auth.uid(),public.current_household_id(),'dark')$$,'admin saves own preference');
select throws_ok($$insert into public.profile_appearance_preferences(profil_id,household_id) values('a6000000-0000-0000-0000-000000000002',public.current_household_id())$$,'42501',null,'admin cannot set another users preferences');
select throws_ok($$update public.profile_appearance_preferences set mode='invented'$$,'23514',null,'invalid appearance mode rejected');
select throws_ok($$update public.profile_appearance_preferences set household_id='b6000000-0000-0000-0000-000000000002'$$,'23514',null,'preference ownership cannot move');

set local "request.jwt.claims"='{"sub":"a6000000-0000-0000-0000-000000000002","role":"authenticated"}';
select is((select count(*)::int from public.household_weather_location),1,'adult reads own household location');
select is((select count(*)::int from public.profile_appearance_preferences),0,'adult cannot read admin preference');
with changed as(update public.household_weather_location set city='Unauthorized' returning *) select is((select count(*)::int from changed),0,'adult cannot edit household address');
select lives_ok($$insert into public.profile_appearance_preferences(profil_id,household_id,mode,weather_enabled,motion,intensity) values(auth.uid(),public.current_household_id(),'light',false,false,'standard')$$,'adult saves independent preference');
select is((select mode from public.profile_appearance_preferences),'light','adult sees only own selected mode');
select lives_ok($$update public.profile_appearance_preferences set mode='auto' where revision=1$$,'own preference update succeeds');
with changed as(update public.profile_appearance_preferences set mode='dark' where revision=1 returning *) select is((select count(*)::int from changed),0,'stale preference write is a conflict');

set local "request.jwt.claims"='{"sub":"a6000000-0000-0000-0000-000000000003","role":"authenticated"}';
select lives_ok($$insert into public.profile_appearance_preferences(profil_id,household_id,motion) values(auth.uid(),public.current_household_id(),false)$$,'child can adjust own appearance');
select is((select count(*)::int from public.household_weather_location),1,'child sees household weather locality');
with changed as(delete from public.household_weather_location returning *) select is((select count(*)::int from changed),0,'child cannot remove locality');
set local "request.jwt.claims"='{"sub":"a6000000-0000-0000-0000-000000000004","role":"authenticated"}';
select is((select count(*)::int from public.household_weather_location),0,'other household cannot read location');
select is((select count(*)::int from public.profile_appearance_preferences),0,'other household cannot read preferences');
reset role;
update public.profile set status='nieaktywny' where id='a6000000-0000-0000-0000-000000000002';
set local role authenticated;
set local "request.jwt.claims"='{"sub":"a6000000-0000-0000-0000-000000000002","role":"authenticated"}';
select is((select count(*)::int from public.profile_appearance_preferences),0,'inactive profile cannot read saved preferences');
select is((select count(*)::int from public.household_weather_location),0,'inactive profile cannot read household location');
reset role;

create temp table weather_lease(value jsonb);grant all on weather_lease to service_role;
set local role service_role;
insert into weather_lease select public.weather_cache_claim('weather-test-key');
select is((select value->>'kind' from weather_lease),'claimed','first worker obtains shared lease');
select is(public.weather_cache_claim('weather-test-key')->>'kind','busy','identical concurrent refresh is coalesced');
select ok(not public.weather_cache_finish('weather-test-key',gen_random_uuid(),'{"fixture":true}'),'wrong lease cannot poison cache');
select ok(public.weather_cache_finish('weather-test-key',(select (value->>'token')::uuid from weather_lease),'{"fixture":true}'),'lease owner can populate cache');
select is(public.weather_cache_claim('weather-test-key')->>'kind','cached','another worker receives cached data');
select ok((select expires_at between now()+interval '44 minutes' and now()+interval '46 minutes' from public.weather_location_cache where location_key='weather-test-key'),'cache lifetime is 45 minutes');
update public.weather_location_cache set expires_at=now()-interval '1 second' where location_key='weather-test-key';
truncate weather_lease;insert into weather_lease select public.weather_cache_claim('weather-test-key');
select ok(public.weather_cache_finish('weather-test-key',(select (value->>'token')::uuid from weather_lease),null,600),'provider failure closes lease with retry delay');
select is(public.weather_cache_claim('weather-test-key')->>'kind','busy','provider failure is throttled instead of repeated');
select ok((select payload is null from public.weather_location_cache where location_key='weather-test-key'),'failed refresh does not retain stale conditions as current');
reset role;
select * from finish();
rollback;
