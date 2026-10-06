-- Run once: the exercise library is only readable when logged in.
-- Shared list links keep working for everyone: get_list() now also sends the details of the
-- list's own exercises (number, name, instructions, drawing, equipment) and nothing else.
--
-- Note: drawings in the public "drawings" storage bucket can still be opened by anyone who
-- knows or guesses a file's address. Locking those too means making the bucket private.

drop policy if exists "Public can read exercises" on public.exercises;
drop policy if exists "Logged-in users can read exercises" on public.exercises;
create policy "Logged-in users can read exercises"
  on public.exercises for select to authenticated using (true);

-- One list by its id, for anyone with the link:
-- { id, name, items: [{ exercise_id, comment, exercise: { id, number, name, instructions, image_url, equipment } }] }
create or replace function public.get_list(list_id uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'id', l.id,
    'name', l.name,
    'items', coalesce((
      select json_agg(json_build_object(
               'exercise_id', i.exercise_id,
               'comment', i.comment,
               'exercise', json_build_object(
                 'id', e.id, 'number', e.number, 'name', e.name,
                 'instructions', e.instructions, 'image_url', e.image_url, 'equipment', e.equipment))
             order by i.position)
      from list_items i join exercises e on e.id = i.exercise_id
      where i.list_id = l.id), '[]'::json))
  from lists l where l.id = get_list.list_id
$$;
grant execute on function public.get_list(uuid) to anon, authenticated;
