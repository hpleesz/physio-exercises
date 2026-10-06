import { useEffect, useState } from "react";
import { deleteList, loadMyLists } from "../supabase.js";
import CopyLinkButton from "../components/CopyLinkButton.jsx";

export default function MyLists() {
  const [lists, setLists] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "My lists";
    loadMyLists().then(setLists).catch((e) => setError(e.message));
  }, []);

  async function remove(l) {
    if (!window.confirm(`Delete the list “${l.name}”? This can't be undone.`)) return;
    try {
      await deleteList(l.id);
      setLists((ls) => ls.filter((x) => x.id !== l.id));
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main>
      <div className="page-head">
        <h1>My lists</h1>
        <a className="chip primary big" href="#/lists/new">New list</a>
      </div>

      {error && <p className="error" role="alert">Couldn't load your lists: {error}</p>}
      {!lists && !error && <p className="count">Loading…</p>}
      {lists && !lists.length && (
        <p className="empty">No lists yet. Use “New list” to make one.</p>
      )}

      {lists && lists.length > 0 && (
        <ul className="lists">
          {lists.map((l) => (
            <li key={l.id}>
              <div className="lists-name">
                <a href={`#/list/${l.id}`}>{l.name}</a>
                <span className="count">
                  {l.count} {l.count === 1 ? "exercise" : "exercises"} · changed{" "}
                  {new Date(l.updated_at).toLocaleDateString()}
                </span>
              </div>
              <div className="chips">
                <a className="chip" href={`#/list/${l.id}/edit`}>Edit</a>
                <CopyLinkButton id={l.id} />
                <button className="chip danger" onClick={() => remove(l)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
