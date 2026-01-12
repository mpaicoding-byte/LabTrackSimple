export type Household = {
  id: string;
  owner_user_id: string;
  name: string | null;
  deleted_at: string | null;
  created_at: string;
};

export type HouseholdRole = "owner" | "member";

export type HouseholdMember = {
  id: string;
  household_id: string;
  user_id: string;
  role: HouseholdRole;
  deleted_at: string | null;
  created_at: string;
};

export type Person = {
  id: string;
  household_id: string;
  user_id: string | null;
  name: string;
  date_of_birth: string | null;
  gender: "female" | "male" | null;
  deleted_at: string | null;
  created_at: string;
};

export type LabReportStatus =
  | "draft"
  | "review_required"
  | "final"
  | "extraction_failed";

export type LabReport = {
  id: string;
  household_id: string;
  person_id: string;
  report_date: string;
  source: string | null;
  status: LabReportStatus;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
};

export type LabArtifactStatus = "pending" | "ready" | "failed";
export type LabArtifactKind = "pdf" | "image";

export type LabArtifact = {
  id: string;
  household_id: string;
  lab_report_id: string;
  object_path: string;
  kind: LabArtifactKind;
  mime_type: string | null;
  status: LabArtifactStatus;
  deleted_at: string | null;
  created_at: string;
};

export type LabResultStagingStatus = "needs_review" | "approved" | "rejected";

export type LabResultStaging = {
  id: string;
  lab_report_id: string;
  artifact_id: string | null;
  extraction_run_id: string;
  name_raw: string;
  value_raw: string;
  unit_raw: string | null;
  value_num: number | null;
  details_raw: string | null;
  status: LabResultStagingStatus;
  created_at: string;
  deleted_at: string | null;
};

export type LabResult = {
  id: string;
  lab_report_id: string;
  person_id: string;
  extraction_run_id: string;
  name_raw: string;
  value_raw: string;
  unit_raw: string | null;
  value_num: number | null;
  details_raw: string | null;
  created_at: string;
  deleted_at: string | null;
};
