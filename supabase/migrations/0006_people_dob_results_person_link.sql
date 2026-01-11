alter table people
  add column if not exists date_of_birth date;

drop policy if exists "lab_results_staging_member_read" on lab_results_staging;
drop policy if exists "lab_results_staging_owner_access" on lab_results_staging;
drop policy if exists "lab_results_member_read" on lab_results;
drop policy if exists "lab_results_owner_access" on lab_results;

drop index if exists lab_results_household_person_name_idx;
drop index if exists lab_results_household_name_idx;

alter table lab_results
  drop column if exists household_id;

alter table lab_results_staging
  drop column if exists household_id;

create index if not exists lab_results_person_name_idx
  on lab_results (person_id, name_raw);

create index if not exists lab_results_name_idx
  on lab_results (name_raw);

create policy "lab_results_staging_member_read"
  on lab_results_staging
  for select
  using (
    deleted_at is null
    and exists (
      select 1
      from lab_reports lr
      join people p on p.id = lr.person_id
      join household_members hm on hm.household_id = p.household_id
      where lr.id = lab_results_staging.lab_report_id
        and lr.deleted_at is null
        and p.user_id = auth.uid()
        and p.deleted_at is null
        and hm.user_id = auth.uid()
        and hm.role = 'member'
        and hm.deleted_at is null
    )
  );

create policy "lab_results_staging_owner_access"
  on lab_results_staging
  for all
  using (
    deleted_at is null
    and exists (
      select 1
      from lab_reports lr
      join people p on p.id = lr.person_id
      join household_members hm on hm.household_id = p.household_id
      where lr.id = lab_results_staging.lab_report_id
        and lr.deleted_at is null
        and p.deleted_at is null
        and hm.user_id = auth.uid()
        and hm.role = 'owner'
        and hm.deleted_at is null
    )
  )
  with check (
    exists (
      select 1
      from lab_reports lr
      join people p on p.id = lr.person_id
      join household_members hm on hm.household_id = p.household_id
      where lr.id = lab_results_staging.lab_report_id
        and lr.deleted_at is null
        and p.deleted_at is null
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
      from people p
      join household_members hm on hm.household_id = p.household_id
      where p.id = lab_results.person_id
        and p.user_id = auth.uid()
        and p.deleted_at is null
        and hm.user_id = auth.uid()
        and hm.role = 'member'
        and hm.deleted_at is null
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
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
  household_label text;
  owner_name text;
begin
  household_label := nullif(trim(coalesce(new.raw_user_meta_data->>'household_name', '')), '');
  owner_name := nullif(
    trim(coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))),
    ''
  );

  if owner_name is null then
    owner_name := 'Owner';
  end if;

  insert into public.households (owner_user_id, name)
  values (new.id, household_label)
  returning id into new_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (new_household_id, new.id, 'owner');

  insert into public.people (household_id, user_id, name)
  values (new_household_id, new.id, owner_name);

  return new;
end;
$$;
