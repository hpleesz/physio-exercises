import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY, TABLE } from "./config.js";

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// Supabase returns at most 1000 rows per request, so fetch in pages.
export async function loadExercises() {
  const pageSize = 1000;
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db
      .from(TABLE)
      .select("*")
      .order("number", { ascending: true, nullsFirst: false })
      .order("id")
      .range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < pageSize) return rows;
  }
}

// ── Login (only you have an account; sign-ups are switched off in Supabase) ──

export async function getUser() {
  const { data } = await db.auth.getSession();
  return data.session?.user ?? null;
}

// Calls back with the user (or null) whenever you log in or out.
export function onUserChange(callback) {
  const { data } = db.auth.onAuthStateChange((_event, session) => callback(session?.user ?? null));
  return () => data.subscription.unsubscribe();
}

export async function logIn(email, password) {
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function logOut() {
  await db.auth.signOut();
}

// ── Saved lists (see sql/6-saved-lists.sql) ──

// Your own lists, newest first, with how many exercises each has.
export async function loadMyLists() {
  const { data, error } = await db
    .from("lists")
    .select("id, name, description, tags, updated_at, list_items(count)")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data.map((l) => ({ ...l, count: l.list_items?.[0]?.count ?? 0 }));
}

// One list by id, for anyone with the link. Returns null if there's no such list.
// { id, name, items: [{ exercise_id, comment }] }
export async function loadList(id) {
  const { data, error } = await db.rpc("get_list", { list_id: id });
  if (error) throw error;
  return data;
}

// One of your own lists with its private details, for the editor. Returns null if not found.
// { id, name, description, tags, items: [{ exercise_id, comment }] }
export async function loadOwnList(id) {
  const { data, error } = await db
    .from("lists")
    .select("id, name, description, tags, list_items(exercise_id, comment, position)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { list_items, ...list } = data;
  return { ...list, items: [...list_items].sort((a, b) => a.position - b.position) };
}

// Saves a list (exercises in order); returns its id. id = null makes a new list.
export async function saveList(id, { name, description, tags, items }) {
  const { data, error } = await db.rpc("save_list", {
    list_id: id,
    list_name: name,
    items: items.map((it) => ({ exercise_id: it.exercise_id, comment: it.comment ?? "" })),
    list_description: description ?? "",
    list_tags: tags ?? [],
  });
  if (error) throw error;
  return data;
}

export async function deleteList(id) {
  const { error } = await db.from("lists").delete().eq("id", id);
  if (error) throw error;
}

// ── Saved tags for lists, with colours (see sql/10-tag-colours.sql) ──

// [{ name, colour }], A–Z
export async function loadTags() {
  const { data, error } = await db.from("tags").select("name, colour").order("name");
  if (error) throw error;
  return data;
}

export async function createTag(name) {
  const { error } = await db.from("tags").insert({ name: name.trim() });
  if (error?.code === "23505") throw new Error(`There's already a tag called “${name.trim()}”.`);
  if (error) throw error;
}

// colour: a PALETTE name, a colour code, or null for grey.
export async function setTagColour(name, colour) {
  const { error } = await db.from("tags").update({ colour }).eq("name", name);
  if (error) throw error;
}

// Renames the tag on every list; renaming to an existing tag merges the two.
export async function renameTag(oldName, newName) {
  const { error } = await db.rpc("rename_tag", { old_name: oldName, new_name: newName });
  if (error) throw error;
}

// Deletes the tag and takes it off every list.
export async function deleteTag(name) {
  const { error } = await db.rpc("delete_tag", { tag_name: name });
  if (error) throw error;
}
