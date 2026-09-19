begin;
create extension if not exists pgtap with schema extensions;
set search_path = extensions, public, auth;
select no_plan();

insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values
 ('a1000000-0000-0000-0000-000000000001','admin@email-flow.test',now(),'{"imie":"Admin"}'),
 ('a1000000-0000-0000-0000-000000000002','join@email-flow.test',now(),'{"imie":"Join"}'),
 ('a1000000-0000-0000-0000-000000000003','same@email-flow.test',now(),'{"imie":"Same"}'),
 ('a1000000-0000-0000-0000-000000000004','foreign@email-flow.test',now(),'{"imie":"Foreign"}'),
 ('a1000000-0000-0000-0000-000000000005','wrong@email-flow.test',now(),'{"imie":"Wrong"}'),
 ('a1000000-0000-0000-0000-000000000006','unverified@email-flow.test',null,'{"imie":"Unverified"}');

insert into public.household(id,nazwa,typ) values
 ('a2000000-0000-0000-0000-000000000001','Email Flow A','dom'),
 ('a2000000-0000-0000-0000-000000000002','Email Flow B','dom');

insert into public.profile(id,household_id,imie,email,rola,status) values
 ('a1000000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000001','Admin','admin@email-flow.test','admin','aktywny'),
 ('a1000000-0000-0000-0000-000000000003','a2000000-0000-0000-0000-000000000001','Same','same@email-flow.test','dorosły','aktywny'),
 ('a1000000-0000-0000-0000-000000000004','a2000000-0000-0000-0000-000000000002','Foreign','foreign@email-flow.test','dziecko','aktywny');

create temp table email_flow_tokens(label text primary key, token text not null, invitation_id uuid not null);
insert into email_flow_tokens values
 ('ready',repeat('a',64),'a3000000-0000-0000-0000-000000000001'),
 ('registration',repeat('b',64),'a3000000-0000-0000-0000-000000000002'),
 ('same',repeat('c',64),'a3000000-0000-0000-0000-000000000003'),
 ('foreign',repeat('d',64),'a3000000-0000-0000-0000-000000000004'),
 ('expired',repeat('e',64),'a3000000-0000-0000-0000-000000000005'),
 ('revoked',repeat('f',64),'a3000000-0000-0000-0000-000000000006'),
 ('used',repeat('1',64),'a3000000-0000-0000-0000-000000000007'),
 ('unverified',repeat('2',64),'a3000000-0000-0000-0000-000000000008'),
 ('compensate',repeat('3',64),'a3000000-0000-0000-0000-000000000009');

insert into public.household_invitation(
 id,household_id,email,target_role,token_hash,created_by,status,created_at,expires_at,accepted_by,accepted_at,revoked_at
)
select t.invitation_id,
 case when t.label='foreign' then 'a2000000-0000-0000-0000-000000000001'::uuid else 'a2000000-0000-0000-0000-000000000001'::uuid end,
 case t.label
   when 'ready' then 'join@email-flow.test'
   when 'registration' then 'new@email-flow.test'
   when 'same' then 'same@email-flow.test'
   when 'foreign' then 'foreign@email-flow.test'
   when 'expired' then 'expired@email-flow.test'
   when 'revoked' then 'revoked@email-flow.test'
   when 'used' then 'used@email-flow.test'
   when 'unverified' then 'unverified@email-flow.test'
   else 'compensate@email-flow.test'
 end,
 case when t.label='same' then 'dziecko' else 'dorosły' end::public.profile_role,
 extensions.digest(t.token,'sha256'),
 'a1000000-0000-0000-0000-000000000001',
 case when t.label='revoked' then 'revoked' when t.label='used' then 'accepted' else 'pending' end,
 case when t.label='expired' then now()-interval '49 hours' else now() end,
 case when t.label='expired' then now()-interval '1 hour' else now()+interval '48 hours' end,
 case when t.label='used' then 'a1000000-0000-0000-0000-000000000003'::uuid end,
 case when t.label='used' then now() end,
 case when t.label='revoked' then now() end
from email_flow_tokens t;

set local role anon;
select is((select state from public.inspect_household_invitation(repeat('a',64))),'login_required','existing account is asked to log in');
select is((select state from public.inspect_household_invitation(repeat('b',64))),'registration_required','new account is asked to register');
select is((select invitation_email from public.inspect_household_invitation(repeat('b',64))),'new@email-flow.test','anonymous flow may prefill only the invitation email');
select is((select household_name from public.inspect_household_invitation(repeat('a',64))),null,'anonymous inspection hides household name');
select is((select target_role::text from public.inspect_household_invitation(repeat('a',64))),null,'anonymous inspection hides target role');
select is((select state from public.inspect_household_invitation('invalid')),'invalid','malformed token is invalid');
select is((select state from public.inspect_household_invitation(repeat('e',64))),'expired','expired token has a controlled state');
select is((select state from public.inspect_household_invitation(repeat('f',64))),'revoked','revoked token has a controlled state');
select is((select state from public.inspect_household_invitation(repeat('1',64))),'used','used token has a controlled state');
select throws_ok($$select public.accept_household_invitation(repeat('a',64),'Join')$$,'42501',null,'anonymous user cannot accept');
select throws_ok($$select public.compensate_household_invitation_delivery_failure('a3000000-0000-0000-0000-000000000009','transport')$$,'42501',null,'anonymous user cannot compensate delivery');

