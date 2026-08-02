# Dependency audit triage - 2026-08-02

## Scope

This note records the dependency audit follow-up for the HomeBack.app product application repository. It does not cover the separated landing page project.

## Commands run

```bash
npm audit --json
npm install next@16.2.12 eslint-config-next@16.2.12
npm audit fix
npm audit --json
npm ls next postcss sharp brace-expansion --depth=5
npm run test:logic
npm run lint
npm run build
```

`npm audit fix --force` was not run.

## Changes applied

- Updated direct Next packages from `16.2.10` to `16.2.12`:
  - `next`
  - `eslint-config-next`
- Updated lockfile-only transitive patches through non-force `npm audit fix`:
  - root `postcss` to `8.5.25`
  - `brace-expansion` `1.x` to `1.1.18`
  - `brace-expansion` `5.x` to `5.0.9`
  - related `nanoid` patch under the PostCSS tree

## Current audit result

Current `npm audit --json` reports:

- total vulnerabilities: 3
- high: 3
- critical: 0

Remaining advisories are all tied to `next@16.2.12` transitive dependencies:

| Package | Path | Audit issue | Current version | Available non-force fix |
| --- | --- | --- | --- | --- |
| `next` | direct dependency | high via `postcss` and `sharp` | `16.2.12` | none reported |
| `postcss` | `node_modules/next/node_modules/postcss` | vulnerable `<=8.5.17` | `8.4.31` pinned by Next | none reported without force |
| `sharp` | `node_modules/sharp` | vulnerable `<0.35.0` | `0.34.5` from Next optional dependency range | none reported without force |

Npm reports `npm audit fix --force` would install `next@9.3.3`, which is a breaking downgrade and is not acceptable for this Next 16 application.

## Triage decision

Status: PARTIAL.

The safe patch path was applied. The remaining findings require one of these future decisions:

1. Wait for an upstream Next stable release that updates/remediates the affected transitive dependencies.
2. Approve a deliberate `overrides` strategy for `postcss` and/or `sharp`, followed by full regression validation.
3. Accept the temporary risk with an expiry date and owner until an upstream patch exists.

Recommended next action: monitor `next` releases and rerun `npm audit` before preview promotion. Do not use `npm audit fix --force` for this project.

## Validation

- `npm run test:logic`: PASS, 179/179
- `npm run lint`: PASS
- `npm run build`: PASS

## Security notes

- No runtime code, database schema, RLS, migrations, routes, or environment variables changed.
- The remaining `postcss` issue is inside Next's pinned dependency tree, not user-provided CSS processing code.
- The remaining `sharp` issue is in Next image tooling. Production exposure still depends on actual use of image optimization and deployment configuration, which must be reassessed before preview/production.