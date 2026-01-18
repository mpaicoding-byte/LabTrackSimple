# UX Revamp: Full shadcn/ui Migration Proposal

## Overview

This document outlines all UI elements in the LabTrackSimple application that should be migrated to use official shadcn/ui components. The goal is to ensure consistency, maintainability, and adherence to best practices by using the shadcn/ui component library throughout the application.

---

## Current State Summary

### ✅ Already Using shadcn/ui

| Component | Location |
|-----------|----------|
| `Button` | `@/components/ui/button` |
| `Card`, `CardContent`, `CardHeader`, `CardTitle` | `@/components/ui/card` |
| `Input` | `@/components/ui/input` |
| `Badge` | `@/components/ui/badge` |
| `Skeleton` | `@/components/ui/skeleton` |
| `Chart` (Recharts wrapper) | `@/components/ui/chart` |
| `Tabs`, `TabsList`, `TabsTrigger` | `@/components/ui/tabs` |

### ❌ Missing shadcn/ui Components (Need to Install)

| Component | Use Case | Installation Command |
|-----------|----------|---------------------|
| `Label` | Form labels (currently native `<label>`) | `npx shadcn@latest add label` |
| `Select` | Dropdowns (currently native `<select>`) | `npx shadcn@latest add select` |
| `Form` | Form validation with react-hook-form | `npx shadcn@latest add form` |
| `Table` | Data tables (currently native `<table>`) | `npx shadcn@latest add table` |
| `Dialog` | Modal dialogs | `npx shadcn@latest add dialog` |
| `AlertDialog` | Confirmation dialogs | `npx shadcn@latest add alert-dialog` |
| `Toast` / `Sonner` | Notifications | `npx shadcn@latest add sonner` |
| `Avatar` | User profile images | `npx shadcn@latest add avatar` |
| `DropdownMenu` | User menu in sidebar | `npx shadcn@latest add dropdown-menu` |
| `Separator` | Visual dividers | `npx shadcn@latest add separator` |
| `DatePicker` / `Calendar` | Date inputs | `npx shadcn@latest add calendar popover` |
| `Sidebar` | Main navigation | Use shadcn/ui sidebar block |

---

## Detailed Migration Plan

### 1. LABELS - Replace Native `<label>` with shadcn `Label`

**Files to Update:**
- `features/auth/AuthScreen.tsx` (lines 150, 169, 205)
- `features/people/PeopleManager.tsx` (lines 207, 216, 226)
- `features/onboarding/ProfileCompletionScreen.tsx` (lines 171, 187)
- `features/reports/ReportsManager.tsx` (lines 472, 492)

**Current (native HTML):**
```tsx
<label htmlFor="email" className="text-sm font-medium">Email</label>
```

**Replace with:**
```tsx
import { Label } from "@/components/ui/label"

<Label htmlFor="email">Email</Label>
```

**Installation:**
```bash
npx shadcn@latest add label
```

---

### 2. SELECT - Replace Native `<select>` with shadcn `Select`

**Files to Update:**
- `features/people/PeopleManager.tsx` (lines 227-234) - Gender select
- `features/onboarding/ProfileCompletionScreen.tsx` (lines 190-202) - Gender select
- `features/reports/ReportsManager.tsx` (line ~475) - Person select

**Current (native HTML):**
```tsx
<select
  id="person-gender"
  className="w-full rounded-md border border-input bg-background px-3 py-2..."
  value={gender}
  onChange={e => setGender(e.target.value)}
>
  <option value="">Select...</option>
  <option value="male">Male</option>
  <option value="female">Female</option>
</select>
```

**Replace with:**
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

<Select value={gender || undefined} onValueChange={setGender}>
  <SelectTrigger>
    <SelectValue placeholder="Select gender" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="male">Male</SelectItem>
    <SelectItem value="female">Female</SelectItem>
    <SelectItem value="other">Other</SelectItem>
  </SelectContent>
</Select>
```

**Installation:**
```bash
npx shadcn@latest add select
```

**Note:** `SelectValue` placeholders only render when `value` is `undefined` (not empty string).

---

### 3. TABLE - Replace Native `<table>` with shadcn `Table`

**Files to Update:**
- `features/trends/TrendsManager.tsx` (line 314)
- `features/review/ReviewGrid.tsx` (line 120)

**Current (native HTML):**
```tsx
<table className="w-full table-fixed text-sm">
  <thead className="bg-muted/40 text-xs uppercase...">
    <tr>
      <th className="px-6 py-3 text-left font-semibold">Test</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td className="px-6 py-4">...</td>
    </tr>
  </tbody>
