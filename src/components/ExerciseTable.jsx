import { TABLE_MATCH_ALL } from "../config.js";
import { cellText } from "../search.js";
import { columnLabel as label } from "../columns.js";
import ColumnFilter from "./ColumnFilter.jsx";
import Tag from "./Tag.jsx";
import Thumbnail from "./Thumbnail.jsx";

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
                    filter={colFilters[c]}
                    matchAll={c in TABLE_MATCH_ALL}
                    getOptions={() => optionsFor(c)}
                    onApply={(filter) => onFilterChange(c, filter)}
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