set local role authenticated;
set local "request.jwt.claims"='{"sub":"a1000000-0000-0000-0000-000000000002","role":"authenticated"}';
select is((select state from public.inspect_household_invitation(repeat('a',64))),'ready','verified matching account can inspect a ready invitation');
select is((select household_name from public.inspect_household_invitation(repeat('a',64))),'Email Flow A','household is disclosed only after verified email match');
select is((select target_role::text from public.inspect_household_invitation(repeat('a',64))),'dorosły','role is disclosed only after verified email match');

set local "request.jwt.claims"='{"sub":"a1000000-0000-0000-0000-000000000005","role":"authenticated"}';
select is((select state from public.inspect_household_invitation(repeat('a',64))),'wrong_email','wrong account is blocked');
select is((select household_name from public.inspect_household_invitation(repeat('a',64))),null,'wrong account sees no household name');

set local "request.jwt.claims"='{"sub":"a1000000-0000-0000-0000-000000000006","role":"authenticated"}';
select is((select state from public.inspect_household_invitation(repeat('2',64))),'awaiting_verification','unverified account cannot continue');

set local "request.jwt.claims"='{"sub":"a1000000-0000-0000-0000-000000000003","role":"authenticated"}';
select is((select state from public.inspect_household_invitation(repeat('c',64))),'already_member','same-household member gets idempotent state');
select is((select outcome from public.accept_household_invitation(repeat('c',64),'Ignored rename')),'already_member','same-household acceptance is idempotent');
select is((select count(*)::int from public.profile where id='a1000000-0000-0000-0000-000000000003'),1,'idempotent acceptance creates no duplicate profile');
select is((select rola::text from public.profile where id='a1000000-0000-0000-0000-000000000003'),'dorosły','idempotent acceptance does not alter existing role');
select is((select imie from public.profile where id='a1000000-0000-0000-0000-000000000003'),'Same','idempotent acceptance does not alter existing name');
reset role;
select is((select count(*)::int from public.household_invitation_event where invitation_id='a3000000-0000-0000-0000-000000000003' and event='accepted'),1,'idempotent acceptance creates one audit event');

set local role authenticated;
set local "request.jwt.claims"='{"sub":"a1000000-0000-0000-0000-000000000004","role":"authenticated"}';
select is((select state from public.inspect_household_invitation(repeat('d',64))),'other_household','member of another household gets a controlled state');
select throws_ok($$select public.accept_household_invitation(repeat('d',64),'Foreign')$$,'P0001','INVITATION_OTHER_HOUSEHOLD','acceptance cannot move an existing membership');
select is((select household_id from public.profile where id=auth.uid()),'a2000000-0000-0000-0000-000000000002'::uuid,'failed acceptance preserves original household');

set local "request.jwt.claims"='{"sub":"a1000000-0000-0000-0000-000000000001","role":"authenticated"}';
select lives_ok($$select public.compensate_household_invitation_delivery_failure('a3000000-0000-0000-0000-000000000009','timeout')$$,'admin can compensate a failed SMTP delivery');
select is((select status from public.household_invitation where id='a3000000-0000-0000-0000-000000000009'),'revoked','compensation revokes the unusable invitation');
select is((select reason from public.household_invitation_event where invitation_id='a3000000-0000-0000-0000-000000000009' and event='delivery_failed'),'smtp_timeout','compensation records only the technical failure class');
select throws_ok($$select public.compensate_household_invitation_delivery_failure('a3000000-0000-0000-0000-000000000009','provider-secret')$$,'P0001','DELIVERY_FAILURE_CLASS_INVALID','arbitrary provider details cannot enter the audit reason');

select lives_ok($$select public.create_household_invitation('rate-1@email-flow.test','dorosły')$$,'first rate-limited-window invitation succeeds');
select lives_ok($$select public.create_household_invitation('rate-2@email-flow.test','dorosły')$$,'second rate-limited-window invitation succeeds');
select lives_ok($$select public.create_household_invitation('rate-3@email-flow.test','dorosły')$$,'third rate-limited-window invitation succeeds');
select lives_ok($$select public.create_household_invitation('rate-4@email-flow.test','dorosły')$$,'fourth rate-limited-window invitation succeeds');
select lives_ok($$select public.create_household_invitation('rate-5@email-flow.test','dorosły')$$,'fifth rate-limited-window invitation succeeds');
select throws_ok($$select public.create_household_invitation('rate-6@email-flow.test','dorosły')$$,'P0001','INVITATION_RATE_LIMITED','sixth invitation in fifteen minutes is rejected');

reset role;
select * from finish();
rollback;
