# Checklist — Profile Completion (DOB + Gender)

## Planning
- [x] Confirm final gender value list (`female`, `male`)
- [x] Decide if `gender_other` free-text is needed (not needed)
- [x] Confirm gating route (`/onboarding/profile`)

## Red (Tests First)
- [x] Add component test for completion form validation (DOB required, gender required)
- [x] Add component test for successful save and redirect
- [x] Add E2E test for signup/login -> completion -> access to app

## Green (Implementation)
- [x] Add `gender` column migration with CHECK constraint
- [x] Update shared types to include `gender`
- [x] Add profile completion route and form UI
- [x] Add auth gate to redirect when profile incomplete
- [x] Ensure save updates only the current user's linked person

## Verify
- [x] Run component tests (vitest)
- [x] Run E2E tests (Playwright)
- [x] Verify UI flow with Chrome DevTools MCP
- [x] Update `README.md` with the new onboarding step (if needed)
