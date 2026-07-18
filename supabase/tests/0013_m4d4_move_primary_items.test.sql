begin;

create extension if not exists pgtap with schema extensions;
set search_path = extensions, public, auth;

select plan(83);

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
  ('00000000-0000-0000-0000-000000000000', '1b000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'm4d4-admin-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1b000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'm4d4-member-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1b000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'm4d4-child-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1b000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'm4d4-guest-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1b000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'm4d4-admin-b@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1b000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'm4d4-no-profile@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1b000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'm4d4-inactive-admin@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

insert into public.household (id, nazwa, typ)
values
  ('2b000000-0000-0000-0000-000000000001', 'M4D4 Home A', 'dom'),
  ('2b000000-0000-0000-0000-000000000002', 'M4D4 Home B', 'mieszkanie');

insert into public.profile (id, household_id, imie, email, rola, status)
values
  ('1b000000-0000-0000-0000-000000000001', '2b000000-0000-0000-0000-000000000001', 'Admin A', 'm4d4-admin-a@example.test', 'admin', 'aktywny'),
  ('1b000000-0000-0000-0000-000000000002', '2b000000-0000-0000-0000-000000000001', 'Member A', 'm4d4-member-a@example.test', 'domownik', 'aktywny'),
  ('1b000000-0000-0000-0000-000000000003', '2b000000-0000-0000-0000-000000000001', 'Child A', 'm4d4-child-a@example.test', 'dziecko', 'aktywny'),
  ('1b000000-0000-0000-0000-000000000004', '2b000000-0000-0000-0000-000000000001', 'Guest A', 'm4d4-guest-a@example.test', 'gość', 'aktywny'),
  ('1b000000-0000-0000-0000-000000000005', '2b000000-0000-0000-0000-000000000002', 'Admin B', 'm4d4-admin-b@example.test', 'admin', 'aktywny'),
  ('1b000000-0000-0000-0000-000000000007', '2b000000-0000-0000-0000-000000000001', 'Inactive Admin', 'm4d4-inactive-admin@example.test', 'admin', 'nieaktywny');

insert into public.category (
  id,
  household_id,
  nazwa,
  czy_systemowa,
  widoczna_dla_dzieci
)
values
  ('3b000000-0000-0000-0000-000000000001', '2b000000-0000-0000-0000-000000000001', 'M4D4 Category A', false, true),
  ('3b000000-0000-0000-0000-000000000002', '2b000000-0000-0000-0000-000000000002', 'M4D4 Category B', false, true);

insert into public.room (id, household_id, nazwa, typ, "kolejność")
values
  ('4b000000-0000-0000-0000-000000000001', '2b000000-0000-0000-0000-000000000001', 'Position Source Room', 'Room', 1),
  ('4b000000-0000-0000-0000-000000000002', '2b000000-0000-0000-0000-000000000001', 'Position Target Room', 'Room', 2),
  ('4b000000-0000-0000-0000-000000000003', '2b000000-0000-0000-0000-000000000001', 'Storage Source Room', 'Room', 3),
  ('4b000000-0000-0000-0000-000000000004', '2b000000-0000-0000-0000-000000000001', 'Storage Target Room', 'Room', 4),
  ('4b000000-0000-0000-0000-000000000005', '2b000000-0000-0000-0000-000000000001', 'Room Source', 'Room', 5),
  ('4b000000-0000-0000-0000-000000000006', '2b000000-0000-0000-0000-000000000001', 'Room Target', 'Room', 6),
  ('4b000000-0000-0000-0000-000000000007', '2b000000-0000-0000-0000-000000000001', 'Empty Room', 'Room', 7),
  ('4b000000-0000-0000-0000-000000000008', '2b000000-0000-0000-0000-000000000001', 'Rollback Room', 'Room', 8),
  ('4b000000-0000-0000-0000-000000000009', '2b000000-0000-0000-0000-000000000002', 'Foreign Room', 'Room', 1);

insert into public.storage_location_l2 (id, room_id, nazwa, typ, "kolejność")
values
  ('5b000000-0000-0000-0000-000000000001', '4b000000-0000-0000-0000-000000000001', 'Position Source Storage', 'Shelf', 1),
  ('5b000000-0000-0000-0000-000000000002', '4b000000-0000-0000-0000-000000000002', 'Position Target Storage', 'Shelf', 1),
  ('5b000000-0000-0000-0000-000000000003', '4b000000-0000-0000-0000-000000000003', 'Storage Source', 'Shelf', 1),
  ('5b000000-0000-0000-0000-000000000004', '4b000000-0000-0000-0000-000000000003', 'Storage Outside', 'Shelf', 2),
  ('5b000000-0000-0000-0000-000000000005', '4b000000-0000-0000-0000-000000000004', 'Storage Target', 'Shelf', 1),
  ('5b000000-0000-0000-0000-000000000006', '4b000000-0000-0000-0000-000000000005', 'Room Source A', 'Shelf', 1),
  ('5b000000-0000-0000-0000-000000000007', '4b000000-0000-0000-0000-000000000005', 'Room Source B', 'Shelf', 2),
  ('5b000000-0000-0000-0000-000000000008', '4b000000-0000-0000-0000-000000000006', 'Room Target Storage', 'Shelf', 1),
  ('5b000000-0000-0000-0000-000000000009', '4b000000-0000-0000-0000-000000000007', 'Empty Storage', 'Shelf', 1),
  ('5b000000-0000-0000-0000-000000000010', '4b000000-0000-0000-0000-000000000008', 'Rollback Storage', 'Shelf', 1),
  ('5b000000-0000-0000-0000-000000000011', '4b000000-0000-0000-0000-000000000002', 'Regression Storage', 'Shelf', 2),
  ('5b000000-0000-0000-0000-000000000012', '4b000000-0000-0000-0000-000000000009', 'Foreign Storage', 'Shelf', 1);

insert into public.storage_location_l3 (
  id,
  storage_location_l2_id,
  nazwa,
  kod_lokalizacji,
  "kolejność"
)
values
  ('6b000000-0000-0000-0000-000000000001', '5b000000-0000-0000-0000-000000000001', 'Position Source', 'M4D4-P-S', 1),
  ('6b000000-0000-0000-0000-000000000002', '5b000000-0000-0000-0000-000000000001', 'Position Sibling', 'M4D4-P-X', 2),
  ('6b000000-0000-0000-0000-000000000003', '5b000000-0000-0000-0000-000000000002', 'Position Target', 'M4D4-P-T', 1),
  ('6b000000-0000-0000-0000-000000000004', '5b000000-0000-0000-0000-000000000011', 'Position Outside', 'M4D4-P-O', 1),
  ('6b000000-0000-0000-0000-000000000005', '5b000000-0000-0000-0000-000000000003', 'Storage Source A', 'M4D4-L2-A', 1),
  ('6b000000-0000-0000-0000-000000000006', '5b000000-0000-0000-0000-000000000003', 'Storage Source B', 'M4D4-L2-B', 2),
  ('6b000000-0000-0000-0000-000000000007', '5b000000-0000-0000-0000-000000000004', 'Storage Outside Position', 'M4D4-L2-O', 1),
  ('6b000000-0000-0000-0000-000000000008', '5b000000-0000-0000-0000-000000000005', 'Storage Target Position', 'M4D4-L2-T', 1),
  ('6b000000-0000-0000-0000-000000000009', '5b000000-0000-0000-0000-000000000006', 'Room Source A', 'M4D4-R-A', 1),
  ('6b000000-0000-0000-0000-000000000010', '5b000000-0000-0000-0000-000000000007', 'Room Source B', 'M4D4-R-B', 1),
  ('6b000000-0000-0000-0000-000000000011', '5b000000-0000-0000-0000-000000000008', 'Room Target Position', 'M4D4-R-T', 1),
  ('6b000000-0000-0000-0000-000000000012', '5b000000-0000-0000-0000-000000000009', 'Empty Position', 'M4D4-EMPTY', 1),
  ('6b000000-0000-0000-0000-000000000013', '5b000000-0000-0000-0000-000000000010', 'Rollback Source', 'M4D4-RB-S', 1),
  ('6b000000-0000-0000-0000-000000000014', '5b000000-0000-0000-0000-000000000010', 'Rollback Target', 'M4D4-RB-T', 2),
  ('6b000000-0000-0000-0000-000000000015', '5b000000-0000-0000-0000-000000000012', 'Foreign Position', 'M4D4-FOREIGN', 1),
  ('6b000000-0000-0000-0000-000000000016', '5b000000-0000-0000-0000-000000000011', 'Regression Position', 'M4D4-REG', 2);

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
  ('7b000000-0000-0000-0000-000000000001', '2b000000-0000-0000-0000-000000000001', '3b000000-0000-0000-0000-000000000001', 'Position Active Reused', 'Keep position description', 'zapas', 4, 'w domu', null, null, '1b000000-0000-0000-0000-000000000001', '2026-01-01 10:00:00+00', '2026-01-02 10:00:00+00'),
  ('7b000000-0000-0000-0000-000000000002', '2b000000-0000-0000-0000-000000000001', '3b000000-0000-0000-0000-000000000001', 'Position Archived Created', null, 'unikalny', 1, 'archiwalne', '2026-02-01 10:00:00+00', 'pożyczone', '1b000000-0000-0000-0000-000000000001', '2026-01-03 10:00:00+00', '2026-01-04 10:00:00+00'),
  ('7b000000-0000-0000-0000-000000000003', '2b000000-0000-0000-0000-000000000001', '3b000000-0000-0000-0000-000000000001', 'Position Additional Only', null, 'unikalny', 1, 'w domu', null, null, '1b000000-0000-0000-0000-000000000001', now(), now()),
  ('7b000000-0000-0000-0000-000000000004', '2b000000-0000-0000-0000-000000000001', '3b000000-0000-0000-0000-000000000001', 'Storage Active Created', null, 'unikalny', 1, 'w domu', null, null, '1b000000-0000-0000-0000-000000000001', now(), now()),
  ('7b000000-0000-0000-0000-000000000005', '2b000000-0000-0000-0000-000000000001', '3b000000-0000-0000-0000-000000000001', 'Storage Archived Reused', null, 'unikalny', 1, 'archiwalne', '2026-02-02 10:00:00+00', 'w domu', '1b000000-0000-0000-0000-000000000001', now(), now()),
  ('7b000000-0000-0000-0000-000000000006', '2b000000-0000-0000-0000-000000000001', '3b000000-0000-0000-0000-000000000001', 'Storage Additional Only', null, 'unikalny', 1, 'w domu', null, null, '1b000000-0000-0000-0000-000000000001', now(), now()),
  ('7b000000-0000-0000-0000-000000000007', '2b000000-0000-0000-0000-000000000001', '3b000000-0000-0000-0000-000000000001', 'Room Active Created', null, 'unikalny', 1, 'w domu', null, null, '1b000000-0000-0000-0000-000000000001', now(), now()),
  ('7b000000-0000-0000-0000-000000000008', '2b000000-0000-0000-0000-000000000001', '3b000000-0000-0000-0000-000000000001', 'Room Archived Reused', null, 'unikalny', 1, 'archiwalne', '2026-02-03 10:00:00+00', 'zużyte', '1b000000-0000-0000-0000-000000000001', now(), now()),
  ('7b000000-0000-0000-0000-000000000009', '2b000000-0000-0000-0000-000000000001', '3b000000-0000-0000-0000-000000000001', 'Room Additional Only', null, 'unikalny', 1, 'w domu', null, null, '1b000000-0000-0000-0000-000000000001', now(), now()),
  ('7b000000-0000-0000-0000-000000000010', '2b000000-0000-0000-0000-000000000001', '3b000000-0000-0000-0000-000000000001', 'Rollback Item', null, 'unikalny', 1, 'w domu', null, null, '1b000000-0000-0000-0000-000000000001', now(), now()),
  ('7b000000-0000-0000-0000-000000000011', '2b000000-0000-0000-0000-000000000001', '3b000000-0000-0000-0000-000000000001', 'Detach Regression', null, 'unikalny', 1, 'w domu', null, null, '1b000000-0000-0000-0000-000000000001', now(), now()),
  ('7b000000-0000-0000-0000-000000000012', '2b000000-0000-0000-0000-000000000001', '3b000000-0000-0000-0000-000000000001', 'Primary Location Regression', null, 'unikalny', 1, 'w domu', null, null, '1b000000-0000-0000-0000-000000000001', now(), now()),
  ('7b000000-0000-0000-0000-000000000013', '2b000000-0000-0000-0000-000000000001', '3b000000-0000-0000-0000-000000000001', 'Lifecycle Regression', null, 'unikalny', 1, 'pożyczone', null, null, '1b000000-0000-0000-0000-000000000001', now(), now()),
  ('7b000000-0000-0000-0000-000000000014', '2b000000-0000-0000-0000-000000000001', '3b000000-0000-0000-0000-000000000001', 'Permanent Delete Regression', null, 'unikalny', 1, 'w domu', null, null, '1b000000-0000-0000-0000-000000000001', now(), now()),
  ('7b000000-0000-0000-0000-000000000015', '2b000000-0000-0000-0000-000000000002', '3b000000-0000-0000-0000-000000000002', 'Foreign Item', null, 'unikalny', 1, 'w domu', null, null, '1b000000-0000-0000-0000-000000000005', now(), now());

insert into public.item_location (
  id,
  item_id,
  storage_location_l3_id,
  czy_glowna,
  notatka
)
values
  ('8b000000-0000-0000-0000-000000000001', '7b000000-0000-0000-0000-000000000001', '6b000000-0000-0000-0000-000000000001', true, null),
  ('8b000000-0000-0000-0000-000000000002', '7b000000-0000-0000-0000-000000000001', '6b000000-0000-0000-0000-000000000001', false, 'keep source additional'),
  ('8b000000-0000-0000-0000-000000000003', '7b000000-0000-0000-0000-000000000001', '6b000000-0000-0000-0000-000000000003', false, 'preserve target note'),
  ('8b000000-0000-0000-0000-000000000004', '7b000000-0000-0000-0000-000000000001', '6b000000-0000-0000-0000-000000000004', false, 'keep outside additional'),
  ('8b000000-0000-0000-0000-000000000005', '7b000000-0000-0000-0000-000000000002', '6b000000-0000-0000-0000-000000000001', true, null),
  ('8b000000-0000-0000-0000-000000000006', '7b000000-0000-0000-0000-000000000002', '6b000000-0000-0000-0000-000000000001', false, 'keep archived additional'),
  ('8b000000-0000-0000-0000-000000000007', '7b000000-0000-0000-0000-000000000003', '6b000000-0000-0000-0000-000000000004', true, null),
  ('8b000000-0000-0000-0000-000000000008', '7b000000-0000-0000-0000-000000000003', '6b000000-0000-0000-0000-000000000001', false, 'additional only in source'),
  ('8b000000-0000-0000-0000-000000000009', '7b000000-0000-0000-0000-000000000004', '6b000000-0000-0000-0000-000000000005', true, null),
  ('8b000000-0000-0000-0000-000000000010', '7b000000-0000-0000-0000-000000000004', '6b000000-0000-0000-0000-000000000006', false, 'keep storage additional'),
  ('8b000000-0000-0000-0000-000000000011', '7b000000-0000-0000-0000-000000000005', '6b000000-0000-0000-0000-000000000006', true, null),
  ('8b000000-0000-0000-0000-000000000012', '7b000000-0000-0000-0000-000000000005', '6b000000-0000-0000-0000-000000000008', false, 'storage reused note'),
  ('8b000000-0000-0000-0000-000000000013', '7b000000-0000-0000-0000-000000000006', '6b000000-0000-0000-0000-000000000007', true, null),
  ('8b000000-0000-0000-0000-000000000014', '7b000000-0000-0000-0000-000000000006', '6b000000-0000-0000-0000-000000000005', false, 'storage additional only'),
  ('8b000000-0000-0000-0000-000000000015', '7b000000-0000-0000-0000-000000000007', '6b000000-0000-0000-0000-000000000009', true, null),
  ('8b000000-0000-0000-0000-000000000016', '7b000000-0000-0000-0000-000000000007', '6b000000-0000-0000-0000-000000000010', false, 'keep room additional'),
  ('8b000000-0000-0000-0000-000000000017', '7b000000-0000-0000-0000-000000000008', '6b000000-0000-0000-0000-000000000010', true, null),
  ('8b000000-0000-0000-0000-000000000018', '7b000000-0000-0000-0000-000000000008', '6b000000-0000-0000-0000-000000000011', false, 'room reused note'),
  ('8b000000-0000-0000-0000-000000000019', '7b000000-0000-0000-0000-000000000009', '6b000000-0000-0000-0000-000000000011', true, null),
  ('8b000000-0000-0000-0000-000000000020', '7b000000-0000-0000-0000-000000000009', '6b000000-0000-0000-0000-000000000009', false, 'room additional only'),
  ('8b000000-0000-0000-0000-000000000021', '7b000000-0000-0000-0000-000000000010', '6b000000-0000-0000-0000-000000000013', true, null),
  ('8b000000-0000-0000-0000-000000000022', '7b000000-0000-0000-0000-000000000010', '6b000000-0000-0000-0000-000000000014', false, 'force_move_failure'),
  ('8b000000-0000-0000-0000-000000000023', '7b000000-0000-0000-0000-000000000011', '6b000000-0000-0000-0000-000000000016', true, null),
  ('8b000000-0000-0000-0000-000000000024', '7b000000-0000-0000-0000-000000000015', '6b000000-0000-0000-0000-000000000015', true, null);

create function public.m4d4_force_move_failure()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.notatka = 'force_move_failure' and new.czy_glowna then
    raise exception 'forced test failure';
  end if;

  return new;
end;
$$;

create trigger m4d4_force_move_failure
before update of czy_glowna on public.item_location
for each row execute function public.m4d4_force_move_failure();

select is(
  (
    select count(*)
    from pg_proc
    where pronamespace = 'public'::regnamespace
      and proname = 'move_primary_items_from_location'
  ),
  1::bigint,
  'M4D.4 exposes exactly one move RPC'
);
select is((select not p.prosecdef from pg_proc as p where p.oid = 'public.move_primary_items_from_location(text,uuid,uuid)'::regprocedure), true, 'move RPC is security invoker');
select ok(not has_function_privilege('public', 'public.move_primary_items_from_location(text,uuid,uuid)'::regprocedure, 'EXECUTE'), 'PUBLIC cannot execute move RPC');
select ok(not has_function_privilege('anon', 'public.move_primary_items_from_location(text,uuid,uuid)'::regprocedure, 'EXECUTE'), 'anon cannot execute move RPC');
select ok(has_function_privilege('authenticated', 'public.move_primary_items_from_location(text,uuid,uuid)'::regprocedure, 'EXECUTE'), 'authenticated can execute move RPC');

set local role authenticated;
set local "request.jwt.claims" = '{}';
select throws_ok($$ select * from public.move_primary_items_from_location('position', '6b000000-0000-0000-0000-000000000012', '6b000000-0000-0000-0000-000000000003') $$, 'P0001', 'AUTH_REQUIRED', 'move requires a session');

set local "request.jwt.claims" =
  '{"sub":"1b000000-0000-0000-0000-000000000006","role":"authenticated"}';
select throws_ok($$ select * from public.move_primary_items_from_location('position', '6b000000-0000-0000-0000-000000000012', '6b000000-0000-0000-0000-000000000003') $$, 'P0001', 'ACTIVE_PROFILE_REQUIRED', 'move requires an active profile');

set local "request.jwt.claims" =
  '{"sub":"1b000000-0000-0000-0000-000000000007","role":"authenticated"}';
select throws_ok($$ select * from public.move_primary_items_from_location('position', '6b000000-0000-0000-0000-000000000012', '6b000000-0000-0000-0000-000000000003') $$, 'P0001', 'ACTIVE_PROFILE_REQUIRED', 'inactive administrator cannot move locations');

set local "request.jwt.claims" =
  '{"sub":"1b000000-0000-0000-0000-000000000002","role":"authenticated"}';
select throws_ok($$ select * from public.move_primary_items_from_location('position', '6b000000-0000-0000-0000-000000000012', '6b000000-0000-0000-0000-000000000003') $$, 'P0001', 'ADMIN_REQUIRED', 'household member cannot move locations');

set local "request.jwt.claims" =
  '{"sub":"1b000000-0000-0000-0000-000000000003","role":"authenticated"}';
select throws_ok($$ select * from public.move_primary_items_from_location('position', '6b000000-0000-0000-0000-000000000012', '6b000000-0000-0000-0000-000000000003') $$, 'P0001', 'ADMIN_REQUIRED', 'child cannot move locations');

set local "request.jwt.claims" =
  '{"sub":"1b000000-0000-0000-0000-000000000004","role":"authenticated"}';
select throws_ok($$ select * from public.move_primary_items_from_location('position', '6b000000-0000-0000-0000-000000000012', '6b000000-0000-0000-0000-000000000003') $$, 'P0001', 'ADMIN_REQUIRED', 'guest cannot move locations');

set local "request.jwt.claims" =
  '{"sub":"1b000000-0000-0000-0000-000000000005","role":"authenticated"}';
select throws_ok($$ select * from public.move_primary_items_from_location('position', '6b000000-0000-0000-0000-000000000001', '6b000000-0000-0000-0000-000000000015') $$, 'P0001', 'SOURCE_NOT_AVAILABLE', 'administrator of another household cannot resolve the source');

set local "request.jwt.claims" =
  '{"sub":"1b000000-0000-0000-0000-000000000001","role":"authenticated"}';
select throws_ok($$ select * from public.move_primary_items_from_location('table', '6b000000-0000-0000-0000-000000000012', '6b000000-0000-0000-0000-000000000003') $$, 'P0001', 'INVALID_SOURCE_TYPE', 'unknown source type is rejected');
select throws_ok($$ select * from public.move_primary_items_from_location(null, '6b000000-0000-0000-0000-000000000012', '6b000000-0000-0000-0000-000000000003') $$, 'P0001', 'INVALID_SOURCE_TYPE', 'null source type is rejected safely');
select throws_ok($$ select * from public.move_primary_items_from_location('position', '6b000000-0000-0000-0000-000000000015', '6b000000-0000-0000-0000-000000000003') $$, 'P0001', 'SOURCE_NOT_AVAILABLE', 'foreign source is unavailable');
select throws_ok($$ select * from public.move_primary_items_from_location('position', '6b000000-0000-0000-0000-000000000099', '6b000000-0000-0000-0000-000000000003') $$, 'P0001', 'SOURCE_NOT_AVAILABLE', 'missing source has the same result');
select throws_ok($$ select * from public.move_primary_items_from_location('position', '6b000000-0000-0000-0000-000000000012', '6b000000-0000-0000-0000-000000000015') $$, 'P0001', 'TARGET_NOT_AVAILABLE', 'foreign target is unavailable');
select throws_ok($$ select * from public.move_primary_items_from_location('position', '6b000000-0000-0000-0000-000000000012', '6b000000-0000-0000-0000-000000000099') $$, 'P0001', 'TARGET_NOT_AVAILABLE', 'missing target has the same result');
select throws_ok($$ select * from public.move_primary_items_from_location('room', '4b000000-0000-0000-0000-000000000005', '6b000000-0000-0000-0000-000000000009') $$, 'P0001', 'TARGET_INSIDE_SOURCE', 'Room target cannot be inside source subtree');
select throws_ok($$ select * from public.move_primary_items_from_location('storage', '5b000000-0000-0000-0000-000000000003', '6b000000-0000-0000-0000-000000000005') $$, 'P0001', 'TARGET_INSIDE_SOURCE', 'L2 target cannot be inside source subtree');
select throws_ok($$ select * from public.move_primary_items_from_location('position', '6b000000-0000-0000-0000-000000000001', '6b000000-0000-0000-0000-000000000001') $$, 'P0001', 'TARGET_INSIDE_SOURCE', 'L3 target cannot equal source');

select throws_ok($$ select * from public.move_primary_items_from_location('position', '6b000000-0000-0000-0000-000000000013', '6b000000-0000-0000-0000-000000000014') $$, 'P0001', 'MOVE_FAILED', 'forced promotion error maps to safe move failure');
select is((select count(*) from public.item_location where id = '8b000000-0000-0000-0000-000000000021' and czy_glowna), 1::bigint, 'rollback restores source primary link');
select is((select count(*) from public.item_location where id = '8b000000-0000-0000-0000-000000000022' and not czy_glowna), 1::bigint, 'rollback restores target additional link');
select is((select notatka from public.item_location where id = '8b000000-0000-0000-0000-000000000022'), 'force_move_failure', 'rollback preserves target note');
select is((select count(*) from public.item_location where item_id = '7b000000-0000-0000-0000-000000000010' and czy_glowna), 1::bigint, 'rollback leaves exactly one primary link');

reset role;
drop trigger m4d4_force_move_failure on public.item_location;
drop function public.m4d4_force_move_failure();
set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"1b000000-0000-0000-0000-000000000001","role":"authenticated"}';

