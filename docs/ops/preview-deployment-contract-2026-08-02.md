# Preview deployment contract - 2026-08-02

## Scope

This contract defines the minimum conditions for a HomeBack.app preview environment before it can be used for owner review or internal testers.

The sales landing page is out of scope. Landing targets `https://homeback.app`; this application targets `https://my.homeback.app` for production and a separate preview URL for preview.

## Status

Status: PARTIAL.

This document records the required contract. It does not prove that Vercel, hosted Supabase, DNS, Auth, Storage, cookies, CORS, or GitHub repository settings already match it.

## Environment matrix

| Environment | App URL | Supabase project | Data policy | Owner |
| --- | --- | --- | --- | --- |
| Local | `http://127.0.0.1:3000` | local Supabase only | local test data only | developer + Team A |
| Preview | `[TO DECIDE]` explicit HTTPS URL | dedicated preview Supabase project or documented isolated equivalent | no production user data | Platform + Product + Team A |
| Production | `https://my.homeback.app` | production hosted Supabase | real user data | Platform + DBA + Auth owner |

Preview must not share writable production data. If a shared hosted project is proposed, that proposal requires a separate decision record that proves strict isolation and retention boundaries.

## Required preview variables

Preview runtime variables must be set in the hosting provider, not committed to the repo:

- `NEXT_PUBLIC_SITE_URL` = the exact preview HTTPS origin
- `NEXT_PUBLIC_SUPABASE_URL` = preview Supabase API URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = preview publishable/anon key

`NEXT_PUBLIC_*` values are public client configuration and must not contain secrets. Service role keys, Supabase access tokens, SMTP credentials, Vercel tokens, and GitHub tokens must be stored only as provider or GitHub secrets.

## Auth contract

Preview Supabase Auth must be configured with:

- Site URL equal to the exact preview origin.
- Redirect allow-list containing only:
  - local development origins already approved for local work,
  - the exact preview origin plus `/auth/confirm`,
  - the production origin plus `/auth/confirm` only when production is intentionally configured.
- No wildcard redirect origins.
- Email confirmation behavior documented before owner testing.
- SMTP sender and rate limits reviewed before inviting external testers.

## Data isolation and retention

Preview data rules:

- No production user data may be imported into preview.
- Preview may use synthetic data, owner-created test data, or manually entered non-sensitive test records.
- Preview project ref, region, and database migration state must be recorded before first review.
- Preview retention must be explicit: either reset on demand, reset before each review cycle, or retained for a named period.
- Any deletion/reset of preview data is owner-controlled and must never target local shared Supabase or production hosted Supabase.

## Storage contract

Before preview enables user file upload or document upload, Supabase Storage must have a separate decision and implementation covering:

- private buckets only,
- object paths scoped by `household_id` or an equivalent non-guessable household boundary,
- policies that prevent cross-household reads and writes,
- MIME allow-list,
- maximum file size,
- deletion/retention rules,
- tests proving one household cannot read another household's files.

Until that Storage contract is implemented and verified, preview must not be treated as approved for real user files.

## Cookies and sessions

Preview cookie behavior must be verified in the deployed environment:

- HTTPS only for preview.
- `Secure` must be present for deployed preview cookies.
- `HttpOnly` must be present where Supabase SSR/session cookies support it.
- `SameSite` must be explicit and reviewed for email confirmation redirects.
- Cookie domain must be the narrow preview host, not a broad parent domain unless separately approved.

Local HTTP behavior must not be used as evidence for preview cookie security.

## CORS and origins

Preview CORS/origin policy must be explicit:

- no wildcard origin for sensitive endpoints,
- no wildcard plus credentials,
- local, preview, and production origins listed separately,
- hosted Supabase and hosting provider settings reviewed together,
- failed-origin behavior checked during smoke testing.

## CI and branch protection gate

Preview deployment requires:

- app CI workflow passing on the preview branch or PR,
- `npm audit` triage current enough for the review window,
- secret scanning baseline completed for current tracked tree,
- owner-side GitHub Secret Scanning or equivalent planned before external testers,
- branch protection requiring green checks before merge to `main`.

The database/pgTAP CI job remains a separate task. Until it exists, Team A must provide manual database validation evidence before preview promotion involving schema/RLS/RPC changes.

## Smoke test gate

Minimum preview smoke test before owner review:

1. Open preview URL over HTTPS.
2. Register or sign in with a test account.
3. Confirm email flow reaches `/auth/confirm` on the preview origin.
4. Create or access a test household.
5. Read Dashboard, Home, Items, Categories, Family, Documents, and Settings without server errors.
6. Create, update, and delete a non-sensitive test Room/Furniture/Storage structure record if the review scope includes writes.
7. Confirm no production data is visible.
8. Confirm logout clears the session from the preview UI.

Smoke test evidence must include date, preview URL, commit SHA, Supabase project/ref, tester, and result.

## Open decisions

- `[TO DECIDE]` exact preview URL.
- `[TO DECIDE]` dedicated preview Supabase project/ref and region.
- `[TO DECIDE]` preview data retention policy.
- `[TO DECIDE]` whether preview permits file uploads before the Storage contract is implemented.
- `[TO DECIDE]` owner of smoke test execution and evidence.

## Acceptance checklist

- [ ] Preview URL selected and documented.
- [ ] Preview hosted Supabase project/ref selected and documented.
- [ ] Preview env vars set in hosting provider with no secrets in repo.
- [ ] Auth Site URL and redirect allow-list configured.
- [ ] Cookie behavior verified over HTTPS.
- [ ] CORS/origin policy reviewed.
- [ ] Storage contract either implemented or file uploads explicitly disabled/out of review scope.
- [ ] CI checks green for the deployed commit.
- [ ] Dependency audit triage accepted for the review window.
- [ ] Secret scanning owner-side controls planned or enabled.
- [ ] Smoke test passed with evidence.