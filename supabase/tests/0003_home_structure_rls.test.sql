begin;

create extension if not exists pgtap with schema extensions;
set search_path = extensions, public, auth;

select plan(27);

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
    '11000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'm2-admin-a@example.test',
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
    '11000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'm2-member-a@example.test',
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
    '11000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'm2-child-a@example.test',
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
    '11000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'm2-admin-b@example.test',
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
  ('21000000-0000-0000-0000-000000000001', 'Dom M2 A', 'dom'),
  ('21000000-0000-0000-0000-000000000002', 'Dom M2 B', 'mieszkanie');

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
    '11000000-0000-0000-0000-000000000001',
    '21000000-0000-0000-0000-000000000001',
    'Admin A',
    'm2-admin-a@example.test',
    'admin',
    'aktywny'
  ),
  (
    '11000000-0000-0000-0000-000000000002',
    '21000000-0000-0000-0000-000000000001',
    'Domownik A',
    'm2-member-a@example.test',
    'domownik',
    'aktywny'
  ),
  (
    '11000000-0000-0000-0000-000000000003',
    '21000000-0000-0000-0000-000000000001',
    'Dziecko A',
    'm2-child-a@example.test',
    'dziecko',
    'aktywny'
  ),
  (
    '11000000-0000-0000-0000-000000000004',
    '21000000-0000-0000-0000-000000000002',
    'Admin B',
    'm2-admin-b@example.test',
    'admin',
    'aktywny'
  );

insert into public.room (
  id,
  household_id,
  nazwa,
  typ,
  "kolejność"
)
values
  (
    '22000000-0000-0000-0000-000000000001',
    '21000000-0000-0000-0000-000000000001',
    'Kuchnia A',
    'Kuchnia',
    1
  ),
  (
    '22000000-0000-0000-0000-000000000002',
    '21000000-0000-0000-0000-000000000002',
    'Kuchnia B',
    'Kuchnia',
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
    '23000000-0000-0000-0000-000000000001',
    '22000000-0000-0000-0000-000000000001',
    'Szafka A',
    'Szafa',
    1
  ),
  (
    '23000000-0000-0000-0000-000000000002',
    '22000000-0000-0000-0000-000000000002',
    'Szafka B',
    'Szafa',
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
    '24000000-0000-0000-0000-000000000001',
    '23000000-0000-0000-0000-000000000001',
    'Gorna polka A',
    'KUC-SZA-GOR1',
    1
  ),
  (
    '24000000-0000-0000-0000-000000000002',
    '23000000-0000-0000-0000-000000000002',
    'Gorna polka B',
    'KUC-SZA-GOR1',
    1
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
  '25000000-0000-0000-0000-000000000001',
  '21000000-0000-0000-0000-000000000001',
  (select id from public.category where key = 'books'),
  'Ksiazka M2',
  'unikalny',
  'w domu',
  '11000000-0000-0000-0000-000000000001'
);

insert into public.item_location (
  item_id,
  storage_location_l3_id,
  czy_glowna
)
values (
  '25000000-0000-0000-0000-000000000001',
  '24000000-0000-0000-0000-000000000001',
  true
);

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is(
  (select count(*)::integer from public.room),
  1,
  'admin sees only own rooms'
);

select is(
  (select count(*)::integer from public.storage_location_l2),
  1,
  'admin sees only own L2 locations through room'
);

select is(
  (select count(*)::integer from public.storage_location_l3),
  1,
  'admin sees only own L3 locations through L2 and room'
);

select lives_ok(
  $$
    insert into public.room (
      household_id,
      nazwa,
      typ,
      "kolejność"
    )
    values (
      '21000000-0000-0000-0000-000000000001',
      'Przedpokoj A',
      'Przedpokój',
      2
    )
  $$,
  'admin can create room with custom room kind in own household'
);

select lives_ok(
  $$
    insert into public.storage_location_l2 (
      room_id,
      nazwa,
      typ,
      ikona,
      "kolejność"
    )
    values (
      '22000000-0000-0000-0000-000000000001',
      'Lozko goscinne',
      'Łóżko rozkładane',
      'bedroom',
      2
    )
  $$,
  'admin can create L2 location with custom storage kind'
);

select lives_ok(
  $$
    update public.storage_location_l2
    set ikona = 'dresser'
    where id = '23000000-0000-0000-0000-000000000001'
  $$,
  'admin can update an icon on own L2 location'
);

select is(
  (
    select ikona
    from public.storage_location_l2
    where id = '23000000-0000-0000-0000-000000000001'
  ),
  'dresser',
  'admin reads own saved L2 icon'
);

select lives_ok(
  $$
    update public.storage_location_l3
    set ikona = 'drawer'
    where id = '24000000-0000-0000-0000-000000000001'
  $$,
  'admin can update an icon on own L3 location'
);

select is(
  (
    select ikona
    from public.storage_location_l3
    where id = '24000000-0000-0000-0000-000000000001'
  ),
  'drawer',
  'admin reads own saved L3 icon'
);

select lives_ok(
  $$
    insert into public.storage_location_l2 (
      room_id,
      nazwa,
      typ,
      ikona,
      "kolejność"
    )
    values (
      '22000000-0000-0000-0000-000000000001',
      'Polka narozna',
      'Półka narożna',
      'shelf',
      3
    )
  $$,
  'admin can create L2 location with custom text kind'
);

