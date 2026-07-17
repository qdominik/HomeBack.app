-- Purpose:
-- Atomically detach every item_location link within one approved location
-- scope without deleting Items or the Home structure.
--
-- Data impact:
-- Deletes only item_location rows that point to the selected L3 position or
-- to an L3 position nested below the selected L2 storage or Room.
--
-- RLS:
-- All functions are security invoker and require the active household admin.
-- Existing table grants and RLS policies remain unchanged.
--
-- Test:
-- npx.cmd supabase db reset and npx.cmd supabase test db.

create function public.detach_items_from_room_location(p_room_id uuid)
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
      using public.storage_location_l3 as l3,
            public.storage_location_l2 as l2
      where il.storage_location_l3_id = l3.id
        and l3.storage_location_l2_id = l2.id
        and l2.room_id = p_room_id
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

create function public.detach_items_from_storage_location_l2(
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
      using public.storage_location_l3 as l3
      where il.storage_location_l3_id = l3.id
        and l3.storage_location_l2_id = p_storage_location_l2_id
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

create function public.detach_items_from_storage_location_l3(
  p_storage_location_l3_id uuid
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
  from public.storage_location_l3 as l3
  join public.storage_location_l2 as l2
    on l2.id = l3.storage_location_l2_id
  join public.room as r on r.id = l2.room_id
  where l3.id = p_storage_location_l3_id
    and r.household_id = v_household_id
  for share of l3;

  if not found then
    raise exception 'LOCATION_NOT_AVAILABLE';
  end if;

  begin
    return query
    with deleted_links as (
      delete from public.item_location as il
      where il.storage_location_l3_id = p_storage_location_l3_id
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

revoke all on function public.detach_items_from_room_location(uuid)
  from public;
revoke all on function public.detach_items_from_room_location(uuid)
  from anon;
grant execute on function public.detach_items_from_room_location(uuid)
  to authenticated;

revoke all on function public.detach_items_from_storage_location_l2(uuid)
  from public;
revoke all on function public.detach_items_from_storage_location_l2(uuid)
  from anon;
grant execute on function public.detach_items_from_storage_location_l2(uuid)
  to authenticated;

revoke all on function public.detach_items_from_storage_location_l3(uuid)
  from public;
revoke all on function public.detach_items_from_storage_location_l3(uuid)
  from anon;
grant execute on function public.detach_items_from_storage_location_l3(uuid)
  to authenticated;

comment on function public.detach_items_from_room_location(uuid) is
  'Atomically detaches every item_location link in one Room subtree for the active household admin.';

comment on function public.detach_items_from_storage_location_l2(uuid) is
  'Atomically detaches every item_location link in one L2 subtree for the active household admin.';

comment on function public.detach_items_from_storage_location_l3(uuid) is
  'Atomically detaches every item_location link from one L3 position for the active household admin.';
