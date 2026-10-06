import { useEffect, useMemo, useState } from "react";
import { FILTERS, SITE_TITLE, SITE_INTRO, TABLE_AFTER_NUMBER, TABLE_HIDDEN } from "./config.js";
import { loadExercises } from "./supabase.js";
import { alwaysOk, cellValues, list, matchesQuery, parseQuery, passesColumnFilters, searchText } from "./search.js";
import SearchBox from "./components/SearchBox.jsx";
import Filters from "./components/Filters.jsx";
import ExerciseItem from "./components/ExerciseItem.jsx";
import ExerciseTable from "./components/ExerciseTable.jsx";

export default function App() {
  const [exercises, setExercises] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState({}); // e.g. { body_part: "Knee" }
  const [view, setView] = useState("table"); // table | list
  const [colFilters, setColFilters] = useState({}); // unticked values, e.g. { equipment: Set{"Bosu"} }; table view only

  useEffect(() => {
    document.title = SITE_TITLE;
    loadExercises()
      .then((rows) => {
        setExercises(rows.map((ex) => ({ ...ex, _search: searchText(ex) })));
        setStatus("ready");
      })
      .catch((e) => {
        setError(e.message || String(e));
        setStatus("error");
      });
  }, []);

  // Every column the database returned (skips our own "_search"), minus hidden ones,
  // with TABLE_AFTER_NUMBER moved to straight after "number".
  const columns = useMemo(() => {
    const all = [...new Set(exercises.flatMap((ex) => Object.keys(ex)))].filter(
      (k) => !k.startsWith("_") && !TABLE_HIDDEN.includes(k)
    );
    const moved = TABLE_AFTER_NUMBER.filter((k) => all.includes(k));
    const rest = all.filter((k) => !moved.includes(k));
    rest.splice(rest.indexOf("number") + 1, 0, ...moved);
    return rest;
  }, [exercises]);

  // Rows matching the main search and filter buttons.
  const searched = useMemo(() => {
    const groups = parseQuery(query);
    return exercises.filter(
      (ex) =>
        FILTERS.every((f) => !active[f.key] || list(ex[f.key]).includes(active[f.key])) &&
        matchesQuery(ex, groups)
    );
  }, [exercises, query, active]);

  // Column tick-box filters only apply in table view.
  const hits = useMemo(
    () => (view === "table" ? searched.filter((ex) => passesColumnFilters(ex, colFilters)) : searched),
    [searched, view, colFilters]
  );

  // Values offered in one column's tick-box list: like Excel, only those left by the other filters.
  const optionsFor = (key) => {
    const rows = searched.filter((ex) => passesColumnFilters(ex, colFilters, key));
    const values = rows.flatMap((ex) => cellValues(ex[key], key)).filter((v) => !alwaysOk(key, v));
    return [...new Set(values)].sort((a, b) =>
      a === "" ? 1 : b === "" ? -1 : a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
    );
  };

  return (
    <main className={view === "table" ? "wide" : undefined}>
      <h1>{SITE_TITLE}</h1>
      <p className="lede">{SITE_INTRO}</p>

      <SearchBox value={query} onChange={setQuery} />
      <Filters
        exercises={exercises}
        active={active}
        onChange={(key, value) => setActive((a) => ({ ...a, [key]: value }))}
      />

      <div className="count-row">
        <p className="count" aria-live="polite">
          {status === "loading" && "Loading exercises…"}
          {status === "error" &&
            `Couldn't load exercises: ${error}. Check SUPABASE_URL and SUPABASE_KEY in src/config.js.`}
          {status === "ready" && `${hits.length} of ${exercises.length} exercises`}
        </p>
        <div className="chips" role="group" aria-label="View">
          <button className="chip" aria-pressed={view === "list"} onClick={() => setView("list")}>List</button>
          <button className="chip" aria-pressed={view === "table"} onClick={() => setView("table")}>Table</button>
        </div>
      </div>

      {status === "ready" && view === "table" && (
        <ExerciseTable
          rows={hits}
          columns={columns}
          colFilters={colFilters}
          optionsFor={optionsFor}
          onFilterChange={(key, unticked) =>
            setColFilters(({ [key]: _, ...rest }) => (unticked ? { ...rest, [key]: unticked } : rest))
          }
        />
      )}

      {status === "ready" && view === "list" && (
        <ul>
          {hits.length ? (
            hits.map((ex) => <ExerciseItem key={ex.id} ex={ex} />)
          ) : (
            <li className="empty">No exercises match. Try fewer words, use “or”, or clear a filter.</li>
          )}
        </ul>
      )}
    </main>
  );
}
