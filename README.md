# HomeBack.app

HomeBack.app is a privacy-conscious web application for organizing household information: items, rooms, storage locations, categories, documents, family members, and household settings.

The product is built around a simple problem: families often know that something exists, but not where it is, who owns it, when it expires, or which document explains it. HomeBack creates a shared, structured source of truth for the home.

## Product Scope

The current MVP focuses on seven modules:

| Module | Purpose |
| --- | --- |
| Inventory | Catalog household items with category, quantity, expiration date, owner, photo, and location. |
| Home Structure | Model the home as rooms, furniture or storage areas, and precise storage spaces. |
| Users | Planned module for household members, roles, invitations, and access boundaries. Currently marked `Wkrotce` / `Soon` in the app. |
| Dashboard | Provide a fast overview of important household information after sign-in. |
| Documents | Planned module for household knowledge, manuals, procedures, and practical notes. Currently marked `Wkrotce` / `Soon` in the app. |
| Categories | Organize items and documents using system and custom categories. |
| Settings | Manage household-level configuration and user preferences. |

The current MVP includes an item-photo AI Vision extension for editable form suggestions. Future directions include broader AI assistance, QR/NFC labels, Home Assistant integrations, stronger document workflows, backups, full PWA/offline support, and native mobile experiences. These are intentionally outside the MVP unless explicitly accepted in the product decision log.

## Core Concepts

HomeBack uses a household-first data model:

- A user belongs to a `household`.
- Every household has at least one administrator.
- Household data is scoped by `household_id`.
- Access control is enforced through Supabase Row Level Security.
- User-generated names, descriptions, and category values are not translated automatically.

The main location hierarchy is:

```text
Household -> Room -> Furniture item -> Storage space -> Item
```

Example:

```text
Home -> Living room -> TV cabinet -> Left drawer -> Spare batteries
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js / React |
| Styling | Tailwind CSS |
| Backend | Supabase |
| Database | PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Hosting | Vercel |
| App type | Responsive web application; full PWA/offline support is not claimed until manifest and service-worker support are implemented. |

## Security Model

Security is treated as a product requirement, not an afterthought.

- Secrets must never be committed to the repository.
- `.env.local` and provider API keys are excluded from Git.
- Supabase RLS policies must protect all household-scoped data.
- Private user files must be stored in non-public buckets.
- AI-assisted flows must not write data without user review and confirmation.
- Production and preview environments should use separate configuration where needed.
- The public repository has GitHub Secret Scanning and Push Protection enabled.
- `main` requires a pull request, review, resolved conversations, and the configured CI checks before merge; the current exception for the sole administrator is documented in the operations report.

## Repository Structure

```text
docs/
  ai/                 AI workflow guardrails
  decisions/          Product and technical decision log
  product/            Product specification
src/                  Application source code
supabase/
  migrations/         Database schema migrations
  policies/           RLS policies
tests/                Logic and end-to-end tests
```

The product specification is the source of truth for MVP scope. Any functionality outside the accepted product scope should be recorded as requiring a decision before implementation.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

On Windows PowerShell, if script execution blocks `npm.ps1`, use:

```powershell
npm.cmd run dev
```

Default local URL:

```text
http://localhost:3000
```

## Environment Variables

The application uses one explicit public configuration contract per environment.
The complete variable-name template is in `.env.example`; values must be supplied
through local `.env.local` or the Vercel Environment Variables UI. Never commit
keys or copy them into documentation.

Typical local variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_DEV_ORIGIN=
SUPABASE_SERVICE_ROLE_KEY=
ITEM_PHOTO_AI_PROVIDER=
ITEM_PHOTO_AI_MODEL=
GROQ_API_KEY=
E2E_BASE_URL=
E2E_PASSWORD=
```

Use `.env.local` for local development. Do not commit environment files.
`NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_DEV_ORIGIN` must be absolute URLs. Local
development uses the local Supabase project; Vercel Preview and Production use
separate hosted projects and explicit site URLs. The legacy anon key name is
accepted only when it exactly matches the publishable key. The current local
end-to-end suite creates isolated users in the local Supabase stack and does
not require `E2E_PASSWORD`; hosted Preview smoke tests are not configured yet.

Validate only the presence and shape of the current process environment with:

```powershell
npm.cmd run check:env
```

Validate the committed variable-name template in CI with:

```powershell
npm.cmd run check:env -- --example
```

## Supabase Development

Local Supabase is the preferred environment for database changes, RLS policies, migrations, and database-level tests.

Common commands:

```bash
npx supabase --version
npx supabase start
npx supabase stop
```

Agent safety note: `supabase start`, `supabase stop`, Docker start/stop, and
Docker Desktop restarts are manual owner operations. Agents must ask the owner
to run them instead of executing them independently.

Migration rules:

- Schema changes belong in `supabase/migrations`.
- RLS policies must be validated locally before hosted deployment.
- Hosted Supabase can be used for integration testing, but it should not replace local migration validation.
- User data access must always be scoped by `household_id`.
- Out-of-order migrations must be analyzed and applied individually; never use
  `db push --include-all` as a shortcut. The current `0018` Preview/Production
  decision and safe procedure are recorded in the priority 1 operations report.

## Testing

The project uses a layered validation approach:

- logic tests for business rules and data transformations,
- database tests for schema and RLS behavior,
- end-to-end tests for critical user flows,
- production or preview smoke tests before public sharing.

Run the available logic test suite:

```bash
npm run test:logic
```

Run end-to-end tests when the required local services and test environment are available:

```bash
npm run test:e2e
```

Run linting:

```bash
npm run lint
```

Build locally:

```bash
npm run build
```

Exact scripts may evolve with the project. Check `package.json` for the current command list.

GitHub CI exposes three stable checks: `App` (including `npm audit`),
`Database (pgTAP)`, and `E2E (local)`. Database and E2E jobs use independent,
ephemeral local Supabase stacks and receive no hosted environment secrets.

## Deployment

The application is designed for deployment on Vercel with Supabase as the hosted backend.

Recommended environment separation:

- local development: `.env.local` and local Supabase,
- preview deployments: dedicated Vercel preview variables and hosted Supabase preview data,
- production: production Vercel variables and production Supabase project.

Public URLs:

- Landing page: `https://homeback.app`
- Application: `https://my.homeback.app`

The deployment contract, Vercel scope checklist, Supabase redirect policy and
the current limitation that no new staging project may be created without owner
approval are documented in
[`docs/ops/vercel-environment-contract.md`](docs/ops/vercel-environment-contract.md).
The current Local/Preview/Production matrix, migration `0018` decision, CI
scope, GitHub security state and non-destructive cleanup candidates are in
[`docs/ops/priority-1-completion-2026-09-12.md`](docs/ops/priority-1-completion-2026-09-12.md).

## Project Status

HomeBack.app is under active MVP development. The repository contains both product documentation and implementation work. Public README content should therefore describe the accepted direction of the project while clearly separating implemented features from planned ones.

## License

License information has not been finalized yet.
