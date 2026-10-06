import { useMemo, useState } from "react";
import { FILTERS } from "./config.js";
import { alwaysOk, cellValues, list, matchesQuery, parseQuery, passesColumnFilters, valuesWithOther } from "./search.js";

// Search box + filter buttons + tick-box column filters, used by the library and the list editor.
// Each place that calls this gets its own, separate filter settings.
export function useExerciseFilters(exercises) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState({}); // filter buttons, e.g. { body_part: "Knee" }
  // Tick-box column filters, e.g. { equipment: { unticked: Set{"Bosu"}, ticked: Set{...}, mode: "have" } }
  const [colFilters, setColFilters] = useState({});

  // Exercises matching the search box and filter buttons.
  const searched = useMemo(() => {
    const groups = parseQuery(query);
    return exercises.filter(
      (ex) =>
        FILTERS.every((f) => !active[f.key] || list(ex[f.key]).includes(active[f.key])) &&
        matchesQuery(ex, groups)
    );
  }, [exercises, query, active]);

  // ...and the tick-box column filters too.
  const filtered = useMemo(
    () => searched.filter((ex) => passesColumnFilters(ex, colFilters)),
    [searched, colFilters]
  );

  // Values offered in one column's tick-box list: like Excel, only those left by the other filters.
  const optionsFor = (key) => {
    const rows = searched.filter((ex) => passesColumnFilters(ex, colFilters, key));
    // Includes "other" values (e.g. other body parts) so they can be ticked too.
    const values = rows.flatMap((ex) => cellValues(valuesWithOther(ex, key, true), key)).filter((v) => !alwaysOk(key, v));
    return [...new Set(values)].sort((a, b) =>
      a === "" ? 1 : b === "" ? -1 : a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );
  };

  return {
    query, setQuery,
    active, setActive: (key, value) => setActive((a) => ({ ...a, [key]: value })),
    colFilters,
    setColFilter: (key, filter) =>
      setColFilters(({ [key]: _, ...rest }) => (filter ? { ...rest, [key]: filter } : rest)),
    anyFilter: Boolean(query.trim()) || Object.values(active).some(Boolean) || Object.keys(colFilters).length > 0,
    clearAll: () => { setQuery(""); setActive({}); setColFilters({}); },
    searched, filtered, optionsFor,
  };
}
