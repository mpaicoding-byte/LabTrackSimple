# Reports + Artifacts User Stories + Acceptance Criteria

## User Stories
1. As a household owner, I can create a lab report with person, date, source, and notes.
2. As a household owner, I can upload PDF/image artifacts to a report and see status updates.
3. As a household member, I can view artifacts tied to my person via signed URLs.

## Acceptance Criteria
- Report creation
  - Given I am an owner, when I select a person and report date, I can submit the form.
  - The created report stores `person_id`, `report_date`, `source`, and `notes`.
- Artifact upload
  - Given I am an owner and a report is selected, when I upload a PDF or image, a `lab_artifacts` row is created first.
  - The row starts as `pending` and transitions to `ready` after upload.
  - On upload failure, the row transitions to `failed` and the error is shown.
- Signed URL viewing
  - Given a `ready` artifact, when I click View, a signed URL is generated and opened.
- Access control
  - Members cannot create reports or upload artifacts.
  - Members can request signed URLs only for artifacts tied to their person.
