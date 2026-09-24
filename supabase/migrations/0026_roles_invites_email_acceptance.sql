-- Purpose: complete secure invitation delivery/acceptance without changing 0024/0025.
-- Data: no existing invitation/profile rows are rewritten or deleted.
-- Rollback: forward migration restoring prior function signatures only after the
-- application no longer calls inspection/compensation and invitation history is archived.
-- RLS: token inspection discloses no household data before verified auth/email match;
-- delivery compensation and acceptance remain authenticated SECURITY DEFINER RPCs.
-- Tests: pgTAP/RLS, populated migration replay, independent-session concurrency and E2E.

alter table public.household_invitation_event
  drop constraint household_invitation_event_event_check,
  drop constraint household_invitation_event_reason_check;

alter table public.household_invitation_event
  add constraint household_invitation_event_event_check
    check (event in ('created', 'accepted', 'revoked', 'delivery_failed')),
  add constraint household_invitation_event_reason_check
    check (reason in (
      'manual', 'renewed', 'expired_replaced', 'alternative_accepted',
      'smtp_auth', 'smtp_rate_limit', 'smtp_rejected', 'smtp_timeout',
      'smtp_transport'
    ));

create or replace function public.create_household_invitation(
  p_email text,
  p_target_role public.profile_role
)
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

  perform pg_advisory_xact_lock(
    hashtextextended('homeback:invitation-rate:' || auth.uid()::text, 0)
  );
  if (
    select count(*) >= 5
    from public.household_invitation_event e
    where e.profil_id = auth.uid()
      and e.event = 'created'
      and e.timestamp > clock_timestamp() - interval '15 minutes'
  ) then
    raise exception 'INVITATION_RATE_LIMITED';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('homeback:invitation:' || v_email, 0));
  if (
    select count(*) >= 3
    from public.household_invitation i
    where i.household_id = v_household
      and i.email = v_email
      and i.created_at > clock_timestamp() - interval '1 hour'
  ) then
    raise exception 'INVITATION_RATE_LIMITED';
  end if;

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
  return query select v_id, v_token, v_expiry;
end;
$$;

create function public.compensate_household_invitation_delivery_failure(
  p_invitation_id uuid,
  p_failure_class text
)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_inv public.household_invitation%rowtype;
  v_reason text := 'smtp_' || p_failure_class;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if v_reason not in ('smtp_auth', 'smtp_rate_limit', 'smtp_rejected', 'smtp_timeout', 'smtp_transport') then
    raise exception 'DELIVERY_FAILURE_CLASS_INVALID';
  end if;

  select * into v_inv from public.household_invitation where id = p_invitation_id;
  if not found or not public.is_household_admin(v_inv.household_id) then
    raise exception 'INVITATION_NOT_FOUND';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('homeback:invitation:' || v_inv.email, 0));
  select * into v_inv from public.household_invitation where id = p_invitation_id for update;
  if v_inv.status <> 'pending' then raise exception 'INVITATION_NOT_PENDING'; end if;

  update public.household_invitation
    set status = 'revoked', revoked_at = clock_timestamp()
    where id = v_inv.id;
  insert into public.household_invitation_event(
    invitation_id, household_id, profil_id, event, reason
  ) values (
    v_inv.id, v_inv.household_id, auth.uid(), 'delivery_failed', v_reason
  );
end;
$$;

