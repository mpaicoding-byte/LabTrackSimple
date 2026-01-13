# UX Revamp & Tech Debt Checklist

This checklist tracks the modernization of the LabTrackSimple UI and Workflow.

## Phase 1: Tech Stack & Assets
- [x] **Install UI Dependencies**
    - `npm install lucide-react clsx tailwind-merge`
- [x] **Configure Fonts (Clean Modern)**
    - Switch `app/layout.tsx` from `Space_Grotesk/Fraunces` to `Inter` (from `next/font/google`).
    - Update `app/globals.css` variable mappings.
- [x] **Setup Utility `cn` helper**
    - Create `lib/utils.ts` with the standard `clsx` + `tailwind-merge` combiner.

## Phase 2: Core UI Components
Create these "dumb" components in `components/ui` to build our design system.
- [x] **Button** (`components/ui/button.tsx`) - Variants: default, outline, ghost.
- [x] **Input** (`components/ui/input.tsx`)
- [x] **Card** (`components/ui/card.tsx`) - Header, Title, Content, Footer parts.
- [x] **Badge** (`components/ui/badge.tsx`) - For status (Draft, Final, Error).
- [ ] **Label** (Optional wrapper, skipped for now).
- [ ] **Select** (Native used for now).

## Phase 3: App Layout (Sidebar)
Refactor the root layout to support a sidebar-first navigation.
- [x] **Create Sidebar Component** (`components/layout/AppSidebar.tsx`)
    - Logo area.
    - Navigation Links (Dashboard, Reports, People, Settings).
    - User Profile / Sign out at bottom.
- [x] **Update Root Layout** (`app/layout.tsx`)
    - Created `components/layout/DashboardLayout.tsx` instead to wrap authenticated views.
- [x] **Fix Sidebar Auth Integration** (2026-01-13)
    - Added working Sign out functionality using Supabase auth
    - Added Sign in button when logged out
    - Added active link highlighting
    - Displays user email when logged in
    - Removed redundant "Dashboard" link (was identical to Reports)

## Phase 4: The "Upload First" Feature
Replace the manual "Create Report" form.
- [x] **Create Dropzone Component** (`features/reports/components/FileDropzone.tsx`)
    - Big dashed area.
    - Handles drag & drop events.
    - Returns `File` object.
- [x] **Create Upload Modal / Draf View**
    - Implemented as Draft View state within `ReportsManager`.
    - Show minimal form: Person Selector, Date Picker.
    - "Upload & Save" action.

## Phase 5: Dashboard & Tables
- [x] **Create Reports Data Table** (`features/reports/components/ReportsList.tsx`)
    - Implemented as List View within `ReportsManager`.
    - Columns: Status (Icon), Date, Person (Avatar/Name), Source (Text), Actions (View).
- [x] **Integrate into Page** (`app/reports/page.tsx`)
    - Header: Title + "New Report" Button.
    - Body: `ReportsList` + `EmptyState`.

## Phase 6: Navigation & Routing Fixes (2026-01-13)
- [x] **Fix broken routes**
    - Created `/login` page (redirects to `/auth`)
    - Created `/settings` page (placeholder "Coming Soon")
- [x] **Create proper Dashboard** (`app/page.tsx`)
    - Stats cards: Total Reports, Family Members, Recent Reports, Insights
    - Quick Actions: Upload Lab Report, Manage People, View All Reports
    - Recent Activity feed showing latest reports
    - Getting Started banner for new users
    - Sign-in prompt when not authenticated
- [x] **Auth Flow in Sidebar**
    - Sign out button now works properly
    - Sign in button visible when logged out
    - User email shown when logged in
    - Dashboard added back as first nav item


## Phase 7: Cleanup & Coding Guidelines
- [ ] **Delete Old Code**
    - Remove the old `ReportsManager.tsx` monolithic file.
    - Remove unused CSS classes from `app/globals.css` if any.
- [ ] **Refine Docs**
    - Update `docs/implementation_plan.md` (mark UI phases as "Revising").
    - Update `docs/technical_specification.md` if data models changed (unlikely, this is pure UX).

## Non-UX / Coding Improvements
- [ ] **Strict Types**: Ensure all generic `any` are removed from the new components.
- [ ] **Error Boundaries**: Add `<ErrorBoundary>` around the main list views.
- [ ] **Loading States**: Add proper Skeletons (using `components/ui/skeleton.tsx`) instead of just "Loading..." text.

