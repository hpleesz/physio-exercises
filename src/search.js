import { OR_WORDS, AND_WORDS, TABLE_MATCH_ALL } from "./config.js";

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
export const alwaysOk = (key, v) => key in TABLE_MATCH_ALL && (v === "" || TABLE_MATCH_ALL[key].includes(v));

// Does this exercise pass every column filter (optionally ignoring one column)?
// filters: { body_part: Set{"Hip","Knee"}, ... } holds the UNticked values of each filtered column.
// Normally a row passes if any of its values is ticked. In TABLE_MATCH_ALL columns every need
// must be met, and "Mat/Bed" is met by a ticked mat or a ticked bed.
export function passesColumnFilters(ex, filters, skipKey) {
    return Object.entries(filters).every(([key, unticked]) => {
        if (key === skipKey) return true;
        const ticked = (v) => alwaysOk(key, v) || !unticked.has(v);
        if (key in TABLE_MATCH_ALL) return list(ex[key]).every((need) => alternatives(need).some(ticked));
        return cellValues(ex[key], key).some(ticked);
    });
}