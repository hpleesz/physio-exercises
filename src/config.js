// ─────────────────────────────────────────────────────────────
//  Settings — this is the only file you normally need to edit.
// ─────────────────────────────────────────────────────────────

// From Supabase: Project Settings > API (or the Connect button).
// The URL is just the project address, with nothing after ".supabase.co".
export const SUPABASE_URL = "https://uvbrkotsytciplajbomh.supabase.co";

// The publishable (anon) key. It is safe to have this in public code:
// the database's RLS policy only allows reading.
export const SUPABASE_KEY = "sb_publishable_-pDh2Sx3Ewt0OgOfkoPfpQ_ROhg8rcE";

// Name of the table to read from.
export const TABLE = "exercises";

// Text shown on the page.
export const SITE_TITLE = "Exercise library";
export const SITE_INTRO =
  "Search by number, name, body part, equipment, source or anything in the instructions.";

// Which list columns get a row of filter buttons, in this order.
// Possible keys: region, body_part, type, equipment, area
export const FILTERS = [
  { key: "body_part", label: "Body part" },
  { key: "area", label: "Area" },
];

// Small coloured tags shown when an exercise is opened.
export const TAG_COLUMNS = ["region", "type", "equipment", "area"];

// Search words meaning "or" and "and". Accents are ignored, so "es" also covers "és".
export const OR_WORDS = ["or", "vagy", "|"];
export const AND_WORDS = ["and", "es", "&"];
