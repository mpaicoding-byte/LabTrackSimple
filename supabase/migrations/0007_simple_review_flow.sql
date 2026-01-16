create table if not exists extraction_runs (
  id uuid primary key default gen_random_uuid(),
  lab_report_id uuid not null references lab_reports(id),
  status text not null default 'running',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error text,
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint extraction_runs_status_check
    check (status in ('running','ready','failed','confirmed','rejected'))
);

alter table lab_reports
  add column if not exists current_extraction_run_id uuid references extraction_runs(id),
  add column if not exists final_extraction_run_id uuid references extraction_runs(id),
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmed_by uuid;

alter table lab_results
  add column if not exists is_final boolean not null default false,
  add column if not exists is_active boolean not null default false,
  add column if not exists edited_at timestamptz,
  add column if not exists edited_by uuid;

create index if not exists extraction_runs_report_idx
  on extraction_runs (lab_report_id);

create index if not exists lab_results_report_run_idx
  on lab_results (lab_report_id, extraction_run_id);

update lab_results
  set is_final = true,
      is_active = true
  where is_final = false
    and is_active = false;

insert into extraction_runs (id, lab_report_id, status, started_at, completed_at)
select
  lr.extraction_run_id,
  lr.lab_report_id,
  case when rep.status = 'final' then 'confirmed' else 'ready' end,
  min(lr.created_at),
  case when rep.status = 'final' then max(lr.created_at) else null end
from lab_results lr
join lab_reports rep on rep.id = lr.lab_report_id
where lr.extraction_run_id is not null
group by lr.extraction_run_id, lr.lab_report_id, rep.status
on conflict (id) do nothing;

insert into extraction_runs (id, lab_report_id, status, started_at)
select
  lrs.extraction_run_id,
  lrs.lab_report_id,
  case when rep.status = 'final' then 'confirmed' else 'ready' end,
  min(lrs.created_at)
from lab_results_staging lrs
join lab_reports rep on rep.id = lrs.lab_report_id
where lrs.extraction_run_id is not null
group by lrs.extraction_run_id, lrs.lab_report_id, rep.status
on conflict (id) do nothing;

insert into lab_results (
  lab_report_id,
  person_id,
  extraction_run_id,
  name_raw,
  value_raw,
  unit_raw,
  value_num,
  details_raw,
  created_at,
  deleted_at,
  is_final,
  is_active
)
select
  lrs.lab_report_id,
  lr.person_id,
  lrs.extraction_run_id,
  lrs.name_raw,
  lrs.value_raw,
  lrs.unit_raw,
  lrs.value_num,
  lrs.details_raw,
  lrs.created_at,
  lrs.deleted_at,
  false,
  false
from lab_results_staging lrs
join lab_reports lr on lr.id = lrs.lab_report_id
left join lab_results existing
  on existing.lab_report_id = lrs.lab_report_id
  and existing.extraction_run_id = lrs.extraction_run_id
  and existing.name_raw = lrs.name_raw
  and existing.value_raw = lrs.value_raw
  and existing.created_at = lrs.created_at
where existing.id is null;

with latest_run as (
  select distinct on (lab_report_id)
    lab_report_id,
    extraction_run_id
  from lab_results
  order by lab_report_id, created_at desc
)
update lab_reports lr
  set current_extraction_run_id = latest_run.extraction_run_id
from latest_run
where lr.id = latest_run.lab_report_id
  and lr.current_extraction_run_id is null;

with latest_final as (
  select distinct on (lr.lab_report_id)
    lr.lab_report_id,
    lr.extraction_run_id
  from lab_results lr
  join lab_reports rep on rep.id = lr.lab_report_id
  where rep.status = 'final'
  order by lr.lab_report_id, lr.created_at desc
)
update lab_reports rep
  set final_extraction_run_id = latest_final.extraction_run_id,
      confirmed_at = coalesce(rep.confirmed_at, now())
from latest_final
where rep.id = latest_final.lab_report_id
  and rep.final_extraction_run_id is null;

update extraction_runs run
  set status = 'confirmed',
      completed_at = coalesce(run.completed_at, now())
from lab_reports rep
where rep.final_extraction_run_id = run.id;

update extraction_runs run
  set status = 'ready'
from lab_reports rep
where rep.current_extraction_run_id = run.id
  and rep.status = 'review_required'
  and run.status = 'running';

update lab_results lr
  set is_final = true,
      is_active = true
from lab_reports rep
where rep.status = 'final'
  and rep.final_extraction_run_id = lr.extraction_run_id
  and rep.id = lr.lab_report_id;

update lab_results lr
  set is_active = true
from lab_reports rep
where rep.status <> 'final'
  and rep.current_extraction_run_id = lr.extraction_run_id
  and rep.id = lr.lab_report_id;

update lab_results lr
  set is_active = false
from lab_reports rep
where rep.status <> 'final'
  and rep.id = lr.lab_report_id
  and rep.current_extraction_run_id is distinct from lr.extraction_run_id;

alter table extraction_runs enable row level security;

drop policy if exists "extraction_runs_member_read" on extraction_runs;
drop policy if exists "extraction_runs_owner_access" on extraction_runs;

create policy "extraction_runs_member_read"
  on extraction_runs
  for select
  using (
    exists (
      select 1
      from lab_reports lr
      join people p on p.id = lr.person_id
      join household_members hm on hm.household_id = p.household_id
      where lr.id = extraction_runs.lab_report_id
        and lr.deleted_at is null
        and p.user_id = auth.uid()
        and p.deleted_at is null
        and hm.user_id = auth.uid()
        and hm.role = 'member'
        and hm.deleted_at is null
    )
  );

create policy "extraction_runs_owner_access"
  on extraction_runs
  for all
  using (
    exists (
      select 1
      from lab_reports lr
      join people p on p.id = lr.person_id
      join household_members hm on hm.household_id = p.household_id
      where lr.id = extraction_runs.lab_report_id
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
      where lr.id = extraction_runs.lab_report_id
        and lr.deleted_at is null
        and p.deleted_at is null
        and hm.user_id = auth.uid()
        and hm.role = 'owner'
        and hm.deleted_at is null
    )
  );
