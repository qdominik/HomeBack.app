begin;

create extension if not exists pgtap with schema extensions;
set search_path = extensions, public, auth;

select plan(48);

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
    'itemphoto-admin-a@example.test',
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
    'itemphoto-member-a@example.test',
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
    'itemphoto-child-a@example.test',
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
    'itemphoto-admin-b@example.test',
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
  ('21000000-0000-0000-0000-000000000001', 'Dom A', 'dom'),
  ('21000000-0000-0000-0000-000000000002', 'Dom B', 'mieszkanie');

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
    'itemphoto-admin-a@example.test',
    'admin',
    'aktywny'
  ),
  (
    '11000000-0000-0000-0000-000000000002',
    '21000000-0000-0000-0000-000000000001',
    'Domownik A',
    'itemphoto-member-a@example.test',
    'domownik',
    'aktywny'
  ),
  (
    '11000000-0000-0000-0000-000000000003',
    '21000000-0000-0000-0000-000000000001',
    'Dziecko A',
    'itemphoto-child-a@example.test',
    'dziecko',
    'aktywny'
  ),
  (
    '11000000-0000-0000-0000-000000000004',
    '21000000-0000-0000-0000-000000000002',
    'Admin B',
    'itemphoto-admin-b@example.test',
    'admin',
    'aktywny'
  );

insert into storage.objects (bucket_id, name, owner)
values
  (
    'item-photos',
    'households/21000000-0000-0000-0000-000000000001/items/31000000-0000-0000-0000-000000000001/photo.jpg',
    '11000000-0000-0000-0000-000000000001'
  ),
  (
    'item-photos',
    'households/21000000-0000-0000-0000-000000000001/item-photo-drafts/31000000-0000-0000-0000-000000000002/photo.jpg',
    '11000000-0000-0000-0000-000000000001'
  ),
  (
    'item-photos',
    'households/21000000-0000-0000-0000-000000000002/items/31000000-0000-0000-0000-000000000001/photo.jpg',
    '11000000-0000-0000-0000-000000000004'
  );

select is(
  public.item_photo_storage_household_id(
    'households/21000000-0000-0000-0000-000000000001/items/31000000-0000-0000-0000-000000000001/photo.jpg'
  ),
  '21000000-0000-0000-0000-000000000001'::uuid,
  'final photo path yields the household id'
);

select is(
  public.item_photo_storage_household_id(
    'households/21000000-0000-0000-0000-000000000002/items/31000000-0000-0000-0000-000000000001/photo.jpg'
  ),
  '21000000-0000-0000-0000-000000000002'::uuid,
  'final photo path of another household yields its own id'
);

select is(
  public.item_photo_storage_household_id(
    'households/21000000-0000-0000-0000-000000000001/item-photo-drafts/31000000-0000-0000-0000-000000000002/photo.jpg'
  ),
  '21000000-0000-0000-0000-000000000001'::uuid,
  'draft photo path yields the household id'
);

select is(
  public.item_photo_storage_household_id(
    'households/21000000-0000-0000-0000-000000000001'
  ),
  null::uuid,
  'path without a trailing segment yields null'
);

select is(
  public.item_photo_storage_household_id(
    'households/not-a-uuid/items/photo.jpg'
  ),
  null::uuid,
  'malformed household uuid yields null'
);

select is(
  public.item_photo_storage_household_id(
    'photos/households/21000000-0000-0000-0000-000000000001/photo.jpg'
  ),
  null::uuid,
  'path with a foreign prefix yields null'
);

select ok(
  public.item_photo_storage_household_id(null::text) is null,
  'null input yields null'
);

select is(
  public.item_photo_storage_household_id(
    'households/21000000-0000-0000-0000-000000000001/items/31000000-0000-0000-0000-000000000001/photo.webp'
  ),
  '21000000-0000-0000-0000-000000000001'::uuid,
  'webp file name still parses the household id'
);

select is(
  (select public from storage.buckets where id = 'item-photos'),
  false,
  'item-photos bucket is private'
);

select is(
  (select file_size_limit from storage.buckets where id = 'item-photos'),
  2097152::bigint,
  'item-photos bucket enforces the 2 MB size limit'
);

select is(
  (select allowed_mime_types from storage.buckets where id = 'item-photos'),
  array['image/jpeg', 'image/webp']::text[],
  'item-photos bucket allows only jpeg and webp'
);

select is(
  (
    select p.prosecdef
    from pg_proc as p
    where p.oid = 'public.item_photo_storage_household_id(text)'::regprocedure
  ),
  true,
  'household parser is security definer'
);

