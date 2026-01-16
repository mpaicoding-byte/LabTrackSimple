# Review + Commit — User Stories & Acceptance Criteria

Deprecated: superseded by `docs/current specs/simple-review-flow/simple_review_flow_plan_checklist.md`. Kept for historical reference only.

## User Stories
1. As an owner, I can review extracted staging rows so I can validate results before they become final.
2. As an owner, I can edit extracted values so the final results are accurate.
3. As an owner, I can approve or reject each row and bulk-approve/reject when appropriate.
4. As an owner, I can commit approved rows so they appear in finalized lab results.
5. As an owner, I can see an inline artifact preview to cross-check values quickly.

## Acceptance Criteria
- Review UI loads staging rows from the most recent extraction run for the report.
- Inline edits persist to `lab_results_staging` and reset row status to `needs_review` until re-approved.
- Row-level approve/reject updates `lab_results_staging.status`.
- Bulk approve/reject actions update all visible rows.
- Commit is blocked if any row remains `needs_review` or if no rows are approved.
- `commit_results` inserts approved rows into `lab_results` with the report's `person_id`.
- Previous `lab_results` rows for the report are soft-deleted on commit.
- `lab_reports.status` becomes `final` after a successful commit.
- Re-extraction leaves existing final results unchanged until commit is called.
- Inline artifact preview uses signed URLs and shows a fallback when unavailable.
- Non-owner users cannot approve or commit results.