select results_eq(
  $$ select * from public.move_primary_items_from_location('position', '6b000000-0000-0000-0000-000000000001', '6b000000-0000-0000-0000-000000000003') $$,
  $$ values ('success'::text, 2::bigint, 1::bigint, 1::bigint, 1::bigint, 1::bigint, 2::bigint) $$,
  'Position move returns exact active, archived, reused, created, and removed counts'
);
select is((select count(*) from public.item_location where storage_location_l3_id = '6b000000-0000-0000-0000-000000000001' and czy_glowna), 0::bigint, 'Position source has no primary links after move');
select is((select count(*) from public.item_location where item_id = '7b000000-0000-0000-0000-000000000001' and storage_location_l3_id = '6b000000-0000-0000-0000-000000000003' and czy_glowna), 1::bigint, 'existing target link is promoted for active Item');
select is((select count(*) from public.item_location where item_id = '7b000000-0000-0000-0000-000000000002' and storage_location_l3_id = '6b000000-0000-0000-0000-000000000003' and czy_glowna), 1::bigint, 'new target primary link is created for archived Item');
select is((select count(*) from public.item_location where item_id = '7b000000-0000-0000-0000-000000000001' and storage_location_l3_id = '6b000000-0000-0000-0000-000000000003'), 1::bigint, 'target reuse does not create a duplicate');
select is((select notatka from public.item_location where id = '8b000000-0000-0000-0000-000000000003'), 'preserve target note', 'promoted target link keeps its note');
select is((select count(*) from public.item_location where id = '8b000000-0000-0000-0000-000000000002'), 1::bigint, 'source additional link remains');
select is((select count(*) from public.item_location where id = '8b000000-0000-0000-0000-000000000004'), 1::bigint, 'outside additional link remains');
select is((select count(*) from public.item_location where id = '8b000000-0000-0000-0000-000000000006'), 1::bigint, 'archived source additional link remains');
select is((select storage_location_l3_id from public.item_location where item_id = '7b000000-0000-0000-0000-000000000003' and czy_glowna), '6b000000-0000-0000-0000-000000000004'::uuid, 'Item with only an additional source link keeps external primary');
select is((select count(*) from public.item_location where id = '8b000000-0000-0000-0000-000000000008'), 1::bigint, 'additional-only source link remains');
select is((select count(*) from public.item_location where item_id = '7b000000-0000-0000-0000-000000000001' and czy_glowna), 1::bigint, 'active Item has exactly one primary link');
select is((select count(*) from public.item_location where item_id = '7b000000-0000-0000-0000-000000000002' and czy_glowna), 1::bigint, 'archived Item has exactly one primary link');
select is((select status from public.item where id = '7b000000-0000-0000-0000-000000000001'), 'w domu'::public.item_status, 'active Item status remains unchanged');
select is((select status from public.item where id = '7b000000-0000-0000-0000-000000000002'), 'archiwalne'::public.item_status, 'archived Item status remains unchanged');
select is((select archived_at from public.item where id = '7b000000-0000-0000-0000-000000000002'), '2026-02-01 10:00:00+00'::timestamptz, 'archived_at remains unchanged');
select is((select status_before_archive from public.item where id = '7b000000-0000-0000-0000-000000000002'), 'pożyczone'::public.item_status, 'status_before_archive remains unchanged');
select is((select category_id from public.item where id = '7b000000-0000-0000-0000-000000000001'), '3b000000-0000-0000-0000-000000000001'::uuid, 'category remains unchanged');
select is((select nazwa from public.item where id = '7b000000-0000-0000-0000-000000000001'), 'Position Active Reused', 'Item name remains unchanged');
select is((select opis from public.item where id = '7b000000-0000-0000-0000-000000000001'), 'Keep position description', 'Item description remains unchanged');
select is((select ilosc from public.item where id = '7b000000-0000-0000-0000-000000000001'), 4::numeric, 'Item quantity remains unchanged');
select is((select updated_at from public.item where id = '7b000000-0000-0000-0000-000000000001'), '2026-01-02 10:00:00+00'::timestamptz, 'Item updated_at remains unchanged');
select is((select count(*) from public.storage_location_l3 where id in ('6b000000-0000-0000-0000-000000000001', '6b000000-0000-0000-0000-000000000003')), 2::bigint, 'Position source and target structure remain');

