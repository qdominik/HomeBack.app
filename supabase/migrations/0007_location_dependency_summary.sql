-- Purpose:
-- Provide read-only, household-isolated dependency summaries before a future
-- deletion of a room, an L2 storage location, or an L3 position.
--
-- Data impact:
-- None. The functions only read existing structure, item, and item_location
-- rows. No table, relationship, RLS policy, or existing data is changed.
--
-- RLS:
-- All functions are security invoker and operate through existing policies.
-- They additionally require an authenticated active household administrator.
--
-- Test:
-- supabase db reset and supabase test db.

create function public.get_room_location_dependency_summary(p_room_id uuid)
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
    select il.item_id, il.czy_glowna
    from public.item_location as il
    join scoped_positions as l3 on l3.id = il.storage_location_l3_id
  ),
  item_counts as (
    select
      count(distinct sl.item_id) filter (
        where i.status <> 'archiwalne'
      ) as active_count,
      count(distinct sl.item_id) filter (
        where i.status = 'archiwalne'
      ) as archived_count,
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
    0::bigint,
    ic.active_count,
    ic.active_count,
    0::bigint,
    ic.archived_count,
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

create function public.get_storage_location_l2_dependency_summary(
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
    select il.item_id, il.czy_glowna
    from public.item_location as il
    join scoped_positions as l3 on l3.id = il.storage_location_l3_id
  ),
  item_counts as (
    select
      count(distinct sl.item_id) filter (
        where i.status <> 'archiwalne'
      ) as active_count,
      count(distinct sl.item_id) filter (
        where i.status = 'archiwalne'
      ) as archived_count,
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
    0::bigint,
    ic.active_count,
    ic.active_count,
    0::bigint,
    ic.archived_count,
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

create function public.get_storage_location_l3_dependency_summary(
  p_storage_location_l3_id uuid
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
  from public.storage_location_l3 as l3
  join public.storage_location_l2 as l2
    on l2.id = l3.storage_location_l2_id
  join public.room as r on r.id = l2.room_id
  where l3.id = p_storage_location_l3_id
    and r.household_id = v_household_id;

  if not found then
    raise exception 'LOCATION_NOT_AVAILABLE';
  end if;

  return query
  with scoped_links as (
    select il.item_id, il.czy_glowna
    from public.item_location as il
    where il.storage_location_l3_id = p_storage_location_l3_id
  ),
  item_counts as (
    select
      count(distinct sl.item_id) filter (
        where i.status <> 'archiwalne'
      ) as active_count,
      count(distinct sl.item_id) filter (
        where i.status = 'archiwalne'
      ) as archived_count,
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
  )
  select
    p_storage_location_l3_id,
    0::bigint,
    0::bigint,
    ic.active_count,
    0::bigint,
    ic.active_count,
    ic.archived_count,
    0::bigint,
    ic.archived_count,
    ic.total_count,
    lc.primary_count,
    lc.non_primary_count,
    lc.total_count,
    lc.total_count > 0,
    false,
    lc.total_count = 0
  from item_counts as ic
  cross join link_counts as lc;
end;
$$;

revoke all on function public.get_room_location_dependency_summary(uuid)
  from public;
revoke all on function public.get_storage_location_l2_dependency_summary(uuid)
  from public;
revoke all on function public.get_storage_location_l3_dependency_summary(uuid)
  from public;

grant execute on function public.get_room_location_dependency_summary(uuid)
  to authenticated;
grant execute on function public.get_storage_location_l2_dependency_summary(uuid)
  to authenticated;
grant execute on function public.get_storage_location_l3_dependency_summary(uuid)
  to authenticated;

comment on function public.get_room_location_dependency_summary(uuid) is
  'M4D.2 read-only dependency summary for one room in the active admin household.';
comment on function public.get_storage_location_l2_dependency_summary(uuid) is
  'M4D.2 read-only dependency summary for one L2 location in the active admin household.';
comment on function public.get_storage_location_l3_dependency_summary(uuid) is
  'M4D.2 read-only dependency summary for one L3 position in the active admin household.';
