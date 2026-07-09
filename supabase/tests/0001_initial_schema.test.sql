begin;

create extension if not exists pgtap with schema extensions;
set search_path = extensions, public;

select plan(28);

select has_table('public', 'household', 'household exists');
select has_table('public', 'profile', 'profile exists');
select has_table('public', 'room', 'room exists');
select has_table('public', 'storage_location_l2', 'storage_location_l2 exists');
select has_table('public', 'storage_location_l3', 'storage_location_l3 exists');
select has_table('public', 'category', 'category exists');
select has_table('public', 'item', 'item exists');
select has_table('public', 'item_location', 'item_location exists');
select has_table('public', 'file', 'file exists');
select has_table('public', 'log', 'log exists');

select has_column('public', 'category', 'key', 'category.key exists');
select hasnt_column(
  'public',
  'category',
  'system_key',
  'category.system_key does not exist'
);
select has_column(
  'public',
  'storage_location_l3',
  'identyfikator_qr',
  'future QR field exists'
);
select has_column(
  'public',
  'storage_location_l3',
  'identyfikator_nfc',
  'future NFC field exists'
);
select has_column(
  'public',
  'item',
  'przechowywany_w_sejfie',
  'future vault flag exists'
);
select hasnt_table('public', 'vault_document', 'vault table is outside MVP');

select results_eq(
  $$
    select key
    from public.category
    where czy_systemowa
    order by key
  $$,
  $$
    values
      ('books'::text),
      ('documents'::text),
      ('electronics'::text),
      ('food'::text),
      ('medicines'::text),
      ('spare_parts'::text),
      ('tools'::text),
      ('winter_clothes'::text)
  $$,
  'system category keys are stable'
);

select is(
  (
    select count(*)::integer
    from public.category
    where czy_systemowa
      and household_id is null
      and key is not null
  ),
  8,
  'all system categories have a key and no household'
);

select is(
  (
    select count(*)::integer
    from pg_class as c
    join pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
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
      and c.relrowsecurity
  ),
  10,
  'RLS is enabled on every public MVP table'
);

select has_function(
  'public',
  'set_updated_at',
  array[]::text[],
  'updated_at trigger function exists'
);

select col_not_null('public', 'profile', 'household_id');
select col_not_null('public', 'profile', 'rola');
select col_not_null('public', 'item', 'household_id');
select col_not_null('public', 'item', 'created_by_id');
select col_has_default('public', 'household', 'id');
select col_has_default('public', 'household', 'kod_zaproszenia');
select col_has_default('public', 'item', 'przechowywany_w_sejfie');
select fk_ok(
  'public',
  'profile',
  'household_id',
  'public',
  'household',
  'id',
  'profile belongs to household'
);

select * from finish();
rollback;

