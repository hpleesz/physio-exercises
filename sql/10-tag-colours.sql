-- Run once (after 9-list-tags.sql): reusable list tags with colours.
-- Tags live in their own table (name + colour); lists keep naming their tags as before.
-- Like the tags themselves, this is private: only you can see or change it.

create table if not exists public.tags (
  owner  uuid not null default auth.uid() references auth.users on delete cascade,
  name   text not null,
  colour text,  -- a colour name from PALETTE in src/config.js, a colour code like '#C0392B', or null for grey
  primary key (owner, name)
);

alter table public.tags enable row level security;

drop policy if exists "Owner manages own tags" on public.tags;
create policy "Owner manages own tags" on public.tags
  for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());

-- Tags already used on lists become saved tags (grey to start with).
insert into public.tags (owner, name)
select distinct owner, unnest(tags) from public.lists
on conflict do nothing;

-- Same as before, but a new tag typed on a list is also saved for reuse.
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

  insert into tags (name) select unnest(v_tags) on conflict do nothing;

  delete from list_items where list_items.list_id = v_id;
  insert into list_items (list_id, exercise_id, position, comment)
  select v_id, (x ->> 'exercise_id')::bigint, n, nullif(trim(x ->> 'comment'), '')
  from jsonb_array_elements(items) with ordinality as t(x, n);

  return v_id;
end
$$;

-- Renames a tag on every list. Renaming to a tag that already exists merges the two.
create or replace function public.rename_tag(old_name text, new_name text) returns void
language plpgsql security invoker set search_path = public as $$
declare
  v_new text := trim(new_name);
begin
  if v_new = '' then
    raise exception 'A tag needs a name';
  end if;
  if v_new = old_name then
    return;
  end if;
  insert into tags (name, colour)
  select v_new, colour from tags where owner = auth.uid() and name = old_name
  on conflict do nothing;
  update lists
  set tags = (select array_agg(distinct x) from unnest(array_replace(tags, old_name, v_new)) x)
  where owner = auth.uid() and old_name = any(tags);
  delete from tags where owner = auth.uid() and name = old_name;
end
$$;

-- Deletes a tag and takes it off every list.
create or replace function public.delete_tag(tag_name text) returns void
language sql security invoker set search_path = public as $$
  update lists set tags = array_remove(tags, tag_name) where owner = auth.uid() and tag_name = any(tags);
  delete from tags where owner = auth.uid() and name = tag_name;
$$;

revoke execute on function public.rename_tag(text, text) from public, anon;
revoke execute on function public.delete_tag(text) from public, anon;
grant execute on function public.rename_tag(text, text) to authenticated;
grant execute on function public.delete_tag(text) to authenticated;
