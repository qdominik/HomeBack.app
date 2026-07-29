-- M4C.1 v2: atomic copies of Rooms, Furniture, Storage spaces and Items.
-- Structure functions run as SECURITY INVOKER; copy_item is a narrowly scoped
-- SECURITY DEFINER exception because a household member may copy an Item while
-- existing RLS intentionally limits general Item creation to administrators.

create function public.m4c1_normalize_code_key(p_value text)
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select regexp_replace(
    translate(normalize(lower(coalesce(p_value, '')), NFD), 'ł', 'l'),
    '[^a-z0-9]',
    '',
    'g'
  );
$$;

create function public.m4c1_code_segment(p_value text)
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select coalesce(nullif(left(upper(public.m4c1_normalize_code_key(p_value)), 3), ''), 'INN');
$$;

create function public.m4c1_room_code(p_kind text, p_fallback_name text)
returns text
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  v_key text := public.m4c1_normalize_code_key(p_kind);
begin
  return case v_key
    when 'balkon' then 'BAL'
    when 'biuro' then 'BIU'
    when 'garaz' then 'GAR'
    when 'garderoba' then 'GDR'
    when 'inne' then 'INN'
    when 'korytarz' then 'KOR'
    when 'kotlownia' then 'KOT'
    when 'kuchnia' then 'KUC'
    when 'lazienka' then 'LAZ'
    when 'piwnica' then 'PIW'
    when 'pokojdziecka' then 'POD'
    when 'pokojgoscinny' then 'POG'
    when 'pralnia' then 'PRA'
    when 'przedpokoj' then 'PRZ'
    when 'salon' then 'SAL'
    when 'schowek' then 'SCH'
    when 'spizarnia' then 'SPI'
    when 'strych' then 'STR'
    when 'sypialnia' then 'SYP'
    when 'taras' then 'TAR'
    when 'wc' then 'WC'
    else public.m4c1_code_segment(coalesce(nullif(p_kind, ''), p_fallback_name))
  end;
end;
$$;

create function public.m4c1_furniture_code(p_kind text, p_fallback_name text)
returns text
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  v_key text := public.m4c1_normalize_code_key(p_kind);
begin
  return case v_key
    when 'biurko' then 'BIU'
    when 'inne' then 'INN'
    when 'komoda' then 'KOM'
    when 'kosz' then 'KOS'
    when 'lozko' then 'LOZ'
    when 'lozkorozkladane' then 'LOZ'
    when 'organizer' then 'ORG'
    when 'pawlacz' then 'PAW'
    when 'pojemnik' then 'POJ'
    when 'polka' then 'POL'
    when 'pudelko' then 'PUD'
    when 'regal' then 'REG'
    when 'regalwiszacy' then 'RGW'
    when 'skrzynka' then 'SKR'
    when 'sofa' then 'SOF'
    when 'stojak' then 'STO'
    when 'szafa' then 'SZA'
    when 'szafanarozna' then 'SZN'
    when 'szafkanarozna' then 'SZN'
    when 'szafka' then 'SZF'
    when 'szafkawiszaca' then 'SZW'
    when 'szuflada' then 'SZU'
    when 'torba' then 'TOR'
    when 'wieszak' then 'WIE'
    when 'szafkanocna' then 'SNC'
    when 'polkawiszaca' then 'PWI'
    when 'modulpolkowy' then 'MPO'
    when 'stol' then 'STO'
    when 'lawa' then 'LAW'
    when 'witryna' then 'WIT'
    when 'kredens' then 'KRE'
    when 'rtv' then 'RTV'
    when 'lodowka' then 'LOD'
    when 'zamrazarka' then 'ZAM'
    when 'sejf' then 'SEJ'
    when 'walizka' then 'WAL'
    when 'skrzynia' then 'SKR'
    when 'chestofdrawers' then 'KOM'
    when 'wardrobe' then 'SZA'
    when 'cabinet' then 'SZF'
    when 'bedsidetable' then 'SNC'
    when 'shelvingunit' then 'REG'
    when 'wallshelf' then 'PWI'
    when 'shelvingmodule' then 'MPO'
    when 'bed' then 'LOZ'
    when 'desk' then 'BIU'
    when 'table' then 'STO'
    when 'coffeetable' then 'LAW'
    when 'displaycabinet' then 'WIT'
    when 'cupboard' then 'KRE'
    when 'tvunit' then 'RTV'
    when 'refrigerator' then 'LOD'
    when 'freezer' then 'ZAM'
    when 'safe' then 'SEJ'
    when 'suitcase' then 'WAL'
    when 'storagechest' then 'SKR'
    else public.m4c1_code_segment(coalesce(nullif(p_kind, ''), p_fallback_name))
  end;