select results_eq(
  $$ select * from public.move_primary_items_from_location('position', '6b000000-0000-0000-0000-000000000001', '6b000000-0000-0000-0000-000000000003') $$,
  $$ values ('success'::text, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint) $$,
  'repeated Position move is idempotent'
);

select results_eq(
  $$ select * from public.move_primary_items_from_location('storage', '5b000000-0000-0000-0000-000000000003', '6b000000-0000-0000-0000-000000000008') $$,
  $$ values ('success'::text, 2::bigint, 1::bigint, 1::bigint, 1::bigint, 1::bigint, 2::bigint) $$,
  'L2 move handles primary links from multiple positions'
);
select is((select count(*) from public.item_location where storage_location_l3_id in ('6b000000-0000-0000-0000-000000000005', '6b000000-0000-0000-0000-000000000006') and czy_glowna), 0::bigint, 'L2 source positions have no primary links');
select is((select count(*) from public.item_location where item_id in ('7b000000-0000-0000-0000-000000000004', '7b000000-0000-0000-0000-000000000005') and storage_location_l3_id = '6b000000-0000-0000-0000-000000000008' and czy_glowna), 2::bigint, 'both L2 Items receive target primary links');
select is((select count(*) from public.item_location where id = '8b000000-0000-0000-0000-000000000010'), 1::bigint, 'L2 source additional link remains');
select is((select notatka from public.item_location where id = '8b000000-0000-0000-0000-000000000012'), 'storage reused note', 'L2 reused target note remains');
select is((select storage_location_l3_id from public.item_location where item_id = '7b000000-0000-0000-0000-000000000006' and czy_glowna), '6b000000-0000-0000-0000-000000000007'::uuid, 'primary link in another L2 remains');
select is((select count(*) from public.item_location where id = '8b000000-0000-0000-0000-000000000014'), 1::bigint, 'additional-only link inside L2 source remains');
select is((select count(*) from public.storage_location_l2 where id = '5b000000-0000-0000-0000-000000000003'), 1::bigint, 'L2 source remains');
select is((select count(*) from public.storage_location_l3 where storage_location_l2_id = '5b000000-0000-0000-0000-000000000003'), 2::bigint, 'all L2 source positions remain');

