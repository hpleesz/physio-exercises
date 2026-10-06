import { useEffect, useMemo, useState } from "react";
import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TABLE_MATCH_ALL } from "../config.js";
import { deleteList, loadList, saveList } from "../supabase.js";
import { titleOf } from "../search.js";
import { columnLabel } from "../columns.js";
import { useExerciseFilters } from "../useExerciseFilters.js";
import CopyLinkButton from "../components/CopyLinkButton.jsx";
import ColumnFilter from "../components/ColumnFilter.jsx";
import ExerciseDetails from "../components/ExerciseDetails.jsx";
import Filters from "../components/Filters.jsx";

// Make or edit a list: tick exercises on the left, then drag to reorder and add comments on the right.
// id = null for a new list. columns: the columns offered as filters and shown on opened cards.
export default function ListEditor({ id, exercises, status, columns }) {
  const [listId, setListId] = useState(id); // set after a new list's first save
  const [name, setName] = useState("");
  const [items, setItems] = useState([]); // [{ exercise_id, comment }], in order
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const f = useExerciseFilters(exercises);
  const found = f.filtered;

  const byId = useMemo(() => new Map(exercises.map((ex) => [ex.id, ex])), [exercises]);
  const chosen = useMemo(() => new Set(items.map((it) => it.exercise_id)), [items]);

  useEffect(() => {
    document.title = id ? "Edit list" : "New list";
    if (!id) return;
    loadList(id)
      .then((l) => {
        if (!l) throw new Error("This list doesn't exist.");
        setName(l.name);
        setItems(l.items);
        document.title = `Edit: ${l.name}`;
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function change(nextItems) {
    setItems(nextItems);
    setDirty(true);
    setMessage("");
  }

  const toggle = (exId) =>
    change(chosen.has(exId) ? items.filter((it) => it.exercise_id !== exId) : [...items, { exercise_id: exId, comment: "" }]);
  const setComment = (exId, comment) =>
    change(items.map((it) => (it.exercise_id === exId ? { ...it, comment } : it)));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  function onDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((it) => String(it.exercise_id) === active.id);
    const to = items.findIndex((it) => String(it.exercise_id) === over.id);
    change(arrayMove(items, from, to));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const savedId = await saveList(listId, name.trim(), items);
      setDirty(false);
      setMessage("Saved");
      if (!listId) {
        // Now it has its own address; update it without reopening the editor.
        setListId(savedId);
        window.history.replaceState(null, "", `#/list/${savedId}/edit`);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete the list “${name}”? This can't be undone.`)) return;
    try {
      await deleteList(listId);
      setDirty(false);
      window.location.hash = "#/lists";
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading || status === "loading") return <main><p className="count">Loading…</p></main>;

  return (
    <main className="editor">
      <div className="page-head">
        <h1>{listId ? "Edit list" : "New list"}</h1>
        <div className="chips">
          {listId && !dirty && <a className="chip" href={`#/list/${listId}`}>Open list</a>}
          {listId && <CopyLinkButton id={listId} />}
        </div>
      </div>

      <div className="editor-grid">
        {/* Left: the whole library, tick to add */}
        <section className="pane" aria-labelledby="pick-head">
          <h2 id="pick-head">Exercises</h2>
          <input className="pane-search" type="search" value={f.query} onChange={(e) => f.setQuery(e.target.value)}
                 placeholder="Search, e.g. “knee or hip”" aria-label="Search exercises" autoComplete="off" />

          <details className="editor-filters">
            <summary>Filters{f.anyFilter && " (on)"}</summary>
            <Filters exercises={exercises} active={f.active} onChange={f.setActive} />
            <div className="filter">
              <div className="filter-label">More filters</div>
              <div className="filter-pills">
                {columns.map((c) => (
                  <span className="filter-pill" key={c}>
                    {columnLabel(c)}
                    <ColumnFilter column={c} label={columnLabel(c)} filter={f.colFilters[c]}
                                  matchAll={c in TABLE_MATCH_ALL}
                                  getOptions={() => f.optionsFor(c)} onApply={(filter) => f.setColFilter(c, filter)} />
                  </span>
                ))}
              </div>
            </div>
          </details>

          <div className="count-row tight">
            <p className="count">{found.length} of {exercises.length} exercises</p>
            {f.anyFilter && <button className="link-btn" onClick={f.clearAll}>Clear search and filters</button>}
          </div>

          <ul className="pick-list">
            {found.map((ex) => (
              <PickRow key={ex.id} ex={ex} on={chosen.has(ex.id)} onToggle={() => toggle(ex.id)} columns={columns} />
            ))}
            {!found.length && <li className="empty">No exercises match.</li>}
          </ul>
        </section>

        {/* Right: the list being made */}
        <section className="pane" aria-labelledby="list-head">
          <label className="name-field">
            <span id="list-head">List name</span>
            <input value={name} onChange={(e) => { setName(e.target.value); setDirty(true); setMessage(""); }}
                   placeholder="e.g. Knee – week 1" />
          </label>

          {items.length === 0 ? (
            <p className="empty">Tick exercises on the left to add them here.</p>
          ) : (
            <>
              <p className="count">{items.length} {items.length === 1 ? "exercise" : "exercises"} · drag ⠿ to reorder</p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={items.map((it) => String(it.exercise_id))} strategy={verticalListSortingStrategy}>
                  <ol className="chosen-list">
                    {items.map((it, i) => (
                      <ChosenItem key={it.exercise_id} item={it} index={i} ex={byId.get(it.exercise_id)} columns={columns}
                                  onComment={(c) => setComment(it.exercise_id, c)}
                                  onRemove={() => toggle(it.exercise_id)} />
                    ))}
                  </ol>
                </SortableContext>
              </DndContext>
            </>
          )}

          <div className="save-bar">
            {error && <p className="error" role="alert">{error}</p>}
            <button className="chip primary big" onClick={save} disabled={saving || !name.trim()}>
              {saving ? "Saving…" : "Save"}
            </button>
            {!name.trim() && <span className="count">Give the list a name to save it.</span>}
            {message && !dirty && <span className="count" role="status">✓ {message}</span>}
            {dirty && name.trim() && <span className="count">Unsaved changes</span>}
            <span className="spacer" />
            {listId && <button className="chip danger" onClick={remove}>Delete list</button>}
          </div>
        </section>
      </div>
    </main>
  );
}

// The ▾ button that opens and closes an exercise's card.
function MoreButton({ open, onClick, ex }) {
  return (
    <button className="more" onClick={onClick} aria-expanded={open}
            aria-label={`${open ? "Hide" : "Show"} details of exercise ${ex?.number ?? ""}`}
            title={open ? "Hide details" : "Show details"}>
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

// One exercise in the library pane: tick to add; ▾ to open its card.
function PickRow({ ex, on, onToggle, columns }) {
  const [open, setOpen] = useState(false);
  return (
    <li className={open ? "open" : undefined}>
      <div className={`pick-row${on ? " on" : ""}`}>
        <label>
          <input type="checkbox" checked={on} onChange={onToggle} />
          <span className="num">{ex.number}</span>
          {ex.image_url && <img className="mini" src={ex.image_url} alt="" loading="lazy" />}
          <span className="pick-title">{titleOf(ex)}</span>
        </label>
        <MoreButton open={open} onClick={() => setOpen(!open)} ex={ex} />
      </div>
      {open && <ExerciseDetails ex={ex} columns={columns} />}
    </li>
  );
}

function ChosenItem({ item, index, ex, columns, onComment, onRemove }) {
  const [open, setOpen] = useState(false);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: String(item.exercise_id) });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li ref={setNodeRef} style={style} className={isDragging ? "dragging" : undefined}>
      <button ref={setActivatorNodeRef} className="handle" {...attributes} {...listeners}
              aria-label={`Move exercise ${ex?.number ?? ""} (position ${index + 1}). Press space, then arrow keys.`}>
        ⠿
      </button>
      <div className="chosen-body">
        <div className="chosen-top">
          <span className="num">{ex?.number ?? "?"}</span>
          {ex?.image_url && <img className="mini" src={ex.image_url} alt="" />}
          <span className="pick-title">{ex ? titleOf(ex) : "Exercise no longer exists"}</span>
          {ex && <MoreButton open={open} onClick={() => setOpen(!open)} ex={ex} />}
          <button className="remove" onClick={onRemove} aria-label={`Remove exercise ${ex?.number ?? ""}`}>×</button>
        </div>
        <textarea rows={1} value={item.comment ?? ""} onChange={(e) => onComment(e.target.value)}
                  placeholder="Comment (optional), e.g. 10 × 3, slowly"
                  aria-label={`Comment for exercise ${ex?.number ?? ""}`} />
        {open && ex && <ExerciseDetails ex={ex} columns={columns} />}
      </div>
    </li>
  );
}
