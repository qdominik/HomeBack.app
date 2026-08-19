begin;

create extension if not exists pgtap with schema extensions;
set search_path = extensions, public, auth;

select no_plan();

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  ('00000000-0000-0000-0000-000000000000', '18000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'm4c1-admin-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '18000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'm4c1-member-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '18000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'm4c1-child-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '18000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'm4c1-admin-b@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '18000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'm4c1-no-profile@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '18000000-0000-4000-8000-000000000006', 'authenticated', 'authenticated', 'm4c1-inactive-owner@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

insert into public.household (id, nazwa, typ)
values
  ('28000000-0000-4000-8000-000000000001', 'M4C1 household A', 'dom'),
  ('28000000-0000-4000-8000-000000000002', 'M4C1 household B', 'mieszkanie');

insert into public.profile (id, household_id, imie, email, rola, status)
values
  ('18000000-0000-4000-8000-000000000001', '28000000-0000-4000-8000-000000000001', 'Admin A', 'm4c1-admin-a@example.test', 'admin', 'aktywny'),
  ('18000000-0000-4000-8000-000000000002', '28000000-0000-4000-8000-000000000001', 'Member A', 'm4c1-member-a@example.test', 'domownik', 'aktywny'),
  ('18000000-0000-4000-8000-000000000003', '28000000-0000-4000-8000-000000000001', 'Child A', 'm4c1-child-a@example.test', 'dziecko', 'aktywny'),
  ('18000000-0000-4000-8000-000000000004', '28000000-0000-4000-8000-000000000002', 'Admin B', 'm4c1-admin-b@example.test', 'admin', 'aktywny'),
  ('18000000-0000-4000-8000-000000000006', '28000000-0000-4000-8000-000000000001', 'Inactive owner', 'm4c1-inactive-owner@example.test', 'domownik', 'nieaktywny');

insert into public.category (id, household_id, nazwa, czy_systemowa, widoczna_dla_dzieci)
values
  ('38000000-0000-4000-8000-000000000001', '28000000-0000-4000-8000-000000000001', 'M4C1 category A', false, true),
  ('38000000-0000-4000-8000-000000000002', '28000000-0000-4000-8000-000000000002', 'M4C1 category B', false, true);

insert into public.room (id, household_id, nazwa, typ, ikona, opis, "kolejność")
values
  ('48000000-0000-4000-8000-000000000001', '28000000-0000-4000-8000-000000000001', 'Kitchen', 'kuchnia', 'kitchen', 'Source Room', 1),
  ('48000000-0000-4000-8000-000000000002', '28000000-0000-4000-8000-000000000001', 'Office', 'biuro', 'office', 'Target Room', 2),
  ('48000000-0000-4000-8000-000000000003', '28000000-0000-4000-8000-000000000002', 'Foreign room', 'biuro', 'office', null, 1);

insert into public.storage_location_l2 (id, room_id, nazwa, typ, ikona, opis, "kolejność")
values
  ('58000000-0000-4000-8000-000000000001', '48000000-0000-4000-8000-000000000001', 'Cabinet', 'szafka', 'dresser', 'Source Furniture', 1),
  ('58000000-0000-4000-8000-000000000002', '48000000-0000-4000-8000-000000000002', 'Desk cabinet', 'szafka', null, 'Target Furniture', 1),
  ('58000000-0000-4000-8000-000000000003', '48000000-0000-4000-8000-000000000002', 'Rollback furniture', 'szafka', null, null, 2),
  ('58000000-0000-4000-8000-000000000004', '48000000-0000-4000-8000-000000000003', 'Foreign furniture', 'szafka', null, null, 1);

insert into public.storage_location_l3 (
  id, storage_location_l2_id, nazwa, ikona, opis, kod_lokalizacji, "kolejność"
)
values
  ('68000000-0000-4000-8000-000000000001', '58000000-0000-4000-8000-000000000001', 'Drawer 1', 'drawer', 'Source storage A', 'LEGACY-SOURCE-A', 1),
  ('68000000-0000-4000-8000-000000000002', '58000000-0000-4000-8000-000000000001', 'Drawer 2', null, 'Source storage B', 'LEGACY-SOURCE-B', 2),
  ('68000000-0000-4000-8000-000000000003', '58000000-0000-4000-8000-000000000002', 'Target drawer', null, 'Target storage', 'OFF-SZF-TAR1', 1),
  ('68000000-0000-4000-8000-000000000004', '58000000-0000-4000-8000-000000000003', '   ', null, null, 'OFF-SZF-ROL1', 1),
  ('68000000-0000-4000-8000-000000000005', '58000000-0000-4000-8000-000000000004', 'Foreign drawer', null, null, 'FOR-SZF-DRA1', 1);

insert into public.item (
  id, household_id, category_id, nazwa, opis, typ, ilosc, jednostka,
  termin_waznosci, opiekun_id, status, przechowywany_w_sejfie, miniatura_url,
  notatki, created_by_id
)
values
  ('78000000-0000-4000-8000-000000000001', '28000000-0000-4000-8000-000000000001', '38000000-0000-4000-8000-000000000001', 'Drill', 'Source item', 'unikalny', 1, null, '2030-01-01', '18000000-0000-4000-8000-000000000001', 'pożyczone', true, 'https://example.test/thumb', 'Keep notes', '18000000-0000-4000-8000-000000000001'),
  ('78000000-0000-4000-8000-000000000002', '28000000-0000-4000-8000-000000000001', '38000000-0000-4000-8000-000000000001', 'Unlocated source', null, 'zapas', 4, 'pcs', null, null, 'w domu', false, null, null, '18000000-0000-4000-8000-000000000001'),
  ('78000000-0000-4000-8000-000000000003', '28000000-0000-4000-8000-000000000001', '38000000-0000-4000-8000-000000000001', 'Invalid owner source', null, 'unikalny', 1, null, null, '18000000-0000-4000-8000-000000000006', 'w domu', false, null, null, '18000000-0000-4000-8000-000000000001'),
  ('78000000-0000-4000-8000-000000000004', '28000000-0000-4000-8000-000000000002', '38000000-0000-4000-8000-000000000002', 'Foreign item', null, 'unikalny', 1, null, null, null, 'w domu', false, null, null, '18000000-0000-4000-8000-000000000004');

insert into public.item_location (item_id, storage_location_l3_id, czy_glowna, notatka)
values
  ('78000000-0000-4000-8000-000000000001', '68000000-0000-4000-8000-000000000001', true, 'Source location');

insert into public.file (
  household_id, item_id, nazwa, plik_url, typ, rozmiar_kb, czy_zaszyfrowany, created_by_id
)
values (
  '28000000-0000-4000-8000-000000000001',
  '78000000-0000-4000-8000-000000000001',
  'source.pdf',
  'https://example.test/source.pdf',
  'pdf',
  1,
  false,
  '18000000-0000-4000-8000-000000000001'
);

-- RPC configuration, grants, and the approved split between invoker and definer.
select has_function('public', 'copy_room_with_structure', array['uuid', 'text', 'boolean'], 'Room copy RPC has no household argument');
select has_function('public', 'copy_furniture_with_storage', array['uuid', 'uuid', 'text', 'boolean'], 'Furniture copy RPC has no household argument');
select has_function('public', 'copy_storage_space', array['uuid', 'uuid', 'text'], 'Storage copy RPC has no household argument');
select has_function('public', 'copy_item', array['uuid', 'text', 'uuid'], 'Item copy RPC has no household argument');
select is(
  public.m4c1_normalize_code_key('Café Łódź'),
  'cafelodz',
  'SQL location-code normalization matches the canonical Unicode normalization'
);
select is((select not p.prosecdef from pg_proc as p where p.oid = 'public.copy_room_with_structure(uuid,text,boolean)'::regprocedure), true, 'Room copy is security invoker');
select is((select not p.prosecdef from pg_proc as p where p.oid = 'public.copy_furniture_with_storage(uuid,uuid,text,boolean)'::regprocedure), true, 'Furniture copy is security invoker');
select is((select not p.prosecdef from pg_proc as p where p.oid = 'public.copy_storage_space(uuid,uuid,text)'::regprocedure), true, 'Storage copy is security invoker');
select is((select p.prosecdef from pg_proc as p where p.oid = 'public.copy_item(uuid,text,uuid)'::regprocedure), true, 'Item copy is narrowly security definer for approved member copying');
select ok((select p.proconfig @> array['search_path=""'] from pg_proc as p where p.oid = 'public.copy_item(uuid,text,uuid)'::regprocedure), 'Item copy has an empty search_path');
select ok(not has_function_privilege('public', 'public.copy_item(uuid,text,uuid)'::regprocedure, 'EXECUTE'), 'PUBLIC cannot execute Item copy');
select ok(not has_function_privilege('anon', 'public.copy_item(uuid,text,uuid)'::regprocedure, 'EXECUTE'), 'anon cannot execute Item copy');
select ok(has_function_privilege('authenticated', 'public.copy_item(uuid,text,uuid)'::regprocedure, 'EXECUTE'), 'authenticated can execute Item copy');

set local role authenticated;
set local "request.jwt.claims" = '{}';
select throws_ok($$ select * from public.copy_room_with_structure('48000000-0000-4000-8000-000000000001', 'Unauthenticated copy', false) $$, 'P0001', 'AUTH_REQUIRED', 'anonymous Room copy is rejected');

set local "request.jwt.claims" = '{"sub":"18000000-0000-4000-8000-000000000005","role":"authenticated"}';
select throws_ok($$ select * from public.copy_item('78000000-0000-4000-8000-000000000001', 'No profile copy', null) $$, 'P0001', 'ACTIVE_PROFILE_REQUIRED', 'copy requires an active profile');

set local "request.jwt.claims" = '{"sub":"18000000-0000-4000-8000-000000000002","role":"authenticated"}';
select throws_ok($$ select * from public.copy_room_with_structure('48000000-0000-4000-8000-000000000001', 'Member Room copy', false) $$, 'P0001', 'ADMIN_REQUIRED', 'member cannot copy a Room');
select throws_ok($$ select * from public.copy_furniture_with_storage('58000000-0000-4000-8000-000000000001', '48000000-0000-4000-8000-000000000002', 'Member Furniture copy', false) $$, 'P0001', 'ADMIN_REQUIRED', 'member cannot copy Furniture');
select throws_ok($$ select * from public.copy_storage_space('68000000-0000-4000-8000-000000000001', '58000000-0000-4000-8000-000000000002', 'Member Storage copy') $$, 'P0001', 'ADMIN_REQUIRED', 'member cannot copy Storage');

set local "request.jwt.claims" = '{"sub":"18000000-0000-4000-8000-000000000003","role":"authenticated"}';
select throws_ok($$ select * from public.copy_item('78000000-0000-4000-8000-000000000001', 'Child Item copy', null) $$, 'P0001', 'COPY_NOT_ALLOWED', 'child cannot copy an Item');

set local "request.jwt.claims" = '{"sub":"18000000-0000-4000-8000-000000000004","role":"authenticated"}';
select throws_ok($$ select * from public.copy_room_with_structure('48000000-0000-4000-8000-000000000001', 'Foreign Room copy', false) $$, 'P0001', 'SOURCE_NOT_AVAILABLE', 'foreign household cannot copy a Room source');
select throws_ok($$ select * from public.copy_item('78000000-0000-4000-8000-000000000001', 'Foreign Item copy', null) $$, 'P0001', 'SOURCE_NOT_AVAILABLE', 'foreign household cannot copy an Item source');

set local "request.jwt.claims" = '{"sub":"18000000-0000-4000-8000-000000000001","role":"authenticated"}';

select is(
  (select copied_name from public.copy_room_with_structure('48000000-0000-4000-8000-000000000001', 'Kitchen — kopia', false)),
  'Kitchen — kopia',
  'Room copy uses the requested default copy name'
);
select is(
  (select copied_name from public.copy_room_with_structure('48000000-0000-4000-8000-000000000001', 'Kitchen — kopia', false)),
  'Kitchen — kopia 2',
  'Room name collision uses a readable numbered suffix'
);
select is(
  (select copied_furniture_count from public.copy_room_with_structure('48000000-0000-4000-8000-000000000001', 'Kitchen structure copy', true)),
  1,
  'Room structure copy creates Furniture'
);
select is(
  (select copied_storage_count from public.copy_room_with_structure('48000000-0000-4000-8000-000000000001', 'Kitchen structure copy 2', true)),
  2,
  'Room structure copy creates Storage spaces'
);
select is(
  (select count(*) from public.item_location as il
    join public.storage_location_l3 as l3 on l3.id = il.storage_location_l3_id
    join public.storage_location_l2 as l2 on l2.id = l3.storage_location_l2_id
    join public.room as r on r.id = l2.room_id
    where r.nazwa in ('Kitchen structure copy', 'Kitchen structure copy 2')),
  0::bigint,
  'Room structure copy does not copy Item locations or Items'
);
select ok(
  (select bool_and(l3.kod_lokalizacji like 'KUC-SZF-%')
    from public.storage_location_l3 as l3
    join public.storage_location_l2 as l2 on l2.id = l3.storage_location_l2_id
    join public.room as r on r.id = l2.room_id
    where r.nazwa in ('Kitchen structure copy', 'Kitchen structure copy 2')),
  'Room structure copies use canonical new location codes'
);
select is(
  (select count(distinct l3.kod_lokalizacji)
    from public.storage_location_l3 as l3
    join public.storage_location_l2 as l2 on l2.id = l3.storage_location_l2_id
    join public.room as r on r.id = l2.room_id
    where r.nazwa in ('Kitchen', 'Kitchen structure copy', 'Kitchen structure copy 2')
      and l3.nazwa = 'Drawer 1'),
  3::bigint,
  'two Room structure copies generate distinct codes for a digit-suffixed Storage name'
);

select is(
  (select copied_storage_count from public.copy_furniture_with_storage('58000000-0000-4000-8000-000000000001', '48000000-0000-4000-8000-000000000002', 'Cabinet copy', true)),
  2,
  'Furniture copy to another Room includes Storage spaces'
);
select is(
  (select ikona from public.storage_location_l2 where nazwa = 'Cabinet copy'),
  'dresser',
  'Furniture copy preserves the source L2 icon'
);
select is(
  (select l3.ikona from public.storage_location_l3 as l3
    join public.storage_location_l2 as l2 on l2.id = l3.storage_location_l2_id
    where l2.nazwa = 'Cabinet copy' and l3.nazwa = 'Drawer 1'),
  'drawer',
  'Furniture copy preserves the first nested L3 icon'
);
select is(
  (select l3.ikona from public.storage_location_l3 as l3
    join public.storage_location_l2 as l2 on l2.id = l3.storage_location_l2_id
    where l2.nazwa = 'Cabinet copy' and l3.nazwa = 'Drawer 2'),
  null::text,
  'Furniture copy preserves NULL for a nested L3 without an icon'
);
select is(
  (select copied_storage_count from public.copy_furniture_with_storage('58000000-0000-4000-8000-000000000001', '48000000-0000-4000-8000-000000000002', 'Cabinet only copy', false)),
  0,
  'Furniture copy can omit Storage spaces'
);
select is(
  (select count(*) from public.item_location as il
    join public.storage_location_l3 as l3 on l3.id = il.storage_location_l3_id
    join public.storage_location_l2 as l2 on l2.id = l3.storage_location_l2_id
    where l2.nazwa = 'Cabinet copy'),
  0::bigint,
  'Furniture copy does not copy Items'
);

select is(
  (select copied_name from public.copy_storage_space('68000000-0000-4000-8000-000000000001', '58000000-0000-4000-8000-000000000002', 'Drawer copy')),
  'Drawer copy',
  'Storage copy can use another Furniture target'
);
select is(
  (select ikona from public.storage_location_l3 where nazwa = 'Drawer copy'),
  'drawer',
  'direct Storage copy preserves the source L3 icon'
);
select is(
  (select ikona from public.storage_location_l3
    where (nazwa, storage_location_l2_id) = ('Drawer null copy', '58000000-0000-4000-8000-000000000002'::uuid)),
  null::text,
  'direct Storage copy preserves NULL'
)
from public.copy_storage_space(
  '68000000-0000-4000-8000-000000000002',
  '58000000-0000-4000-8000-000000000002',
  'Drawer null copy'
);
select is(
  (select count(*) from public.item_location as il
    join public.storage_location_l3 as l3 on l3.id = il.storage_location_l3_id
    where l3.nazwa = 'Drawer copy'),
  0::bigint,
  'Storage copy does not copy Items'
);
select throws_ok($$ select * from public.copy_storage_space('68000000-0000-4000-8000-000000000001', '58000000-0000-4000-8000-000000000004', 'Foreign target') $$, 'P0001', 'TARGET_NOT_AVAILABLE', 'cross-household Storage target is rejected');
select throws_ok($$ select * from public.copy_furniture_with_storage('58000000-0000-4000-8000-000000000001', '48000000-0000-4000-8000-000000000003', 'Foreign Room target', false) $$, 'P0001', 'TARGET_NOT_AVAILABLE', 'cross-household Furniture target is rejected');

set local "request.jwt.claims" = '{"sub":"18000000-0000-4000-8000-000000000002","role":"authenticated"}';
select is(
  (select copied_name from public.copy_item('78000000-0000-4000-8000-000000000001', 'Drill — kopia', '68000000-0000-4000-8000-000000000003')),
  'Drill — kopia',
  'member can copy an Item to another Storage space'
);
select is(
  (select created_by_id from public.item where nazwa = 'Drill — kopia'),
  '18000000-0000-4000-8000-000000000002'::uuid,
  'Item copy records the current member as creator'
);
select is(
  (select status from public.item where nazwa = 'Drill — kopia'),
  'w domu'::public.item_status,
  'Item copy is active regardless of source status'
);
select is(
  (select opiekun_id from public.item where nazwa = 'Drill — kopia'),
  '18000000-0000-4000-8000-000000000001'::uuid,
  'Item copy retains an active same-household owner'
);
select is(
  (select storage_location_l3_id from public.item_location as il
    join public.item as i on i.id = il.item_id
    where i.nazwa = 'Drill — kopia' and il.czy_glowna),
  '68000000-0000-4000-8000-000000000003'::uuid,
  'Item copy creates the selected primary location'
);
select is(
  (select count(*) from public.file as f
    join public.item as i on i.id = f.item_id
    where i.nazwa = 'Drill — kopia'),
  0::bigint,
  'Item copy does not copy files or photos'
);
select is(
  (select copied_name from public.copy_item('78000000-0000-4000-8000-000000000002', 'Unlocated source — kopia', null)),
  'Unlocated source — kopia',
  'Item source without a location can remain without a location'
);
select is(
  (select count(*) from public.item_location as il
    join public.item as i on i.id = il.item_id
    where i.nazwa = 'Unlocated source — kopia'),
  0::bigint,
  'explicit no-location Item copy creates no Item location'
);
select is(
  (select opiekun_id from public.item
    where nazwa = 'Invalid owner source — kopia'),
  null::uuid,
  'invalid Item owner is cleared on copy'
)
from public.copy_item('78000000-0000-4000-8000-000000000003', 'Invalid owner source — kopia', null);
select throws_ok($$ select * from public.copy_item('78000000-0000-4000-8000-000000000001', 'Cross household Item target', '68000000-0000-4000-8000-000000000005') $$, 'P0001', 'TARGET_NOT_AVAILABLE', 'cross-household Item target is rejected');

set local "request.jwt.claims" = '{"sub":"18000000-0000-4000-8000-000000000001","role":"authenticated"}';
select throws_ok($$ select * from public.copy_furniture_with_storage('58000000-0000-4000-8000-000000000003', '48000000-0000-4000-8000-000000000002', 'Rollback furniture copy', true) $$, 'P0001', 'SOURCE_STORAGE_NAME_INVALID', 'copy failure rolls back the whole Furniture subtree');
select is(
  (select count(*) from public.storage_location_l2 where nazwa = 'Rollback furniture copy'),
  0::bigint,
  'rollback leaves no partial Furniture copy'
);
select is(
  (select count(*) from public.storage_location_l3 as l3
    join public.storage_location_l2 as l2 on l2.id = l3.storage_location_l2_id
    where l2.nazwa = 'Rollback furniture copy'),
  0::bigint,
  'rollback leaves no partial Storage copies'
);
select is(
  (select count(*) from public.storage_location_l2 where id = '58000000-0000-4000-8000-000000000003'),
  1::bigint,
  'rollback leaves the source Furniture in place'
);
select is(
  (select count(*) from public.storage_location_l3 where storage_location_l2_id = '58000000-0000-4000-8000-000000000003'),
  1::bigint,
  'rollback leaves the source Storage in place'
);
select is(
  (select copied_storage_count from public.copy_furniture_with_storage('58000000-0000-4000-8000-000000000001', '48000000-0000-4000-8000-000000000002', 'Rollback retry furniture copy', true)),
  2,
  'valid Furniture copy can be retried after a rolled-back failure'
);
select is(
  (select copied_name from public.copy_item('78000000-0000-4000-8000-000000000001', 'Concurrent Drill — kopia', null)),
  'Concurrent Drill — kopia',
  'first Item copy acquires the name scope'
);
select ok(
  exists (
    select 1
    from pg_locks
    where pid = pg_backend_pid()
      and locktype = 'advisory'
      and granted
  ),
  'actual copy RPC holds a transaction advisory lock for concurrent name safety'
);
select is(
  (select copied_name from public.copy_item('78000000-0000-4000-8000-000000000001', 'Concurrent Drill — kopia', null)),
  'Concurrent Drill — kopia 2',
  'serialized name scope produces a readable second collision suffix'
);

select * from finish();
rollback;
