-- Creates the database from scratch.
-- WARNING: deletes the existing exercises table and all its data. Only run on a fresh project.

drop table if exists public.exercises, public.exercises_import;
drop type if exists region_t, body_part_t, exercise_type_t, equipment_t, area_t;

create type region_t as enum ('Upper body', 'Lower body', 'Torso');

create type body_part_t as enum (
  'Neck', 'Shoulder', 'Elbow', 'Wrist', 'Hand',
  'Upper back', 'Lower back', 'Chest', 'Abdomen',
  'Hip', 'Knee', 'Ankle', 'Foot'
);

create type exercise_type_t as enum ('Strength', 'Stretch', 'Mobility', 'Balance');

create type equipment_t as enum (
  'None', 'Small ball', 'Exercise ball', 'Egg ball', 'Resistance band',
  'Mini band', 'Dumbbell', 'Ankle weight', 'Chair', 'Foam roller', 'Foam bar',
  'Yoga block', 'Wooden stick', 'Wand', 'Step', 'Dynair', 'Bosu',
  'Balance pad', 'Stress ball'
);

create type area_t as enum (
  'Cardiology', 'Rheumatology', 'Orthopaedics', 'Neurology',
  'Pulmonology', 'Geriatrics', 'Sports'
);

create table public.exercises (
  id           bigint generated always as identity primary key,
  number       integer unique,
  name         text,
  region       region_t[]        not null default '{}',
  body_part    body_part_t[]     not null default '{}',
  type         exercise_type_t[] not null default '{}',
  equipment    equipment_t[]     not null default '{}',
  area         area_t[]          not null default '{}',
  source       text,
  comment      text,
  instructions text,
  image_url    text,
  created_at   timestamptz not null default now()
);

alter table public.exercises enable row level security;
create policy "Public can read exercises"
  on public.exercises for select to anon, authenticated using (true);

-- Plain-text table that CSV files are imported into (hidden from the website)
create table public.exercises_import (
  number text, name text, region text, body_part text, type text,
  equipment text, area text, source text, comment text,
  instructions text, image_url text
);
alter table public.exercises_import enable row level security;

-- Turns "Hip, Knee" or "{Hip,Knee}" into a proper list
create or replace function to_list(v text) returns text[]
language sql immutable as $$
  select coalesce(
    array_agg(trim(both ' "' from x)) filter (where trim(both ' "' from x) <> ''),
    '{}')
  from unnest(string_to_array(trim(both '{}' from coalesce(v, '')), ',')) x
$$;
