insert into storage.buckets (id, name, public)
values ('lab-artifacts', 'lab-artifacts', false)
on conflict (id) do nothing;

do $$
begin
  begin
    alter table storage.objects enable row level security;
  exception
    when insufficient_privilege then
      raise notice 'Skipping RLS enable on storage.objects (not owner).';
  end;
end $$;

create policy "lab_artifacts_owner_upload"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'lab-artifacts'
    and exists (
      select 1
      from public.lab_artifacts la
      join public.lab_reports lr on lr.id = la.lab_report_id
      join public.household_members hm on hm.household_id = la.household_id
      where la.object_path = name
        and la.deleted_at is null
        and lr.deleted_at is null
        and hm.user_id = auth.uid()
        and hm.role = 'owner'
        and hm.deleted_at is null
    )
  );

create policy "lab_artifacts_owner_read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'lab-artifacts'
    and exists (
      select 1
      from public.lab_artifacts la
      join public.lab_reports lr on lr.id = la.lab_report_id
      join public.household_members hm on hm.household_id = la.household_id
      where la.object_path = name
        and la.deleted_at is null
        and lr.deleted_at is null
        and hm.user_id = auth.uid()
        and hm.role = 'owner'
        and hm.deleted_at is null
    )
  );

create policy "lab_artifacts_member_read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'lab-artifacts'
    and exists (
      select 1
      from public.lab_artifacts la
      join public.lab_reports lr on lr.id = la.lab_report_id
      join public.people p on p.id = lr.person_id
      join public.household_members hm on hm.household_id = la.household_id
      where la.object_path = name
        and la.deleted_at is null
        and lr.deleted_at is null
        and p.deleted_at is null
        and hm.user_id = auth.uid()
        and hm.role = 'member'
        and hm.deleted_at is null
        and p.user_id = auth.uid()
    )
  );