select lives_ok(
  $$
    insert into public.room (
      household_id,
      nazwa,
      typ,
      "kolejność"
    )
    values (
      '21000000-0000-0000-0000-000000000001',
      'Pomieszczenie z rowerami',
      'Rowerownia',
      4
    )
  $$,
  'admin can create room with custom M3 room kind'
);

select lives_ok(
  $$
    insert into public.room (
      household_id,
      nazwa,
      typ,
      "kolejność"
    )
    values (
      '21000000-0000-0000-0000-000000000001',
      'Pokoj goscinny',
      'Pokój gościnny',
      5
    )
  $$,
  'admin can create room with M3 template room kind'
);

select lives_ok(
  $$
    insert into public.storage_location_l2 (
      room_id,
      nazwa,
      typ,
      ikona,
      "kolejność"
    )
    values (
      '22000000-0000-0000-0000-000000000001',
      'Komandor tarkin',
      'Komandor tarkin',
      'storage',
      4
    )
  $$,
  'admin can create L2 location with custom M3 storage kind'
);

select lives_ok(
  $$
    insert into public.storage_location_l2 (
      room_id,
      nazwa,
      typ,
      ikona,
      "kolejność"
    )
    values (
      '22000000-0000-0000-0000-000000000001',
      'Szafka narozna w kuchni',
      'Szafka narożna',
      'wardrobe',
      5
    )
  $$,
  'admin can create L2 location with M3 template storage kind'
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
      '21000000-0000-0000-0000-000000000002',
      'Salon B',
      'Salon',
      2
    )
  $$,
  '42501',
  null,
  'admin cannot create room in foreign household'
);

select throws_ok(
  $$
    insert into public.storage_location_l2 (
      room_id,
      nazwa,
      typ,
      ikona,
      "kolejność"
    )
    values (
      '22000000-0000-0000-0000-000000000002',
      'Obca szafa',
      'Szafa',
      'wardrobe',
      1
    )
  $$,
  '42501',
  null,
  'admin cannot attach L2 to foreign room'
);

select throws_ok(
  $$
    insert into public.storage_location_l3 (
      storage_location_l2_id,
      nazwa,
      kod_lokalizacji,
      ikona,
      "kolejność"
    )
    values (
      '23000000-0000-0000-0000-000000000002',
      'Obca polka',
      'KUC-SZA-OBC1',
      'shelf',
      1
    )
  $$,
  '42501',
  null,
  'admin cannot attach L3 to foreign L2'
);

set local "request.jwt.claims" =
  '{"sub":"11000000-0000-0000-0000-000000000002","role":"authenticated"}';

select is(
  (select count(*)::integer from public.room),
  4,
  'member can read own home structure with M3 template rooms'
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
      '21000000-0000-0000-0000-000000000001',
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
    insert into public.storage_location_l2 (
      room_id,
      nazwa,
      typ,
      "kolejność"
    )
    values (
      '22000000-0000-0000-0000-000000000001',
      'Domownik lozko',
      'Łóżko rozkładane',
      3
    )
  $$,
  '42501',
  null,
  'member cannot create L2 locations'
);

select lives_ok(
  $$
    update public.room
    set nazwa = 'Nieuprawniona zmiana'
    where id = '22000000-0000-0000-0000-000000000001'
  $$,
  'member update attempt is safely ignored'
);

select is(
  (
    select nazwa
    from public.room
    where id = '22000000-0000-0000-0000-000000000001'
  ),
  'Kuchnia A',
  'member cannot change room'
);

set local "request.jwt.claims" =
  '{"sub":"11000000-0000-0000-0000-000000000003","role":"authenticated"}';

select throws_ok(
  $$
    insert into public.room (
      household_id,
      nazwa,
      typ,
      "kolejność"
    )
    values (
      '21000000-0000-0000-0000-000000000001',
      'Pokoj dziecka',
      'Sypialnia',
      3
    )
  $$,
  '42501',
  null,
  'child cannot create rooms'
);

select throws_ok(
  $$
    insert into public.storage_location_l2 (
      room_id,
      nazwa,
      typ,
      "kolejność"
    )
    values (
      '22000000-0000-0000-0000-000000000001',
      'Dziecko lozko',
      'Łóżko rozkładane',
      3
    )
  $$,
  '42501',
  null,
  'child cannot create L2 locations'
);

set local "request.jwt.claims" =
  '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}';

select throws_ok(
  $$
    delete from public.room
    where id = '22000000-0000-0000-0000-000000000001'
  $$,
  '23503',
  null,
  'room with L2 locations cannot be deleted by database constraints'
);

select throws_ok(
  $$
    delete from public.storage_location_l2
    where id = '23000000-0000-0000-0000-000000000001'
  $$,
  '23503',
  null,
  'L2 with L3 positions cannot be deleted by database constraints'
);

select throws_ok(
  $$
    delete from public.storage_location_l3
    where id = '24000000-0000-0000-0000-000000000001'
  $$,
  '23503',
  null,
  'L3 used by item_location cannot be deleted by database constraints'
);

reset role;
set local "request.jwt.claims" = '{}';

select * from finish();
rollback;
