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
  ('00000000-0000-0000-0000-000000000000', '1d000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'm4d6-admin-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1d000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'm4d6-member@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1d000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'm4d6-child@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1d000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'm4d6-admin-b@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1d000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'm4d6-no-profile@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1d000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'm4d6-inactive@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

insert into public.household (id, nazwa, typ)
values
  ('2d000000-0000-0000-0000-000000000001', 'M4D6 Home A', 'dom'),
  ('2d000000-0000-0000-0000-000000000002', 'M4D6 Home B', 'mieszkanie');

insert into public.profile (id, household_id, imie, email, rola, status)
values
  ('1d000000-0000-0000-0000-000000000001', '2d000000-0000-0000-0000-000000000001', 'Admin A', 'm4d6-admin-a@example.test', 'admin', 'aktywny'),
  ('1d000000-0000-0000-0000-000000000002', '2d000000-0000-0000-0000-000000000001', 'Member', 'm4d6-member@example.test', 'domownik', 'aktywny'),
  ('1d000000-0000-0000-0000-000000000003', '2d000000-0000-0000-0000-000000000001', 'Child', 'm4d6-child@example.test', 'dziecko', 'aktywny'),
  ('1d000000-0000-0000-0000-000000000004', '2d000000-0000-0000-0000-000000000002', 'Admin B', 'm4d6-admin-b@example.test', 'admin', 'aktywny'),
  ('1d000000-0000-0000-0000-000000000006', '2d000000-0000-0000-0000-000000000001', 'Inactive', 'm4d6-inactive@example.test', 'admin', 'nieaktywny');

insert into public.category (id, household_id, nazwa, czy_systemowa, widoczna_dla_dzieci)
values
  ('3d000000-0000-0000-0000-000000000001', '2d000000-0000-0000-0000-000000000001', 'M4D6 Category A', false, true),
  ('3d000000-0000-0000-0000-000000000002', '2d000000-0000-0000-0000-000000000002', 'M4D6 Category B', false, true);

insert into public.room (id, household_id, nazwa, typ, "kolejność")
values
  ('4d000000-0000-0000-0000-000000000001', '2d000000-0000-0000-0000-000000000001', 'Source Room', 'Room', 1),
  ('4d000000-0000-0000-0000-000000000002', '2d000000-0000-0000-0000-000000000001', 'Second Room', 'Room', 2),
  ('4d000000-0000-0000-0000-000000000003', '2d000000-0000-0000-0000-000000000002', 'Foreign Room', 'Room', 1);

insert into public.storage_location_l2 (id, room_id, nazwa, typ, "kolejność")
values
  ('5d000000-0000-0000-0000-000000000001', '4d000000-0000-0000-0000-000000000001', 'Empty Furniture', 'Cabinet', 1),
  ('5d000000-0000-0000-0000-000000000002', '4d000000-0000-0000-0000-000000000001', 'Empty Subtree', 'Cabinet', 2),
  ('5d000000-0000-0000-0000-000000000003', '4d000000-0000-0000-0000-000000000001', 'Detach Furniture', 'Cabinet', 3),
  ('5d000000-0000-0000-0000-000000000004', '4d000000-0000-0000-0000-000000000001', 'Move Furniture', 'Cabinet', 4),
  ('5d000000-0000-0000-0000-000000000005', '4d000000-0000-0000-0000-000000000001', 'Same Room Target', 'Cabinet', 5),
  ('5d000000-0000-0000-0000-000000000006', '4d000000-0000-0000-0000-000000000002', 'Other Room Target', 'Cabinet', 1),
  ('5d000000-0000-0000-0000-000000000007', '4d000000-0000-0000-0000-000000000003', 'Foreign Furniture', 'Cabinet', 1),
  ('5d000000-0000-0000-0000-000000000008', '4d000000-0000-0000-0000-000000000001', 'Role Furniture', 'Cabinet', 6),
  ('5d000000-0000-0000-0000-000000000009', '4d000000-0000-0000-0000-000000000001', 'Stale Add', 'Cabinet', 7),
  ('5d000000-0000-0000-0000-000000000010', '4d000000-0000-0000-0000-000000000001', 'Stale Remove', 'Cabinet', 8),
  ('5d000000-0000-0000-0000-000000000011', '4d000000-0000-0000-0000-000000000001', 'Rollback L3', 'Cabinet', 9),
  ('5d000000-0000-0000-0000-000000000012', '4d000000-0000-0000-0000-000000000001', 'Fail L2', 'Cabinet', 10),
  ('5d000000-0000-0000-0000-000000000013', '4d000000-0000-0000-0000-000000000001', 'Move Other Room', 'Cabinet', 11),
  ('5d000000-0000-0000-0000-000000000014', '4d000000-0000-0000-0000-000000000001', 'Regression Detach', 'Cabinet', 12),
  ('5d000000-0000-0000-0000-000000000015', '4d000000-0000-0000-0000-000000000001', 'Regression Move', 'Cabinet', 13);

insert into public.storage_location_l3 (id, storage_location_l2_id, nazwa, kod_lokalizacji, "kolejność")
values
  ('6d000000-0000-0000-0000-000000000001', '5d000000-0000-0000-0000-000000000002', 'Empty 1', 'M4D6-E1', 1),
  ('6d000000-0000-0000-0000-000000000002', '5d000000-0000-0000-0000-000000000002', 'Empty 2', 'M4D6-E2', 2),
  ('6d000000-0000-0000-0000-000000000003', '5d000000-0000-0000-0000-000000000003', 'Detach 1', 'M4D6-D1', 1),
  ('6d000000-0000-0000-0000-000000000004', '5d000000-0000-0000-0000-000000000003', 'Detach 2', 'M4D6-D2', 2),
  ('6d000000-0000-0000-0000-000000000005', '5d000000-0000-0000-0000-000000000004', 'Move 1', 'M4D6-M1', 1),
  ('6d000000-0000-0000-0000-000000000006', '5d000000-0000-0000-0000-000000000004', 'Move 2', 'M4D6-M2', 2),
  ('6d000000-0000-0000-0000-000000000007', '5d000000-0000-0000-0000-000000000005', 'Same Room Target', 'M4D6-T1', 1),
  ('6d000000-0000-0000-0000-000000000008', '5d000000-0000-0000-0000-000000000006', 'Other Room Target', 'M4D6-T2', 1),
  ('6d000000-0000-0000-0000-000000000009', '5d000000-0000-0000-0000-000000000007', 'Foreign Target', 'M4D6-FT', 1),
  ('6d000000-0000-0000-0000-000000000010', '5d000000-0000-0000-0000-000000000008', 'Role Position', 'M4D6-ROLE', 1),
  ('6d000000-0000-0000-0000-000000000011', '5d000000-0000-0000-0000-000000000009', 'Stale Existing', 'M4D6-SA1', 1),
  ('6d000000-0000-0000-0000-000000000012', '5d000000-0000-0000-0000-000000000010', 'Stale Remove 1', 'M4D6-SR1', 1),
  ('6d000000-0000-0000-0000-000000000013', '5d000000-0000-0000-0000-000000000010', 'Stale Remove 2', 'M4D6-SR2', 2),
  ('6d000000-0000-0000-0000-000000000014', '5d000000-0000-0000-0000-000000000011', 'Rollback L3 Position', 'FAIL-L3', 1),
  ('6d000000-0000-0000-0000-000000000015', '5d000000-0000-0000-0000-000000000012', 'Rollback L2 Position', 'M4D6-RL2', 1),
  ('6d000000-0000-0000-0000-000000000016', '5d000000-0000-0000-0000-000000000013', 'Move Other Source', 'M4D6-MO', 1),
  ('6d000000-0000-0000-0000-000000000017', '5d000000-0000-0000-0000-000000000014', 'Detach Regression', 'M4D6-RD', 1),
  ('6d000000-0000-0000-0000-000000000018', '5d000000-0000-0000-0000-000000000015', 'Move Regression', 'M4D6-RM', 1);

insert into public.item (
  id, household_id, category_id, nazwa, typ, ilosc, status, archived_at,
  status_before_archive, created_by_id
)
values
  ('7d000000-0000-0000-0000-000000000001', '2d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000001', 'Detach Active', 'unikalny', 1, 'w domu', null, null, '1d000000-0000-0000-0000-000000000001'),
  ('7d000000-0000-0000-0000-000000000002', '2d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000001', 'Detach Archived', 'unikalny', 1, 'archiwalne', '2026-07-01 10:00:00+00', 'pożyczone', '1d000000-0000-0000-0000-000000000001'),
  ('7d000000-0000-0000-0000-000000000003', '2d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000001', 'Move Reused', 'unikalny', 1, 'w domu', null, null, '1d000000-0000-0000-0000-000000000001'),
  ('7d000000-0000-0000-0000-000000000004', '2d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000001', 'Move Created Archived', 'unikalny', 1, 'archiwalne', '2026-07-02 10:00:00+00', 'zużyte', '1d000000-0000-0000-0000-000000000001'),
  ('7d000000-0000-0000-0000-000000000005', '2d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000001', 'Move Additional Only', 'unikalny', 1, 'w domu', null, null, '1d000000-0000-0000-0000-000000000001'),
  ('7d000000-0000-0000-0000-000000000006', '2d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000001', 'Stale Item', 'unikalny', 1, 'w domu', null, null, '1d000000-0000-0000-0000-000000000001'),
  ('7d000000-0000-0000-0000-000000000007', '2d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000001', 'Rollback L3 Item', 'unikalny', 1, 'w domu', null, null, '1d000000-0000-0000-0000-000000000001'),
  ('7d000000-0000-0000-0000-000000000008', '2d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000001', 'Rollback L2 Item', 'unikalny', 1, 'w domu', null, null, '1d000000-0000-0000-0000-000000000001'),
  ('7d000000-0000-0000-0000-000000000009', '2d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000001', 'Move Other Item', 'unikalny', 1, 'w domu', null, null, '1d000000-0000-0000-0000-000000000001'),
  ('7d000000-0000-0000-0000-000000000010', '2d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000001', 'Detach Regression Item', 'unikalny', 1, 'w domu', null, null, '1d000000-0000-0000-0000-000000000001'),
  ('7d000000-0000-0000-0000-000000000011', '2d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000001', 'Move Regression Item', 'unikalny', 1, 'w domu', null, null, '1d000000-0000-0000-0000-000000000001'),
  ('7d000000-0000-0000-0000-000000000012', '2d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000001', 'Lifecycle Regression', 'unikalny', 1, 'w domu', null, null, '1d000000-0000-0000-0000-000000000001'),
  ('7d000000-0000-0000-0000-000000000013', '2d000000-0000-0000-0000-000000000001', '3d000000-0000-0000-0000-000000000001', 'Permanent Delete Regression', 'unikalny', 1, 'w domu', null, null, '1d000000-0000-0000-0000-000000000001');

insert into public.item_location (id, item_id, storage_location_l3_id, czy_glowna, notatka)
values
  ('8d000000-0000-0000-0000-000000000001', '7d000000-0000-0000-0000-000000000001', '6d000000-0000-0000-0000-000000000003', true, null),
  ('8d000000-0000-0000-0000-000000000002', '7d000000-0000-0000-0000-000000000001', '6d000000-0000-0000-0000-000000000008', false, 'outside detach'),
  ('8d000000-0000-0000-0000-000000000003', '7d000000-0000-0000-0000-000000000002', '6d000000-0000-0000-0000-000000000008', true, null),
  ('8d000000-0000-0000-0000-000000000004', '7d000000-0000-0000-0000-000000000002', '6d000000-0000-0000-0000-000000000004', false, 'archived source'),
  ('8d000000-0000-0000-0000-000000000005', '7d000000-0000-0000-0000-000000000003', '6d000000-0000-0000-0000-000000000005', true, null),
  ('8d000000-0000-0000-0000-000000000006', '7d000000-0000-0000-0000-000000000003', '6d000000-0000-0000-0000-000000000006', false, 'source extra'),
  ('8d000000-0000-0000-0000-000000000007', '7d000000-0000-0000-0000-000000000003', '6d000000-0000-0000-0000-000000000007', false, 'preserve target note'),
  ('8d000000-0000-0000-0000-000000000008', '7d000000-0000-0000-0000-000000000003', '6d000000-0000-0000-0000-000000000008', false, 'outside extra'),
  ('8d000000-0000-0000-0000-000000000009', '7d000000-0000-0000-0000-000000000004', '6d000000-0000-0000-0000-000000000006', true, null),
  ('8d000000-0000-0000-0000-000000000010', '7d000000-0000-0000-0000-000000000005', '6d000000-0000-0000-0000-000000000008', true, null),
  ('8d000000-0000-0000-0000-000000000011', '7d000000-0000-0000-0000-000000000005', '6d000000-0000-0000-0000-000000000006', false, 'additional only'),
  ('8d000000-0000-0000-0000-000000000012', '7d000000-0000-0000-0000-000000000006', '6d000000-0000-0000-0000-000000000011', true, null),
  ('8d000000-0000-0000-0000-000000000013', '7d000000-0000-0000-0000-000000000007', '6d000000-0000-0000-0000-000000000014', true, null),
  ('8d000000-0000-0000-0000-000000000014', '7d000000-0000-0000-0000-000000000008', '6d000000-0000-0000-0000-000000000015', true, null),
  ('8d000000-0000-0000-0000-000000000015', '7d000000-0000-0000-0000-000000000009', '6d000000-0000-0000-0000-000000000016', true, null),
  ('8d000000-0000-0000-0000-000000000016', '7d000000-0000-0000-0000-000000000010', '6d000000-0000-0000-0000-000000000017', true, null),
  ('8d000000-0000-0000-0000-000000000017', '7d000000-0000-0000-0000-000000000011', '6d000000-0000-0000-0000-000000000018', true, null);

create function public.m4d6_force_l3_delete_failure()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.kod_lokalizacji = 'FAIL-L3' then
    raise exception 'forced L3 delete failure';
  end if;
  return old;
end;
$$;

create trigger m4d6_force_l3_delete_failure
before delete on public.storage_location_l3
for each row execute function public.m4d6_force_l3_delete_failure();

create function public.m4d6_force_l2_delete_failure()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.nazwa = 'Fail L2' then
    raise exception 'forced L2 delete failure';
  end if;
  return old;
end;
$$;

create trigger m4d6_force_l2_delete_failure
before delete on public.storage_location_l2
for each row execute function public.m4d6_force_l2_delete_failure();

-- Schema, configuration, grants, and implementation shape.
select has_function('public', 'delete_storage_location_l2_with_resolution', array['uuid', 'text', 'uuid', 'bigint', 'bigint', 'bigint'], 'M4D.6 final RPC exists with the approved signature');
select is((select count(*) from pg_proc where pronamespace = 'public'::regnamespace and proname = 'delete_storage_location_l2_with_resolution'), 1::bigint, 'M4D.6 exposes exactly one final RPC');
select is((select not p.prosecdef from pg_proc as p where p.oid = 'public.delete_storage_location_l2_with_resolution(uuid,text,uuid,bigint,bigint,bigint)'::regprocedure), true, 'M4D.6 RPC is security invoker');
select ok((select p.proconfig @> array['search_path=""'] from pg_proc as p where p.oid = 'public.delete_storage_location_l2_with_resolution(uuid,text,uuid,bigint,bigint,bigint)'::regprocedure), 'M4D.6 RPC has an empty search_path');
select ok(not has_function_privilege('public', 'public.delete_storage_location_l2_with_resolution(uuid,text,uuid,bigint,bigint,bigint)'::regprocedure, 'EXECUTE'), 'PUBLIC cannot execute M4D.6 RPC');
select ok(not has_function_privilege('anon', 'public.delete_storage_location_l2_with_resolution(uuid,text,uuid,bigint,bigint,bigint)'::regprocedure, 'EXECUTE'), 'anon cannot execute M4D.6 RPC');
select ok(has_function_privilege('authenticated', 'public.delete_storage_location_l2_with_resolution(uuid,text,uuid,bigint,bigint,bigint)'::regprocedure, 'EXECUTE'), 'authenticated can execute M4D.6 RPC');
select ok(pg_get_functiondef('public.delete_storage_location_l2_with_resolution(uuid,text,uuid,bigint,bigint,bigint)'::regprocedure) ilike '%for update of l2%', 'source Furniture row is locked FOR UPDATE');
select ok(pg_get_functiondef('public.delete_storage_location_l2_with_resolution(uuid,text,uuid,bigint,bigint,bigint)'::regprocedure) not like '%EXECUTE %', 'M4D.6 uses no dynamic SQL');

set local role authenticated;
set local "request.jwt.claims" = '{}';
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000008', 'delete', null, 1, 0, 0) $$, 'P0001', 'AUTH_REQUIRED', 'M4D.6 requires a session');
set local "request.jwt.claims" = '{"sub":"1d000000-0000-0000-0000-000000000005","role":"authenticated"}';
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000008', 'delete', null, 1, 0, 0) $$, 'P0001', 'ACTIVE_PROFILE_REQUIRED', 'M4D.6 requires an active profile');
set local "request.jwt.claims" = '{"sub":"1d000000-0000-0000-0000-000000000006","role":"authenticated"}';
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000008', 'delete', null, 1, 0, 0) $$, 'P0001', 'ACTIVE_PROFILE_REQUIRED', 'inactive profile is rejected');
set local "request.jwt.claims" = '{"sub":"1d000000-0000-0000-0000-000000000002","role":"authenticated"}';
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000008', 'delete', null, 1, 0, 0) $$, 'P0001', 'ADMIN_REQUIRED', 'household member is rejected');
set local "request.jwt.claims" = '{"sub":"1d000000-0000-0000-0000-000000000003","role":"authenticated"}';
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000008', 'delete', null, 1, 0, 0) $$, 'P0001', 'ADMIN_REQUIRED', 'child is rejected');
set local "request.jwt.claims" = '{"sub":"1d000000-0000-0000-0000-000000000004","role":"authenticated"}';
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000008', 'delete', null, 1, 0, 0) $$, 'P0001', 'LOCATION_NOT_AVAILABLE', 'foreign admin cannot distinguish source');

set local "request.jwt.claims" = '{"sub":"1d000000-0000-0000-0000-000000000001","role":"authenticated"}';
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5dffffff-0000-0000-0000-000000000099', 'delete', null, 0, 0, 0) $$, 'P0001', 'LOCATION_NOT_AVAILABLE', 'missing source matches foreign source error');
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000008', 'unknown', null, 1, 0, 0) $$, 'P0001', 'INVALID_RESOLUTION', 'unknown resolution is rejected');
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000008', 'delete', null, -1, 0, 0) $$, 'P0001', 'INVALID_EXPECTED_COUNTS', 'negative Storage space count is rejected');
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000008', 'delete', null, 1, -1, 0) $$, 'P0001', 'INVALID_EXPECTED_COUNTS', 'negative Item count is rejected');
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000008', 'delete', null, 1, 0, -1) $$, 'P0001', 'INVALID_EXPECTED_COUNTS', 'negative link count is rejected');
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000008', 'delete', null, null, 0, 0) $$, 'P0001', 'INVALID_EXPECTED_COUNTS', 'null Storage space count is rejected');
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000008', 'delete', null, 1, null, 0) $$, 'P0001', 'INVALID_EXPECTED_COUNTS', 'null Item count is rejected');
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000008', 'delete', null, 1, 0, null) $$, 'P0001', 'INVALID_EXPECTED_COUNTS', 'null link count is rejected');
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000008', 'move', null, 1, 0, 0) $$, 'P0001', 'TARGET_REQUIRED', 'move requires target');
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000008', 'delete', '6d000000-0000-0000-0000-000000000007', 1, 0, 0) $$, 'P0001', 'TARGET_NOT_ALLOWED', 'delete rejects target');
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000008', 'detach', '6d000000-0000-0000-0000-000000000007', 1, 0, 0) $$, 'P0001', 'TARGET_NOT_ALLOWED', 'detach rejects target');
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000008', 'move', '6dffffff-0000-0000-0000-000000000098', 1, 0, 0) $$, 'P0001', 'TARGET_NOT_AVAILABLE', 'missing target is unavailable');
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000008', 'move', '6d000000-0000-0000-0000-000000000009', 1, 0, 0) $$, 'P0001', 'TARGET_NOT_AVAILABLE', 'foreign target matches missing target error');
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000003', 'move', '6d000000-0000-0000-0000-000000000004', 2, 2, 2) $$, 'P0001', 'TARGET_IN_SOURCE_SUBTREE', 'target inside source Furniture is rejected');

-- Stale snapshots include empty Storage space count changes and link changes.
insert into public.storage_location_l3 (id, storage_location_l2_id, nazwa, kod_lokalizacji, "kolejność") values ('6d000000-0000-0000-0000-000000000019', '5d000000-0000-0000-0000-000000000009', 'Added after snapshot', 'M4D6-SA2', 2);
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000009', 'detach', null, 1, 1, 1) $$, 'P0001', 'DEPENDENCIES_CHANGED', 'adding an empty Storage space invalidates snapshot');
select is((select count(*) from public.storage_location_l3 where storage_location_l2_id = '5d000000-0000-0000-0000-000000000009'), 2::bigint, 'stale add keeps both Storage spaces');
select is((select count(*) from public.item_location where id = '8d000000-0000-0000-0000-000000000012'), 1::bigint, 'stale add keeps source link');
delete from public.storage_location_l3 where id = '6d000000-0000-0000-0000-000000000013';
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000010', 'delete', null, 2, 0, 0) $$, 'P0001', 'DEPENDENCIES_CHANGED', 'removing an empty Storage space invalidates snapshot');
select is((select count(*) from public.storage_location_l2 where id = '5d000000-0000-0000-0000-000000000010'), 1::bigint, 'stale remove keeps Furniture');
select is((select count(*) from public.storage_location_l3 where storage_location_l2_id = '5d000000-0000-0000-0000-000000000010'), 1::bigint, 'stale remove keeps remaining Storage space');
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000009', 'detach', null, 2, 0, 1) $$, 'P0001', 'DEPENDENCIES_CHANGED', 'changed distinct Item count is rejected');
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000009', 'detach', null, 2, 1, 0) $$, 'P0001', 'DEPENDENCIES_CHANGED', 'changed link count is rejected');
select is((select count(*) from public.storage_location_l2 where id = '5d000000-0000-0000-0000-000000000009'), 1::bigint, 'all stale errors keep source Furniture');
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000009', 'delete', null, 2, 1, 1) $$, 'P0001', 'DEPENDENCIES_CHANGED', 'delete is blocked while links exist');

-- Delete mode handles a completely empty Furniture item and empty subtrees.
select results_eq($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000001', 'delete', null, 0, 0, 0) $$, $$ values ('success'::text, 'delete'::text, '5d000000-0000-0000-0000-000000000001'::uuid, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint) $$, 'admin deletes completely empty Furniture');
select is((select count(*) from public.storage_location_l2 where id = '5d000000-0000-0000-0000-000000000001'), 0::bigint, 'empty Furniture row is deleted');
select is((select count(*) from public.room where id = '4d000000-0000-0000-0000-000000000001'), 1::bigint, 'source Room remains after empty Furniture delete');
select results_eq($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000002', 'delete', null, 2, 0, 0) $$, $$ values ('success'::text, 'delete'::text, '5d000000-0000-0000-0000-000000000002'::uuid, 2::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint) $$, 'delete removes Furniture with multiple empty Storage spaces');
select is((select count(*) from public.storage_location_l3 where id in ('6d000000-0000-0000-0000-000000000001', '6d000000-0000-0000-0000-000000000002')), 0::bigint, 'delete removes every empty Storage space');
select is((select count(*) from public.storage_location_l2 where id = '5d000000-0000-0000-0000-000000000002'), 0::bigint, 'delete removes exactly the selected Furniture');
select is((select count(*) from public.storage_location_l2 where id = '5d000000-0000-0000-0000-000000000005'), 1::bigint, 'delete keeps other Furniture');
select is((select count(*) from public.item), 13::bigint, 'delete mode removes no Item records');

-- Detach removes all source links, preserves external links and Item state.
select results_eq($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000003', 'detach', null, 2, 2, 2) $$, $$ values ('success'::text, 'detach'::text, '5d000000-0000-0000-0000-000000000003'::uuid, 2::bigint, 2::bigint, 1::bigint, 1::bigint, 0::bigint, 2::bigint, 0::bigint, 0::bigint, 0::bigint) $$, 'detach resolves active and archived Items and deletes subtree');
select is((select count(*) from public.storage_location_l2 where id = '5d000000-0000-0000-0000-000000000003'), 0::bigint, 'detach deletes Furniture');
select is((select count(*) from public.storage_location_l3 where storage_location_l2_id = '5d000000-0000-0000-0000-000000000003'), 0::bigint, 'detach deletes all nested Storage spaces');
select is((select count(*) from public.item_location where id in ('8d000000-0000-0000-0000-000000000001', '8d000000-0000-0000-0000-000000000004')), 0::bigint, 'detach removes primary and additional source links');
select is((select count(*) from public.item_location where id in ('8d000000-0000-0000-0000-000000000002', '8d000000-0000-0000-0000-000000000003')), 2::bigint, 'detach keeps links outside source subtree');
select is((select count(*) from public.item where id in ('7d000000-0000-0000-0000-000000000001', '7d000000-0000-0000-0000-000000000002')), 2::bigint, 'detach keeps Item records');
select is((select status from public.item where id = '7d000000-0000-0000-0000-000000000001'), 'w domu'::public.item_status, 'detach keeps active status');
select is((select status from public.item where id = '7d000000-0000-0000-0000-000000000002'), 'archiwalne'::public.item_status, 'detach keeps archived status');
select is((select archived_at from public.item where id = '7d000000-0000-0000-0000-000000000002'), '2026-07-01 10:00:00+00'::timestamptz, 'detach keeps archived_at');
select is((select status_before_archive from public.item where id = '7d000000-0000-0000-0000-000000000002'), 'pożyczone'::public.item_status, 'detach keeps status_before_archive');
select is((select category_id from public.item where id = '7d000000-0000-0000-0000-000000000002'), '3d000000-0000-0000-0000-000000000001'::uuid, 'detach keeps category');

-- Move to another Furniture in the same Room.
select results_eq($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000004', 'move', '6d000000-0000-0000-0000-000000000007', 2, 3, 4) $$, $$ values ('success'::text, 'move'::text, '5d000000-0000-0000-0000-000000000004'::uuid, 2::bigint, 3::bigint, 2::bigint, 1::bigint, 2::bigint, 2::bigint, 1::bigint, 1::bigint, 2::bigint) $$, 'move resolves primary and additional source links');
select is((select count(*) from public.storage_location_l2 where id = '5d000000-0000-0000-0000-000000000004'), 0::bigint, 'move deletes source Furniture');
select is((select count(*) from public.storage_location_l3 where storage_location_l2_id = '5d000000-0000-0000-0000-000000000004'), 0::bigint, 'move deletes all source Storage spaces');
select is((select count(*) from public.storage_location_l3 where id = '6d000000-0000-0000-0000-000000000007'), 1::bigint, 'move keeps external target');
select is((select count(*) from public.item_location where item_id in ('7d000000-0000-0000-0000-000000000003', '7d000000-0000-0000-0000-000000000004') and storage_location_l3_id = '6d000000-0000-0000-0000-000000000007' and czy_glowna), 2::bigint, 'move establishes primary target links');
select is((select count(*) from public.item_location where storage_location_l3_id in ('6d000000-0000-0000-0000-000000000005', '6d000000-0000-0000-0000-000000000006')), 0::bigint, 'move removes all source links');
select is((select notatka from public.item_location where id = '8d000000-0000-0000-0000-000000000007'), 'preserve target note', 'promoted target link keeps note');
select is((select count(*) from public.item_location where id = '8d000000-0000-0000-0000-000000000008'), 1::bigint, 'additional link outside source remains');
select is((select storage_location_l3_id from public.item_location where item_id = '7d000000-0000-0000-0000-000000000005' and czy_glowna), '6d000000-0000-0000-0000-000000000008'::uuid, 'additional-only source Item keeps outside primary');
select is((select count(*) from public.item where id in ('7d000000-0000-0000-0000-000000000003', '7d000000-0000-0000-0000-000000000004', '7d000000-0000-0000-0000-000000000005')), 3::bigint, 'move keeps all Item records');
select is((select status from public.item where id = '7d000000-0000-0000-0000-000000000004'), 'archiwalne'::public.item_status, 'move keeps archived status');
select is((select status_before_archive from public.item where id = '7d000000-0000-0000-0000-000000000004'), 'zużyte'::public.item_status, 'move keeps archived previous status');
select is((select category_id from public.item where id = '7d000000-0000-0000-0000-000000000003'), '3d000000-0000-0000-0000-000000000001'::uuid, 'move keeps category');
select is((select count(*) from public.item_location where item_id = '7d000000-0000-0000-0000-000000000003' and storage_location_l3_id = '6d000000-0000-0000-0000-000000000007'), 1::bigint, 'move creates no duplicate target link');

-- Move target may be in another Room of the same household.
select results_eq($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000013', 'move', '6d000000-0000-0000-0000-000000000008', 1, 1, 1) $$, $$ values ('success'::text, 'move'::text, '5d000000-0000-0000-0000-000000000013'::uuid, 1::bigint, 1::bigint, 1::bigint, 0::bigint, 1::bigint, 0::bigint, 0::bigint, 1::bigint, 1::bigint) $$, 'move accepts target in another Room');
select is((select storage_location_l3_id from public.item_location where item_id = '7d000000-0000-0000-0000-000000000009' and czy_glowna), '6d000000-0000-0000-0000-000000000008'::uuid, 'other-Room move assigns requested target');
select is((select count(*) from public.storage_location_l2 where id = '5d000000-0000-0000-0000-000000000013'), 0::bigint, 'other-Room move deletes source subtree');

-- Rollback when final L3 or L2 delete fails.
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000011', 'move', '6d000000-0000-0000-0000-000000000007', 1, 1, 1) $$, 'P0001', 'DELETE_FAILED', 'L3 delete failure rolls back full operation');
select is((select count(*) from public.storage_location_l2 where id = '5d000000-0000-0000-0000-000000000011'), 1::bigint, 'L3 rollback keeps Furniture');
select is((select count(*) from public.storage_location_l3 where id = '6d000000-0000-0000-0000-000000000014'), 1::bigint, 'L3 rollback keeps Storage space');
select is((select count(*) from public.item_location where id = '8d000000-0000-0000-0000-000000000013' and czy_glowna), 1::bigint, 'L3 rollback restores source primary link');
select is((select count(*) from public.item_location where item_id = '7d000000-0000-0000-0000-000000000007' and storage_location_l3_id = '6d000000-0000-0000-0000-000000000007'), 0::bigint, 'L3 rollback removes partial target link');
select throws_ok($$ select * from public.delete_storage_location_l2_with_resolution('5d000000-0000-0000-0000-000000000012', 'move', '6d000000-0000-0000-0000-000000000007', 1, 1, 1) $$, 'P0001', 'DELETE_FAILED', 'L2 delete failure rolls back full operation');
select is((select count(*) from public.storage_location_l2 where id = '5d000000-0000-0000-0000-000000000012'), 1::bigint, 'L2 rollback keeps Furniture');
select is((select count(*) from public.storage_location_l3 where id = '6d000000-0000-0000-0000-000000000015'), 1::bigint, 'L2 rollback restores deleted Storage space');
select is((select count(*) from public.item_location where id = '8d000000-0000-0000-0000-000000000014' and czy_glowna), 1::bigint, 'L2 rollback restores source primary link');
select is((select count(*) from public.item_location where item_id = '7d000000-0000-0000-0000-000000000008' and storage_location_l3_id = '6d000000-0000-0000-0000-000000000007'), 0::bigint, 'L2 rollback removes partial target link');

-- Stable M4D and Item lifecycle contracts remain callable.
select is((select position_count from public.get_storage_location_l2_dependency_summary('5d000000-0000-0000-0000-000000000014')), 1::bigint, 'M4D.2 L2 summary still works');
select results_eq($$ select * from public.detach_items_from_storage_location_l2('5d000000-0000-0000-0000-000000000014') $$, $$ values ('success'::text, 1::bigint, 1::bigint, 1::bigint, 0::bigint) $$, 'M4D.3 L2 detach still works');
select is((select count(*) from public.item where id = '7d000000-0000-0000-0000-000000000010'), 1::bigint, 'M4D.3 regression keeps Item');
select results_eq($$ select * from public.move_primary_items_from_location('storage', '5d000000-0000-0000-0000-000000000015', '6d000000-0000-0000-0000-000000000008') $$, $$ values ('success'::text, 1::bigint, 1::bigint, 0::bigint, 0::bigint, 1::bigint, 1::bigint) $$, 'M4D.4 storage move still works');
select is((select storage_location_l3_id from public.item_location where item_id = '7d000000-0000-0000-0000-000000000011' and czy_glowna), '6d000000-0000-0000-0000-000000000008'::uuid, 'M4D.4 regression assigns target');
select results_eq($$ select * from public.delete_storage_location_l3_with_resolution('6d000000-0000-0000-0000-000000000018', 'delete', null, 0, 0) $$, $$ values ('success'::text, 'delete'::text, '6d000000-0000-0000-0000-000000000018'::uuid, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint) $$, 'M4D.5 Position delete still works after move');
select lives_ok($$ select public.set_item_primary_location('7d000000-0000-0000-0000-000000000012', '6d000000-0000-0000-0000-000000000008') $$, 'set_item_primary_location still works');
select is((select count(*) from public.item_location where item_id = '7d000000-0000-0000-0000-000000000012' and czy_glowna), 1::bigint, 'primary location remains singular');
select is(public.archive_item('7d000000-0000-0000-0000-000000000012'), 'success', 'archive_item still works');
select is((select status from public.item where id = '7d000000-0000-0000-0000-000000000012'), 'archiwalne'::public.item_status, 'archive changes status');
select is(public.restore_item('7d000000-0000-0000-0000-000000000012', null), 'success', 'restore_item still works');
select is((select status from public.item where id = '7d000000-0000-0000-0000-000000000012'), 'w domu'::public.item_status, 'restore returns previous status');
select is(public.delete_item_permanently('7d000000-0000-0000-0000-000000000013'), 'success', 'delete_item_permanently still works');
select is((select count(*) from public.item where id = '7d000000-0000-0000-0000-000000000013'), 0::bigint, 'permanent Item deletion removes only requested Item');
select is((select count(*) from public.room where household_id = '2d000000-0000-0000-0000-000000000002'), 0::bigint, 'RLS hides foreign household structure');
select is((select count(*) from public.item where household_id = '2d000000-0000-0000-0000-000000000002'), 0::bigint, 'RLS hides foreign household Items');

reset role;
set local "request.jwt.claims" = '{}';

select * from finish();
rollback;
