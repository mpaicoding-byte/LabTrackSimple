# shadcn/ui Migration Plan

> **Created:** 2026-01-17  
> **Status:** In Progress  
> **Goal:** Replace custom Tailwind UI components and theme styling with shadcn/ui defaults for consistency, accessibility, and lower maintenance.

---

## Executive Summary

This document provides a detailed migration plan from the current custom Tailwind-based UI components to **shadcn/ui**. The migration will:

1. Adopt shadcn/ui defaults (theme tokens + component styles)
2. Replace hand-rolled primitives with Radix-powered, accessible components
3. Remove custom UI utilities (glass, gradients, bespoke tokens)
4. Standardize future component additions via shadcn CLI

---

## 1. Current State Analysis

### 1.1 Existing UI Components (`components/ui/`)

| Component | File | Lines | Description | shadcn Equivalent |
|-----------|------|-------|-------------|-------------------|
| **Button** | `button.tsx` | 69 | Variants: default, destructive, outline, secondary, ghost, link. Sizes: default, sm, lg, icon. Has `asChild` via custom Slot | ✅ Direct replacement |
| **Card** | `card.tsx` | 79 | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter | ✅ Direct replacement |
| **Input** | `input.tsx` | 25 | Basic input with focus ring styling | ✅ Direct replacement |
| **Badge** | `badge.tsx` | 29 | Variants: default, secondary, destructive, outline, success, warning | ✅ Replace with shadcn default variants (drop success/warning) |
| **Skeleton** | `skeleton.tsx` | 19 | Simple pulse skeleton | ✅ Direct replacement |
| **ErrorBoundary** | `error-boundary.tsx` | 41 | React class error boundary | ⛔ Keep as-is (not in shadcn) |

### 1.2 Layout Components (`components/layout/`)

| Component | File | Notes |
|-----------|------|-------|
| **DashboardLayout** | `DashboardLayout.tsx` | Keep as-is, uses UI components |
| **AppSidebar** | `AppSidebar.tsx` | Keep as-is, uses Button |

### 1.3 Custom Styling Assets

| File | Purpose | Migration Impact |
|------|---------|------------------|
| `app/globals.css` | CSS variables, glass utilities, animations | **Merge with shadcn theme config** |
| `lib/utils.ts` | `cn()` utility | ✅ Already shadcn-compatible |

---

## 2. Component Dependency Matrix

### 2.1 Files Using UI Components

| File | Button | Card | Input | Badge | Skeleton | ErrorBoundary |
|------|:------:|:----:|:-----:|:-----:|:--------:|:-------------:|
| `app/page.tsx` | ✅ | ✅ | | | ✅ | |
| `app/settings/page.tsx` | ✅ | ✅ | | | | |
| `app/error.tsx` | | | | | | |
| `app/loading.tsx` | | | | | | |
| `app/not-found.tsx` | | | | | | |
| `features/auth/AuthScreen.tsx` | ✅ | ✅ | ✅ | | | |
| `features/people/PeopleManager.tsx` | ✅ | ✅ | ✅ | | | ✅ |
| `features/reports/ReportsManager.tsx` | ✅ | ✅ | ✅ | ✅ | | ✅ |
| `features/reports/components/FileDropzone.tsx` | | | | | | |
| `features/review/ReviewGrid.tsx` | ✅ | | ✅ | | | |
| `features/review/ReviewManager.tsx` | ✅ | ✅ | | | | ✅ |
| `features/review/ReviewLayoutPieces.tsx` | ✅ | ✅ | | | | |
| `features/onboarding/ProfileCompletionScreen.tsx` | | | | | | |
| `components/layout/AppSidebar.tsx` | ✅ | | | | | |

### 2.2 Test Files Requiring Updates

| Test File | Components Tested |
|-----------|-------------------|
| `features/ui/__tests__/Button.test.tsx` | Button (asChild behavior) |
| `features/ui/__tests__/Card.test.tsx` | Card (class assertions) |
| `features/ui/__tests__/Skeleton.test.tsx` | Skeleton (class assertions) |
| `features/ui/__tests__/ErrorBoundary.test.tsx` | ErrorBoundary (fallback) |
| `features/ui/__tests__/DashboardLayout.test.tsx` | Layout (indirect) |
| `features/ui/__tests__/DashboardPage.test.tsx` | Page (indirect) |

---

## 3. Pre-Migration Checklist

### 3.1 Dependencies to Install

```bash
# Required: Radix primitives (installed automatically by shadcn CLI)
# class-variance-authority for component variants
npx shadcn@latest init
```

### 3.2 Configuration Decisions

| Decision | Recommended Choice | Reason |
|----------|-------------------|--------|
| **Style system** | `New York` | Adopt shadcn default component style |
| **Base color** | `neutral` | Default shadcn palette for lowest maintenance |
| **Use CSS variables** | ✅ Yes | Already have them in globals.css |
| **React Server Components** | ✅ Yes | Next.js 16 App Router |
| **Tailwind CSS version** | v4 | Already on v4 per package.json |

