begin;

create extension if not exists pgtap with schema extensions;
set search_path = extensions, public, auth;

select plan(18);

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
  (
    '00000000-0000-0000-0000-000000000000',
    '13000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'm31-admin-a@example.test',
    crypt('password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '13000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'm31-member-a@example.test',
    crypt('password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '13000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'm31-child-a@example.test',
    crypt('password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '13000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'm31-admin-b@example.test',
    crypt('password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

insert into public.household (id, nazwa, typ)
values
  ('23000000-0000-0000-0000-000000000001', 'Dom M31 A', 'dom'),
  ('23000000-0000-0000-0000-000000000002', 'Dom M31 B', 'mieszkanie');

insert into public.profile (
  id,
  household_id,
  imie,
  email,
  rola,
  status
)
values
  (
    '13000000-0000-0000-0000-000000000001',
    '23000000-0000-0000-0000-000000000001',
    'Admin A',
    'm31-admin-a@example.test',
    'admin',
    'aktywny'
  ),
  (
    '13000000-0000-0000-0000-000000000002',
    '23000000-0000-0000-0000-000000000001',
    'Member A',
    'm31-member-a@example.test',
    'domownik',
    'aktywny'
  ),
  (
    '13000000-0000-0000-0000-000000000003',
    '23000000-0000-0000-0000-000000000001',
    'Child A',
    'm31-child-a@example.test',
    'dziecko',
    'aktywny'
  ),
  (
    '13000000-0000-0000-0000-000000000004',
    '23000000-0000-0000-0000-000000000002',
    'Admin B',
    'm31-admin-b@example.test',
    'admin',
    'aktywny'
  );

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"13000000-0000-0000-0000-000000000001","role":"authenticated"}';

select lives_ok(
  $$
    insert into public.room (id, household_id, nazwa, typ, "kolejność")
    values (
      '24000000-0000-0000-0000-000000000001',
      '23000000-0000-0000-0000-000000000001',
      'Salon',
      'Salon',
      1
    )
  $$,
  'admin can create a room with the selected template kind'
);

select is(
  (
    select typ
    from public.room
    where id = '24000000-0000-0000-0000-000000000001'
  ),
  'Salon',
  'room stores the selected template kind instead of Other'
);

select throws_ok(
  $$
    insert into public.room (household_id, nazwa, typ, "kolejność")
    values (
      '23000000-0000-0000-0000-000000000001',
      ' salon ',
      'Salon',
      2
    )
  $$,
  '23505',
  null,
  'room names are unique per household after trim and lowercase'
);

select lives_ok(
  $$
    insert into public.room (id, household_id, nazwa, typ, "kolejność")
    values (
      '24000000-0000-0000-0000-000000000002',
      '23000000-0000-0000-0000-000000000001',
      'Rowerownia',
      'Rowerownia',
      2
    )
  $$,
  'admin can create a room with a custom kind'
);

select lives_ok(
  $$
    insert into public.storage_location_l2 (
      id,
      room_id,
      nazwa,
      typ,
      "kolejność"
    )
    values (
      '25000000-0000-0000-0000-000000000001',
      '24000000-0000-0000-0000-000000000001',
      U&'Rega\0142',
      U&'Rega\0142',
      1
    )
  $$,
  'admin can create L2 with the selected template kind'
);

select is(
  (
    select typ
    from public.storage_location_l2
    where id = '25000000-0000-0000-0000-000000000001'
  ),
  U&'Rega\0142',
  'L2 stores the selected template kind instead of Other'
);

select throws_ok(
  $$
    insert into public.storage_location_l2 (room_id, nazwa, typ, "kolejność")
    values (
      '24000000-0000-0000-0000-000000000001',
      U&' rega\0142 ',
      U&'Rega\0142',
      2
    )
  $$,
  '23505',
  null,
  'L2 names are unique within a room after trim and lowercase'
);

select lives_ok(
  $$
    insert into public.storage_location_l2 (
      id,
      room_id,
      nazwa,
      typ,
      "kolejność"
    )
    values (
      '25000000-0000-0000-0000-000000000002',
      '24000000-0000-0000-0000-000000000002',
      U&'Rega\0142',
      U&'Rega\0142',
      1
    )
  $$,
  'the same L2 name is allowed in a different room'
);

select lives_ok(
  $$
    insert into public.storage_location_l2 (
      id,
      room_id,
      nazwa,
      typ,
      "kolejność"
    )
    values (
      '25000000-0000-0000-0000-000000000003',
      '24000000-0000-0000-0000-000000000001',
      'Kuferek',
      'Kuferek',
      2
    )
  $$,
  'admin can create L2 with a custom kind'
);

select lives_ok(
  $$
    insert into public.storage_location_l3 (
      id,
      storage_location_l2_id,
      nazwa,
      kod_lokalizacji,
      "kolejność"
    )
    values (
      '26000000-0000-0000-0000-000000000001',
      '25000000-0000-0000-0000-000000000001',
      U&'G\00F3rna p\00F3\0142ka',
      'SAL-REG-GOR1',
      1
    )
  $$,
  'admin can create an L3 position'
);

select throws_ok(
  $$
    insert into public.storage_location_l3 (
      storage_location_l2_id,
      nazwa,
      kod_lokalizacji,
      "kolejność"
    )
    values (
      '25000000-0000-0000-0000-000000000001',
      U&'g\00F3rna p\00F3\0142ka',
      'SAL-REG-GOR2',
      2
    )
  $$,
  '23505',
  null,
  'L3 names are unique within an L2 location'
);

select lives_ok(
  $$
    insert into public.category (
      household_id,
      nazwa,
      czy_systemowa,
      widoczna_dla_dzieci
    )
    values (
      '23000000-0000-0000-0000-000000000001',
      'Sport',
      false,
      true
    )
  $$,
  'admin can create a custom category'
);

select throws_ok(
  $$
    insert into public.category (
      household_id,
      nazwa,
      czy_systemowa,
      widoczna_dla_dzieci
    )
    values (
      '23000000-0000-0000-0000-000000000001',
      ' sport ',
      false,
      true
    )
  $$,
  '23505',
  null,
  'custom category names are unique per household after trim and lowercase'
);

set local "request.jwt.claims" =
  '{"sub":"13000000-0000-0000-0000-000000000004","role":"authenticated"}';

select is(
  (
    select count(*)::integer
    from public.category
    where nazwa = 'Sport'
  ),
  0,
  'other household cannot see foreign custom categories'
);

set local "request.jwt.claims" =
  '{"sub":"13000000-0000-0000-0000-000000000002","role":"authenticated"}';

select throws_ok(
  $$
    insert into public.room (household_id, nazwa, typ, "kolejność")
    values (
      '23000000-0000-0000-0000-000000000001',
      'Pokoj domownika',
      'Biuro',
      3
    )
  $$,
  '42501',
  null,
  'member cannot create rooms'
);

select throws_ok(
  $$
    insert into public.category (
      household_id,
      nazwa,
      czy_systemowa,
      widoczna_dla_dzieci
    )
    values (
      '23000000-0000-0000-0000-000000000001',
      'Domownik Sport',
      false,
      true
    )
  $$,
  '42501',
  null,
  'member cannot create custom categories'
);

set local "request.jwt.claims" =
  '{"sub":"13000000-0000-0000-0000-000000000003","role":"authenticated"}';

select throws_ok(
  $$
    insert into public.storage_location_l2 (room_id, nazwa, typ, "kolejność")
    values (
      '24000000-0000-0000-0000-000000000001',
      'Dziecko Regal',
      'Regał',
      3
    )
  $$,
  '42501',
  null,
  'child cannot create L2 locations'
);

select throws_ok(
  $$
    insert into public.category (
      household_id,
      nazwa,
      czy_systemowa,
      widoczna_dla_dzieci
    )
    values (
      '23000000-0000-0000-0000-000000000001',
      'Dziecko Sport',
      false,
      true
    )
  $$,
  '42501',
  null,
  'child cannot create custom categories'
);

reset role;
set local "request.jwt.claims" = '{}';

select * from finish();
rollback;
