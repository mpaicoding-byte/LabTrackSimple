LabTrackSimple Validation and Review Plan (Post-Checks)

Validation Evidence (completed)
- Dev server start: required escalated run; Next dev bound to 0.0.0.0:3000 after initial EPERM.
- Supabase MCP: connectivity verified; database is reachable via MCP tools.
- Tests:
  - npm test (node --test) passed (no module type warnings after adding package.json type).
  - npm run test:unit (vitest) passed.
  - npm run test:e2e passed against the configured Supabase project (MCP verified).
- Supabase services note: use MCP to confirm edge functions and check logs if extraction stalls.
- Codebase checks:
  - commit_results edge function is missing (only extract_report exists).
  - extract_report writes placeholder staging rows.
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

3) Phase 5 core implementation (Review + Commit)
- Add commit_results edge function (service role, input validation, atomic commit, RLS bypass).
- Implement Review Grid read-only view, then inline edit + status updates.
- Add bulk actions and commit button logic (block when needs_review remains).
- Add inline artifact preview using signed URLs.

4) Tests for Phase 5
- Add component tests for review grid interactions.
- Add at least one E2E test for extraction -> review -> commit flow.

5) UX hardening (targeted)
- Completed: light-mode Card styles, Skeleton component usage, error boundaries, and mobile header.

6) Optional data audit improvements (post-MVP)
- Consider updated_at or committed_at columns for audit trails.

Deliverables
- Updated analysis report with verified facts and risks.
- Implemented commit_results function and review UI.
- Test evidence: unit/component/E2E run logs.