### 3.3 Files to Backup Before Migration

```
components/ui/button.tsx      → components/ui/button.tsx.bak
components/ui/card.tsx        → components/ui/card.tsx.bak
components/ui/input.tsx       → components/ui/input.tsx.bak
components/ui/badge.tsx       → components/ui/badge.tsx.bak
components/ui/skeleton.tsx    → components/ui/skeleton.tsx.bak
```

---

## 4. Migration Steps

### Phase 1: Initialize shadcn/ui (30 min)

```bash
# Step 1: Initialize shadcn/ui
npx shadcn@latest init

# When prompted:
# - Style: New York (or Default)
# - Base color: Zinc
# - CSS variables: Yes
# - Tailwind config: N/A (using v4 CSS)
# - Components path: @/components/ui
# - Utils path: @/lib/utils (already exists)
# - RSC: Yes
```

**Manual Step:** After init, merge the generated `globals.css` additions with your existing CSS. Preserve:
- Your custom `--primary`, `--background`, `--foreground` values
- Your `.glass`, `.glass-hover` utilities
- Your aurora animation
- Your custom scrollbar styles

### Phase 2: Install Core Components (20 min)

```bash
# Install components that match your current usage
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add badge
npx shadcn@latest add skeleton
```

### Phase 3: Keep Defaults (No Customization)

Use shadcn/ui defaults as generated by the CLI. Do not reintroduce custom
glass/gradient styling into the primitives. If a component needs differentiation,
prefer built-in `variant` and `size` options instead of custom class names.

### Phase 4: Update Test Files (1 hour)

The main issue: **class name assertions will break** because shadcn uses slightly different class names.

#### Test Updates Required

| Test File | Current Assertion | New Approach |
|-----------|-------------------|--------------|
| `Card.test.tsx` | `expect(card).toHaveClass("bg-white/80")` | Update class or use `toBeInTheDocument()` |
| `Skeleton.test.tsx` | `expect(skeleton).toHaveClass("animate-pulse")` | Should still work |
| `Button.test.tsx` | Tests `asChild` behavior | Should work (shadcn uses same pattern) |

**Recommendation:** Update tests to focus on **behavior** not **implementation details** (class names). This makes tests more resilient to styling changes.

### Phase 5: Visual Verification (1 hour)

After migration, verify each page:

- Use the Chrome DevTools MCP for UI verification (per AGENTS.md).
- [ ] `/` - Dashboard (Cards, Buttons, Skeleton)
- [ ] `/auth` - Auth screen (Cards, Inputs, Buttons)
- [ ] `/reports` - Reports manager (Cards, Inputs, Buttons, Badges)
- [ ] `/reports/[id]/review` - Review page (Cards, Buttons, Inputs)
- [ ] `/people` - People manager (Cards, Inputs, Buttons)
- [ ] `/settings` - Settings page (Cards, Buttons)
- [ ] `/onboarding` - Profile completion (no UI components used)
- [ ] Dark mode toggle on all pages
- [ ] Mobile responsive behavior

---

## 5. Future Component Additions

With shadcn/ui installed, you can easily add these components for future features:

| Component | Use Case | Command |
|-----------|----------|---------|
| **Select** | Gender/Person dropdowns (replace native `<select>`) | `npx shadcn@latest add select` |
| **Dialog** | Delete confirmation modals | `npx shadcn@latest add dialog` |
| **Alert Dialog** | Destructive action confirmations | `npx shadcn@latest add alert-dialog` |
| **Table** | Review grid enhancement | `npx shadcn@latest add table` |
| **Tabs** | Multi-section views | `npx shadcn@latest add tabs` |
| **Toast/Sonner** | Notification feedback | `npx shadcn@latest add sonner` |
| **Dropdown Menu** | Sidebar actions | `npx shadcn@latest add dropdown-menu` |
| **Form** | Form validation integration | `npx shadcn@latest add form` |
| **Label** | Accessible form labels | `npx shadcn@latest add label` |

---

## 6. CSS Variable Mapping

Your current CSS variables are **already compatible** with shadcn/ui's expected format. Here's the mapping:

| Your Variable | shadcn Expectation | Status |
|---------------|-------------------|--------|
| `--background` | `--background` | ✅ Match |
| `--foreground` | `--foreground` | ✅ Match |
| `--card` | `--card` | ✅ Match |
| `--card-foreground` | `--card-foreground` | ✅ Match |
| `--primary` | `--primary` | ✅ Match |
| `--primary-foreground` | `--primary-foreground` | ✅ Match |
| `--secondary` | `--secondary` | ✅ Match |
| `--muted` | `--muted` | ✅ Match |
| `--accent` | `--accent` | ✅ Match |
| `--destructive` | `--destructive` | ✅ Match |
| `--border` | `--border` | ✅ Match |
| `--input` | `--input` | ✅ Match |
| `--ring` | `--ring` | ✅ Match |
| `--radius` | `--radius` | ✅ Match |

**No variable renaming required!** This is a big win.

