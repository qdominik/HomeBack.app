-- Purpose: private membership reads and transactional application invitations.
-- Data: existing profiles stay intact; no placeholder profiles or owner model.
-- Rollback: forward migration removing invitation RPCs/tables only after archiving
-- history; restore previous profile grants/policies only after a security review.
-- RLS: own profile or household admin; invitation metadata/history admin-only.
-- Tests: supabase test db; scripts/test-invitation-concurrency.mjs.

create extension if not exists pgcrypto with schema extensions;

alter policy profile_select_household on public.profile
using (id = auth.uid() or public.is_household_admin(household_id));

-- Table-level UPDATE would allow role/household escalation, including by admins.
revoke update, delete on public.profile from authenticated;
grant update (imie, avatar_url) on public.profile to authenticated;

create function public.get_household_members()
returns table (id uuid, imie text, avatar_url text, rola public.profile_role,
  email text, status public.profile_status, created_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.imie, p.avatar_url, p.rola,
    case when public.is_household_admin(p.household_id) then p.email end,
    case when public.is_household_admin(p.household_id) then p.status end,
    case when public.is_household_admin(p.household_id) then p.created_at end
  from public.profile p
  where p.household_id = public.current_household_id()
    and (public.current_profile_role() in ('admin', 'dorosły') or p.id = auth.uid())
  order by p.imie, p.id;
$$;

create table public.household_invitation (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.household(id),
  email text not null check (email = lower(btrim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  target_role public.profile_role not null check (target_role in ('dorosły', 'dziecko')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  token_hash bytea not null unique check (octet_length(token_hash) = 32),
  created_by uuid not null references public.profile(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '48 hours'),
  accepted_by uuid references public.profile(id),
  accepted_at timestamptz,
  revoked_at timestamptz,
  replaces_id uuid references public.household_invitation(id),
  check (expires_at = created_at + interval '48 hours'),
  check ((status = 'accepted') = (accepted_by is not null and accepted_at is not null)),
  check ((status = 'revoked') = (revoked_at is not null))
);

-- now() cannot be used in an immutable index predicate. Creation retires any
-- expired pending row while holding the shared normalized-email lock.
create unique index household_invitation_pending_email_idx
  on public.household_invitation(household_id, email) where status = 'pending';
create index household_invitation_email_idx on public.household_invitation(email);

-- The existing log has no invitation object and permits client mutation.
-- Use the same household/actor/time conventions, with append-only RPC writes.
create table public.household_invitation_event (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.household_invitation(id),
  household_id uuid not null references public.household(id),
  profil_id uuid not null references public.profile(id),
  event text not null check (event in ('created', 'accepted', 'revoked')),
  reason text check (reason in ('manual', 'renewed', 'expired_replaced', 'alternative_accepted')),
  timestamp timestamptz not null default now()
);

alter table public.household_invitation enable row level security;
alter table public.household_invitation_event enable row level security;
revoke all on public.household_invitation, public.household_invitation_event from public, anon, authenticated;
-- Hashes are not part of any client read, including an administrator's SELECT *.
grant select (id, household_id, email, target_role, status, created_by, created_at,
  expires_at, accepted_by, accepted_at, revoked_at, replaces_id)
  on public.household_invitation to authenticated;
grant select on public.household_invitation_event to authenticated;
create policy invitation_select_admin on public.household_invitation
  for select to authenticated using (public.is_household_admin(household_id));
create policy invitation_event_select_admin on public.household_invitation_event
  for select to authenticated using (public.is_household_admin(household_id));

create function public.invitation_revoke_locked(p_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  with changed as (
    update public.household_invitation set status = 'revoked', revoked_at = clock_timestamp()
    where id = p_id and status = 'pending' returning id, household_id
  )
  insert into public.household_invitation_event(invitation_id, household_id, profil_id, event, reason)
    select id, household_id, auth.uid(), 'revoked', p_reason from changed;
end;
$$;

create function public.create_household_invitation(p_email text, p_target_role public.profile_role)
returns table (invitation_id uuid, token text, expires_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare
  v_household uuid := public.current_household_id();
  v_email text := lower(btrim(p_email));
  v_old public.household_invitation%rowtype;
  v_id uuid;
  v_token text;
  v_expiry timestamptz;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not public.is_household_admin(v_household) then raise exception 'ADMIN_REQUIRED'; end if;
  if p_target_role is null or p_target_role not in ('dorosły', 'dziecko') then
    raise exception 'INVITATION_ROLE_INVALID';
  end if;
  if v_email is null or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'INVITATION_EMAIL_INVALID';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('homeback:invitation:' || v_email, 0));
  select * into v_old from public.household_invitation i
    where i.household_id = v_household and i.email = v_email and i.status = 'pending' for update;
  if found then
    if v_old.expires_at > clock_timestamp() then raise exception 'INVITATION_ALREADY_PENDING'; end if;
    perform public.invitation_revoke_locked(v_old.id, 'expired_replaced');
  end if;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.household_invitation(household_id, email, target_role, token_hash, created_by)
    values (v_household, v_email, p_target_role, extensions.digest(v_token, 'sha256'), auth.uid())
    returning id, household_invitation.expires_at into v_id, v_expiry;
  insert into public.household_invitation_event(invitation_id, household_id, profil_id, event)
    values (v_id, v_household, auth.uid(), 'created');
  -- The sole raw-token disclosure. No token or hash is ever written to audit.
  return query select v_id, v_token, v_expiry;
end;
$$;

create function public.revoke_household_invitation(p_invitation_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_inv public.household_invitation%rowtype;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_inv from public.household_invitation where id = p_invitation_id;
  if not found or not public.is_household_admin(v_inv.household_id) then
    raise exception 'INVITATION_NOT_FOUND';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('homeback:invitation:' || v_inv.email, 0));
  select * into v_inv from public.household_invitation where id = p_invitation_id for update;
  if v_inv.status <> 'pending' then raise exception 'INVITATION_NOT_PENDING'; end if;
  perform public.invitation_revoke_locked(v_inv.id, 'manual');
end;
$$;

create function public.renew_household_invitation(p_invitation_id uuid)
returns table (invitation_id uuid, token text, expires_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare v_inv public.household_invitation%rowtype; v_issued record;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_inv from public.household_invitation where id = p_invitation_id;
  if not found or not public.is_household_admin(v_inv.household_id) then
    raise exception 'INVITATION_NOT_FOUND';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('homeback:invitation:' || v_inv.email, 0));
  select * into v_inv from public.household_invitation where id = p_invitation_id for update;
  if v_inv.status <> 'pending' then raise exception 'INVITATION_NOT_PENDING'; end if;
  perform public.invitation_revoke_locked(v_inv.id, 'renewed');
  select * into v_issued from public.create_household_invitation(v_inv.email, v_inv.target_role);
  update public.household_invitation set replaces_id = v_inv.id where id = v_issued.invitation_id;
  return query select v_issued.invitation_id, v_issued.token, v_issued.expires_at;
end;
$$;

create function public.accept_household_invitation(p_token text, p_imie text)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_verified timestamptz;
  v_inv public.household_invitation%rowtype;
  v_other uuid;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  -- Shared with onboarding: serializes even two different tokens for one user.
  select lower(btrim(u.email)), u.email_confirmed_at into v_email, v_verified
    from auth.users u where u.id = v_user for update;
  if v_verified is null or v_email is null then raise exception 'VERIFIED_EMAIL_REQUIRED'; end if;
  if nullif(btrim(p_imie), '') is null then raise exception 'PROFILE_NAME_REQUIRED'; end if;
  perform pg_advisory_xact_lock(hashtextextended('homeback:invitation:' || v_email, 0));
  select * into v_inv from public.household_invitation i
    where i.token_hash = extensions.digest(p_token, 'sha256') and i.email = v_email for update;
  -- Deliberately identical response for wrong email, revoked, expired and reused.
  if not found or v_inv.status <> 'pending' or v_inv.expires_at <= clock_timestamp()
    or v_inv.target_role not in ('dorosły', 'dziecko') then raise exception 'INVITATION_INVALID'; end if;
  if exists (select 1 from public.profile where id = v_user) then raise exception 'PROFILE_ALREADY_EXISTS'; end if;
  insert into public.profile(id, household_id, imie, email, rola, status)
    values (v_user, v_inv.household_id, btrim(p_imie), v_email, v_inv.target_role, 'aktywny');
  update public.household_invitation set status = 'accepted', accepted_by = v_user, accepted_at = clock_timestamp()
    where id = v_inv.id;
  insert into public.household_invitation_event(invitation_id, household_id, profil_id, event)
    values (v_inv.id, v_inv.household_id, v_user, 'accepted');
  for v_other in select id from public.household_invitation
    where email = v_email and status = 'pending' and expires_at > clock_timestamp() order by id
  loop
    perform public.invitation_revoke_locked(v_other, 'alternative_accepted');
  end loop;
  return v_inv.household_id;
end;
$$;

revoke all on function public.get_household_members() from public, anon, authenticated;
revoke all on function public.invitation_revoke_locked(uuid, text) from public, anon, authenticated;
revoke all on function public.create_household_invitation(text, public.profile_role) from public, anon, authenticated;
revoke all on function public.revoke_household_invitation(uuid) from public, anon, authenticated;
revoke all on function public.renew_household_invitation(uuid) from public, anon, authenticated;
revoke all on function public.accept_household_invitation(text, text) from public, anon, authenticated;
grant execute on function public.get_household_members() to authenticated;
grant execute on function public.create_household_invitation(text, public.profile_role) to authenticated;
grant execute on function public.revoke_household_invitation(uuid) to authenticated;
grant execute on function public.renew_household_invitation(uuid) to authenticated;
grant execute on function public.accept_household_invitation(text, text) to authenticated;
