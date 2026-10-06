-- Optional, run once: puts body_part_other straight after body_part in the existing tables
-- (7-other-body-parts.sql added it at the end). Only changes the column order you see in
-- Supabase; the website and CSV imports work either way.
--
-- Postgres can't move a column, so this rebuilds the exercises table: copy everything into
-- a new table in the right order, swap it in, and restore the security rule and the link
-- from saved lists. Exercise ids are kept, so saved lists still point to the right ones.
-- It all runs as one step: if anything fails, nothing is changed.
--
-- To be extra safe, first download a copy: Table Editor > exercises > Export > Export to CSV.

begin;

create table public.exercises_new (
  id           bigint generated always as identity primary key,
  number       integer unique,
  name         text,
  region       region_t[]        not null default '{}',
  body_part    body_part_t[]     not null default '{}',  -- main body parts
  body_part_other body_part_t[]  not null default '{}',  -- also involved
  type         exercise_type_t[] not null default '{}',
  equipment    text[]            not null default '{}' check (equipment_ok(equipment)),
  area         area_t[]          not null default '{}',
  source       text,
  comment      text,
  instructions text,
  image_url    text,
  position     position_t[]      not null default '{}',
  created_at   timestamptz not null default now()
);

insert into public.exercises_new
  (id, number, name, region, body_part, body_part_other, type, equipment, area,
   source, comment, instructions, image_url, position, created_at)
overriding system value
select id, number, name, region, body_part, body_part_other, type, equipment, area,
       source, comment, instructions, image_url, position, created_at
from public.exercises;

-- Saved lists point at exercises: unhook them, swap the tables, hook them up again.
alter table public.list_items drop constraint if exists list_items_exercise_id_fkey;
drop table public.exercises;
alter table public.exercises_new rename to exercises;
alter table public.exercises rename constraint exercises_new_pkey to exercises_pkey;
alter table public.exercises rename constraint exercises_new_number_key to exercises_number_key;
alter table public.list_items add constraint list_items_exercise_id_fkey
  foreign key (exercise_id) references public.exercises on delete cascade;

-- New exercises continue numbering their ids after the highest existing one.
select setval(pg_get_serial_sequence('public.exercises', 'id'),
              coalesce((select max(id) from public.exercises), 0) + 1, false);

alter table public.exercises enable row level security;
create policy "Public can read exercises"
  on public.exercises for select to anon, authenticated using (true);

-- The import table is normally empty, so it can simply be made again.
drop table public.exercises_import;
create table public.exercises_import (
  number text, name text, region text, body_part text, body_part_other text, type text,
  equipment text, area text, source text, comment text,
  instructions text, image_url text, position text
);
alter table public.exercises_import enable row level security;

commit;
