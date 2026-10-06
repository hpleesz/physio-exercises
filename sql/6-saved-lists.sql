-- Saved lists of exercises. Run once (also after 1-schema.sql on a fresh project).
--
-- Who can do what:
--   * Creating, editing and deleting lists: only the logged-in owner of the list.
--     Also switch off sign-ups in Supabase (Authentication > Sign In / Providers >
--     "Allow new users to sign up") so nobody else can make an account.
--   * Viewing: anyone who has a list's link, through get_list() below. Visitors can't
--     browse the tables, so they can't find lists they weren't given a link to.

create table public.lists (
  id         uuid primary key default gen_random_uuid(),  -- in the link; impossible to guess
  owner      uuid not null default auth.uid() references auth.users on delete cascade,
  name       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.list_items (
  list_id     uuid   not null references public.lists on delete cascade,
  exercise_id bigint not null references public.exercises on delete cascade,
  position    integer not null,
  comment     text,
  primary key (list_id, exercise_id)
);

alter table public.lists enable row level security;
alter table public.list_items enable row level security;

create policy "Owner manages own lists" on public.lists
  for all to authenticated
  using (owner = auth.uid()) with check (owner = auth.uid());

create policy "Owner manages items of own lists" on public.list_items
  for all to authenticated
  using (exists (select 1 from public.lists l where l.id = list_id and l.owner = auth.uid()))
  with check (exists (select 1 from public.lists l where l.id = list_id and l.owner = auth.uid()));

-- One list by its id, for anyone with the link: { id, name, items: [{ exercise_id, comment }] }
create or replace function public.get_list(list_id uuid) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'id', l.id,
    'name', l.name,
    'items', coalesce((
      select json_agg(json_build_object('exercise_id', i.exercise_id, 'comment', i.comment)
                      order by i.position)
      from list_items i where i.list_id = l.id), '[]'::json))
  from lists l where l.id = get_list.list_id
$$;
grant execute on function public.get_list(uuid) to anon, authenticated;

-- Saves a list's name and exercises (in order) in one go. Pass null as list_id for a new list.
-- Runs as the logged-in user, so the rules above still apply.
create or replace function public.save_list(list_id uuid, list_name text, items jsonb) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_id uuid := save_list.list_id;
begin
  if v_id is null then
    insert into lists (name) values (list_name) returning id into v_id;
  else
    update lists set name = list_name, updated_at = now() where id = v_id;
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
revoke execute on function public.save_list(uuid, text, jsonb) from public, anon;
grant execute on function public.save_list(uuid, text, jsonb) to authenticated;
