drop policy if exists "lab_reports_owner_access" on lab_reports;
drop policy if exists "lab_reports_owner_select" on lab_reports;
drop policy if exists "lab_reports_owner_insert" on lab_reports;
drop policy if exists "lab_reports_owner_update" on lab_reports;
drop policy if exists "lab_reports_owner_delete" on lab_reports;

create policy "lab_reports_owner_select"
  on lab_reports
  for select
  using (
    deleted_at is null
    and public.is_household_owner(lab_reports.household_id)
  );

create policy "lab_reports_owner_insert"
  on lab_reports
  for insert
  with check (
    public.is_household_owner(lab_reports.household_id)
  );

create policy "lab_reports_owner_update"
  on lab_reports
  for update
  using (
    public.is_household_owner(lab_reports.household_id)
  )
  with check (
    public.is_household_owner(lab_reports.household_id)
  );

create policy "lab_reports_owner_delete"
  on lab_reports
  for delete
  using (
    public.is_household_owner(lab_reports.household_id)
  );
