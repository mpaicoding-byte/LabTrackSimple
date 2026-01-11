create extension if not exists "pgcrypto";

create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  name text,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  user_id uuid not null,
  role text not null default 'member',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint household_members_role_check check (role in ('owner','member'))
);

create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  user_id uuid,
  name text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists lab_reports (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  person_id uuid not null references people(id),
  report_date date not null,
  source text,
  status text not null default 'draft',
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint lab_reports_status_check
    check (status in ('draft','review_required','final','extraction_failed'))
);

create table if not exists lab_artifacts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  lab_report_id uuid not null references lab_reports(id),
  object_path text not null,
  kind text not null,
  mime_type text,
  status text not null default 'pending',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint lab_artifacts_status_check
    check (status in ('pending','ready','failed'))
);

create table if not exists lab_results_staging (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  lab_report_id uuid not null references lab_reports(id),
  artifact_id uuid references lab_artifacts(id),
  extraction_run_id uuid not null,
  name_raw text not null,
  value_raw text not null,
  unit_raw text,
  value_num double precision,
  details_raw text,
  status text not null default 'needs_review',
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint lab_results_staging_status_check
    check (status in ('needs_review','approved','rejected'))
);

create table if not exists lab_results (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id),
  lab_report_id uuid not null references lab_reports(id),
  person_id uuid not null references people(id),
  extraction_run_id uuid not null,
  name_raw text not null,
  value_raw text not null,
  unit_raw text,
  value_num double precision,
  details_raw text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists household_members_unique_user
  on household_members (household_id, user_id)
  where deleted_at is null;

create unique index if not exists household_members_single_owner
  on household_members (household_id)
  where role = 'owner' and deleted_at is null;

create unique index if not exists people_unique_user
  on people (household_id, user_id)
  where user_id is not null and deleted_at is null;

create index if not exists lab_results_household_person_name_idx
  on lab_results (household_id, person_id, name_raw);

create index if not exists lab_results_report_idx
  on lab_results (lab_report_id);

create index if not exists lab_results_household_name_idx
  on lab_results (household_id, name_raw);

create index if not exists lab_results_staging_run_idx
  on lab_results_staging (extraction_run_id);

create index if not exists lab_results_staging_report_idx
  on lab_results_staging (lab_report_id);
