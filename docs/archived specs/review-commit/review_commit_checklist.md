# Review + Commit Checklist (Phase 5)

Deprecated: superseded by `docs/current specs/simple-review-flow/simple_review_flow_plan_checklist.md`. Kept for historical reference only.

## Red
- [x] Unit: `commit_results` returns 400 when `lab_report_id` is missing.
- [x] Unit: `commit_results` returns 400 when `extraction_run_id` is missing.
- [x] Unit: `commit_results` returns 404 when the report does not exist.
- [x] Unit: `commit_results` fails if any staging row remains `needs_review`.
- [x] Unit: `commit_results` fails if there are zero approved rows.
- [x] Unit: `commit_results` ignores `rejected` rows and only commits `approved`.
- [x] Unit: inserts `lab_results` with `person_id` sourced from `lab_reports`.
- [x] Component: review grid renders staging rows with status badges.
- [x] Component: inline edit updates fields and saves to Supabase.
- [x] Component: editing a row resets status to `needs_review`.
- [x] Component: approve/reject per-row updates status.
- [x] Component: bulk approve/reject/reset actions update all rows.
- [x] Component: commit button disabled with any `needs_review` rows or unsaved edits.
- [x] Component: commit button enabled when all rows are reviewed.
- [x] Component: inline artifact preview loads a signed URL when `artifact_id` exists.
- [x] Component: empty-state messaging when no staging rows exist.
- [x] E2E: upload report -> extract -> review -> approve -> commit -> status final.
- [x] E2E: verify `lab_results` inserted and previous rows soft-deleted.
- [x] E2E: re-extraction does not change `lab_results` before commit.
- [x] E2E: member cannot approve/commit (owner-only enforcement).

## Green
- [x] Add review UI entry point (route or section) for `lab_reports` with `review_required` status.
- [x] Query most recent `extraction_run_id` for a report using `lab_results_staging.created_at`.
- [x] Load staging rows for the selected run and map into UI state.
- [x] Render a review grid with columns: name, value, unit, numeric value, details, status, actions.
- [x] Implement per-row edit mode with save/cancel controls and loading state.
- [x] Save edits via Supabase `update`, and reset row status to `needs_review` on edit.
- [x] Implement per-row approve/reject actions with status updates.
- [x] Implement bulk actions: approve all, reject all, reset to `needs_review`.
- [x] Display counts for approved/needs_review/rejected rows.
- [x] Disable commit when unsaved edits or any `needs_review` rows remain.
- [x] Add inline artifact preview panel (image/PDF) with signed URL retrieval.
- [x] Provide fallback UI when no artifact is linked to a row.
- [x] Implement `supabase/functions/commit_results/index.ts` (service role).
- [x] Validate request payload (`lab_report_id`, `extraction_run_id`).
- [x] Fetch the `lab_reports` row to get `person_id` and validate ownership.
- [x] Fetch staging rows for the report/run with `status = approved`.
- [x] Fail when any `needs_review` rows remain for the run.
- [x] Soft-delete existing `lab_results` for the report before insert.
- [x] Insert approved staging rows into `lab_results` with `person_id` and `extraction_run_id`.
- [x] Update `lab_reports.status` to `final` on success.
- [x] Return counts and a structured success payload.
- [x] Log commit summary for traceability.
- [x] Ensure UI error states display for load/update/commit failures.

## Verify
- [x] Run unit/component tests for review grid and `commit_results`.
- [x] Confirm Supabase MCP connectivity (project reachable).
- [x] Run E2E review/commit flow against the configured Supabase project.
- [x] Verify DB state via Supabase MCP: previous `lab_results.deleted_at` set and new rows inserted.
- [x] Verify report status transitions to `final` after commit.
- [x] Validate re-extraction does not alter `lab_results` before commit.
- [x] Verify UI flows with Chrome DevTools MCP (`--isolated`).
- [x] Update `docs/implementation_plan.md` if any new high-level detail is introduced.

## Comments
- Tests: `npm run test` + `npx vitest run` passed.
- MCP: SQL checks confirmed `lab_results.deleted_at` populated and `lab_reports.status = final` rows present.
- UI: signed in via MCP, verified Dashboard, Reports list, and Review Results grid for a `review_required` report; signed out successfully.
