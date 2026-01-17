create or replace function public.is_household_owner(target_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from households h
    where h.id = target_household_id
      and h.owner_user_id = auth.uid()
      and h.deleted_at is null
  );
$$;

drop policy if exists "lab_reports_owner_access" on lab_reports;

create policy "lab_reports_owner_access"
  on lab_reports
  for all
  using (
    deleted_at is null
    and public.is_household_owner(lab_reports.household_id)
  )
  with check (
    public.is_household_owner(lab_reports.household_id)
  );

drop policy if exists "lab_results_member_read" on lab_results;
drop policy if exists "lab_results_owner_access" on lab_results;

create policy "lab_results_member_read"
  on lab_results
  for select
  using (
    deleted_at is null
    and exists (
      select 1
      from people p
      join household_members hm on hm.household_id = p.household_id
      where p.id = lab_results.person_id
        and p.user_id = auth.uid()
        and p.deleted_at is null
        and hm.user_id = auth.uid()
        and hm.role = 'member'
        and hm.deleted_at is null
    )
    and exists (
      select 1
      from lab_reports lr
      where lr.id = lab_results.lab_report_id
        and lr.deleted_at is null
    )
  );

create policy "lab_results_owner_access"
  on lab_results
  for all
  using (
    deleted_at is null
    and exists (
      select 1
      from people p
      join household_members hm on hm.household_id = p.household_id
      where p.id = lab_results.person_id
        and p.deleted_at is null
        and hm.user_id = auth.uid()
        and hm.role = 'owner'
        and hm.deleted_at is null
    )
    and exists (
      select 1
      from lab_reports lr
      where lr.id = lab_results.lab_report_id
        and lr.deleted_at is null
    )
  )
  with check (
    exists (
      select 1
      from people p
      join household_members hm on hm.household_id = p.household_id
      where p.id = lab_results.person_id
        and p.deleted_at is null
        and hm.user_id = auth.uid()
        and hm.role = 'owner'
        and hm.deleted_at is null
    )
    and exists (
      select 1
      from lab_reports lr
      where lr.id = lab_results.lab_report_id
        and lr.deleted_at is null
    )
  );
