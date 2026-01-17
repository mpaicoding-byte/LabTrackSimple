# Technical Specification — Personal Lab Records + Trends (MVP)

## 1. Architecture Overview

### 1.1 Stack
- Frontend: Next.js (React)
- Backend: Supabase
  - Postgres (data)
  - Storage (private artifacts)
  - Edge Functions (extraction + confirm)
- LLM provider: called only from Edge Functions

### 1.2 High-Level Components
- Web App
  - Auth + session
  - Report creation + artifact upload
  - Extraction review UI + manual entry
  - Trends + search
- Supabase
  - Tables: households, household_members, people, reports, artifacts, extraction_runs, results
  - RLS policies by household membership and role
  - Private storage bucket for artifacts
  - Edge Functions: `extract_report`, `confirm_report_results`

## 2. Data Model

### 2.1 Tables

#### `households`
- `id uuid pk`
- `owner_user_id uuid not null`
- `name text null`
- `deleted_at timestamptz null`
- `created_at timestamptz default now()`

#### `household_members`
- `id uuid pk`
- `household_id uuid not null references households(id)`
- `user_id uuid not null`
- `role text not null default 'member'` -- `owner | member`
- `deleted_at timestamptz null`
- `created_at timestamptz default now()`
Rationale: keeps membership explicit and simple; no email invite flow in MVP.

#### `people`
- `id uuid pk`
- `household_id uuid not null references households(id)`
- `user_id uuid null`
- `name text not null`
- `date_of_birth date null`
- `gender text null` -- `female | male`
- `deleted_at timestamptz null`
- `created_at timestamptz default now()`
Rationale: `user_id` links a person to a login when available, while still allowing owner-managed profiles.

#### `lab_reports`
- `id uuid pk`
- `household_id uuid not null references households(id)`
- `person_id uuid not null references people(id)`
- `report_date date not null`
- `source text null`
- `status text not null default 'draft'` -- `draft | review_required | final | extraction_failed`
- `current_extraction_run_id uuid null references extraction_runs(id)`
- `final_extraction_run_id uuid null references extraction_runs(id)`
- `confirmed_at timestamptz null`
- `confirmed_by uuid null`
- `notes text null`
- `deleted_at timestamptz null`
- `created_at timestamptz default now()`

#### `lab_artifacts`
- `id uuid pk`
- `household_id uuid not null references households(id)`
- `lab_report_id uuid not null references lab_reports(id)`
- `object_path text not null`
- `kind text not null` -- `pdf` or `image`
- `mime_type text null`
- `status text not null default 'pending'` -- `pending | ready | failed`
- `deleted_at timestamptz null`
- `created_at timestamptz default now()`

#### `extraction_runs`
- `id uuid pk`
- `lab_report_id uuid not null references lab_reports(id)`
- `status text not null default 'running'` -- `running | ready | failed | confirmed | rejected` (legacy; no UI action)
- `started_at timestamptz not null default now()`
- `completed_at timestamptz null`
- `error text null`
- `created_by uuid null`
- `created_at timestamptz not null default now()`

#### `lab_results`
- `id uuid pk`
- `lab_report_id uuid not null references lab_reports(id)`
- `person_id uuid not null references people(id)`
- `extraction_run_id uuid not null`
- `name_raw text not null`
- `value_raw text not null`
- `unit_raw text null`
- `value_num double precision null`
- `details_raw text null`
- `is_final boolean not null default false`
- `is_active boolean not null default false`
- `edited_at timestamptz null`
- `edited_by uuid null`
- `created_at timestamptz default now()`
- `deleted_at timestamptz null`

### 2.2 Indexes
- `lab_results` composite index: `(person_id, name_raw)`
- `lab_results` index on `lab_report_id`
- `lab_results` index on `(name_raw)` for cross-person search within a household
- `extraction_runs` index on `(lab_report_id)` for report lookups
- `lab_results` index on `(lab_report_id, extraction_run_id)` for review queries

### 2.3 Constraints
- Use CHECK constraints (or enums) for status fields to prevent invalid values:
  - `lab_reports.status`: `draft | review_required | final | extraction_failed`
  - `lab_artifacts.status`: `pending | ready | failed`
  - `extraction_runs.status`: `running | ready | failed | confirmed | rejected` (legacy; no UI action)
- `people.gender`: `female | male` (or null)
- `household_members`: UNIQUE constraint on `(household_id, user_id)` to prevent duplicate memberships.
- `household_members`: UNIQUE partial constraint on `(household_id) WHERE role = 'owner'` to ensure a single owner per household.
- `people`: UNIQUE partial constraint on `(household_id, user_id) WHERE user_id IS NOT NULL` to prevent linking one user to multiple people in the same household.

### 2.4 Denormalization
- `lab_results.person_id` is set at row creation (extraction or manual) to speed up trend queries without joins.
Rationale: trend queries are the primary read path in MVP and should be fast and simple.

## 3. Storage

### 3.1 Bucket
- Private bucket: `lab-artifacts`
- Object path: `{household_id}/{report_id}/{artifact_id}.{ext}`

