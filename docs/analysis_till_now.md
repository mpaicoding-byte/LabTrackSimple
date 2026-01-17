LabTrackSimple Validation and Review Plan (Post-Checks)
Updated to reflect the simple review flow (confirm_report_results) and manual test entry.

Validation Evidence (completed)
- Dev server start: required escalated run; Next dev bound to 0.0.0.0:3000 after initial EPERM.
- Supabase MCP: connectivity verified; database is reachable via MCP tools.
- Tests:
  - npm test (node --test) passed (no module type warnings after adding package.json type).
  - npm run test:unit (vitest) passed.
  - npm run test:e2e passed against the configured Supabase project (MCP verified).
- Supabase services note: use MCP to confirm edge functions and check logs if extraction stalls.
- Codebase checks:
  - confirm_report_results edge function is implemented; commit_results is removed.
  - extract_report writes lab_results for each extraction run (placeholder values until the Phase 4b adapter).
  - ReportsManager.tsx (663 lines) and PeopleManager.tsx (326 lines) exceed soft cap.
  - lab_results_staging does not include household_id in the final schema (dropped in migrations); docs align on this.
  - components/ui/card.tsx includes light-mode defaults.
  - Skeleton component exists and replaces dashboard loading ellipses.
  - ErrorBoundary wraps PeopleManager and ReportsManager list views.
  - DashboardLayout includes a mobile header for small screens.
- Official docs checked (Supabase):
  - Edge Functions should use SUPABASE_SERVICE_ROLE_KEY for server-side storage access.
  - Service role key bypasses storage RLS; keep it server-side only.
  - Signed URLs are the recommended access method for private storage objects.

Plan of Action (prioritized)
1) Stabilize test environment
- Confirm Supabase MCP connectivity before running E2E tests.
- Re-run npm run test:e2e if tests fail; verify DB state via MCP.

2) Resolve data/documentation mismatch
- Confirm docs reflect the final schema: lab_results_staging has no household_id.

3) Phase 5 core implementation (Review + Confirm)
- Implemented always-editable review grid for review-required reports plus final-report edit toggle (draft mode + discard).
- Preview document button uses signed URLs (no inline preview).

4) Tests for Phase 5
- Component tests cover review editing UX and final edit toggle.
- E2E tests cover extract -> review -> confirm plus final edit toggle.

5) UX hardening (targeted)
- Completed: light-mode Card styles, Skeleton component usage, error boundaries, and mobile header.

6) Optional data audit improvements (post-MVP)
- Consider updated_at or confirmed_at columns for audit trails.

Deliverables
- Updated analysis report with verified facts and risks.
- Implemented confirm_report_results and always-editable review UI.
- Test evidence: unit/component/E2E run logs.
