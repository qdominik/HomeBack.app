begin;
create extension if not exists pgtap with schema extensions;
set search_path = extensions, public, auth;
select no_plan();

insert into auth.users(id, email, email_confirmed_at) values
 ('91000000-0000-0000-0000-000000000001','admin-a@invites.test',now()),
 ('91000000-0000-0000-0000-000000000002','admin-b@invites.test',now()),
 ('91000000-0000-0000-0000-000000000003','adult@invites.test',now()),
 ('91000000-0000-0000-0000-000000000004','child@invites.test',now()),
 ('91000000-0000-0000-0000-000000000005','join@invites.test',now()),
 ('91000000-0000-0000-0000-000000000006','unverified@invites.test',null),
 ('91000000-0000-0000-0000-000000000007','other@invites.test',now());
insert into public.household(id,nazwa,typ) values
 ('92000000-0000-0000-0000-000000000001','Invites A','dom'),
 ('92000000-0000-0000-0000-000000000002','Invites B','dom');
insert into public.profile(id,household_id,imie,email,rola,status)
 select u.id, case when u.email='admin-b@invites.test' then '92000000-0000-0000-0000-000000000002'::uuid
   else '92000000-0000-0000-0000-000000000001'::uuid end, u.email, u.email,
   case when u.email like 'admin-%' then 'admin' when u.email like 'adult%' then 'dorosły' else 'dziecko' end::public.profile_role,
   'aktywny' from auth.users u where u.id in (
   '91000000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000002',
   '91000000-0000-0000-0000-000000000003','91000000-0000-0000-0000-000000000004');
insert into public.log(household_id,profil_id,akcja,typ_obiektu,obiekt_id,zmiana_po)
 values ('92000000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000001',
 'EDYTOWANO','PROFILE','91000000-0000-0000-0000-000000000003','{"email":"adult@invites.test"}');

-- Capture issuance without putting token values in TAP output or logs.
create temp table issued(label text primary key, invitation_id uuid, token text, expires_at timestamptz);
grant all on issued to authenticated;
set local role authenticated;
set local "request.jwt.claims"='{"sub":"91000000-0000-0000-0000-000000000001","role":"authenticated"}';
select is((select count(*)::int from public.get_household_members()),3,'admin sees own household members');
select is((select count(*)::int from public.get_household_members() where email is not null),3,'admin sees management data');
select is((select count(*)::int from public.log where typ_obiektu='PROFILE'),1,'admin can read historical profile activity');
select is((select count(*)::int from public.profile where household_id='92000000-0000-0000-0000-000000000002'),0,'foreign profiles are isolated');
select throws_ok($$update public.profile set rola='dorosły' where id=auth.uid()$$,'42501',null,'even admin cannot directly change own role');
select throws_ok($$update public.profile set household_id='92000000-0000-0000-0000-000000000002' where id=auth.uid()$$,'42501',null,'even admin cannot move own membership');
select throws_ok($$select public.create_household_invitation('x@invites.test','admin')$$,'P0001','INVITATION_ROLE_INVALID','admin invitation rejected');
select throws_ok($$select public.create_household_invitation('x@invites.test','gość')$$,'P0001','INVITATION_ROLE_INVALID','legacy guest cannot be invited');
select throws_ok($$select public.create_household_invitation('invalid','dziecko')$$,'P0001','INVITATION_EMAIL_INVALID','invalid email rejected');
insert into issued select 'join',* from public.create_household_invitation(' JOIN@invites.test ','dorosły');
insert into issued select 'expired',* from public.create_household_invitation('other@invites.test','dziecko');
insert into issued select 'unverified',* from public.create_household_invitation('unverified@invites.test','dorosły');
insert into issued select 'renew',* from public.create_household_invitation('renew@invites.test','dziecko');
select is((select email from public.household_invitation where id=(select invitation_id from issued where label='join')),'join@invites.test','email normalized');
select ok((select expires_at-created_at=interval '48 hours' from public.household_invitation where id=(select invitation_id from issued where label='join')),'48 hour lifetime');
select ok((select length(token)=64 from issued where label='join'),'256 bit token encoding');
select throws_ok($$select token_hash from public.household_invitation$$,'42501',null,'hash cannot be read by administrator');
select throws_ok($$select * from public.household_invitation$$,'42501',null,'SELECT star cannot expose hash');
select throws_ok($$select public.create_household_invitation('join@invites.test','dziecko')$$,'P0001','INVITATION_ALREADY_PENDING','normalized duplicate rejected');
select throws_ok($$update public.household_invitation set status='accepted'$$,'42501',null,'client cannot accept by UPDATE');
select throws_ok($$insert into public.household_invitation(household_id,email,target_role,token_hash,created_by) values ('92000000-0000-0000-0000-000000000001','direct@invites.test','admin',decode(repeat('a',64),'hex'),auth.uid())$$,'42501',null,'direct insertion denied');
select throws_ok($$delete from public.household_invitation_event$$,'42501',null,'audit history cannot be deleted');
select throws_ok($$select public.invitation_revoke_locked((select invitation_id from issued where label='join'),'manual')$$,'42501',null,'private helper cannot be invoked by client');
insert into issued select 'renew-new',* from public.renew_household_invitation((select invitation_id from issued where label='renew'));
select is((select status from public.household_invitation where id=(select invitation_id from issued where label='renew')),'revoked','renewal revokes predecessor');
select is((select replaces_id from public.household_invitation where id=(select invitation_id from issued where label='renew-new')),(select invitation_id from issued where label='renew'),'renewal links predecessor');
select is((select count(*)::int from public.household_invitation_event where invitation_id=(select invitation_id from issued where label='renew') and event='revoked' and reason='renewed'),1,'renewal retains history');
select ok((select token from issued where label='renew')<>(select token from issued where label='renew-new'),'renewal rotates token');
select lives_ok($$select public.revoke_household_invitation((select invitation_id from issued where label='renew-new'))$$,'administrator can revoke own invitation');

