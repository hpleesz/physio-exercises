import { OR_WORDS, AND_WORDS, TABLE_MATCH_ALL } from "./config.js";

export const list = (v) => (Array.isArray(v) ? v : []);

// What an exercise is called: its name, or its instructions if it has no name.
export const titleOf = (ex) => ex.name || ex.instructions || "";

// Lower-case and strip accents, so "osszeszorit" finds "összeszorít".
export const norm = (s) =>
    String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// All searchable text of one exercise, prepared once after loading.
export function searchText(ex) {
    return norm(
        [
            ex.number, ex.name,
            ...list(ex.region), ...list(ex.body_part), ...list(ex.type),
            ...list(ex.equipment), ...list(ex.area), ...list(ex.position),
            ex.source, ex.comment, ex.instructions,
        ].join(" ")
    );
}

// "knee band or hip" -> [["knee","band"], ["hip"]]
// An exercise matches if ANY group matches; a group matches if ALL its terms do.
export function parseQuery(q) {
    const groups = [
        []
    ];
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

// How one database value is shown in a table cell: lists become "Hip, Knee".
export const cellText = (v) => (Array.isArray(v) ? v.join(", ") : String(v ?? ""));

// The values one cell offers in a column's tick-box filter. A list gives each item
// separately ("Hip", "Knee"); an empty cell gives "", shown as "(Blanks)".
// Image links are only "Has image" or blank — the link itself isn't useful to tick.
export function cellValues(v, key) {
    if (key === "image_url") return [v ? "Has image" : ""];
    if (key in TABLE_MATCH_ALL && Array.isArray(v)) return v.length ? v.flatMap(alternatives) : [""];
    if (Array.isArray(v)) return v.length ? v.map(String) : [""];
    return [cellText(v)];
}

// "Mat/Bed" -> ["Mat", "Bed"]: one need that any of these items meets.
export const alternatives = (need) => String(need).split("/").map((s) => s.trim()).filter(Boolean);

// Values that never hide an exercise in a "match all" column: blanks and e.g. "None".
export const alwaysOk = (key, v) => key in TABLE_MATCH_ALL && (v === "" || TABLE_MATCH_ALL[key].ignore.includes(v));

// How a TABLE_MATCH_ALL column's ticks are used (e.g. Mat and Ball ticked):
//   have:  nothing beyond what's ticked — Mat, Ball, Mat + Ball, or no equipment
//   exact: every ticked item and nothing else — only Mat + Ball
//   any:   at least one ticked item, plus anything else — every exercise with Mat or Ball
export const MODES = [
    { key: "any", label: "Any of these", hint: "Has at least one ticked item" },
    { key: "exact", label: "Exactly these", hint: "Has every ticked item, and nothing else" },
    { key: "have", label: "Only these", hint: "Has nothing that isn't ticked" },
];

// Does this exercise pass every column filter (optionally ignoring one column)?
// filters: { body_part: { unticked: Set, ticked: Set, mode }, ... }
// Normally a row passes if any of its values is ticked. TABLE_MATCH_ALL columns use the mode above,
// and a need like "Mat/Bed" counts as either item.
export function passesColumnFilters(ex, filters, skipKey) {
    return Object.entries(filters).every(([key, { unticked, ticked, mode }]) => {
        if (key === skipKey) return true;
        if (!(key in TABLE_MATCH_ALL)) return cellValues(ex[key], key).some((v) => !unticked.has(v));

        const needs = list(ex[key]).map(alternatives);
        const uses = (item) => needs.some((alts) => alts.includes(item));
        const have = (needs.length > 0 || TABLE_MATCH_ALL[key].emptyOk) && needs.every((alts) => alts.some((v) => alwaysOk(key, v) || !unticked.has(v)));
        const m = mode ?? TABLE_MATCH_ALL[key].mode;
        if (m === "any") return [...ticked].some(uses);
        if (m === "exact") return have && ticked.size > 0 && [...ticked].every(uses);
        return have;
    });
}