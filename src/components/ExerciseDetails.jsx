import { cellText, list } from "../search.js";
import { TABLE_SECONDARY } from "../config.js";
import { columnLabel } from "../columns.js";
import { ColumnTags } from "./Tag.jsx";
import Thumbnail from "./Thumbnail.jsx";

// Everything about one exercise, shown when its card is opened in the list editor.
// columns: the labelled rows to show (empty ones are left out).
export default function ExerciseDetails({ ex, columns }) {
  const filled = (c) =>
    Array.isArray(ex[c]) ? ex[c].length + list(ex[TABLE_SECONDARY[c]]).length > 0 : cellText(ex[c]) !== "";
  const rows = columns.filter(filled);
  return (
    <div className="details">
      <Thumbnail src={ex.image_url} number={ex.number} className="details-drawing" />
      {ex.instructions && <p>{ex.instructions}</p>}
      {ex.comment && <p className="comment">{ex.comment}</p>}
      {rows.length > 0 && (
        <dl>
          {rows.map((c) => (
            <div key={c}>
              <dt>{columnLabel(c)}</dt>
              <dd>
                {Array.isArray(ex[c]) ? (
                  <ColumnTags ex={ex} column={c} />
                ) : (
                  cellText(ex[c])
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
