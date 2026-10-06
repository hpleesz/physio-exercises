import { useEffect, useRef, useState } from "react";
import { norm } from "../search.js";
import { Dot } from "./Tag.jsx";

// Long columns (e.g. instructions) can have thousands of different values.
const MAX_SHOWN = 500;
const show = (v) => (v === "" ? "(Blanks)" : v);
// Same width as the phone layout in styles.css.
const isNarrow = () => window.matchMedia("(max-width: 40rem)").matches;

// Excel-style column filter: a funnel button that opens a tick-box list of the column's values.
// unticked: Set of unticked values, or undefined when the column isn't filtered. Values missing
// from the list (hidden by other filters) keep their state.
// matchAll: "I have these" column, where an exercise needs every one of its values ticked.
export default function ColumnFilter({ column, label, unticked, matchAll, getOptions, onApply }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const [options, setOptions] = useState([]);
  const [draft, setDraft] = useState(new Set());
  const [search, setSearch] = useState("");
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  function openPanel() {
    const opts = getOptions();
    const r = buttonRef.current.getBoundingClientRect();
    const width = Math.min(288, window.innerWidth - 16);
    setOptions(opts);
    setDraft(new Set(opts.filter((v) => !unticked?.has(v))));
    setSearch("");
    setPos({ top: r.bottom + 4, left: Math.max(8, Math.min(r.left, window.innerWidth - width - 8)), width });
    setOpen(true);
  }

  function close() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  // Close on click outside, Escape, scroll or resize (the panel is fixed to the screen).
  // On phones the panel is a sheet that doesn't follow the button, and the on-screen
  // keyboard scrolls and resizes the page, so only clicks outside and Escape close it.
  useEffect(() => {
    if (!open) return;
    const narrow = isNarrow();
    const outside = (e) => {
      if (!panelRef.current?.contains(e.target) && !buttonRef.current?.contains(e.target)) setOpen(false);
    };
    const key = (e) => e.key === "Escape" && close();
    const scroll = (e) => !panelRef.current?.contains(e.target) && setOpen(false);
    const resize = () => setOpen(false);
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", key);
    if (!narrow) {
      document.addEventListener("scroll", scroll, true);
      window.addEventListener("resize", resize);
    }
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", key);
      document.removeEventListener("scroll", scroll, true);
      window.removeEventListener("resize", resize);
    };
  }, [open]);

  const q = norm(search.trim());
  const visible = q ? options.filter((v) => norm(show(v)).includes(q)) : options;
  const visibleTicked = visible.filter((v) => draft.has(v)).length;
  const allTicked = visible.length > 0 && visibleTicked === visible.length;

  // As in Excel: while searching, OK keeps only the ticked values among the search results.
  const result = q ? visible.filter((v) => draft.has(v)) : options.filter((v) => draft.has(v));

  function toggle(v) {
    const next = new Set(draft);
    next.has(v) ? next.delete(v) : next.add(v);
    setDraft(next);
  }

  function toggleAll() {
    const next = new Set(draft);
    visible.forEach((v) => (allTicked ? next.delete(v) : next.add(v)));
    setDraft(next);
  }

  function apply() {
    const next = new Set([...(unticked ?? [])].filter((v) => !options.includes(v)));
    options.forEach((v) => !result.includes(v) && next.add(v));
    onApply(next.size ? next : null);
    close();
  }

  return (
    <>
      <button
        ref={buttonRef}
        className={`filter-btn${unticked ? " on" : ""}`}
        onClick={() => (open ? close() : openPanel())}
        aria-label={`Filter ${label.toLowerCase()}${unticked ? " (filtered)" : ""}`}
        aria-expanded={open}
        title={unticked ? "Filtered" : "Filter"}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M1.5 2.5h13l-5 6v5l-3-1.5v-3.5z" fill={unticked ? "currentColor" : "none"}
                stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div ref={panelRef} className="filter-panel" role="dialog" aria-label={`Filter ${label.toLowerCase()}`}
             style={{ top: pos.top, left: pos.left, width: pos.width }}>
          {matchAll && (
            <p className="filter-note">Tick what you have. For “Mat or Bed”, either one is enough.</p>
          )}
          <input
            type="search"
            className="filter-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            aria-label={`Search ${label.toLowerCase()} values`}
            autoComplete="off"
            autoFocus={!isNarrow()}
          />
          <div className="filter-list">
            {visible.length > 0 && (
              <label className="filter-all">
                <input
                  type="checkbox"
                  checked={allTicked}
                  ref={(el) => el && (el.indeterminate = visibleTicked > 0 && !allTicked)}
                  onChange={toggleAll}
                />
                {q ? "(Select all search results)" : "(Select all)"}
              </label>
            )}
            {visible.slice(0, MAX_SHOWN).map((v) => (
              <label key={v} title={show(v)}>
                <input type="checkbox" checked={draft.has(v)} onChange={() => toggle(v)} />
                <Dot column={column} value={v} />
                <span>{show(v)}</span>
              </label>
            ))}
            {visible.length > MAX_SHOWN && (
              <p className="filter-note">{visible.length - MAX_SHOWN} more — type to narrow the list.</p>
            )}
            {!visible.length && <p className="filter-note">No matches.</p>}
          </div>
          <div className="filter-actions">
            {unticked && (
              <button className="chip" onClick={() => { onApply(null); close(); }}>Clear filter</button>
            )}
            <span className="spacer" />
            <button className="chip" onClick={close}>Cancel</button>
            <button className="chip primary" onClick={apply} disabled={!result.length && !matchAll}>OK</button>
          </div>
        </div>
      )}
    </>
  );
}
