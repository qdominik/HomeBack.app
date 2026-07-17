begin;

create extension if not exists pgtap with schema extensions;
set search_path = extensions, public, auth;

select plan(82);

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
  ('00000000-0000-0000-0000-000000000000', '1a000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'm4d3-admin-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1a000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'm4d3-member-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1a000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'm4d3-child-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1a000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'm4d3-guest-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1a000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'm4d3-admin-b@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1a000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'm4d3-no-profile@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1a000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'm4d3-inactive-admin@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

insert into public.household (id, nazwa, typ)
values
  ('2a000000-0000-0000-0000-000000000001', 'M4D3 Home A', 'dom'),
  ('2a000000-0000-0000-0000-000000000002', 'M4D3 Home B', 'mieszkanie');

insert into public.profile (id, household_id, imie, email, rola, status)
values
  ('1a000000-0000-0000-0000-000000000001', '2a000000-0000-0000-0000-000000000001', 'Admin A', 'm4d3-admin-a@example.test', 'admin', 'aktywny'),
  ('1a000000-0000-0000-0000-000000000002', '2a000000-0000-0000-0000-000000000001', 'Member A', 'm4d3-member-a@example.test', 'domownik', 'aktywny'),
  ('1a000000-0000-0000-0000-000000000003', '2a000000-0000-0000-0000-000000000001', 'Child A', 'm4d3-child-a@example.test', 'dziecko', 'aktywny'),
  ('1a000000-0000-0000-0000-000000000004', '2a000000-0000-0000-0000-000000000001', 'Guest A', 'm4d3-guest-a@example.test', 'gość', 'aktywny'),
  ('1a000000-0000-0000-0000-000000000005', '2a000000-0000-0000-0000-000000000002', 'Admin B', 'm4d3-admin-b@example.test', 'admin', 'aktywny'),
  ('1a000000-0000-0000-0000-000000000007', '2a000000-0000-0000-0000-000000000001', 'Inactive Admin', 'm4d3-inactive-admin@example.test', 'admin', 'nieaktywny');

insert into public.category (
  id,
  household_id,
  nazwa,
  czy_systemowa,
  widoczna_dla_dzieci
)
values
  ('3a000000-0000-0000-0000-000000000001', '2a000000-0000-0000-0000-000000000001', 'M4D3 Category A', false, true),
  ('3a000000-0000-0000-0000-000000000002', '2a000000-0000-0000-0000-000000000002', 'M4D3 Category B', false, true);

insert into public.room (id, household_id, nazwa, typ, "kolejność")
values
  ('4a000000-0000-0000-0000-000000000001', '2a000000-0000-0000-0000-000000000001', 'L3 Test Room', 'Room', 1),
  ('4a000000-0000-0000-0000-000000000002', '2a000000-0000-0000-0000-000000000001', 'External Room', 'Room', 2),
  ('4a000000-0000-0000-0000-000000000003', '2a000000-0000-0000-0000-000000000001', 'L2 Test Room', 'Room', 3),
  ('4a000000-0000-0000-0000-000000000004', '2a000000-0000-0000-0000-000000000001', 'Room Test Target', 'Room', 4),
  ('4a000000-0000-0000-0000-000000000005', '2a000000-0000-0000-0000-000000000001', 'Room Test Outside', 'Room', 5),
  ('4a000000-0000-0000-0000-000000000006', '2a000000-0000-0000-0000-000000000001', 'Empty Scope Room', 'Room', 6),
  ('4a000000-0000-0000-0000-000000000007', '2a000000-0000-0000-0000-000000000002', 'Foreign Room', 'Room', 1),
  ('4a000000-0000-0000-0000-000000000008', '2a000000-0000-0000-0000-000000000001', 'Rollback Room', 'Room', 7);

insert into public.storage_location_l2 (id, room_id, nazwa, typ, "kolejność")
values
  ('5a000000-0000-0000-0000-000000000001', '4a000000-0000-0000-0000-000000000001', 'L3 Test Storage', 'Shelf', 1),
  ('5a000000-0000-0000-0000-000000000002', '4a000000-0000-0000-0000-000000000002', 'External Storage', 'Shelf', 1),
  ('5a000000-0000-0000-0000-000000000003', '4a000000-0000-0000-0000-000000000003', 'L2 Target Storage', 'Shelf', 1),
  ('5a000000-0000-0000-0000-000000000004', '4a000000-0000-0000-0000-000000000003', 'L2 Outside Storage', 'Shelf', 2),
  ('5a000000-0000-0000-0000-000000000005', '4a000000-0000-0000-0000-000000000004', 'Room Target Storage A', 'Shelf', 1),
  ('5a000000-0000-0000-0000-000000000006', '4a000000-0000-0000-0000-000000000004', 'Room Target Storage B', 'Shelf', 2),
  ('5a000000-0000-0000-0000-000000000007', '4a000000-0000-0000-0000-000000000005', 'Room Outside Storage', 'Shelf', 1),
  ('5a000000-0000-0000-0000-000000000008', '4a000000-0000-0000-0000-000000000006', 'Empty Storage', 'Shelf', 1),
  ('5a000000-0000-0000-0000-000000000009', '4a000000-0000-0000-0000-000000000007', 'Foreign Storage', 'Shelf', 1),
  ('5a000000-0000-0000-0000-000000000010', '4a000000-0000-0000-0000-000000000008', 'Rollback Storage', 'Shelf', 1);

insert into public.storage_location_l3 (
  id,
  storage_location_l2_id,
  nazwa,
  kod_lokalizacji,
  "kolejność"
)
values
  ('6a000000-0000-0000-0000-000000000001', '5a000000-0000-0000-0000-000000000001', 'L3 Target', 'M4D3-L3-T', 1),
  ('6a000000-0000-0000-0000-000000000002', '5a000000-0000-0000-0000-000000000001', 'L3 Sibling', 'M4D3-L3-S', 2),
  ('6a000000-0000-0000-0000-000000000003', '5a000000-0000-0000-0000-000000000002', 'L3 External', 'M4D3-L3-E', 1),
  ('6a000000-0000-0000-0000-000000000004', '5a000000-0000-0000-0000-000000000003', 'L2 Position A', 'M4D3-L2-A', 1),
  ('6a000000-0000-0000-0000-000000000005', '5a000000-0000-0000-0000-000000000003', 'L2 Position B', 'M4D3-L2-B', 2),
  ('6a000000-0000-0000-0000-000000000006', '5a000000-0000-0000-0000-000000000004', 'L2 Outside Position', 'M4D3-L2-O', 1),
  ('6a000000-0000-0000-0000-000000000007', '5a000000-0000-0000-0000-000000000005', 'Room Position A', 'M4D3-R-A', 1),
  ('6a000000-0000-0000-0000-000000000008', '5a000000-0000-0000-0000-000000000006', 'Room Position B', 'M4D3-R-B', 1),
  ('6a000000-0000-0000-0000-000000000009', '5a000000-0000-0000-0000-000000000007', 'Room Outside Position', 'M4D3-R-O', 1),
  ('6a000000-0000-0000-0000-000000000010', '5a000000-0000-0000-0000-000000000008', 'Empty Position', 'M4D3-EMPTY', 1),
  ('6a000000-0000-0000-0000-000000000011', '5a000000-0000-0000-0000-000000000009', 'Foreign Position', 'M4D3-FOREIGN', 1),
  ('6a000000-0000-0000-0000-000000000012', '5a000000-0000-0000-0000-000000000010', 'Rollback Position A', 'M4D3-RB-A', 1),
  ('6a000000-0000-0000-0000-000000000013', '5a000000-0000-0000-0000-000000000010', 'Rollback Position B', 'M4D3-RB-B', 2);

insert into public.item (
  id,
  household_id,
  category_id,
  nazwa,
  opis,
  typ,
  ilosc,
  status,
  archived_at,
  status_before_archive,
  created_by_id,
  created_at,
  updated_at
)
values
  ('7a000000-0000-0000-0000-000000000001', '2a000000-0000-0000-0000-000000000001', '3a000000-0000-0000-0000-000000000001', 'L3 Active Multi', 'Keep this description', 'zapas', 4, 'w domu', null, null, '1a000000-0000-0000-0000-000000000001', '2026-01-01 10:00:00+00', '2026-01-02 10:00:00+00'),
  ('7a000000-0000-0000-0000-000000000002', '2a000000-0000-0000-0000-000000000001', '3a000000-0000-0000-0000-000000000001', 'L3 Archived', null, 'unikalny', 1, 'archiwalne', '2026-02-01 10:00:00+00', 'w domu', '1a000000-0000-0000-0000-000000000001', now(), now()),
  ('7a000000-0000-0000-0000-000000000003', '2a000000-0000-0000-0000-000000000001', '3a000000-0000-0000-0000-000000000001', 'L3 Sibling Item', null, 'unikalny', 1, 'pożyczone', null, null, '1a000000-0000-0000-0000-000000000001', now(), now()),
  ('7a000000-0000-0000-0000-000000000004', '2a000000-0000-0000-0000-000000000001', '3a000000-0000-0000-0000-000000000001', 'L3 Second Active', null, 'unikalny', 1, 'zużyte', null, null, '1a000000-0000-0000-0000-000000000001', now(), now()),
  ('7a000000-0000-0000-0000-000000000005', '2a000000-0000-0000-0000-000000000001', '3a000000-0000-0000-0000-000000000001', 'L2 Active Multi', null, 'unikalny', 1, 'w domu', null, null, '1a000000-0000-0000-0000-000000000001', now(), now()),
  ('7a000000-0000-0000-0000-000000000006', '2a000000-0000-0000-0000-000000000001', '3a000000-0000-0000-0000-000000000001', 'L2 Archived', null, 'unikalny', 1, 'archiwalne', '2026-02-02 10:00:00+00', 'pożyczone', '1a000000-0000-0000-0000-000000000001', now(), now()),
  ('7a000000-0000-0000-0000-000000000007', '2a000000-0000-0000-0000-000000000001', '3a000000-0000-0000-0000-000000000001', 'L2 Outside Item', null, 'unikalny', 1, 'w domu', null, null, '1a000000-0000-0000-0000-000000000001', now(), now()),
  ('7a000000-0000-0000-0000-000000000008', '2a000000-0000-0000-0000-000000000001', '3a000000-0000-0000-0000-000000000001', 'Room Active Multi', null, 'unikalny', 1, 'w domu', null, null, '1a000000-0000-0000-0000-000000000001', now(), now()),
  ('7a000000-0000-0000-0000-000000000009', '2a000000-0000-0000-0000-000000000001', '3a000000-0000-0000-0000-000000000001', 'Room Archived', null, 'unikalny', 1, 'archiwalne', '2026-02-03 10:00:00+00', 'zużyte', '1a000000-0000-0000-0000-000000000001', now(), now()),
  ('7a000000-0000-0000-0000-000000000010', '2a000000-0000-0000-0000-000000000001', '3a000000-0000-0000-0000-000000000001', 'Room Outside Item', null, 'unikalny', 1, 'w domu', null, null, '1a000000-0000-0000-0000-000000000001', now(), now()),
  ('7a000000-0000-0000-0000-000000000011', '2a000000-0000-0000-0000-000000000001', '3a000000-0000-0000-0000-000000000001', 'Rollback Item', null, 'unikalny', 1, 'w domu', null, null, '1a000000-0000-0000-0000-000000000001', now(), now()),
  ('7a000000-0000-0000-0000-000000000012', '2a000000-0000-0000-0000-000000000001', '3a000000-0000-0000-0000-000000000001', 'Permanent Delete Regression', null, 'unikalny', 1, 'w domu', null, null, '1a000000-0000-0000-0000-000000000001', now(), now()),
  ('7a000000-0000-0000-0000-000000000013', '2a000000-0000-0000-0000-000000000002', '3a000000-0000-0000-0000-000000000002', 'Foreign Item', null, 'unikalny', 1, 'w domu', null, null, '1a000000-0000-0000-0000-000000000005', now(), now());

insert into public.item_location (
  id,
  item_id,
  storage_location_l3_id,
  czy_glowna,
  notatka
)
values
  ('8a000000-0000-0000-0000-000000000001', '7a000000-0000-0000-0000-000000000001', '6a000000-0000-0000-0000-000000000001', true, null),
  ('8a000000-0000-0000-0000-000000000002', '7a000000-0000-0000-0000-000000000001', '6a000000-0000-0000-0000-000000000001', false, null),
  ('8a000000-0000-0000-0000-000000000003', '7a000000-0000-0000-0000-000000000001', '6a000000-0000-0000-0000-000000000003', false, null),
  ('8a000000-0000-0000-0000-000000000004', '7a000000-0000-0000-0000-000000000002', '6a000000-0000-0000-0000-000000000001', false, null),
  ('8a000000-0000-0000-0000-000000000005', '7a000000-0000-0000-0000-000000000003', '6a000000-0000-0000-0000-000000000002', true, null),
  ('8a000000-0000-0000-0000-000000000006', '7a000000-0000-0000-0000-000000000004', '6a000000-0000-0000-0000-000000000001', true, null),
  ('8a000000-0000-0000-0000-000000000007', '7a000000-0000-0000-0000-000000000005', '6a000000-0000-0000-0000-000000000004', true, null),
  ('8a000000-0000-0000-0000-000000000008', '7a000000-0000-0000-0000-000000000005', '6a000000-0000-0000-0000-000000000005', false, null),
  ('8a000000-0000-0000-0000-000000000009', '7a000000-0000-0000-0000-000000000005', '6a000000-0000-0000-0000-000000000006', false, null),
  ('8a000000-0000-0000-0000-000000000010', '7a000000-0000-0000-0000-000000000006', '6a000000-0000-0000-0000-000000000004', false, null),
  ('8a000000-0000-0000-0000-000000000011', '7a000000-0000-0000-0000-000000000007', '6a000000-0000-0000-0000-000000000006', true, null),
  ('8a000000-0000-0000-0000-000000000012', '7a000000-0000-0000-0000-000000000008', '6a000000-0000-0000-0000-000000000007', true, null),
  ('8a000000-0000-0000-0000-000000000013', '7a000000-0000-0000-0000-000000000008', '6a000000-0000-0000-0000-000000000008', false, null),
  ('8a000000-0000-0000-0000-000000000014', '7a000000-0000-0000-0000-000000000008', '6a000000-0000-0000-0000-000000000009', false, null),
  ('8a000000-0000-0000-0000-000000000015', '7a000000-0000-0000-0000-000000000009', '6a000000-0000-0000-0000-000000000008', false, null),
  ('8a000000-0000-0000-0000-000000000016', '7a000000-0000-0000-0000-000000000010', '6a000000-0000-0000-0000-000000000009', true, null),
  ('8a000000-0000-0000-0000-000000000017', '7a000000-0000-0000-0000-000000000011', '6a000000-0000-0000-0000-000000000012', true, null),
  ('8a000000-0000-0000-0000-000000000018', '7a000000-0000-0000-0000-000000000011', '6a000000-0000-0000-0000-000000000013', false, 'force_detach_failure'),
  ('8a000000-0000-0000-0000-000000000019', '7a000000-0000-0000-0000-000000000013', '6a000000-0000-0000-0000-000000000011', true, null);

create function public.m4d3_force_detach_failure()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.notatka = 'force_detach_failure' then
    raise exception 'forced test failure';
  end if;

  return old;
end;
$$;

create trigger m4d3_force_detach_failure
after delete on public.item_location
for each row execute function public.m4d3_force_detach_failure();

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"1a000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is((select not p.prosecdef from pg_proc as p where p.oid = 'public.detach_items_from_room_location(uuid)'::regprocedure), true, 'room detach is security invoker');
select is((select not p.prosecdef from pg_proc as p where p.oid = 'public.detach_items_from_storage_location_l2(uuid)'::regprocedure), true, 'L2 detach is security invoker');
select is((select not p.prosecdef from pg_proc as p where p.oid = 'public.detach_items_from_storage_location_l3(uuid)'::regprocedure), true, 'L3 detach is security invoker');
select ok(not has_function_privilege('public', 'public.detach_items_from_room_location(uuid)'::regprocedure, 'EXECUTE'), 'PUBLIC cannot execute room detach');
select ok(not has_function_privilege('public', 'public.detach_items_from_storage_location_l2(uuid)'::regprocedure, 'EXECUTE'), 'PUBLIC cannot execute L2 detach');
select ok(not has_function_privilege('public', 'public.detach_items_from_storage_location_l3(uuid)'::regprocedure, 'EXECUTE'), 'PUBLIC cannot execute L3 detach');
select ok(not has_function_privilege('anon', 'public.detach_items_from_room_location(uuid)'::regprocedure, 'EXECUTE'), 'anon cannot execute room detach');
select ok(not has_function_privilege('anon', 'public.detach_items_from_storage_location_l2(uuid)'::regprocedure, 'EXECUTE'), 'anon cannot execute L2 detach');
select ok(not has_function_privilege('anon', 'public.detach_items_from_storage_location_l3(uuid)'::regprocedure, 'EXECUTE'), 'anon cannot execute L3 detach');
select ok(has_function_privilege('authenticated', 'public.detach_items_from_room_location(uuid)'::regprocedure, 'EXECUTE'), 'authenticated can call guarded room detach');
select ok(has_function_privilege('authenticated', 'public.detach_items_from_storage_location_l2(uuid)'::regprocedure, 'EXECUTE'), 'authenticated can call guarded L2 detach');
select ok(has_function_privilege('authenticated', 'public.detach_items_from_storage_location_l3(uuid)'::regprocedure, 'EXECUTE'), 'authenticated can call guarded L3 detach');

set local role anon;
select throws_ok($$ select * from public.detach_items_from_room_location('4a000000-0000-0000-0000-000000000001') $$, '42501', null, 'anon role cannot call detach');

set local role authenticated;
set local "request.jwt.claims" = '{}';
select throws_ok($$ select * from public.detach_items_from_room_location('4a000000-0000-0000-0000-000000000001') $$, 'P0001', 'AUTH_REQUIRED', 'missing session is rejected');

set local "request.jwt.claims" =
  '{"sub":"1a000000-0000-0000-0000-000000000006","role":"authenticated"}';
select throws_ok($$ select * from public.detach_items_from_storage_location_l2('5a000000-0000-0000-0000-000000000003') $$, 'P0001', 'ACTIVE_PROFILE_REQUIRED', 'missing active profile is rejected');

set local "request.jwt.claims" =
  '{"sub":"1a000000-0000-0000-0000-000000000007","role":"authenticated"}';
select throws_ok($$ select * from public.detach_items_from_storage_location_l3('6a000000-0000-0000-0000-000000000001') $$, 'P0001', 'ACTIVE_PROFILE_REQUIRED', 'inactive administrator is rejected');

set local "request.jwt.claims" =
  '{"sub":"1a000000-0000-0000-0000-000000000002","role":"authenticated"}';
select throws_ok($$ select * from public.detach_items_from_room_location('4a000000-0000-0000-0000-000000000001') $$, 'P0001', 'ADMIN_REQUIRED', 'member cannot detach');

set local "request.jwt.claims" =
  '{"sub":"1a000000-0000-0000-0000-000000000003","role":"authenticated"}';
select throws_ok($$ select * from public.detach_items_from_storage_location_l2('5a000000-0000-0000-0000-000000000003') $$, 'P0001', 'ADMIN_REQUIRED', 'child cannot detach');

set local "request.jwt.claims" =
  '{"sub":"1a000000-0000-0000-0000-000000000004","role":"authenticated"}';
select throws_ok($$ select * from public.detach_items_from_storage_location_l3('6a000000-0000-0000-0000-000000000001') $$, 'P0001', 'ADMIN_REQUIRED', 'guest cannot detach');

set local "request.jwt.claims" =
  '{"sub":"1a000000-0000-0000-0000-000000000005","role":"authenticated"}';
select throws_ok($$ select * from public.detach_items_from_room_location('4a000000-0000-0000-0000-000000000001') $$, 'P0001', 'LOCATION_NOT_AVAILABLE', 'foreign room is unavailable');
select throws_ok($$ select * from public.detach_items_from_room_location('4a000000-0000-0000-0000-000000000099') $$, 'P0001', 'LOCATION_NOT_AVAILABLE', 'missing room has the same result');
select throws_ok($$ select * from public.detach_items_from_storage_location_l2('5a000000-0000-0000-0000-000000000003') $$, 'P0001', 'LOCATION_NOT_AVAILABLE', 'foreign L2 is unavailable');
select throws_ok($$ select * from public.detach_items_from_storage_location_l2('5a000000-0000-0000-0000-000000000099') $$, 'P0001', 'LOCATION_NOT_AVAILABLE', 'missing L2 has the same result');
select throws_ok($$ select * from public.detach_items_from_storage_location_l3('6a000000-0000-0000-0000-000000000001') $$, 'P0001', 'LOCATION_NOT_AVAILABLE', 'foreign L3 is unavailable');
select throws_ok($$ select * from public.detach_items_from_storage_location_l3('6a000000-0000-0000-0000-000000000099') $$, 'P0001', 'LOCATION_NOT_AVAILABLE', 'missing L3 has the same result');
select is((select count(*) from public.item_location where id = '8a000000-0000-0000-0000-000000000001'), 0::bigint, 'foreign administrator cannot see the target link');

set local "request.jwt.claims" =
  '{"sub":"1a000000-0000-0000-0000-000000000001","role":"authenticated"}';
select throws_ok($$ select * from public.detach_items_from_room_location('4a000000-0000-0000-0000-000000000008') $$, 'P0001', 'DETACH_FAILED', 'forced error maps to safe detach failure');
select is((select count(*) from public.item_location where item_id = '7a000000-0000-0000-0000-000000000011'), 2::bigint, 'forced error rolls back every deleted link');
select is((select count(*) from public.item where id = '7a000000-0000-0000-0000-000000000011'), 1::bigint, 'forced error keeps the Item');

reset role;
drop trigger m4d3_force_detach_failure on public.item_location;
drop function public.m4d3_force_detach_failure();
set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"1a000000-0000-0000-0000-000000000001","role":"authenticated"}';

