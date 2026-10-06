import { useEffect, useMemo, useState } from "react";
import { SITE_TITLE, SITE_INTRO } from "./config.js";
import { getUser, loadExercises, logOut, onUserChange } from "./supabase.js";
import { useRoute } from "./route.js";
import { searchText } from "./search.js";
import { detailColumns, tableColumns } from "./columns.js";
import { useExerciseFilters } from "./useExerciseFilters.js";
import SearchBox from "./components/SearchBox.jsx";
import Filters from "./components/Filters.jsx";
import ExerciseItem from "./components/ExerciseItem.jsx";
import ExerciseTable from "./components/ExerciseTable.jsx";
import Nav from "./components/Nav.jsx";
import LoginForm from "./components/LoginForm.jsx";
import MyLists from "./pages/MyLists.jsx";
import ListEditor from "./pages/ListEditor.jsx";
import ListView from "./pages/ListView.jsx";

export default function App() {
  const route = useRoute();
  const [user, setUser] = useState(null); // logged-in owner, or null for visitors
  const [exercises, setExercises] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [view, setView] = useState("table"); // table | list
  const f = useExerciseFilters(exercises);

  useEffect(() => {
    getUser().then(setUser);
    return onUserChange(setUser);
  }, []);

  useEffect(() => {
    if (route.page === "library") document.title = SITE_TITLE;
  }, [route]);

  useEffect(() => {
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

  const columns = useMemo(() => tableColumns(exercises), [exercises]);

  // Column tick-box filters only apply in table view.
  const hits = view === "table" ? f.filtered : f.searched;

  const loadError = status === "error" && (
    <main><p className="error" role="alert">Couldn't load exercises: {error}</p></main>
  );

  return (
    <>
      <Nav route={route} user={user} onLogOut={() => logOut().then(() => (window.location.hash = "#/"))} />

      {route.page === "lists" && (user ? <MyLists key={route.n} /> : <main><LoginForm /></main>)}
      {route.page === "edit" &&
        (loadError || (user
          ? <ListEditor key={route.n} id={route.id} exercises={exercises} status={status}
                        columns={detailColumns(columns)} />
          : <main><LoginForm /></main>))}
      {route.page === "view" &&
        (loadError || <ListView key={route.n} id={route.id} exercises={exercises} status={status} user={user} />)}

      {/* The library stays on the page while hidden, so your search and filters are kept. */}
      <main className={view === "table" ? "wide" : undefined} hidden={route.page !== "library"}>
        <h1>{SITE_TITLE}</h1>
        <p className="lede">{SITE_INTRO}</p>

        <SearchBox value={f.query} onChange={f.setQuery} />
        <Filters exercises={exercises} active={f.active} onChange={f.setActive} />

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
            colFilters={f.colFilters}
            optionsFor={f.optionsFor}
            onFilterChange={f.setColFilter}
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
    </>
  );
}
