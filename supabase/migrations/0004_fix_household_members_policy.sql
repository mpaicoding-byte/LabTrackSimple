drop policy if exists "household_members_owner_access" on household_members;

create policy "household_members_owner_access"
  on household_members
  for all
  using (
    deleted_at is null
    and exists (
      select 1
      from households h
      where h.id = household_members.household_id
        and h.owner_user_id = auth.uid()
        and h.deleted_at is null
    )
  )
  with check (
    exists (
      select 1
      from households h
      where h.id = household_members.household_id
        and h.owner_user_id = auth.uid()
        and h.deleted_at is null
    )
  );