select ok(
  (
    select p.proconfig @> array['search_path=""']
    from pg_proc as p
    where p.oid = 'public.item_photo_storage_household_id(text)'::regprocedure
  ),
  'household parser has an empty search_path'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'item_photos_select_household_adult'
  ),
  1,
  'select policy exists on storage.objects'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'item_photos_insert_admin'
  ),
  1,
  'insert policy exists on storage.objects'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'item_photos_update_admin'
  ),
  1,
  'update policy exists on storage.objects'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'item_photos_delete_admin'
  ),
  1,
  'delete policy exists on storage.objects'
);

select is(
  (
    select cmd
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'item_photos_select_household_adult'
  ),
  'SELECT',
  'select policy applies to SELECT'
);

select is(
  (
    select cmd
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'item_photos_insert_admin'
  ),
  'INSERT',
  'insert policy applies to INSERT'
);

select is(
  (
    select cmd
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'item_photos_update_admin'
  ),
  'UPDATE',
  'update policy applies to UPDATE'
);

select is(
  (
    select cmd
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'item_photos_delete_admin'
  ),
  'DELETE',
  'delete policy applies to DELETE'
);

select is(
  (
    select roles::text[]
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'item_photos_select_household_adult'
  ),
  array['authenticated']::text[],
  'select policy targets authenticated only'
);

select is(
  (
    select roles::text[]
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'item_photos_insert_admin'
  ),
  array['authenticated']::text[],
  'insert policy targets authenticated only'
);

select is(
  (
    select roles::text[]
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'item_photos_update_admin'
  ),
  array['authenticated']::text[],
  'update policy targets authenticated only'
);

select is(
  (
    select roles::text[]
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'item_photos_delete_admin'
  ),
  array['authenticated']::text[],
  'delete policy targets authenticated only'
);

set local role authenticated;
set local "request.jwt.claims" =
  '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'item-photos'
  ),
  2,
  'admin sees both objects of the own household'
);

select is(
  (
    select count(*)::integer
    from storage.objects
    where name like 'households/21000000-0000-0000-0000-000000000002/%'
  ),
  0,
  'admin never sees objects of a foreign household'
);

set local "request.jwt.claims" =
  '{"sub":"11000000-0000-0000-0000-000000000002","role":"authenticated"}';

select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'item-photos'
  ),
  2,
  'member sees the household objects'
);

set local "request.jwt.claims" =
  '{"sub":"11000000-0000-0000-0000-000000000003","role":"authenticated"}';

select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'item-photos'
  ),
  0,
  'child sees no household objects'
);

set local "request.jwt.claims" =
  '{"sub":"11000000-0000-0000-0000-000000000004","role":"authenticated"}';

select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'item-photos'
  ),
  1,
  'admin of another household sees only its own objects'
);

set local "request.jwt.claims" =
  '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}';

select lives_ok(
  $$
    insert into storage.objects (bucket_id, name, owner)
    values (
      'item-photos',
      'households/21000000-0000-0000-0000-000000000001/items/31000000-0000-0000-0000-000000000003/photo.jpg',
      '11000000-0000-0000-0000-000000000001'
    )
  $$,
  'admin can store a final photo in the own household'
);

select lives_ok(
  $$
    insert into storage.objects (bucket_id, name, owner)
    values (
      'item-photos',
      'households/21000000-0000-0000-0000-000000000001/item-photo-drafts/31000000-0000-0000-0000-000000000004/photo.jpg',
      '11000000-0000-0000-0000-000000000001'
    )
  $$,
  'admin can store a draft photo in the own household'
);

select throws_ok(
  $$
    insert into storage.objects (bucket_id, name, owner)
    values (
      'item-photos',
      'households/21000000-0000-0000-0000-000000000002/items/31000000-0000-0000-0000-000000000005/photo.jpg',
      '11000000-0000-0000-0000-000000000001'
    )
  $$,
  '42501',
  null,
  'admin cannot store a photo into a foreign household'
);

set local "request.jwt.claims" =
  '{"sub":"11000000-0000-0000-0000-000000000002","role":"authenticated"}';

select throws_ok(
  $$
    insert into storage.objects (bucket_id, name, owner)
    values (
      'item-photos',
      'households/21000000-0000-0000-0000-000000000001/items/31000000-0000-0000-0000-000000000006/photo.jpg',
      '11000000-0000-0000-0000-000000000002'
    )
  $$,
  '42501',
  null,
  'member cannot store a photo'
);

set local "request.jwt.claims" =
  '{"sub":"11000000-0000-0000-0000-000000000003","role":"authenticated"}';

