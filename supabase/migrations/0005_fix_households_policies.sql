create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
      and hm.deleted_at is null
  );
$$;

drop policy if exists "households_member_read" on households;
drop policy if exists "households_owner_access" on households;

create policy "households_member_read"
  on households
  for select
  using (
    deleted_at is null
    and public.is_household_member(households.id)
  );

create policy "households_owner_access"
  on households
  for all
  using (
    deleted_at is null
    and owner_user_id = auth.uid()
  )
  with check (
    owner_user_id = auth.uid()
  );
