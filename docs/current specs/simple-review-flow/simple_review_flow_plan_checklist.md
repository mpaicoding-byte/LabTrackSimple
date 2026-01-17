# Simple Review Flow (Powerful Implementation) Plan + Checklist

## Goal
Deliver a simple, low-friction review UX while making the data model robust: extraction always persists results, report status controls finalization, and every run is auditable.

## UX Summary
- Upload triggers auto extraction; report moves to "Review required" when ready.
- Review page shows always-editable rows (owner) with "Add test" and a single primary action: "Review & confirm".
- Final reports are view-only until the owner selects **Edit** to enter draft mode; **Discard draft** returns to view-only.
- No approve/reject/bulk actions in the UI.
- Edits show a small "Edited" indicator per row.
- Manual tests can be added during review; "Add test" is available for uploaded reports.
- For uploaded reports, show guidance to add missing tests from the document during review.

## Product Decisions (Powerful, Simple UX)
- Every extraction creates a new run with its own results (full audit trail).
- Report status is the only gate: review_required or final.
- Confirm action only flips the report to final and marks the run as confirmed.
- No per-row approval or staging status requirements.

## Data Model (New/Updated)
- New table: `extraction_runs`
  - id, lab_report_id, status (running, ready, failed, confirmed, rejected - legacy), started_at, completed_at, error, created_by
- Update table: `lab_reports`
  - add current_extraction_run_id, final_extraction_run_id, confirmed_at, confirmed_by
- Update table: `lab_results`
  - add extraction_run_id, is_final, is_active, edited_by, edited_at
- Optional audit table: `lab_result_edits`
  - lab_result_id, field, old_value, new_value, edited_by, edited_at

## Plan (Engineering Steps)
1) DB migrations and data backfill
- Create `extraction_runs`.
- Add new columns to `lab_reports` and `lab_results`.
- Backfill extraction runs from existing `lab_results_staging` (distinct report_id + run_id).
- Migrate staging rows into `lab_results` with extraction_run_id and is_final=false.
- Keep `lab_results_staging` read-only until confirmed stable, then deprecate.

2) RLS and security
- Add RLS policies for `extraction_runs`, `lab_results`, `lab_result_edits`.
- Confirm actions restricted to owners (household role).
- Read access scoped to household membership.

3) Extraction pipeline
- On upload: create extraction run (status running) and set report status to processing if needed.
- On success: write `lab_results` for the run, set run status ready, set report status to review_required, set current_extraction_run_id.
- On failure: set run status failed, report status extraction_failed.
4) Manual test entry
- Add missing tests during review via "Add test".

5) Review UI (simple UX)
- Load rows from `lab_results` for current_extraction_run_id.
- Edits and added rows are persisted to `lab_results` on confirm.
- Add "Review & confirm" action.
- For `final` reports, require an explicit Edit action to enter draft mode (with Discard draft).
- Hide approve/reject/bulk controls entirely.

6) Confirmation flow (replace commit_results)
- Replace edge function with RPC or edge function `confirm_report_results`.
- Confirm validates owner, run status ready, and at least one row exists.
- Set report status final, set final_extraction_run_id, set confirmed_at/confirmed_by.
- Mark `lab_results` for the run as is_final=true, is_active=true.
- Mark previous runs is_active=false.

7) Report list and recovery
- Report cards show Draft / Review required / Final.
- Show "Retry extraction" when run failed.

8) Tests
- Update unit tests for confirm RPC/function.
- Update component tests for simplified review UI.
- Add E2E: upload -> auto extract -> add test -> confirm -> final.

9) Cleanup (remove legacy flow)
- Remove `commit_results` edge function and related tests.
- Drop or archive `lab_results_staging` once migration is verified.
- Remove per-row status logic and UI copy tied to staging statuses.

## Checklist
### Red (Tests First)
- [x] Unit: confirm_report_results rejects non-owner.
- [x] Unit: confirm_report_results requires ready run and rows exist.
- [x] Unit: confirm_report_results marks report final and run confirmed.
- [x] Component: review page shows "Review & confirm" and no approve/reject actions.
- [x] Component: inline edits mark "Edited" and persist to lab_results.
- [x] E2E: upload triggers auto extraction (no manual extract step).
- [x] E2E: review & confirm sets report final and results are final.
- [x] Component: final report edit toggle enters draft mode (discard + confirm).
- [x] E2E: final report edit toggle works after confirm.

### Green (Implementation)
- [x] Add extraction_runs table and report/result columns.
- [x] Backfill runs and migrate existing staging rows.
- [x] Update RLS policies for runs/results/edits.
- [x] Update extraction function to create runs and write lab_results.
- [x] Implement confirm_report_results (RPC or edge function).
- [x] Simplify review UI and remove approve/reject controls.
- [x] Add review & confirm action and status copy.
- [x] Add final report edit toggle with discard draft.
- [x] Add retry extraction action when needed.
- [x] Deprecate lab_results_staging usage in UI (keep read-only until cleanup).
- [x] Remove commit_results edge function and related tests.
- [x] Drop or archive lab_results_staging after migration verification.
- [x] Remove per-row status logic tied to staging statuses.

### Verify
- [x] Run unit/component tests for review changes and confirm flow.
- [x] Run E2E flow for auto extraction + confirm.
- [x] Verify DB state: current run final, previous runs inactive.
- [x] Verify report status transitions to final and confirmed fields set.
- [x] Verify UI with Chrome DevTools MCP.
- [x] Verify final report edit toggle via Chrome DevTools MCP.

## Comments
- Unit/component tests: `npm run test`, `npx vitest run` (pass).