</table>
```

**Replace with:**
```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Test</TableHead>
      <TableHead>Trend</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>...</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

**Installation:**
```bash
npx shadcn@latest add table
```

---

### 4. DATE PICKER - Replace Native `type="date"` with shadcn Calendar

**Files to Update:**
- `features/people/PeopleManager.tsx` (lines 219, 294)
- `features/onboarding/ProfileCompletionScreen.tsx` (line 176)
- `features/reports/ReportsManager.tsx` (line 496)

**Current (native HTML):**
```tsx
<Input type="date" value={dob} onChange={e => setDob(e.target.value)} />
```

**Replace with:**
```tsx
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" className="w-full justify-start text-left">
      <CalendarIcon className="mr-2 h-4 w-4" />
      {dob ? format(dob, "PPP") : "Pick a date"}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0">
    <Calendar mode="single" selected={dob} onSelect={setDob} />
  </PopoverContent>
</Popover>
```

**Installation:**
```bash
npx shadcn@latest add calendar popover
npm install date-fns
```

**Data Model Note:** this changes `dob` from a string (e.g. `"2024-01-18"`) to a `Date`. You must normalize on submit (string ↔ Date) and decide timezone handling (UTC vs local) to avoid off-by-one issues.

---

### 5. FORM VALIDATION - Add react-hook-form with shadcn Form

**Files to Update:**
- `features/auth/AuthScreen.tsx` - Sign in/Sign up form
- `features/onboarding/ProfileCompletionScreen.tsx` - Profile form
- `features/people/PeopleManager.tsx` - Add person form

**Current (manual useState):**
```tsx
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [status, setStatus] = useState({ type: "idle", message: "" });

const handleSubmit = async (e) => {
  e.preventDefault();
  // manual validation
  if (!email) { setStatus({ type: "error", message: "Email required" }); return; }
  // ...
};
```

**Replace with:**
```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const formSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

const form = useForm({ resolver: zodResolver(formSchema) });

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input placeholder="email@example.com" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

**Installation:**
```bash
npx shadcn@latest add form
npm install @hookform/resolvers zod
```

---

### 6. TOAST NOTIFICATIONS - Add Sonner for Feedback

**Files to Update:**
- `features/auth/AuthScreen.tsx` - Success/error messages
- `features/people/PeopleManager.tsx` - Create/delete confirmations
- `features/reports/ReportsManager.tsx` - Upload success/failure
- `features/review/ReviewManager.tsx` - Save confirmations

**Current (inline status messages):**
```tsx
{status.type === "error" && (
  <p className="text-sm text-destructive">{status.message}</p>
)}
{status.type === "success" && (
  <p className="text-sm text-green-600">{status.message}</p>
)}
```

**Replace with:**
```tsx
import { toast } from "sonner"

// On success
toast.success("Account created successfully!");

// On error
toast.error("Failed to sign in. Please check your credentials.");

// Add Toaster to root layout
import { Toaster } from "@/components/ui/sonner"
<Toaster />
```

**Installation:**
```bash
npx shadcn@latest add sonner
npm install sonner next-themes
```

**Note:** keep inline, persistent status messages where the user must see long-lived errors; use toasts for transient feedback.

---

### 7. AUTH SCREEN - Use shadcn/ui Login Block

**File:** `features/auth/AuthScreen.tsx` (266 lines of custom code)

**Current:** Fully custom implementation with manual tabs and form handling

**Replace with:** shadcn/ui Login Block from https://ui.shadcn.com/blocks/login

**Benefits:**
- Pre-built, tested components
- Better accessibility
- Consistent with shadcn design system
- Less custom code to maintain

---

### 8. SIDEBAR - Use shadcn/ui Sidebar Component

**File:** `components/layout/AppSidebar.tsx` (110 lines of custom code)

**Current:** Custom sidebar with inline sign-out logic

**Replace with:** shadcn/ui Sidebar component or sidebar block

**Benefits:**
- Collapsible sidebar support
- Mobile responsive
- User menu with dropdown
- Consistent styling

**Installation:**
```bash
npx shadcn@latest add sidebar
```

---

### 9. CREATE `useAuth` HOOK - Centralize Auth Logic

**Current Problem:** Auth logic is scattered:
- `AppSidebar.tsx` has `handleSignOut` function (lines 28-37)
- `AuthScreen.tsx` has `signInWithPassword` and `signUp` calls (lines 47-71)

**Create:** `features/auth/useAuth.ts`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/features/core/supabaseClient";

export function useAuth() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return false;
    }
    router.push("/");
    return true;
  };

  const signUp = async (email: string, password: string, metadata?: object) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({ email, password, options: { data: metadata } });
    setLoading(false);
    if (error) {
      setError(error.message);
      return false;
    }
    return true;
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    router.push("/auth");
  };

  return { signIn, signUp, signOut, loading, error };
}
```

