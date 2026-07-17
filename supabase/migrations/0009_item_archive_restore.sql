-- Purpose:
-- Preserve an item's status while archiving and restore it atomically.
--
-- Data impact:
-- Adds archived_at and status_before_archive to item. Existing archived rows
-- receive archived_at from updated_at (or created_at) and keep an unknown
-- previous status as null. No item status or item_location row is changed.
--
-- Rollback:
-- Drop archive_item/restore_item, the check constraint, and both columns in a
-- separate approved migration. Restored historical status data would be lost.
--
-- RLS:
-- Both functions are security invoker and require the active household admin.
-- Existing item RLS remains enabled and unchanged.
--
-- Test:
-- npx.cmd supabase db reset and npx.cmd supabase test db.

alter table public.item
  add column archived_at timestamptz,
  add column status_before_archive public.item_status;

update public.item
set archived_at = coalesce(updated_at, created_at)
where status = 'archiwalne'
  and archived_at is null;

alter table public.item
  add constraint item_status_before_archive_not_archived
  check (
    status_before_archive is null
    or status_before_archive <> 'archiwalne'
  );

create function public.archive_item(p_item_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_household_id uuid;
  v_current_status public.item_status;
begin
  if auth.uid() is null then
    return 'auth_required';
  end if;

  v_household_id := public.current_household_id();

  if v_household_id is null then
    return 'active_profile_required';
  end if;

  if public.current_profile_role() <> 'admin'
     or not public.is_household_admin(v_household_id) then
    return 'admin_required';
  end if;

  select i.status
  into v_current_status
  from public.item as i
  where i.id = p_item_id
    and i.household_id = v_household_id
  for update;

  if not found then
    return 'item_not_available';
  end if;

  if v_current_status = 'archiwalne' then
    return 'item_already_archived';
  end if;

  begin
    update public.item
    set status_before_archive = v_current_status,
        archived_at = now(),
        status = 'archiwalne'
    where id = p_item_id
      and household_id = v_household_id;

    if not found then
      return 'action_failed';
    end if;
  exception
    when others then
      return 'action_failed';
  end;

  return 'success';
end;
$$;

create function public.restore_item(
  p_item_id uuid,
  p_legacy_target_status public.item_status default null
)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_household_id uuid;
  v_current_status public.item_status;
  v_status_before_archive public.item_status;
  v_target_status public.item_status;
begin
  if auth.uid() is null then
    return 'auth_required';
  end if;

  v_household_id := public.current_household_id();

  if v_household_id is null then
    return 'active_profile_required';
  end if;

  if public.current_profile_role() <> 'admin'
     or not public.is_household_admin(v_household_id) then
    return 'admin_required';
  end if;

  select i.status, i.status_before_archive
  into v_current_status, v_status_before_archive
  from public.item as i
  where i.id = p_item_id
    and i.household_id = v_household_id
  for update;

  if not found then
    return 'item_not_available';
  end if;

  if v_current_status <> 'archiwalne' then
    return 'item_not_archived';
  end if;

  if v_status_before_archive is not null then
    v_target_status := v_status_before_archive;
  else
    if p_legacy_target_status is null then
      return 'restore_status_required';
    end if;

    if p_legacy_target_status = 'archiwalne' then
      return 'invalid_restore_status';
    end if;

    v_target_status := p_legacy_target_status;
  end if;

  if v_target_status = 'archiwalne' then
    return 'invalid_restore_status';
  end if;

  begin
    update public.item
    set status = v_target_status,
        status_before_archive = null,
        archived_at = null
    where id = p_item_id
      and household_id = v_household_id;

    if not found then
      return 'action_failed';
    end if;
  exception
    when others then
      return 'action_failed';
  end;

  return 'success';
end;
$$;

revoke all on function public.archive_item(uuid) from public;
revoke all on function public.archive_item(uuid) from anon;
grant execute on function public.archive_item(uuid) to authenticated;

revoke all on function public.restore_item(uuid, public.item_status) from public;
revoke all on function public.restore_item(uuid, public.item_status) from anon;
grant execute on function public.restore_item(uuid, public.item_status)
  to authenticated;

comment on function public.archive_item(uuid) is
  'Atomically archives one item and stores its previous status for the active household admin.';

comment on function public.restore_item(uuid, public.item_status) is
  'Atomically restores one archived item, requiring an explicit status only for legacy rows.';