select throws_ok(
  $$
    insert into storage.objects (bucket_id, name, owner)
    values (
      'item-photos',
      'households/21000000-0000-0000-0000-000000000001/items/31000000-0000-0000-0000-000000000007/photo.jpg',
      '11000000-0000-0000-0000-000000000003'
    )
  $$,
  '42501',
  null,
  'child cannot store a photo'
);

set local "request.jwt.claims" =
  '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}';

select lives_ok(
  $$
    update storage.objects
    set metadata = '{"updated": true}'::jsonb
    where name = 'households/21000000-0000-0000-0000-000000000001/items/31000000-0000-0000-0000-000000000001/photo.jpg'
  $$,
  'admin can update metadata of an own object'
);

select throws_ok(
  $$
    update storage.objects
    set name = 'households/21000000-0000-0000-0000-000000000002/items/31000000-0000-0000-0000-000000000009/photo.jpg'
    where name = 'households/21000000-0000-0000-0000-000000000001/items/31000000-0000-0000-0000-000000000001/photo.jpg'
  $$,
  '42501',
  null,
  'with-check blocks moving an own object to a foreign household'
);

select lives_ok(
  $$
    update storage.objects
    set metadata = '{"touched": true}'::jsonb
    where name = 'households/21000000-0000-0000-0000-000000000002/items/31000000-0000-0000-0000-000000000001/photo.jpg'
  $$,
  'update of a foreign object is safely ignored'
);

select ok(
  (
    select metadata
    from storage.objects
    where name = 'households/21000000-0000-0000-0000-000000000002/items/31000000-0000-0000-0000-000000000001/photo.jpg'
  ) is null,
  'foreign object remains unchanged'
);

set local "request.jwt.claims" =
  '{"sub":"11000000-0000-0000-0000-000000000002","role":"authenticated"}';

select lives_ok(
  $$
    update storage.objects
    set metadata = '{"member": true}'::jsonb
    where name = 'households/21000000-0000-0000-0000-000000000001/items/31000000-0000-0000-0000-000000000001/photo.jpg'
  $$,
  'member update of a household object is safely ignored'
);

select is(
  (
    select metadata
    from storage.objects
    where name = 'households/21000000-0000-0000-0000-000000000001/items/31000000-0000-0000-0000-000000000001/photo.jpg'
  ),
  '{"updated": true}'::jsonb,
  'member attempt does not change the object'
);

set local storage.allow_delete_query = 'true';
set local "request.jwt.claims" =
  '{"sub":"11000000-0000-0000-0000-000000000002","role":"authenticated"}';

select lives_ok(
  $$
    delete from storage.objects
    where name = 'households/21000000-0000-0000-0000-000000000001/item-photo-drafts/31000000-0000-0000-0000-000000000002/photo.jpg'
  $$,
  'member delete of a household object is safely ignored'
);

select is(
  (
    select count(*)::integer
    from storage.objects
    where name = 'households/21000000-0000-0000-0000-000000000001/item-photo-drafts/31000000-0000-0000-0000-000000000002/photo.jpg'
  ),
  1,
  'draft still exists after the member attempt'
);

set local "request.jwt.claims" =
  '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}';

select lives_ok(
  $$
    delete from storage.objects
    where name = 'households/21000000-0000-0000-0000-000000000001/item-photo-drafts/31000000-0000-0000-0000-000000000002/photo.jpg'
  $$,
  'admin can delete an own draft object'
);

select is(
  (
    select count(*)::integer
    from storage.objects
    where name = 'households/21000000-0000-0000-0000-000000000001/item-photo-drafts/31000000-0000-0000-0000-000000000002/photo.jpg'
  ),
  0,
  'draft is removed'
);

select lives_ok(
  $$
    delete from storage.objects
    where name = 'households/21000000-0000-0000-0000-000000000002/items/31000000-0000-0000-0000-000000000001/photo.jpg'
  $$,
  'delete of a foreign object is safely ignored'
);

set local "request.jwt.claims" =
  '{"sub":"11000000-0000-0000-0000-000000000004","role":"authenticated"}';

select is(
  (
    select count(*)::integer
    from storage.objects
    where name = 'households/21000000-0000-0000-0000-000000000002/items/31000000-0000-0000-0000-000000000001/photo.jpg'
  ),
  1,
  'foreign object survives and stays visible to its own household'
);

set local "request.jwt.claims" =
  '{"sub":"11000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is(
  (
    select count(*)::integer
    from storage.objects
    where bucket_id = 'item-photos'
  ),
  3,
  'final visible object set matches the performed operations'
);

reset role;
set local "request.jwt.claims" = '{}';

select * from finish();
rollback;