**Behavior Decisions to Lock:**
- On sign-in success, should we route immediately or wait for session to be hydrated?
- On sign-up success, do we show “check your email” or auto-login?
- Should error state be transient (toast) or persistent (inline)?

---

### 10. DIALOG FOR CONFIRMATIONS - Replace Any Inline Modals

**Current:** No confirmation dialogs for destructive actions

**Add:** Confirmation dialog before deleting people/reports

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Installation:**
```bash
npx shadcn@latest add alert-dialog
```

---

## Testing & Verification (Required)

UI changes must follow repo rules:
- **TDD**: tests first, verify failure, then implement.
- **Component tests** for each updated screen (Auth, People, Onboarding, Reports, Trends/Review where tables change).
- **E2E** for any auth/people/report change.
- **UI verification** via Chrome DevTools MCP after changes.

Add/adjust tests to cover:
- New Select behavior (placeholder + selection).
- Date picker conversions (string ↔ Date).
- Toast feedback on success/failure.
- AlertDialog confirmation for destructive actions.

---

## Installation Summary

Run all installations at once:

```bash
npx shadcn@latest add label select table calendar popover form sonner alert-dialog dialog dropdown-menu avatar separator sidebar
npm install @hookform/resolvers zod date-fns sonner next-themes
```

---

## Priority Order

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| 🔴 High | Replace native `<select>` with Select | Low | High |
| 🔴 High | Replace native `<label>` with Label | Low | Medium |
| 🔴 High | Add Toast notifications (Sonner) | Medium | High |
| 🟡 Medium | Replace native `<table>` with Table | Medium | Medium |
| 🟡 Medium | Create `useAuth` hook | Medium | High |
| 🟡 Medium | Replace date inputs with Calendar/DatePicker | Medium | Medium |
| 🟢 Low | Migrate to Form component with validation | High | Medium |
| 🟢 Low | Use Login block for AuthScreen | High | Low |
| 🟢 Low | Use Sidebar component | High | Low |

**Recommendation:** treat the Login/Sidebar blocks as separate phases with explicit acceptance criteria and UI verification gates.

---

## Files Requiring Changes

| File | Changes Needed |
|------|----------------|
| `features/auth/AuthScreen.tsx` | Label, Form, Toast, possibly replace with Login block |
| `features/onboarding/ProfileCompletionScreen.tsx` | Label, Select, DatePicker, Form |
| `features/people/PeopleManager.tsx` | Label, Select, DatePicker, AlertDialog |
| `features/reports/ReportsManager.tsx` | Label, Select, DatePicker, Toast |
| `features/trends/TrendsManager.tsx` | Table |
| `features/review/ReviewGrid.tsx` | Table |
| `components/layout/AppSidebar.tsx` | Use useAuth hook, consider Sidebar component |
| `app/layout.tsx` | Add Toaster component |

---

## Notes

1. **Backward Compatibility:** All changes should be done incrementally to avoid breaking the app
2. **Testing:** Each migration should be tested before moving to the next
3. **Styling:** shadcn/ui components inherit from your CSS variables, so theming should work automatically
4. **Accessibility:** shadcn/ui components are WAI-ARIA compliant, improving accessibility

---

## Resources

- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [shadcn/ui Blocks](https://ui.shadcn.com/blocks)
- [Login Block](https://ui.shadcn.com/blocks/login)
- [Sidebar Block](https://ui.shadcn.com/blocks/sidebar)
