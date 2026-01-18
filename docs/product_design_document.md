# Product Design Document (PDD) — Personal Lab Records + Trends (MVP)

## 1. Overview

### 1.1 Purpose
Build a web-first MVP for uploading lab reports, extracting results, reviewing/confirming them, and viewing trends over time. The system prioritizes fast iteration, minimal ops, and human-in-the-loop verification.

### 1.2 Goals
- Upload PDF/image lab reports and securely store artifacts.
- Extract test name/value/unit into structured rows.
- Provide an efficient review + confirmation workflow.
- Display trends and history for numeric and text results.
- Keep the data model minimal: name/value/unit/date/person + one `details_raw` column.
- Support manual test entry during review when extraction misses tests.

### 1.3 Non-Goals (MVP)
- Reference range tables or abnormal flag logic.
- LOINC or deep normalization.
- Unit conversion/standardization.
- No cross-household or public sharing; no email invite flow.
Rationale: keep privacy tight while avoiding onboarding complexity.

## 2. Personas and Use Cases

### 2.1 Primary Persona
- Health-conscious individual tracking their own and family biomarkers over time, frustrated by lab portals that lack exportable, longitudinal views. Comfortable with basic web apps and wants fast entry and review.

### 2.2 Core Use Cases
- Create a person (family member) and add a report.
- Upload lab report PDF/photo and extract results.
- Review and edit extracted rows, then confirm results.
- Add missing tests during review.
- Search tests by name and view trends over time.

## 3. Functional Requirements

### 3.1 People
- Create, list, rename, and soft-delete people.
- Each person belongs to exactly one household.
- Capture date of birth and gender for each person (required).
- Display date of birth and gender on the person card when present and allow edits in the create/rename flows.
- After first login, owners must complete date of birth + gender before accessing the rest of the app.
- Household owner can link a person profile to an existing user account; members can log in and see only their own data (reports/results), while the owner can see all household people and reports.
Rationale: supports family participation without email invites or role UI in MVP.
Note: members see data only after the owner links their account to a person profile.

### 3.2 Reports
- Create report with date and optional source.
- Owners can start a manual report without an upload to add tests manually.
- Add manual tests during review when needed.
- View report status: `draft`, `review_required`, `final`, `extraction_failed`.
- Attach one or more artifacts to a report.
- Optional notes field for report context (e.g., symptoms, fasting status).

### 3.3 Artifacts
- Upload PDF or image files.
- Store artifacts in a private bucket with signed URLs.
- Prevent orphan files via row-first upload flow.
- View or download artifacts during review for verification.
Rationale: verification requires access to the source document.

### 3.4 Extraction
- Trigger extraction on a report.
- Store results in `lab_results` tied to the current extraction run.
- Extraction failure updates report status to `extraction_failed`.
- If extraction returns zero rows, still allow manual entry in review.

### 3.5 Review + Confirm
- Spreadsheet-like review UI with inline editing (owner editable during review; members read-only).
- Final reports are view-only until the owner selects **Edit** to enter draft mode (with Discard draft or Review & confirm).
- Add manual rows via "Add test" even when an artifact exists.
- "Review & confirm" persists edits and new rows, then finalizes the report.
- Allow manual entry even when extraction fails or no artifact exists.
- Re-extraction creates a new run; previous final results are marked inactive on confirm.
- Unconfirmed re-extraction runs do not affect existing final results.
Rationale: prevents partial re-extractions from overwriting trusted data.

### 3.6 Trends and Search
- Search by test name (case-insensitive match on `name_raw`).
- Numeric trend chart uses `value_num` only.
- Text results appear in a timeline/list.
- Always display `value_raw`, `unit_raw`, and expandable `details_raw`.
- Mixed numeric/text values for the same `name_raw` should display numeric points and a timeline of text results, with a prompt to normalize/edit when needed.
Rationale: mixed values are common in raw extraction and require user guidance until normalization exists.

### 3.7 Security
- Row Level Security (RLS) on all tables by household membership and role.
- Signed URL access to private storage artifacts.

## 4. Data and Content Requirements

### 4.1 Required Fields per Result
- `name_raw`, `value_raw`, `unit_raw` (nullable), `details_raw` (nullable), `report_date`, `person_id`.
  - `person_id` is inherited from the parent report.

### 4.2 Data Retention
- Soft-delete rows instead of hard deletes.
Note: if a parent record is soft-deleted, its child data should be hidden in the UI.

## 5. UX Requirements

### 5.1 Extraction Review Screen
- Always-editable grid for owners during review; members view-only.
- Final reports require an explicit **Edit** action to enter draft mode.
- "Add test" inserts a new manual row in the grid.
- Preview document button (opens the signed artifact URL).
- For uploaded reports, show guidance to add missing tests from the document during review.
- Flag ambiguous extractions (e.g., mixed types, unparsable numeric) with a prompt to edit or keep raw.

### 5.2 Trend View
- Search bar for `name_raw`.
- Chart for numeric results; list for non-numeric.
- Ability to filter by person.

### 5.3 Household Management
- Link a person profile to an existing user account (manual link).
Rationale: enables family participation without email invites.
Note: members cannot create or claim person profiles in MVP.
Note: members have read-only access in MVP; the owner manages reports and results.
Note: a household is created on signup, with the user as owner.

## 6. Quality Requirements

### 6.1 Reliability
- Extraction failures should not block manual entry.

### 6.2 Performance
- Trend view should load in under 2s for typical single-user datasets.

### 6.3 Privacy and Security
- All access limited to authenticated users within their household, scoped by role, via RLS.

## 7. Analytics and Telemetry (MVP)
- Minimal logging for extraction runs: success/failure and duration.

## 8. MVP Acceptance Criteria
- Create household (auto on signup) → create person → create report → upload artifact → extract → review → confirm.
- Add missing tests during review → confirm.
- Search test name → see numeric trend across dates.
- Text-only results appear in history.
- Person date of birth saves and displays when provided.
- RLS + private storage enforced.
- Link a member account to a person; member can log in and see only their own data.
- Re-extraction creates a new run and preserves data integrity.

## 9. Future Enhancements (Phase 2)
- Reference range tables and abnormal flags.
- Biomarker dictionary/alias matching.
- Unit standardization.
- Email invites, invite status UI, and richer household roles.
- Cross-household sharing and broader collaboration.
