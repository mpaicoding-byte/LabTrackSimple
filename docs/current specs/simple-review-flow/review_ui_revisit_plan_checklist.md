# Review UI Revisit (Edit UX + Manual Entry) — Plan + Checklist

## Goal
- Reduce friction by removing “Edit” noise and making review feel like a single flow.
- Allow owners to create results manually when there’s no document/artifact.

## UX Recommendation (Proposed)
### 1) Editing extracted rows
**Recommend:** “Always editable (owner only) + single primary action `Confirm & Save` persists edits.”
- Owner sees inputs directly (no per-row “Edit” button).
- Members remain read-only.
- `Confirm & Save` saves any pending edits (and confirms).

**Fallback (if you prefer):** “Edit mode toggle” at the top that enables/disables inputs for all rows.

### 2) Manual entry (no document)
**Recommend:** Add “Create manual report” on `/reports` for owners.
- Creates a report without an artifact, then routes to `/reports/:id/review`.
- Review page supports adding rows from scratch (“Add result”).
- Confirm flow stays the same (`Confirm & Save` → report becomes `final`).

## Open Questions (Answer before implementation)
1) Editing: prefer **always editable** or a top **Edit mode** toggle?
2) Saving model: should `Confirm & Save` (a) auto-save all pending edits, or (b) stay disabled until everything is explicitly saved?
3) Manual report: allow adding a file later, or keep it “manual-only”?
4) Manual entry: allow “Add result” even when a document exists (to add missing tests), or only when no artifact/rows exist?

## Plan (Engineering Steps)
1) Add/adjust component tests for review editing UX and manual rows.
2) Add an E2E flow: create manual report → add row → confirm → report shows `final`.
3) Implement review UI changes (remove per-row edit noise, add “Add result”).
4) Implement reports UI: “Create manual report” (no file) + create a current extraction run for the report.
5) Verify via Chrome DevTools MCP (1 owner flow end-to-end).

## Checklist
### Red (Tests First)
- [x] Component: owner sees inputs without per-row “Edit”.
- [x] Component: member remains read-only (no editable inputs).
- [x] Component: “Add result” adds a new editable row state.
- [x] Component: “Confirm & Save” persists pending edits (single action).
- [x] E2E: create manual report (no file) → add result → confirm → report is `final`.

### Green (Implementation)
- [x] Review page: simplify editing UX (remove per-row Edit).
- [x] Review page: add “Add result” UI and persistence path.
- [x] Reports page: add “Create manual report” entry point.
- [x] Manual report creation: create `lab_reports` + `extraction_runs` and set `current_extraction_run_id`.
- [x] Confirm flow: ensure it works with manually created rows.

### Verify
- [x] Run `npm run test`.
- [x] Run `npm run test:e2e`.
- [x] Verify DB state for a manual report: run exists, report final after confirm.
- [x] Verify UI end-to-end with Chrome DevTools MCP + save screenshots.