### 3.2 Upload Flow (Row-First)
1. Insert `lab_artifacts` row with `status = pending`.
2. Upload file to `object_path`.
3. Update `lab_artifacts.status = ready`.
Rationale: prevents partially uploaded artifacts from being processed and avoids orphan files.

## 4. Edge Functions

### 4.1 `extract_report({ lab_report_id })`

#### Responsibilities
- Create an `extraction_runs` row (`status = running`).
- Read all `ready` artifacts for the report.
- Extract rows: `name_raw`, `value_raw`, `unit_raw`, optional `value_num`, and `details_raw`.
- Write rows to `lab_results` for the current run.
- Update `lab_reports.status` to `review_required` on success or `extraction_failed` on failure.
- Set `lab_reports.current_extraction_run_id` to the run on success.

#### Notes
- `value_num` is populated when the extracted value is parseable as a number; users can correct it during review.
- LLM API keys stored in Supabase secrets.
- `details_raw` stores all additional text not mapped to core fields.
- If zero rows are extracted, still set `lab_reports.status = review_required` and allow manual entry.

### 4.2 `confirm_report_results({ lab_report_id })`

#### Responsibilities
- Validate ownership and that the current run is `ready`.
- Ensure at least one row exists for the current run.
- Update `lab_reports.status = final`, set `final_extraction_run_id`, `confirmed_at`, `confirmed_by`.
- Mark the run as `confirmed` and set `completed_at`.
- Mark current run rows `is_final = true` and `is_active = true`.
- Mark previous run rows `is_active = false`.

#### Notes
- Existing final results remain unchanged until confirm is executed.

## 5. API and Data Access

### 5.1 Client-Side Access
- Use Supabase client with RLS policies enforcing household membership and role.

### 5.2 RLS Policies
- Enable RLS on all tables.
- SELECT: owner can read all rows in the household; members can read only rows tied to their own person (`people.user_id = auth.uid()`), with `deleted_at is null`.
- Owner role: full read/write access within the household.
- Member role: read-only for rows tied to their own person (`people.user_id = auth.uid()`).
- INSERT/UPDATE checks should validate household membership and prevent changing `household_id` or `person_id` to another user.
- Access requires membership in `household_members` where `deleted_at is null`.
- Consider views that automatically filter out soft-deleted rows.
Rationale: enforces owner/member privacy without cross-household sharing.
Note: members have no access until their `people.user_id` is linked by the owner.
Note: in MVP, only owners can create reports, upload artifacts, edit results, and confirm results.
Note: for child tables, exclude rows whose parent is soft-deleted (via views or join checks).

## 6. Frontend Views

### 6.1 Report Creation
- Form: `person_id`, `report_date`, `source`.
- Artifact upload list with status.
- Manual test entry happens during review; there is no separate manual report creation flow.

### 6.2 Extraction Review
- Always-editable grid for owners during review (`name_raw`, `value_raw`, `unit_raw`, `value_num`, `details_raw`); members are view-only.
- Final reports are view-only until the owner selects **Edit** to enter draft mode (with Discard draft).
- Edits and new rows are saved when "Review & confirm" is clicked.
- Primary action: "Review & confirm".
- "Add test" appends a new manual row during review.
- Preview document button (opens the signed artifact URL).
- For uploaded reports, show guidance to add missing tests from the document during review.
- Flag ambiguous parses (e.g., mixed type or non-numeric values in numeric context) with a prompt to edit or keep raw.

### 6.3 Trends
- Search by `name_raw` with case-insensitive match (ILIKE).
- Chart numeric results from `value_num`.
- List non-numeric results in timeline.
- If a test has mixed numeric/text values, plot numeric points and show text entries in the timeline with a prompt to normalize/edit.
Rationale: mixed values are common in raw extraction and should be visible without hiding context.

### 6.4 Household Management
- Owner links a person profile to an existing user account by setting `people.user_id` and creating a `household_members` row.
- Member access is limited to rows tied to their own `people.user_id`.
Rationale: avoids email invite flow complexity while still allowing family logins.
Note: members cannot self-claim or create profiles in MVP.
Note: linking is an atomic action; the UI sets `people.user_id` and inserts a `household_members` row in a single transaction.
Note: to resolve a member's person profile, join `household_members` to `people` on `household_members.user_id = people.user_id` and `household_members.household_id = people.household_id`.
Note: on signup, create a household and a corresponding `household_members` row with role `owner`.
Note: household creation is atomic; insert the `households` row and owner membership in the same transaction.

## 7. Error Handling
- Extraction errors set report status to `extraction_failed` and surface in UI.
- Upload errors set artifact status to `failed`.

## 8. Observability
- Log extraction run ID, artifact count, and status.

## 9. Security Considerations
- No LLM keys in client.
- Private artifacts via signed URLs.
- RLS and soft-deletes for data safety.
- Owner/member role enforcement for household privacy.

## 10. Out-of-Scope (MVP)
- Reference range tables and abnormal flag calculations.
- Normalization tables for test names.
- Unit conversion.
- Email invite flow and invite status UI.
- Cross-household sharing or public access.