set local "request.jwt.claims"='{"sub":"91000000-0000-0000-0000-000000000002","role":"authenticated"}';
select throws_ok($$select public.revoke_household_invitation((select invitation_id from issued where label='join'))$$,'P0001','INVITATION_NOT_FOUND','foreign revocation denied');
select throws_ok($$select public.renew_household_invitation((select invitation_id from issued where label='join'))$$,'P0001','INVITATION_NOT_FOUND','foreign renewal denied');
select is((select count(*)::int from public.household_invitation where email='join@invites.test'),0,'foreign invitation unreadable');
select is((select count(*)::int from public.household_invitation_event),0,'foreign security audit unreadable');
insert into issued select 'alternative',* from public.create_household_invitation('join@invites.test','dziecko');
insert into issued select 'second',* from public.create_household_invitation('adult@invites.test','dziecko');

set local "request.jwt.claims"='{"sub":"91000000-0000-0000-0000-000000000003","role":"authenticated"}';
select is((select count(*)::int from public.get_household_members()),3,'adult sees own household member directory');
select is((select count(*)::int from public.get_household_members() where email is not null or status is not null or created_at is not null),0,'adult receives no email or account metadata');
select is((select count(*)::int from public.profile),1,'adult raw SELECT is limited to own profile');
select is((select count(*)::int from public.profile where id='91000000-0000-0000-0000-000000000001'),0,'adult cannot select peer email directly');
select is((select count(*)::int from public.household_invitation),0,'adult cannot read invitations');
select is((select count(*)::int from public.household_invitation_event),0,'adult cannot read administrative activity');
select is((select count(*)::int from public.log where typ_obiektu='PROFILE'),0,'adult cannot recover peer email from historical profile audit');
select throws_ok($$select public.create_household_invitation('x@invites.test','dziecko')$$,'P0001','ADMIN_REQUIRED','adult cannot invite');
select throws_ok($$update public.profile set rola='admin' where id=auth.uid()$$,'42501',null,'adult cannot self-promote');
select throws_ok($$select public.accept_household_invitation((select token from issued where label='second'),'Adult')$$,'P0001','PROFILE_ALREADY_EXISTS','existing member cannot accept another membership');

set local "request.jwt.claims"='{"sub":"91000000-0000-0000-0000-000000000004","role":"authenticated"}';
select is((select count(*)::int from public.get_household_members()),1,'child directory contains only self');
select is((select id from public.get_household_members()),auth.uid(),'child sees own profile');
select is((select count(*)::int from public.profile),1,'child raw SELECT contains only self');
select is((select count(*)::int from public.log where typ_obiektu='PROFILE'),0,'child cannot read administrative profile activity');
select throws_ok($$update public.profile set household_id='92000000-0000-0000-0000-000000000002' where id=auth.uid()$$,'42501',null,'child cannot move household');
select throws_ok($$select public.create_household_invitation('x@invites.test','dziecko')$$,'P0001','ADMIN_REQUIRED','child cannot invite');

