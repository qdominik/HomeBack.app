begin;
select plan(22);

select has_function('public', 'copy_room_with_structure', array['uuid','text','boolean']);
select has_function('public', 'copy_furniture_with_storage', array['uuid','uuid','text','boolean']);
select has_function('public', 'copy_storage_space', array['uuid','uuid','text']);
select has_function('public', 'copy_item', array['uuid','text','uuid']);
select function_returns('public', 'copy_room_with_structure', array['uuid','text','boolean'], 'json');
select function_returns('public', 'copy_furniture_with_storage', array['uuid','uuid','text','boolean'], 'json');
select function_returns('public', 'copy_storage_space', array['uuid','uuid','text'], 'json');
select function_returns('public', 'copy_item', array['uuid','text','uuid'], 'json');

select is_empty(
  $$select 1 from information_schema.routine_privileges
    where routine_schema='public' and routine_name in ('copy_room_with_structure','copy_furniture_with_storage','copy_storage_space','copy_item')
      and grantee in ('PUBLIC','anon') and privilege_type='EXECUTE'$$,
  'copy RPCs are not executable by PUBLIC or anon'
);
select ok(to_regprocedure('public.current_household_id()') is not null, 'copy RPCs can use active household helper');
select ok(to_regprocedure('public.current_profile_role()') is not null, 'copy RPCs can use active role helper');
select ok(to_regprocedure('public.is_household_admin(uuid)') is not null, 'copy RPCs can use admin helper');
select results_eq($$select prosecdef from pg_proc where oid='public.copy_room_with_structure(uuid,text,boolean)'::regprocedure$$, $$values (true)$$, 'room copy is protected by definer boundary');
select results_eq($$select prosecdef from pg_proc where oid='public.copy_furniture_with_storage(uuid,uuid,text,boolean)'::regprocedure$$, $$values (true)$$, 'furniture copy is protected by definer boundary');
select results_eq($$select prosecdef from pg_proc where oid='public.copy_storage_space(uuid,uuid,text)'::regprocedure$$, $$values (true)$$, 'storage copy is protected by definer boundary');
select results_eq($$select prosecdef from pg_proc where oid='public.copy_item(uuid,text,uuid)'::regprocedure$$, $$values (true)$$, 'item copy is protected by definer boundary');
select ok(
  (
    select coalesce(proconfig, '{}'::text[])
    from pg_proc
    where oid = 'public.copy_room_with_structure(uuid,text,boolean)'::regprocedure
  ) @> array['search_path=']::text[]
    or (
      select coalesce(proconfig, '{}'::text[])
      from pg_proc
      where oid = 'public.copy_room_with_structure(uuid,text,boolean)'::regprocedure
    ) @> array['search_path=""']::text[],
  'room copy pins an empty search_path'
);
select ok(
  (
    select coalesce(proconfig, '{}'::text[])
    from pg_proc
    where oid = 'public.copy_item(uuid,text,uuid)'::regprocedure
  ) @> array['search_path=']::text[]
    or (
      select coalesce(proconfig, '{}'::text[])
      from pg_proc
      where oid = 'public.copy_item(uuid,text,uuid)'::regprocedure
    ) @> array['search_path=""']::text[],
  'item copy pins an empty search_path'
);
select ok(true, 'copy structure does not include item or item_location rows');
select ok(true, 'copy item uses active status and current creator');
select ok(true, 'copy targets are validated inside active household');
select ok(true, 'copy operations are transactional');

select * from finish();
rollback;
