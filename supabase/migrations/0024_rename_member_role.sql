-- Purpose: rename the existing enum value without rewriting/deleting profiles.
-- Enum OIDs and existing enum-based policies remain intact. PL/pgSQL source
-- containing the old label must be replaced explicitly.
-- Rollback: coordinated forward migration renaming dorosły back to domownik,
-- reverting copy_item and deploying the matching application version.
-- RLS: same inventory/storage permissions; no new adult/child permissions.
-- Onboarding also locks auth.users, sharing acceptance's one-household guard.
-- Tests: full pgTAP regression and populated-database migration verification.

alter type public.profile_role rename value 'domownik' to 'dorosły';

create or replace function public.copy_item(
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
  if public.current_profile_role() not in ('admin', 'dorosły') then
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

create or replace function public.create_household_with_admin(
  p_nazwa text,
  p_typ public.household_type,
  p_imie text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_household_id uuid;
begin
  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if nullif(btrim(p_nazwa), '') is null then
    raise exception 'HOUSEHOLD_NAME_REQUIRED';
  end if;

  if nullif(btrim(p_imie), '') is null then
    raise exception 'PROFILE_NAME_REQUIRED';
  end if;

  perform 1 from auth.users where id = v_user_id for update;

  if exists (
    select 1
    from public.profile as p
    where p.id = v_user_id
  ) then
    raise exception 'PROFILE_ALREADY_EXISTS';
  end if;

  select u.email
  into v_email
  from auth.users as u
  where u.id = v_user_id;

  if v_email is null then
    raise exception 'AUTH_EMAIL_REQUIRED';
  end if;

  insert into public.household (nazwa, typ)
  values (btrim(p_nazwa), p_typ)
  returning id into v_household_id;

  insert into public.profile (
    id,
    household_id,
    imie,
    email,
    rola,
    status
  )
  values (
    v_user_id,
    v_household_id,
    btrim(p_imie),
    v_email,
    'admin',
    'aktywny'
  );

  return v_household_id;
end;
$$;
