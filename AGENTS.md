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

### Required Sequence
1. **Red** → Write test → Run → Verify FAILS
2. **Green** → Implement feature → Run → Verify PASSES  
3. **Verify** → Run full suite → All PASS

---

## Three-Phase Execution

### Phase 1: Red (Test Only)
- Write test in test directory (e.g., `tests/`, `__tests__/`, or `*.spec.*`/`*.test.*`)
- Start dev server if needed
- Run test → Must FAIL (feature doesn't exist)
- **DO NOT touch production files**

### Phase 2: Green (Implement Only)
- Only proceed if Phase 1 has failing test
- Modify production files to make test pass
- Write minimal code (only what test requires)
- **DO NOT run tests yet**

### Phase 3: Verify
- Run specific test → Must PASS
- Run full test suite → All PASS

---

## Response Format

When user requests a feature:

```
I'll implement [feature] using TDD:

Phase 1 (Red): Write failing test ❌
Phase 2 (Green): Implement feature ✅  
Phase 3 (Verify): Confirm all tests pass ✅

Starting Phase 1...
```

Then execute three separate phases sequentially.

---

## Final Report Template

```markdown
## TDD Complete ✅

**Feature:** [description]
**Test:** `path/to/test` - "[test name]"

### Results
- ❌ Phase 1: FAILED (expected)
- ✅ Phase 2: Implemented
- ✅ Phase 3: All tests pass (X/X)

### Files Modified
- `path/to/implementation` - Added [feature]
- `path/to/test` - Added test
```


# General

-  your next implementation plan & checklist is in implementation_plan.md. always update the checklist whenever the item is completed don't wait for the whole phase to be complete.