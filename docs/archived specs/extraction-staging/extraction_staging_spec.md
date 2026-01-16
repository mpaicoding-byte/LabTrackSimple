# Extraction + Staging Spec (Phase 4)

## Problem
Users upload lab report artifacts, but there is no automated extraction pipeline to produce reviewable staging rows.

## Goals
- Provide an `extract_report` edge function that creates staging rows from ready artifacts.
- Generate and persist an `extraction_run_id` for grouping staging rows.
- Update report status on success/failure, including the zero-row case.
- Allow manual insertion of staging rows even if extraction fails.

## Non-Goals
- Final commit to `lab_results` (Phase 5).
- Advanced parsing/normalization or LLM tuning.
- Inline artifact preview in the review grid (Phase 5).

## Flow
1. User triggers extraction for a report.
2. Edge function generates `extraction_run_id`.
3. Edge function reads `lab_artifacts` with `status = ready` for the report.
4. Extraction produces rows with `name_raw`, `value_raw`, optional `unit_raw`, `value_num`, `details_raw`.
5. Rows inserted into `lab_results_staging` with `status = needs_review`.
6. `lab_reports.status` updates to `review_required` on success; `extraction_failed` on failure.
7. If zero rows extracted, still set `review_required` and allow manual entry.

## Data
- `lab_results_staging` rows include:
  - `lab_report_id`, `artifact_id` (nullable), `extraction_run_id`
  - `name_raw`, `value_raw`, `unit_raw`, `value_num`, `details_raw`
  - `status = needs_review`
- `lab_reports.status` values: `draft | review_required | final | extraction_failed`.

## UX
- Reports screen provides an action to trigger extraction per report.
- Surface extraction status with clear success/failure feedback.
- Provide a simple manual row form for staging entry when extraction yields zero rows or fails.

## Validation
- Only owners can trigger extraction or insert staging rows.
- `lab_report_id` is required; extraction is ignored if there are no ready artifacts.
- Explicitly handle and surface extraction errors.

## Edge Cases
- No ready artifacts: mark `review_required` with zero rows and allow manual entry.
- Extraction error: set `extraction_failed` and allow manual entry.
- Re-extraction: new `extraction_run_id` created; previous results remain unchanged until commit.