select results_eq(
  $$ select status, detached_item_count, detached_link_count, active_item_count, archived_item_count from public.detach_items_from_storage_location_l3('6a000000-0000-0000-0000-000000000001') $$,
  $$ values ('success'::text, 3::bigint, 4::bigint, 2::bigint, 1::bigint) $$,
  'L3 detach returns distinct Item and every link count'
);
select is((select count(*) from public.item_location where storage_location_l3_id = '6a000000-0000-0000-0000-000000000001'), 0::bigint, 'L3 removes primary and additional links');
select is((select count(*) from public.item_location where item_id = '7a000000-0000-0000-0000-000000000001'), 1::bigint, 'Item with an external link keeps that link');
select is((select count(*) from public.item_location where id = '8a000000-0000-0000-0000-000000000003'), 1::bigint, 'external link remains unchanged');
select is((select count(*) from public.item_location where id = '8a000000-0000-0000-0000-000000000005'), 1::bigint, 'sibling L3 link remains unchanged');
select is((select count(*) from public.item_location where item_id = '7a000000-0000-0000-0000-000000000002'), 0::bigint, 'Item with all links removed becomes unlocated');
select is((select count(*) from public.storage_location_l3 where id = '6a000000-0000-0000-0000-000000000001'), 1::bigint, 'L3 target is not deleted');
select is((select status from public.item where id = '7a000000-0000-0000-0000-000000000001'), 'w domu'::public.item_status, 'active Item status remains unchanged');
select is((select status from public.item where id = '7a000000-0000-0000-0000-000000000002'), 'archiwalne'::public.item_status, 'archived Item status remains unchanged');
select is((select archived_at from public.item where id = '7a000000-0000-0000-0000-000000000002'), '2026-02-01 10:00:00+00'::timestamptz, 'archived_at remains unchanged');
select is((select status_before_archive from public.item where id = '7a000000-0000-0000-0000-000000000002'), 'w domu'::public.item_status, 'status_before_archive remains unchanged');
select is((select category_id from public.item where id = '7a000000-0000-0000-0000-000000000001'), '3a000000-0000-0000-0000-000000000001'::uuid, 'category remains unchanged');
select is((select nazwa from public.item where id = '7a000000-0000-0000-0000-000000000001'), 'L3 Active Multi', 'Item name remains unchanged');
select is((select opis from public.item where id = '7a000000-0000-0000-0000-000000000001'), 'Keep this description', 'Item description remains unchanged');
select is((select ilosc from public.item where id = '7a000000-0000-0000-0000-000000000001'), 4::numeric, 'Item quantity remains unchanged');
select is((select updated_at from public.item where id = '7a000000-0000-0000-0000-000000000001'), '2026-01-02 10:00:00+00'::timestamptz, 'Item updated_at remains unchanged');

