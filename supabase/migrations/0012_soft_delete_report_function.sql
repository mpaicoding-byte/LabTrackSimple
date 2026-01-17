create or replace function public.soft_delete_report(target_report_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_household_id uuid;
  updated_count integer := 0;
begin
  select household_id
    into target_household_id
    from lab_reports
    where id = target_report_id;

  if target_household_id is null then
    raise exception 'report not found';
  end if;

  if not public.is_household_owner(target_household_id) then
    raise exception 'not authorized';
  end if;

  update lab_reports
    set deleted_at = now()
    where id = target_report_id
      and deleted_at is null;

  get diagnostics updated_count = row_count;
  return updated_count > 0;
end;
$$;

revoke execute on function public.soft_delete_report(uuid) from public;
grant execute on function public.soft_delete_report(uuid) to authenticated;
