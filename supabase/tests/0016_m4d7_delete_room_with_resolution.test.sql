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
  ('00000000-0000-0000-0000-000000000000', '1e000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'm4d7-admin-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1e000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'm4d7-member@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1e000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'm4d7-child@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1e000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'm4d7-admin-b@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1e000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'm4d7-no-profile@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1e000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'm4d7-inactive@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

insert into public.household (id, nazwa, typ)
values
  ('2e000000-0000-0000-0000-000000000001', 'M4D7 Home A', 'dom'),
  ('2e000000-0000-0000-0000-000000000002', 'M4D7 Home B', 'mieszkanie');

insert into public.profile (id, household_id, imie, email, rola, status)
values
  ('1e000000-0000-0000-0000-000000000001', '2e000000-0000-0000-0000-000000000001', 'Admin A', 'm4d7-admin-a@example.test', 'admin', 'aktywny'),
  ('1e000000-0000-0000-0000-000000000002', '2e000000-0000-0000-0000-000000000001', 'Member', 'm4d7-member@example.test', 'domownik', 'aktywny'),
  ('1e000000-0000-0000-0000-000000000003', '2e000000-0000-0000-0000-000000000001', 'Child', 'm4d7-child@example.test', 'dziecko', 'aktywny'),
  ('1e000000-0000-0000-0000-000000000004', '2e000000-0000-0000-0000-000000000002', 'Admin B', 'm4d7-admin-b@example.test', 'admin', 'aktywny'),
  ('1e000000-0000-0000-0000-000000000006', '2e000000-0000-0000-0000-000000000001', 'Inactive', 'm4d7-inactive@example.test', 'admin', 'nieaktywny');

insert into public.category (
  id, household_id, nazwa, czy_systemowa, widoczna_dla_dzieci
)
values
  ('3e000000-0000-0000-0000-000000000001', '2e000000-0000-0000-0000-000000000001', 'M4D7 Category A', false, true),
  ('3e000000-0000-0000-0000-000000000002', '2e000000-0000-0000-0000-000000000002', 'M4D7 Category B', false, true);

insert into public.room (id, household_id, nazwa, typ, "kolejność")
values
  ('4e000000-0000-0000-0000-000000000001', '2e000000-0000-0000-0000-000000000001', 'Role Room', 'Room', 1),
  ('4e000000-0000-0000-0000-000000000002', '2e000000-0000-0000-0000-000000000001', 'Empty Room', 'Room', 2),
  ('4e000000-0000-0000-0000-000000000003', '2e000000-0000-0000-0000-000000000001', 'Empty Subtree Room', 'Room', 3),
  ('4e000000-0000-0000-0000-000000000004', '2e000000-0000-0000-0000-000000000001', 'Detach Room', 'Room', 4),
  ('4e000000-0000-0000-0000-000000000005', '2e000000-0000-0000-0000-000000000001', 'Move Room', 'Room', 5),
  ('4e000000-0000-0000-0000-000000000006', '2e000000-0000-0000-0000-000000000001', 'Target Room', 'Room', 6),
  ('4e000000-0000-0000-0000-000000000007', '2e000000-0000-0000-0000-000000000001', 'Stale Room', 'Room', 7),
  ('4e000000-0000-0000-0000-000000000008', '2e000000-0000-0000-0000-000000000001', 'Rollback L3 Room', 'Room', 8),
  ('4e000000-0000-0000-0000-000000000009', '2e000000-0000-0000-0000-000000000001', 'Rollback L2 Room', 'Room', 9),
  ('4e000000-0000-0000-0000-000000000010', '2e000000-0000-0000-0000-000000000001', 'FAIL-ROOM', 'Room', 10),
  ('4e000000-0000-0000-0000-000000000011', '2e000000-0000-0000-0000-000000000002', 'Foreign Room', 'Room', 1);

insert into public.storage_location_l2 (
  id, room_id, nazwa, typ, "kolejność"
)
values
  ('5e000000-0000-0000-0000-000000000001', '4e000000-0000-0000-0000-000000000003', 'Empty Furniture 1', 'Cabinet', 1),
  ('5e000000-0000-0000-0000-000000000002', '4e000000-0000-0000-0000-000000000003', 'Empty Furniture 2', 'Cabinet', 2),
  ('5e000000-0000-0000-0000-000000000003', '4e000000-0000-0000-0000-000000000004', 'Detach Furniture 1', 'Cabinet', 1),
  ('5e000000-0000-0000-0000-000000000004', '4e000000-0000-0000-0000-000000000004', 'Detach Furniture 2', 'Cabinet', 2),
  ('5e000000-0000-0000-0000-000000000005', '4e000000-0000-0000-0000-000000000005', 'Move Furniture 1', 'Cabinet', 1),
  ('5e000000-0000-0000-0000-000000000006', '4e000000-0000-0000-0000-000000000005', 'Move Furniture 2', 'Cabinet', 2),
  ('5e000000-0000-0000-0000-000000000007', '4e000000-0000-0000-0000-000000000006', 'Target Furniture', 'Cabinet', 1),
  ('5e000000-0000-0000-0000-000000000008', '4e000000-0000-0000-0000-000000000007', 'Stale Furniture', 'Cabinet', 1),
  ('5e000000-0000-0000-0000-000000000009', '4e000000-0000-0000-0000-000000000008', 'Rollback L3 Furniture', 'Cabinet', 1),
  ('5e000000-0000-0000-0000-000000000010', '4e000000-0000-0000-0000-000000000009', 'FAIL-L2', 'Cabinet', 1),
  ('5e000000-0000-0000-0000-000000000011', '4e000000-0000-0000-0000-000000000010', 'Rollback Room Furniture', 'Cabinet', 1),
  ('5e000000-0000-0000-0000-000000000012', '4e000000-0000-0000-0000-000000000011', 'Foreign Furniture', 'Cabinet', 1);

insert into public.storage_location_l3 (
  id, storage_location_l2_id, nazwa, kod_lokalizacji, "kolejność"
)
values
  ('6e000000-0000-0000-0000-000000000001', '5e000000-0000-0000-0000-000000000001', 'Empty 1', 'M4D7-E1', 1),
  ('6e000000-0000-0000-0000-000000000002', '5e000000-0000-0000-0000-000000000001', 'Empty 2', 'M4D7-E2', 2),
  ('6e000000-0000-0000-0000-000000000003', '5e000000-0000-0000-0000-000000000002', 'Empty 3', 'M4D7-E3', 1),
  ('6e000000-0000-0000-0000-000000000004', '5e000000-0000-0000-0000-000000000003', 'Detach 1', 'M4D7-D1', 1),
  ('6e000000-0000-0000-0000-000000000005', '5e000000-0000-0000-0000-000000000004', 'Detach 2', 'M4D7-D2', 1),
  ('6e000000-0000-0000-0000-000000000006', '5e000000-0000-0000-0000-000000000005', 'Move 1', 'M4D7-M1', 1),
  ('6e000000-0000-0000-0000-000000000007', '5e000000-0000-0000-0000-000000000006', 'Move 2', 'M4D7-M2', 1),
  ('6e000000-0000-0000-0000-000000000008', '5e000000-0000-0000-0000-000000000007', 'External Target', 'M4D7-T1', 1),
  ('6e000000-0000-0000-0000-000000000009', '5e000000-0000-0000-0000-000000000008', 'Stale Position', 'M4D7-S1', 1),
  ('6e000000-0000-0000-0000-000000000010', '5e000000-0000-0000-0000-000000000009', 'Rollback L3 Position', 'FAIL-L3', 1),
  ('6e000000-0000-0000-0000-000000000011', '5e000000-0000-0000-0000-000000000010', 'Rollback L2 Position', 'M4D7-RL2', 1),
  ('6e000000-0000-0000-0000-000000000012', '5e000000-0000-0000-0000-000000000011', 'Rollback Room Position', 'M4D7-RR', 1),
  ('6e000000-0000-0000-0000-000000000013', '5e000000-0000-0000-0000-000000000012', 'Foreign Target', 'M4D7-FT', 1);

insert into public.item (
  id, household_id, category_id, nazwa, typ, ilosc, status, archived_at,
  status_before_archive, created_by_id
)
values
  ('7e000000-0000-0000-0000-000000000001', '2e000000-0000-0000-0000-000000000001', '3e000000-0000-0000-0000-000000000001', 'Detach Active', 'unikalny', 1, 'w domu', null, null, '1e000000-0000-0000-0000-000000000001'),
  ('7e000000-0000-0000-0000-000000000002', '2e000000-0000-0000-0000-000000000001', '3e000000-0000-0000-0000-000000000001', 'Detach Archived', 'unikalny', 1, 'archiwalne', '2026-07-01 10:00:00+00', 'pożyczone', '1e000000-0000-0000-0000-000000000001'),
  ('7e000000-0000-0000-0000-000000000003', '2e000000-0000-0000-0000-000000000001', '3e000000-0000-0000-0000-000000000001', 'Move Reused', 'unikalny', 1, 'w domu', null, null, '1e000000-0000-0000-0000-000000000001'),
  ('7e000000-0000-0000-0000-000000000004', '2e000000-0000-0000-0000-000000000001', '3e000000-0000-0000-0000-000000000001', 'Move Created Archived', 'unikalny', 1, 'archiwalne', '2026-07-02 10:00:00+00', 'zużyte', '1e000000-0000-0000-0000-000000000001'),
  ('7e000000-0000-0000-0000-000000000005', '2e000000-0000-0000-0000-000000000001', '3e000000-0000-0000-0000-000000000001', 'Move Additional Only', 'unikalny', 1, 'w domu', null, null, '1e000000-0000-0000-0000-000000000001'),
  ('7e000000-0000-0000-0000-000000000006', '2e000000-0000-0000-0000-000000000001', '3e000000-0000-0000-0000-000000000001', 'Rollback L3 Item', 'unikalny', 1, 'w domu', null, null, '1e000000-0000-0000-0000-000000000001'),
  ('7e000000-0000-0000-0000-000000000007', '2e000000-0000-0000-0000-000000000001', '3e000000-0000-0000-0000-000000000001', 'Rollback L2 Item', 'unikalny', 1, 'w domu', null, null, '1e000000-0000-0000-0000-000000000001'),
  ('7e000000-0000-0000-0000-000000000008', '2e000000-0000-0000-0000-000000000001', '3e000000-0000-0000-0000-000000000001', 'Rollback Room Item', 'unikalny', 1, 'w domu', null, null, '1e000000-0000-0000-0000-000000000001'),
  ('7e000000-0000-0000-0000-000000000009', '2e000000-0000-0000-0000-000000000001', '3e000000-0000-0000-0000-000000000001', 'Stale Item', 'unikalny', 1, 'w domu', null, null, '1e000000-0000-0000-0000-000000000001');

insert into public.item_location (
  id, item_id, storage_location_l3_id, czy_glowna, notatka
)
values
  ('8e000000-0000-0000-0000-000000000001', '7e000000-0000-0000-0000-000000000001', '6e000000-0000-0000-0000-000000000004', true, null),
  ('8e000000-0000-0000-0000-000000000002', '7e000000-0000-0000-0000-000000000001', '6e000000-0000-0000-0000-000000000008', false, 'outside detach'),
  ('8e000000-0000-0000-0000-000000000003', '7e000000-0000-0000-0000-000000000002', '6e000000-0000-0000-0000-000000000008', true, null),
  ('8e000000-0000-0000-0000-000000000004', '7e000000-0000-0000-0000-000000000002', '6e000000-0000-0000-0000-000000000005', false, 'archived source'),
  ('8e000000-0000-0000-0000-000000000005', '7e000000-0000-0000-0000-000000000003', '6e000000-0000-0000-0000-000000000006', true, null),
  ('8e000000-0000-0000-0000-000000000006', '7e000000-0000-0000-0000-000000000003', '6e000000-0000-0000-0000-000000000007', false, 'source extra'),
  ('8e000000-0000-0000-0000-000000000007', '7e000000-0000-0000-0000-000000000003', '6e000000-0000-0000-0000-000000000008', false, 'preserve target note'),
  ('8e000000-0000-0000-0000-000000000008', '7e000000-0000-0000-0000-000000000004', '6e000000-0000-0000-0000-000000000007', true, null),
  ('8e000000-0000-0000-0000-000000000009', '7e000000-0000-0000-0000-000000000005', '6e000000-0000-0000-0000-000000000008', true, null),
  ('8e000000-0000-0000-0000-000000000010', '7e000000-0000-0000-0000-000000000005', '6e000000-0000-0000-0000-000000000006', false, 'additional only'),
  ('8e000000-0000-0000-0000-000000000011', '7e000000-0000-0000-0000-000000000006', '6e000000-0000-0000-0000-000000000010', true, null),
  ('8e000000-0000-0000-0000-000000000012', '7e000000-0000-0000-0000-000000000007', '6e000000-0000-0000-0000-000000000011', true, null),
  ('8e000000-0000-0000-0000-000000000013', '7e000000-0000-0000-0000-000000000008', '6e000000-0000-0000-0000-000000000012', true, null),
  ('8e000000-0000-0000-0000-000000000014', '7e000000-0000-0000-0000-000000000009', '6e000000-0000-0000-0000-000000000009', true, null);

create function public.m4d7_force_l3_delete_failure()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.kod_lokalizacji = 'FAIL-L3' then
    raise exception 'forced L3 delete failure';
  end if;
  return old;
end;
$$;

create trigger m4d7_force_l3_delete_failure
before delete on public.storage_location_l3
for each row execute function public.m4d7_force_l3_delete_failure();

create function public.m4d7_force_l2_delete_failure()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.nazwa = 'FAIL-L2' then
    raise exception 'forced L2 delete failure';
  end if;
  return old;
end;
$$;

create trigger m4d7_force_l2_delete_failure
before delete on public.storage_location_l2
for each row execute function public.m4d7_force_l2_delete_failure();

create function public.m4d7_force_room_delete_failure()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.nazwa = 'FAIL-ROOM' then
    raise exception 'forced Room delete failure';
  end if;
  return old;
end;
$$;

create trigger m4d7_force_room_delete_failure
before delete on public.room
for each row execute function public.m4d7_force_room_delete_failure();

-- Schema, configuration, grants, and implementation shape.
select has_function('public', 'delete_room_with_resolution', array['uuid', 'text', 'uuid', 'bigint', 'bigint', 'bigint', 'bigint'], 'M4D.7 final RPC exists');
select is((select count(*) from pg_proc where pronamespace = 'public'::regnamespace and proname = 'delete_room_with_resolution'), 1::bigint, 'M4D.7 exposes exactly one final RPC');
select is((select not p.prosecdef from pg_proc as p where p.oid = 'public.delete_room_with_resolution(uuid,text,uuid,bigint,bigint,bigint,bigint)'::regprocedure), true, 'M4D.7 RPC is security invoker');
select ok((select p.proconfig @> array['search_path=""'] from pg_proc as p where p.oid = 'public.delete_room_with_resolution(uuid,text,uuid,bigint,bigint,bigint,bigint)'::regprocedure), 'M4D.7 RPC has an empty search_path');
select ok(not has_function_privilege('public', 'public.delete_room_with_resolution(uuid,text,uuid,bigint,bigint,bigint,bigint)'::regprocedure, 'EXECUTE'), 'PUBLIC cannot execute M4D.7 RPC');
select ok(not has_function_privilege('anon', 'public.delete_room_with_resolution(uuid,text,uuid,bigint,bigint,bigint,bigint)'::regprocedure, 'EXECUTE'), 'anon cannot execute M4D.7 RPC');
select ok(has_function_privilege('authenticated', 'public.delete_room_with_resolution(uuid,text,uuid,bigint,bigint,bigint,bigint)'::regprocedure, 'EXECUTE'), 'authenticated can execute M4D.7 RPC');
select ok(pg_get_functiondef('public.delete_room_with_resolution(uuid,text,uuid,bigint,bigint,bigint,bigint)'::regprocedure) ilike '%for update of r%', 'source Room is locked FOR UPDATE');
select ok(pg_get_functiondef('public.delete_room_with_resolution(uuid,text,uuid,bigint,bigint,bigint,bigint)'::regprocedure) ilike '%for update of l2%', 'existing source Furniture rows are locked FOR UPDATE');
select ok(pg_get_functiondef('public.delete_room_with_resolution(uuid,text,uuid,bigint,bigint,bigint,bigint)'::regprocedure) not like '%EXECUTE %', 'M4D.7 uses no dynamic SQL');

-- Authentication, roles, and household isolation.
set local role authenticated;
set local "request.jwt.claims" = '{}';
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000001', 'delete', null, 0, 0, 0, 0) $$, 'P0001', 'AUTH_REQUIRED', 'M4D.7 requires a session');
set local "request.jwt.claims" = '{"sub":"1e000000-0000-0000-0000-000000000005","role":"authenticated"}';
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000001', 'delete', null, 0, 0, 0, 0) $$, 'P0001', 'ACTIVE_PROFILE_REQUIRED', 'M4D.7 requires an active profile');
set local "request.jwt.claims" = '{"sub":"1e000000-0000-0000-0000-000000000006","role":"authenticated"}';
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000001', 'delete', null, 0, 0, 0, 0) $$, 'P0001', 'ACTIVE_PROFILE_REQUIRED', 'inactive profile is rejected');
set local "request.jwt.claims" = '{"sub":"1e000000-0000-0000-0000-000000000002","role":"authenticated"}';
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000001', 'delete', null, 0, 0, 0, 0) $$, 'P0001', 'ADMIN_REQUIRED', 'household member is rejected');
set local "request.jwt.claims" = '{"sub":"1e000000-0000-0000-0000-000000000003","role":"authenticated"}';
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000001', 'delete', null, 0, 0, 0, 0) $$, 'P0001', 'ADMIN_REQUIRED', 'child is rejected');
set local "request.jwt.claims" = '{"sub":"1e000000-0000-0000-0000-000000000004","role":"authenticated"}';
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000001', 'delete', null, 0, 0, 0, 0) $$, 'P0001', 'LOCATION_NOT_AVAILABLE', 'foreign admin cannot distinguish source');

set local "request.jwt.claims" = '{"sub":"1e000000-0000-0000-0000-000000000001","role":"authenticated"}';
select throws_ok($$ select * from public.delete_room_with_resolution('4effffff-0000-0000-0000-000000000099', 'delete', null, 0, 0, 0, 0) $$, 'P0001', 'LOCATION_NOT_AVAILABLE', 'missing source matches foreign source error');
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000011', 'delete', null, 1, 1, 0, 0) $$, 'P0001', 'LOCATION_NOT_AVAILABLE', 'foreign source is unavailable');

-- Closed input contract.
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000001', 'unknown', null, 0, 0, 0, 0) $$, 'P0001', 'INVALID_RESOLUTION', 'unknown resolution is rejected');
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000001', 'delete', null, -1, 0, 0, 0) $$, 'P0001', 'INVALID_EXPECTED_COUNTS', 'negative Furniture count is rejected');
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000001', 'delete', null, 0, -1, 0, 0) $$, 'P0001', 'INVALID_EXPECTED_COUNTS', 'negative Storage space count is rejected');
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000001', 'delete', null, 0, 0, -1, 0) $$, 'P0001', 'INVALID_EXPECTED_COUNTS', 'negative Item count is rejected');
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000001', 'delete', null, 0, 0, 0, -1) $$, 'P0001', 'INVALID_EXPECTED_COUNTS', 'negative link count is rejected');
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000001', 'delete', null, null, 0, 0, 0) $$, 'P0001', 'INVALID_EXPECTED_COUNTS', 'null Furniture count is rejected');
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000001', 'delete', null, 0, null, 0, 0) $$, 'P0001', 'INVALID_EXPECTED_COUNTS', 'null Storage space count is rejected');
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000001', 'delete', null, 0, 0, null, 0) $$, 'P0001', 'INVALID_EXPECTED_COUNTS', 'null Item count is rejected');
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000001', 'delete', null, 0, 0, 0, null) $$, 'P0001', 'INVALID_EXPECTED_COUNTS', 'null link count is rejected');
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000001', 'move', null, 0, 0, 0, 0) $$, 'P0001', 'TARGET_REQUIRED', 'move requires target');
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000001', 'delete', '6e000000-0000-0000-0000-000000000008', 0, 0, 0, 0) $$, 'P0001', 'TARGET_NOT_ALLOWED', 'delete rejects target');
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000001', 'detach', '6e000000-0000-0000-0000-000000000008', 0, 0, 0, 0) $$, 'P0001', 'TARGET_NOT_ALLOWED', 'detach rejects target');
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000005', 'move', '6effffff-0000-0000-0000-000000000098', 2, 2, 3, 4) $$, 'P0001', 'TARGET_NOT_AVAILABLE', 'missing target is unavailable');
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000005', 'move', '6e000000-0000-0000-0000-000000000013', 2, 2, 3, 4) $$, 'P0001', 'TARGET_NOT_AVAILABLE', 'foreign target matches missing target error');
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000005', 'move', '6e000000-0000-0000-0000-000000000006', 2, 2, 3, 4) $$, 'P0001', 'TARGET_IN_SOURCE_SUBTREE', 'target inside source Room is rejected');

-- Snapshot validation is completed before mutation.
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000007', 'detach', null, 0, 1, 1, 1) $$, 'P0001', 'DEPENDENCIES_CHANGED', 'changed Furniture count is rejected');
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000007', 'detach', null, 1, 0, 1, 1) $$, 'P0001', 'DEPENDENCIES_CHANGED', 'changed Storage space count is rejected');
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000007', 'detach', null, 1, 1, 0, 1) $$, 'P0001', 'DEPENDENCIES_CHANGED', 'changed distinct Item count is rejected');
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000007', 'detach', null, 1, 1, 1, 0) $$, 'P0001', 'DEPENDENCIES_CHANGED', 'changed link count is rejected');
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000007', 'delete', null, 1, 1, 1, 1) $$, 'P0001', 'DEPENDENCIES_CHANGED', 'delete is blocked while links exist');
select is((select count(*) from public.room where id = '4e000000-0000-0000-0000-000000000007'), 1::bigint, 'stale failures keep source Room');
select is((select count(*) from public.item_location where id = '8e000000-0000-0000-0000-000000000014'), 1::bigint, 'stale failures keep source link');

-- Delete an empty Room and a structurally non-empty subtree without Items.
select results_eq(
  $$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000002', 'delete', null, 0, 0, 0, 0) $$,
  $$ values ('success'::text, 'delete'::text, '4e000000-0000-0000-0000-000000000002'::uuid, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint) $$,
  'admin deletes a completely empty Room'
);
select is((select count(*) from public.room where id = '4e000000-0000-0000-0000-000000000002'), 0::bigint, 'empty Room is deleted');
select results_eq(
  $$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000003', 'delete', null, 2, 3, 0, 0) $$,
  $$ values ('success'::text, 'delete'::text, '4e000000-0000-0000-0000-000000000003'::uuid, 2::bigint, 3::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint) $$,
  'delete removes a Room with empty Furniture and Storage spaces'
);
select is((select count(*) from public.storage_location_l2 where id in ('5e000000-0000-0000-0000-000000000001', '5e000000-0000-0000-0000-000000000002')), 0::bigint, 'empty Furniture subtree is deleted');
select is((select count(*) from public.storage_location_l3 where id in ('6e000000-0000-0000-0000-000000000001', '6e000000-0000-0000-0000-000000000002', '6e000000-0000-0000-0000-000000000003')), 0::bigint, 'empty Storage space subtree is deleted');

-- Detach active and archived Items, preserving Items and outside links.
select results_eq(
  $$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000004', 'detach', null, 2, 2, 2, 2) $$,
  $$ values ('success'::text, 'detach'::text, '4e000000-0000-0000-0000-000000000004'::uuid, 2::bigint, 2::bigint, 2::bigint, 1::bigint, 1::bigint, 0::bigint, 2::bigint, 0::bigint, 0::bigint, 0::bigint) $$,
  'detach resolves active and archived Items and deletes the Room subtree'
);
select is((select count(*) from public.room where id = '4e000000-0000-0000-0000-000000000004'), 0::bigint, 'detach deletes source Room');
select is((select count(*) from public.item_location where id in ('8e000000-0000-0000-0000-000000000001', '8e000000-0000-0000-0000-000000000004')), 0::bigint, 'detach removes primary and additional source links');
select is((select count(*) from public.item_location where id in ('8e000000-0000-0000-0000-000000000002', '8e000000-0000-0000-0000-000000000003')), 2::bigint, 'detach keeps links outside source Room');
select is((select count(*) from public.item where id in ('7e000000-0000-0000-0000-000000000001', '7e000000-0000-0000-0000-000000000002')), 2::bigint, 'detach keeps Item records');
select is((select status from public.item where id = '7e000000-0000-0000-0000-000000000002'), 'archiwalne'::public.item_status, 'detach keeps archived status');
select is((select status_before_archive from public.item where id = '7e000000-0000-0000-0000-000000000002'), 'pożyczone'::public.item_status, 'detach keeps previous archived status');
select is((select category_id from public.item where id = '7e000000-0000-0000-0000-000000000002'), '3e000000-0000-0000-0000-000000000001'::uuid, 'detach keeps category');

-- Move primary links to another Room and detach remaining source links.
select results_eq(
  $$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000005', 'move', '6e000000-0000-0000-0000-000000000008', 2, 2, 3, 4) $$,
  $$ values ('success'::text, 'move'::text, '4e000000-0000-0000-0000-000000000005'::uuid, 2::bigint, 2::bigint, 3::bigint, 2::bigint, 1::bigint, 2::bigint, 2::bigint, 1::bigint, 1::bigint, 2::bigint) $$,
  'move resolves primary and additional links before deleting Room'
);
select is((select count(*) from public.room where id = '4e000000-0000-0000-0000-000000000005'), 0::bigint, 'move deletes source Room');
select is((select count(*) from public.storage_location_l2 where room_id = '4e000000-0000-0000-0000-000000000005'), 0::bigint, 'move deletes every source Furniture row');
select is((select count(*) from public.storage_location_l3 where id in ('6e000000-0000-0000-0000-000000000006', '6e000000-0000-0000-0000-000000000007')), 0::bigint, 'move deletes every source Storage space');
select is((select count(*) from public.item_location where item_id in ('7e000000-0000-0000-0000-000000000003', '7e000000-0000-0000-0000-000000000004') and storage_location_l3_id = '6e000000-0000-0000-0000-000000000008' and czy_glowna), 2::bigint, 'move establishes primary target links');
select is((select count(*) from public.item_location where id in ('8e000000-0000-0000-0000-000000000006', '8e000000-0000-0000-0000-000000000010')), 0::bigint, 'move detaches remaining source links');
select is((select notatka from public.item_location where id = '8e000000-0000-0000-0000-000000000007'), 'preserve target note', 'promoted target link keeps its note');
select is((select storage_location_l3_id from public.item_location where item_id = '7e000000-0000-0000-0000-000000000005' and czy_glowna), '6e000000-0000-0000-0000-000000000008'::uuid, 'additional-only source Item keeps outside primary');
select is((select count(*) from public.item where id in ('7e000000-0000-0000-0000-000000000003', '7e000000-0000-0000-0000-000000000004', '7e000000-0000-0000-0000-000000000005')), 3::bigint, 'move keeps all Item records');
select is((select status from public.item where id = '7e000000-0000-0000-0000-000000000004'), 'archiwalne'::public.item_status, 'move keeps archived status');
select is((select count(*) from public.item_location where item_id = '7e000000-0000-0000-0000-000000000003' and storage_location_l3_id = '6e000000-0000-0000-0000-000000000008'), 1::bigint, 'move creates no duplicate target link');

-- Forced failures at every structural level roll back the whole operation.
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000008', 'move', '6e000000-0000-0000-0000-000000000008', 1, 1, 1, 1) $$, 'P0001', 'DELETE_FAILED', 'L3 failure rolls back full operation');
select is((select count(*) from public.room where id = '4e000000-0000-0000-0000-000000000008'), 1::bigint, 'L3 rollback keeps Room');
select is((select count(*) from public.storage_location_l3 where id = '6e000000-0000-0000-0000-000000000010'), 1::bigint, 'L3 rollback keeps Storage space');
select is((select count(*) from public.item_location where id = '8e000000-0000-0000-0000-000000000011' and czy_glowna), 1::bigint, 'L3 rollback restores source primary link');
select is((select count(*) from public.item_location where item_id = '7e000000-0000-0000-0000-000000000006' and storage_location_l3_id = '6e000000-0000-0000-0000-000000000008'), 0::bigint, 'L3 rollback removes partial target link');
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000009', 'detach', null, 1, 1, 1, 1) $$, 'P0001', 'DELETE_FAILED', 'L2 failure rolls back full operation');
select is((select count(*) from public.storage_location_l2 where id = '5e000000-0000-0000-0000-000000000010'), 1::bigint, 'L2 rollback keeps Furniture');
select is((select count(*) from public.storage_location_l3 where id = '6e000000-0000-0000-0000-000000000011'), 1::bigint, 'L2 rollback restores Storage space');
select is((select count(*) from public.item_location where id = '8e000000-0000-0000-0000-000000000012'), 1::bigint, 'L2 rollback restores source link');
select throws_ok($$ select * from public.delete_room_with_resolution('4e000000-0000-0000-0000-000000000010', 'detach', null, 1, 1, 1, 1) $$, 'P0001', 'DELETE_FAILED', 'Room failure rolls back full operation');
select is((select count(*) from public.room where id = '4e000000-0000-0000-0000-000000000010'), 1::bigint, 'Room rollback keeps source Room');
select is((select count(*) from public.storage_location_l2 where id = '5e000000-0000-0000-0000-000000000011'), 1::bigint, 'Room rollback restores Furniture');
select is((select count(*) from public.storage_location_l3 where id = '6e000000-0000-0000-0000-000000000012'), 1::bigint, 'Room rollback restores Storage space');
select is((select count(*) from public.item_location where id = '8e000000-0000-0000-0000-000000000013'), 1::bigint, 'Room rollback restores source link');

-- RLS remains active and older lifecycle RPCs remain available.
select is((select count(*) from public.room where household_id = '2e000000-0000-0000-0000-000000000002'), 0::bigint, 'RLS hides foreign household Rooms');
select is((select count(*) from public.item where household_id = '2e000000-0000-0000-0000-000000000002'), 0::bigint, 'RLS hides foreign household Items');
select is((select storage_count from public.get_room_location_dependency_summary('4e000000-0000-0000-0000-000000000007')), 1::bigint, 'M4D.2 Room summary still works');

reset role;
select * from finish();
rollback;
