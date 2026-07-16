begin;

create extension if not exists pgtap with schema extensions;
set search_path = extensions, public, auth;

select plan(37);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  ('00000000-0000-0000-0000-000000000000', '18000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'delete-admin-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '18000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'delete-member-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '18000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'delete-child-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '18000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'delete-guest-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '18000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'delete-admin-b@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '18000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'delete-no-profile@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '18000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'delete-inactive-admin@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

insert into public.household (id, nazwa, typ)
values
  ('28000000-0000-0000-0000-000000000001', 'Delete Home A', 'dom'),
  ('28000000-0000-0000-0000-000000000002', 'Delete Home B', 'mieszkanie');

insert into public.profile (id, household_id, imie, email, rola, status)
values
  ('18000000-0000-0000-0000-000000000001', '28000000-0000-0000-0000-000000000001', 'Admin A', 'delete-admin-a@example.test', 'admin', 'aktywny'),
  ('18000000-0000-0000-0000-000000000002', '28000000-0000-0000-0000-000000000001', 'Member A', 'delete-member-a@example.test', 'domownik', 'aktywny'),
  ('18000000-0000-0000-0000-000000000003', '28000000-0000-0000-0000-000000000001', 'Child A', 'delete-child-a@example.test', 'dziecko', 'aktywny'),
  ('18000000-0000-0000-0000-000000000004', '28000000-0000-0000-0000-000000000001', 'Guest A', 'delete-guest-a@example.test', 'gość', 'aktywny'),
  ('18000000-0000-0000-0000-000000000005', '28000000-0000-0000-0000-000000000002', 'Admin B', 'delete-admin-b@example.test', 'admin', 'aktywny'),
  ('18000000-0000-0000-0000-000000000007', '28000000-0000-0000-0000-000000000001', 'Inactive Admin', 'delete-inactive-admin@example.test', 'admin', 'nieaktywny');

insert into public.category (
  id, household_id, nazwa, czy_systemowa, widoczna_dla_dzieci
)
values
  ('38000000-0000-0000-0000-000000000001', '28000000-0000-0000-0000-000000000001', 'Delete Category A', false, true),
  ('38000000-0000-0000-0000-000000000002', '28000000-0000-0000-0000-000000000002', 'Delete Category B', false, true);

insert into public.room (id, household_id, nazwa, typ, "kolejność")
values
  ('48000000-0000-0000-0000-000000000001', '28000000-0000-0000-0000-000000000001', 'Delete Room A', 'Room', 1),
  ('48000000-0000-0000-0000-000000000002', '28000000-0000-0000-0000-000000000002', 'Delete Room B', 'Room', 1);

insert into public.storage_location_l2 (id, room_id, nazwa, typ, "kolejność")
values
  ('58000000-0000-0000-0000-000000000001', '48000000-0000-0000-0000-000000000001', 'Delete Storage A', 'Shelf', 1),
  ('58000000-0000-0000-0000-000000000002', '48000000-0000-0000-0000-000000000002', 'Delete Storage B', 'Shelf', 1);

insert into public.storage_location_l3 (
  id, storage_location_l2_id, nazwa, kod_lokalizacji, "kolejność"
)
values
  ('68000000-0000-0000-0000-000000000001', '58000000-0000-0000-0000-000000000001', 'Delete Position A1', 'DELETE-A1', 1),
  ('68000000-0000-0000-0000-000000000002', '58000000-0000-0000-0000-000000000001', 'Delete Position A2', 'DELETE-A2', 2),
  ('68000000-0000-0000-0000-000000000003', '58000000-0000-0000-0000-000000000002', 'Delete Position B1', 'DELETE-B1', 1);

insert into public.item (
  id, household_id, category_id, nazwa, typ, ilosc, status,
  miniatura_url, created_by_id
)
values
  ('78000000-0000-0000-0000-000000000001', '28000000-0000-0000-0000-000000000001', '38000000-0000-0000-0000-000000000001', 'Active Unlocated', 'unikalny', 1, 'w domu', null, '18000000-0000-0000-0000-000000000001'),
  ('78000000-0000-0000-0000-000000000002', '28000000-0000-0000-0000-000000000001', '38000000-0000-0000-0000-000000000001', 'Archived One Link', 'unikalny', 1, 'archiwalne', null, '18000000-0000-0000-0000-000000000001'),
  ('78000000-0000-0000-0000-000000000003', '28000000-0000-0000-0000-000000000001', '38000000-0000-0000-0000-000000000001', 'Active Multiple Links', 'zestaw', 2, 'w domu', null, '18000000-0000-0000-0000-000000000001'),
  ('78000000-0000-0000-0000-000000000004', '28000000-0000-0000-0000-000000000001', '38000000-0000-0000-0000-000000000001', 'Unrelated Item', 'unikalny', 1, 'w domu', null, '18000000-0000-0000-0000-000000000001'),
  ('78000000-0000-0000-0000-000000000005', '28000000-0000-0000-0000-000000000001', '38000000-0000-0000-0000-000000000001', 'Protected Item', 'unikalny', 1, 'w domu', null, '18000000-0000-0000-0000-000000000001'),
  ('78000000-0000-0000-0000-000000000006', '28000000-0000-0000-0000-000000000002', '38000000-0000-0000-0000-000000000002', 'Foreign Item', 'unikalny', 1, 'w domu', null, '18000000-0000-0000-0000-000000000005'),
  ('78000000-0000-0000-0000-000000000007', '28000000-0000-0000-0000-000000000001', '38000000-0000-0000-0000-000000000001', 'Item With File', 'unikalny', 1, 'w domu', null, '18000000-0000-0000-0000-000000000001'),
  ('78000000-0000-0000-0000-000000000008', '28000000-0000-0000-0000-000000000001', '38000000-0000-0000-0000-000000000001', 'Item With Thumbnail', 'unikalny', 1, 'w domu', 'private/item-thumbnail.jpg', '18000000-0000-0000-0000-000000000001'),
  ('78000000-0000-0000-0000-000000000009', '28000000-0000-0000-0000-000000000001', '38000000-0000-0000-0000-000000000001', 'Atomic Failure Item', 'unikalny', 1, 'w domu', null, '18000000-0000-0000-0000-000000000001');

insert into public.item_location (
  id, item_id, storage_location_l3_id, czy_glowna
)
values
  ('88000000-0000-0000-0000-000000000001', '78000000-0000-0000-0000-000000000002', '68000000-0000-0000-0000-000000000001', true),
  ('88000000-0000-0000-0000-000000000002', '78000000-0000-0000-0000-000000000003', '68000000-0000-0000-0000-000000000001', true),
  ('88000000-0000-0000-0000-000000000003', '78000000-0000-0000-0000-000000000003', '68000000-0000-0000-0000-000000000002', false),
  ('88000000-0000-0000-0000-000000000004', '78000000-0000-0000-0000-000000000004', '68000000-0000-0000-0000-000000000002', true),
  ('88000000-0000-0000-0000-000000000005', '78000000-0000-0000-0000-000000000009', '68000000-0000-0000-0000-000000000001', true);

insert into public.file (
  id, item_id, household_id, nazwa, plik_url, typ, rozmiar_kb,
  czy_zaszyfrowany, created_by_id
)
values (
  '98000000-0000-0000-0000-000000000001',
  '78000000-0000-0000-0000-000000000007',
  '28000000-0000-0000-0000-000000000001',
  'Blocked attachment',
  'private/blocked-attachment.pdf',
  'pdf',
  10,
  false,
  '18000000-0000-0000-0000-000000000001'
);

create function public.test_block_permanent_item_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.id = '78000000-0000-0000-0000-000000000009'::uuid then
    raise exception 'TEST_DELETE_BLOCKED';
  end if;

  return old;
end;
$$;

create trigger test_block_permanent_item_delete
before delete on public.item
for each row execute function public.test_block_permanent_item_delete();

select is(
  (select not p.prosecdef from pg_proc as p where p.oid = 'public.delete_item_permanently(uuid)'::regprocedure),
  true,
  'permanent item deletion is security invoker'
);
select ok(not has_function_privilege('public', 'public.delete_item_permanently(uuid)'::regprocedure, 'EXECUTE'), 'PUBLIC cannot execute permanent deletion');
select ok(not has_function_privilege('anon', 'public.delete_item_permanently(uuid)'::regprocedure, 'EXECUTE'), 'anon cannot execute permanent deletion');
select ok(has_function_privilege('authenticated', 'public.delete_item_permanently(uuid)'::regprocedure, 'EXECUTE'), 'authenticated can execute the guarded RPC');

set local role authenticated;
set local "request.jwt.claims" = '{}';
select is(public.delete_item_permanently('78000000-0000-0000-0000-000000000005'), 'auth_required', 'missing session is rejected safely');

set local "request.jwt.claims" = '{"sub":"18000000-0000-0000-0000-000000000006","role":"authenticated"}';
select is(public.delete_item_permanently('78000000-0000-0000-0000-000000000005'), 'active_profile_required', 'profile is required');

set local "request.jwt.claims" = '{"sub":"18000000-0000-0000-0000-000000000007","role":"authenticated"}';
select is(public.delete_item_permanently('78000000-0000-0000-0000-000000000005'), 'active_profile_required', 'inactive admin is rejected');

set local "request.jwt.claims" = '{"sub":"18000000-0000-0000-0000-000000000002","role":"authenticated"}';
select is(public.delete_item_permanently('78000000-0000-0000-0000-000000000005'), 'admin_required', 'member cannot permanently delete');

set local "request.jwt.claims" = '{"sub":"18000000-0000-0000-0000-000000000003","role":"authenticated"}';
select is(public.delete_item_permanently('78000000-0000-0000-0000-000000000005'), 'admin_required', 'child cannot permanently delete');

set local "request.jwt.claims" = '{"sub":"18000000-0000-0000-0000-000000000004","role":"authenticated"}';
select is(public.delete_item_permanently('78000000-0000-0000-0000-000000000005'), 'admin_required', 'guest cannot permanently delete');

set local "request.jwt.claims" = '{"sub":"18000000-0000-0000-0000-000000000001","role":"authenticated"}';
select is((select count(*)::integer from public.item where id = '78000000-0000-0000-0000-000000000005'), 1, 'unauthorized attempts leave the item untouched');
select is(public.delete_item_permanently('78000000-0000-0000-0000-000000000006'), 'item_not_available', 'foreign item is not disclosed');
select is(public.delete_item_permanently('78000000-0000-0000-0000-000000000099'), 'item_not_available', 'missing item has the same safe result');

set local "request.jwt.claims" = '{"sub":"18000000-0000-0000-0000-000000000005","role":"authenticated"}';
select is((select count(*)::integer from public.item where id = '78000000-0000-0000-0000-000000000006'), 1, 'foreign item remains after the other household attempt');

set local "request.jwt.claims" = '{"sub":"18000000-0000-0000-0000-000000000001","role":"authenticated"}';
select is(public.delete_item_permanently('78000000-0000-0000-0000-000000000001'), 'success', 'admin deletes an active unlocated item');
select is((select count(*)::integer from public.item where id = '78000000-0000-0000-0000-000000000001'), 0, 'active unlocated item is gone');
select is(public.delete_item_permanently('78000000-0000-0000-0000-000000000002'), 'success', 'admin deletes an archived item');
select is((select count(*)::integer from public.item where id = '78000000-0000-0000-0000-000000000002'), 0, 'archived item is gone');
select is((select count(*)::integer from public.item_location where item_id = '78000000-0000-0000-0000-000000000002'), 0, 'archived item location is removed');
select is((select count(*)::integer from public.category where id = '38000000-0000-0000-0000-000000000001'), 1, 'category remains');
select is((select count(*)::integer from public.room where id = '48000000-0000-0000-0000-000000000001'), 1, 'room remains');
select is((select count(*)::integer from public.storage_location_l2 where id = '58000000-0000-0000-0000-000000000001'), 1, 'L2 storage remains');
select is((select count(*)::integer from public.storage_location_l3 where storage_location_l2_id = '58000000-0000-0000-0000-000000000001'), 2, 'L3 positions remain');
select is(public.delete_item_permanently('78000000-0000-0000-0000-000000000003'), 'success', 'admin deletes an item with multiple locations');
select is((select count(*)::integer from public.item where id = '78000000-0000-0000-0000-000000000003'), 0, 'multi-location item is gone');
select is((select count(*)::integer from public.item_location where item_id = '78000000-0000-0000-0000-000000000003'), 0, 'all links of only the deleted item are removed');
select is((select count(*)::integer from public.item where id = '78000000-0000-0000-0000-000000000004'), 1, 'another item remains');
select is((select count(*)::integer from public.item_location where item_id = '78000000-0000-0000-0000-000000000004'), 1, 'another item location remains');
select is(public.delete_item_permanently('78000000-0000-0000-0000-000000000007'), 'item_has_files', 'database attachment blocks deletion');
select is((select count(*)::integer from public.item where id = '78000000-0000-0000-0000-000000000007'), 1, 'item with attachment remains');
select is((select count(*)::integer from public.file where item_id = '78000000-0000-0000-0000-000000000007'), 1, 'attachment metadata remains');
select is(public.delete_item_permanently('78000000-0000-0000-0000-000000000008'), 'item_has_files', 'thumbnail URL blocks deletion');
select is((select count(*)::integer from public.item where id = '78000000-0000-0000-0000-000000000008'), 1, 'item with thumbnail remains');
select is(public.delete_item_permanently('78000000-0000-0000-0000-000000000009'), 'deletion_failed', 'database failure returns a safe result');
select is((select count(*)::integer from public.item where id = '78000000-0000-0000-0000-000000000009'), 1, 'failed deletion keeps the item');
select is((select count(*)::integer from public.item_location where item_id = '78000000-0000-0000-0000-000000000009'), 1, 'failed deletion rolls back location cleanup');

reset role;
set local role anon;
select throws_ok(
  $$ select public.delete_item_permanently('78000000-0000-0000-0000-000000000005') $$,
  '42501',
  null,
  'anonymous role cannot call permanent deletion'
);

reset role;
select * from finish();
rollback;