---

## 7. Detailed File Changes

### 7.1 Files to Replace (Component Files)

| File | Action |
|------|--------|
| `components/ui/button.tsx` | Replace with shadcn version, customize |
| `components/ui/card.tsx` | Replace with shadcn version, customize |
| `components/ui/input.tsx` | Replace with shadcn version, customize |
| `components/ui/badge.tsx` | Replace with shadcn version, add variants |
| `components/ui/skeleton.tsx` | Replace with shadcn version |

### 7.2 Files to Keep (No Changes)

| File | Reason |
|------|--------|
| `components/ui/error-boundary.tsx` | Not a shadcn component |
| `components/layout/DashboardLayout.tsx` | Uses components via imports |
| `components/layout/AppSidebar.tsx` | Uses components via imports |
| `lib/utils.ts` | Already matches shadcn's expected `cn()` utility |

### 7.3 Files to Merge/Update

| File | Changes |
|------|---------|
| `app/globals.css` | Merge shadcn theme additions with existing styles |
| `tailwind.config.ts` or CSS | May generate new config if Tailwind v4 compatibility issues |
| `package.json` | New dependencies from shadcn init |

### 7.4 Consumer Files (No Import Changes Needed)

All feature files use the pattern:
```tsx
import { Button } from "@/components/ui/button";
```

Since shadcn installs to the same path, **no import changes are required** in:
- `app/page.tsx`
- `app/settings/page.tsx`
- `features/auth/AuthScreen.tsx`
- `features/people/PeopleManager.tsx`
- `features/reports/ReportsManager.tsx`
- `features/review/ReviewGrid.tsx`
- `features/review/ReviewManager.tsx`
- `features/review/ReviewLayoutPieces.tsx`
- `components/layout/AppSidebar.tsx`

### 7.5 Test Files to Update

| File | Update Required |
|------|-----------------|
| `features/ui/__tests__/Button.test.tsx` | Review `asChild` test (likely still works) |
| `features/ui/__tests__/Card.test.tsx` | **Update class assertions** |
| `features/ui/__tests__/Skeleton.test.tsx` | **Update class assertions** |
| `features/ui/__tests__/ErrorBoundary.test.tsx` | No changes (not a shadcn component) |

---

## 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Class name changes break tests | High | Low | Update tests to check behavior, not classes |
| Visual inconsistencies | Medium | Medium | Thorough visual QA after customization |
| Radix dependency conflicts | Low | High | Check React 19 compatibility before install |
| Dark mode styling differences | Medium | Medium | Verify all dark: variants after migration |
| Custom glassmorphism lost | Medium | High | Manually re-add glass styles to components |

---

## 9. Rollback Plan

If migration causes issues:

1. **Restore backups:**
   ```bash
   mv components/ui/button.tsx.bak components/ui/button.tsx
   mv components/ui/card.tsx.bak components/ui/card.tsx
   # ... etc
   ```

2. **Remove shadcn dependencies:**
   ```bash
   npm uninstall @radix-ui/react-slot class-variance-authority
   # Remove any other added @radix-ui packages
   ```

3. **Restore globals.css** from git history

---

## 10. Timeline Estimate

| Phase | Duration | Complexity |
|-------|----------|------------|
| Phase 1: Init shadcn | 30 min | Low |
| Phase 2: Install components | 20 min | Low |
| Phase 3: Customize components | 1-2 hours | Medium |
| Phase 4: Update tests | 1 hour | Medium |
| Phase 5: Visual QA | 1 hour | Low |
| **Total** | **~4-5 hours** | |

---

## 11. Post-Migration Cleanup

After successful migration:

- [ ] Delete `.bak` backup files
- [ ] Update `AGENTS.md` with shadcn/ui usage guidelines
- [ ] Add shadcn CLI to dev workflow docs
- [ ] Consider migrating native `<select>` elements to shadcn Select
- [ ] Consider adding Dialog for delete confirmations
- [ ] Consider adding Sonner for toast notifications

---

## Appendix A: Files Summary

### Total Files Affected

| Category | Count | Files |
|----------|-------|-------|
| **Components to Replace** | 5 | button, card, input, badge, skeleton |
| **Components to Keep** | 1 | error-boundary |
| **Feature Files (no changes)** | 9 | Various page/feature files |
| **Test Files to Update** | 4 | Button, Card, Skeleton tests + class assertions |
| **Config Files** | 2-3 | globals.css, package.json, possibly tailwind config |

### Dependency Changes

```diff
# package.json additions (estimated)
+ "@radix-ui/react-slot": "^1.x.x"
+ "class-variance-authority": "^0.7.x"
+ "@radix-ui/react-..." (per component)
```

---

## Appendix B: Quick Reference Commands

```bash
# Initialize shadcn
npx shadcn@latest init

# Add specific components
npx shadcn@latest add button card input badge skeleton

# Add future components
npx shadcn@latest add dialog select table tabs sonner

# List available components
npx shadcn@latest add

# Check for updates
npx shadcn@latest diff
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-17
