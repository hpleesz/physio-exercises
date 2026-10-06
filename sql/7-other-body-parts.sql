-- Run once on the existing database: adds "other body parts" (also involved, but not the main
-- focus). Existing body parts stay as the main ones.
alter table exercises add column body_part_other body_part_t[] not null default '{}';
alter table exercises_import add column body_part_other text;