create function public.inspect_household_invitation(p_token text)
returns table (
  state text,
  invitation_email text,
  account_exists boolean,
  household_name text,
  target_role public.profile_role,
  suggested_name text,
  member_role public.profile_role
)
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_auth_email text;
  v_verified timestamptz;
  v_name text;
  v_inv public.household_invitation%rowtype;
  v_profile public.profile%rowtype;
  v_account_exists boolean := false;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    return query select 'invalid'::text, null::text, false, null::text,
      null::public.profile_role, null::text, null::public.profile_role;
    return;
  end if;

  select * into v_inv
  from public.household_invitation i
  where i.token_hash = extensions.digest(p_token, 'sha256');

  if not found then
    return query select 'invalid'::text, null::text, false, null::text,
      null::public.profile_role, null::text, null::public.profile_role;
    return;
  end if;

  if v_inv.status = 'accepted' then
    return query select 'used'::text, null::text, false, null::text,
      null::public.profile_role, null::text, null::public.profile_role;
    return;
  end if;
  if v_inv.status = 'revoked' then
    return query select 'revoked'::text, null::text, false, null::text,
      null::public.profile_role, null::text, null::public.profile_role;
    return;
  end if;
  if v_inv.expires_at <= clock_timestamp() then
    return query select 'expired'::text, null::text, false, null::text,
      null::public.profile_role, null::text, null::public.profile_role;
    return;
  end if;

  select exists(
    select 1 from auth.users u where lower(btrim(u.email)) = v_inv.email
  ) into v_account_exists;

  if v_user is null then
    return query select
      case when v_account_exists then 'login_required' else 'registration_required' end,
      v_inv.email, v_account_exists, null::text, null::public.profile_role,
      null::text, null::public.profile_role;
    return;
  end if;

  select lower(btrim(u.email)), u.email_confirmed_at,
    nullif(btrim(u.raw_user_meta_data ->> 'imie'), '')
  into v_auth_email, v_verified, v_name
  from auth.users u where u.id = v_user;

  if v_verified is null then
    return query select 'awaiting_verification'::text, v_inv.email,
      v_account_exists, null::text, null::public.profile_role, v_name,
      null::public.profile_role;
    return;
  end if;
  if v_auth_email is null or v_auth_email <> v_inv.email then
    return query select 'wrong_email'::text, v_inv.email, v_account_exists,
      null::text, null::public.profile_role, v_name, null::public.profile_role;
    return;
  end if;

  select * into v_profile from public.profile p where p.id = v_user;
  if found and v_profile.household_id <> v_inv.household_id then
    return query select 'other_household'::text, v_inv.email, v_account_exists,
      null::text, null::public.profile_role, v_name, v_profile.rola;
    return;
  end if;

  return query
    select case when v_profile.id is null then 'ready' else 'already_member' end,
      v_inv.email, v_account_exists, h.nazwa, v_inv.target_role,
      coalesce(nullif(btrim(v_profile.imie), ''), v_name), v_profile.rola
    from public.household h where h.id = v_inv.household_id;
end;
$$;

drop function public.accept_household_invitation(text, text);
create function public.accept_household_invitation(p_token text, p_imie text)
returns table (household_id uuid, outcome text, role public.profile_role)
language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_email text;
  v_verified timestamptz;
  v_inv public.household_invitation%rowtype;
  v_profile public.profile%rowtype;
  v_other uuid;
  v_outcome text := 'accepted';
  v_role public.profile_role;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  select lower(btrim(u.email)), u.email_confirmed_at into v_email, v_verified
    from auth.users u where u.id = v_user for update;
  if v_verified is null or v_email is null then raise exception 'VERIFIED_EMAIL_REQUIRED'; end if;
  if nullif(btrim(p_imie), '') is null then raise exception 'PROFILE_NAME_REQUIRED'; end if;

  perform pg_advisory_xact_lock(hashtextextended('homeback:invitation:' || v_email, 0));
  select * into v_inv from public.household_invitation i
    where i.token_hash = extensions.digest(p_token, 'sha256') and i.email = v_email for update;
  if not found or v_inv.status <> 'pending' or v_inv.expires_at <= clock_timestamp()
    or v_inv.target_role not in ('dorosły', 'dziecko') then
    raise exception 'INVITATION_INVALID';
  end if;

  select * into v_profile from public.profile p where p.id = v_user for update;
  if found then
    if v_profile.household_id <> v_inv.household_id then
      raise exception 'INVITATION_OTHER_HOUSEHOLD';
    end if;
    v_outcome := 'already_member';
    v_role := v_profile.rola;
  else
    insert into public.profile(id, household_id, imie, email, rola, status)
      values (v_user, v_inv.household_id, btrim(p_imie), v_email, v_inv.target_role, 'aktywny');
    v_role := v_inv.target_role;
  end if;

  update public.household_invitation
    set status = 'accepted', accepted_by = v_user, accepted_at = clock_timestamp()
    where id = v_inv.id;
  insert into public.household_invitation_event(invitation_id, household_id, profil_id, event)
    values (v_inv.id, v_inv.household_id, v_user, 'accepted');

  for v_other in select id from public.household_invitation
    where email = v_email and status = 'pending' and expires_at > clock_timestamp() order by id
  loop
    perform public.invitation_revoke_locked(v_other, 'alternative_accepted');
  end loop;

  return query select v_inv.household_id, v_outcome, v_role;
end;
$$;

revoke all on function public.compensate_household_invitation_delivery_failure(uuid, text)
  from public, anon, authenticated;
revoke all on function public.inspect_household_invitation(text)
  from public, anon, authenticated;
revoke all on function public.accept_household_invitation(text, text)
  from public, anon, authenticated;
grant execute on function public.compensate_household_invitation_delivery_failure(uuid, text)
  to authenticated;
grant execute on function public.inspect_household_invitation(text)
  to anon, authenticated;
grant execute on function public.accept_household_invitation(text, text)
  to authenticated;
