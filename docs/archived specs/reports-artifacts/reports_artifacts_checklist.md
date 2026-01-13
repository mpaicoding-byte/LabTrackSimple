# Reports + Artifacts Checklist (Red / Green / Verify)

## Red
- [x] Node test for Phase 3 expectations (reports page + storage policy/migration doc).
- [x] Component test for report creation form.
- [x] Component test for artifact upload status transitions.
- [x] E2E flow test for report creation + artifact upload.

## Green
- [x] Report creation UI (person, date, source, notes) with owner gating.
- [x] Row-first artifact upload and status updates.
- [x] Signed URL view for ready artifacts.
- [x] Storage bucket migration + RLS policies for storage objects.
- [x] Storage policy documentation.

## Verify
- [x] Run node tests and vitest suite after dev server is running.
- [x] Run Playwright E2E against local dev server (E2E_BASE_URL).
- [x] Switch testing to local Supabase and update AGENTS guidance to avoid online login.
- [x] Update implementation plan + README.

## Comments
- E2E ran against local Supabase using `.env.e2e` credentials.
- UI verification via Chrome DevTools MCP: signed in, created a report, uploaded an artifact, and opened the signed URL.
- Pending: run `./scripts/supabase_push.sh` to apply storage bucket/policy migration.
