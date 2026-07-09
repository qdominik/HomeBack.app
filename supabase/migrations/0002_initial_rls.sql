-- Cel:
-- Dodanie izolacji household_id, polityk rol, atomowego onboardingu
-- oraz ochrony ostatniego administratora.
--
-- Wplyw na dane:
-- Nie zmienia istniejacych rekordow. Dodaje funkcje, trigger, polityki i granty.
--
-- Cofniecie:
-- Usunac polityki, trigger i funkcje w odwrotnej kolejnosci w osobnej migracji.
--
-- RLS:
-- Wszystkie tabele pozostaja z wlaczonym RLS. Anon nie otrzymuje dostepu.
--
-- Test:
-- `supabase db reset` oraz `supabase test db`.

create function public.current_household_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.household_id
  from public.profile as p
  where p.id = auth.uid()
    and p.status = 'aktywny'
  limit 1;
$$;

create function public.current_profile_role()
returns public.profile_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.rola
  from public.profile as p
  where p.id = auth.uid()
    and p.status = 'aktywny'
  limit 1;
$$;

create function public.is_household_admin(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profile as p
    where p.id = auth.uid()
      and p.household_id = target_household_id
      and p.rola = 'admin'
      and p.status = 'aktywny'
  );
$$;

create function public.create_household_with_admin(
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

create function public.protect_last_household_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_removes_active_admin boolean;
begin
  if old.rola <> 'admin' or old.status <> 'aktywny' then
    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    v_removes_active_admin := true;
  else
    v_removes_active_admin :=
      new.rola <> 'admin'
      or new.status <> 'aktywny'
      or new.household_id <> old.household_id;
  end if;

  if v_removes_active_admin and not exists (
    select 1
    from public.profile as p
    where p.household_id = old.household_id
      and p.id <> old.id
      and p.rola = 'admin'
      and p.status = 'aktywny'
  ) then
    raise exception 'LAST_ADMIN_REQUIRED';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create trigger profile_protect_last_admin
before update of household_id, rola, status or delete
on public.profile
for each row execute function public.protect_last_household_admin();

revoke all on function public.current_household_id() from public;
revoke all on function public.current_profile_role() from public;
revoke all on function public.is_household_admin(uuid) from public;
revoke all on function public.create_household_with_admin(
  text,
  public.household_type,
  text
) from public;
revoke all on function public.protect_last_household_admin() from public;

grant execute on function public.current_household_id() to authenticated;
grant execute on function public.current_profile_role() to authenticated;
grant execute on function public.is_household_admin(uuid) to authenticated;
grant execute on function public.create_household_with_admin(
  text,
  public.household_type,
  text
) to authenticated;

grant select, update on table public.household to authenticated;
grant select, update, delete on table public.profile to authenticated;
grant select, insert, update, delete on table public.room to authenticated;
grant select, insert, update, delete on table public.storage_location_l2 to authenticated;
grant select, insert, update, delete on table public.storage_location_l3 to authenticated;
grant select, insert, update, delete on table public.category to authenticated;
grant select, insert, update, delete on table public.item to authenticated;
grant select, insert, update, delete on table public.item_location to authenticated;
grant select, insert, update, delete on table public.file to authenticated;
grant select, insert, update, delete on table public.log to authenticated;

create policy household_select_own
on public.household
for select
to authenticated
using (id = public.current_household_id());

create policy household_update_admin
on public.household
for update
to authenticated
using (public.is_household_admin(id))
with check (public.is_household_admin(id));

create policy profile_select_household
on public.profile
for select
to authenticated
using (household_id = public.current_household_id());

create policy profile_update_admin
on public.profile
for update
to authenticated
using (public.is_household_admin(household_id))
with check (household_id = public.current_household_id());

create policy profile_delete_admin
on public.profile
for delete
to authenticated
using (public.is_household_admin(household_id));

create policy room_select_household
on public.room
for select
to authenticated
using (household_id = public.current_household_id());

create policy room_insert_admin
on public.room
for insert
to authenticated
with check (
  household_id = public.current_household_id()
  and public.is_household_admin(household_id)
);

create policy room_update_admin
on public.room
for update
to authenticated
using (public.is_household_admin(household_id))
with check (
  household_id = public.current_household_id()
  and public.is_household_admin(household_id)
);

create policy room_delete_admin
on public.room
for delete
to authenticated
using (public.is_household_admin(household_id));

create policy storage_location_l2_select_household
on public.storage_location_l2
for select
to authenticated
using (
  exists (
    select 1
    from public.room as r
    where r.id = room_id
      and r.household_id = public.current_household_id()
  )
);

create policy storage_location_l2_insert_admin
on public.storage_location_l2
for insert
to authenticated
with check (
  exists (
    select 1
    from public.room as r
    where r.id = room_id
      and public.is_household_admin(r.household_id)
  )
);

create policy storage_location_l2_update_admin
on public.storage_location_l2
for update
to authenticated
using (
  exists (
    select 1
    from public.room as r
    where r.id = room_id
      and public.is_household_admin(r.household_id)
  )
)
with check (
  exists (
    select 1
    from public.room as r
    where r.id = room_id
      and public.is_household_admin(r.household_id)
  )
);

create policy storage_location_l2_delete_admin
on public.storage_location_l2
for delete
to authenticated
using (
  exists (
    select 1
    from public.room as r
    where r.id = room_id
      and public.is_household_admin(r.household_id)
  )
);

create policy storage_location_l3_select_household
on public.storage_location_l3
for select
to authenticated
using (
  exists (
    select 1
    from public.storage_location_l2 as l2
    join public.room as r on r.id = l2.room_id
    where l2.id = storage_location_l2_id
      and r.household_id = public.current_household_id()
  )
);

create policy storage_location_l3_insert_admin
on public.storage_location_l3
for insert
to authenticated
with check (
  exists (
    select 1
    from public.storage_location_l2 as l2
    join public.room as r on r.id = l2.room_id
    where l2.id = storage_location_l2_id
      and public.is_household_admin(r.household_id)
  )
);

create policy storage_location_l3_update_admin
on public.storage_location_l3
for update
to authenticated
using (
  exists (
    select 1
    from public.storage_location_l2 as l2
    join public.room as r on r.id = l2.room_id
    where l2.id = storage_location_l2_id
      and public.is_household_admin(r.household_id)
  )
)
with check (
  exists (
    select 1
    from public.storage_location_l2 as l2
    join public.room as r on r.id = l2.room_id
    where l2.id = storage_location_l2_id
      and public.is_household_admin(r.household_id)
  )
);

create policy storage_location_l3_delete_admin
on public.storage_location_l3
for delete
to authenticated
using (
  exists (
    select 1
    from public.storage_location_l2 as l2
    join public.room as r on r.id = l2.room_id
    where l2.id = storage_location_l2_id
      and public.is_household_admin(r.household_id)
  )
);

create policy category_select_allowed
on public.category
for select
to authenticated
using (
  (
    czy_systemowa
    and household_id is null
    and (
      public.current_profile_role() <> 'dziecko'
      or widoczna_dla_dzieci
    )
  )
  or
  (
    not czy_systemowa
    and household_id = public.current_household_id()
    and (
      public.current_profile_role() <> 'dziecko'
      or widoczna_dla_dzieci
    )
  )
);

create policy category_insert_admin
on public.category
for insert
to authenticated
with check (
  not czy_systemowa
  and key is null
  and household_id = public.current_household_id()
  and public.is_household_admin(household_id)
);

create policy category_update_admin
on public.category
for update
to authenticated
using (
  not czy_systemowa
  and public.is_household_admin(household_id)
)
with check (
  not czy_systemowa
  and key is null
  and household_id = public.current_household_id()
  and public.is_household_admin(household_id)
);

create policy category_delete_admin
on public.category
for delete
to authenticated
using (
  not czy_systemowa
  and public.is_household_admin(household_id)
);

create policy item_select_allowed
on public.item
for select
to authenticated
using (
  household_id = public.current_household_id()
  and (
    public.current_profile_role() <> 'dziecko'
    or exists (
      select 1
      from public.category as c
      where c.id = category_id
        and c.widoczna_dla_dzieci
        and (
          c.household_id = public.current_household_id()
          or (c.czy_systemowa and c.household_id is null)
        )
    )
  )
);

create policy item_insert_admin
on public.item
for insert
to authenticated
with check (
  household_id = public.current_household_id()
  and public.is_household_admin(household_id)
  and created_by_id = auth.uid()
  and exists (
    select 1
    from public.category as c
    where c.id = category_id
      and (
        c.household_id = public.current_household_id()
        or (c.czy_systemowa and c.household_id is null)
      )
  )
  and (
    opiekun_id is null
    or exists (
      select 1
      from public.profile as owner_profile
      where owner_profile.id = opiekun_id
        and owner_profile.household_id = public.current_household_id()
    )
  )
);

create policy item_update_admin
on public.item
for update
to authenticated
using (public.is_household_admin(household_id))
with check (
  household_id = public.current_household_id()
  and public.is_household_admin(household_id)
  and exists (
    select 1
    from public.category as c
    where c.id = category_id
      and (
        c.household_id = public.current_household_id()
        or (c.czy_systemowa and c.household_id is null)
      )
  )
  and exists (
    select 1
    from public.profile as creator_profile
    where creator_profile.id = created_by_id
      and creator_profile.household_id = public.current_household_id()
  )
  and (
    opiekun_id is null
    or exists (
      select 1
      from public.profile as owner_profile
      where owner_profile.id = opiekun_id
        and owner_profile.household_id = public.current_household_id()
    )
  )
);

create policy item_delete_admin
on public.item
for delete
to authenticated
using (public.is_household_admin(household_id));

create policy item_location_select_household
on public.item_location
for select
to authenticated
using (
  exists (
    select 1
    from public.item as i
    where i.id = item_id
      and i.household_id = public.current_household_id()
  )
);

create policy item_location_insert_admin
on public.item_location
for insert
to authenticated
with check (
  exists (
    select 1
    from public.item as i
    where i.id = item_id
      and public.is_household_admin(i.household_id)
  )
  and exists (
    select 1
    from public.storage_location_l3 as l3
    join public.storage_location_l2 as l2
      on l2.id = l3.storage_location_l2_id
    join public.room as r on r.id = l2.room_id
    where l3.id = storage_location_l3_id
      and r.household_id = public.current_household_id()
  )
);

create policy item_location_update_admin
on public.item_location
for update
to authenticated
using (
  exists (
    select 1
    from public.item as i
    where i.id = item_id
      and public.is_household_admin(i.household_id)
  )
)
with check (
  exists (
    select 1
    from public.item as i
    where i.id = item_id
      and public.is_household_admin(i.household_id)
  )
  and exists (
    select 1
    from public.storage_location_l3 as l3
    join public.storage_location_l2 as l2
      on l2.id = l3.storage_location_l2_id
    join public.room as r on r.id = l2.room_id
    where l3.id = storage_location_l3_id
      and r.household_id = public.current_household_id()
  )
);

create policy item_location_delete_admin
on public.item_location
for delete
to authenticated
using (
  exists (
    select 1
    from public.item as i
    where i.id = item_id
      and public.is_household_admin(i.household_id)
  )
);

create policy file_select_household_adult
on public.file
for select
to authenticated
using (
  public.current_profile_role() in ('admin', 'domownik')
  and (
    household_id = public.current_household_id()
    or exists (
      select 1
      from public.item as i
      where i.id = item_id
        and i.household_id = public.current_household_id()
    )
  )
);

create policy file_insert_admin
on public.file
for insert
to authenticated
with check (
  created_by_id = auth.uid()
  and public.is_household_admin(public.current_household_id())
  and (
    household_id = public.current_household_id()
    or exists (
      select 1
      from public.item as i
      where i.id = item_id
        and i.household_id = public.current_household_id()
    )
  )
);

create policy file_update_admin
on public.file
for update
to authenticated
using (
  public.is_household_admin(public.current_household_id())
  and (
    household_id = public.current_household_id()
    or exists (
      select 1
      from public.item as i
      where i.id = item_id
        and i.household_id = public.current_household_id()
    )
  )
)
with check (
  public.is_household_admin(public.current_household_id())
  and (
    household_id = public.current_household_id()
    or exists (
      select 1
      from public.item as i
      where i.id = item_id
        and i.household_id = public.current_household_id()
    )
  )
);

create policy file_delete_admin
on public.file
for delete
to authenticated
using (
  public.is_household_admin(public.current_household_id())
  and (
    household_id = public.current_household_id()
    or exists (
      select 1
      from public.item as i
      where i.id = item_id
        and i.household_id = public.current_household_id()
    )
  )
);

create policy log_select_household
on public.log
for select
to authenticated
using (household_id = public.current_household_id());

create policy log_insert_admin
on public.log
for insert
to authenticated
with check (
  household_id = public.current_household_id()
  and public.is_household_admin(household_id)
  and profil_id = auth.uid()
);
