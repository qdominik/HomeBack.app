# HomeBack.app

HomeBack.app is a privacy-conscious Progressive Web App for organizing household information: items, rooms, storage locations, categories, documents, family members, and household settings.

The product is built around a simple problem: families often know that something exists, but not where it is, who owns it, when it expires, or which document explains it. HomeBack creates a shared, structured source of truth for the home.

## Product Scope

The current MVP focuses on seven modules:

| Module | Purpose |
| --- | --- |
| Inventory | Catalog household items with category, quantity, expiration date, owner, photo, and location. |
| Home Structure | Model the home as rooms, furniture or storage areas, and precise storage spaces. |
| Family | Manage household members, roles, invitations, and access boundaries. |
| Dashboard | Provide a fast overview of important household information after sign-in. |
| Documents | Store household knowledge, manuals, procedures, and practical notes. |
| Categories | Organize items and documents using system and custom categories. |
| Settings | Manage household-level configuration and user preferences. |

Future directions include richer AI assistance, QR/NFC labels, Home Assistant integrations, stronger document workflows, backups, and native mobile experiences. These are intentionally outside the MVP unless explicitly accepted in the product decision log.

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
| App type | Progressive Web App |

## Security Model

Security is treated as a product requirement, not an afterthought.

- Secrets must never be committed to the repository.
- `.env.local` and provider API keys are excluded from Git.
- Supabase RLS policies must protect all household-scoped data.
- Private user files must be stored in non-public buckets.
- AI-assisted flows must not write data without user review and confirmation.
- Production and preview environments should use separate configuration where needed.
- Before making the repository public, GitHub Secret Scanning, Push Protection, CodeQL, dependency review, and branch protection should be enabled where available.

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

The application expects Supabase configuration and optional AI provider configuration through environment variables.

Typical local variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ITEM_PHOTO_AI_PROVIDER=
ITEM_PHOTO_AI_MODEL=
GROQ_API_KEY=
```

Use `.env.local` for local development. Do not commit environment files.

## Supabase Development

Local Supabase is the preferred environment for database changes, RLS policies, migrations, and database-level tests.

Common commands:

```bash
npx supabase --version
npx supabase start
npx supabase stop
```

Migration rules:

- Schema changes belong in `supabase/migrations`.
- RLS policies must be validated locally before hosted deployment.
- Hosted Supabase can be used for integration testing, but it should not replace local migration validation.
- User data access must always be scoped by `household_id`.

## Testing

The project uses a layered validation approach:

- logic tests for business rules and data transformations,
- database tests for schema and RLS behavior,
- end-to-end tests for critical user flows,
- production or preview smoke tests before public sharing.

Run the available test suite:

```bash
npm test
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

## Deployment

The application is designed for deployment on Vercel with Supabase as the hosted backend.

Recommended environment separation:

- local development: `.env.local` and local Supabase,
- preview deployments: dedicated Vercel preview variables and hosted Supabase preview data,
- production: production Vercel variables and production Supabase project.

Public URLs:

- Landing page: `https://homeback.app`
- Application: `https://my.homeback.app`

## Project Status

HomeBack.app is under active MVP development. The repository contains both product documentation and implementation work. Public README content should therefore describe the accepted direction of the project while clearly separating implemented features from planned ones.

## License

License information has not been finalized yet.
