begin;

create extension if not exists pgtap with schema extensions;
set search_path = extensions, public, auth;

select plan(32);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  ('00000000-0000-0000-0000-000000000000', '1a000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'tgen-admin-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1a000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'tgen-member-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1a000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'tgen-child-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1a000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'tgen-guest-a@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1a000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'tgen-admin-b@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1a000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'tgen-no-profile@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '1a000000-0000-0000-0000-000000000007', 'authenticated', 'authenticated', 'tgen-inactive-admin@example.test', crypt('password', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');

insert into public.household (id, nazwa, typ)
values
  ('2a000000-0000-0000-0000-000000000001', 'Test Gen Home A', 'dom'),
  ('2a000000-0000-0000-0000-000000000002', 'Test Gen Home B', 'mieszkanie');

insert into public.profile (id, household_id, imie, email, rola, status)
values
  ('1a000000-0000-0000-0000-000000000001', '2a000000-0000-0000-0000-000000000001', 'Test Gen Admin A', 'tgen-admin-a@example.test', 'admin', 'aktywny'),
  ('1a000000-0000-0000-0000-000000000002', '2a000000-0000-0000-0000-000000000001', 'Test Gen Member', 'tgen-member-a@example.test', 'domownik', 'aktywny'),
  ('1a000000-0000-0000-0000-000000000003', '2a000000-0000-0000-0000-000000000001', 'Test Gen Child', 'tgen-child-a@example.test', 'dziecko', 'aktywny'),
  ('1a000000-0000-0000-0000-000000000004', '2a000000-0000-0000-0000-000000000001', 'Test Gen Guest', 'tgen-guest-a@example.test', 'gość', 'aktywny'),
  ('1a000000-0000-0000-0000-000000000005', '2a000000-0000-0000-0000-000000000002', 'Test Gen Admin B', 'tgen-admin-b@example.test', 'admin', 'aktywny'),
  ('1a000000-0000-0000-0000-000000000007', '2a000000-0000-0000-0000-000000000001', 'Test Gen Inactive', 'tgen-inactive-admin@example.test', 'admin', 'nieaktywny');

-- 1
select has_function(
  'public',
  'generate_test_data',
  array['text'],
  'generate_test_data RPC exists with the approved signature'
);
-- 2
select has_function(
  'public',
  '_test_data_code_segment',
  array['text', 'integer'],
  'test data code helper exists with the approved signature'
);
-- 3
select is(
  (select not p.prosecdef from pg_proc p where p.oid = 'public.generate_test_data(text)'::regprocedure),
  true,
  'generate_test_data is security invoker'
);
-- 4
select ok(
  not has_function_privilege('public', 'public.generate_test_data(text)'::regprocedure, 'EXECUTE'),
  'PUBLIC cannot execute generate_test_data'
);
-- 5
select ok(
  not has_function_privilege('anon', 'public.generate_test_data(text)'::regprocedure, 'EXECUTE'),
  'anon cannot execute generate_test_data'
);
-- 6
select ok(
  has_function_privilege('authenticated', 'public.generate_test_data(text)'::regprocedure, 'EXECUTE'),
  'authenticated can execute generate_test_data'
);

-- 7: Unauthenticated (no JWT claims)
set local role authenticated;
set local "request.jwt.claims" = '{}';
select is(
  public.generate_test_data('small') ->> 'code',
  'AUTH_REQUIRED',
  'missing session is rejected'
);

-- 8: User without profile
set local "request.jwt.claims" = '{"sub":"1a000000-0000-0000-0000-000000000006","role":"authenticated"}';
select is(
  public.generate_test_data('small') ->> 'code',
  'ACTIVE_PROFILE_REQUIRED',
  'user without profile is rejected'
);

-- 9: Inactive profile
set local "request.jwt.claims" = '{"sub":"1a000000-0000-0000-0000-000000000007","role":"authenticated"}';
select is(
  public.generate_test_data('small') ->> 'code',
  'ACTIVE_PROFILE_REQUIRED',
  'inactive profile is rejected'
);

-- 10: Invalid dataset type
set local "request.jwt.claims" = '{"sub":"1a000000-0000-0000-0000-000000000001","role":"authenticated"}';
select is(
  public.generate_test_data('invalid_type') ->> 'code',
  'INVALID_DATASET',
  'invalid dataset type is rejected'
);

-- 11: Member role
set local "request.jwt.claims" = '{"sub":"1a000000-0000-0000-0000-000000000002","role":"authenticated"}';
select is(
  public.generate_test_data('small') ->> 'code',
  'ADMIN_REQUIRED',
  'member cannot generate test data'
);

-- 12: Child role
set local "request.jwt.claims" = '{"sub":"1a000000-0000-0000-0000-000000000003","role":"authenticated"}';
select is(
  public.generate_test_data('small') ->> 'code',
  'ADMIN_REQUIRED',
  'child cannot generate test data'
);

