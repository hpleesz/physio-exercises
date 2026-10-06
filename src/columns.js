import { TABLE_AFTER_NUMBER, TABLE_HIDDEN, TABLE_SECONDARY } from "./config.js";

// Headings that read better than the database name.
const LABELS = { image_url: "Image" };

// "body_part" -> "Body part"
export const columnLabel = (key) =>
  LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");

// Every column the database returned (skips our own "_search"), minus hidden ones and those
// shown inside another column (TABLE_SECONDARY), with TABLE_AFTER_NUMBER moved after "number".
export function tableColumns(exercises) {
  const inside = Object.values(TABLE_SECONDARY);
  const all = [...new Set(exercises.flatMap((ex) => Object.keys(ex)))].filter(
    (k) => !k.startsWith("_") && !TABLE_HIDDEN.includes(k) && !inside.includes(k)
  );
  const moved = TABLE_AFTER_NUMBER.filter((k) => all.includes(k));
  const rest = all.filter((k) => !moved.includes(k));
  rest.splice(rest.indexOf("number") + 1, 0, ...moved);
  return rest;
}

// The columns shown as labelled rows on an exercise card and offered as tick-box filters in
// the list editor. Number, drawing, instructions and comment are shown on their own.
const SHOWN_SEPARATELY = ["id", "number", "image_url", "instructions", "comment"];
export const detailColumns = (columns) => columns.filter((c) => !SHOWN_SEPARATELY.includes(c));
