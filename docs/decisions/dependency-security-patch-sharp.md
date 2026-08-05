# Dependency security patch: sharp

Date: 2026-08-05

## Scope

Controlled dependency hardening for the transitive `sharp` dependency used by
`next@16.2.12`.

No application code, UI, Supabase migrations, RLS policies, RPC contracts or
tests were changed.

## Advisory

- Advisory: GHSA-f88m-g3jw-g9cj
- Package: `sharp`
- Affected range: `<0.35.0`
- Reason: inherited libvips vulnerabilities
- Patched version used: `sharp@0.35.3`

## Before

`next@16.2.12` installed:

```text
next@16.2.12
└── sharp@0.34.5
```

`npm audit` and `npm audit --omit=dev` reported `sharp <0.35.0`.

## After

`package.json` uses a narrow npm override:

```json
{
  "overrides": {
    "sharp": "0.35.3"
  }
}
```

Resolved dependency tree:

```text
next@16.2.12
└── sharp@0.35.3 overridden
```

## Node requirement

`sharp@0.35.3` requires:

```text
node >=20.9.0
```

The security gate ran on:

```text
node v24.18.0
npm 11.16.0
```

This satisfies the `sharp@0.35.3` runtime requirement.

## Runtime smoke test

Direct runtime smoke:

```text
sharp runtime PASS 141
```

Observed `sharp.versions`:

```text
sharp 0.35.3
vips 8.18.3
png 1.6.58
webp 1.6.0
```

The module loaded successfully, generated a PNG buffer and did not report
DLL, libvips or architecture errors.

Next image runtime smoke:

```text
GET /_next/image?url=%2Fbrand%2Fhomeback-logo-horizontal.png&w=640&q=75
status: 200
content-type: image/png
bytes: 29930
```

## Audit result

`sharp` no longer appears in:

- `npm audit`
- `npm audit --json`
- `npm audit --omit=dev`
- `npm audit --omit=dev --json`

Remaining audit finding is unrelated to `sharp`:

```text
postcss@8.4.31
node_modules/next/node_modules/postcss
via next@16.2.12
```

This requires a separate `postcss` decision or patch. The npm proposed fix is
not part of this checkpoint because it suggests `next@16.3.0`, which is outside
the currently stated `next@16.2.12` dependency range.

## Platform packages

The lockfile retains optional platform packages for multiple platforms. Linux
packages required for Vercel-style Linux runtime are present, including:

```text
@img/sharp-linux-x64@0.35.3
@img/sharp-libvips-linux-x64@1.3.2
```

The lockfile also retains Windows, macOS, Linux musl and other optional `@img`
packages. No platform package was manually removed.

## Limitations

- Runtime smoke was executed locally on Windows.
- Preview/Linux deployment was not executed.
- Linux compatibility was checked through lockfile package presence, not by
  running inside Vercel Linux.
- `postcss` remains a separate unresolved audit item through
  `next/node_modules/postcss@8.4.31`.

## Status

`sharp` hardening is ready for checkpoint.

Overall dependency security gate is not fully green because the independent
`postcss` audit finding remains and requires a separate decision or controlled
patch.