-- 13: Guest role
set local "request.jwt.claims" = '{"sub":"1a000000-0000-0000-0000-000000000004","role":"authenticated"}';
select is(
  public.generate_test_data('small') ->> 'code',
  'ADMIN_REQUIRED',
  'guest cannot generate test data'
);

-- ============================================================
-- Household isolation test: admin from household B
-- ============================================================
set local "request.jwt.claims" = '{"sub":"1a000000-0000-0000-0000-000000000005","role":"authenticated"}';
select is(
  public.generate_test_data('medium') ->> 'status',
  'success',
  'admin from household B can generate in their own household'
);
select is(
  (select count(*)::integer from public.room where household_id = '2a000000-0000-0000-0000-000000000001' and nazwa like '%(test-%)%'),
  0,
  'admin from household B did not affect household A data'
);
select ok(
  (select count(*)::integer from public.room where household_id = '2a000000-0000-0000-0000-000000000002' and nazwa like '%(test-%)%') > 0,
  'admin from household B created data in their own household'
);

-- ============================================================
-- Happy path: admin of own household generates small dataset
-- ============================================================
set local "request.jwt.claims" = '{"sub":"1a000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is(
  public.generate_test_data('small') ->> 'status',
  'success',
  'admin generates small dataset'
);

-- Small: 1 room, 2 L2, 3 L3, 4 items, 4 locations
select is(
  (select count(*)::integer from public.room where household_id = '2a000000-0000-0000-0000-000000000001' and nazwa like '%(test-%)%'),
  1,
  'small creates 1 room'
);
select is(
  (select count(*)::integer from public.storage_location_l2 sl2 join public.room r on r.id = sl2.room_id where r.household_id = '2a000000-0000-0000-0000-000000000001' and r.nazwa like '%(test-%)%'),
  2,
  'small creates 2 furniture items'
);
select is(
  (select count(*)::integer from public.storage_location_l3 sl3 join public.storage_location_l2 sl2 on sl2.id = sl3.storage_location_l2_id join public.room r on r.id = sl2.room_id where r.household_id = '2a000000-0000-0000-0000-000000000001' and r.nazwa like '%(test-%)%'),
  3,
  'small creates 3 storage spaces'
);
select ok(
  (select count(*)::integer from public.item where household_id = '2a000000-0000-0000-0000-000000000001' and nazwa like '%(test-%)%') > 0,
  'small creates items'
);
select ok(
  (select count(*)::integer > 0 from public.item_location il join public.item i on i.id = il.item_id where i.household_id = '2a000000-0000-0000-0000-000000000001' and i.nazwa like '%(test-%)%'),
  'small creates item locations'
);

-- ============================================================
-- Repeated call: generates new set without destroying previous
-- ============================================================
select is(
  public.generate_test_data('small') ->> 'status',
  'success',
  'repeated call also succeeds'
);

select is(
  (select count(*)::integer from public.room where household_id = '2a000000-0000-0000-0000-000000000001' and nazwa like '%(test-%)%'),
  2,
  'repeated call creates additional room (total 2, no deletion)'
);
select is(
  (select count(*)::integer from public.storage_location_l2 sl2 join public.room r on r.id = sl2.room_id where r.household_id = '2a000000-0000-0000-0000-000000000001' and r.nazwa like '%(test-%)%'),
  4,
  'repeated call creates additional furniture (total 4)'
);
select is(
  (select count(*)::integer from public.storage_location_l3 sl3 join public.storage_location_l2 sl2 on sl2.id = sl3.storage_location_l2_id join public.room r on r.id = sl2.room_id where r.household_id = '2a000000-0000-0000-0000-000000000001' and r.nazwa like '%(test-%)%'),
  6,
  'repeated call creates additional storage spaces (total 6)'
);

-- ============================================================
-- Generate medium and deletion_test datasets
-- ============================================================
select is(
  public.generate_test_data('medium') ->> 'status',
  'success',
  'admin generates medium dataset'
);
select is(
  public.generate_test_data('deletion_test') ->> 'status',
  'success',
  'admin generates deletion_test dataset'
);

-- Total rooms after all calls: small(1) + small(1) + medium(3) + deletion_test(2) = 7
select is(
  (select count(*)::integer from public.room where household_id = '2a000000-0000-0000-0000-000000000001' and nazwa like '%(test-%)%'),
  7,
  'all dataset types create rooms without overlap'
);
select ok(
  (select count(*)::integer from public.item where household_id = '2a000000-0000-0000-0000-000000000001' and nazwa like '%(test-%)%') > 10,
  'all dataset types together create items without conflict'
);

-- ============================================================
-- Verify no existing user data was modified or deleted
-- ============================================================
select is(
  (select count(*)::integer from public.profile where household_id = '2a000000-0000-0000-0000-000000000001'),
  5,
  'existing profiles remain untouched'
);
reset role;
select is(
  (select count(*)::integer from public.household where id in (
    '2a000000-0000-0000-0000-000000000001',
    '2a000000-0000-0000-0000-000000000002'
  )),
  2,
  'fixture households remain untouched'
);

select * from finish();
rollback;
