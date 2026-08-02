# Preview deployment contract - 2026-08-02

## Preview purpose / scope

This document records the HomeBack.app Preview Supabase Hosted Auth checkpoint and the operational contract for the preview environment.

The purpose of this preview is owner/internal testing of the HomeBack.app product application after hosted Supabase Auth was connected and manually verified. It is not a production deployment and it is not the sales landing page.

Application boundaries:

- Product application production target: `https://my.homeback.app`
- Sales landing page target: `https://homeback.app`
- Preview app URL: `https://homeback-app-git-preview-supabase-hos-0c79a6-qdominiks-projects.vercel.app`

No new product features, database schema changes, RLS changes, Supabase configuration changes, Storage buckets, or deployment actions are introduced by this document.

Status: PARTIAL.

Confirmed in this checkpoint:

- Preview Auth works for the owner manual smoke scope.
- Preview app is connected to hosted Supabase project `homeback-preview`.
- Stable Auth checkpoint tag exists: `preview-supabase-hosted-auth-stable`.

Not fully accepted yet:

- full preview smoke for `/home`, `/items`, and `/categories`,
- Storage upload and Storage RLS per `household_id`,
- formal preview data reset/retention policy,
- exact Auth Site URL and redirect allow-list from Supabase panel,
- Vercel Preview env var verification from Vercel panel,
- cookies over HTTPS,
- CORS/origin policy,
- production Supabase ref for formal separation evidence.

## Branch / deploy mapping

| Field | Value |
| --- | --- |
| Branch | `preview/supabase-hosted-preview` |
| Stable checkpoint HEAD | `4084d06 fix: accept anon key in Supabase config` |
| Stable checkpoint tag | `preview-supabase-hosted-auth-stable` |
| Preview URL | `https://homeback-app-git-preview-supabase-hos-0c79a6-qdominiks-projects.vercel.app` |
| Deployment provider | Vercel Preview |
| Production deploy | Out of scope |
| Merge to `main` | Out of scope |

The stable Auth checkpoint is explicitly `4084d06` and tag `preview-supabase-hosted-auth-stable`. The branch may contain later documentation/CI commits; those commits do not change the stable Auth checkpoint unless a new owner acceptance is recorded.

## Supabase Preview project

Owner-provided Supabase Preview details:

| Field | Value |
| --- | --- |
| Project name | `homeback-preview` |
| Project ref / Project ID | `yzewupqxkefyvljnfolk` |
| Supabase URL | `https://yzewupqxkefyvljnfolk.supabase.co` |
| Region | `eu-west-3` |
| Region description | West EU (Paris) |
| Owner | `qdominik@gmail.com` |
| Access | organization-wide access, 1 member |
| Role | Owner |
| Auth version | `2.194.0` |
| PostgREST version | `14.15` |
| Postgres version | `17.6.1.155` |
| Environment role | Preview / testing |
| Production separation | Treated as separate Preview project; production ref is `PENDING` / `[WYMAGA POTWIERDZENIA]` |

Preview must not share writable production data. Production Supabase ref must be recorded later to formally prove separation.

## Vercel Preview env

Expected Vercel Preview runtime configuration:

| Variable | Expected value / status |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://homeback-app-git-preview-supabase-hos-0c79a6-qdominiks-projects.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://yzewupqxkefyvljnfolk.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | preview publishable/anon key for project `yzewupqxkefyvljnfolk`; value must not be written to docs or repo |
| Vercel panel verification | `PENDING` / `[WYMAGA POTWIERDZENIA]` |

Rules:

- Do not commit API keys, Supabase service role keys, Vercel tokens, SMTP credentials, or private env values.
- `NEXT_PUBLIC_*` names and public URLs/refs may be documented; key values must not be written.
- The expected values above are documented from owner-provided context, but exact Vercel panel settings remain `PENDING` / `[WYMAGA POTWIERDZENIA]`.

## Auth configuration

Stable Auth checkpoint:

| Check | Status |
| --- | --- |
| signup | passed |
| email confirmation | passed |
| login | passed |
| logout | passed |
| tester | owner manual |
| status | owner manual smoke passed for Auth |
| checkpoint commit | `4084d06 fix: accept anon key in Supabase config` |
| checkpoint tag | `preview-supabase-hosted-auth-stable` |

Auth settings still requiring recorded confirmation from Supabase panel:

