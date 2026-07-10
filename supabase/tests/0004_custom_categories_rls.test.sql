begin;

create extension if not exists pgtap with schema extensions;
set search_path = extensions, public, auth;

select plan(8);

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
    '12000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'm3-admin-a@example.test',
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
    '12000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'm3-member-a@example.test',
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
    '12000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'm3-child-a@example.test',
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
    '12000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'm3-admin-b@example.test',
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
  ('22000000-0000-0000-0000-000000000101', 'Dom M3 A', 'dom'),
  ('22000000-0000-0000-0000-000000000102', 'Dom M3 B', 'mieszkanie');

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
    '12000000-0000-0000-0000-000000000001',
    '22000000-0000-0000-0000-000000000101',
    'Admin A',
    'm3-admin-a@example.test',
    'admin',
    'aktywny'
  ),
  (
    '12000000-0000-0000-0000-000000000002',
    '22000000-0000-0000-0000-000000000101',
    'Domownik A',
    'm3-member-a@example.test',
    'domownik',
    'aktywny'
  ),
  (
    '12000000-0000-0000-0000-000000000003',
    '22000000-0000-0000-0000-000000000101',
    'Dziecko A',
    'm3-child-a@example.test',
    'dziecko',
    'aktywny'
  ),
  (
    '12000000-0000-0000-0000-000000000004',
    '22000000-0000-0000-0000-000000000102',
    'Admin B',
    'm3-admin-b@example.test',
    'admin',
    'aktywny'
  );

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"12000000-0000-0000-0000-000000000001","role":"authenticated"}';

select lives_ok(
  $$
    insert into public.category (
      household_id,
      nazwa,
      czy_systemowa,
      widoczna_dla_dzieci
    )
    values (
      '22000000-0000-0000-0000-000000000101',
      'Sport',
      false,
      true
    )
  $$,
  'admin can create a custom category'
);

select is(
  (
    select household_id
    from public.category
    where nazwa = 'Sport'
  ),
  '22000000-0000-0000-0000-000000000101'::uuid,
  'custom category belongs to current household'
);

select ok(
  (
    select not czy_systemowa and key is null
    from public.category
    where nazwa = 'Sport'
  ),
  'custom category is not system and has no key'
);

insert into public.category (
  id,
  household_id,
  nazwa,
  czy_systemowa,
  widoczna_dla_dzieci
)
values (
  '32000000-0000-0000-0000-000000000001',
  '22000000-0000-0000-0000-000000000101',
  'Uzywana kategoria',
  false,
  true
);

insert into public.item (
  id,
  household_id,
  category_id,
  nazwa,
  typ,
  status,
  created_by_id
)
values (
  '33000000-0000-0000-0000-000000000001',
  '22000000-0000-0000-0000-000000000101',
  '32000000-0000-0000-0000-000000000001',
  'Pilka',
  'unikalny',
  'w domu',
  '12000000-0000-0000-0000-000000000001'
);

select throws_ok(
  $$
    delete from public.category
    where id = '32000000-0000-0000-0000-000000000001'
  $$,
  '23503',
  null,
  'custom category used by item cannot be deleted'
);

set local "request.jwt.claims" =
  '{"sub":"12000000-0000-0000-0000-000000000004","role":"authenticated"}';

select is(
  (
    select count(*)::integer
    from public.category
    where nazwa = 'Sport'
  ),
  0,
  'other household cannot see foreign custom category'
);

set local "request.jwt.claims" =
  '{"sub":"12000000-0000-0000-0000-000000000002","role":"authenticated"}';

select throws_ok(
  $$
    insert into public.category (
      household_id,
      nazwa,
      czy_systemowa,
      widoczna_dla_dzieci
    )
    values (
      '22000000-0000-0000-0000-000000000101',
      'Domownik sport',
      false,
      true
    )
  $$,
  '42501',
  null,
  'member cannot create custom categories'
);

set local "request.jwt.claims" =
  '{"sub":"12000000-0000-0000-0000-000000000003","role":"authenticated"}';

select throws_ok(
  $$
    insert into public.category (
      household_id,
      nazwa,
      czy_systemowa,
      widoczna_dla_dzieci
    )
    values (
      '22000000-0000-0000-0000-000000000101',
      'Dziecko sport',
      false,
      true
    )
  $$,
  '42501',
  null,
  'child cannot create custom categories'
);

select is(
  (
    select count(*)::integer
    from public.category
    where nazwa = 'Sport'
  ),
  1,
  'child can read visible custom category in own household'
);

reset role;
set local "request.jwt.claims" = '{}';

select * from finish();
rollback;
