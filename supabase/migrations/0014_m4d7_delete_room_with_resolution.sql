-- Purpose:
-- Atomically resolve every Item link in one Room subtree, explicitly delete
-- all nested L3 storage spaces and L2 furniture, and then delete the Room.
--
-- Data impact:
-- Reuses M4D.3 and M4D.4. No table, column, foreign key, or RLS changes.

create function public.delete_room_with_resolution(
  p_room_id uuid,
  p_resolution text,
  p_target_storage_location_l3_id uuid,
  p_expected_storage_location_l2_count bigint,
  p_expected_storage_location_l3_count bigint,
  p_expected_distinct_item_count bigint,
  p_expected_location_link_count bigint
)
returns table (
  status text,
  resolution text,
  deleted_room_id uuid,
  deleted_storage_location_l2_count bigint,
  deleted_storage_location_l3_count bigint,
  affected_item_count bigint,
  active_item_count bigint,
  archived_item_count bigint,
  moved_item_count bigint,
  detached_link_count bigint,
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
  v_target_room_id uuid;
  v_storage_location_l2_count bigint;
  v_storage_location_l3_count bigint;
  v_distinct_item_count bigint;
  v_active_item_count bigint;
  v_archived_item_count bigint;
  v_location_link_count bigint;
  v_moved_item_count bigint := 0;
  v_detached_link_count bigint := 0;
  v_reused_target_link_count bigint := 0;
  v_created_target_link_count bigint := 0;
  v_removed_source_link_count bigint := 0;
  v_deleted_storage_location_l3_count bigint := 0;
  v_deleted_storage_location_l2_count bigint := 0;
  v_deleted_room_count bigint := 0;
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

  if p_resolution is null or p_resolution not in ('delete', 'detach', 'move') then
    raise exception 'INVALID_RESOLUTION';
  end if;

  if p_expected_storage_location_l2_count is null
     or p_expected_storage_location_l2_count < 0
     or p_expected_storage_location_l3_count is null
     or p_expected_storage_location_l3_count < 0
     or p_expected_distinct_item_count is null
     or p_expected_distinct_item_count < 0
     or p_expected_location_link_count is null
     or p_expected_location_link_count < 0 then
    raise exception 'INVALID_EXPECTED_COUNTS';
  end if;

  if p_resolution = 'move' and p_target_storage_location_l3_id is null then
    raise exception 'TARGET_REQUIRED';
  end if;

  if p_resolution in ('delete', 'detach')
     and p_target_storage_location_l3_id is not null then
    raise exception 'TARGET_NOT_ALLOWED';
  end if;

  perform 1
  from public.room as r
  where r.id = p_room_id
    and r.household_id = v_household_id
  for update of r;

  if not found then
    raise exception 'LOCATION_NOT_AVAILABLE';
  end if;

  -- Lock every existing L2 child as well as the Room. The Room lock blocks
  -- concurrent L2 inserts through the foreign key, while these child locks
  -- block concurrent L3 inserts into the already-existing subtree.
  perform 1
  from public.storage_location_l2 as l2
  where l2.room_id = p_room_id
  for update of l2;

  if p_resolution = 'move' then
    select l2.room_id
    into v_target_room_id
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

    if v_target_room_id = p_room_id then
      raise exception 'TARGET_IN_SOURCE_SUBTREE';
    end if;
  end if;

  select
    summary.storage_count,
    summary.position_count,
    summary.total_distinct_items_count,
    summary.active_items_count,
    summary.archived_items_count,
    summary.total_location_links_count
  into
    v_storage_location_l2_count,
    v_storage_location_l3_count,
    v_distinct_item_count,
    v_active_item_count,
    v_archived_item_count,
    v_location_link_count
  from public.get_room_location_dependency_summary(p_room_id) as summary;

  if v_storage_location_l2_count <> p_expected_storage_location_l2_count
     or v_storage_location_l3_count <> p_expected_storage_location_l3_count
     or v_distinct_item_count <> p_expected_distinct_item_count
     or v_location_link_count <> p_expected_location_link_count then
    raise exception 'DEPENDENCIES_CHANGED';
  end if;

  if p_resolution = 'delete' and v_location_link_count <> 0 then
    raise exception 'DEPENDENCIES_CHANGED';
  end if;

  begin
    if p_resolution = 'move' then
      select
        moved.moved_item_count,
        moved.reused_target_link_count,
        moved.created_target_link_count,
        moved.removed_source_link_count
      into
        v_moved_item_count,
        v_reused_target_link_count,
        v_created_target_link_count,
        v_removed_source_link_count
      from public.move_primary_items_from_location(
        'room',
        p_room_id,
        p_target_storage_location_l3_id
      ) as moved;
    end if;

    if p_resolution in ('detach', 'move') then
      select detached.detached_link_count
      into v_detached_link_count
      from public.detach_items_from_room_location(p_room_id) as detached;
    end if;

    delete from public.storage_location_l3 as l3
    using public.storage_location_l2 as l2
    where l3.storage_location_l2_id = l2.id
      and l2.room_id = p_room_id;
    get diagnostics v_deleted_storage_location_l3_count = row_count;

    if v_deleted_storage_location_l3_count <> v_storage_location_l3_count then
      raise exception 'room L3 subtree delete count mismatch';
    end if;

    delete from public.storage_location_l2 as l2
    where l2.room_id = p_room_id;
    get diagnostics v_deleted_storage_location_l2_count = row_count;

    if v_deleted_storage_location_l2_count <> v_storage_location_l2_count then
      raise exception 'room L2 subtree delete count mismatch';
    end if;

    delete from public.room as r
    where r.id = p_room_id;
    get diagnostics v_deleted_room_count = row_count;

    if v_deleted_room_count <> 1 then
      raise exception 'room delete did not affect exactly one row';
    end if;

    return query
    select
      'success'::text,
      p_resolution,
      p_room_id,
      v_deleted_storage_location_l2_count,
      v_deleted_storage_location_l3_count,
      v_distinct_item_count,
      v_active_item_count,
      v_archived_item_count,
      v_moved_item_count,
      v_detached_link_count,
      v_reused_target_link_count,
      v_created_target_link_count,
      v_removed_source_link_count;
  exception
    when others then
      raise exception 'DELETE_FAILED';
  end;
end;
$$;

revoke all on function public.delete_room_with_resolution(
  uuid,
  text,
  uuid,
  bigint,
  bigint,
  bigint,
  bigint
) from public;
revoke all on function public.delete_room_with_resolution(
  uuid,
  text,
  uuid,
  bigint,
  bigint,
  bigint,
  bigint
) from anon;
grant execute on function public.delete_room_with_resolution(
  uuid,
  text,
  uuid,
  bigint,
  bigint,
  bigint,
  bigint
) to authenticated;

comment on function public.delete_room_with_resolution(
  uuid,
  text,
  uuid,
  bigint,
  bigint,
  bigint,
  bigint
) is
  'Atomically deletes one Room subtree after deleting, detaching, or moving every Item link for the active household admin.';