select results_eq(
  $$ select status, detached_item_count, detached_link_count, active_item_count, archived_item_count from public.detach_items_from_storage_location_l3('6a000000-0000-0000-0000-000000000001') $$,
  $$ values ('success'::text, 0::bigint, 0::bigint, 0::bigint, 0::bigint) $$,
  'second L3 detach is idempotent'
);

select results_eq(
  $$ select status, detached_item_count, detached_link_count, active_item_count, archived_item_count from public.detach_items_from_storage_location_l2('5a000000-0000-0000-0000-000000000003') $$,
  $$ values ('success'::text, 2::bigint, 3::bigint, 1::bigint, 1::bigint) $$,
  'L2 detach includes every nested active and archived link'
);
select is((select count(*) from public.item_location where storage_location_l3_id in ('6a000000-0000-0000-0000-000000000004', '6a000000-0000-0000-0000-000000000005')), 0::bigint, 'L2 removes links from all its L3 positions');
select is((select count(*) from public.item_location where id = '8a000000-0000-0000-0000-000000000009'), 1::bigint, 'L2 detach preserves the same Item link outside the subtree');
select is((select count(*) from public.item_location where storage_location_l3_id = '6a000000-0000-0000-0000-000000000006'), 2::bigint, 'links in another L2 remain unchanged');
select is((select count(*) from public.storage_location_l2 where id = '5a000000-0000-0000-0000-000000000003'), 1::bigint, 'L2 target is not deleted');
select is((select count(*) from public.storage_location_l3 where storage_location_l2_id = '5a000000-0000-0000-0000-000000000003'), 2::bigint, 'all L2 positions remain');
select is((select status from public.item where id = '7a000000-0000-0000-0000-000000000006'), 'archiwalne'::public.item_status, 'L2 archived Item remains archived');
select is((select archived_at from public.item where id = '7a000000-0000-0000-0000-000000000006'), '2026-02-02 10:00:00+00'::timestamptz, 'L2 archived metadata remains');

