# Secret scanning baseline and plan - 2026-08-02

## Scope

This note covers the HomeBack.app product application repository after separating the sales landing page project. It does not validate the owner's private machines, hosted Supabase, Vercel project settings, GitHub organization settings, or the separate landing repository.

## Local baseline commands

```bash
git ls-files
git grep -n -I -E "(SUPABASE_SERVICE_ROLE|SERVICE_ROLE|SECRET|PRIVATE_KEY|BEGIN [A-Z ]*PRIVATE KEY|sk-[A-Za-z0-9]|ghp_[A-Za-z0-9]|github_pat_|xox[baprs]-|AKIA[0-9A-Z]{16}|[A-Za-z0-9_]*TOKEN|PASSWORD|PASS=|API_KEY)" -- . ':!package-lock.json'
git log --all --format=%H -G "(SUPABASE_SERVICE_ROLE|SERVICE_ROLE|SECRET|PRIVATE_KEY|BEGIN [A-Z ]*PRIVATE KEY|sk-[A-Za-z0-9]|ghp_[A-Za-z0-9]|github_pat_|xox[baprs]-|AKIA[0-9A-Z]{16}|[A-Za-z0-9_]*TOKEN|PASSWORD|PASS=|API_KEY)" -- . ':!package-lock.json'
git show --name-only --format=oneline <matching-history-commits>
```

## Current tracked tree result

No live secret value was identified in tracked application files by the local broad-pattern scan.

Observed tracked matches are documented placeholders or comments only:

- `docs/ops/production-readiness-report.md` mentions the possible CI secret name `SUPABASE_ACCESS_TOKEN` without a value.
- `supabase/config.toml` contains commented examples such as `env(SECRET_VALUE)`, `env(SENDGRID_API_KEY)`, and AWS secret field names without values.

Tracked environment files:

- `.env.example` is tracked and contains public variable names only.
- `.env.local` remains ignored by `.gitignore` and is not tracked.

## History result

The broad history scan returned matching commits. File-name review shows matches in:

- production-readiness documentation,
- initial prototype documentation/configuration,
- previous landing worktree snapshots and landing metadata that are now outside the application repository boundary.

This local grep-based review is not a full secret scan. It does not prove that repository history is clean.

## Required owner-side controls

Before enabling preview or production, the repository owner should complete these controls in GitHub or an approved security scanner:

1. Enable GitHub Secret Scanning and Push Protection for the repository or organization.
2. Run a full history scan with GitHub Secret Scanning, Gitleaks, TruffleHog, or an equivalent tool.
3. Include the separated landing repository in the same scan once it is initialized.
4. Review any finding with the secret owner and classify it as true positive, false positive, or documentation-only.
5. Rotate any exposed credential, even if the credential is believed to be expired.
6. Record the scan date, tool, result, owner, and any rotation in `docs/ops` or the owner's private security register.

## CI recommendation

Do not rely on ad hoc grep as the long-term CI secret scanner. It is useful as a local smoke check, but it is noisy and misses encoded or provider-specific secrets.

Recommended CI policy:

- GitHub Secret Scanning with Push Protection is the primary control.
- Pull requests must not include `.env.local`, hosted service keys, Supabase service role keys, Vercel tokens, GitHub tokens, SMTP credentials, or private keys.
- Any CI token such as `SUPABASE_ACCESS_TOKEN` must be stored only as a GitHub Actions secret and must never be echoed in logs.

## Current status

Status: PARTIAL.

The current tracked application tree has a clean local baseline for obvious secret values. Full history and hosted-service scanning remain owner-side tasks before preview/production.