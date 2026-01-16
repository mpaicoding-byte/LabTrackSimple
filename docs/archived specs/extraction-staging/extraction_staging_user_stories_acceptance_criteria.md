# Extraction + Staging — User Stories & Acceptance Criteria

## User Stories
1. As an owner, I can trigger extraction for a report so I can review extracted results.
2. As an owner, I see extraction failure status so I know I need to retry or add rows manually.
3. As an owner, I can add staging rows manually even when extraction yields no rows or fails.
4. As an owner, I can re-run extraction to create a new staging run without overwriting final results.

## Acceptance Criteria
- Triggering extraction creates a new `extraction_run_id` and inserts rows into `lab_results_staging`.
- On success, `lab_reports.status` is `review_required` even if zero rows are produced.
- On failure, `lab_reports.status` is `extraction_failed` and the UI surfaces the error state.
- Manual staging entry is allowed regardless of extraction outcome.
- Only owners can trigger extraction or insert staging rows.
