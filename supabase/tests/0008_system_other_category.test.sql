begin;

create extension if not exists pgtap with schema extensions;
set search_path = extensions, public, auth;

select plan(7);

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
    '16000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'm4-other-admin-a@example.test',
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
    '16000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'm4-other-admin-b@example.test',
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
  ('26000000-0000-0000-0000-000000000001', 'M4 Other Home A', 'dom'),
  ('26000000-0000-0000-0000-000000000002', 'M4 Other Home B', 'mieszkanie');

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
    '16000000-0000-0000-0000-000000000001',
    '26000000-0000-0000-0000-000000000001',
    'Admin A',
    'm4-other-admin-a@example.test',
    'admin',
    'aktywny'
  ),
  (
    '16000000-0000-0000-0000-000000000002',
    '26000000-0000-0000-0000-000000000002',
    'Admin B',
    'm4-other-admin-b@example.test',
    'admin',
    'aktywny'
  );

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"16000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is(
  (
    select count(*)::integer
    from public.category
    where key = 'other'
  ),
  1,
  'one system Other category exists'
);

select ok(
  (
    select
      czy_systemowa
      and household_id is null
      and nazwa = 'Inne'
      and widoczna_dla_dzieci
    from public.category
    where key = 'other'
  ),
  'Other is a child-visible global system category'
);

select is(
  (
    select count(*)::integer
    from public.category
    where key = 'other'
  ),
  1,
  'household A can read the system Other category'
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
      '26000000-0000-0000-0000-000000000001',
      'Sport',
      false,
      true
    )
  $$,
  'admin can still create a custom category'
);

set local "request.jwt.claims" =
  '{"sub":"16000000-0000-0000-0000-000000000002","role":"authenticated"}';

select is(
  (
    select count(*)::integer
    from public.category
    where nazwa = 'Sport'
  ),
  0,
  'household B cannot read household A custom categories'
);

select is(
  (
    select count(*)::integer
    from public.category
    where key = 'other'
  ),
  1,
  'household B can read the shared system Other category'
);

set local "request.jwt.claims" =
  '{"sub":"16000000-0000-0000-0000-000000000001","role":"authenticated"}';

delete from public.category
where key = 'other';

select is(
  (
    select count(*)::integer
    from public.category
    where key = 'other'
  ),
  1,
  'existing RLS prevents deleting the system Other category'
);

reset role;
set local "request.jwt.claims" = '{}';

select * from finish();
rollback;
