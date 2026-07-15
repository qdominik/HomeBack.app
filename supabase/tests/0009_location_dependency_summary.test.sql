begin;

create extension if not exists pgtap with schema extensions;
set search_path = extensions, public, auth;

select plan(64);

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
  ('00000000-0000-0000-0000-000000000000', '17000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'm4d2-admin-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '17000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'm4d2-member-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '17000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'm4d2-child-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '17000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'm4d2-admin-b@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '17000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'm4d2-no-profile@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '17000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'm4d2-inactive-admin-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

insert into public.household (id, nazwa, typ)
values
  ('27000000-0000-0000-0000-000000000001', 'M4D2 Home A', 'dom'),
  ('27000000-0000-0000-0000-000000000002', 'M4D2 Home B', 'mieszkanie');

insert into public.profile (id, household_id, imie, email, rola, status)
values
  ('17000000-0000-0000-0000-000000000001', '27000000-0000-0000-0000-000000000001', 'Admin A', 'm4d2-admin-a@example.test', 'admin', 'aktywny'),
  ('17000000-0000-0000-0000-000000000002', '27000000-0000-0000-0000-000000000001', 'Member A', 'm4d2-member-a@example.test', 'domownik', 'aktywny'),
  ('17000000-0000-0000-0000-000000000003', '27000000-0000-0000-0000-000000000001', 'Child A', 'm4d2-child-a@example.test', 'dziecko', 'aktywny'),
  ('17000000-0000-0000-0000-000000000004', '27000000-0000-0000-0000-000000000002', 'Admin B', 'm4d2-admin-b@example.test', 'admin', 'aktywny'),
  ('17000000-0000-0000-0000-000000000006', '27000000-0000-0000-0000-000000000001', 'Inactive Admin A', 'm4d2-inactive-admin-a@example.test', 'admin', 'nieaktywny');

insert into public.category (
  id,
  household_id,
  nazwa,
  czy_systemowa,
  widoczna_dla_dzieci
)
values
  ('37000000-0000-0000-0000-000000000001', '27000000-0000-0000-0000-000000000001', 'M4D2 Category A', false, true);

insert into public.room (id, household_id, nazwa, typ, "kolejność")
values
  ('47000000-0000-0000-0000-000000000001', '27000000-0000-0000-0000-000000000001', 'Empty Room', 'Room', 1),
  ('47000000-0000-0000-0000-000000000002', '27000000-0000-0000-0000-000000000001', 'Room With Empty Storage', 'Room', 2),
  ('47000000-0000-0000-0000-000000000003', '27000000-0000-0000-0000-000000000001', 'Full Room', 'Room', 3),
  ('47000000-0000-0000-0000-000000000004', '27000000-0000-0000-0000-000000000002', 'Foreign Room', 'Room', 1);

insert into public.storage_location_l2 (id, room_id, nazwa, typ, "kolejność")
values
  ('57000000-0000-0000-0000-000000000001', '47000000-0000-0000-0000-000000000002', 'Empty Storage', 'Shelf', 1),
  ('57000000-0000-0000-0000-000000000002', '47000000-0000-0000-0000-000000000003', 'Full Storage', 'Shelf', 1),
  ('57000000-0000-0000-0000-000000000003', '47000000-0000-0000-0000-000000000003', 'Second Storage', 'Shelf', 2),
  ('57000000-0000-0000-0000-000000000004', '47000000-0000-0000-0000-000000000004', 'Foreign Storage', 'Shelf', 1);

insert into public.storage_location_l3 (
  id,
  storage_location_l2_id,
  nazwa,
  kod_lokalizacji,
  "kolejność"
)
values
  ('67000000-0000-0000-0000-000000000001', '57000000-0000-0000-0000-000000000002', 'Position A1', 'M4D2-A1', 1),
  ('67000000-0000-0000-0000-000000000002', '57000000-0000-0000-0000-000000000002', 'Position A2', 'M4D2-A2', 2),
  ('67000000-0000-0000-0000-000000000003', '57000000-0000-0000-0000-000000000003', 'Empty Position', 'M4D2-A3', 1),
  ('67000000-0000-0000-0000-000000000004', '57000000-0000-0000-0000-000000000004', 'Foreign Position', 'M4D2-B1', 1);

insert into public.item (
  id,
  household_id,
  category_id,
  nazwa,
  typ,
  ilosc,
  status,
  created_by_id
)
values
  ('77000000-0000-0000-0000-000000000001', '27000000-0000-0000-0000-000000000001', '37000000-0000-0000-0000-000000000001', 'Active With Two Links', 'unikalny', 1, 'w domu', '17000000-0000-0000-0000-000000000001'),
  ('77000000-0000-0000-0000-000000000002', '27000000-0000-0000-0000-000000000001', '37000000-0000-0000-0000-000000000001', 'Archived Item', 'unikalny', 1, 'archiwalne', '17000000-0000-0000-0000-000000000001'),
  ('77000000-0000-0000-0000-000000000003', '27000000-0000-0000-0000-000000000001', '37000000-0000-0000-0000-000000000001', 'Second Active Item', 'unikalny', 1, 'pożyczone', '17000000-0000-0000-0000-000000000001'),
  ('77000000-0000-0000-0000-000000000004', '27000000-0000-0000-0000-000000000001', '37000000-0000-0000-0000-000000000001', 'Unlocated Item', 'unikalny', 1, 'w domu', '17000000-0000-0000-0000-000000000001');

insert into public.item_location (
  id,
  item_id,
  storage_location_l3_id,
  czy_glowna
)
values
  ('87000000-0000-0000-0000-000000000001', '77000000-0000-0000-0000-000000000001', '67000000-0000-0000-0000-000000000001', true),
  ('87000000-0000-0000-0000-000000000002', '77000000-0000-0000-0000-000000000001', '67000000-0000-0000-0000-000000000002', false),
  ('87000000-0000-0000-0000-000000000003', '77000000-0000-0000-0000-000000000002', '67000000-0000-0000-0000-000000000001', false),
  ('87000000-0000-0000-0000-000000000004', '77000000-0000-0000-0000-000000000003', '67000000-0000-0000-0000-000000000002', true);

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"17000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is((select not p.prosecdef from pg_proc as p where p.oid = 'public.get_room_location_dependency_summary(uuid)'::regprocedure), true, 'room summary is security invoker');
select is((select not p.prosecdef from pg_proc as p where p.oid = 'public.get_storage_location_l2_dependency_summary(uuid)'::regprocedure), true, 'L2 summary is security invoker');
select is((select not p.prosecdef from pg_proc as p where p.oid = 'public.get_storage_location_l3_dependency_summary(uuid)'::regprocedure), true, 'L3 summary is security invoker');
select ok(not has_function_privilege('public', 'public.get_room_location_dependency_summary(uuid)'::regprocedure, 'EXECUTE'), 'PUBLIC has no EXECUTE on the room summary');
select ok(not has_function_privilege('public', 'public.get_storage_location_l2_dependency_summary(uuid)'::regprocedure, 'EXECUTE'), 'PUBLIC has no EXECUTE on the L2 summary');
select ok(not has_function_privilege('public', 'public.get_storage_location_l3_dependency_summary(uuid)'::regprocedure, 'EXECUTE'), 'PUBLIC has no EXECUTE on the L3 summary');
select ok(not has_function_privilege('anon', 'public.get_room_location_dependency_summary(uuid)'::regprocedure, 'EXECUTE'), 'anon has no EXECUTE on the room summary');
select ok(not has_function_privilege('anon', 'public.get_storage_location_l2_dependency_summary(uuid)'::regprocedure, 'EXECUTE'), 'anon has no EXECUTE on the L2 summary');
select ok(not has_function_privilege('anon', 'public.get_storage_location_l3_dependency_summary(uuid)'::regprocedure, 'EXECUTE'), 'anon has no EXECUTE on the L3 summary');
select ok(has_function_privilege('authenticated', 'public.get_room_location_dependency_summary(uuid)'::regprocedure, 'EXECUTE'), 'authenticated has EXECUTE on the room summary');
select ok(has_function_privilege('authenticated', 'public.get_storage_location_l2_dependency_summary(uuid)'::regprocedure, 'EXECUTE'), 'authenticated has EXECUTE on the L2 summary');
select ok(has_function_privilege('authenticated', 'public.get_storage_location_l3_dependency_summary(uuid)'::regprocedure, 'EXECUTE'), 'authenticated has EXECUTE on the L3 summary');

select is((select storage_count from public.get_room_location_dependency_summary('47000000-0000-0000-0000-000000000001')), 0::bigint, 'empty room has no storages');
select is((select position_count from public.get_room_location_dependency_summary('47000000-0000-0000-0000-000000000001')), 0::bigint, 'empty room has no positions');
select is((select can_delete_immediately from public.get_room_location_dependency_summary('47000000-0000-0000-0000-000000000001')), true, 'empty room can be deleted immediately');

select is((select storage_count from public.get_room_location_dependency_summary('47000000-0000-0000-0000-000000000002')), 1::bigint, 'room with empty storage counts its direct L2');
select is((select requires_subtree_deletion from public.get_room_location_dependency_summary('47000000-0000-0000-0000-000000000002')), true, 'room with empty storage requires subtree deletion');
select is((select can_delete_immediately from public.get_room_location_dependency_summary('47000000-0000-0000-0000-000000000002')), false, 'room with a child cannot be deleted immediately');

select is((select storage_count from public.get_room_location_dependency_summary('47000000-0000-0000-0000-000000000003')), 2::bigint, 'full room counts all direct L2 records');
select is((select position_count from public.get_room_location_dependency_summary('47000000-0000-0000-0000-000000000003')), 3::bigint, 'full room counts all nested L3 records');
select is((select active_direct_items_count from public.get_room_location_dependency_summary('47000000-0000-0000-0000-000000000003')), 0::bigint, 'room direct item count stays zero');
select is((select active_nested_items_count from public.get_room_location_dependency_summary('47000000-0000-0000-0000-000000000003')), 2::bigint, 'full room counts distinct active nested items');
select is((select archived_nested_items_count from public.get_room_location_dependency_summary('47000000-0000-0000-0000-000000000003')), 1::bigint, 'full room counts distinct archived nested items');
select is((select total_distinct_items_count from public.get_room_location_dependency_summary('47000000-0000-0000-0000-000000000003')), 3::bigint, 'one item linked twice is counted once in room total');
select is((select primary_location_links_count from public.get_room_location_dependency_summary('47000000-0000-0000-0000-000000000003')), 2::bigint, 'full room counts primary links');
select is((select non_primary_location_links_count from public.get_room_location_dependency_summary('47000000-0000-0000-0000-000000000003')), 2::bigint, 'full room counts non-primary links');
select is((select total_location_links_count from public.get_room_location_dependency_summary('47000000-0000-0000-0000-000000000003')), 4::bigint, 'full room counts every blocking link row');
select is((select requires_item_resolution from public.get_room_location_dependency_summary('47000000-0000-0000-0000-000000000003')), true, 'full room reports item resolution requirement');
select is((select can_delete_immediately from public.get_room_location_dependency_summary('47000000-0000-0000-0000-000000000003')), false, 'full room cannot be deleted immediately');

select is((select position_count from public.get_storage_location_l2_dependency_summary('57000000-0000-0000-0000-000000000001')), 0::bigint, 'empty L2 has no positions');
select is((select can_delete_immediately from public.get_storage_location_l2_dependency_summary('57000000-0000-0000-0000-000000000001')), true, 'empty L2 can be deleted immediately');
select is((select position_count from public.get_storage_location_l2_dependency_summary('57000000-0000-0000-0000-000000000002')), 2::bigint, 'full L2 counts its positions');
select is((select active_direct_items_count from public.get_storage_location_l2_dependency_summary('57000000-0000-0000-0000-000000000002')), 0::bigint, 'L2 direct item count stays zero');
select is((select active_nested_items_count from public.get_storage_location_l2_dependency_summary('57000000-0000-0000-0000-000000000002')), 2::bigint, 'full L2 counts distinct active nested items');
select is((select archived_nested_items_count from public.get_storage_location_l2_dependency_summary('57000000-0000-0000-0000-000000000002')), 1::bigint, 'full L2 counts archived nested items');
select is((select total_location_links_count from public.get_storage_location_l2_dependency_summary('57000000-0000-0000-0000-000000000002')), 4::bigint, 'full L2 counts every blocking link');
select is((select requires_item_resolution from public.get_storage_location_l2_dependency_summary('57000000-0000-0000-0000-000000000002')), true, 'full L2 reports item resolution requirement');
select is((select requires_subtree_deletion from public.get_storage_location_l2_dependency_summary('57000000-0000-0000-0000-000000000002')), true, 'full L2 reports subtree deletion requirement');

select is((select total_distinct_items_count from public.get_storage_location_l3_dependency_summary('67000000-0000-0000-0000-000000000003')), 0::bigint, 'empty L3 has no items');
select is((select can_delete_immediately from public.get_storage_location_l3_dependency_summary('67000000-0000-0000-0000-000000000003')), true, 'empty L3 can be deleted immediately');
select is((select active_direct_items_count from public.get_storage_location_l3_dependency_summary('67000000-0000-0000-0000-000000000001')), 1::bigint, 'L3 counts an active direct item');
select is((select archived_direct_items_count from public.get_storage_location_l3_dependency_summary('67000000-0000-0000-0000-000000000001')), 1::bigint, 'L3 counts an archived direct item');
select is((select active_nested_items_count from public.get_storage_location_l3_dependency_summary('67000000-0000-0000-0000-000000000001')), 0::bigint, 'L3 active nested count stays zero');
select is((select archived_nested_items_count from public.get_storage_location_l3_dependency_summary('67000000-0000-0000-0000-000000000001')), 0::bigint, 'L3 archived nested count stays zero');
select is((select total_distinct_items_count from public.get_storage_location_l3_dependency_summary('67000000-0000-0000-0000-000000000001')), 2::bigint, 'L3 counts distinct active and archived items');
select is((select primary_location_links_count from public.get_storage_location_l3_dependency_summary('67000000-0000-0000-0000-000000000001')), 1::bigint, 'L3 counts its primary link');
select is((select non_primary_location_links_count from public.get_storage_location_l3_dependency_summary('67000000-0000-0000-0000-000000000001')), 1::bigint, 'L3 counts its non-primary link');
select is((select total_location_links_count from public.get_storage_location_l3_dependency_summary('67000000-0000-0000-0000-000000000001')), 2::bigint, 'L3 counts every blocking link');

select throws_ok($$ select * from public.get_room_location_dependency_summary('47000000-0000-0000-0000-000000000099') $$, 'P0001', 'LOCATION_NOT_AVAILABLE', 'missing room returns the safe unavailable error');
select throws_ok($$ select * from public.get_storage_location_l2_dependency_summary('57000000-0000-0000-0000-000000000099') $$, 'P0001', 'LOCATION_NOT_AVAILABLE', 'missing L2 returns the safe unavailable error');
select throws_ok($$ select * from public.get_storage_location_l2_dependency_summary('57000000-0000-0000-0000-000000000004') $$, 'P0001', 'LOCATION_NOT_AVAILABLE', 'foreign L2 returns the same unavailable error');
select throws_ok($$ select * from public.get_storage_location_l3_dependency_summary('67000000-0000-0000-0000-000000000099') $$, 'P0001', 'LOCATION_NOT_AVAILABLE', 'missing L3 returns the safe unavailable error');
select throws_ok($$ select * from public.get_storage_location_l3_dependency_summary('67000000-0000-0000-0000-000000000004') $$, 'P0001', 'LOCATION_NOT_AVAILABLE', 'foreign L3 returns the same unavailable error');

set local "request.jwt.claims" =
  '{"sub":"17000000-0000-0000-0000-000000000004","role":"authenticated"}';
select throws_ok($$ select * from public.get_room_location_dependency_summary('47000000-0000-0000-0000-000000000003') $$, 'P0001', 'LOCATION_NOT_AVAILABLE', 'foreign room returns the same unavailable error');

set local "request.jwt.claims" =
  '{"sub":"17000000-0000-0000-0000-000000000002","role":"authenticated"}';
select throws_ok($$ select * from public.get_room_location_dependency_summary('47000000-0000-0000-0000-000000000003') $$, 'P0001', 'ADMIN_REQUIRED', 'member cannot read dependency summaries');

set local "request.jwt.claims" =
  '{"sub":"17000000-0000-0000-0000-000000000003","role":"authenticated"}';
select throws_ok($$ select * from public.get_storage_location_l2_dependency_summary('57000000-0000-0000-0000-000000000002') $$, 'P0001', 'ADMIN_REQUIRED', 'child cannot read dependency summaries');

set local "request.jwt.claims" = '{}';
select throws_ok($$ select * from public.get_storage_location_l3_dependency_summary('67000000-0000-0000-0000-000000000001') $$, 'P0001', 'AUTH_REQUIRED', 'anonymous caller is rejected');

set local "request.jwt.claims" =
  '{"sub":"17000000-0000-0000-0000-000000000005","role":"authenticated"}';
select throws_ok($$ select * from public.get_storage_location_l3_dependency_summary('67000000-0000-0000-0000-000000000001') $$, 'P0001', 'ACTIVE_PROFILE_REQUIRED', 'caller without an active profile is rejected');
set local "request.jwt.claims" =
  '{"sub":"17000000-0000-0000-0000-000000000006","role":"authenticated"}';
select throws_ok($$ select * from public.get_room_location_dependency_summary('47000000-0000-0000-0000-000000000003') $$, 'P0001', 'ACTIVE_PROFILE_REQUIRED', 'inactive administrator is rejected');

set local "request.jwt.claims" =
  '{"sub":"17000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is((select count(*) from public.room), 3::bigint, 'summary calls do not modify rooms');
select is((select count(*) from public.storage_location_l2), 3::bigint, 'summary calls do not modify L2 records');
select is((select count(*) from public.storage_location_l3), 3::bigint, 'summary calls do not modify L3 records');
select is((select count(*) from public.item), 4::bigint, 'summary calls do not modify items');
select is((select count(*) from public.item_location), 4::bigint, 'summary calls do not modify item locations');

reset role;
set local "request.jwt.claims" = '{}';

select * from finish();
rollback;
