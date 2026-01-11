# Implementation Plan — Deterministic Phases + Checklists

This plan is designed for coding agents. Each phase has explicit, verifiable checkpoints and outputs.

## Phase 0 — Foundations

### Checklist
- [x] Project scaffolded via `create-next-app` (App Router, TypeScript, ESLint, Tailwind)
- [x] App Router shell exists with base layout and routing (`app/`)
- [x] Global styles wired via `app/globals.css`
- [x] `tsconfig.json` includes `@/*` path alias
- [x] Root layout exports base `metadata` (title/description) and avoids manual `<head>` tags
- [x] Update metadata copy to LabTrackSimple branding (title/description)
- [x] Replace default home page with LabTrackSimple placeholder content
- [x] App Router special files in place: `app/loading.tsx`, `app/error.tsx` (client), `app/not-found.tsx` (or `app/global-not-found.tsx` if multiple roots)
- [x] Document agent workflow expectations in `README.md`

### Outputs
- App boots locally without runtime errors
- Base layout + home page wired to Tailwind global styles
- ESLint + TypeScript config from scaffold
- Loading, error, and not-found UI for App Router

### Done When
- `npm run dev` starts and renders the LabTrackSimple placeholder page
- `npm run lint` passes
- Base metadata is exported from `app/layout.tsx`
- Loading/error/not-found pages render for their respective states

## Phase 1 — Data Model + RLS

### Checklist
- [x] SQL migrations for all tables in the technical spec
- [x] Constraints for status enums/values are present
- [x] Unique constraints (single owner per household, unique household membership, unique person link per household) are present
- [x] Indexes for trends/search are created
- [x] RLS enabled on all tables
- [x] Policies for owner/member access implemented
- [x] Soft-delete filtering enforced by policies or views
- [x] Shared TypeScript types for core entities aligned with schema

### Outputs
- Migration files in `supabase/migrations/`
- RLS policies documented in a SQL file or README

### Done When
- All tables exist with correct columns and constraints
- RLS prevents cross-household reads by default

## Phase 2 — Auth + Household Bootstrap

### Checklist
- [ ] Auth flow in UI (sign in/up)
- [ ] On signup: household + owner membership created atomically
- [ ] Owner is assigned to `household_members` with role `owner`
- [ ] Session is available on client routes
- [ ] People management UI (create/list/rename/soft-delete)
- [ ] Supabase client configured with `.env.example` and environment boundaries documented

### Outputs
- Signup handler and server-side transaction for household bootstrap
- UI page for sign in/up

### Done When
- New user can sign up and has a household row and owner membership row
- Owner can create a person and use that `person_id` in report creation

## Phase 3 — Reports + Artifacts

### Checklist
- [ ] Report creation form (person, date, source, notes)
- [ ] `lab_artifacts` row-first upload flow implemented
- [ ] Private storage bucket configured
- [ ] Signed URL viewing for artifacts
- [ ] Artifact status updates (`pending` → `ready`/`failed`)
- [ ] Storage policy/RLS for bucket access documented

### Outputs
- Report creation page
- Artifact upload component
- Storage policy config doc with signed URL generation path

### Done When
- User can create report and upload artifact that is viewable via signed URL

## Phase 4 — Extraction + Staging

### Checklist
- [ ] Edge Function `extract_report` implemented
- [ ] `extraction_run_id` generated and used
- [ ] Staging rows inserted into `lab_results_staging`
- [ ] Report status updates on success/failure
- [ ] Manual staging row insertion supported
- [ ] Zero extracted rows still set report to `review_required`

### Outputs
- Edge Function source in `supabase/functions/extract_report/`
- API endpoint or client call to trigger extraction

### Done When
- Triggering extraction creates staging rows and updates report status

## Phase 5 — Review + Commit

### Checklist
- [ ] Review grid with editable fields
- [ ] `details_raw` editable in review grid
- [ ] Approve/reject per-row and bulk actions
- [ ] Edge Function `commit_results` implemented
- [ ] Approved rows copied to `lab_results`
- [ ] Previous `lab_results` soft-deleted on commit
- [ ] Report status set to `final`
- [ ] Re-extraction keeps previous final results until commit
- [ ] Inline artifact preview in review UI

### Outputs
- Review UI page
- Edge Function source in `supabase/functions/commit_results/`

### Done When
- Approved staging rows appear in `lab_results` after commit

## Phase 6 — Trends + Search

### Checklist
- [ ] Search by `name_raw` (ILIKE)
- [ ] Numeric chart from `value_num`
- [ ] Text timeline for non-numeric
- [ ] Mixed numeric/text handling UX
- [ ] Person filter

### Outputs
- Trends/search page with chart + timeline

### Done When
- Searching shows numeric trends and text history for a test

## Phase 7 — Household Linking + Member View

### Checklist
- [ ] Owner UI to link `people.user_id` to existing user
- [ ] Member view is read-only
- [ ] RLS validated for member scoping to their person

### Outputs
- Household management UI
- Link action uses a single transaction

### Done When
- Member can only see their own data; owner sees all household data

## Phase 8 — QA + Hardening

### Checklist
- [ ] Error handling for upload/extraction/commit
- [ ] Basic performance checks for trend queries
- [ ] End-to-end MVP acceptance criteria verified
- [ ] Minimal logging for extraction runs

### Outputs
- QA checklist in README or `docs/qa.md`

### Done When
- All MVP acceptance criteria from the Product Design Document are satisfied
