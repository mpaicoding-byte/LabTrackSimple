# Profile Completion for Owner (DOB + Gender) — Phase 2 Add-on

## Problem
- Signup creates the owner person automatically, but `date_of_birth` and `gender` are missing.
- People creation requires DOB and gender.
- We want minimal signup friction while still collecting required data.

## Goals
- Keep signup minimal (email + password + name).
- Collect DOB + gender immediately after first login.
- Gate access to the rest of the app until required fields are complete.
- Store data on the owner's `people` row.

## Non-goals
- Member invites or linking flows.
- Complex onboarding or optional profile fields.
- Changing report/people flows outside completion gating.

## Proposed Flow
1. Signup creates household + owner member + owner person with `date_of_birth` and `gender` null.
2. After login, app checks the current user's linked person record.
3. If either `date_of_birth` or `gender` is missing, redirect to `/onboarding/profile`.
4. User completes DOB + gender; save to `people`.
5. Continue to the app and remove the gate.

## Data Model
- Add `people.gender` column (text) with a CHECK constraint for allowed values.
- Keep `people.date_of_birth` nullable in the DB; treat it as required by the UI gate.
- Update shared types for `people` to include `gender`.

## Allowed Gender Values (Draft)
- `female`, `male`

## UX Recommendation
- Use a dedicated `/onboarding/profile` route (full-page gate).
- Rationale: clearer mandatory step, simpler to implement, and avoids modal edge cases on refresh.

## UI/UX
- Dedicated "Complete Profile" screen with DOB picker and gender select.
- Clear explanation that this is required to continue.
- Inline validation messages; disable submit until valid.

## Validation
- DOB required; must be in the past; no future dates.
- Gender required; must match allowed values.
- Show a clear error on network or permission failures.

## Access Control
- User can only update their own linked person profile.
- Owner can still edit any person in People management.

## Edge Cases
- User has no person record (unexpected) -> show error + retry/sign out.
- User already has DOB/gender -> skip the gate.
- User cancels -> remain on the gate. 

## Dependencies
- Supabase migration for `gender`.
- Updates in `features/people` and auth gate logic.

## Open Questions
- Should `date_of_birth` be required for all people at creation, or only for the owner gate? - for everyone (answered)
