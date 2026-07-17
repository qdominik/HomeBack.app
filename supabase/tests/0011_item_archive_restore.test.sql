begin;

create extension if not exists pgtap with schema extensions;
set search_path = extensions, public, auth;

select plan(61);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  ('00000000-0000-0000-0000-000000000000', '19000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'restore-admin-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '19000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'restore-member-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '19000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'restore-child-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '19000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'restore-guest-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '19000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'restore-admin-b@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '19000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'restore-no-profile@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '19000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'restore-inactive@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

insert into public.household (id, nazwa, typ)
values
  ('29000000-0000-0000-0000-000000000001', 'Restore Home A', 'dom'),
  ('29000000-0000-0000-0000-000000000002', 'Restore Home B', 'mieszkanie');

insert into public.profile (id, household_id, imie, email, rola, status)
values
  ('19000000-0000-0000-0000-000000000001', '29000000-0000-0000-0000-000000000001', 'Admin A', 'restore-admin-a@example.test', 'admin', 'aktywny'),
  ('19000000-0000-0000-0000-000000000002', '29000000-0000-0000-0000-000000000001', 'Member A', 'restore-member-a@example.test', 'domownik', 'aktywny'),
  ('19000000-0000-0000-0000-000000000003', '29000000-0000-0000-0000-000000000001', 'Child A', 'restore-child-a@example.test', 'dziecko', 'aktywny'),
  ('19000000-0000-0000-0000-000000000004', '29000000-0000-0000-0000-000000000001', 'Guest A', 'restore-guest-a@example.test', 'gość', 'aktywny'),
  ('19000000-0000-0000-0000-000000000005', '29000000-0000-0000-0000-000000000002', 'Admin B', 'restore-admin-b@example.test', 'admin', 'aktywny'),
  ('19000000-0000-0000-0000-000000000007', '29000000-0000-0000-0000-000000000001', 'Inactive Admin', 'restore-inactive@example.test', 'admin', 'nieaktywny');

insert into public.category (
  id, household_id, nazwa, czy_systemowa, widoczna_dla_dzieci
)
values
  ('39000000-0000-0000-0000-000000000001', '29000000-0000-0000-0000-000000000001', 'Restore Category A', false, true),
  ('39000000-0000-0000-0000-000000000002', '29000000-0000-0000-0000-000000000002', 'Restore Category B', false, true);

insert into public.room (id, household_id, nazwa, typ, "kolejność")
values ('49000000-0000-0000-0000-000000000001', '29000000-0000-0000-0000-000000000001', 'Restore Room', 'Room', 1);

insert into public.storage_location_l2 (id, room_id, nazwa, typ, "kolejność")
values ('59000000-0000-0000-0000-000000000001', '49000000-0000-0000-0000-000000000001', 'Restore Storage', 'Shelf', 1);

insert into public.storage_location_l3 (
  id, storage_location_l2_id, nazwa, kod_lokalizacji, "kolejność"
)
values ('69000000-0000-0000-0000-000000000001', '59000000-0000-0000-0000-000000000001', 'Restore Position', 'RESTORE-A1', 1);

insert into public.item (
  id, household_id, category_id, nazwa, typ, ilosc, status,
  archived_at, status_before_archive, created_by_id
)
values
  ('79000000-0000-0000-0000-000000000001', '29000000-0000-0000-0000-000000000001', '39000000-0000-0000-0000-000000000001', 'Home Item', 'unikalny', 1, 'w domu', null, null, '19000000-0000-0000-0000-000000000001'),
  ('79000000-0000-0000-0000-000000000002', '29000000-0000-0000-0000-000000000001', '39000000-0000-0000-0000-000000000001', 'Borrowed Item', 'unikalny', 1, 'pożyczone', null, null, '19000000-0000-0000-0000-000000000001'),
  ('79000000-0000-0000-0000-000000000003', '29000000-0000-0000-0000-000000000001', '39000000-0000-0000-0000-000000000001', 'Consumed Item', 'unikalny', 1, 'zużyte', null, null, '19000000-0000-0000-0000-000000000001'),
  ('79000000-0000-0000-0000-000000000004', '29000000-0000-0000-0000-000000000001', '39000000-0000-0000-0000-000000000001', 'Legacy Archived', 'unikalny', 1, 'archiwalne', now(), null, '19000000-0000-0000-0000-000000000001'),
  ('79000000-0000-0000-0000-000000000005', '29000000-0000-0000-0000-000000000001', '39000000-0000-0000-0000-000000000001', 'Already Archived', 'unikalny', 1, 'archiwalne', now(), 'w domu', '19000000-0000-0000-0000-000000000001'),
  ('79000000-0000-0000-0000-000000000006', '29000000-0000-0000-0000-000000000001', '39000000-0000-0000-0000-000000000001', 'Active Restore Attempt', 'unikalny', 1, 'w domu', null, null, '19000000-0000-0000-0000-000000000001'),
  ('79000000-0000-0000-0000-000000000007', '29000000-0000-0000-0000-000000000002', '39000000-0000-0000-0000-000000000002', 'Foreign Active', 'unikalny', 1, 'w domu', null, null, '19000000-0000-0000-0000-000000000005'),
  ('79000000-0000-0000-0000-000000000008', '29000000-0000-0000-0000-000000000002', '39000000-0000-0000-0000-000000000002', 'Foreign Archived', 'unikalny', 1, 'archiwalne', now(), 'w domu', '19000000-0000-0000-0000-000000000005'),
  ('79000000-0000-0000-0000-000000000009', '29000000-0000-0000-0000-000000000001', '39000000-0000-0000-0000-000000000001', 'Atomic Archive', 'unikalny', 1, 'w domu', null, null, '19000000-0000-0000-0000-000000000001'),
  ('79000000-0000-0000-0000-000000000010', '29000000-0000-0000-0000-000000000001', '39000000-0000-0000-0000-000000000001', 'Atomic Restore', 'unikalny', 1, 'archiwalne', now(), 'w domu', '19000000-0000-0000-0000-000000000001'),
  ('79000000-0000-0000-0000-000000000011', '29000000-0000-0000-0000-000000000001', '39000000-0000-0000-0000-000000000001', 'Unrelated Item', 'unikalny', 1, 'w domu', null, null, '19000000-0000-0000-0000-000000000001');

insert into public.item_location (
  id, item_id, storage_location_l3_id, czy_glowna
)
values
  ('89000000-0000-0000-0000-000000000001', '79000000-0000-0000-0000-000000000001', '69000000-0000-0000-0000-000000000001', true),
  ('89000000-0000-0000-0000-000000000002', '79000000-0000-0000-0000-000000000011', '69000000-0000-0000-0000-000000000001', true);

create function public.test_block_item_archive_restore()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.id = '79000000-0000-0000-0000-000000000009'::uuid
     and new.status = 'archiwalne' then
    raise exception 'TEST_ARCHIVE_BLOCKED';
  end if;

  if old.id = '79000000-0000-0000-0000-000000000010'::uuid
     and old.status = 'archiwalne'
     and new.status <> 'archiwalne' then
    raise exception 'TEST_RESTORE_BLOCKED';
  end if;

  return new;
end;
$$;

create trigger test_block_item_archive_restore
before update on public.item
for each row execute function public.test_block_item_archive_restore();

select has_column('public', 'item', 'archived_at', 'item has archived_at');
select has_column('public', 'item', 'status_before_archive', 'item has status_before_archive');
select col_type_is('public', 'item', 'archived_at', 'timestamp with time zone', 'archived_at is timestamptz');
select col_type_is('public', 'item', 'status_before_archive', 'item_status', 'status_before_archive uses item_status');
select throws_ok(
  $$
    insert into public.item (
      household_id, category_id, nazwa, typ, status,
      status_before_archive, created_by_id
    ) values (
      '29000000-0000-0000-0000-000000000001',
      '39000000-0000-0000-0000-000000000001',
      'Invalid Previous Status', 'unikalny', 'archiwalne', 'archiwalne',
      '19000000-0000-0000-0000-000000000001'
    )
  $$,
  '23514',
  null,
  'status_before_archive rejects archived'
);

select is((select not p.prosecdef from pg_proc as p where p.oid = 'public.archive_item(uuid)'::regprocedure), true, 'archive is security invoker');
select is((select not p.prosecdef from pg_proc as p where p.oid = 'public.restore_item(uuid,public.item_status)'::regprocedure), true, 'restore is security invoker');
select ok(not has_function_privilege('public', 'public.archive_item(uuid)'::regprocedure, 'EXECUTE'), 'PUBLIC cannot archive');
select ok(not has_function_privilege('anon', 'public.archive_item(uuid)'::regprocedure, 'EXECUTE'), 'anon cannot archive');
select ok(has_function_privilege('authenticated', 'public.archive_item(uuid)'::regprocedure, 'EXECUTE'), 'authenticated can call guarded archive');
select ok(not has_function_privilege('public', 'public.restore_item(uuid,public.item_status)'::regprocedure, 'EXECUTE'), 'PUBLIC cannot restore');
select ok(not has_function_privilege('anon', 'public.restore_item(uuid,public.item_status)'::regprocedure, 'EXECUTE'), 'anon cannot restore');
select ok(has_function_privilege('authenticated', 'public.restore_item(uuid,public.item_status)'::regprocedure, 'EXECUTE'), 'authenticated can call guarded restore');

set local role authenticated;
set local "request.jwt.claims" = '{}';
select is(public.archive_item('79000000-0000-0000-0000-000000000006'), 'auth_required', 'archive requires a session');
select is(public.restore_item('79000000-0000-0000-0000-000000000005'), 'auth_required', 'restore requires a session');

set local "request.jwt.claims" = '{"sub":"19000000-0000-0000-0000-000000000006","role":"authenticated"}';
select is(public.archive_item('79000000-0000-0000-0000-000000000006'), 'active_profile_required', 'archive requires active profile');
select is(public.restore_item('79000000-0000-0000-0000-000000000005'), 'active_profile_required', 'restore requires active profile');

set local "request.jwt.claims" = '{"sub":"19000000-0000-0000-0000-000000000007","role":"authenticated"}';
select is(public.archive_item('79000000-0000-0000-0000-000000000006'), 'active_profile_required', 'inactive admin cannot archive');
select is(public.restore_item('79000000-0000-0000-0000-000000000005'), 'active_profile_required', 'inactive admin cannot restore');

set local "request.jwt.claims" = '{"sub":"19000000-0000-0000-0000-000000000002","role":"authenticated"}';
select is(public.archive_item('79000000-0000-0000-0000-000000000006'), 'admin_required', 'member cannot archive');
select is(public.restore_item('79000000-0000-0000-0000-000000000005'), 'admin_required', 'member cannot restore');

set local "request.jwt.claims" = '{"sub":"19000000-0000-0000-0000-000000000003","role":"authenticated"}';
select is(public.archive_item('79000000-0000-0000-0000-000000000006'), 'admin_required', 'child cannot archive');
select is(public.restore_item('79000000-0000-0000-0000-000000000005'), 'admin_required', 'child cannot restore');

set local "request.jwt.claims" = '{"sub":"19000000-0000-0000-0000-000000000004","role":"authenticated"}';
select is(public.archive_item('79000000-0000-0000-0000-000000000006'), 'admin_required', 'guest cannot archive');
select is(public.restore_item('79000000-0000-0000-0000-000000000005'), 'admin_required', 'guest cannot restore');

set local "request.jwt.claims" = '{"sub":"19000000-0000-0000-0000-000000000001","role":"authenticated"}';
select is(public.archive_item('79000000-0000-0000-0000-000000000007'), 'item_not_available', 'foreign archive is not disclosed');
select is(public.archive_item('79000000-0000-0000-0000-000000000099'), 'item_not_available', 'missing archive has the same result');
select is(public.restore_item('79000000-0000-0000-0000-000000000008'), 'item_not_available', 'foreign restore is not disclosed');
select is(public.restore_item('79000000-0000-0000-0000-000000000098'), 'item_not_available', 'missing restore has the same result');
select is(public.archive_item('79000000-0000-0000-0000-000000000005'), 'item_already_archived', 'already archived item is rejected');
select is(public.restore_item('79000000-0000-0000-0000-000000000006'), 'item_not_archived', 'active item cannot be restored');

select is(public.archive_item('79000000-0000-0000-0000-000000000001'), 'success', 'admin archives at-home item');
select is((select status_before_archive from public.item where id = '79000000-0000-0000-0000-000000000001'), 'w domu'::public.item_status, 'at-home status is preserved');
select ok((select archived_at is not null from public.item where id = '79000000-0000-0000-0000-000000000001'), 'archive timestamp is set');
select is((select count(*)::integer from public.item_location where item_id = '79000000-0000-0000-0000-000000000001'), 1, 'archive keeps item location');
select is((select category_id from public.item where id = '79000000-0000-0000-0000-000000000001'), '39000000-0000-0000-0000-000000000001'::uuid, 'archive keeps category');
select is(public.restore_item('79000000-0000-0000-0000-000000000001'), 'success', 'admin restores at-home item');
select is((select status from public.item where id = '79000000-0000-0000-0000-000000000001'), 'w domu'::public.item_status, 'at-home status is restored');
select ok((select archived_at is null and status_before_archive is null from public.item where id = '79000000-0000-0000-0000-000000000001'), 'archive metadata is cleared after restore');
select is((select count(*)::integer from public.item_location where item_id = '79000000-0000-0000-0000-000000000001'), 1, 'restore keeps item location');

select is(public.archive_item('79000000-0000-0000-0000-000000000002'), 'success', 'admin archives borrowed item');
select is((select status_before_archive from public.item where id = '79000000-0000-0000-0000-000000000002'), 'pożyczone'::public.item_status, 'borrowed status is preserved');
select is(public.restore_item('79000000-0000-0000-0000-000000000002'), 'success', 'admin restores borrowed item');
select is((select status from public.item where id = '79000000-0000-0000-0000-000000000002'), 'pożyczone'::public.item_status, 'borrowed status is restored');
select ok((select archived_at is null and status_before_archive is null from public.item where id = '79000000-0000-0000-0000-000000000002'), 'borrowed restore clears metadata');

select is(public.archive_item('79000000-0000-0000-0000-000000000003'), 'success', 'admin archives consumed item');
select is((select status_before_archive from public.item where id = '79000000-0000-0000-0000-000000000003'), 'zużyte'::public.item_status, 'consumed status is preserved');
select is(public.restore_item('79000000-0000-0000-0000-000000000003'), 'success', 'admin restores consumed item');
select is((select status from public.item where id = '79000000-0000-0000-0000-000000000003'), 'zużyte'::public.item_status, 'consumed status is restored');
select ok((select archived_at is null and status_before_archive is null from public.item where id = '79000000-0000-0000-0000-000000000003'), 'consumed restore clears metadata');

select is(public.restore_item('79000000-0000-0000-0000-000000000004'), 'restore_status_required', 'legacy item requires explicit status');
select is(public.restore_item('79000000-0000-0000-0000-000000000004', 'archiwalne'), 'invalid_restore_status', 'legacy item rejects archived target');
select is(public.restore_item('79000000-0000-0000-0000-000000000004', 'pożyczone'), 'success', 'legacy item accepts explicit status');
select is((select status from public.item where id = '79000000-0000-0000-0000-000000000004'), 'pożyczone'::public.item_status, 'legacy item uses selected status');

select is((select count(*)::integer from public.item where id = '79000000-0000-0000-0000-000000000011'), 1, 'unrelated item remains');
select is(public.archive_item('79000000-0000-0000-0000-000000000009'), 'action_failed', 'archive database failure is safe');
select ok((select status = 'w domu' and archived_at is null and status_before_archive is null from public.item where id = '79000000-0000-0000-0000-000000000009'), 'failed archive rolls back all fields');
select is(public.restore_item('79000000-0000-0000-0000-000000000010'), 'action_failed', 'restore database failure is safe');
select ok((select status = 'archiwalne' and archived_at is not null and status_before_archive = 'w domu' from public.item where id = '79000000-0000-0000-0000-000000000010'), 'failed restore rolls back all fields');

reset role;
set local role anon;
select throws_ok($$ select public.archive_item('79000000-0000-0000-0000-000000000006') $$, '42501', null, 'anon cannot execute archive');
select throws_ok($$ select public.restore_item('79000000-0000-0000-0000-000000000005') $$, '42501', null, 'anon cannot execute restore');

reset role;
select * from finish();
rollback;
