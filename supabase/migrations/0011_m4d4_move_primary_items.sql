-- Purpose:
-- Atomically move every primary item_location link from one approved location
-- scope to one target L3 position without changing Items or additional links.
--
-- Data impact:
-- Deletes primary source links, promotes an existing additional target link or
-- inserts a new primary target link. No table, column, index, or RLS changes.
--
-- RLS:
-- The function is security invoker and requires the active household admin.
-- Existing item_location SELECT/DELETE/UPDATE/INSERT policies remain active.
--
-- Test:
-- npx.cmd supabase db reset and npx.cmd supabase test db.

create function public.move_primary_items_from_location(
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
      join public.storage_location_l3 as source_l3
        on source_l3.id = source_link.storage_location_l3_id
      join public.storage_location_l2 as source_l2
        on source_l2.id = source_l3.storage_location_l2_id
      where source_link.czy_glowna
        and i.household_id = v_household_id
        and (
          (p_source_type = 'room' and source_l2.room_id = p_source_id)
          or (
            p_source_type = 'storage'
            and source_l3.storage_location_l2_id = p_source_id
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

revoke all on function public.move_primary_items_from_location(text, uuid, uuid)
  from public;
revoke all on function public.move_primary_items_from_location(text, uuid, uuid)
  from anon;
grant execute on function public.move_primary_items_from_location(text, uuid, uuid)
  to authenticated;

comment on function public.move_primary_items_from_location(text, uuid, uuid) is
  'Atomically moves primary item locations from one Room, L2, or L3 scope to one external L3 target.';
