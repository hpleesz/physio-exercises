import { cellText } from "../search.js";
import { columnLabel } from "../columns.js";
import Tag from "./Tag.jsx";
import Thumbnail from "./Thumbnail.jsx";

// Everything about one exercise, shown when its card is opened in the list editor.
// columns: the labelled rows to show (empty ones are left out).
export default function ExerciseDetails({ ex, columns }) {
  const rows = columns.filter((c) => (Array.isArray(ex[c]) ? ex[c].length > 0 : cellText(ex[c]) !== ""));
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
                  <div className="tags">{ex[c].map((v) => <Tag key={v} column={c} value={v} />)}</div>
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
