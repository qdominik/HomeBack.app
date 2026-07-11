begin;

create extension if not exists pgtap with schema extensions;
set search_path = extensions, public, auth;

select plan(23);

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
    '15000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'm4a-admin-a@example.test',
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
    '15000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'm4a-member-a@example.test',
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
    '15000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'm4a-child-a@example.test',
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
    '15000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'm4a-admin-b@example.test',
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
  ('25000000-0000-0000-0000-000000000001', 'M4A Home A', 'dom'),
  ('25000000-0000-0000-0000-000000000002', 'M4A Home B', 'mieszkanie');

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
    '15000000-0000-0000-0000-000000000001',
    '25000000-0000-0000-0000-000000000001',
    'Admin A',
    'm4a-admin-a@example.test',
    'admin',
    'aktywny'
  ),
  (
    '15000000-0000-0000-0000-000000000002',
    '25000000-0000-0000-0000-000000000001',
    'Member A',
    'm4a-member-a@example.test',
    'domownik',
    'aktywny'
  ),
  (
    '15000000-0000-0000-0000-000000000003',
    '25000000-0000-0000-0000-000000000001',
    'Child A',
    'm4a-child-a@example.test',
    'dziecko',
    'aktywny'
  ),
  (
    '15000000-0000-0000-0000-000000000004',
    '25000000-0000-0000-0000-000000000002',
    'Admin B',
    'm4a-admin-b@example.test',
    'admin',
    'aktywny'
  );

insert into public.category (
  id,
  household_id,
  nazwa,
  czy_systemowa,
  widoczna_dla_dzieci
)
values
  (
    '35000000-0000-0000-0000-000000000001',
    '25000000-0000-0000-0000-000000000001',
    'M4A Custom A',
    false,
    true
  ),
  (
    '35000000-0000-0000-0000-000000000002',
    '25000000-0000-0000-0000-000000000002',
    'M4A Custom B',
    false,
    true
  );

insert into public.room (id, household_id, nazwa, typ, "kolejność")
values
  (
    '36000000-0000-0000-0000-000000000001',
    '25000000-0000-0000-0000-000000000001',
    'M4A Room A',
    'Room',
    1
  ),
  (
    '36000000-0000-0000-0000-000000000002',
    '25000000-0000-0000-0000-000000000002',
    'M4A Room B',
    'Room',
    1
  );

insert into public.storage_location_l2 (
  id,
  room_id,
  nazwa,
  typ,
  "kolejność"
)
values
  (
    '37000000-0000-0000-0000-000000000001',
    '36000000-0000-0000-0000-000000000001',
    'M4A Storage A',
    'Shelf',
    1
  ),
  (
    '37000000-0000-0000-0000-000000000002',
    '36000000-0000-0000-0000-000000000002',
    'M4A Storage B',
    'Shelf',
    1
  );

insert into public.storage_location_l3 (
  id,
  storage_location_l2_id,
  nazwa,
  kod_lokalizacji,
  "kolejność"
)
values
  (
    '38000000-0000-0000-0000-000000000001',
    '37000000-0000-0000-0000-000000000001',
    'M4A Position A1',
    'M4A-A1',
    1
  ),
  (
    '38000000-0000-0000-0000-000000000002',
    '37000000-0000-0000-0000-000000000001',
    'M4A Position A2',
    'M4A-A2',
    2
  ),
  (
    '38000000-0000-0000-0000-000000000003',
    '37000000-0000-0000-0000-000000000002',
    'M4A Position B1',
    'M4A-B1',
    1
  );

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"15000000-0000-0000-0000-000000000001","role":"authenticated"}';

select lives_ok(
  $$
    insert into public.item (
      id,
      household_id,
      category_id,
      nazwa,
      typ,
      ilosc,
      status,
      created_by_id
    )
    select
      '39000000-0000-0000-0000-000000000001',
      '25000000-0000-0000-0000-000000000001',
      c.id,
      'M4A System Item',
      'unikalny',
      1,
      'w domu',
      '15000000-0000-0000-0000-000000000001'
    from public.category as c
    where c.key = 'tools'
  $$,
  'admin can create an item with a system category'
);