- exact Supabase Auth Site URL: `PENDING` / `[WYMAGA POTWIERDZENIA]`,
- exact redirect allow-list: `PENDING` / `[WYMAGA POTWIERDZENIA]`,
- no wildcard redirect origins: `PENDING` / `[WYMAGA POTWIERDZENIA]`,
- email confirmation setting: owner smoke passed, exact panel setting `PENDING` / `[WYMAGA POTWIERDZENIA]`,
- SMTP provider and rate limits before external testers: `PENDING` / `[WYMAGA POTWIERDZENIA]`.

The owner manual smoke proves the Auth flow worked at the stable checkpoint. It does not replace recording the actual Supabase Auth panel configuration.

## Data retention / reset policy

Known:

- Preview uses Supabase project `homeback-preview` / `yzewupqxkefyvljnfolk`.
- Environment role is Preview / testing.
- Preview must not contain production user data.

Policy status:

- final Preview data retention/reset policy: `PENDING` / `[WYMAGA POTWIERDZENIA]`,
- production Supabase ref for formal separation evidence: `PENDING` / `[WYMAGA POTWIERDZENIA]`,
- reset owner and procedure: `PENDING` / `[WYMAGA POTWIERDZENIA]`.

Until the final policy is approved:

- use synthetic, owner-created test data, or manually entered non-sensitive test records only,
- do not import production user data,
- do not run destructive reset operations from this agent session,
- do not target local shared Supabase or production hosted Supabase for preview cleanup.

## Storage scope

Storage upload is out of scope for the current Preview Auth checkpoint.

Storage requires a separate contract before file upload tests.

Current status:

- Storage upload: out of scope / pending,
- Storage RLS per `household_id`: out of scope / pending,
- Storage household-isolation tests: out of scope / pending,
- bucket creation or policy changes: not performed.

Before preview enables user file upload or document upload, a separate Storage contract must cover:

- private buckets only,
- object paths scoped by `household_id` or an equivalent household boundary,
- policies that prevent cross-household reads and writes,
- MIME allow-list,
- maximum file size,
- deletion/retention rules,
- tests proving one household cannot read another household's files.

## CORS / cookies

CORS/origin policy status:

- exact Supabase/Vercel origin allow-list: `PENDING` / `[WYMAGA POTWIERDZENIA]`,
- no wildcard origin for sensitive endpoints: `PENDING` / `[WYMAGA POTWIERDZENIA]`,
- no wildcard plus credentials: `PENDING` / `[WYMAGA POTWIERDZENIA]`,
- failed-origin behavior checked during smoke testing: `PENDING` / `[WYMAGA POTWIERDZENIA]`.

Cookie verification status:

- cookies over HTTPS inspected: `PENDING` / `[WYMAGA POTWIERDZENIA]`,
- `Secure` attribute verified: `PENDING` / `[WYMAGA POTWIERDZENIA]`,
- `HttpOnly` behavior verified where supported by Supabase SSR/session cookies: `PENDING` / `[WYMAGA POTWIERDZENIA]`,
- `SameSite` reviewed for email confirmation redirects: `PENDING` / `[WYMAGA POTWIERDZENIA]`,
- cookie domain narrowed to preview host or explicitly approved domain: `PENDING` / `[WYMAGA POTWIERDZENIA]`.

The owner Auth smoke confirms login/logout behavior worked, but it does not prove cookie attributes or CORS policy.

## Smoke test record

Owner manual Auth smoke record:

| Area | Result |
| --- | --- |
| signup | passed |
| email confirmation | passed |
| login | passed |
| logout | passed |
| tester | owner manual |
| status | owner manual smoke passed for Auth |
| preview URL | `https://homeback-app-git-preview-supabase-hos-0c79a6-qdominiks-projects.vercel.app` |
| branch | `preview/supabase-hosted-preview` |
| checkpoint commit | `4084d06 fix: accept anon key in Supabase config` |
| checkpoint tag | `preview-supabase-hosted-auth-stable` |
| Supabase project/ref | `homeback-preview` / `yzewupqxkefyvljnfolk` |

Pending smoke:

| Area | Status |
| --- | --- |
| `/home` | `PENDING` / `[WYMAGA POTWIERDZENIA]` |
| `/items` | `PENDING` / `[WYMAGA POTWIERDZENIA]` |
| `/categories` | `PENDING` / `[WYMAGA POTWIERDZENIA]` |
| broader write-path smoke beyond Auth | `PENDING` / `[WYMAGA POTWIERDZENIA]` |
| no-production-data visibility check | `PENDING` / `[WYMAGA POTWIERDZENIA]` |

