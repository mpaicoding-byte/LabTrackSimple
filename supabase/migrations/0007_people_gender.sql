alter table people
  add column if not exists gender text;

alter table people
  drop constraint if exists people_gender_check;

alter table people
  add constraint people_gender_check
  check (gender in ('female', 'male') or gender is null);
