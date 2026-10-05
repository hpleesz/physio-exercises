-- After importing a CSV into exercises_import: lists any value not in your lists.
-- No rows = everything is valid.
select number, 'region' col, v from exercises_import, unnest(to_list(region)) v
  where v <> all(enum_range(null::region_t)::text[])
union all select number, 'body_part', v from exercises_import, unnest(to_list(body_part)) v
  where v <> all(enum_range(null::body_part_t)::text[])
union all select number, 'type', v from exercises_import, unnest(to_list(type)) v
  where v <> all(enum_range(null::exercise_type_t)::text[])
union all select number, 'equipment', v from exercises_import, unnest(to_list(equipment)) v
  where v <> all(enum_range(null::equipment_t)::text[])
union all select number, 'area', v from exercises_import, unnest(to_list(area)) v
  where v <> all(enum_range(null::area_t)::text[]);
