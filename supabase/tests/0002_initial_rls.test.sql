begin;

create extension if not exists pgtap with schema extensions;
set search_path = extensions, public, auth;

select plan(20);

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
    '10000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'admin-a@example.test',
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
    '10000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'admin-b@example.test',
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
    '10000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'child-a@example.test',
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
  ('20000000-0000-0000-0000-000000000001', 'Dom A', 'dom'),
  ('20000000-0000-0000-0000-000000000002', 'Dom B', 'mieszkanie');

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
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'Admin A',
    'admin-a@example.test',
    'admin',
    'aktywny'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    'Admin B',
    'admin-b@example.test',
    'admin',
    'aktywny'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000001',
    'Dziecko A',
    'child-a@example.test',
    'dziecko',
    'aktywny'
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
values
  (
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    (select id from public.category where key = 'books'),
    'Ksiazka A',
    'unikalny',
    'w domu',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000001',
    (select id from public.category where key = 'medicines'),
    'Lek A',
    'unikalny',
    'w domu',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000002',
    (select id from public.category where key = 'books'),
    'Ksiazka B',
    'unikalny',
    'w domu',
    '10000000-0000-0000-0000-000000000002'
  );

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is(
  (select count(*)::integer from public.household),
  1,
  'admin sees only own household'
);

select is(
  (select count(*)::integer from public.item),
  2,
  'admin sees only items from own household'
);

select is(
  (select public.current_household_id()),
  '20000000-0000-0000-0000-000000000001'::uuid,
  'current household comes from active profile'
);

select is(
  (select public.current_profile_role()),
  'admin'::public.profile_role,
  'current role comes from active profile'
);

select lives_ok(
  $$
    update public.household
    set nazwa = 'Dom A zmieniony'
    where id = '20000000-0000-0000-0000-000000000001'
  $$,
  'admin can update own household'
);

select is(
  (
    select count(*)::integer
    from public.household
    where id = '20000000-0000-0000-0000-000000000002'
  ),
  0,
  'foreign household remains invisible'
);

select throws_ok(
  $$
    update public.profile
    set rola = 'domownik'
    where id = '10000000-0000-0000-0000-000000000001'
  $$,
  'P0001',
  'LAST_ADMIN_REQUIRED',
  'last active admin cannot be demoted'
);

select throws_ok(
  $$
    delete from public.profile
    where id = '10000000-0000-0000-0000-000000000001'
  $$,
  'P0001',
  'LAST_ADMIN_REQUIRED',
  'last active admin cannot be deleted'
);

select is(
  (
    select count(*)::integer
    from public.category
    where czy_systemowa
  ),
  8,
  'admin sees every system category'
);

select lives_ok(
  $$
    update public.category
    set nazwa = 'Zmieniona'
    where key = 'books'
  $$,
  'attempt to edit a system category is safely ignored'
);

select is(
  (select nazwa from public.category where key = 'books'),
  'Książki',
  'system category remains unchanged'
);

set local "request.jwt.claims" =
  '{"sub":"10000000-0000-0000-0000-000000000003","role":"authenticated"}';

select is(
  (select count(*)::integer from public.item),
  1,
  'child sees only allowed item categories'
);

select is(
  (
    select count(*)::integer
    from public.category
    where key in ('medicines', 'documents')
  ),
  0,
  'child cannot read restricted system categories'
);

select throws_ok(
  $$
    insert into public.room (
      household_id,
      nazwa,
      typ,
      "kolejność"
    )
    values (
      '20000000-0000-0000-0000-000000000001',
      'Pokoj',
      'sypialnia',
      1
    )
  $$,
  '42501',
  null,
  'child cannot create rooms'
);

select lives_ok(
  $$
    update public.item
    set nazwa = 'Niedozwolona zmiana'
    where id = '30000000-0000-0000-0000-000000000001'
  $$,
  'child item update attempt is safely ignored'
);

select is(
  (
    select nazwa
    from public.item
    where id = '30000000-0000-0000-0000-000000000001'
  ),
  'Ksiazka A',
  'child cannot change item fields'
);

reset role;
set local "request.jwt.claims" = '{}';

select is(
  (
    select count(*)::integer
    from information_schema.role_table_grants
    where grantee = 'anon'
      and table_schema = 'public'
      and table_name in (
        'household',
        'profile',
        'room',
        'storage_location_l2',
        'storage_location_l3',
        'category',
        'item',
        'item_location',
        'file',
        'log'
      )
  ),
  0,
  'anon has no table grants'
);

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"10000000-0000-0000-0000-000000000001","role":"authenticated"}';

select throws_ok(
  $$
    select public.create_household_with_admin(
      'Drugi dom',
      'dom',
      'Admin A'
    )
  $$,
  'P0001',
  'PROFILE_ALREADY_EXISTS',
  'multi-household onboarding is blocked'
);

select ok(
  public.is_household_admin(
    '20000000-0000-0000-0000-000000000001'
  ),
  'admin helper accepts own household'
);

select isnt(
  public.is_household_admin(
    '20000000-0000-0000-0000-000000000002'
  ),
  true,
  'admin helper rejects foreign household'
);

select * from finish();
rollback;
