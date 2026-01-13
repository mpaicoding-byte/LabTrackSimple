# Extraction + Staging Checklist (Phase 4)

## Red
- [x] Add node test for Phase 4 artifacts (edge function files + trigger wiring).
- [x] Add component test for extraction trigger + manual staging row UI.
- [x] Add E2E flow: trigger extraction and verify status update.

## Green
- [x] Implement `supabase/functions/extract_report/` edge function.
- [x] Generate and persist `extraction_run_id` per run.
- [x] Insert staging rows into `lab_results_staging`.
- [x] Update report status on success/failure; zero rows => `review_required`.
- [x] Support manual staging row insertion in UI.

## Verify
- [x] Run targeted unit/component tests.
- [ ] Run E2E extraction flow.
- [ ] Verify UI with Chrome DevTools MCP.

## Comments
- E2E extraction flow not run (missing `E2E_EMAIL`/`E2E_PASSWORD`).
- Chrome DevTools MCP not available in this session for UI verification.
- Full `npm run test` and `npm run test:unit` currently fail due to pre-existing Phase 0/2 and People/Profile test issues.
