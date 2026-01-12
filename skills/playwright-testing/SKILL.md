---
name: playwright-testing
description: Troubleshoot Playwright test runs in this repo (dev server EPERM, Chrome permissions, browser install, and using existing dev server with E2E_BASE_URL). Use when running Playwright E2E tests.
---

# Playwright Testing (Repo-Specific)

Use this skill when Playwright E2E runs fail or when starting E2E in this repo.

## Known Issues + Fixes

1) **Dev server EPERM**
- If Playwright webServer fails with `listen EPERM` on 127.0.0.1:3000, do NOT let Playwright start the server.
- Start `npm run dev` in the host terminal and run tests with:
  - `E2E_BASE_URL=http://127.0.0.1:3000`

2) **System Chrome permission errors**
- If Playwright cannot launch system Chrome (Crashpad/Library permissions), use bundled Chromium:
  - `PW_USE_CHROME=false`

3) **Missing bundled browsers**
- If bundled Chromium is missing, run once:
  - `npx playwright install`

4) **E2E entry command pattern**
- When running against the already-running dev server, use:
  - `PW_USE_CHROME=false E2E_BASE_URL=http://127.0.0.1:3000 npm run test:e2e -- <spec>`
