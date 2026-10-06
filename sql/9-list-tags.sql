-- Run once (after 6-saved-lists.sql): adds a description and tags to saved lists.
-- Both are private: only you see them. People with a list's link still only see its name and
-- exercises, because get_list() is unchanged.

alter table public.lists add column if not exists description text;
alter table public.lists add column if not exists tags text[] not null default '{}';

-- save_list() now also takes the description and tags.
drop function if exists public.save_list(uuid, text, jsonb);

create or replace function public.save_list(
  list_id uuid, list_name text, items jsonb,
  list_description text default null, list_tags text[] default '{}'
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_id uuid := save_list.list_id;
  v_tags text[] := coalesce(
    (select array_agg(distinct trim(t)) from unnest(list_tags) t where trim(t) <> ''), '{}');
begin
  if v_id is null then
    insert into lists (name, description, tags)
    values (list_name, nullif(trim(list_description), ''), v_tags)
    returning id into v_id;
  else
    update lists
    set name = list_name, description = nullif(trim(list_description), ''), tags = v_tags,
        updated_at = now()
    where id = v_id;
    if not found then
      raise exception 'List not found';
    end if;
  end if;

  delete from list_items where list_items.list_id = v_id;
  insert into list_items (list_id, exercise_id, position, comment)
  select v_id, (x ->> 'exercise_id')::bigint, n, nullif(trim(x ->> 'comment'), '')
  from jsonb_array_elements(items) with ordinality as t(x, n);

  return v_id;
end
$$;
revoke execute on function public.save_list(uuid, text, jsonb, text, text[]) from public, anon;
grant execute on function public.save_list(uuid, text, jsonb, text, text[]) to authenticated;
