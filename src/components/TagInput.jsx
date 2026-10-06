import { useId, useState } from "react";
import { norm } from "../search.js";
import { tagStyle } from "./TagManager.jsx";

// Type a tag and press Enter or comma to add it; × or Backspace removes one.
// While typing, a list of your saved tags (in their colours) appears to pick from:
// ↑/↓ to move, Enter to add, Esc to close.
// colours: Map of tag name -> colour, to show each tag in its colour.
export default function TagInput({ tags, onChange, suggestions = [], colours, labelledBy }) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1); // highlighted option, -1 = none
  const id = useId();
  const has = (t) => tags.some((x) => x.toLowerCase() === t.toLowerCase());

  const typed = text.replace(/,/g, " ").trim();
  const q = norm(typed);
  const matches = suggestions.filter((s) => !has(s) && norm(s).includes(q));
  const isNew = typed && !has(typed) && !suggestions.some((s) => s.toLowerCase() === typed.toLowerCase());
  const options = [...matches.map((name) => ({ name })), ...(isNew ? [{ name: typed, create: true }] : [])];
  const showList = open && options.length > 0;

  function add(raw) {
    const t = raw.replace(/,/g, " ").trim();
    if (t && !has(t)) onChange([...tags, t]);
    setText("");
    setActive(-1);
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((a) => (options.length ? (a + step + options.length) % options.length : -1));
    } else if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(showList && active >= 0 ? options[active].name : text);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    } else if (e.key === "Backspace" && !text && tags.length) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div className="tag-input">
      {tags.map((t) => (
        <span className="tag" key={t} style={tagStyle(colours?.get(t))}>
          {t}
          <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Remove tag ${t}`}>
            ×
          </button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => { setText(e.target.value); setOpen(true); setActive(-1); }}
        onKeyDown={onKeyDown}
        onFocus={() => setOpen(true)}
        onBlur={() => { add(text); setOpen(false); }}
        role="combobox"
        aria-expanded={showList}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${id}-${active}` : undefined}
        aria-labelledby={labelledBy}
        placeholder={tags.length ? "Add another…" : "e.g. knee, beginner – press Enter"}
      />
      {showList && (
        <ul className="tag-suggest" id={`${id}-list`} role="listbox">
          {options.map((o, i) => (
            <li
              key={(o.create ? "+" : "") + o.name}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? "active" : undefined}
              onMouseDown={(e) => { e.preventDefault(); add(o.name); }} // keep focus in the box
              onMouseEnter={() => setActive(i)}
            >
              {o.create ? (
                <>
                  <span className="tag-suggest-new">Create</span>
                  <span className="tag">{o.name}</span>
                </>
              ) : (
                <span className="tag" style={tagStyle(colours?.get(o.name))}>{o.name}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