select results_eq(
  $$ select status, detached_item_count, detached_link_count, active_item_count, archived_item_count from public.detach_items_from_room_location('4a000000-0000-0000-0000-000000000004') $$,
  $$ values ('success'::text, 2::bigint, 3::bigint, 1::bigint, 1::bigint) $$,
  'Room detach includes all links across multiple L2 and L3 records'
);
select is((select count(*) from public.item_location where storage_location_l3_id in ('6a000000-0000-0000-0000-000000000007', '6a000000-0000-0000-0000-000000000008')), 0::bigint, 'Room removes all links in its subtree');
select is((select count(*) from public.item_location where id = '8a000000-0000-0000-0000-000000000014'), 1::bigint, 'Room detach preserves the same Item link outside the subtree');
select is((select count(*) from public.item_location where storage_location_l3_id = '6a000000-0000-0000-0000-000000000009'), 2::bigint, 'links in another Room remain unchanged');
select is((select count(*) from public.room where id = '4a000000-0000-0000-0000-000000000004'), 1::bigint, 'Room target is not deleted');
select is((select count(*) from public.storage_location_l2 where room_id = '4a000000-0000-0000-0000-000000000004'), 2::bigint, 'Room storages remain');
select is((select count(*) from public.storage_location_l3 where storage_location_l2_id in ('5a000000-0000-0000-0000-000000000005', '5a000000-0000-0000-0000-000000000006')), 2::bigint, 'Room positions remain');
select is((select count(*) from public.item where id in ('7a000000-0000-0000-0000-000000000008', '7a000000-0000-0000-0000-000000000009')), 2::bigint, 'Room Items remain');
select is((select status from public.item where id = '7a000000-0000-0000-0000-000000000009'), 'archiwalne'::public.item_status, 'Room archived Item remains archived');
select is((select status_before_archive from public.item where id = '7a000000-0000-0000-0000-000000000009'), 'zużyte'::public.item_status, 'Room archived previous status remains');