select results_eq(
  $$ select * from public.move_primary_items_from_location('room', '4b000000-0000-0000-0000-000000000005', '6b000000-0000-0000-0000-000000000011') $$,
  $$ values ('success'::text, 2::bigint, 1::bigint, 1::bigint, 1::bigint, 1::bigint, 2::bigint) $$,
  'Room move handles primary links across multiple L2 and L3 records'
);
select is((select count(*) from public.item_location where storage_location_l3_id in ('6b000000-0000-0000-0000-000000000009', '6b000000-0000-0000-0000-000000000010') and czy_glowna), 0::bigint, 'Room source subtree has no primary links');
select is((select count(*) from public.item_location where item_id in ('7b000000-0000-0000-0000-000000000007', '7b000000-0000-0000-0000-000000000008') and storage_location_l3_id = '6b000000-0000-0000-0000-000000000011' and czy_glowna), 2::bigint, 'both Room Items receive target primary links');
select is((select count(*) from public.item_location where id = '8b000000-0000-0000-0000-000000000016'), 1::bigint, 'Room source additional link remains');
select is((select notatka from public.item_location where id = '8b000000-0000-0000-0000-000000000018'), 'room reused note', 'Room reused target note remains');
select is((select storage_location_l3_id from public.item_location where item_id = '7b000000-0000-0000-0000-000000000009' and czy_glowna), '6b000000-0000-0000-0000-000000000011'::uuid, 'primary link outside Room source remains');
select is((select count(*) from public.item_location where id = '8b000000-0000-0000-0000-000000000020'), 1::bigint, 'additional-only link inside Room source remains');
select is((select count(*) from public.room where id = '4b000000-0000-0000-0000-000000000005'), 1::bigint, 'Room source remains');
select is((select count(*) from public.storage_location_l2 where room_id = '4b000000-0000-0000-0000-000000000005'), 2::bigint, 'Room source L2 records remain');
select is((select count(*) from public.storage_location_l3 where storage_location_l2_id in ('5b000000-0000-0000-0000-000000000006', '5b000000-0000-0000-0000-000000000007')), 2::bigint, 'Room source L3 records remain');

