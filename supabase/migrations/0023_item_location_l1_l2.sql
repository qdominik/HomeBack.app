-- Purpose: one item_location target at L1, L2 or L3; see decision-log 2026-09-08.
-- Data: additive nullable columns only; existing L3 rows and primary index retained.
-- Delete: NO ACTION; existing resolution RPCs handle links before structure deletion.
-- RLS: invoker RPCs; target must belong to the current household on INSERT/UPDATE.
-- Rollback: only after explicitly resolving all L1/L2 assignments; restore old RPCs,
-- policies, drop new columns/check, restore L3 NOT NULL. Never silently delete data.
-- Validation: supabase migration up --local; supabase test db (no db reset).

alter table public.item_location
  alter column storage_location_l3_id drop not null,
  add column room_id uuid references public.room(id) on delete no action,
  add column storage_location_l2_id uuid references public.storage_location_l2(id) on delete no action,
  add constraint item_location_exactly_one_target check (
    num_nonnulls(room_id, storage_location_l2_id, storage_location_l3_id) = 1
  );
create index item_location_room_id_idx on public.item_location(room_id) where room_id is not null;
create index item_location_l2_id_idx on public.item_location(storage_location_l2_id) where storage_location_l2_id is not null;

alter policy item_location_insert_admin on public.item_location with check (exists (
    select 1 from public.item i
    where i.id = item_location.item_id
      and i.household_id = public.current_household_id()
      and public.is_household_admin(i.household_id)
  ) and (
    exists (select 1 from public.room r
      where r.id = item_location.room_id and r.household_id = public.current_household_id())
    or exists (select 1 from public.storage_location_l2 l2
      join public.room r on r.id = l2.room_id
      where l2.id = item_location.storage_location_l2_id and r.household_id = public.current_household_id())
    or exists (select 1 from public.storage_location_l3 l3
      join public.storage_location_l2 l2 on l2.id = l3.storage_location_l2_id
      join public.room r on r.id = l2.room_id
      where l3.id = item_location.storage_location_l3_id and r.household_id = public.current_household_id())
  ));
alter policy item_location_update_admin on public.item_location with check (exists (
    select 1 from public.item i
    where i.id = item_location.item_id
      and i.household_id = public.current_household_id()
      and public.is_household_admin(i.household_id)
  ) and (
    exists (select 1 from public.room r
      where r.id = item_location.room_id and r.household_id = public.current_household_id())
    or exists (select 1 from public.storage_location_l2 l2
      join public.room r on r.id = l2.room_id
      where l2.id = item_location.storage_location_l2_id and r.household_id = public.current_household_id())
    or exists (select 1 from public.storage_location_l3 l3
      join public.storage_location_l2 l2 on l2.id = l3.storage_location_l2_id
      join public.room r on r.id = l2.room_id
      where l3.id = item_location.storage_location_l3_id and r.household_id = public.current_household_id())
  ));

-- Four explicit arguments avoid ambiguity with the backward-compatible L3 wrapper.
create function public.set_item_primary_location(
  p_item_id uuid, p_storage_location_l3_id uuid,
  p_storage_location_l2_id uuid, p_room_id uuid
)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  v_household_id uuid;
  v_item_household_id uuid;
  v_location_household_id uuid;
  v_target_link_id uuid;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  v_household_id := public.current_household_id();
  if v_household_id is null then raise exception 'ACTIVE_PROFILE_REQUIRED'; end if;
  if not public.is_household_admin(v_household_id) then raise exception 'ADMIN_REQUIRED'; end if;
  select i.household_id into v_item_household_id from public.item i
    where i.id = p_item_id for update;
  if not found then raise exception 'ITEM_NOT_FOUND'; end if;
  if v_item_household_id <> v_household_id then raise exception 'ITEM_HOUSEHOLD_MISMATCH'; end if;
  if num_nonnulls(p_room_id, p_storage_location_l2_id, p_storage_location_l3_id) > 1 then
    raise exception 'INVALID_LOCATION_TARGET';
  end if;
  if p_room_id is not null then
    select r.household_id into v_location_household_id from public.room r
      where r.id = p_room_id for share;
  elsif p_storage_location_l2_id is not null then
    select r.household_id into v_location_household_id from public.storage_location_l2 l2
      join public.room r on r.id = l2.room_id
      where l2.id = p_storage_location_l2_id for share of l2, r;
  elsif p_storage_location_l3_id is not null then
    select r.household_id into v_location_household_id from public.storage_location_l3 l3
      join public.storage_location_l2 l2 on l2.id = l3.storage_location_l2_id
      join public.room r on r.id = l2.room_id
      where l3.id = p_storage_location_l3_id for share of l3, l2, r;
  end if;
  if num_nonnulls(p_room_id, p_storage_location_l2_id, p_storage_location_l3_id) = 1
     and v_location_household_id is distinct from v_household_id then
    raise exception 'LOCATION_HOUSEHOLD_MISMATCH';
  end if;
  select il.id into v_target_link_id from public.item_location il
    where il.item_id = p_item_id
      and il.room_id is not distinct from p_room_id
      and il.storage_location_l2_id is not distinct from p_storage_location_l2_id
      and il.storage_location_l3_id is not distinct from p_storage_location_l3_id
    order by il.czy_glowna desc, il.created_at, il.id limit 1 for update;
  delete from public.item_location il where il.item_id = p_item_id and il.czy_glowna
    and il.id is distinct from v_target_link_id;
  if v_target_link_id is not null then
    update public.item_location set czy_glowna = true
      where id = v_target_link_id and not czy_glowna;
  elsif num_nonnulls(p_room_id, p_storage_location_l2_id, p_storage_location_l3_id) = 1 then
    insert into public.item_location(item_id, room_id, storage_location_l2_id, storage_location_l3_id, czy_glowna)
      values (p_item_id, p_room_id, p_storage_location_l2_id, p_storage_location_l3_id, true);
  end if;
