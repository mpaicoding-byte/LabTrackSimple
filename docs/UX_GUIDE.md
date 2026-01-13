# UX/UI Design Guide — LabTrackSimple

## Design Philosophy
**"Clinically Clean, Consumer Friendly"**
The interface should feel like a high-end medical tool: precise, trustworthy, and calm. We are moving away from the previous "retro" aesthetic (conic gradients, decorative serifs) to a **Modern SaaS** aesthetic (whitespaces, subtle borders, high legibility).

### Core Principles
1.  **Content First**: The report data and the file itself are the heroes. Minimise chrome.
2.  **Workflow Driven**: Don't ask for data we can't act on yet. (e.g., Upload first, label later).
3.  **Visual Calm**: Use a monochrome base with purposeful semantic colors.

---

## Typography
We are migrating to a standard, high-legibility sans-serif stack.

### Font Family
-   **Primary (Body & UI):** `Inter` or `Geist Sans`
    -   *Why:* Unmatched legibility at small sizes (tables) and clean numbers.
-   **Secondary (Headings):** Same as Primary, but with tighter tracking for large text.

### Type Scale
| Role | Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Heading 1** | 24px (1.5rem) | Semibold (600) | 1.2 | Page Titles |
| **Heading 2** | 18px (1.125rem) | Medium (500) | 1.4 | Section Headers |
| **Body** | 14px (0.875rem) | Regular (400) | 1.5 | Standard text, inputs |
| **Small** | 12px (0.75rem) | Regular (400) | 1.5 | Metadata, table secondary info |

---

## Color Palette (Tailwind CSS 4 Variables)

### Base (Structure)
-   `bg-white` / `dark:bg-zinc-950`: Surface backgrounds.
-   `bg-zinc-50` / `dark:bg-zinc-900`: Secondary backgrounds (sidebars, cards).
-   `border-zinc-200` / `dark:border-zinc-800`: Subtle dividers.

### Foreground (Text)
-   `text-zinc-900`: Headings, primary data.
-   `text-zinc-500`: Secondary labels, placeholders.

### Primary (Action)
-   **Brand Color:** `Indigo` or `Violet` (Modern, Tech-forward).
    -   `bg-indigo-600`: Primary buttons.
    -   `text-indigo-600`: Active links, selected states.

### Semantic (Status)
-   **Success:** `text-emerald-600`, `bg-emerald-50`, `border-emerald-200` (Completed reports).
-   **Warning:** `text-amber-600`, `bg-amber-50`, `border-amber-200` (Review required).
-   **Error:** `text-rose-600`, `bg-rose-50`, `border-rose-200` (Failed extraction).
-   **Info:** `text-blue-600`, `bg-blue-50`, `border-blue-200` (Processing).

---

## Component Library Rules

### 1. Buttons
-   **Primary**: Solid color, medium radius (`rounded-md` or `rounded-lg`), `h-9` or `h-10`.
-   **Secondary**: White bg, 1px border (`border-input`), hover-bg-accent.
-   **Ghost**: Transparent bg, hover-bg-accent (for icon buttons).

### 2. Cards
-   **Style**: Flat with 1px border. **No high shadows**.
-   **Class**: `rounded-xl border border-zinc-200 bg-white shadow-sm`.

### 3. Inputs
-   **Style**: Minimal 1px border. Focus ring should be distinct.
-   **Class**: `h-9 rounded-md border border-zinc-200 bg-transparent px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500`.

### 4. Layout: App Shell
-   **Sidebar**: Left fixed width (`w-64`), border-right. Contains Navigation.
-   **Main**: Flex-1, scrollable.
-   **Header**: Sticky top, border-bottom (optional, can be merged into Sidebar on desktop).

---

## Interaction Patterns

### The "Upload First" Flow
1.  **Drop**: User drags file anywhere or clicks "New Report".
2.  **Draft**: File appears immediately in a "Drafts" list or opens a "Draft Modal".
3.  **Context**: System asks *only* "Who is this for?" (Person Selector) and "Date?" (Date Picker).
    -   *Future:* AI auto-fills this.
4.  **Save**: Clicking save creates the `LabReport` and confirms the `LabArtifact`.

### Empty States
-   Do not leave blank white space.
-   Use an illustration or a clear "Call to Action" in a dashed border box.
