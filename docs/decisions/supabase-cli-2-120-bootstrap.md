# Supabase CLI 2.120.0: local bootstrap permission regression

Date: 2026-10-10. Scope: PR #67, local development and disposable CI only.

## Evidence

The audited PR head was `910dda1f2cc474f6f7bc80f8437021da5cb035fa`;
the current main snapshot was `3bd65a4642867d2cb0e73536a9c2cef9baa054a1`.
Both have the same `supabase` Git tree:
`d9ff208f9d8ba2a34700af4e545a90ad3a140009`.
The lockfiles resolve CLI 2.109.1 and 2.120.0 respectively.

[Original CI](https://github.com/qdominik/HomeBack.app/actions/runs/38046285979)
failed only assertions 7–9 of `0009_location_dependency_summary.test.sql`:
1081 assertions in 22 files, 3 failures. App and E2E passed; populated migration
and concurrency checks were skipped after pgTAP failed.

[Controlled baseline with the same PostgreSQL image](https://github.com/qdominik/HomeBack.app/actions/runs/38058046273)
checks both immutable snapshots with each exact CLI version, using fresh
Ubuntu 24.04 runners, the same Node configuration, migrations, tests and
config. PostgreSQL is pinned to `17.11.0.004` in all four variants. Only the CLI
installation changes within each snapshot comparison; ancillary service images
are resolved by that CLI. The [initial baseline using bundled images](https://github.com/qdominik/HomeBack.app/actions/runs/38057589243)
has the same outcome. Local replays on the same existing PostgreSQL 17.6 engine
independently isolate the default-privilege difference from image changes.

| Snapshot | CLI 2.109.1 | CLI 2.120.0 |
| --- | --- | --- |
| main | 1081/1081 PASS | 1078/1081, FAIL assertions 7–9 |
| PR #67 | 1081/1081 PASS | 1078/1081, FAIL assertions 7–9 |

All four baseline variants independently passed populated migration checks
and real invitation concurrency checks. Failed pgTAP jobs remain failed;
there is no test retry or `continue-on-error`.

Before any tests, all three summary functions had these effective privileges:

| Bootstrap | PUBLIC EXECUTE | anon EXECUTE | authenticated EXECUTE |
| --- | --- | --- | --- |
| 2.109.1, flag unset | false | false | true |
| 2.120.0, flag unset | false | true | true |

The new bootstrap produces
`{postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}`.
The old bootstrap produces `{postgres=X/postgres,authenticated=X/postgres}`.
Owners are `postgres`; `prosecdef=false`. Neither `anon` nor `authenticated`
has role memberships. The new grant is direct, not inherited or from PUBLIC.

## Cause and decision

The image's initial schema grants EXECUTE by default on new functions in
`public` owned by `postgres` to the Data API roles. Before project migrations,
the Go CLI revokes these grants when `api.auto_expose_new_tables` is absent.
The TypeScript CLI 2.120.0 instead leaves them in place when the flag is absent.
Its explicit `false` branch still executes the revoke SQL. This contradicts
the existing config comment describing the unset state as opt-in exposure.

Sources:

- [Go bootstrap, v2.109.1](https://github.com/supabase/cli/blob/v2.109.1/apps/cli-go/internal/db/start/start.go)
- [TypeScript bootstrap, v2.120.0](https://github.com/supabase/cli/blob/v2.120.0/apps/cli/src/command-internal/db-bootstrap/db-setup.ts)
- [Supabase API default transition](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)
- [PostgreSQL default privileges](https://www.postgresql.org/docs/17/sql-alterdefaultprivileges.html)

Set `api.auto_expose_new_tables = false` explicitly in the local config.
This preserves the project's existing opt-in exposure policy for all new
entities, rather than relying on a version-dependent implicit default.
CLI 2.120.0 remains the tested upgrade. No migration, application function,
RLS policy, hosted configuration or negative permission assertion changes in
this PR. The temporary diagnostic workflow is removed after capturing the
baseline; its immutable Actions run remains evidence.

Migration 0007 also incompletely enforces the summary ACL contract when a
database has legacy grants: it revokes from PUBLIC only. Migration 0023 uses
CREATE OR REPLACE, preserving existing ACLs. [Independent migration PR #92](https://github.com/qdominik/HomeBack.app/pull/92)
addresses that existing-state problem and adds real-role denial regression
coverage. It is not applied to any hosted environment.

## Validation

Local schema-only replays in newly created databases reproduced both bootstrap
states: old 1081 PASS, new exactly 3 FAIL. The shared database was only read for
schema and role evidence; no reset or grant change was performed there.

Final validation uses the ordinary CI workflow on the final PR head: full
pgTAP, populated migration, concurrency, App and E2E. The baseline failure is
retained as a separate run, not converted to green through a retry.
