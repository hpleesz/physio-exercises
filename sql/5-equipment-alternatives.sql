-- Run once on the existing database: lets equipment hold alternatives.
--   "Mat/Bed, Exercise ball" = (a mat or a bed) and an exercise ball.
-- Existing exercises keep their equipment exactly as it is.

-- Equipment is a list of needs. A need is one item ("Chair") or alternatives ("Mat/Bed").
-- True if every item named is in equipment_t.
create or replace function equipment_ok(e text[]) returns boolean
language sql stable as $$
  select coalesce(bool_and(trim(p) = any(enum_range(null::equipment_t)::text[])), true)
  from unnest(e) x, unnest(string_to_array(x, '/')) p
$$;

alter table exercises alter column equipment drop default;
alter table exercises alter column equipment type text[] using equipment::text[];
alter table exercises alter column equipment set default '{}';
alter table exercises add constraint equipment_valid check (equipment_ok(equipment));
