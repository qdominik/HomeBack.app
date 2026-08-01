# Dependency Security Risk: sharp transitive optional dependency

Date: 2026-08-01
Status: ACCEPTED TEMPORARILY — DEFERRED
Owner: właściciel projektu / security review

## Package And Dependency Source

Affected package:

```text
sharp
```

Dependency path:

```text
homeback-app -> next -> sharp
```

The current application on `origin/main` uses `next@16.2.10`. `sharp@0.34.5` is installed as an optional transitive dependency of Next. HomeBack.app does not declare `sharp` directly in `package.json`.

## Severity

`npm audit` reports this as high severity.

## Character

This is a transitive optional dependency risk inherited through Next.js image tooling. The affected package is not a direct HomeBack.app dependency.

## Audit Finding

`npm audit` reports `sharp <0.35.0` as vulnerable because of inherited libvips vulnerabilities:

- CVE-2026-33327
- CVE-2026-33328
- CVE-2026-35590
- CVE-2026-35591

Advisory:

```text
GHSA-f88m-g3jw-g9cj
```

## Reason The Fix Was Not Applied

`sharp@0.35.x` satisfies the local Node runtime requirement checked during review (`node@24.18.0`), but it is outside the formal optional dependency range declared by Next.

Compatibility was checked against `next@16.2.12` as well as the current `origin/main` state. `next@16.2.12` still declares:

```text
sharp: ^0.34.5
```

Because `sharp@0.35.x` is outside `^0.34.5`, a direct override would force a package version beyond the contract published by Next. That override was not accepted as a routine dependency security patch.

## Rejected Solutions

Rejected:

- `npm audit fix --force`
- Downgrading Next
- An unverified `sharp@0.35.x` override outside Next's declared optional dependency contract

`npm audit fix --force` was rejected because it proposed an unacceptable Next downgrade path.

## Temporary Acceptance Conditions

This temporary risk acceptance applies only while all of the following remain true:

- The deployment target is an internal preview.
- No production household data is used.
- The application does not publicly accept untrusted image uploads or remote user-controlled images for processing through Next image optimization.
- No image-processing behavior, upload flow, remote image source, avatar feature, Supabase Storage image serving, or direct `sharp` usage is added without a renewed security review.

## Reopen Criteria

Reopen this decision when any of the following occurs:

- A new Next version officially supports `sharp >=0.35.0`.
- Next publishes an official patch for this dependency path.
- The application's exposure profile changes, especially around public image input or image processing.
- The application is prepared for production deployment.
- HomeBack.app starts using `sharp` directly.

## Decision

The current decision is:

```text
ACCEPT-RISK / DEFER
```

The `sharp` audit finding is accepted temporarily for internal preview only and remains deferred until a compatible upstream Next patch or an explicitly approved security change is available.