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
node --test
```

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

## Supabase Migrations & Secrets

Migrations live in `supabase/migrations/` and are pushed via the helper script.

Prereqs (set in your shell, not committed):
- `SUPABASE_ACCESS_TOKEN` (starts with `sbp_...`)
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`

Secrets for Edge Functions are kept in `.env.supabase` (not committed). A
template is provided at `.env.supabase.example`.

### Push helper

```bash
export SUPABASE_ACCESS_TOKEN=sbp_...
set -a; source .env; set +a
./scripts/supabase_push.sh
```

The script:
- links the project
- runs `db push` (dry-run first, then apply)
- pushes secrets from `.env.supabase`

You can override the secrets file with:

```bash
SECRETS_FILE=.env.supabase ./scripts/supabase_push.sh
```

## Status

MVP is in progress. See `implementation_plan.md` for the phased checklist.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
