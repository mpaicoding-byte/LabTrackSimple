# Reports + Artifacts Spec

## Problem
Owners need a reliable way to capture a lab report, attach artifacts, and view files privately without exposing them publicly.

## Goals
- Create lab reports with person, report date, source, and notes.
- Upload artifacts via a row-first flow and track status (`pending`, `ready`, `failed`).
- Store artifacts in a private bucket with signed URL viewing.
- Enforce household and role-based access to artifacts and storage.

## Non-Goals
- Extraction runs, staging, or commit workflows.
- Review grid editing or approval flows.

## Flow
1. Owner drops a file to start the flow.
2. Show minimal context form (person, date, optional source/notes).
3. On save:
   - Create the report.
   - Generate artifact UUID client-side.
   - Insert `lab_artifacts` row with `pending` status and `object_path`.
   - Upload file to storage path.
   - Update status to `ready` on success or `failed` on error.
4. User clicks "View" to request a signed URL and open the artifact.

## Data + Storage
- Bucket: `lab-artifacts` (private).
- Object path: `{household_id}/{report_id}/{artifact_id}.{ext}`.
- `lab_artifacts` fields used: `id`, `household_id`, `lab_report_id`, `object_path`, `kind`, `mime_type`, `status`.

## UX Notes
- Report form shows validation state and success/error messages.
- Artifact list shows status badges and signed URL view action.
- Members can view artifacts tied to their person via signed URLs.

## Validation
- Report requires person + report date.
- Upload requires owner role and supported file type (PDF or image).
- Signed URL requests only for `ready` artifacts.

## Edge Cases
- Upload failure: set `lab_artifacts.status = failed` and surface error.
- Missing membership/role: show "owners only" callout, disable actions.
- Unsupported MIME type: block upload with explicit error.
