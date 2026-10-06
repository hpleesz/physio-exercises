import { useEffect, useMemo, useState } from "react";
import { loadList } from "../supabase.js";
import { titleOf } from "../search.js";
import CopyLinkButton from "../components/CopyLinkButton.jsx";
import Thumbnail from "../components/Thumbnail.jsx";
import Tag from "../components/Tag.jsx";

// A saved list as anyone with its link sees it. The list brings its own exercises' details,
// so this works without logging in.
export default function ListView({ id, exercises, user }) {
  const [list, setList] = useState(undefined); // undefined = loading, null = not found
  const [error, setError] = useState("");
  const byId = useMemo(() => new Map(exercises.map((ex) => [ex.id, ex])), [exercises]);

  useEffect(() => {
    loadList(id)
      .then((l) => {
        setList(l);
        if (l) document.title = l.name;
      })
      .catch((e) => setError(e.message));
  }, [id]);

  if (error) return <main><p className="error" role="alert">Couldn't load this list: {error}</p></main>;
  if (list === undefined) return <main><p className="count">Loading…</p></main>;
  if (list === null) {
    return (
      <main>
        <h1>List not found</h1>
        <p className="lede">This link doesn't lead to a list. It may have been deleted.</p>
      </main>
    );
  }

  // Until sql/11-lock-library.sql is run, lists don't bring these details; then use the library.
  const items = list.items
    .map((it) => ({ ...it, ex: it.exercise ?? byId.get(it.exercise_id) }))
    .filter((it) => it.ex);

  return (
    <main>
      <div className="page-head">
        <h1>{list.name}</h1>
        {user && (
          <div className="chips">
            <a className="chip" href={`#/list/${id}/edit`}>Edit</a>
            <CopyLinkButton id={id} />
          </div>
        )}
      </div>
      <p className="count">{items.length} {items.length === 1 ? "exercise" : "exercises"}</p>

      <ol className="list-view">
        {items.map(({ ex, comment }, i) => (
          <li key={ex.id}>
            <div className="lv-step">{i + 1}</div>
            <div className="lv-body">
              <Thumbnail src={ex.image_url} number={ex.number} className="lv-drawing" />
              <p className="lv-title">{titleOf(ex)}</p>
              {ex.name && ex.instructions && <p>{ex.instructions}</p>}
              {comment && <p className="comment">{comment}</p>}
              {ex.equipment?.length > 0 && (
                <div className="tags">
                  {ex.equipment.filter((v) => v !== "None").map((v) => <Tag key={v} column="equipment" value={v} />)}
                </div>
              )}
              <p className="lv-num">Exercise #{ex.number}</p>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