select results_eq(
  $$ select status, detached_item_count, detached_link_count, active_item_count, archived_item_count from public.detach_items_from_storage_location_l3('6a000000-0000-0000-0000-000000000010') $$,
  $$ values ('success'::text, 0::bigint, 0::bigint, 0::bigint, 0::bigint) $$,
  'empty L3 succeeds with zero counts'
);
select results_eq(
  $$ select status, detached_item_count, detached_link_count, active_item_count, archived_item_count from public.detach_items_from_storage_location_l3('6a000000-0000-0000-0000-000000000010') $$,
  $$ values ('success'::text, 0::bigint, 0::bigint, 0::bigint, 0::bigint) $$,
  'repeated empty L3 detach remains idempotent'
);
select results_eq(
  $$ select status, detached_item_count, detached_link_count, active_item_count, archived_item_count from public.detach_items_from_storage_location_l2('5a000000-0000-0000-0000-000000000008') $$,
  $$ values ('success'::text, 0::bigint, 0::bigint, 0::bigint, 0::bigint) $$,
  'empty L2 subtree succeeds with zero counts'
);
select results_eq(
  $$ select status, detached_item_count, detached_link_count, active_item_count, archived_item_count from public.detach_items_from_room_location('4a000000-0000-0000-0000-000000000006') $$,
  $$ values ('success'::text, 0::bigint, 0::bigint, 0::bigint, 0::bigint) $$,
  'empty Room subtree succeeds with zero counts'
);

