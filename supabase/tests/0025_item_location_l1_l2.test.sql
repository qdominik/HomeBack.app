begin;

create extension if not exists pgtap with schema extensions;
set search_path = extensions, public, auth;

select no_plan();

select col_is_null('public', 'item_location', 'room_id', 'L1 FK is nullable');
select col_is_null('public', 'item_location', 'storage_location_l2_id', 'L2 FK is nullable');
select col_is_null('public', 'item_location', 'storage_location_l3_id', 'legacy L3 FK is nullable');
select ok((select relrowsecurity from pg_class where oid='public.item_location'::regclass), 'item_location RLS stays enabled');
select ok(not (select prosecdef from pg_proc where oid='public.set_item_primary_location(uuid,uuid,uuid,uuid)'::regprocedure), 'new RPC is security invoker');
select ok(has_function_privilege('authenticated','public.set_item_primary_location(uuid,uuid,uuid,uuid)','EXECUTE'), 'authenticated can call new RPC');
select ok(not has_function_privilege('anon','public.set_item_primary_location(uuid,uuid,uuid,uuid)','EXECUTE'), 'anonymous cannot call new RPC');
select ok(not exists (
  select 1 from pg_proc p, lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) acl
  where p.oid='public.set_item_primary_location(uuid,uuid,uuid,uuid)'::regprocedure and acl.grantee=0
), 'PUBLIC has no new RPC privileges');


insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '15000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'm4a-admin-a@example.test',
    crypt('password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '15000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'm4a-member-a@example.test',
    crypt('password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '15000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'm4a-child-a@example.test',
    crypt('password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '15000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'm4a-admin-b@example.test',
    crypt('password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

insert into public.household (id, nazwa, typ)
values
  ('25000000-0000-0000-0000-000000000001', 'M4A Home A', 'dom'),
  ('25000000-0000-0000-0000-000000000002', 'M4A Home B', 'mieszkanie');

insert into public.profile (
  id,
  household_id,
  imie,
  email,
  rola,
  status
)
values
  (
    '15000000-0000-0000-0000-000000000001',
    '25000000-0000-0000-0000-000000000001',
    'Admin A',
    'm4a-admin-a@example.test',
    'admin',
    'aktywny'
  ),
  (
    '15000000-0000-0000-0000-000000000002',
    '25000000-0000-0000-0000-000000000001',
    'Member A',
    'm4a-member-a@example.test',
    'dorosły',
    'aktywny'
  ),
  (
    '15000000-0000-0000-0000-000000000003',
    '25000000-0000-0000-0000-000000000001',
    'Child A',
    'm4a-child-a@example.test',
    'dziecko',
    'aktywny'
  ),
  (
    '15000000-0000-0000-0000-000000000004',
    '25000000-0000-0000-0000-000000000002',
    'Admin B',
    'm4a-admin-b@example.test',
    'admin',
    'aktywny'
  );

insert into public.category (
  id,
  household_id,
  nazwa,
  czy_systemowa,
  widoczna_dla_dzieci
)
values
  (
    '35000000-0000-0000-0000-000000000001',
    '25000000-0000-0000-0000-000000000001',
    'M4A Custom A',
    false,
    true
  ),
  (
    '35000000-0000-0000-0000-000000000002',
    '25000000-0000-0000-0000-000000000002',
    'M4A Custom B',
    false,
    true
  );

insert into public.room (id, household_id, nazwa, typ, "kolejność")
values
  (
    '36000000-0000-0000-0000-000000000001',
    '25000000-0000-0000-0000-000000000001',
    'M4A Room A',
    'Room',
    1
  ),
  (
    '36000000-0000-0000-0000-000000000002',
    '25000000-0000-0000-0000-000000000002',
    'M4A Room B',
    'Room',
    1
  );

insert into public.storage_location_l2 (
  id,
  room_id,
  nazwa,
  typ,
  "kolejność"
)
values
  (
    '37000000-0000-0000-0000-000000000001',
    '36000000-0000-0000-0000-000000000001',
    'M4A Storage A',
    'Shelf',
    1
  ),
  (
    '37000000-0000-0000-0000-000000000002',
    '36000000-0000-0000-0000-000000000002',
    'M4A Storage B',
    'Shelf',
    1
  );

insert into public.storage_location_l3 (
  id,
  storage_location_l2_id,
  nazwa,
  kod_lokalizacji,
  "kolejność"
)
values
  (
    '38000000-0000-0000-0000-000000000001',
    '37000000-0000-0000-0000-000000000001',
    'M4A Position A1',
    'M4A-A1',
    1
  ),
  (
    '38000000-0000-0000-0000-000000000002',
    '37000000-0000-0000-0000-000000000001',
    'M4A Position A2',
    'M4A-A2',
    2
  ),
  (
    '38000000-0000-0000-0000-000000000003',
    '37000000-0000-0000-0000-000000000002',
    'M4A Position B1',
    'M4A-B1',
    1
  );


-- Isolated fixtures are rolled back; none of the local owner's data is changed.
insert into public.item(id, household_id, category_id, nazwa, typ, status, created_by_id)
select ('39000000-0000-0000-0000-' || lpad(n::text,12,'0'))::uuid,
  '25000000-0000-0000-0000-000000000001', '35000000-0000-0000-0000-000000000001',
  'Location test ' || n, 'unikalny', case when n=3 then 'archiwalne'::public.item_status else 'w domu'::public.item_status end,
  '15000000-0000-0000-0000-000000000001' from generate_series(1,4) n;
insert into public.item(id, household_id, category_id, nazwa, typ, status, created_by_id)
values ('39000000-0000-0000-0000-000000000005','25000000-0000-0000-0000-000000000002',
'35000000-0000-0000-0000-000000000002','Foreign item','unikalny','w domu','15000000-0000-0000-0000-000000000004');
select throws_ok($test$insert into public.item_location(item_id,room_id,czy_glowna) values ('39000000-0000-0000-0000-000000000001','ffffffff-ffff-ffff-ffff-ffffffffffff',true)$test$, '23503', null, 'room_id missing FK rejected');
select throws_ok($test$insert into public.item_location(item_id,storage_location_l2_id,czy_glowna) values ('39000000-0000-0000-0000-000000000001','ffffffff-ffff-ffff-ffff-ffffffffffff',true)$test$, '23503', null, 'storage_location_l2_id missing FK rejected');
select throws_ok($test$insert into public.item_location(item_id,storage_location_l3_id,czy_glowna) values ('39000000-0000-0000-0000-000000000001','ffffffff-ffff-ffff-ffff-ffffffffffff',true)$test$, '23503', null, 'storage_location_l3_id missing FK rejected');
select throws_ok($test$insert into public.item_location(item_id,czy_glowna) values ('39000000-0000-0000-0000-000000000001',true)$test$, '23514', null, 'empty row rejected; no assignment uses no row');
select throws_ok($test$insert into public.item_location(item_id,czy_glowna,room_id,storage_location_l2_id) values ('39000000-0000-0000-0000-000000000001',true,'36000000-0000-0000-0000-000000000001','37000000-0000-0000-0000-000000000001')$test$, '23514', null, 'multiple targets rejected 2');
select throws_ok($test$insert into public.item_location(item_id,czy_glowna,room_id,storage_location_l3_id) values ('39000000-0000-0000-0000-000000000001',true,'36000000-0000-0000-0000-000000000001','38000000-0000-0000-0000-000000000001')$test$, '23514', null, 'multiple targets rejected 2');
select throws_ok($test$insert into public.item_location(item_id,czy_glowna,storage_location_l2_id,storage_location_l3_id) values ('39000000-0000-0000-0000-000000000001',true,'37000000-0000-0000-0000-000000000001','38000000-0000-0000-0000-000000000001')$test$, '23514', null, 'multiple targets rejected 2');
select throws_ok($test$insert into public.item_location(item_id,czy_glowna,room_id,storage_location_l2_id,storage_location_l3_id) values ('39000000-0000-0000-0000-000000000001',true,'36000000-0000-0000-0000-000000000001','37000000-0000-0000-0000-000000000001','38000000-0000-0000-0000-000000000001')$test$, '23514', null, 'multiple targets rejected 3');
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"15000000-0000-0000-0000-000000000001","role":"authenticated"}';
select is((select count(*) from public.item_location where item_id='39000000-0000-0000-0000-000000000001'), 0::bigint, 'unlocated item has no row');
select lives_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000001', null, null, '36000000-0000-0000-0000-000000000001')$test$, 'save room_id');
select is((select room_id::text from public.item_location where item_id='39000000-0000-0000-0000-000000000001' and czy_glowna), '36000000-0000-0000-0000-000000000001', 'deepest target persisted room_id');
select is((select count(*) from public.item_location where item_id='39000000-0000-0000-0000-000000000001'), 1::bigint, 'transition retains one assignment');
select throws_ok($test$delete from public.room where id='36000000-0000-0000-0000-000000000001'$test$, '23503', null, 'direct deletion blocked room_id');
select lives_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000001', null, '37000000-0000-0000-0000-000000000001', null)$test$, 'save storage_location_l2_id');
select is((select storage_location_l2_id::text from public.item_location where item_id='39000000-0000-0000-0000-000000000001' and czy_glowna), '37000000-0000-0000-0000-000000000001', 'deepest target persisted storage_location_l2_id');
select is((select count(*) from public.item_location where item_id='39000000-0000-0000-0000-000000000001'), 1::bigint, 'transition retains one assignment');
select throws_ok($test$delete from public.storage_location_l2 where id='37000000-0000-0000-0000-000000000001'$test$, '23503', null, 'direct deletion blocked storage_location_l2_id');
select lives_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000001', '38000000-0000-0000-0000-000000000001', null, null)$test$, 'save storage_location_l3_id');
select is((select storage_location_l3_id::text from public.item_location where item_id='39000000-0000-0000-0000-000000000001' and czy_glowna), '38000000-0000-0000-0000-000000000001', 'deepest target persisted storage_location_l3_id');
select is((select count(*) from public.item_location where item_id='39000000-0000-0000-0000-000000000001'), 1::bigint, 'transition retains one assignment');
select throws_ok($test$delete from public.storage_location_l3 where id='38000000-0000-0000-0000-000000000001'$test$, '23503', null, 'direct deletion blocked storage_location_l3_id');
select lives_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000001', null, null, '36000000-0000-0000-0000-000000000001')$test$, 'save room_id');
select is((select room_id::text from public.item_location where item_id='39000000-0000-0000-0000-000000000001' and czy_glowna), '36000000-0000-0000-0000-000000000001', 'deepest target persisted room_id');
select is((select count(*) from public.item_location where item_id='39000000-0000-0000-0000-000000000001'), 1::bigint, 'transition retains one assignment');
select throws_ok($test$delete from public.room where id='36000000-0000-0000-0000-000000000001'$test$, '23503', null, 'direct deletion blocked room_id');
create temporary table saved_link as select * from public.item_location where item_id='39000000-0000-0000-0000-000000000001';
select lives_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000001', null, null, '36000000-0000-0000-0000-000000000001')$test$, 'same target saved again');
select is((select row_to_json(il)::text from public.item_location il where item_id='39000000-0000-0000-0000-000000000001'), (select row_to_json(t)::text from saved_link t), 'idempotent save preserves entire record');
select lives_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000001', null, null, null)$test$, 'clear primary');
select is((select count(*) from public.item_location where item_id='39000000-0000-0000-0000-000000000001'), 0::bigint, 'clear returns to no assignment');
insert into public.item_location(id,item_id,room_id,czy_glowna,notatka) values ('49000000-0000-0000-0000-000000000001','39000000-0000-0000-0000-000000000001','36000000-0000-0000-0000-000000000001',false,'keep note');
insert into public.item_location(item_id,storage_location_l2_id,czy_glowna) values ('39000000-0000-0000-0000-000000000001','37000000-0000-0000-0000-000000000001',false);
select lives_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000001', null, null, '36000000-0000-0000-0000-000000000001')$test$, 'promote existing additional room');
select is((select id::text || ':' || notatka from public.item_location where item_id='39000000-0000-0000-0000-000000000001' and czy_glowna), '49000000-0000-0000-0000-000000000001:keep note', 'promotion preserves id and note');
select is((select count(*) from public.item_location where item_id='39000000-0000-0000-0000-000000000001'), 2::bigint, 'promotion does not duplicate; additional furniture preserved');
select throws_ok($test$insert into public.item_location(item_id,storage_location_l3_id,czy_glowna) values ('39000000-0000-0000-0000-000000000001','38000000-0000-0000-0000-000000000001',true)$test$, '23505', null, 'one primary across all levels');
select throws_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000001',null,'37000000-0000-0000-0000-000000000001','36000000-0000-0000-0000-000000000001')$test$, 'P0001', null, 'RPC rejects multiple targets atomically');
select throws_ok($test$insert into public.item_location(item_id,room_id,czy_glowna) values ('39000000-0000-0000-0000-000000000001','36000000-0000-0000-0000-000000000002',false)$test$, '42501', null, 'RLS foreign target insert room_id');
select throws_ok($test$update public.item_location set room_id='36000000-0000-0000-0000-000000000002',storage_location_l2_id=null,storage_location_l3_id=null where item_id='39000000-0000-0000-0000-000000000001'$test$, '42501', null, 'RLS foreign target update room_id');
select throws_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000001', null, null, '36000000-0000-0000-0000-000000000002')$test$, 'P0001', null, 'RPC foreign target room_id');
select throws_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000005', null, null, '36000000-0000-0000-0000-000000000001')$test$, 'P0001', null, 'RPC foreign item room_id');
select throws_ok($test$insert into public.item_location(item_id,storage_location_l2_id,czy_glowna) values ('39000000-0000-0000-0000-000000000001','37000000-0000-0000-0000-000000000002',false)$test$, '42501', null, 'RLS foreign target insert storage_location_l2_id');
select throws_ok($test$update public.item_location set room_id=null,storage_location_l2_id='37000000-0000-0000-0000-000000000002',storage_location_l3_id=null where item_id='39000000-0000-0000-0000-000000000001'$test$, '42501', null, 'RLS foreign target update storage_location_l2_id');
select throws_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000001', null, '37000000-0000-0000-0000-000000000002', null)$test$, 'P0001', null, 'RPC foreign target storage_location_l2_id');
select throws_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000005', null, '37000000-0000-0000-0000-000000000001', null)$test$, 'P0001', null, 'RPC foreign item storage_location_l2_id');
select throws_ok($test$insert into public.item_location(item_id,storage_location_l3_id,czy_glowna) values ('39000000-0000-0000-0000-000000000001','38000000-0000-0000-0000-000000000003',false)$test$, '42501', null, 'RLS foreign target insert storage_location_l3_id');
select throws_ok($test$update public.item_location set room_id=null,storage_location_l2_id=null,storage_location_l3_id='38000000-0000-0000-0000-000000000003' where item_id='39000000-0000-0000-0000-000000000001'$test$, '42501', null, 'RLS foreign target update storage_location_l3_id');
select throws_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000001', '38000000-0000-0000-0000-000000000003', null, null)$test$, 'P0001', null, 'RPC foreign target storage_location_l3_id');
select throws_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000005', '38000000-0000-0000-0000-000000000001', null, null)$test$, 'P0001', null, 'RPC foreign item storage_location_l3_id');
select throws_ok($test$update public.room set household_id='25000000-0000-0000-0000-000000000002' where id='36000000-0000-0000-0000-000000000001'$test$, '42501', null, 'room cannot leave household');
select throws_ok($test$update public.storage_location_l2 set room_id='36000000-0000-0000-0000-000000000002' where id='37000000-0000-0000-0000-000000000001'$test$, '42501', null, 'furniture cannot leave household');
select throws_ok($test$update public.storage_location_l3 set storage_location_l2_id='37000000-0000-0000-0000-000000000002' where id='38000000-0000-0000-0000-000000000001'$test$, '42501', null, 'storage cannot leave household');
insert into public.item_location(item_id,storage_location_l3_id,czy_glowna) values ('39000000-0000-0000-0000-000000000001','38000000-0000-0000-0000-000000000001',false);
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"15000000-0000-0000-0000-000000000002","role":"authenticated"}';
select throws_ok($test$insert into public.item_location(item_id,room_id,czy_glowna) values ('39000000-0000-0000-0000-000000000001','36000000-0000-0000-0000-000000000001',false)$test$, '42501', null, 'role 2 cannot write room_id');
select throws_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000001', null, null, '36000000-0000-0000-0000-000000000001')$test$, 'P0001', null, 'role 2 cannot RPC room_id');
select throws_ok($test$insert into public.item_location(item_id,storage_location_l2_id,czy_glowna) values ('39000000-0000-0000-0000-000000000001','37000000-0000-0000-0000-000000000001',false)$test$, '42501', null, 'role 2 cannot write storage_location_l2_id');
select throws_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000001', null, '37000000-0000-0000-0000-000000000001', null)$test$, 'P0001', null, 'role 2 cannot RPC storage_location_l2_id');
select throws_ok($test$insert into public.item_location(item_id,storage_location_l3_id,czy_glowna) values ('39000000-0000-0000-0000-000000000001','38000000-0000-0000-0000-000000000001',false)$test$, '42501', null, 'role 2 cannot write storage_location_l3_id');
select throws_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000001', '38000000-0000-0000-0000-000000000001', null, null)$test$, 'P0001', null, 'role 2 cannot RPC storage_location_l3_id');
select is((select count(*) from public.item_location where item_id='39000000-0000-0000-0000-000000000001'), 3::bigint, 'role 2 sees only allowed household links all levels');
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"15000000-0000-0000-0000-000000000003","role":"authenticated"}';
select throws_ok($test$insert into public.item_location(item_id,room_id,czy_glowna) values ('39000000-0000-0000-0000-000000000001','36000000-0000-0000-0000-000000000001',false)$test$, '42501', null, 'role 3 cannot write room_id');
select throws_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000001', null, null, '36000000-0000-0000-0000-000000000001')$test$, 'P0001', null, 'role 3 cannot RPC room_id');
select throws_ok($test$insert into public.item_location(item_id,storage_location_l2_id,czy_glowna) values ('39000000-0000-0000-0000-000000000001','37000000-0000-0000-0000-000000000001',false)$test$, '42501', null, 'role 3 cannot write storage_location_l2_id');
select throws_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000001', null, '37000000-0000-0000-0000-000000000001', null)$test$, 'P0001', null, 'role 3 cannot RPC storage_location_l2_id');
select throws_ok($test$insert into public.item_location(item_id,storage_location_l3_id,czy_glowna) values ('39000000-0000-0000-0000-000000000001','38000000-0000-0000-0000-000000000001',false)$test$, '42501', null, 'role 3 cannot write storage_location_l3_id');
select throws_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000001', '38000000-0000-0000-0000-000000000001', null, null)$test$, 'P0001', null, 'role 3 cannot RPC storage_location_l3_id');
select is((select count(*) from public.item_location where item_id='39000000-0000-0000-0000-000000000001'), 3::bigint, 'role 3 sees only allowed household links all levels');
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"15000000-0000-0000-0000-000000000004","role":"authenticated"}';
select throws_ok($test$insert into public.item_location(item_id,room_id,czy_glowna) values ('39000000-0000-0000-0000-000000000001','36000000-0000-0000-0000-000000000001',false)$test$, '42501', null, 'role 4 cannot write room_id');
select throws_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000001', null, null, '36000000-0000-0000-0000-000000000001')$test$, 'P0001', null, 'role 4 cannot RPC room_id');
select throws_ok($test$insert into public.item_location(item_id,storage_location_l2_id,czy_glowna) values ('39000000-0000-0000-0000-000000000001','37000000-0000-0000-0000-000000000001',false)$test$, '42501', null, 'role 4 cannot write storage_location_l2_id');
select throws_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000001', null, '37000000-0000-0000-0000-000000000001', null)$test$, 'P0001', null, 'role 4 cannot RPC storage_location_l2_id');
select throws_ok($test$insert into public.item_location(item_id,storage_location_l3_id,czy_glowna) values ('39000000-0000-0000-0000-000000000001','38000000-0000-0000-0000-000000000001',false)$test$, '42501', null, 'role 4 cannot write storage_location_l3_id');
select throws_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000001', '38000000-0000-0000-0000-000000000001', null, null)$test$, 'P0001', null, 'role 4 cannot RPC storage_location_l3_id');
select is((select count(*) from public.item_location where item_id='39000000-0000-0000-0000-000000000001'), 0::bigint, 'role 4 sees only allowed household links all levels');
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"15000000-0000-0000-0000-000000000001","role":"authenticated"}';
select is((select total_distinct_items_count from public.get_room_location_dependency_summary('36000000-0000-0000-0000-000000000001')), 1::bigint, 'overlapping levels count item once');
select is((select active_direct_items_count from public.get_room_location_dependency_summary('36000000-0000-0000-0000-000000000001')), 1::bigint, 'direct classification takes priority');
select is((select active_nested_items_count from public.get_room_location_dependency_summary('36000000-0000-0000-0000-000000000001')), 0::bigint, 'nested count excludes already direct item');
select is((select total_location_links_count from public.get_room_location_dependency_summary('36000000-0000-0000-0000-000000000001')), 3::bigint, 'all three links counted');
select is((select active_direct_items_count from public.get_storage_location_l2_dependency_summary('37000000-0000-0000-0000-000000000001')), 1::bigint, 'furniture direct counter includes L2');
select is((select detached_link_count from public.detach_items_from_storage_location_l2('37000000-0000-0000-0000-000000000001')), 2::bigint, 'detach furniture includes L2 and L3');
select is((select detached_link_count from public.detach_items_from_room_location('36000000-0000-0000-0000-000000000001')), 1::bigint, 'detach room includes L1');
select is((select detached_link_count from public.detach_items_from_room_location('36000000-0000-0000-0000-000000000001')), 0::bigint, 'repeat detach is idempotent');
insert into public.room(id,household_id,nazwa,typ,"kolejność") values ('36000000-0000-0000-0000-000000000003','25000000-0000-0000-0000-000000000001','Target room','Room',2);
insert into public.storage_location_l2(id,room_id,nazwa,typ,"kolejność") values ('37000000-0000-0000-0000-000000000003','36000000-0000-0000-0000-000000000003','Target furniture','Shelf',1);
insert into public.storage_location_l3(id,storage_location_l2_id,nazwa,kod_lokalizacji,"kolejność") values ('38000000-0000-0000-0000-000000000004','37000000-0000-0000-0000-000000000003','Target storage','TARGET',1);
select lives_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000001', null, null, '36000000-0000-0000-0000-000000000001')$test$, 'prepare resolution room_id');
select lives_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000002', null, '37000000-0000-0000-0000-000000000001', null)$test$, 'prepare resolution storage_location_l2_id');
select lives_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000003', '38000000-0000-0000-0000-000000000001', null, null)$test$, 'prepare resolution storage_location_l3_id');
select is((select moved_item_count from public.move_primary_items_from_location('storage','37000000-0000-0000-0000-000000000001','38000000-0000-0000-0000-000000000004')), 2::bigint, 'bulk move furniture includes direct L2 and archived L3');
select is((select moved_item_count from public.move_primary_items_from_location('room','36000000-0000-0000-0000-000000000001','38000000-0000-0000-0000-000000000004')), 1::bigint, 'bulk move room includes direct L1');
select lives_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000001', null, null, '36000000-0000-0000-0000-000000000001')$test$, 'prepare delete room_id');
select lives_ok($test$select public.set_item_primary_location('39000000-0000-0000-0000-000000000002', null, '37000000-0000-0000-0000-000000000001', null)$test$, 'prepare delete storage_location_l2_id');
select is((select detached_link_count from public.delete_room_with_resolution('36000000-0000-0000-0000-000000000001','detach',null,1,2,2,2)), 2::bigint, 'room deletion resolves direct room and furniture links');
select is((select count(*) from public.item where id::text like '39000000-%'), 4::bigint, 'resolution preserves all own items including unlocated and archived');
select is((select count(*) from public.room where id='36000000-0000-0000-0000-000000000001'), 0::bigint, 'resolved room deleted');
select * from finish();
rollback;