select lives_ok(
  $$
    insert into public.item (
      id,
      household_id,
      category_id,
      nazwa,
      typ,
      ilosc,
      status,
      created_by_id
    )
    values (
      '39000000-0000-0000-0000-000000000002',
      '25000000-0000-0000-0000-000000000001',
      '35000000-0000-0000-0000-000000000001',
      'M4A Custom Item',
      'zapas',
      3,
      'w domu',
      '15000000-0000-0000-0000-000000000001'
    )
  $$,
  'admin can create an item with an own custom category'
);

select lives_ok(
  $$
    update public.item
    set nazwa = 'M4A Custom Item Updated'
    where id = '39000000-0000-0000-0000-000000000002'
  $$,
  'admin can update an item in the own household'
);

select throws_ok(
  $$
    insert into public.item (
      household_id,
      category_id,
      nazwa,
      typ,
      status,
      created_by_id
    )
    select
      '25000000-0000-0000-0000-000000000002',
      c.id,
      'M4A Foreign Household',
      'unikalny',
      'w domu',
      '15000000-0000-0000-0000-000000000001'
    from public.category as c
    where c.key = 'tools'
  $$,
  '42501',
  null,
  'admin cannot create an item in a foreign household'
);

select throws_ok(
  $$
    insert into public.item (
      household_id,
      category_id,
      nazwa,
      typ,
      status,
      created_by_id
    )
    values (
      '25000000-0000-0000-0000-000000000001',
      '35000000-0000-0000-0000-000000000002',
      'M4A Foreign Category',
      'unikalny',
      'w domu',
      '15000000-0000-0000-0000-000000000001'
    )
  $$,
  '42501',
  null,
  'admin cannot use a custom category from another household'
);

select throws_ok(
  $$
    insert into public.item (
      household_id,
      category_id,
      nazwa,
      typ,
      status,
      created_by_id
    )
    select
      '25000000-0000-0000-0000-000000000001',
      c.id,
      'M4A Spoofed Creator',
      'unikalny',
      'w domu',
      '15000000-0000-0000-0000-000000000004'
    from public.category as c
    where c.key = 'tools'
  $$,
  '42501',
  null,
  'created_by_id cannot be spoofed'
);

select lives_ok(
  $$
    select public.set_item_primary_location(
      '39000000-0000-0000-0000-000000000001',
      '38000000-0000-0000-0000-000000000001'
    )
  $$,
  'admin can assign an own L3 position through the RPC'
);

select throws_ok(
  $$
    insert into public.item_location (
      item_id,
      storage_location_l3_id,
      czy_glowna
    )
    values (
      '39000000-0000-0000-0000-000000000001',
      '38000000-0000-0000-0000-000000000002',
      true
    )
  $$,
  '23505',
  null,
  'index rejects a second primary location for the same item'
);

select lives_ok(
  $$
    insert into public.item_location (
      item_id,
      storage_location_l3_id,
      czy_glowna
    )
    values (
      '39000000-0000-0000-0000-000000000002',
      '38000000-0000-0000-0000-000000000001',
      true
    )
  $$,
  'one primary location for a different item is allowed'
);

select lives_ok(
  $$
    select public.set_item_primary_location(
      '39000000-0000-0000-0000-000000000001',
      '38000000-0000-0000-0000-000000000002'
    )
  $$,
  'RPC atomically replaces the primary location'
);

select is(
  (
    select count(*)::integer
    from public.item_location
    where item_id = '39000000-0000-0000-0000-000000000001'
      and czy_glowna
  ),
  1,
  'RPC leaves exactly one primary location after replacement'
);

