-- Cel:
-- Utrzymac recznie wybrane ikony podczas kopiowania Pomieszczenia wraz
-- z Meblami (L2) i Schowkami (L3).
--
-- Wplyw na dane:
-- Nowe kopie zachowuja ikona rekordu zrodlowego, w tym NULL. Nie zapisujemy
-- fallbackow renderera.
--
-- Bezpieczenstwo:
-- CREATE OR REPLACE zachowuje sygnature, SECURITY INVOKER, search_path i
-- granty funkcji z migracji 0016_m4c1_copy_entities_v2.sql.

create or replace function public.copy_room_with_structure(
  p_room_id uuid,
  p_name text,
  p_copy_structure boolean default true
)
returns table (
  new_room_id uuid,
  copied_furniture_count integer,
  copied_storage_count integer,
  copied_name text
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_household_id uuid := public.current_household_id();
  v_source_room public.room%rowtype;
  v_source_furniture public.storage_location_l2%rowtype;
  v_source_storage public.storage_location_l3%rowtype;
  v_new_room_id uuid := gen_random_uuid();
  v_new_furniture_id uuid;
  v_name text;
  v_code record;
  v_furniture_count integer := 0;
  v_storage_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if v_household_id is null then
    raise exception 'ACTIVE_PROFILE_REQUIRED';
  end if;
  if public.current_profile_role() <> 'admin'
    or not public.is_household_admin(v_household_id) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  select * into v_source_room
  from public.room
  where id = p_room_id and household_id = v_household_id
  for key share;
  if not found then
    raise exception 'SOURCE_NOT_AVAILABLE';
  end if;

  perform pg_advisory_xact_lock(hashtext('m4c1-copy-code:' || v_household_id::text)::bigint);
  v_name := public.m4c1_copy_room_name(v_household_id, p_name);

  insert into public.room (id, household_id, nazwa, typ, ikona, opis, "kolejność")
  values (
    v_new_room_id,
    v_household_id,
    v_name,
    v_source_room.typ,
    v_source_room.ikona,
    v_source_room.opis,
    coalesce((select max("kolejność") + 1 from public.room where household_id = v_household_id), 0)
  );

  if p_copy_structure then
    for v_source_furniture in
      select * from public.storage_location_l2
      where room_id = v_source_room.id
      order by "kolejność", created_at
    loop
      v_new_furniture_id := gen_random_uuid();
      insert into public.storage_location_l2 (
        id, room_id, nazwa, typ, ikona, opis, "kolejność"
      ) values (
        v_new_furniture_id,
        v_new_room_id,
        v_source_furniture.nazwa,
        v_source_furniture.typ,
        v_source_furniture.ikona,
        v_source_furniture.opis,
        v_source_furniture."kolejność"
      );
      v_furniture_count := v_furniture_count + 1;

      for v_source_storage in
        select * from public.storage_location_l3
        where storage_location_l2_id = v_source_furniture.id
        order by "kolejność", created_at
      loop
        if nullif(btrim(v_source_storage.nazwa), '') is null then
          raise exception 'SOURCE_STORAGE_NAME_INVALID';
        end if;

        select * into v_code from public.m4c1_next_location_code(
          v_household_id,
          v_name,
          v_source_room.typ,
          v_source_furniture.nazwa,
          v_source_furniture.typ,
          v_source_storage.nazwa,
          v_source_storage."kolejność"
        );

        insert into public.storage_location_l3 (
          id, storage_location_l2_id, nazwa, ikona, opis, kod_lokalizacji, "kolejność"
        ) values (
          gen_random_uuid(),
          v_new_furniture_id,
          v_source_storage.nazwa,
          v_source_storage.ikona,
          v_source_storage.opis,
          v_code.kod_lokalizacji,
          v_code.kolejność
        );
        v_storage_count := v_storage_count + 1;
      end loop;
    end loop;
  end if;

  return query select v_new_room_id, v_furniture_count, v_storage_count, v_name;
end;
$$;
