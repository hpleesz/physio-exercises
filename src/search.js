import { OR_WORDS, AND_WORDS } from "./config.js";

export const list = (v) => (Array.isArray(v) ? v : []);

// Lower-case and strip accents, so "osszeszorit" finds "összeszorít".
export const norm = (s) =>
  String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// All searchable text of one exercise, prepared once after loading.
export function searchText(ex) {
  return norm(
    [
      ex.number, ex.name,
      ...list(ex.region), ...list(ex.body_part), ...list(ex.type),
      ...list(ex.equipment), ...list(ex.area),
      ex.source, ex.comment, ex.instructions,
    ].join(" ")
  );
}

// "knee band or hip" -> [["knee","band"], ["hip"]]
// An exercise matches if ANY group matches; a group matches if ALL its terms do.
export function parseQuery(q) {
  const groups = [[]];
  const re = /"([^"]*)"|(\S+)/g;
  let m;
  while ((m = re.exec(norm(q)))) {
    if (m[1] !== undefined) {
      if (m[1].trim()) groups.at(-1).push(m[1].trim());
    } else if (OR_WORDS.includes(m[2])) {
      groups.push([]);
    } else if (!AND_WORDS.includes(m[2])) {
      groups.at(-1).push(m[2]);
    }
  }
  return groups.filter((g) => g.length);
}

function termMatches(ex, term) {
  const exact = term.match(/^#(\d+)$/);
  if (exact) return ex.number === Number(exact[1]);
  return ex._search.includes(term.replace(/^#/, ""));
}

export function matchesQuery(ex, groups) {
  return !groups.length || groups.some((g) => g.every((t) => termMatches(ex, t)));
}
