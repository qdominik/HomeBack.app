-- Purpose:
-- Add the global system category "Inne" with a stable technical key.
--
-- Data impact:
-- Existing and new households can read the same global system category.
-- The migration stops before changing data when a custom category with the
-- same normalized name already exists, because the current global-system
-- category model cannot convert it without broadening its scope.
--
-- Rollback:
-- Remove only the system category with key = 'other' in a separate approved
-- migration after confirming that no items reference it.
--
-- RLS:
-- No changes. Existing system-category policies continue to protect this row.
--
-- Test:
-- `supabase db reset` and `supabase test db`.

do $$
declare
  v_custom_other_count integer;
begin
  if exists (
    select 1
    from public.category
    where key = 'other'
  ) then
    return;
  end if;

  select count(*)
  into v_custom_other_count
  from public.category
  where not czy_systemowa
    and lower(btrim(nazwa)) = 'inne';

  if v_custom_other_count > 0 then
    raise exception
      'SYSTEM_OTHER_CATEGORY_CONFLICT: custom category named Inne already exists';
  end if;

  insert into public.category (
    key,
    nazwa,
    czy_systemowa,
    widoczna_dla_dzieci
  )
  values ('other', 'Inne', true, true);
end;
$$;
