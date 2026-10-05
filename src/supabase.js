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