select is((select total_location_links_count from public.get_room_location_dependency_summary('4a000000-0000-0000-0000-000000000004')), 0::bigint, 'M4D.2 Room summary reflects detached links');
select is((select total_location_links_count from public.get_storage_location_l2_dependency_summary('5a000000-0000-0000-0000-000000000003')), 0::bigint, 'M4D.2 L2 summary reflects detached links');
select is((select total_location_links_count from public.get_storage_location_l3_dependency_summary('6a000000-0000-0000-0000-000000000001')), 0::bigint, 'M4D.2 L3 summary reflects detached links');

select is(public.archive_item('7a000000-0000-0000-0000-000000000001'), 'success', 'archive_item still works after detach');
select is((select status from public.item where id = '7a000000-0000-0000-0000-000000000001'), 'archiwalne'::public.item_status, 'archive_item still changes status');
select is(public.restore_item('7a000000-0000-0000-0000-000000000001'), 'success', 'restore_item still works after detach');
select is((select status from public.item where id = '7a000000-0000-0000-0000-000000000001'), 'w domu'::public.item_status, 'restore_item still restores exact status');
select is(public.delete_item_permanently('7a000000-0000-0000-0000-000000000012'), 'success', 'permanent item deletion still works');
select is((select count(*) from public.item where id = '7a000000-0000-0000-0000-000000000012'), 0::bigint, 'permanent item deletion still removes its Item');
select throws_ok($$ delete from public.storage_location_l3 where id = '6a000000-0000-0000-0000-000000000003' $$, '23503', null, 'existing location deletion FK blocker remains unchanged');

select is((select count(*) from public.item where household_id = '2a000000-0000-0000-0000-000000000001'), 11::bigint, 'detach never deletes Items');
select is((select count(*) from public.room where household_id = '2a000000-0000-0000-0000-000000000001'), 7::bigint, 'detach never deletes Rooms');
select is((select count(*) from public.storage_location_l2 where id in ('5a000000-0000-0000-0000-000000000003', '5a000000-0000-0000-0000-000000000005', '5a000000-0000-0000-0000-000000000006')), 3::bigint, 'detach never deletes L2 structure');
select is((select count(*) from public.storage_location_l3 where id in ('6a000000-0000-0000-0000-000000000001', '6a000000-0000-0000-0000-000000000004', '6a000000-0000-0000-0000-000000000005', '6a000000-0000-0000-0000-000000000007', '6a000000-0000-0000-0000-000000000008')), 5::bigint, 'detach never deletes L3 structure');

reset role;
set local "request.jwt.claims" = '{}';

select * from finish();
rollback;
