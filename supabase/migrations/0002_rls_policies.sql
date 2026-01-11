alter table households enable row level security;
alter table household_members enable row level security;
alter table people enable row level security;
alter table lab_reports enable row level security;
alter table lab_artifacts enable row level security;
alter table lab_results_staging enable row level security;
alter table lab_results enable row level security;

create policy "households_member_read"
  on households
  for select
  using (
    deleted_at is null
    and exists (
      select 1
      from household_members hm
      where hm.household_id = households.id
        and hm.user_id = auth.uid()
        and hm.role = 'member'
        and hm.deleted_at is null
    )
  );

create policy "households_owner_access"
  on households
  for all
  using (
    deleted_at is null
    and exists (
      select 1
      from household_members hm
      where hm.household_id = households.id
        and hm.user_id = auth.uid()
        and hm.role = 'owner'
        and hm.deleted_at is null
    )
  )
  with check (
    owner_user_id = auth.uid()
  );

create policy "household_members_member_read"
  on household_members
  for select
  using (
    deleted_at is null
    and user_id = auth.uid()
  );

create policy "household_members_owner_access"
  on household_members
  for all
  using (
    deleted_at is null
    and exists (
      select 1
      from household_members hm
      where hm.household_id = household_members.household_id
        and hm.user_id = auth.uid()
        and hm.role = 'owner'
        and hm.deleted_at is null
    )
  )
  with check (
    exists (
      select 1
      from household_members hm
      where hm.household_id = household_members.household_id
        and hm.user_id = auth.uid()
        and hm.role = 'owner'
        and hm.deleted_at is null
    )
    or exists (
      select 1
      from households h
      where h.id = household_members.household_id
        and h.owner_user_id = auth.uid()
        and h.deleted_at is null
    )
  );

create policy "people_member_read"
  on people
  for select
  using (
    deleted_at is null
    and user_id = auth.uid()
    and exists (
      select 1
      from household_members hm
      where hm.household_id = people.household_id
        and hm.user_id = auth.uid()
        and hm.role = 'member'
        and hm.deleted_at is null
    )
  );

create policy "people_owner_access"
  on people
  for all
  using (
    deleted_at is null
    and exists (
      select 1
      from household_members hm
      where hm.household_id = people.household_id
        and hm.user_id = auth.uid()
        and hm.role = 'owner'
        and hm.deleted_at is null
    )
  )
  with check (
    exists (
      select 1
      from household_members hm
      where hm.household_id = people.household_id
        and hm.user_id = auth.uid()
        and hm.role = 'owner'
        and hm.deleted_at is null
    )
  );

create policy "lab_reports_member_read"
  on lab_reports
  for select
  using (
    deleted_at is null
    and exists (
      select 1
      from household_members hm
      where hm.household_id = lab_reports.household_id
        and hm.user_id = auth.uid()
        and hm.role = 'member'
        and hm.deleted_at is null
    )
    and exists (
      select 1
      from people p
      where p.id = lab_reports.person_id
        and p.user_id = auth.uid()
        and p.deleted_at is null
    )
  );

create policy "lab_reports_owner_access"
  on lab_reports
  for all
  using (
    deleted_at is null
    and exists (
      select 1
      from household_members hm
      where hm.household_id = lab_reports.household_id
        and hm.user_id = auth.uid()
        and hm.role = 'owner'
        and hm.deleted_at is null
    )
  )
  with check (
    exists (
      select 1
      from household_members hm
      where hm.household_id = lab_reports.household_id
        and hm.user_id = auth.uid()
        and hm.role = 'owner'
        and hm.deleted_at is null
    )
  );

create policy "lab_artifacts_member_read"
  on lab_artifacts
  for select
  using (
    deleted_at is null
    and exists (
      select 1
      from household_members hm
      where hm.household_id = lab_artifacts.household_id
        and hm.user_id = auth.uid()
        and hm.role = 'member'
        and hm.deleted_at is null
    )
    and exists (
      select 1
      from lab_reports lr
      join people p on p.id = lr.person_id
      where lr.id = lab_artifacts.lab_report_id
        and lr.household_id = lab_artifacts.household_id
        and lr.deleted_at is null
        and p.user_id = auth.uid()
        and p.deleted_at is null
    )
  );

create policy "lab_artifacts_owner_access"
  on lab_artifacts
  for all
  using (
    deleted_at is null
    and exists (
      select 1
      from household_members hm
      where hm.household_id = lab_artifacts.household_id
        and hm.user_id = auth.uid()
        and hm.role = 'owner'
        and hm.deleted_at is null
    )
  )
  with check (
    exists (
      select 1
      from household_members hm
      where hm.household_id = lab_artifacts.household_id
        and hm.user_id = auth.uid()
        and hm.role = 'owner'
        and hm.deleted_at is null
    )
  );

create policy "lab_results_staging_member_read"
  on lab_results_staging
  for select
  using (
    deleted_at is null
    and exists (
      select 1
      from household_members hm
      where hm.household_id = lab_results_staging.household_id
        and hm.user_id = auth.uid()
        and hm.role = 'member'
        and hm.deleted_at is null
    )
    and exists (
      select 1
      from lab_reports lr
      join people p on p.id = lr.person_id
      where lr.id = lab_results_staging.lab_report_id
        and lr.household_id = lab_results_staging.household_id
        and lr.deleted_at is null
        and p.user_id = auth.uid()
        and p.deleted_at is null
    )
  );

create policy "lab_results_staging_owner_access"
  on lab_results_staging
  for all
  using (
    deleted_at is null
    and exists (
      select 1
      from household_members hm
      where hm.household_id = lab_results_staging.household_id
        and hm.user_id = auth.uid()
        and hm.role = 'owner'
        and hm.deleted_at is null
    )
  )
  with check (
    exists (
      select 1
      from household_members hm
      where hm.household_id = lab_results_staging.household_id
        and hm.user_id = auth.uid()
        and hm.role = 'owner'
        and hm.deleted_at is null
    )
  );

create policy "lab_results_member_read"
  on lab_results
  for select
  using (
    deleted_at is null
    and exists (
      select 1
      from household_members hm
      where hm.household_id = lab_results.household_id
        and hm.user_id = auth.uid()
        and hm.role = 'member'
        and hm.deleted_at is null
    )
    and exists (
      select 1
      from people p
      where p.id = lab_results.person_id
        and p.user_id = auth.uid()
        and p.deleted_at is null
    )
  );

create policy "lab_results_owner_access"
  on lab_results
  for all
  using (
    deleted_at is null
    and exists (
      select 1
      from household_members hm
      where hm.household_id = lab_results.household_id
        and hm.user_id = auth.uid()
        and hm.role = 'owner'
        and hm.deleted_at is null
    )
  )
  with check (
    exists (
      select 1
      from household_members hm
      where hm.household_id = lab_results.household_id
        and hm.user_id = auth.uid()
        and hm.role = 'owner'
        and hm.deleted_at is null
    )
  );
