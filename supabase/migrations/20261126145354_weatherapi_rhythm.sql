-- UI-06B: additive, no existing household/profile data rewrite.
-- Rollback requires a separately reviewed migration once preferences exist.
begin;
create table public.household_weather_location (
 household_id uuid primary key references public.household(id) on delete cascade,
 city text not null check (length(trim(city)) between 1 and 120),
 postal_code text not null default '' check(length(postal_code)<=20),
 country text not null check(country ~ '^[A-Z]{2}$'),
 revision integer not null default 1 check(revision>0),
 provider_id bigint,
 name text, region text, provider_country text,
 latitude double precision check(latitude between -90 and 90),
 longitude double precision check(longitude between -180 and 180),
 timezone text,
 updated_at timestamptz not null default now(),
 check ((latitude is null and longitude is null and timezone is null and provider_id is null)
   or (latitude is not null and longitude is not null and timezone is not null and provider_id is not null and name is not null))
);
create table public.profile_appearance_preferences (
 profil_id uuid primary key references public.profile(id) on delete cascade,
 household_id uuid not null references public.household(id) on delete cascade,
 mode text not null default 'auto' check(mode in ('auto','light','dark')),
 weather_enabled boolean not null default true,
 motion boolean not null default true,
 intensity text not null default 'subtle' check(intensity in ('subtle','standard')),
 revision integer not null default 1 check(revision>0),
 updated_at timestamptz not null default now()
);
alter table public.household_weather_location enable row level security;
alter table public.profile_appearance_preferences enable row level security;
revoke all on public.household_weather_location, public.profile_appearance_preferences from public,anon,authenticated;
grant select,insert,update,delete on public.household_weather_location to authenticated;
grant select,insert,update on public.profile_appearance_preferences to authenticated;
create policy weather_location_read on public.household_weather_location for select to authenticated
 using(household_id=(select public.current_household_id()));
create policy weather_location_insert on public.household_weather_location for insert to authenticated
 with check(public.is_household_admin(household_id));
create policy weather_location_update on public.household_weather_location for update to authenticated
 using(public.is_household_admin(household_id)) with check(public.is_household_admin(household_id));
create policy weather_location_delete on public.household_weather_location for delete to authenticated
 using(public.is_household_admin(household_id));
create policy appearance_read on public.profile_appearance_preferences for select to authenticated
 using(profil_id=(select auth.uid()) and household_id=(select public.current_household_id()));
create policy appearance_insert on public.profile_appearance_preferences for insert to authenticated
 with check(profil_id=(select auth.uid()) and household_id=(select public.current_household_id()));
create policy appearance_update on public.profile_appearance_preferences for update to authenticated
 using(profil_id=(select auth.uid()) and household_id=(select public.current_household_id()))
 with check(profil_id=(select auth.uid()) and household_id=(select public.current_household_id()));

create function public.rhythm_location_revision() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP='UPDATE' then
 if new.household_id<>old.household_id then raise exception 'immutable_household' using errcode='23514'; end if;
 if (new.city,new.postal_code,new.country) is distinct from (old.city,old.postal_code,old.country) then
  new.provider_id=null;new.name=null;new.region=null;new.provider_country=null;
  new.latitude=null;new.longitude=null;new.timezone=null;
 end if;
 new.revision=old.revision+1;
 else new.revision=1; end if;
 if new.timezone is not null and not exists(select 1 from pg_catalog.pg_timezone_names where name=new.timezone) then
  raise exception 'invalid_timezone' using errcode='23514';
 end if;
 new.updated_at=now();return new;
end; $$;
create trigger rhythm_location_revision before insert or update on public.household_weather_location for each row execute function public.rhythm_location_revision();
create function public.rhythm_preferences_revision() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP='UPDATE' then
 if new.profil_id<>old.profil_id or new.household_id<>old.household_id then raise exception 'immutable_owner' using errcode='23514'; end if;
 new.revision=old.revision+1;
 else new.revision=1; end if;
 new.updated_at=now();return new;
end; $$;
create trigger rhythm_preferences_revision before insert or update on public.profile_appearance_preferences for each row execute function public.rhythm_preferences_revision();
revoke all on function public.rhythm_location_revision(),public.rhythm_preferences_revision() from public,anon,authenticated;

-- Shared provider data, never an exposed user API. Service role only, also for RPCs.
create table public.weather_location_cache (
 location_key text primary key,
 payload jsonb,
 expires_at timestamptz,
 retry_at timestamptz,
 lease_until timestamptz,
 lease_token uuid
);
alter table public.weather_location_cache enable row level security;
revoke all on public.weather_location_cache from public,anon,authenticated;
grant select,insert,update,delete on public.weather_location_cache to service_role;
create function public.weather_cache_claim(p_key text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare r public.weather_location_cache; token uuid;
begin
 insert into public.weather_location_cache(location_key) values(p_key) on conflict do nothing;
 select * into r from public.weather_location_cache where location_key=p_key for update;
 if r.expires_at>now() and r.payload is not null then return jsonb_build_object('kind','cached','payload',r.payload); end if;
 if r.lease_until>now() or r.retry_at>now() then return jsonb_build_object('kind','busy'); end if;
 token=gen_random_uuid();
 update public.weather_location_cache set lease_token=token,lease_until=now()+interval '30 seconds' where location_key=p_key;
 return jsonb_build_object('kind','claimed','token',token);
end; $$;
create function public.weather_cache_finish(p_key text,p_token uuid,p_payload jsonb,p_retry_seconds integer default 120)
 returns boolean language plpgsql security invoker set search_path='' as $$
begin
 update public.weather_location_cache set payload=p_payload,
 expires_at=case when p_payload is not null then now()+interval '45 minutes' else null end,
 retry_at=case when p_payload is null then now()+make_interval(secs=>greatest(60,least(600,p_retry_seconds))) else null end,
 lease_until=null,lease_token=null
 where location_key=p_key and lease_token=p_token and lease_until>now();
 return found;
end; $$;
revoke all on function public.weather_cache_claim(text),public.weather_cache_finish(text,uuid,jsonb,integer) from public,anon,authenticated;
grant execute on function public.weather_cache_claim(text),public.weather_cache_finish(text,uuid,jsonb,integer) to service_role;
notify pgrst,'reload schema';
commit;
