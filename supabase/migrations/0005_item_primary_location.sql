-- Purpose:
-- Enforce at most one primary location per item and provide an atomic,
-- RLS-respecting operation for setting that location.
--
-- Data impact:
-- Existing rows are retained. The migration stops if existing data contains
-- more than one primary location for the same item.
--
-- Rollback:
-- Drop the index and function in a separate approved migration.
--
-- RLS:
-- The function is security invoker and performs its work through the existing
-- item and item_location policies. It does not use a service role.
--
-- Test:
-- supabase db reset and supabase test db.

create unique index item_location_one_primary_per_item_unique
  on public.item_location (item_id)
  where czy_glowna;

create function public.set_item_primary_location(
  p_item_id uuid,
  p_storage_location_l3_id uuid default null
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_current_household_id uuid;
  v_item_household_id uuid;
  v_location_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  v_current_household_id := public.current_household_id();

  if v_current_household_id is null then
    raise exception 'ACTIVE_PROFILE_REQUIRED';
  end if;

  select i.household_id
  into v_item_household_id
  from public.item as i
  where i.id = p_item_id;

  if not found then
    raise exception 'ITEM_NOT_FOUND';
  end if;

  if v_item_household_id <> v_current_household_id then
    raise exception 'ITEM_HOUSEHOLD_MISMATCH';
  end if;

  if not public.is_household_admin(v_item_household_id) then
    raise exception 'ADMIN_REQUIRED';
  end if;

  if p_storage_location_l3_id is not null then
    select r.household_id
    into v_location_household_id
    from public.storage_location_l3 as l3
    join public.storage_location_l2 as l2
      on l2.id = l3.storage_location_l2_id
    join public.room as r
      on r.id = l2.room_id
    where l3.id = p_storage_location_l3_id;

    if not found or v_location_household_id <> v_item_household_id then
      raise exception 'LOCATION_HOUSEHOLD_MISMATCH';
    end if;
  end if;

  delete from public.item_location
  where item_id = p_item_id
    and czy_glowna;

  if p_storage_location_l3_id is not null then
    insert into public.item_location (
      item_id,
      storage_location_l3_id,
      czy_glowna
    )
    values (
      p_item_id,
      p_storage_location_l3_id,
      true
    );
  end if;
end;
$$;

revoke all on function public.set_item_primary_location(uuid, uuid) from public;
grant execute on function public.set_item_primary_location(uuid, uuid)
  to authenticated;
