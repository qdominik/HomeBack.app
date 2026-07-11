begin;

create extension if not exists pgtap with schema extensions;
set search_path = extensions, public, auth;

select plan(14);

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
    '14000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'inventory-admin-a@example.test',
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
    '14000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'inventory-admin-b@example.test',
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
  ('24000000-0000-0000-0000-000000000001', 'Dom Inventory A', 'dom'),
  ('24000000-0000-0000-0000-000000000002', 'Dom Inventory B', 'mieszkanie');

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
    '14000000-0000-0000-0000-000000000001',
    '24000000-0000-0000-0000-000000000001',
    'Inventory Admin A',
    'inventory-admin-a@example.test',
    'admin',
    'aktywny'
  ),
  (
    '14000000-0000-0000-0000-000000000002',
    '24000000-0000-0000-0000-000000000002',
    'Inventory Admin B',
    'inventory-admin-b@example.test',
    'admin',
    'aktywny'
  );

insert into public.room (id, household_id, nazwa, typ, "kolejność")
values
  (
    '25000000-0000-0000-0000-000000000001',
    '24000000-0000-0000-0000-000000000001',
    'Garaż A',
    'Garaż',
    1
  ),
  (
    '25000000-0000-0000-0000-000000000002',
    '24000000-0000-0000-0000-000000000002',
    'Garaż B',
    'Garaż',
    1
  );

insert into public.storage_location_l2 (id, room_id, nazwa, typ, "kolejność")
values
  (
    '26000000-0000-0000-0000-000000000001',
    '25000000-0000-0000-0000-000000000001',
    'Regał A',
    'Regał',
    1
  ),
  (
    '26000000-0000-0000-0000-000000000002',
    '25000000-0000-0000-0000-000000000002',
    'Regał B',
    'Regał',
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
    '27000000-0000-0000-0000-000000000001',
    '26000000-0000-0000-0000-000000000001',
    'Półka A',
    'GAR-REG-A01',
    1
  ),
  (
    '27000000-0000-0000-0000-000000000002',
    '26000000-0000-0000-0000-000000000002',
    'Półka B',
    'GAR-REG-B01',
    1
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
    '28000000-0000-0000-0000-000000000001',
    '24000000-0000-0000-0000-000000000001',
    'Warsztat A',
    false,
    true
  ),
  (
    '28000000-0000-0000-0000-000000000002',
    '24000000-0000-0000-0000-000000000002',
    'Warsztat B',
    false,
    true
  );

insert into public.item (
  id,
  household_id,
  category_id,
  nazwa,
  opis,
  typ,
  status,
  created_by_id
)
values
  (
    '29000000-0000-0000-0000-000000000001',
    '24000000-0000-0000-0000-000000000001',
    '28000000-0000-0000-0000-000000000001',
    'Latarka domowa',
    'Światło do garażu',
    'unikalny',
    'w domu',
    '14000000-0000-0000-0000-000000000001'
  ),
  (
    '29000000-0000-0000-0000-000000000002',
    '24000000-0000-0000-0000-000000000002',
    '28000000-0000-0000-0000-000000000002',
    'Latarka obca',
    'Światło do obcego garażu',
    'unikalny',
    'w domu',
    '14000000-0000-0000-0000-000000000002'
  );

insert into public.item_location (
  item_id,
  storage_location_l3_id,
  czy_glowna
)
values
  (
    '29000000-0000-0000-0000-000000000001',
    '27000000-0000-0000-0000-000000000001',
    true
  ),
  (
    '29000000-0000-0000-0000-000000000002',
    '27000000-0000-0000-0000-000000000002',
    true
  );

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"14000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is(
  (select count(*)::integer from public.item),
  1,
  'item list contains only the current household item'
);

select is(
  (select count(*)::integer from public.category where not czy_systemowa),
  1,
  'custom category options contain only the current household category'
);

select is(
  (select count(*)::integer from public.room),
  1,
  'room options contain only the current household room'
);

select is(
  (select count(*)::integer from public.storage_location_l2),
  1,
  'storage options contain only the current household storage location'
);

select is(
  (select count(*)::integer from public.storage_location_l3),
  1,
  'position options contain only the current household position'
);

select is(
  (select count(*)::integer from public.item_location),
  1,
  'item locations contain only the current household association'
);

select is(
  (
    select count(*)::integer
    from public.item
    where category_id = '28000000-0000-0000-0000-000000000001'
  ),
  1,
  'category filter returns the matching own item'
);

select is(
  (
    select count(*)::integer
    from public.item
    where category_id = '28000000-0000-0000-0000-000000000002'
  ),
  0,
  'category filter cannot reveal a foreign item'
);

select is(
  (
    select count(*)::integer
    from public.item as i
    join public.item_location as il on il.item_id = i.id
    join public.storage_location_l3 as l3 on l3.id = il.storage_location_l3_id
    join public.storage_location_l2 as l2 on l2.id = l3.storage_location_l2_id
    join public.room as r on r.id = l2.room_id
    where r.id = '25000000-0000-0000-0000-000000000001'
  ),
  1,
  'room filter returns the matching own item'
);

select is(
  (
    select count(*)::integer
    from public.item as i
    join public.item_location as il on il.item_id = i.id
    where il.storage_location_l3_id = '27000000-0000-0000-0000-000000000002'
  ),
  0,
  'position filter cannot reveal a foreign item'
);

select is(
  (
    select count(*)::integer
    from public.item
    where nazwa ilike '%latarka%'
  ),
  1,
  'name search cannot reveal a foreign item'
);

select is(
  (
    select count(*)::integer
    from public.item
    where opis ilike '%garażu%'
  ),
  1,
  'description search cannot reveal a foreign item'
);

select is(
  (
    select count(*)::integer
    from public.item as i
    join public.item_location as il on il.item_id = i.id
    join public.storage_location_l3 as l3 on l3.id = il.storage_location_l3_id
    where l3.kod_lokalizacji ilike '%A01%'
  ),
  1,
  'location-code search returns the own matching item'
);

select is(
  (
    select count(*)::integer
    from public.item as i
    join public.item_location as il on il.item_id = i.id
    join public.storage_location_l3 as l3 on l3.id = il.storage_location_l3_id
    where l3.kod_lokalizacji ilike '%B01%'
  ),
  0,
  'location-code search cannot reveal a foreign item'
);

select * from finish();
rollback;
