-- M4C.1: atomic copies of home structure and inventory entities.
-- Copies never include history, logs, files, timestamps or source identifiers.

create or replace function public.copy_room_with_structure(
  p_room_id uuid,
  p_name text,
  p_copy_structure boolean default true
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_household uuid := public.current_household_id();
  v_new_room uuid := gen_random_uuid();
  v_name text := nullif(trim(p_name), '');
  v_l2 record;
  v_l3 record;
  v_new_l2 uuid;
  v_new_l3 uuid;
  v_count_l2 int := 0;
  v_count_l3 int := 0;
  v_base text;
  v_suffix int := 1;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if v_household is null then raise exception 'ACTIVE_PROFILE_REQUIRED'; end if;
  if public.current_profile_role() <> 'admin'
     or not public.is_household_admin(v_household) then
    raise exception 'ADMIN_REQUIRED';
  end if;
  if v_name is null then raise exception 'INVALID_NAME'; end if;
  if not exists (select 1 from public.room where id = p_room_id and household_id = v_household) then
    raise exception 'SOURCE_NOT_AVAILABLE';
  end if;
  v_base := v_name;
  while exists (select 1 from public.room where household_id = v_household and lower(nazwa) = lower(v_name)) loop
    v_suffix := v_suffix + 1;
    v_name := v_base || ' ' || v_suffix::text;
  end loop;
  insert into public.room (id, household_id, nazwa, typ, ikona, opis, "kolejnoĹ›Ä‡")
    select v_new_room, v_household, v_name, typ, ikona, opis,
      coalesce((select max("kolejnoĹ›Ä‡") + 1 from public.room where household_id = v_household), 0)
    from public.room where id = p_room_id;
  if p_copy_structure then
    for v_l2 in select * from public.storage_location_l2 where room_id = p_room_id order by "kolejnoĹ›Ä‡", created_at loop
      v_new_l2 := gen_random_uuid();
      insert into public.storage_location_l2 (id, room_id, nazwa, typ, opis, "kolejnoĹ›Ä‡")
        values (v_new_l2, v_new_room, v_l2.nazwa, v_l2.typ, v_l2.opis, v_l2."kolejnoĹ›Ä‡");
      v_count_l2 := v_count_l2 + 1;
      for v_l3 in select * from public.storage_location_l3 where storage_location_l2_id = v_l2.id order by "kolejnoĹ›Ä‡", created_at loop
        v_new_l3 := gen_random_uuid();
        insert into public.storage_location_l3
          (id, storage_location_l2_id, nazwa, opis, kod_lokalizacji, "kolejnoĹ›Ä‡")
          values (v_new_l3, v_new_l2, v_l3.nazwa, v_l3.opis,
            left(v_l3.kod_lokalizacji, 48) || '-C' || substr(v_new_l3::text, 1, 6), v_l3."kolejnoĹ›Ä‡");
        v_count_l3 := v_count_l3 + 1;
      end loop;
    end loop;
  end if;
  return json_build_object('room_id', v_new_room, 'storage_location_l2_count', v_count_l2, 'storage_location_l3_count', v_count_l3);
end;
$$;

create or replace function public.copy_furniture_with_storage(
  p_storage_location_l2_id uuid,
  p_target_room_id uuid,
  p_name text,
  p_copy_storage boolean default true
)
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  v_household uuid := public.current_household_id();
  v_source record;
  v_new uuid := gen_random_uuid();
  v_name text := nullif(trim(p_name), '');
  v_l3 record;
  v_count int := 0;
  v_base text;
  v_suffix int := 1;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if v_household is null then raise exception 'ACTIVE_PROFILE_REQUIRED'; end if;
  if public.current_profile_role() <> 'admin' or not public.is_household_admin(v_household) then raise exception 'ADMIN_REQUIRED'; end if;
  select l2.* into v_source from public.storage_location_l2 l2 join public.room r on r.id=l2.room_id
    where l2.id=p_storage_location_l2_id and r.household_id=v_household;
  if not found then raise exception 'SOURCE_NOT_AVAILABLE'; end if;
  if not exists (select 1 from public.room where id=p_target_room_id and household_id=v_household) then raise exception 'TARGET_NOT_AVAILABLE'; end if;
  if v_name is null then raise exception 'INVALID_NAME'; end if;
  v_base := v_name;
  while exists (select 1 from public.storage_location_l2 where room_id=p_target_room_id and lower(nazwa)=lower(v_name)) loop
    v_suffix := v_suffix + 1;
    v_name := v_base || ' ' || v_suffix::text;
  end loop;
  insert into public.storage_location_l2(id,room_id,nazwa,typ,opis,"kolejnoĹ›Ä‡") values (v_new,p_target_room_id,v_name,v_source.typ,v_source.opis,coalesce((select max("kolejnoĹ›Ä‡")+1 from public.storage_location_l2 where room_id=p_target_room_id),0));
  if p_copy_storage then
    for v_l3 in select * from public.storage_location_l3 where storage_location_l2_id=p_storage_location_l2_id order by "kolejnoĹ›Ä‡",created_at loop
      insert into public.storage_location_l3(id,storage_location_l2_id,nazwa,opis,kod_lokalizacji,"kolejnoĹ›Ä‡") values (gen_random_uuid(),v_new,v_l3.nazwa,v_l3.opis,left(v_l3.kod_lokalizacji,48)||'-C'||substr(gen_random_uuid()::text,1,6),v_l3."kolejnoĹ›Ä‡");
      v_count:=v_count+1;
    end loop;
  end if;
  return json_build_object('storage_location_l2_id',v_new,'storage_location_l3_count',v_count);
end;
$$;

create or replace function public.copy_storage_space(
  p_storage_location_l3_id uuid,
  p_target_storage_location_l2_id uuid,
  p_name text
)
returns json
language plpgsql security definer set search_path = ''
as $$
declare v_household uuid:=public.current_household_id(); v_source record; v_new uuid:=gen_random_uuid(); v_name text:=nullif(trim(p_name),''); v_base text; v_suffix int:=1;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if v_household is null then raise exception 'ACTIVE_PROFILE_REQUIRED'; end if;
  if public.current_profile_role()<>'admin' or not public.is_household_admin(v_household) then raise exception 'ADMIN_REQUIRED'; end if;
  select l3.* into v_source from public.storage_location_l3 l3 join public.storage_location_l2 l2 on l2.id=l3.storage_location_l2_id join public.room r on r.id=l2.room_id where l3.id=p_storage_location_l3_id and r.household_id=v_household;
  if not found then raise exception 'SOURCE_NOT_AVAILABLE'; end if;
  if not exists (select 1 from public.storage_location_l2 l2 join public.room r on r.id=l2.room_id where l2.id=p_target_storage_location_l2_id and r.household_id=v_household) then raise exception 'TARGET_NOT_AVAILABLE'; end if;
  if v_name is null then raise exception 'INVALID_NAME'; end if;
  v_base := v_name;
  while exists (select 1 from public.storage_location_l3 where storage_location_l2_id=p_target_storage_location_l2_id and lower(nazwa)=lower(v_name)) loop
    v_suffix := v_suffix + 1;
    v_name := v_base || ' ' || v_suffix::text;
  end loop;
  insert into public.storage_location_l3(id,storage_location_l2_id,nazwa,opis,kod_lokalizacji,"kolejnoĹ›Ä‡") values(v_new,p_target_storage_location_l2_id,v_name,v_source.opis,left(v_source.kod_lokalizacji,48)||'-C'||substr(v_new::text,1,6),coalesce((select max("kolejnoĹ›Ä‡")+1 from public.storage_location_l3 where storage_location_l2_id=p_target_storage_location_l2_id),0));
  return json_build_object('storage_location_l3_id',v_new);
end;
$$;

create or replace function public.copy_item(
  p_item_id uuid,
  p_name text,
  p_target_storage_location_l3_id uuid default null
)
returns json
language plpgsql security definer set search_path = ''
as $$
declare v_household uuid:=public.current_household_id(); v_source public.item%rowtype; v_new uuid:=gen_random_uuid(); v_name text:=nullif(trim(p_name),''); v_owner uuid; v_base text; v_suffix int:=1;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if v_household is null then raise exception 'ACTIVE_PROFILE_REQUIRED'; end if;
  if public.current_profile_role() not in ('admin','domownik') then raise exception 'COPY_NOT_ALLOWED'; end if;
  select * into v_source from public.item where id=p_item_id and household_id=v_household;
  if not found then raise exception 'SOURCE_NOT_AVAILABLE'; end if;
  if v_name is null then raise exception 'INVALID_NAME'; end if;
  v_base := v_name;
  while exists (select 1 from public.item where household_id=v_household and lower(nazwa)=lower(v_name)) loop
    v_suffix := v_suffix + 1;
    v_name := v_base || ' ' || v_suffix::text;
  end loop;
  v_owner:=case when v_source.opiekun_id is not null and exists(select 1 from public.profile where id=v_source.opiekun_id and household_id=v_household and status='aktywny') then v_source.opiekun_id else null end;
  if p_target_storage_location_l3_id is not null and not exists(select 1 from public.storage_location_l3 l3 join public.storage_location_l2 l2 on l2.id=l3.storage_location_l2_id join public.room r on r.id=l2.room_id where l3.id=p_target_storage_location_l3_id and r.household_id=v_household) then raise exception 'TARGET_NOT_AVAILABLE'; end if;
  insert into public.item(id,household_id,category_id,nazwa,opis,typ,ilosc,jednostka,termin_waznosci,opiekun_id,status,przechowywany_w_sejfie,miniatura_url,notatki,created_by_id)
    values(v_new,v_household,v_source.category_id,v_name,v_source.opis,v_source.typ,v_source.ilosc,v_source.jednostka,v_source.termin_waznosci,v_owner,'w domu',false,null,v_source.notatki,auth.uid());
  if p_target_storage_location_l3_id is not null then insert into public.item_location(item_id,storage_location_l3_id,czy_glowna,notatka) values(v_new,p_target_storage_location_l3_id,true,null); end if;
  return json_build_object('item_id',v_new,'storage_location_l3_id',p_target_storage_location_l3_id);
end;
$$;

revoke all on function public.copy_room_with_structure(uuid,text,boolean) from public, anon;
revoke all on function public.copy_furniture_with_storage(uuid,uuid,text,boolean) from public, anon;
revoke all on function public.copy_storage_space(uuid,uuid,text) from public, anon;
revoke all on function public.copy_item(uuid,text,uuid) from public, anon;
grant execute on function public.copy_room_with_structure(uuid,text,boolean) to authenticated;
grant execute on function public.copy_furniture_with_storage(uuid,uuid,text,boolean) to authenticated;
grant execute on function public.copy_storage_space(uuid,uuid,text) to authenticated;
grant execute on function public.copy_item(uuid,text,uuid) to authenticated;
