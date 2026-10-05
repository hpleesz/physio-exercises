import { useEffect, useMemo, useState } from "react";
import { FILTERS, SITE_TITLE, SITE_INTRO } from "./config.js";
import { loadExercises } from "./supabase.js";
import { list, matchesQuery, parseQuery, searchText } from "./search.js";
import SearchBox from "./components/SearchBox.jsx";
import Filters from "./components/Filters.jsx";
import ExerciseItem from "./components/ExerciseItem.jsx";

export default function App() {
  const [exercises, setExercises] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState({}); // e.g. { body_part: "Knee" }

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

  const hits = useMemo(() => {
    const groups = parseQuery(query);
    return exercises.filter(
      (ex) =>
        FILTERS.every((f) => !active[f.key] || list(ex[f.key]).includes(active[f.key])) &&
        matchesQuery(ex, groups)
    );
  }, [exercises, query, active]);

  return (
    <main>
      <h1>{SITE_TITLE}</h1>
      <p className="lede">{SITE_INTRO}</p>

      <SearchBox value={query} onChange={setQuery} />
      <Filters
        exercises={exercises}
        active={active}
        onChange={(key, value) => setActive((a) => ({ ...a, [key]: value }))}
      />

      <p className="count" aria-live="polite">
        {status === "loading" && "Loading exercises…"}
        {status === "error" &&
          `Couldn't load exercises: ${error}. Check SUPABASE_URL and SUPABASE_KEY in src/config.js.`}
        {status === "ready" && `${hits.length} of ${exercises.length} exercises`}
      </p>

      {status === "ready" && (
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
