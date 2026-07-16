-- Purpose:
-- Add one atomic, RLS-respecting operation for permanently deleting an item.
--
-- Data impact:
-- No existing rows are changed by the migration. Calling the function removes
-- all item_location rows for one item and then removes that item. Items with a
-- file row or miniatura_url are rejected until a separate Storage cleanup stage.
--
-- Rollback:
-- Drop public.delete_item_permanently(uuid) in a separate approved migration.
-- Permanently deleted data cannot be restored by rolling back this migration.
--
-- RLS:
-- The function is security invoker. It requires an authenticated active
-- household administrator and uses existing item, item_location, and file RLS.
--
-- Test:
-- npx.cmd supabase db reset and npx.cmd supabase test db.

create function public.delete_item_permanently(p_item_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_household_id uuid;
  v_item_id uuid;
  v_thumbnail_url text;
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

  select i.id, i.miniatura_url
  into v_item_id, v_thumbnail_url
  from public.item as i
  where i.id = p_item_id
    and i.household_id = v_household_id
  for update;

  if not found then
    return 'item_not_available';
  end if;

  if v_thumbnail_url is not null
     or exists (
       select 1
       from public.file as f
       where f.item_id = v_item_id
     ) then
    return 'item_has_files';
  end if;

  begin
    delete from public.item_location
    where item_id = v_item_id;

    delete from public.item
    where id = v_item_id
      and household_id = v_household_id;

    if not found then
      return 'deletion_failed';
    end if;
  exception
    when others then
      return 'deletion_failed';
  end;

  return 'success';
end;
$$;

revoke all on function public.delete_item_permanently(uuid) from public;
revoke all on function public.delete_item_permanently(uuid) from anon;
grant execute on function public.delete_item_permanently(uuid)
  to authenticated;

comment on function public.delete_item_permanently(uuid) is
  'Permanently deletes one file-free item and its location links for the active household admin.';
