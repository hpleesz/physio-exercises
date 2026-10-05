import { FILTERS } from "../config.js";
import { list } from "../search.js";

export default function Filters({ exercises, active, onChange }) {
  return FILTERS.map((f) => {
    const values = [...new Set(exercises.flatMap((ex) => list(ex[f.key])))].sort();
    if (!values.length) return null;
    const current = active[f.key] ?? null;
    return (
      <div className="filter" role="group" aria-label={`Filter by ${f.label.toLowerCase()}`} key={f.key}>
        <div className="filter-label">{f.label}</div>
        <div className="chips">
          <Chip on={!current} onClick={() => onChange(f.key, null)}>All</Chip>
          {values.map((v) => (
            <Chip key={v} on={current === v} onClick={() => onChange(f.key, v)}>{v}</Chip>
          ))}
        </div>
      </div>
    );
  });
}

function Chip({ on, onClick, children }) {
  return (
    <button className="chip" aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}
