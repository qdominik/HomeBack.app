begin;

create extension if not exists pgtap with schema extensions;
set search_path = extensions, public, auth;

select plan(73);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  ('00000000-0000-0000-0000-000000000000', '1c000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'm4d5-admin-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1c000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'm4d5-member@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1c000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'm4d5-child@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1c000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'm4d5-guest@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1c000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'm4d5-admin-b@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1c000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'm4d5-no-profile@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1c000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'm4d5-inactive@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

insert into public.household (id, nazwa, typ)
values
  ('2c000000-0000-0000-0000-000000000001', 'M4D5 Home A', 'dom'),
  ('2c000000-0000-0000-0000-000000000002', 'M4D5 Home B', 'mieszkanie');

insert into public.profile (id, household_id, imie, email, rola, status)
values
  ('1c000000-0000-0000-0000-000000000001', '2c000000-0000-0000-0000-000000000001', 'Admin A', 'm4d5-admin-a@example.test', 'admin', 'aktywny'),
  ('1c000000-0000-0000-0000-000000000002', '2c000000-0000-0000-0000-000000000001', 'Member', 'm4d5-member@example.test', 'domownik', 'aktywny'),
  ('1c000000-0000-0000-0000-000000000003', '2c000000-0000-0000-0000-000000000001', 'Child', 'm4d5-child@example.test', 'dziecko', 'aktywny'),
  ('1c000000-0000-0000-0000-000000000004', '2c000000-0000-0000-0000-000000000001', 'Guest', 'm4d5-guest@example.test', U&'go\015B\0107'::public.profile_role, 'aktywny'),
  ('1c000000-0000-0000-0000-000000000005', '2c000000-0000-0000-0000-000000000002', 'Admin B', 'm4d5-admin-b@example.test', 'admin', 'aktywny'),
  ('1c000000-0000-0000-0000-000000000007', '2c000000-0000-0000-0000-000000000001', 'Inactive', 'm4d5-inactive@example.test', 'admin', 'nieaktywny');

insert into public.category (id, household_id, nazwa, czy_systemowa, widoczna_dla_dzieci)
values
  ('3c000000-0000-0000-0000-000000000001', '2c000000-0000-0000-0000-000000000001', 'M4D5 Category A', false, true),
  ('3c000000-0000-0000-0000-000000000002', '2c000000-0000-0000-0000-000000000002', 'M4D5 Category B', false, true);

insert into public.room (id, household_id, nazwa, typ, "kolejność")
values
  ('4c000000-0000-0000-0000-000000000001', '2c000000-0000-0000-0000-000000000001', 'Source Room', 'Room', 1),
  ('4c000000-0000-0000-0000-000000000002', '2c000000-0000-0000-0000-000000000001', 'Target Room', 'Room', 2),
  ('4c000000-0000-0000-0000-000000000003', '2c000000-0000-0000-0000-000000000001', 'Empty Room', 'Room', 3),
  ('4c000000-0000-0000-0000-000000000004', '2c000000-0000-0000-0000-000000000002', 'Foreign Room', 'Room', 1);

insert into public.storage_location_l2 (id, room_id, nazwa, typ, "kolejność")
values
  ('5c000000-0000-0000-0000-000000000001', '4c000000-0000-0000-0000-000000000001', 'Source Storage', 'Shelf', 1),
  ('5c000000-0000-0000-0000-000000000002', '4c000000-0000-0000-0000-000000000002', 'Target Storage', 'Shelf', 1),
  ('5c000000-0000-0000-0000-000000000003', '4c000000-0000-0000-0000-000000000001', 'Empty Storage', 'Shelf', 2),
  ('5c000000-0000-0000-0000-000000000004', '4c000000-0000-0000-0000-000000000004', 'Foreign Storage', 'Shelf', 1);

insert into public.storage_location_l3 (id, storage_location_l2_id, nazwa, kod_lokalizacji, "kolejność")
values
  ('6c000000-0000-0000-0000-000000000001', '5c000000-0000-0000-0000-000000000001', 'Empty Source', 'M4D5-EMPTY', 1),
  ('6c000000-0000-0000-0000-000000000002', '5c000000-0000-0000-0000-000000000001', 'Sibling', 'M4D5-SIB', 2),
  ('6c000000-0000-0000-0000-000000000003', '5c000000-0000-0000-0000-000000000001', 'Detach Source', 'M4D5-DET', 3),
  ('6c000000-0000-0000-0000-000000000004', '5c000000-0000-0000-0000-000000000002', 'Outside', 'M4D5-OUT', 1),
  ('6c000000-0000-0000-0000-000000000005', '5c000000-0000-0000-0000-000000000001', 'Move Source', 'M4D5-MOVE', 4),
  ('6c000000-0000-0000-0000-000000000006', '5c000000-0000-0000-0000-000000000002', 'Move Target', 'M4D5-TARGET', 2),
  ('6c000000-0000-0000-0000-000000000007', '5c000000-0000-0000-0000-000000000002', 'Move Outside', 'M4D5-MOVE-OUT', 3),
  ('6c000000-0000-0000-0000-000000000008', '5c000000-0000-0000-0000-000000000001', 'Stale Source', 'M4D5-STALE', 5),
  ('6c000000-0000-0000-0000-000000000009', '5c000000-0000-0000-0000-000000000001', 'Rollback Detach', 'FAIL-DETACH', 6),
  ('6c000000-0000-0000-0000-000000000010', '5c000000-0000-0000-0000-000000000001', 'Rollback Move', 'FAIL-MOVE', 7),
  ('6c000000-0000-0000-0000-000000000011', '5c000000-0000-0000-0000-000000000002', 'Rollback Target', 'M4D5-RB-T', 4),
  ('6c000000-0000-0000-0000-000000000012', '5c000000-0000-0000-0000-000000000004', 'Foreign Source', 'M4D5-F-S', 1),
  ('6c000000-0000-0000-0000-000000000013', '5c000000-0000-0000-0000-000000000004', 'Foreign Target', 'M4D5-F-T', 2),
  ('6c000000-0000-0000-0000-000000000014', '5c000000-0000-0000-0000-000000000001', 'Role Source', 'M4D5-ROLE', 8),
  ('6c000000-0000-0000-0000-000000000015', '5c000000-0000-0000-0000-000000000001', 'Detach Regression', 'M4D5-REG-D', 9),
  ('6c000000-0000-0000-0000-000000000016', '5c000000-0000-0000-0000-000000000001', 'Move Regression', 'M4D5-REG-M', 10),
  ('6c000000-0000-0000-0000-000000000017', '5c000000-0000-0000-0000-000000000002', 'Move Regression Target', 'M4D5-REG-MT', 5),
  ('6c000000-0000-0000-0000-000000000018', '5c000000-0000-0000-0000-000000000002', 'Primary Regression Target', 'M4D5-REG-P', 6);

insert into public.item (
  id, household_id, category_id, nazwa, typ, ilosc, status, archived_at,
  status_before_archive, created_by_id
)
values
  ('7c000000-0000-0000-0000-000000000001', '2c000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000001', 'Detach Active', 'unikalny', 1, 'w domu', null, null, '1c000000-0000-0000-0000-000000000001'),
  ('7c000000-0000-0000-0000-000000000002', '2c000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000001', 'Detach Archived', 'unikalny', 1, 'archiwalne', '2026-03-01 10:00:00+00', 'w domu', '1c000000-0000-0000-0000-000000000001'),
  ('7c000000-0000-0000-0000-000000000003', '2c000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000001', 'Move Reused', 'unikalny', 1, 'w domu', null, null, '1c000000-0000-0000-0000-000000000001'),
  ('7c000000-0000-0000-0000-000000000004', '2c000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000001', 'Move Created Archived', 'unikalny', 1, 'archiwalne', '2026-03-02 10:00:00+00', 'w domu', '1c000000-0000-0000-0000-000000000001'),
  ('7c000000-0000-0000-0000-000000000005', '2c000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000001', 'Move Additional Only', 'unikalny', 1, 'w domu', null, null, '1c000000-0000-0000-0000-000000000001'),
  ('7c000000-0000-0000-0000-000000000006', '2c000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000001', 'Stale Item', 'unikalny', 1, 'w domu', null, null, '1c000000-0000-0000-0000-000000000001'),
  ('7c000000-0000-0000-0000-000000000007', '2c000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000001', 'Rollback Detach Item', 'unikalny', 1, 'w domu', null, null, '1c000000-0000-0000-0000-000000000001'),
  ('7c000000-0000-0000-0000-000000000008', '2c000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000001', 'Rollback Move Item', 'unikalny', 1, 'w domu', null, null, '1c000000-0000-0000-0000-000000000001'),
  ('7c000000-0000-0000-0000-000000000009', '2c000000-0000-0000-0000-000000000002', '3c000000-0000-0000-0000-000000000002', 'Foreign Item', 'unikalny', 1, 'w domu', null, null, '1c000000-0000-0000-0000-000000000005'),
  ('7c000000-0000-0000-0000-000000000010', '2c000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000001', 'Detach Regression Item', 'unikalny', 1, 'w domu', null, null, '1c000000-0000-0000-0000-000000000001'),
  ('7c000000-0000-0000-0000-000000000011', '2c000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000001', 'Move Regression Item', 'unikalny', 1, 'w domu', null, null, '1c000000-0000-0000-0000-000000000001'),
  ('7c000000-0000-0000-0000-000000000012', '2c000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000001', 'Primary Regression Item', 'unikalny', 1, 'w domu', null, null, '1c000000-0000-0000-0000-000000000001'),
  ('7c000000-0000-0000-0000-000000000013', '2c000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000001', 'Lifecycle Regression Item', 'unikalny', 1, 'w domu', null, null, '1c000000-0000-0000-0000-000000000001'),
  ('7c000000-0000-0000-0000-000000000014', '2c000000-0000-0000-0000-000000000001', '3c000000-0000-0000-0000-000000000001', 'Delete Regression Item', 'unikalny', 1, 'w domu', null, null, '1c000000-0000-0000-0000-000000000001');

insert into public.item_location (id, item_id, storage_location_l3_id, czy_glowna, notatka)
values
  ('8c000000-0000-0000-0000-000000000001', '7c000000-0000-0000-0000-000000000001', '6c000000-0000-0000-0000-000000000003', true, null),
  ('8c000000-0000-0000-0000-000000000002', '7c000000-0000-0000-0000-000000000001', '6c000000-0000-0000-0000-000000000004', false, 'detach outside'),
  ('8c000000-0000-0000-0000-000000000003', '7c000000-0000-0000-0000-000000000002', '6c000000-0000-0000-0000-000000000004', true, null),
  ('8c000000-0000-0000-0000-000000000004', '7c000000-0000-0000-0000-000000000002', '6c000000-0000-0000-0000-000000000003', false, 'detach archived'),
  ('8c000000-0000-0000-0000-000000000005', '7c000000-0000-0000-0000-000000000003', '6c000000-0000-0000-0000-000000000005', true, null),
  ('8c000000-0000-0000-0000-000000000006', '7c000000-0000-0000-0000-000000000003', '6c000000-0000-0000-0000-000000000005', false, 'source extra'),
  ('8c000000-0000-0000-0000-000000000007', '7c000000-0000-0000-0000-000000000003', '6c000000-0000-0000-0000-000000000006', false, 'preserve target note'),
  ('8c000000-0000-0000-0000-000000000008', '7c000000-0000-0000-0000-000000000003', '6c000000-0000-0000-0000-000000000007', false, 'outside extra'),
  ('8c000000-0000-0000-0000-000000000009', '7c000000-0000-0000-0000-000000000004', '6c000000-0000-0000-0000-000000000005', true, null),
  ('8c000000-0000-0000-0000-000000000010', '7c000000-0000-0000-0000-000000000005', '6c000000-0000-0000-0000-000000000007', true, null),
  ('8c000000-0000-0000-0000-000000000011', '7c000000-0000-0000-0000-000000000005', '6c000000-0000-0000-0000-000000000005', false, 'additional only'),
  ('8c000000-0000-0000-0000-000000000012', '7c000000-0000-0000-0000-000000000006', '6c000000-0000-0000-0000-000000000008', true, null),
  ('8c000000-0000-0000-0000-000000000013', '7c000000-0000-0000-0000-000000000007', '6c000000-0000-0000-0000-000000000009', true, null),
  ('8c000000-0000-0000-0000-000000000014', '7c000000-0000-0000-0000-000000000008', '6c000000-0000-0000-0000-000000000010', true, null),
  ('8c000000-0000-0000-0000-000000000015', '7c000000-0000-0000-0000-000000000009', '6c000000-0000-0000-0000-000000000012', true, null),
  ('8c000000-0000-0000-0000-000000000016', '7c000000-0000-0000-0000-000000000010', '6c000000-0000-0000-0000-000000000015', true, null),
  ('8c000000-0000-0000-0000-000000000017', '7c000000-0000-0000-0000-000000000011', '6c000000-0000-0000-0000-000000000016', true, null);

create function public.m4d5_force_position_delete_failure()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.kod_lokalizacji in ('FAIL-DETACH', 'FAIL-MOVE') then
    raise exception 'forced final delete failure';
  end if;
  return old;
end;
$$;

create trigger m4d5_force_position_delete_failure
before delete on public.storage_location_l3
for each row execute function public.m4d5_force_position_delete_failure();

select is((select count(*) from pg_proc where pronamespace = 'public'::regnamespace and proname = 'delete_storage_location_l3_with_resolution'), 1::bigint, 'M4D.5 exposes exactly one final delete RPC');
select is((select not p.prosecdef from pg_proc as p where p.oid = 'public.delete_storage_location_l3_with_resolution(uuid,text,uuid,bigint,bigint)'::regprocedure), true, 'final delete RPC is security invoker');
select ok(not has_function_privilege('public', 'public.delete_storage_location_l3_with_resolution(uuid,text,uuid,bigint,bigint)'::regprocedure, 'EXECUTE'), 'PUBLIC cannot execute final delete RPC');
select ok(not has_function_privilege('anon', 'public.delete_storage_location_l3_with_resolution(uuid,text,uuid,bigint,bigint)'::regprocedure, 'EXECUTE'), 'anon cannot execute final delete RPC');
select ok(has_function_privilege('authenticated', 'public.delete_storage_location_l3_with_resolution(uuid,text,uuid,bigint,bigint)'::regprocedure, 'EXECUTE'), 'authenticated can execute final delete RPC');

set local role authenticated;
set local "request.jwt.claims" = '{}';
select throws_ok($$ select * from public.delete_storage_location_l3_with_resolution('6c000000-0000-0000-0000-000000000014', 'delete', null, 0, 0) $$, 'P0001', 'AUTH_REQUIRED', 'final delete requires a session');
set local "request.jwt.claims" = '{"sub":"1c000000-0000-0000-0000-000000000006","role":"authenticated"}';
select throws_ok($$ select * from public.delete_storage_location_l3_with_resolution('6c000000-0000-0000-0000-000000000014', 'delete', null, 0, 0) $$, 'P0001', 'ACTIVE_PROFILE_REQUIRED', 'final delete requires an active profile');
set local "request.jwt.claims" = '{"sub":"1c000000-0000-0000-0000-000000000007","role":"authenticated"}';
select throws_ok($$ select * from public.delete_storage_location_l3_with_resolution('6c000000-0000-0000-0000-000000000014', 'delete', null, 0, 0) $$, 'P0001', 'ACTIVE_PROFILE_REQUIRED', 'inactive admin is rejected');
set local "request.jwt.claims" = '{"sub":"1c000000-0000-0000-0000-000000000002","role":"authenticated"}';
select throws_ok($$ select * from public.delete_storage_location_l3_with_resolution('6c000000-0000-0000-0000-000000000014', 'delete', null, 0, 0) $$, 'P0001', 'ADMIN_REQUIRED', 'household member is rejected');
set local "request.jwt.claims" = '{"sub":"1c000000-0000-0000-0000-000000000003","role":"authenticated"}';
select throws_ok($$ select * from public.delete_storage_location_l3_with_resolution('6c000000-0000-0000-0000-000000000014', 'delete', null, 0, 0) $$, 'P0001', 'ADMIN_REQUIRED', 'child is rejected');
set local "request.jwt.claims" = '{"sub":"1c000000-0000-0000-0000-000000000004","role":"authenticated"}';
select throws_ok($$ select * from public.delete_storage_location_l3_with_resolution('6c000000-0000-0000-0000-000000000014', 'delete', null, 0, 0) $$, 'P0001', 'ADMIN_REQUIRED', 'guest is rejected');
set local "request.jwt.claims" = '{"sub":"1c000000-0000-0000-0000-000000000005","role":"authenticated"}';
select throws_ok($$ select * from public.delete_storage_location_l3_with_resolution('6c000000-0000-0000-0000-000000000014', 'delete', null, 0, 0) $$, 'P0001', 'LOCATION_NOT_AVAILABLE', 'foreign admin cannot distinguish source');

set local "request.jwt.claims" = '{"sub":"1c000000-0000-0000-0000-000000000001","role":"authenticated"}';
select throws_ok($$ select * from public.delete_storage_location_l3_with_resolution('6cffffff-0000-0000-0000-000000000099', 'delete', null, 0, 0) $$, 'P0001', 'LOCATION_NOT_AVAILABLE', 'missing source matches foreign source error');
select throws_ok($$ select * from public.delete_storage_location_l3_with_resolution('6c000000-0000-0000-0000-000000000014', 'unknown', null, 0, 0) $$, 'P0001', 'INVALID_RESOLUTION', 'unknown resolution is rejected');
select throws_ok($$ select * from public.delete_storage_location_l3_with_resolution('6c000000-0000-0000-0000-000000000014', 'move', null, 0, 0) $$, 'P0001', 'TARGET_REQUIRED', 'move requires target');
select throws_ok($$ select * from public.delete_storage_location_l3_with_resolution('6c000000-0000-0000-0000-000000000014', 'move', '6c000000-0000-0000-0000-000000000014', 0, 0) $$, 'P0001', 'TARGET_INSIDE_SOURCE', 'move rejects source as target');
select throws_ok($$ select * from public.delete_storage_location_l3_with_resolution('6c000000-0000-0000-0000-000000000014', 'move', '6c000000-0000-0000-0000-000000000013', 0, 0) $$, 'P0001', 'TARGET_NOT_AVAILABLE', 'move rejects foreign target');
select throws_ok($$ select * from public.delete_storage_location_l3_with_resolution('6c000000-0000-0000-0000-000000000014', 'move', '6cffffff-0000-0000-0000-000000000098', 0, 0) $$, 'P0001', 'TARGET_NOT_AVAILABLE', 'move rejects missing target like foreign target');
select throws_ok($$ select * from public.delete_storage_location_l3_with_resolution('6c000000-0000-0000-0000-000000000014', 'detach', '6c000000-0000-0000-0000-000000000006', 0, 0) $$, 'P0001', 'INVALID_RESOLUTION', 'detach rejects target');
select throws_ok($$ select * from public.delete_storage_location_l3_with_resolution('6c000000-0000-0000-0000-000000000014', 'delete', '6c000000-0000-0000-0000-000000000006', 0, 0) $$, 'P0001', 'INVALID_RESOLUTION', 'delete rejects target');

select throws_ok($$ select * from public.delete_storage_location_l3_with_resolution('6c000000-0000-0000-0000-000000000008', 'delete', null, 1, 1) $$, 'P0001', 'DEPENDENCIES_CHANGED', 'delete mode is blocked when links exist');
select throws_ok($$ select * from public.delete_storage_location_l3_with_resolution('6c000000-0000-0000-0000-000000000008', 'detach', null, 0, 1) $$, 'P0001', 'DEPENDENCIES_CHANGED', 'stale distinct Item count is rejected');
select throws_ok($$ select * from public.delete_storage_location_l3_with_resolution('6c000000-0000-0000-0000-000000000008', 'detach', null, 1, 0) $$, 'P0001', 'DEPENDENCIES_CHANGED', 'stale link count is rejected');
select is((select count(*) from public.item_location where storage_location_l3_id = '6c000000-0000-0000-0000-000000000008'), 1::bigint, 'stale dependency errors make no partial link change');
select is((select count(*) from public.storage_location_l3 where id = '6c000000-0000-0000-0000-000000000008'), 1::bigint, 'stale dependency errors keep source Position');

select results_eq($$ select * from public.delete_storage_location_l3_with_resolution('6c000000-0000-0000-0000-000000000001', 'delete', null, 0, 0) $$, $$ values ('success'::text, 'delete'::text, '6c000000-0000-0000-0000-000000000001'::uuid, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint) $$, 'admin deletes empty Position');
select is((select count(*) from public.storage_location_l3 where id = '6c000000-0000-0000-0000-000000000001'), 0::bigint, 'empty source Position is removed');
select is((select count(*) from public.storage_location_l2 where id = '5c000000-0000-0000-0000-000000000001'), 1::bigint, 'parent storage remains after empty delete');
select is((select count(*) from public.storage_location_l3 where id = '6c000000-0000-0000-0000-000000000002'), 1::bigint, 'sibling Position remains after empty delete');

select results_eq($$ select * from public.delete_storage_location_l3_with_resolution('6c000000-0000-0000-0000-000000000003', 'detach', null, 2, 2) $$, $$ values ('success'::text, 'detach'::text, '6c000000-0000-0000-0000-000000000003'::uuid, 2::bigint, 1::bigint, 1::bigint, 0::bigint, 2::bigint, 0::bigint, 0::bigint) $$, 'detach removes all source links and deletes source');
select is((select count(*) from public.item_location where storage_location_l3_id = '6c000000-0000-0000-0000-000000000003'), 0::bigint, 'detach removes primary and additional source links');
select is((select count(*) from public.item where id = '7c000000-0000-0000-0000-000000000001'), 1::bigint, 'detach keeps active Item');
select is((select count(*) from public.item where id = '7c000000-0000-0000-0000-000000000002'), 1::bigint, 'detach keeps archived Item');
select is((select status from public.item where id = '7c000000-0000-0000-0000-000000000001'), 'w domu'::public.item_status, 'detach keeps active status');
select is((select status from public.item where id = '7c000000-0000-0000-0000-000000000002'), 'archiwalne'::public.item_status, 'detach keeps archived status');
select is((select archived_at from public.item where id = '7c000000-0000-0000-0000-000000000002'), '2026-03-01 10:00:00+00'::timestamptz, 'detach keeps archived_at');
select is((select status_before_archive from public.item where id = '7c000000-0000-0000-0000-000000000002'), 'w domu'::public.item_status, 'detach keeps status_before_archive');
select is((select count(*) from public.item_location where id in ('8c000000-0000-0000-0000-000000000002', '8c000000-0000-0000-0000-000000000003')), 2::bigint, 'detach keeps links outside source');
select is((select count(*) from public.storage_location_l3 where id = '6c000000-0000-0000-0000-000000000003'), 0::bigint, 'detach deletes source Position');
select is((select count(*) from public.storage_location_l2 where id = '5c000000-0000-0000-0000-000000000001'), 1::bigint, 'detach keeps parent storage');

select results_eq($$ select * from public.delete_storage_location_l3_with_resolution('6c000000-0000-0000-0000-000000000005', 'move', '6c000000-0000-0000-0000-000000000006', 3, 4) $$, $$ values ('success'::text, 'move'::text, '6c000000-0000-0000-0000-000000000005'::uuid, 3::bigint, 2::bigint, 1::bigint, 2::bigint, 2::bigint, 1::bigint, 1::bigint) $$, 'move resolves primary and additional links before deleting source');
select is((select count(*) from public.item_location where storage_location_l3_id = '6c000000-0000-0000-0000-000000000005'), 0::bigint, 'move leaves no source links');
select is((select count(*) from public.item_location where item_id in ('7c000000-0000-0000-0000-000000000003', '7c000000-0000-0000-0000-000000000004') and storage_location_l3_id = '6c000000-0000-0000-0000-000000000006' and czy_glowna), 2::bigint, 'move creates both target primary links');
select is((select notatka from public.item_location where id = '8c000000-0000-0000-0000-000000000007'), 'preserve target note', 'promoted target link keeps note');
select is((select count(*) from public.item_location where id = '8c000000-0000-0000-0000-000000000008'), 1::bigint, 'outside additional link remains');
select is((select storage_location_l3_id from public.item_location where item_id = '7c000000-0000-0000-0000-000000000005' and czy_glowna), '6c000000-0000-0000-0000-000000000007'::uuid, 'additional-only Item keeps outside primary');
select is((select count(*) from public.item where id in ('7c000000-0000-0000-0000-000000000003', '7c000000-0000-0000-0000-000000000004', '7c000000-0000-0000-0000-000000000005')), 3::bigint, 'move keeps active and archived Items');
select is((select status from public.item where id = '7c000000-0000-0000-0000-000000000003'), 'w domu'::public.item_status, 'move keeps active status');
select is((select status from public.item where id = '7c000000-0000-0000-0000-000000000004'), 'archiwalne'::public.item_status, 'move keeps archived status');
select is((select count(*) from public.storage_location_l3 where id = '6c000000-0000-0000-0000-000000000005'), 0::bigint, 'move deletes source Position');
select is((select count(*) from public.storage_location_l3 where id = '6c000000-0000-0000-0000-000000000006'), 1::bigint, 'move keeps target Position');
select is((select count(*) from public.storage_location_l2 where id in ('5c000000-0000-0000-0000-000000000001', '5c000000-0000-0000-0000-000000000002')), 2::bigint, 'move keeps parent structures');

select throws_ok($$ select * from public.delete_storage_location_l3_with_resolution('6c000000-0000-0000-0000-000000000009', 'detach', null, 1, 1) $$, 'P0001', 'DELETE_FAILED', 'final delete failure rolls back detach');
select is((select count(*) from public.storage_location_l3 where id = '6c000000-0000-0000-0000-000000000009'), 1::bigint, 'rollback keeps detach source');
select is((select count(*) from public.item_location where id = '8c000000-0000-0000-0000-000000000013'), 1::bigint, 'rollback restores detached source link');
select throws_ok($$ select * from public.delete_storage_location_l3_with_resolution('6c000000-0000-0000-0000-000000000010', 'move', '6c000000-0000-0000-0000-000000000011', 1, 1) $$, 'P0001', 'DELETE_FAILED', 'final delete failure rolls back move');
select is((select count(*) from public.storage_location_l3 where id = '6c000000-0000-0000-0000-000000000010'), 1::bigint, 'rollback keeps move source');
select is((select count(*) from public.item_location where id = '8c000000-0000-0000-0000-000000000014' and czy_glowna), 1::bigint, 'rollback restores source primary link');
select is((select count(*) from public.item_location where item_id = '7c000000-0000-0000-0000-000000000008' and storage_location_l3_id = '6c000000-0000-0000-0000-000000000011'), 0::bigint, 'rollback removes target insert');

select results_eq($$ select * from public.detach_items_from_storage_location_l3('6c000000-0000-0000-0000-000000000015') $$, $$ values ('success'::text, 1::bigint, 1::bigint, 1::bigint, 0::bigint) $$, 'M4D.3 detach still works');
select is((select count(*) from public.item where id = '7c000000-0000-0000-0000-000000000010'), 1::bigint, 'M4D.3 regression keeps Item');
select results_eq($$ select * from public.move_primary_items_from_location('position', '6c000000-0000-0000-0000-000000000016', '6c000000-0000-0000-0000-000000000017') $$, $$ values ('success'::text, 1::bigint, 1::bigint, 0::bigint, 0::bigint, 1::bigint, 1::bigint) $$, 'M4D.4 move still works');
select is((select storage_location_l3_id from public.item_location where item_id = '7c000000-0000-0000-0000-000000000011' and czy_glowna), '6c000000-0000-0000-0000-000000000017'::uuid, 'M4D.4 regression assigns target');
select lives_ok($$ select public.set_item_primary_location('7c000000-0000-0000-0000-000000000012', '6c000000-0000-0000-0000-000000000018') $$, 'set_item_primary_location still works');
select is((select count(*) from public.item_location where item_id = '7c000000-0000-0000-0000-000000000012' and czy_glowna), 1::bigint, 'primary location remains singular');
select is(public.archive_item('7c000000-0000-0000-0000-000000000013'), 'success', 'archive_item still works');
select is((select status from public.item where id = '7c000000-0000-0000-0000-000000000013'), 'archiwalne'::public.item_status, 'archive regression changes status');
select is(public.restore_item('7c000000-0000-0000-0000-000000000013', null), 'success', 'restore_item still works');
select is((select status from public.item where id = '7c000000-0000-0000-0000-000000000013'), 'w domu'::public.item_status, 'restore regression restores status');
select is(public.delete_item_permanently('7c000000-0000-0000-0000-000000000014'), 'success', 'delete_item_permanently still works');
select is((select count(*) from public.item where id = '7c000000-0000-0000-0000-000000000014'), 0::bigint, 'permanent Item deletion removes Item');
select lives_ok($$ delete from public.storage_location_l2 where id = '5c000000-0000-0000-0000-000000000003' $$, 'existing empty L2 deletion remains available');
select lives_ok($$ delete from public.room where id = '4c000000-0000-0000-0000-000000000003' $$, 'existing empty Room deletion remains available');

reset role;
set local "request.jwt.claims" = '{}';

select * from finish();
rollback;
