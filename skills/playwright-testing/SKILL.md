---
name: testing
description: Testing guidance for this repo (unit, component, integration, and E2E). Includes troubleshooting.
---

# Testing (Repo-Specific)

Use this skill when running or troubleshooting tests in this repo. Tests must be run by the agent (automatic); do not ask the user to run them.

## Playwright (E2E)
- **Dev server EPERM**
  - Start `npm run dev` in the host terminal and run tests with:
    - `E2E_BASE_URL=http://127.0.0.1:3000`
- **System Chrome permission errors**
  - Use bundled Chromium (default) by leaving `PW_USE_CHROME` unset.
  - Only set `PW_USE_CHROME=true` if you explicitly want system Chrome.
- **Missing bundled browsers**
  - Run once: `npx playwright install`
- **E2E entry command pattern**
  - `E2E_BASE_URL=http://127.0.0.1:3000 npm run test:e2e -- <spec>`

## UI Verification (Mandatory)
- Any UI change requires verification using the Chrome DevTools MCP.

## Unit / Component
- Unit: `npm run test` (node --test).
- Component: `npm run test:unit` (vitest + jsdom).

## Integration
- Start local Supabase: `npx supabase start`.

## Lint / Typecheck
- Lint: `npm run lint`.
- Typecheck: `tsc --noEmit` (or project script if present).
