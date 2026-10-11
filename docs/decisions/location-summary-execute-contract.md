# Explicit anonymous denial for location dependency summaries

Date: 2026-10-10. Scope: existing M4D.2 function ACL contract only.

The original [M4D.2 decision](m4d-2-location-dependency-summary-plan.md)
requires restricted EXECUTE access. Migration 0007 revokes only PostgreSQL's
PUBLIC grant; that does not remove Supabase's direct `anon` default grant.
Migration 0023 replaces the room and L2 bodies while preserving their ACLs.

[Controlled CI](https://github.com/qdominik/HomeBack.app/actions/runs/38057589243)
compares main `3bd65a4642867d2cb0e73536a9c2cef9baa054a1` and PR #67
`910dda1f2cc474f6f7bc80f8437021da5cb035fa`, with exact CLI 2.109.1 and
2.120.0 on otherwise identical fresh runners. Both snapshots pass 1081
assertions with the old CLI and fail the same three anonymous ACL assertions
with the new CLI. Their `supabase` Git trees are identical.

The new bootstrap keeps legacy default privileges when
`auto_expose_new_tables` is unset. For each summary, `proacl` is
`{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}`.
PUBLIC EXECUTE is false, anon EXECUTE true, authenticated EXECUTE true.
There are no inherited roles for anon or authenticated. The direct anon
grant is created before migration 0007 and survives migration 0023.

This is a function ACL contract defect, not evidence of data disclosure.
All three functions remain SECURITY INVOKER, check auth/profile/admin before
reading the target, and preserve household isolation through RLS. Actual anon
calls before the fix enter the function and raise AUTH_REQUIRED (P0001).
After the fix they fail at the function permission boundary (42501).

## Minimal correction

Add a forward migration containing only three REVOKE EXECUTE statements from
PUBLIC and anon, for the room/L2/L3 summary signatures. Preserve existing
authenticated/service_role grants, owners, function bodies and attributes,
default privileges, tables, data, RLS and every unrelated function ACL.
Do not edit historical migrations. No GRANT is added.

Keep all existing negative ACL assertions. Extend test 0009 with three
actual calls under SET LOCAL ROLE anon, expecting permission denial. Retain
the body-level AUTH_REQUIRED test under authenticated as an independent check.
The compatibility workflow runs full pgTAP and the existing populated migration
and concurrency checks with both exact CLI versions, without a retry or
failure suppression.

This forward migration is isolated from PR #67's local bootstrap correction.
It has only been applied to a newly created disposable local test database.
It is submitted for review; hosted execution is a separate owner operation.

## Verification evidence

- Legacy-grant reproduction before the migration: test 0009 fails 6/67,
  including the original three ACL assertions and all three real anon calls.
- Same database after the migration: test 0009 passes 67/67.
- Full pgTAP on that database using each exact CLI: 22 files, 1084/1084 PASS.
- Existing populated migration check: 3/3 PASS, profile fields and enum OID
  preserved. Existing independent concurrency assertions: 7/7 PASS.
- Compatibility CI validates fresh databases under both bootstraps; ordinary
  CI also validates App and E2E on the final head.

References:

- [PostgreSQL default privileges](https://www.postgresql.org/docs/17/sql-alterdefaultprivileges.html)
- [CREATE OR REPLACE preserves function permissions](https://www.postgresql.org/docs/17/sql-createfunction.html)
- [Supabase database functions and EXECUTE](https://supabase.com/docs/guides/database/functions)
- [CLI 2.120.0 bootstrap](https://github.com/supabase/cli/blob/v2.120.0/apps/cli/src/command-internal/db-bootstrap/db-setup.ts)