select results_eq(
  $$ select * from public.move_primary_items_from_location('position', '6b000000-0000-0000-0000-000000000012', '6b000000-0000-0000-0000-000000000003') $$,
  $$ values ('success'::text, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::bigint) $$,
  'empty existing source succeeds with zero counts'
);

select is((select primary_location_links_count from public.get_storage_location_l3_dependency_summary('6b000000-0000-0000-0000-000000000001')), 0::bigint, 'M4D.2 summary reflects moved primary links');
select is((select non_primary_location_links_count from public.get_storage_location_l3_dependency_summary('6b000000-0000-0000-0000-000000000001')), 3::bigint, 'M4D.2 summary still counts preserved additional links');

select results_eq(
  $$ select * from public.detach_items_from_storage_location_l3('6b000000-0000-0000-0000-000000000016') $$,
  $$ values ('success'::text, 1::bigint, 1::bigint, 1::bigint, 0::bigint) $$,
  'M4D.3 detach still works after M4D.4 migration'
);
select is((select count(*) from public.item where id = '7b000000-0000-0000-0000-000000000011'), 1::bigint, 'M4D.3 regression keeps Item');

select lives_ok(
  $$ select public.set_item_primary_location('7b000000-0000-0000-0000-000000000012', '6b000000-0000-0000-0000-000000000003') $$,
  'set_item_primary_location still assigns a primary link'
);
select is((select count(*) from public.item_location where item_id = '7b000000-0000-0000-0000-000000000012' and czy_glowna), 1::bigint, 'primary location regression keeps one primary link');

select is(public.archive_item('7b000000-0000-0000-0000-000000000013'), 'success', 'archive_item still works');
select is((select status from public.item where id = '7b000000-0000-0000-0000-000000000013'), 'archiwalne'::public.item_status, 'archive regression changes status');
select is(public.restore_item('7b000000-0000-0000-0000-000000000013', null), 'success', 'restore_item still works');
select is((select status from public.item where id = '7b000000-0000-0000-0000-000000000013'), 'pożyczone'::public.item_status, 'restore regression restores previous status');

select is(public.delete_item_permanently('7b000000-0000-0000-0000-000000000014'), 'success', 'permanent item deletion still works');
select is((select count(*) from public.item where id = '7b000000-0000-0000-0000-000000000014'), 0::bigint, 'permanent deletion regression removes Item');

select throws_ok(
  $$ delete from public.storage_location_l3 where id = '6b000000-0000-0000-0000-000000000004' $$,
  '23503',
  null,
  'existing location foreign key blocker remains unchanged'
);

reset role;
set local "request.jwt.claims" = '{}';

select * from finish();
rollback;
