# LabTrackSimple

LabTrackSimple is a household-focused lab report tracker. The MVP centers on
clear capture, reviewable extraction, and simple trend visibility.

## Getting Started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Common commands:

```bash
npm run lint
npm run typecheck
npm run typecheck:functions
npm run test
npm run test:unit
npm run test:e2e
```

`npm run typecheck:functions` uses Deno to validate Edge Functions. Install
Deno if you plan to run that script.

## Testing

We follow a test pyramid (unit → component → integration → E2E):
- Unit: `node --test` for pure logic.
- Component: React Testing Library + `vitest` (jsdom).
- Integration: Supabase MCP for DB setup/verification against the configured project.
- E2E: Playwright against `npm run dev`, then verify DB state via Supabase MCP.

UI changes also require MCP UI verification.

E2E tests load `.env` for `E2E_EMAIL` and `E2E_PASSWORD`. Set `E2E_BASE_URL` if
you are targeting a non-default server URL.
Provide `SUPABASE_SERVICE_ROLE_KEY` in `.env` to enable admin setup in
review/commit E2E flows.
Set `PW_USE_CHROME=true` to use the system Chrome channel instead of the
bundled Chromium.

## Onboarding

After first login, owners must complete their profile (date of birth + gender)
at `/onboarding/profile` before accessing the rest of the app.

## Reports + Artifacts

Owners capture reports and upload PDF/image artifacts at `/reports`. Artifacts
are stored in the private `lab-artifacts` bucket and are viewed via signed URLs.
Storage policies are documented in
`docs/archived specs/reports-artifacts/reports_artifacts_storage_policy.md`.

## Stack

- Next.js App Router (TypeScript)
- Supabase (Postgres + RLS + Storage + Edge Functions)

## Project Layout

- `app/` - UI routes and layout
- `features/core/types.ts` - Shared domain types
- `supabase/migrations/` - SQL migrations (schema + RLS)
- `docs/` - Technical spec and product notes
- `tests/` - Node test suite

## Agent Workflow

If you are working via Codex, follow the rules in `AGENTS.md` (architecture,
TDD sequence, and UI verification requirements).

Key expectations:
- Keep `implementation_plan.md` checklists up to date as items are completed.
- Start the dev server before running tests.
- For UI changes, verify using the Chrome DevTools MCP.
- Project-specific Codex skills live in `skills/`.

## Environment

Copy `.env.example` to `.env.local` and fill in your Supabase project values.
The `NEXT_PUBLIC_` variables are safe to expose to the browser and are required
by the client SDK. Keep any server-only secrets in `.env.local` without the
`NEXT_PUBLIC_` prefix.

## Supabase Migrations & Secrets

Migrations live in `supabase/migrations/` and should be applied via Supabase MCP
(for example `apply_migration` or `execute_sql`).

Prereqs (set in your shell, not committed):
- `SUPABASE_ACCESS_TOKEN` (starts with `sbp_...`)
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`

Secrets for Edge Functions are kept in `.env.supabase` (not committed). A
template is provided at `.env.supabase.example`.

### Push helper (secrets + fallback)

```bash
export SUPABASE_ACCESS_TOKEN=sbp_...
set -a; source .env; set +a
./scripts/supabase_push.sh
```

The script:
- links the project
- runs `db push` (dry-run first, then apply)
- pushes secrets from `.env.supabase`

Prefer Supabase MCP for schema changes; use this script only when MCP is
unavailable or when you need to push secrets.

You can override the secrets file with:

```bash
SECRETS_FILE=.env.supabase ./scripts/supabase_push.sh
```

## Status

MVP is in progress. See `docs/implementation_plan.md` for the phased checklist.
