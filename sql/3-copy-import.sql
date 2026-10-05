-- Copies exercises_import into exercises (updating existing numbers), then empties it.
insert into exercises (number, name, region, body_part, type, equipment, area,
                       source, comment, instructions, image_url)
select number::int,
       nullif(name, ''),
       to_list(region)::region_t[],
       to_list(body_part)::body_part_t[],
       to_list(type)::exercise_type_t[],
       to_list(equipment)::equipment_t[],
       to_list(area)::area_t[],
       nullif(source, ''), nullif(comment, ''),
       nullif(instructions, ''), nullif(image_url, '')
from exercises_import
on conflict (number) do update set
  name = excluded.name, region = excluded.region, body_part = excluded.body_part,
  type = excluded.type, equipment = excluded.equipment, area = excluded.area,
  source = excluded.source, comment = excluded.comment,
  instructions = excluded.instructions,
  image_url = coalesce(excluded.image_url, exercises.image_url);

truncate exercises_import;
