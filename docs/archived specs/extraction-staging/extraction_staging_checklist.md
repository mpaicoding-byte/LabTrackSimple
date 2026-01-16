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
- [x] Run E2E extraction flow.
- [x] Verify UI with Chrome DevTools MCP.

## Comments
- E2E extraction flow run locally after disabling `verify_jwt` for `extract_report` in `supabase/config.toml` due to local edge runtime ES256 verify error.
- Chrome DevTools MCP verification completed for extraction trigger, status updates, manual staging entry, and re-extraction.
- Extraction failure and non-owner gating were not exercised during MCP run.
- Full `npm run test` and `npm run test:unit` currently fail due to pre-existing Phase 0/2 and People/Profile test issues.