set local "request.jwt.claims"='{"sub":"91000000-0000-0000-0000-000000000006","role":"authenticated"}';
select throws_ok($$select public.accept_household_invitation((select token from issued where label='unverified'),'Unverified')$$,'P0001','VERIFIED_EMAIL_REQUIRED','unverified email rejected');
set local "request.jwt.claims"='{"sub":"91000000-0000-0000-0000-000000000007","role":"authenticated"}';
select throws_ok($$select public.accept_household_invitation((select token from issued where label='join'),'Other')$$,'P0001','INVITATION_INVALID','token for another email rejected');
select throws_ok($$select public.accept_household_invitation('invalid','Other')$$,'P0001','INVITATION_INVALID','wrong token rejected');
reset role;
-- Trusted fixture simulates time without violating fixed 48h validity.
update public.household_invitation set created_at=now()-interval '49 hours',expires_at=now()-interval '1 hour'
 where id=(select invitation_id from issued where label='expired');
set local role authenticated;
select throws_ok($$select public.accept_household_invitation((select token from issued where label='expired'),'Other')$$,'P0001','INVITATION_INVALID','expired token rejected');
set local "request.jwt.claims"='{"sub":"91000000-0000-0000-0000-000000000005","role":"authenticated"}';
select is((select count(*)::int from public.get_household_members()),0,'nonmember cannot read members');
select throws_ok($$select public.accept_household_invitation(null,'Join')$$,'P0001','INVITATION_INVALID','null token rejected');
reset role;
-- Prove all membership/status/audit writes roll back if an audit insert fails.
create function public.invitation_test_reject_audit() returns trigger language plpgsql as $$
begin
  if new.event='accepted' then raise exception 'TEST_AUDIT_FAILURE'; end if;
  return new;
end;
$$;
create trigger invitation_test_reject_audit before insert on public.household_invitation_event
 for each row execute function public.invitation_test_reject_audit();
set local role authenticated;
select throws_ok($$select public.accept_household_invitation((select token from issued where label='join'),'Join')$$,'P0001','TEST_AUDIT_FAILURE','audit failure rejects entire transaction');
select is((select count(*)::int from public.profile where id=auth.uid()),0,'audit failure rolls back newly created membership');
reset role;
select is((select status from public.household_invitation where id=(select invitation_id from issued where label='join')),'pending','audit failure rolls back accepted status');
select is((select status from public.household_invitation where id=(select invitation_id from issued where label='alternative')),'pending','audit failure leaves alternative invitation unchanged');
drop trigger invitation_test_reject_audit on public.household_invitation_event;
drop function public.invitation_test_reject_audit();
set local role authenticated;
select is(public.accept_household_invitation((select token from issued where label='join'),' Join '),'92000000-0000-0000-0000-000000000001'::uuid,'acceptance returns household');
select is((select rola::text from public.profile where id=auth.uid()),'dorosły','acceptance assigns requested role');
select is((select imie from public.profile where id=auth.uid()),'Join','acceptance creates complete profile');
select throws_ok($$select public.accept_household_invitation((select token from issued where label='join'),'Join')$$,'P0001','INVITATION_INVALID','token reuse rejected');
select throws_ok($$select public.accept_household_invitation((select token from issued where label='alternative'),'Join')$$,'P0001','INVITATION_INVALID','revoked alternative rejected');
reset role;
select is((select status from public.household_invitation where id=(select invitation_id from issued where label='join')),'accepted','acceptance persists accepted state');
select is((select accepted_by from public.household_invitation where id=(select invitation_id from issued where label='join')),'91000000-0000-0000-0000-000000000005'::uuid,'acceptance persists actor');
select is((select status from public.household_invitation where id=(select invitation_id from issued where label='alternative')),'revoked','acceptance revokes competing household invitation');
select is((select count(*)::int from public.household_invitation_event where invitation_id=(select invitation_id from issued where label='join') and event='accepted'),1,'acceptance creates exactly one security event');
select ok((select token_hash=extensions.digest(token,'sha256') from public.household_invitation i join issued on i.id=issued.invitation_id where label='join'),'stored token is SHA256 hash');
select is((select count(*)::int from public.profile where id='91000000-0000-0000-0000-000000000006'),0,'failed acceptance leaves no profile');
select is((select status from public.household_invitation where id=(select invitation_id from issued where label='unverified')),'pending','failed acceptance leaves invitation unchanged');
set local role authenticated;
set local "request.jwt.claims"='{}';
select throws_ok($$select public.accept_household_invitation('invalid','Join')$$,'P0001','AUTH_REQUIRED','acceptance requires active session');
select is((select count(*)::int from public.get_household_members()),0,'missing session reads no members');
reset role;
set local role anon;
select throws_ok($$select public.get_household_members()$$,'42501',null,'anon has no directory RPC access');
select throws_ok($$select public.accept_household_invitation('invalid','Join')$$,'42501',null,'anon has no acceptance RPC access');
reset role;
select * from finish();
rollback;
