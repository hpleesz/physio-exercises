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
    .select("id, name, updated_at, list_items(count)")
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

// Saves name and items (in order); returns the list's id. id = null makes a new list.
export async function saveList(id, name, items) {
  const { data, error } = await db.rpc("save_list", {
    list_id: id,
    list_name: name,
    items: items.map((it) => ({ exercise_id: it.exercise_id, comment: it.comment ?? "" })),
  });
  if (error) throw error;
  return data;
}

export async function deleteList(id) {
  const { error } = await db.from("lists").delete().eq("id", id);
  if (error) throw error;
}