end;
$$;

create function public.m4c1_location_code(
  p_room_name text,
  p_room_type text,
  p_furniture_name text,
  p_furniture_type text,
  p_storage_name text,
  p_storage_order integer
)
returns text
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  v_storage_number text := substring(coalesce(p_storage_name, '') from '[0-9]+');
  v_storage_segment text := nullif(
    left(upper(public.m4c1_normalize_code_key(p_storage_name)), 3),
    ''
  );
begin
  return concat_ws(
    '-',
    public.m4c1_room_code(p_room_type, p_room_name),
    public.m4c1_furniture_code(p_furniture_type, p_furniture_name),
    coalesce(v_storage_segment, 'POZ')
      || coalesce(v_storage_number, greatest(coalesce(p_storage_order, 0), 0)::text)
  );
end;
$$;

create function public.m4c1_next_location_code(
  p_household_id uuid,
  p_room_name text,
  p_room_type text,
  p_furniture_name text,
  p_furniture_type text,
  p_storage_name text,
  p_initial_order integer
)
returns table (kod_lokalizacji text, kolejność integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_code text;
  v_order integer := greatest(coalesce(p_initial_order, 0), 0);
  v_initial_order integer := greatest(coalesce(p_initial_order, 0), 0);
  v_storage_segment text := coalesce(nullif(left(upper(public.m4c1_normalize_code_key(p_storage_name)), 3), ''), 'POZ');
begin
  loop
    if v_order = v_initial_order then
      v_code := public.m4c1_location_code(
        p_room_name,
        p_room_type,
        p_furniture_name,
        p_furniture_type,
        p_storage_name,
        v_order
      );
    else
      v_code := concat_ws(
        '-',
        public.m4c1_room_code(p_room_type, p_room_name),
        public.m4c1_furniture_code(p_furniture_type, p_furniture_name),
        v_storage_segment || v_order::text
      );
    end if;

    exit when not exists (
      select 1
      from public.storage_location_l3 as l3
      join public.storage_location_l2 as l2 on l2.id = l3.storage_location_l2_id
      join public.room as r on r.id = l2.room_id
      where r.household_id = p_household_id
        and l3.kod_lokalizacji = v_code
    );

    v_order := v_order + 1;
    if v_order > v_initial_order + 1000 then
      raise exception 'LOCATION_CODE_COLLISION_EXHAUSTED';
    end if;
  end loop;

  return query select v_code, v_order;
end;
$$;

create function public.m4c1_copy_name_root(p_name text)
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select nullif(
    btrim(
      regexp_replace(
        btrim(coalesce(p_name, '')),
        '[[:space:]]*—[[:space:]]*kopia([[:space:]]+[0-9]+)?[[:space:]]*$',
        '',
        'i'
      )
    ),
    ''
  );
$$;

create function public.m4c1_copy_room_name(p_household_id uuid, p_requested_name text)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_candidate text := nullif(btrim(p_requested_name), '');
  v_root text;
  v_suffix integer := 2;
begin
  if v_candidate is null then
    raise exception 'INVALID_NAME';
  end if;

  perform pg_advisory_xact_lock(hashtext('m4c1-copy-room:' || p_household_id::text)::bigint);

  if not exists (
    select 1 from public.room
    where household_id = p_household_id
      and lower(btrim(nazwa)) = lower(btrim(v_candidate))
  ) then
    return v_candidate;
  end if;

  v_root := coalesce(public.m4c1_copy_name_root(v_candidate), v_candidate);
  loop
    v_candidate := v_root || ' — kopia ' || v_suffix::text;
    exit when not exists (
      select 1 from public.room
      where household_id = p_household_id
        and lower(btrim(nazwa)) = lower(btrim(v_candidate))
    );
    v_suffix := v_suffix + 1;
  end loop;

  return v_candidate;
end;
$$;

create function public.m4c1_copy_furniture_name(p_room_id uuid, p_requested_name text)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_candidate text := nullif(btrim(p_requested_name), '');
  v_root text;
  v_suffix integer := 2;
begin
  if v_candidate is null then
    raise exception 'INVALID_NAME';
  end if;

  perform pg_advisory_xact_lock(hashtext('m4c1-copy-furniture:' || p_room_id::text)::bigint);

  if not exists (
    select 1 from public.storage_location_l2
    where room_id = p_room_id
      and lower(btrim(nazwa)) = lower(btrim(v_candidate))
  ) then
    return v_candidate;
  end if;

  v_root := coalesce(public.m4c1_copy_name_root(v_candidate), v_candidate);
  loop
    v_candidate := v_root || ' — kopia ' || v_suffix::text;
    exit when not exists (
      select 1 from public.storage_location_l2
      where room_id = p_room_id
        and lower(btrim(nazwa)) = lower(btrim(v_candidate))
    );
    v_suffix := v_suffix + 1;
  end loop;

  return v_candidate;
end;
$$;

create function public.m4c1_copy_storage_name(p_furniture_id uuid, p_requested_name text)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_candidate text := nullif(btrim(p_requested_name), '');
  v_root text;
  v_suffix integer := 2;
begin
  if v_candidate is null then
    raise exception 'INVALID_NAME';
  end if;

  perform pg_advisory_xact_lock(hashtext('m4c1-copy-storage:' || p_furniture_id::text)::bigint);

  if not exists (
    select 1 from public.storage_location_l3
    where storage_location_l2_id = p_furniture_id
      and lower(btrim(nazwa)) = lower(btrim(v_candidate))
  ) then
    return v_candidate;
  end if;

  v_root := coalesce(public.m4c1_copy_name_root(v_candidate), v_candidate);
  loop
    v_candidate := v_root || ' — kopia ' || v_suffix::text;
    exit when not exists (
      select 1 from public.storage_location_l3
      where storage_location_l2_id = p_furniture_id
        and lower(btrim(nazwa)) = lower(btrim(v_candidate))
    );
    v_suffix := v_suffix + 1;
  end loop;

  return v_candidate;
end;
$$;

create function public.m4c1_copy_item_name(p_household_id uuid, p_requested_name text)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_candidate text := nullif(btrim(p_requested_name), '');
  v_root text;
  v_suffix integer := 2;
begin
  if v_candidate is null then
    raise exception 'INVALID_NAME';
  end if;

  perform pg_advisory_xact_lock(hashtext('m4c1-copy-item:' || p_household_id::text)::bigint);

  if not exists (
    select 1 from public.item
    where household_id = p_household_id
      and status <> 'archiwalne'
      and lower(btrim(nazwa)) = lower(btrim(v_candidate))
  ) then
    return v_candidate;
  end if;

  v_root := coalesce(public.m4c1_copy_name_root(v_candidate), v_candidate);
  loop
    v_candidate := v_root || ' — kopia ' || v_suffix::text;
    exit when not exists (
      select 1 from public.item
      where household_id = p_household_id
        and status <> 'archiwalne'
        and lower(btrim(nazwa)) = lower(btrim(v_candidate))
    );
    v_suffix := v_suffix + 1;
  end loop;

  return v_candidate;
end;
$$;

create function public.copy_room_with_structure(
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
      insert into public.storage_location_l2 (id, room_id, nazwa, typ, opis, "kolejność")
      values (
        v_new_furniture_id,
        v_new_room_id,
        v_source_furniture.nazwa,
        v_source_furniture.typ,
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
          id, storage_location_l2_id, nazwa, opis, kod_lokalizacji, "kolejność"
        ) values (
          gen_random_uuid(),
          v_new_furniture_id,
          v_source_storage.nazwa,
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

create function public.copy_furniture_with_storage(
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

  insert into public.storage_location_l2 (id, room_id, nazwa, typ, opis, "kolejność")
  values (
    v_new_id,
    v_target_room.id,
    v_name,
    v_source.typ,
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
        id, storage_location_l2_id, nazwa, opis, kod_lokalizacji, "kolejność"
      ) values (
        gen_random_uuid(), v_new_id, v_source_storage.nazwa, v_source_storage.opis,
        v_code.kod_lokalizacji, v_code.kolejność
      );
      v_storage_count := v_storage_count + 1;
    end loop;
  end if;

  return query select v_new_id, v_storage_count, v_name;
end;
$$;

create function public.copy_storage_space(
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
    id, storage_location_l2_id, nazwa, opis, kod_lokalizacji, "kolejność"
  ) values (
    v_new_id, v_target_furniture.id, v_name, v_source.opis,
    v_code.kod_lokalizacji, v_code.kolejność
  );

  return query select v_new_id, v_name;
end;
$$;

create function public.copy_item(
  p_item_id uuid,
  p_name text,
  p_target_storage_location_l3_id uuid default null
)
returns table (new_item_id uuid, target_storage_id uuid, copied_name text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_household_id uuid := public.current_household_id();
  v_source public.item%rowtype;
  v_target_storage public.storage_location_l3%rowtype;
  v_owner_id uuid;
  v_new_id uuid := gen_random_uuid();
  v_name text;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if v_household_id is null then raise exception 'ACTIVE_PROFILE_REQUIRED'; end if;
  if public.current_profile_role() not in ('admin', 'domownik') then
    raise exception 'COPY_NOT_ALLOWED';
  end if;

  select * into v_source
  from public.item
  where id = p_item_id and household_id = v_household_id
  for key share;
  if not found then raise exception 'SOURCE_NOT_AVAILABLE'; end if;

  if p_target_storage_location_l3_id is not null then
    select l3.* into v_target_storage
    from public.storage_location_l3 as l3
    join public.storage_location_l2 as l2 on l2.id = l3.storage_location_l2_id
    join public.room as r on r.id = l2.room_id
    where l3.id = p_target_storage_location_l3_id
      and r.household_id = v_household_id
    for key share of l3;

    if not found then
      raise exception 'TARGET_NOT_AVAILABLE';
    end if;
  end if;

  v_name := public.m4c1_copy_item_name(v_household_id, p_name);
  select p.id into v_owner_id
  from public.profile as p
  where p.id = v_source.opiekun_id
    and p.household_id = v_household_id
    and p.status = 'aktywny';

  insert into public.item (
    id, household_id, category_id, nazwa, opis, typ, ilosc, jednostka,
    termin_waznosci, opiekun_id, status, przechowywany_w_sejfie,
    miniatura_url, notatki, created_by_id
  ) values (
    v_new_id, v_household_id, v_source.category_id, v_name, v_source.opis,
    v_source.typ, v_source.ilosc, v_source.jednostka, v_source.termin_waznosci,
    v_owner_id, 'w domu', false, null, v_source.notatki, auth.uid()
  );

  if p_target_storage_location_l3_id is not null then
    insert into public.item_location (
      item_id, storage_location_l3_id, czy_glowna, notatka
    ) values (
      v_new_id, p_target_storage_location_l3_id, true, null
    );
  end if;

  return query select v_new_id, p_target_storage_location_l3_id, v_name;
end;
$$;

revoke all on function public.m4c1_normalize_code_key(text) from public, anon;
revoke all on function public.m4c1_code_segment(text) from public, anon;
revoke all on function public.m4c1_room_code(text, text) from public, anon;
revoke all on function public.m4c1_furniture_code(text, text) from public, anon;
revoke all on function public.m4c1_location_code(text, text, text, text, text, integer) from public, anon;
revoke all on function public.m4c1_next_location_code(uuid, text, text, text, text, text, integer) from public, anon;
revoke all on function public.m4c1_copy_name_root(text) from public, anon;
revoke all on function public.m4c1_copy_room_name(uuid, text) from public, anon;
revoke all on function public.m4c1_copy_furniture_name(uuid, text) from public, anon;
revoke all on function public.m4c1_copy_storage_name(uuid, text) from public, anon;
revoke all on function public.m4c1_copy_item_name(uuid, text) from public, anon;
revoke all on function public.copy_room_with_structure(uuid, text, boolean) from public, anon;
revoke all on function public.copy_furniture_with_storage(uuid, uuid, text, boolean) from public, anon;
revoke all on function public.copy_storage_space(uuid, uuid, text) from public, anon;
revoke all on function public.copy_item(uuid, text, uuid) from public, anon;

grant execute on function public.m4c1_normalize_code_key(text) to authenticated;
grant execute on function public.m4c1_code_segment(text) to authenticated;
grant execute on function public.m4c1_room_code(text, text) to authenticated;
grant execute on function public.m4c1_furniture_code(text, text) to authenticated;
grant execute on function public.m4c1_location_code(text, text, text, text, text, integer) to authenticated;
grant execute on function public.m4c1_next_location_code(uuid, text, text, text, text, text, integer) to authenticated;
grant execute on function public.m4c1_copy_name_root(text) to authenticated;
grant execute on function public.m4c1_copy_room_name(uuid, text) to authenticated;
grant execute on function public.m4c1_copy_furniture_name(uuid, text) to authenticated;
grant execute on function public.m4c1_copy_storage_name(uuid, text) to authenticated;
grant execute on function public.m4c1_copy_item_name(uuid, text) to authenticated;
grant execute on function public.copy_room_with_structure(uuid, text, boolean) to authenticated;
grant execute on function public.copy_furniture_with_storage(uuid, uuid, text, boolean) to authenticated;
grant execute on function public.copy_storage_space(uuid, uuid, text) to authenticated;
grant execute on function public.copy_item(uuid, text, uuid) to authenticated;