end;
$$;
revoke all on function public.set_item_primary_location(uuid, uuid, uuid, uuid) from public, anon;
grant execute on function public.set_item_primary_location(uuid, uuid, uuid, uuid) to authenticated;

create or replace function public.set_item_primary_location(
  p_item_id uuid, p_storage_location_l3_id uuid default null
)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  perform public.set_item_primary_location(p_item_id, p_storage_location_l3_id, null, null);
end;
$$;

create or replace function public.get_room_location_dependency_summary(p_room_id uuid)
returns table (
  entity_id uuid,
  storage_count bigint,
  position_count bigint,
  active_direct_items_count bigint,
  active_nested_items_count bigint,
  active_items_count bigint,
  archived_direct_items_count bigint,
  archived_nested_items_count bigint,
  archived_items_count bigint,
  total_distinct_items_count bigint,
  primary_location_links_count bigint,
  non_primary_location_links_count bigint,
  total_location_links_count bigint,
  requires_item_resolution boolean,
  requires_subtree_deletion boolean,
  can_delete_immediately boolean
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  v_household_id := public.current_household_id();

  if v_household_id is null then
    raise exception 'ACTIVE_PROFILE_REQUIRED';
  end if;

  if public.current_profile_role() <> 'admin'
     or not public.is_household_admin(v_household_id) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  perform 1
  from public.room as r
  where r.id = p_room_id
    and r.household_id = v_household_id;

  if not found then
    raise exception 'LOCATION_NOT_AVAILABLE';
  end if;

  return query
  with scoped_storages as (
    select l2.id
    from public.storage_location_l2 as l2
    where l2.room_id = p_room_id
  ),
  scoped_positions as (
    select l3.id
    from public.storage_location_l3 as l3
    join scoped_storages as l2 on l2.id = l3.storage_location_l2_id
  ),
  scoped_links as (
    select il.item_id, il.czy_glowna, (il.room_id = p_room_id) is true as is_direct
    from public.item_location as il
    where il.room_id = p_room_id or il.storage_location_l2_id in (select id from scoped_storages) or il.storage_location_l3_id in (select id from scoped_positions)
  ),
  item_counts as (
    select
      count(distinct sl.item_id) filter (
        where i.status <> 'archiwalne'
      ) as active_count,
      count(distinct sl.item_id) filter (
        where i.status = 'archiwalne'
      ) as archived_count,
      count(distinct sl.item_id) filter (where i.status <> 'archiwalne' and sl.is_direct) as active_direct,
      count(distinct sl.item_id) filter (where i.status <> 'archiwalne' and not sl.is_direct
        and not exists (select 1 from scoped_links direct where direct.item_id = sl.item_id and direct.is_direct)) as active_nested,
      count(distinct sl.item_id) filter (where i.status = 'archiwalne' and sl.is_direct) as archived_direct,
      count(distinct sl.item_id) filter (where i.status = 'archiwalne' and not sl.is_direct
        and not exists (select 1 from scoped_links direct where direct.item_id = sl.item_id and direct.is_direct)) as archived_nested,
      count(distinct sl.item_id) as total_count
    from scoped_links as sl
    join public.item as i on i.id = sl.item_id
  ),
  link_counts as (
    select
      count(*) filter (where sl.czy_glowna) as primary_count,
      count(*) filter (where not sl.czy_glowna) as non_primary_count,
      count(*) as total_count
    from scoped_links as sl
  ),
  structure_counts as (
    select
      (select count(*) from scoped_storages) as storage_count,
      (select count(*) from scoped_positions) as position_count
  )
  select
    p_room_id,
    sc.storage_count,
    sc.position_count,
    ic.active_direct,
    ic.active_nested,
    ic.active_count,
    ic.archived_direct,
    ic.archived_nested,
    ic.archived_count,
    ic.total_count,
    lc.primary_count,
    lc.non_primary_count,
    lc.total_count,
    lc.total_count > 0,
    sc.storage_count > 0 or sc.position_count > 0,
    sc.storage_count = 0
      and sc.position_count = 0
      and lc.total_count = 0
  from structure_counts as sc
  cross join item_counts as ic
  cross join link_counts as lc;
end;
$$;

create or replace function public.get_storage_location_l2_dependency_summary(
  p_storage_location_l2_id uuid
)
returns table (
  entity_id uuid,
  storage_count bigint,
  position_count bigint,
  active_direct_items_count bigint,
  active_nested_items_count bigint,
  active_items_count bigint,
  archived_direct_items_count bigint,
  archived_nested_items_count bigint,
  archived_items_count bigint,
  total_distinct_items_count bigint,
  primary_location_links_count bigint,
  non_primary_location_links_count bigint,
  total_location_links_count bigint,
  requires_item_resolution boolean,
  requires_subtree_deletion boolean,
  can_delete_immediately boolean
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  v_household_id := public.current_household_id();

  if v_household_id is null then
    raise exception 'ACTIVE_PROFILE_REQUIRED';
  end if;

  if public.current_profile_role() <> 'admin'
     or not public.is_household_admin(v_household_id) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  perform 1
  from public.storage_location_l2 as l2
  join public.room as r on r.id = l2.room_id
  where l2.id = p_storage_location_l2_id
    and r.household_id = v_household_id;

  if not found then
    raise exception 'LOCATION_NOT_AVAILABLE';
  end if;

  return query
  with scoped_positions as (
    select l3.id
    from public.storage_location_l3 as l3
    where l3.storage_location_l2_id = p_storage_location_l2_id
  ),
  scoped_links as (
    select il.item_id, il.czy_glowna, (il.storage_location_l2_id = p_storage_location_l2_id) is true as is_direct
    from public.item_location as il
    where il.storage_location_l2_id = p_storage_location_l2_id or il.storage_location_l3_id in (select id from scoped_positions)
  ),
  item_counts as (
    select
      count(distinct sl.item_id) filter (
        where i.status <> 'archiwalne'
      ) as active_count,
      count(distinct sl.item_id) filter (
        where i.status = 'archiwalne'
      ) as archived_count,
      count(distinct sl.item_id) filter (where i.status <> 'archiwalne' and sl.is_direct) as active_direct,
      count(distinct sl.item_id) filter (where i.status <> 'archiwalne' and not sl.is_direct
        and not exists (select 1 from scoped_links direct where direct.item_id = sl.item_id and direct.is_direct)) as active_nested,
      count(distinct sl.item_id) filter (where i.status = 'archiwalne' and sl.is_direct) as archived_direct,
      count(distinct sl.item_id) filter (where i.status = 'archiwalne' and not sl.is_direct
        and not exists (select 1 from scoped_links direct where direct.item_id = sl.item_id and direct.is_direct)) as archived_nested,
      count(distinct sl.item_id) as total_count
    from scoped_links as sl
    join public.item as i on i.id = sl.item_id
  ),
  link_counts as (
    select
      count(*) filter (where sl.czy_glowna) as primary_count,
      count(*) filter (where not sl.czy_glowna) as non_primary_count,
      count(*) as total_count
    from scoped_links as sl
  ),
  structure_counts as (
    select count(*) as position_count
    from scoped_positions
  )
  select
    p_storage_location_l2_id,
    0::bigint,
    sc.position_count,
    ic.active_direct,
    ic.active_nested,
    ic.active_count,
    ic.archived_direct,
    ic.archived_nested,
    ic.archived_count,
    ic.total_count,
    lc.primary_count,
    lc.non_primary_count,
    lc.total_count,
    lc.total_count > 0,
    sc.position_count > 0,
    sc.position_count = 0 and lc.total_count = 0
  from structure_counts as sc
  cross join item_counts as ic
  cross join link_counts as lc;
end;
$$;

create or replace function public.detach_items_from_room_location(p_room_id uuid)
returns table (
  status text,
  detached_item_count bigint,
  detached_link_count bigint,
  active_item_count bigint,
  archived_item_count bigint
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  v_household_id := public.current_household_id();

  if v_household_id is null then
    raise exception 'ACTIVE_PROFILE_REQUIRED';
  end if;

  if public.current_profile_role() <> 'admin'
     or not public.is_household_admin(v_household_id) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  perform 1
  from public.room as r
  where r.id = p_room_id
    and r.household_id = v_household_id
  for share;

  if not found then
    raise exception 'LOCATION_NOT_AVAILABLE';
  end if;

  begin
    return query
    with deleted_links as (
      delete from public.item_location as il
      where il.room_id = p_room_id
        or il.storage_location_l2_id in (select l2.id from public.storage_location_l2 l2 where l2.room_id = p_room_id)
        or il.storage_location_l3_id in (
          select l3.id from public.storage_location_l3 l3
          join public.storage_location_l2 l2 on l2.id = l3.storage_location_l2_id where l2.room_id = p_room_id)
      returning il.item_id
    )
    select
      'success'::text,
      count(distinct dl.item_id),
      count(*),
      count(distinct dl.item_id) filter (where i.status <> 'archiwalne'),
      count(distinct dl.item_id) filter (where i.status = 'archiwalne')
    from deleted_links as dl
    join public.item as i on i.id = dl.item_id;
  exception
    when others then
      raise exception 'DETACH_FAILED';
  end;
end;
$$;

create or replace function public.detach_items_from_storage_location_l2(
  p_storage_location_l2_id uuid
)
returns table (
  status text,
  detached_item_count bigint,
  detached_link_count bigint,
  active_item_count bigint,
  archived_item_count bigint
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  v_household_id := public.current_household_id();

  if v_household_id is null then
    raise exception 'ACTIVE_PROFILE_REQUIRED';
  end if;

  if public.current_profile_role() <> 'admin'
     or not public.is_household_admin(v_household_id) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  perform 1
  from public.storage_location_l2 as l2
  join public.room as r on r.id = l2.room_id
  where l2.id = p_storage_location_l2_id
    and r.household_id = v_household_id
  for share of l2;

  if not found then
    raise exception 'LOCATION_NOT_AVAILABLE';
  end if;

  begin
    return query
    with deleted_links as (
      delete from public.item_location as il
      where il.storage_location_l2_id = p_storage_location_l2_id
        or il.storage_location_l3_id in (select l3.id from public.storage_location_l3 l3
          where l3.storage_location_l2_id = p_storage_location_l2_id)
      returning il.item_id
    )
    select
      'success'::text,
      count(distinct dl.item_id),
      count(*),
      count(distinct dl.item_id) filter (where i.status <> 'archiwalne'),
      count(distinct dl.item_id) filter (where i.status = 'archiwalne')
    from deleted_links as dl
    join public.item as i on i.id = dl.item_id;
  exception
    when others then
      raise exception 'DETACH_FAILED';
  end;
end;
$$;

create or replace function public.move_primary_items_from_location(
  p_source_type text,
  p_source_id uuid,
  p_target_storage_location_l3_id uuid
)
returns table (
  status text,
  moved_item_count bigint,
  active_item_count bigint,
  archived_item_count bigint,
  reused_target_link_count bigint,
  created_target_link_count bigint,
  removed_source_link_count bigint
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_household_id uuid;
  v_target_storage_location_l2_id uuid;
  v_target_room_id uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  v_household_id := public.current_household_id();

  if v_household_id is null then
    raise exception 'ACTIVE_PROFILE_REQUIRED';
  end if;

  if public.current_profile_role() <> 'admin'
     or not public.is_household_admin(v_household_id) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  if p_source_type is null or p_source_type not in ('room', 'storage', 'position') then
    raise exception 'INVALID_SOURCE_TYPE';
  end if;

  case p_source_type
    when 'room' then
      perform 1
      from public.room as r
      where r.id = p_source_id
        and r.household_id = v_household_id
      for share;
    when 'storage' then
      perform 1
      from public.storage_location_l2 as l2
      join public.room as r on r.id = l2.room_id
      where l2.id = p_source_id
        and r.household_id = v_household_id
      for share of l2;
    when 'position' then
      perform 1
      from public.storage_location_l3 as l3
      join public.storage_location_l2 as l2
        on l2.id = l3.storage_location_l2_id
      join public.room as r on r.id = l2.room_id
      where l3.id = p_source_id
        and r.household_id = v_household_id
      for share of l3;
  end case;

  if not found then
    raise exception 'SOURCE_NOT_AVAILABLE';
  end if;

  select l3.storage_location_l2_id, l2.room_id
  into v_target_storage_location_l2_id, v_target_room_id
  from public.storage_location_l3 as l3
  join public.storage_location_l2 as l2
    on l2.id = l3.storage_location_l2_id
  join public.room as r on r.id = l2.room_id
  where l3.id = p_target_storage_location_l3_id
    and r.household_id = v_household_id
  for share of l3;

  if not found then
    raise exception 'TARGET_NOT_AVAILABLE';
  end if;

  if (p_source_type = 'room' and v_target_room_id = p_source_id)
     or (
       p_source_type = 'storage'
       and v_target_storage_location_l2_id = p_source_id
     )
     or (
       p_source_type = 'position'
       and p_target_storage_location_l3_id = p_source_id
     ) then
    raise exception 'TARGET_INSIDE_SOURCE';
  end if;

  begin
    return query
    with source_links as materialized (
      select
        source_link.id as source_link_id,
        source_link.item_id,
        i.status as item_status
      from public.item_location as source_link
      join public.item as i on i.id = source_link.item_id
      left join public.storage_location_l3 as source_l3
        on source_l3.id = source_link.storage_location_l3_id
      left join public.storage_location_l2 as source_l2
        on source_l2.id = coalesce(source_link.storage_location_l2_id, source_l3.storage_location_l2_id)
      where source_link.czy_glowna
        and i.household_id = v_household_id
        and (
          (p_source_type = 'room' and coalesce(source_link.room_id, source_l2.room_id) = p_source_id)
          or (
            p_source_type = 'storage'
            and source_l2.id = p_source_id
          )
          or (
            p_source_type = 'position'
            and source_l3.id = p_source_id
          )
        )
      order by source_link.item_id
      for update of source_link
    ),
    planned_moves as materialized (
      select
        source_links.source_link_id,
        source_links.item_id,
        source_links.item_status,
        target_link.id as target_link_id
      from source_links
      left join lateral (
        select existing_target.id
        from public.item_location as existing_target
        where existing_target.item_id = source_links.item_id
          and existing_target.storage_location_l3_id =
            p_target_storage_location_l3_id
          and not existing_target.czy_glowna
        order by existing_target.created_at, existing_target.id
        limit 1
        for update
      ) as target_link on true
    ),
    deleted_source_links as (
      delete from public.item_location as source_link
      using planned_moves
      where source_link.id = planned_moves.source_link_id
      returning source_link.item_id
    ),
    promoted_target_links as (
      update public.item_location as target_link
      set czy_glowna = true
      from planned_moves
      join deleted_source_links
        on deleted_source_links.item_id = planned_moves.item_id
      where target_link.id = planned_moves.target_link_id
      returning target_link.item_id
    ),
    created_target_links as (
      insert into public.item_location (
        item_id,
        storage_location_l3_id,
        czy_glowna
      )
      select
        planned_moves.item_id,
        p_target_storage_location_l3_id,
        true
      from planned_moves
      join deleted_source_links
        on deleted_source_links.item_id = planned_moves.item_id
      where planned_moves.target_link_id is null
      returning item_id
    )
    select
      'success'::text,
      count(*)::bigint,
      count(*) filter (
        where planned_moves.item_status <> 'archiwalne'
      )::bigint,
      count(*) filter (
        where planned_moves.item_status = 'archiwalne'
      )::bigint,
      (select count(*) from promoted_target_links)::bigint,
      (select count(*) from created_target_links)::bigint,
      count(*)::bigint
    from deleted_source_links
    join planned_moves
      on planned_moves.item_id = deleted_source_links.item_id;
  exception
    when others then
      raise exception 'MOVE_FAILED';
  end;
end;
$$;


notify pgrst, 'reload schema';