select is(
  (
    select storage_location_l3_id
    from public.item_location
    where item_id = '39000000-0000-0000-0000-000000000001'
      and czy_glowna
  ),
  '38000000-0000-0000-0000-000000000002'::uuid,
  'RPC stores the replacement position'
);

select throws_ok(
  $$
    select public.set_item_primary_location(
      '39000000-0000-0000-0000-000000000001',
      '38000000-0000-0000-0000-000000000003'
    )
  $$,
  'P0001',
  'LOCATION_HOUSEHOLD_MISMATCH',
  'RPC rejects a foreign L3 position'
);

select lives_ok(
  $$
    select public.set_item_primary_location(
      '39000000-0000-0000-0000-000000000001',
      null
    )
  $$,
  'RPC accepts null and removes the primary location'
);

select is(
  (
    select count(*)::integer
    from public.item_location
    where item_id = '39000000-0000-0000-0000-000000000001'
      and czy_glowna
  ),
  0,
  'RPC with null leaves no primary location'
);

set local "request.jwt.claims" =
  '{"sub":"15000000-0000-0000-0000-000000000002","role":"authenticated"}';

select throws_ok(
  $$
    insert into public.item (
      household_id,
      category_id,
      nazwa,
      typ,
      status,
      created_by_id
    )
    select
      '25000000-0000-0000-0000-000000000001',
      c.id,
      'M4A Member Item',
      'unikalny',
      'w domu',
      '15000000-0000-0000-0000-000000000002'
    from public.category as c
    where c.key = 'tools'
  $$,
  '42501',
  null,
  'member does not receive full item CRUD'
);

set local "request.jwt.claims" =
  '{"sub":"15000000-0000-0000-0000-000000000003","role":"authenticated"}';

select throws_ok(
  $$
    insert into public.item (
      household_id,
      category_id,
      nazwa,
      typ,
      status,
      created_by_id
    )
    select
      '25000000-0000-0000-0000-000000000001',
      c.id,
      'M4A Child Item',
      'unikalny',
      'w domu',
      '15000000-0000-0000-0000-000000000003'
    from public.category as c
    where c.key = 'tools'
  $$,
  '42501',
  null,
  'child does not receive full item CRUD'
);

set local "request.jwt.claims" =
  '{"sub":"15000000-0000-0000-0000-000000000002","role":"authenticated"}';

select throws_ok(
  $$
    select public.set_item_primary_location(
      '39000000-0000-0000-0000-000000000002',
      '38000000-0000-0000-0000-000000000001'
    )
  $$,
  'P0001',
  'ADMIN_REQUIRED',
  'member cannot use the primary-location RPC'
);

set local "request.jwt.claims" =
  '{"sub":"15000000-0000-0000-0000-000000000001","role":"authenticated"}';

select lives_ok(
  $$
    update public.item
    set status = 'archiwalne'
    where id = '39000000-0000-0000-0000-000000000001'
  $$,
  'admin can archive an item in the own household'
);

select is(
  (
    select status
    from public.item
    where id = '39000000-0000-0000-0000-000000000001'
  ),
  'archiwalne'::public.item_status,
  'archiving changes status instead of deleting the item'
);

set local "request.jwt.claims" =
  '{"sub":"15000000-0000-0000-0000-000000000004","role":"authenticated"}';

select is(
  (
    select count(*)::integer
    from public.item
    where id = '39000000-0000-0000-0000-000000000002'
  ),
  0,
  'another household cannot see the item'
);

select lives_ok(
  $$
    update public.item
    set status = 'archiwalne'
    where id = '39000000-0000-0000-0000-000000000002'
  $$,
  'another household cannot archive a foreign item'
);

set local "request.jwt.claims" =
  '{"sub":"15000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is(
  (
    select status
    from public.item
    where id = '39000000-0000-0000-0000-000000000002'
  ),
  'w domu'::public.item_status,
  'foreign archive attempt does not change the item'
);

reset role;
set local "request.jwt.claims" = '{}';

select * from finish();
rollback;
