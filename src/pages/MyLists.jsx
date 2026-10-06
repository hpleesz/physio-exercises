import { useEffect, useMemo, useState } from "react";
import { deleteList, loadMyLists, loadTags } from "../supabase.js";
import { norm, parseQuery } from "../search.js";
import CopyLinkButton from "../components/CopyLinkButton.jsx";
import TagManager, { tagStyle } from "../components/TagManager.jsx";

export default function MyLists() {
  const [lists, setLists] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState(null); // show only lists with this tag
  const [tags, setTags] = useState([]); // saved tags: [{ name, colour }]

  const reload = () =>
    Promise.all([loadMyLists(), loadTags()]).then(([ls, ts]) => {
      setLists(ls);
      setTags(ts);
    });

  useEffect(() => {
    document.title = "My lists";
    reload().catch((e) => setError(e.message));
  }, []);

  const colours = useMemo(() => new Map(tags.map((t) => [t.name, t.colour])), [tags]);

  // How many lists use each tag.
  const counts = useMemo(() => {
    const c = new Map();
    (lists ?? []).forEach((l) => (l.tags ?? []).forEach((t) => c.set(t, (c.get(t) ?? 0) + 1)));
    return c;
  }, [lists]);

  // Tags on at least one list, for the tag buttons.
  const allTags = useMemo(() => [...counts].sort(([a], [b]) => a.localeCompare(b)), [counts]);

  // A renamed or deleted tag can't stay selected.
  useEffect(() => {
    if (tag && !counts.has(tag)) setTag(null);
  }, [counts, tag]);

  // Same search rules as the exercises: words must all match, "or" for either, quotes for a phrase.
  const shown = useMemo(() => {
    const groups = parseQuery(query);
    return (lists ?? []).filter((l) => {
      if (tag && !(l.tags ?? []).includes(tag)) return false;
      const text = norm([l.name, l.description, ...(l.tags ?? [])].join(" "));
      return !groups.length || groups.some((g) => g.every((t) => text.includes(t)));
    });
  }, [lists, query, tag]);

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
        <>
          <input className="search" type="search" value={query} onChange={(e) => setQuery(e.target.value)}
                 placeholder="Search names, descriptions and tags" aria-label="Search your lists" autoComplete="off" />

          {allTags.length > 0 && (
            <div className="filter" role="group" aria-label="Show lists with tag">
              <div className="filter-label">Tags</div>
              <div className="chips">
                <button className="chip" aria-pressed={!tag} onClick={() => setTag(null)}>All</button>
                {allTags.map(([t, n]) => (
                  <button key={t} className="chip" aria-pressed={tag === t} onClick={() => setTag(tag === t ? null : t)}>
                    {colours.get(t) && <span className="dot" style={tagStyle(colours.get(t))} aria-hidden="true" />}
                    {t} <span className="chip-count">{n}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <TagManager tags={tags} counts={counts} onChanged={reload} />

          <p className="count list-count" aria-live="polite">{shown.length} of {lists.length} lists</p>

          <ul className="lists">
            {shown.map((l) => (
              <li key={l.id}>
                <div className="lists-name">
                  <a href={`#/list/${l.id}`}>{l.name}</a>
                  {l.description && <p className="lists-desc">{l.description}</p>}
                  {(l.tags ?? []).length > 0 && (
                    <div className="tags">
                      {l.tags.map((t) => (
                        <button key={t} className="tag tag-btn" style={tagStyle(colours.get(t))} onClick={() => setTag(t)}
                                aria-label={`Show lists tagged ${t}`}>{t}</button>
                      ))}
                    </div>
                  )}
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
            {!shown.length && <li className="empty">No lists match. Try other words or another tag.</li>}
          </ul>
        </>
      )}
    </main>
  );
}
