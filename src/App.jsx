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
  const [user, setUser] = useState(undefined); // logged-in owner; null for visitors; undefined while checking
  const [exercises, setExercises] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error | locked (not logged in)
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

  // The library is only for you: load it once you're logged in, and forget it when you log out.
  const userId = user?.id;
  useEffect(() => {
    if (!userId) {
      setExercises([]);
      setStatus("locked");
      return;
    }
    setStatus("loading");
    loadExercises()
      .then((rows) => {
        setExercises(rows.map((ex) => ({ ...ex, _search: searchText(ex) })));
        setStatus("ready");
      })
      .catch((e) => {
        setError(e.message || String(e));
        setStatus("error");
      });
  }, [userId]);

  const columns = useMemo(() => tableColumns(exercises), [exercises]);

  // Column tick-box filters only apply in table view.
  const hits = view === "table" ? f.filtered : f.searched;

  const loadError = status === "error" && (
    <main><p className="error" role="alert">Couldn't load exercises: {error}</p></main>
  );

  return (
    <>
      <Nav route={route} user={user} onLogOut={() => logOut().then(() => (window.location.hash = "#/"))} />

      {/* Shared lists work for everyone; every other page needs you to be logged in. */}
      {route.page === "view" && <ListView key={route.n} id={route.id} exercises={exercises} user={user} />}
      {route.page !== "view" && user === undefined && <main><p className="count">Loading…</p></main>}
      {route.page !== "view" && user === null && <main><LoginForm /></main>}

      {user && route.page === "lists" && <MyLists key={route.n} />}
      {user && route.page === "edit" &&
        (loadError || <ListEditor key={route.n} id={route.id} exercises={exercises} status={status}
                                  columns={detailColumns(columns)} />)}

      {/* The library stays on the page while hidden, so your search and filters are kept. */}
      <main className={view === "table" ? "wide" : undefined} hidden={!user || route.page !== "library"}>
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
