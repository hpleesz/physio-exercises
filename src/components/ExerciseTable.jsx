import { useRef, useState } from "react";
import { TABLE_MATCH_ALL } from "../config.js";
import { cellText } from "../search.js";
import ColumnFilter from "./ColumnFilter.jsx";
import Tag from "./Tag.jsx";

// Headings that read better than the database name.
const LABELS = { image_url: "Image" };

// "body_part" -> "Body part"
const label = (key) => LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");

export default function ExerciseTable({ rows, columns, colFilters, optionsFor, onFilterChange }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col">
                <div className="th-inner">
                  <span>{label(c)}</span>
                  <ColumnFilter
                    column={c}
                    label={label(c)}
                    unticked={colFilters[c]}
                    matchAll={c in TABLE_MATCH_ALL}
                    getOptions={() => optionsFor(c)}
                    onApply={(set) => onFilterChange(c, set)}
                  />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((ex) => (
              <tr key={ex.id}>
                {columns.map((c) => <td key={c} className={`col-${c}`} data-label={label(c)}>{renderCell(c, ex[c], ex)}</td>)}
              </tr>
            ))
          ) : (
            <tr>
              <td className="empty" colSpan={columns.length}>No exercises match.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function renderCell(key, value, ex) {
  if (key === "image_url") return value ? <Thumbnail src={value} number={ex.number} /> : null;
  if (Array.isArray(value)) {
    return <div className="tags">{value.map((v) => <Tag key={v} column={key} value={v} />)}</div>;
  }
  return cellText(value);
}

// The drawing itself; click to see it full size on top of the page. Hidden if the file can't be loaded.
function Thumbnail({ src, number }) {
  const [ok, setOk] = useState(true);
  const dialogRef = useRef(null);
  if (!ok) return null;
  return (
    <>
      <button className="thumb-btn" onClick={() => dialogRef.current.showModal()}
              aria-label={`Show drawing of exercise ${number ?? ""} full size`}>
        <img className="thumb" src={src} alt="" loading="lazy" onError={() => setOk(false)} />
      </button>
      {/* Click anywhere or press Escape to close */}
      <dialog ref={dialogRef} className="lightbox" onClick={() => dialogRef.current.close()}>
        <img src={src} alt={`Drawing of exercise ${number ?? ""}`} />
      </dialog>
    </>
  );
}
