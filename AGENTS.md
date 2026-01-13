# Development Philosophy

## Architecture: Feature-Based (Pragmatic)
- Organize by feature, not by technical layer
- Keep related code together (component + hook + test)
- Shared code goes in `shared/` only when used by 3+ features, and keep usage explicit

### Principles
- KISS: prefer the simplest thing that works
- YAGNI: build what is needed now, not hypotheticals
- No premature DRY: allow 2-3 duplicates before extracting
- Flat over nested: avoid deep folder hierarchies
- Colocation: tests live near the code they test unless the framework dictates otherwise

### Rules
- Soft cap: ~200 lines per file (split when it grows or loses cohesion)
- Prefer functions over classes unless a class is clearly simpler
- Handle errors explicitly; no silent failures
- One primary export per file for main entities; allow small helper exports

# TDD Workflow Rules

## 🚨 Core Rule: Test First, Always

**NEVER write production code before a failing test exists.**

### Forbidden
- ❌ Creating/modifying production files before tests exist
- ❌ Implementing features directly  
- ❌ Writing test + implementation in same step
- ❌ Running tests before dev server is started

### Required Sequence in stages
1. **Red** → Write test → Run → Verify FAILS
2. **Green** → Implement feature → Run → Verify PASSES  
3. **Verify** → Run full suite → All PASS

---

Then execute three separate stages sequentially.

## Genral TDD Rules

- Always verify the UI when UI changes were done using the chrome dev tools mcp.

# Testing Methodology (Best Practice)

Follow a test pyramid with explicit scope and tooling. Prefer fast tests close
to the code and add end-to-end coverage for critical flows.

### Layers
- Unit tests: pure logic (formatters, validators, mappers). Use `node:test` or
  `vitest` with minimal mocking. Colocate near the code (`features/*/__tests__`).
- Component tests: UI logic in isolation (AuthScreen, PeopleManager). Use
  React Testing Library + `vitest` + `jsdom`. Mock Supabase via adapters.
- Integration tests: Supabase + RLS + DB triggers. Use local Supabase
  (`npx supabase start`) and run tests against the local stack.
- E2E tests: Full user journeys (signup → sign-in → people management). Use
  Playwright against `npm run dev` and local Supabase.

### Requirements
- Any auth/people/report feature change must include at least one E2E flow test.
- UI changes require component tests plus MCP UI verification.
- After migrations or critical flow changes, verify data in the database
  (manual SQL checks or integration tests) to confirm expected rows/state.
- Keep tests near code unless the framework requires otherwise.

### Coverage Expectations
- Cover happy-path success and explicit failure/error states.
- Include validation/empty-state behavior and permission/role boundaries.
- Verify all the flows.

# General Rules

-  your next implementation plan & checklist is in implementation_plan.md divided by phases. always update (mark as done) the checklist item in the phase that you are working whenever, the item is completed don't wait for the whole phase to be complete just mark the item that is completed.
- Check if the app is already running first. if not then run it to test.
- Use the chrome dev tools mcp to perform the UI testing.
- Use NPM to access supabase cli commands.
- Start local Supabase with `npx supabase start` (if it fails to connect to Docker, ensure Docker Desktop is running and retry).
- If you add more function secrets, update .env.supabase and rerun supabase_push.sh for supabase update.
- Use local Supabase for testing/verification; avoid online Supabase login unless explicitly requested.
- After checklist item completion, update the readme if needed accordingly for documenation.
- Use --isolated to run multiple browser instances for chrome dev tools.
- You perform the migrations in db if user approves.
- Don't ask user to access any UI to perform things, take permission from the user and do that by userself using the chrome dev tools mcp
