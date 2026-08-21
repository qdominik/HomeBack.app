-- Cel:
-- Utrzymac wybrane ikony podczas kopiowania mebli (L2) i schowkow (L3).
--
-- Wplyw na dane:
-- Nowe kopie otrzymuja ikona z rekordu zrodlowego, w tym NULL.
-- Pozostale pola, relacje, walidacja gospodarstwa i semantyka RPC pozostaja bez zmian.
--
-- Bezpieczenstwo:
-- CREATE OR REPLACE zachowuje sygnatury, SECURITY INVOKER, search_path i granty
-- z migracji 0016_m4c1_copy_entities_v2.sql.

create or replace function public.copy_furniture_with_storage(
  p_storage_location_l2_id uuid,
  p_target_room_id uuid,
  p_name text,
  p_copy_storage boolean default true
)
returns table (
  new_furniture_id uuid,
  copied_storage_count integer,
  copied_name text
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_household_id uuid := public.current_household_id();
  v_source public.storage_location_l2%rowtype;
  v_target_room public.room%rowtype;
  v_source_storage public.storage_location_l3%rowtype;
  v_new_id uuid := gen_random_uuid();
  v_name text;
  v_code record;
  v_storage_count integer := 0;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if v_household_id is null then raise exception 'ACTIVE_PROFILE_REQUIRED'; end if;
  if public.current_profile_role() <> 'admin'
    or not public.is_household_admin(v_household_id) then raise exception 'ADMIN_REQUIRED'; end if;

  select l2.* into v_source
  from public.storage_location_l2 as l2
  join public.room as r on r.id = l2.room_id
  where l2.id = p_storage_location_l2_id and r.household_id = v_household_id
  for key share of l2;
  if not found then raise exception 'SOURCE_NOT_AVAILABLE'; end if;

  select * into v_target_room
  from public.room
  where id = p_target_room_id and household_id = v_household_id
  for key share;
  if not found then raise exception 'TARGET_NOT_AVAILABLE'; end if;

  perform pg_advisory_xact_lock(hashtext('m4c1-copy-code:' || v_household_id::text)::bigint);
  v_name := public.m4c1_copy_furniture_name(v_target_room.id, p_name);

  insert into public.storage_location_l2 (
    id, room_id, nazwa, typ, ikona, opis, "kolejność"
  ) values (
    v_new_id,
    v_target_room.id,
    v_name,
    v_source.typ,
    v_source.ikona,
    v_source.opis,
    coalesce((select max("kolejność") + 1 from public.storage_location_l2 where room_id = v_target_room.id), 0)
  );

  if p_copy_storage then
    for v_source_storage in
      select * from public.storage_location_l3
      where storage_location_l2_id = v_source.id
      order by "kolejność", created_at
    loop
      if nullif(btrim(v_source_storage.nazwa), '') is null then
        raise exception 'SOURCE_STORAGE_NAME_INVALID';
      end if;

      select * into v_code from public.m4c1_next_location_code(
        v_household_id,
        v_target_room.nazwa,
        v_target_room.typ,
        v_name,
        v_source.typ,
        v_source_storage.nazwa,
        v_source_storage."kolejność"
      );
      insert into public.storage_location_l3 (
        id, storage_location_l2_id, nazwa, ikona, opis, kod_lokalizacji, "kolejność"
      ) values (
        gen_random_uuid(), v_new_id, v_source_storage.nazwa, v_source_storage.ikona,
        v_source_storage.opis, v_code.kod_lokalizacji, v_code.kolejność
      );
      v_storage_count := v_storage_count + 1;
    end loop;
  end if;

  return query select v_new_id, v_storage_count, v_name;
end;
$$;

create or replace function public.copy_storage_space(
  p_storage_location_l3_id uuid,
  p_target_storage_location_l2_id uuid,
  p_name text
)
returns table (new_storage_id uuid, copied_name text)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_household_id uuid := public.current_household_id();
  v_source public.storage_location_l3%rowtype;
  v_target_furniture public.storage_location_l2%rowtype;
  v_target_room public.room%rowtype;
  v_new_id uuid := gen_random_uuid();
  v_name text;
  v_code record;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if v_household_id is null then raise exception 'ACTIVE_PROFILE_REQUIRED'; end if;
  if public.current_profile_role() <> 'admin'
    or not public.is_household_admin(v_household_id) then raise exception 'ADMIN_REQUIRED'; end if;

  select l3.* into v_source
  from public.storage_location_l3 as l3
  join public.storage_location_l2 as l2 on l2.id = l3.storage_location_l2_id
  join public.room as r on r.id = l2.room_id
  where l3.id = p_storage_location_l3_id and r.household_id = v_household_id
  for key share of l3;
  if not found then raise exception 'SOURCE_NOT_AVAILABLE'; end if;

  if nullif(btrim(v_source.nazwa), '') is null then
    raise exception 'SOURCE_STORAGE_NAME_INVALID';
  end if;

  select l2.* into v_target_furniture
  from public.storage_location_l2 as l2
  join public.room as r on r.id = l2.room_id
  where l2.id = p_target_storage_location_l2_id and r.household_id = v_household_id
  for key share of l2;
  if not found then raise exception 'TARGET_NOT_AVAILABLE'; end if;

  select * into v_target_room
  from public.room where id = v_target_furniture.room_id
  for key share;

  perform pg_advisory_xact_lock(hashtext('m4c1-copy-code:' || v_household_id::text)::bigint);
  v_name := public.m4c1_copy_storage_name(v_target_furniture.id, p_name);
  select * into v_code from public.m4c1_next_location_code(
    v_household_id,
    v_target_room.nazwa,
    v_target_room.typ,
    v_target_furniture.nazwa,
    v_target_furniture.typ,
    v_name,
    coalesce((select max("kolejność") + 1 from public.storage_location_l3 where storage_location_l2_id = v_target_furniture.id), 0)
  );

  insert into public.storage_location_l3 (
    id, storage_location_l2_id, nazwa, ikona, opis, kod_lokalizacji, "kolejność"
  ) values (
    v_new_id, v_target_furniture.id, v_name, v_source.ikona, v_source.opis,
    v_code.kod_lokalizacji, v_code.kolejność
  );

  return query select v_new_id, v_name;
end;
$$;
