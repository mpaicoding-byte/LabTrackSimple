# Review + Commit Spec (Phase 5)

## Problem
Lab results can be extracted into staging, but there is no structured review workflow or commit path to finalize results into `lab_results`.

## Goals
- Provide a review grid for `lab_results_staging` with inline edits and status changes.
- Support per-row and bulk approve/reject actions.
- Commit approved staging rows into `lab_results` via a server-side function.
- Soft-delete prior `lab_results` for the report on commit.
- Set `lab_reports.status` to `final` after a successful commit.
- Preserve previous final results until a new commit (re-extraction does not mutate `lab_results`).
- Inline artifact preview for faster review.

## Non-Goals
- Extraction/OCR quality improvements (Phase 4b).
- Trends/search UI (Phase 6).
- Historical comparisons across multiple extraction runs (beyond most recent run).

## Scope & Assumptions
- Review is owner-only.
- Review operates on the most recent extraction run for a report (by `lab_results_staging.created_at`).
- `lab_results_staging.status` values remain `needs_review | approved | rejected`.
- `lab_reports.status` transitions from `review_required` to `final` only via commit.

## Flow
1. Owner opens the review UI for a report.
2. App selects the most recent `extraction_run_id` for the report.
3. Staging rows for that run load into a review grid.
4. User edits rows and marks each row `approved` or `rejected`.
5. Bulk actions allow approve/reject of all visible rows.
6. Commit action calls `commit_results` with `lab_report_id` + `extraction_run_id`.
7. Function soft-deletes existing `lab_results` for the report, inserts approved rows, and sets report status to `final`.

## Data & Rules
- Editable fields: `name_raw`, `value_raw`, `unit_raw`, `value_num`, `details_raw`.
- On edit, a row returns to `needs_review` until explicitly re-approved.
- `value_num` is derived from `value_raw` by default, but can be overridden manually.
- Only approved rows are committed; rejected rows are ignored.
- Commit should be blocked if any row remains `needs_review`.

## UI/UX Notes
- Review grid shows: name, value, unit, numeric value, details, status, actions.
- Row actions: edit/save/cancel, approve, reject.
- Bulk actions: approve all, reject all, reset to needs_review.
- Commit button shows counts (approved/needs_review/rejected) and is disabled if any `needs_review` rows remain.
- Inline artifact preview uses a signed URL (per artifact or per report) with an image/PDF fallback.

## Permissions & Safety
- Only owners can update staging rows or commit results.
- `commit_results` validates inputs and ensures rows belong to the report/run.
- Commit is atomic: insert new results, soft-delete old results, update report status.

## Edge Cases
- No staging rows for the latest run: show empty state with re-extract/manual entry call to action.
- Staging rows exist but all rejected: commit should be blocked or require explicit confirmation.
- Re-extraction: review defaults to the newest run, previous final results remain until commit.
- Partial edits: prevent commit while rows are dirty/unsaved.
