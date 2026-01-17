# Review UI Revisit (Edit UX + Manual Test Entry) — Plan + Checklist

## Goal
- Reduce friction by removing “Edit” noise and making review feel like a single flow.
- Allow owners to add tests manually during review when extraction misses items.

## UX Recommendation (Proposed)
### 1) Editing extracted rows
**Recommend:** “Always editable (owner only) + single primary action `Review & confirm` persists edits.”
- Owner sees inputs directly (no per-row “Edit” button).
- Members remain read-only.
- `Review & confirm` saves any pending edits (and confirms).
**Final reports:** View-only by default; owners use an **Edit** action to enter draft mode with **Discard draft** or **Review & confirm**.

**Fallback (if you prefer):** “Edit mode toggle” at the top that enables/disables inputs for all rows.

### 2) Manual entry during review
**Recommend:** Add tests directly in the review grid (no separate manual report flow).
- Review page supports adding rows from scratch (“Add test”).
- Confirm flow stays the same (`Review & confirm` → report becomes `final`).

## Open Questions (Answer before implementation)
1) Editing: prefer **always editable** or a top **Edit mode** toggle?
2) Saving model: should `Review & confirm` (a) auto-save all pending edits, or (b) stay disabled until everything is explicitly saved?
3) Manual entry: allow “Add test” even when a document exists (to add missing tests), or only when no artifact/rows exist?
4) Final reports: should owners unlock edits via an explicit **Edit** action with discard? → **Yes** (Edit → draft mode + Discard draft).

## Plan (Engineering Steps)
1) Add/adjust component tests for review editing UX and manual rows.
2) Add an E2E flow: upload report → add test → confirm → report shows `final`.
3) Implement review UI changes (remove per-row edit noise, add “Add test”).
4) Verify via Chrome DevTools MCP (1 owner flow end-to-end).
5) Add final report edit toggle with discard + confirm, plus tests.

## Checklist
### Red (Tests First)
- [x] Component: owner sees inputs without per-row “Edit”.
- [x] Component: member remains read-only (no editable inputs).
- [x] Component: “Add test” adds a new editable row state.
- [x] Component: “Review & confirm” persists pending edits (single action).
- [x] E2E: upload report → add test → confirm → report is `final`.
- [x] Component: final report shows Edit → draft mode with Discard draft.
- [x] E2E: final report can enter edit mode and discard draft.

### Green (Implementation)
- [x] Review page: simplify editing UX (remove per-row Edit).
- [x] Review page: add “Add test” UI and persistence path.
- [x] Confirm flow: ensure it works with manually added rows.
- [x] Review page: final report edit toggle (Edit → draft mode).

### Verify
- [x] Run `npm run test`.
- [x] Run `npm run test:e2e`.
- [x] Verify DB state for a manual test entry: run exists, report final after confirm.
- [x] Verify UI end-to-end with Chrome DevTools MCP + save screenshots.
- [x] Verify final report edit toggle via Chrome DevTools MCP (blocked if MCP unavailable).