Preview full-smoke attempt (2026-08-02):

| Field | Value |
| --- | --- |
| Result | `PARTIAL` / `[WYMAGA POTWIERDZENIA]` |
| Preview URL | `https://homeback-app-git-preview-supabase-hos-0c79a6-qdominiks-projects.vercel.app` |
| Branch | `preview/supabase-hosted-preview` |
| HEAD at test start | `c11b30d docs: document preview deployment contract` |
| Supabase ref | `yzewupqxkefyvljnfolk` |
| Tester | `Codex assisted` |
| Scope | `/home`, `/items`, `/categories` |
| `/home` | `PENDING` / `[WYMAGA POTWIERDZENIA]` |
| `/items` | `PENDING` / `[WYMAGA POTWIERDZENIA]` |
| `/categories` | `PENDING` / `[WYMAGA POTWIERDZENIA]` |
| Auth/session in this attempt | `PENDING` / `[WYMAGA POTWIERDZENIA]` |
| Known blocker | Browser connection failed in the sandbox before the Preview page could be opened. Repository Playwright configuration targets local `127.0.0.1` with local Mailpit and is not configured for this hosted Preview URL. |
| Production data used | No |
| Storage | Storage upload is out of scope for this smoke test. |

No application error was confirmed because the Preview UI was not reached. The route smoke remains pending and must be rerun with an interactive browser session or a Preview-specific test configuration and owner-approved synthetic credentials.
Future smoke evidence should include date, preview URL, commit SHA/tag, Supabase project/ref, tester, scope, and result.

## Pending confirmations

- production Supabase ref to formally confirm separation: `PENDING` / `[WYMAGA POTWIERDZENIA]`,
- final Preview data retention/reset policy: `PENDING` / `[WYMAGA POTWIERDZENIA]`,
- exact Supabase Auth Site URL from panel: `PENDING` / `[WYMAGA POTWIERDZENIA]`,
- exact Supabase Auth redirect allow-list from panel: `PENDING` / `[WYMAGA POTWIERDZENIA]`,
- Vercel Preview env vars match expected public URL/ref without secrets in repo: `PENDING` / `[WYMAGA POTWIERDZENIA]`,
- cookies over HTTPS: `PENDING` / `[WYMAGA POTWIERDZENIA]`,
- CORS/origin policy: `PENDING` / `[WYMAGA POTWIERDZENIA]`,
- full smoke for `/home`, `/items`, `/categories`: `PENDING` / `[WYMAGA POTWIERDZENIA]`,
- branch protection requiring green `CI / App` before `main` merge: `PENDING` / `[WYMAGA POTWIERDZENIA]`,
- owner-side GitHub Secret Scanning / push protection: `PENDING` / `[WYMAGA POTWIERDZENIA]`.

## Out of scope

For this checkpoint, the following are explicitly out of scope:

- merge to `main`,
- production deploy,
- new tag creation,
- force push,
- `landing-v201/` changes,
- application code changes,
- database schema changes,
- RLS or RPC changes,
- Supabase Storage bucket creation,
- Supabase Storage policy changes,
- Storage upload tests,
- production data import,
- destructive reset operations.

## Acceptance checklist

- [x] Preview URL selected and documented.
- [x] Preview hosted Supabase project/ref and region selected and documented.
- [x] Stable Auth checkpoint tag recorded.
- [x] Owner manual Auth smoke passed for signup, email confirmation, login, and logout.
- [ ] Production Supabase ref recorded for explicit separation evidence.
- [ ] Preview data retention/reset policy documented.
- [ ] Preview env vars verified in Vercel with no secrets in repo.
- [ ] Auth Site URL and redirect allow-list recorded.
- [ ] Cookie behavior verified over HTTPS.
- [ ] CORS/origin policy reviewed and recorded.
- [ ] Storage contract created before file upload tests, or file upload explicitly kept out of preview tester scope.
- [ ] CI checks green for the deployed commit under review.
- [ ] Dependency audit triage accepted for the review window.
- [ ] Secret scanning owner-side controls planned or enabled.
- [ ] Full `/home`, `/items`, and `/categories` smoke passed with evidence.
