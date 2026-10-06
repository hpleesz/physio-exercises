import { useState } from "react";
import { PALETTE } from "../config.js";
import { createTag, deleteTag, renameTag, setTagColour } from "../supabase.js";

// A tag's colour (a PALETTE name or a colour code) as a style for a .tag, .dot or swatch.
export const tagStyle = (colour) => (colour ? { "--tag": PALETTE[colour] ?? colour } : undefined);

// "Manage tags" on My lists: colour, rename, delete and add your saved tags.
// tags: [{ name, colour }]; counts: Map of tag name -> how many lists use it.
export default function TagManager({ tags, counts, onChanged }) {
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  // Runs a change, then reloads tags and lists. Returns whether it worked.
  async function run(change) {
    setError("");
    try {
      await change();
      await onChanged();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }

  async function add(e) {
    e.preventDefault();
    if (newName.trim() && (await run(() => createTag(newName)))) setNewName("");
  }

  return (
    <details className="tag-manager">
      <summary>Manage tags</summary>
      {tags.length === 0 && <p className="count">No tags yet.</p>}
      <ul className="tag-rows">
        {tags.map((t) => (
          <TagRow key={t.name} tag={t} count={counts.get(t.name) ?? 0} run={run}
                  exists={(n) => tags.some((x) => x.name === n)} />
        ))}
      </ul>
      <form className="tag-add" onSubmit={add}>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New tag"
               aria-label="New tag name" />
        <button className="chip" disabled={!newName.trim()}>Add tag</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </details>
  );
}

function TagRow({ tag, count, run, exists }) {
  const [name, setName] = useState(tag.name);
  const [picking, setPicking] = useState(false);

  async function rename() {
    const n = name.trim();
    if (!n || n === tag.name) return setName(tag.name);
    if (exists(n) && !window.confirm(`“${n}” already exists. Merge “${tag.name}” into it?`)) return setName(tag.name);
    if (!(await run(() => renameTag(tag.name, n)))) setName(tag.name);
  }

  async function remove() {
    const where = count ? ` It will be taken off ${count} ${count === 1 ? "list" : "lists"}.` : "";
    if (window.confirm(`Delete the tag “${tag.name}”?${where}`)) await run(() => deleteTag(tag.name));
  }

  async function pick(colour) {
    setPicking(false);
    await run(() => setTagColour(tag.name, colour));
  }

  return (
    <li>
      <div className="tag-row">
        <button className="swatch-btn" onClick={() => setPicking(!picking)} aria-expanded={picking}
                aria-label={`Colour of ${tag.name}: ${tag.colour ?? "grey"}. Change`}>
          <span className="swatch" style={tagStyle(tag.colour)} />
        </button>
        <input value={name} onChange={(e) => setName(e.target.value)} onBlur={rename}
               onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
               aria-label={`Name of tag ${tag.name}`} />
        <span className="count">{count} {count === 1 ? "list" : "lists"}</span>
        <button className="remove" onClick={remove} aria-label={`Delete tag ${tag.name}`}>×</button>
      </div>
      {picking && (
        <div className="swatches" role="group" aria-label={`Pick a colour for ${tag.name}`}>
          <button className="swatch-btn" onClick={() => pick(null)} aria-pressed={!tag.colour} title="Grey (no colour)">
            <span className="swatch" />
          </button>
          {Object.keys(PALETTE).map((c) => (
            <button key={c} className="swatch-btn" onClick={() => pick(c)} aria-pressed={tag.colour === c} title={c}>
              <span className="swatch" style={tagStyle(c)} />
            </button>
          ))}
        </div>
      )}
    </li>
  );
}
