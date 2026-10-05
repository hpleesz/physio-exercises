import { useState } from "react";
import { TAG_COLUMNS } from "../config.js";
import { list } from "../search.js";

export default function ExerciseItem({ ex }) {
  const [imageOk, setImageOk] = useState(true);
  const title = ex.name || ex.instructions || "";
  const tags = TAG_COLUMNS.flatMap((c) => list(ex[c]));

  return (
    <li>
      <details>
        <summary>
          <span className="num">{ex.number ?? ""}</span>
          <span className="name">{title}</span>
          <span className="part">{list(ex.body_part).join(", ")}</span>
          {ex.image_url && imageOk && (
            <img
              className="drawing"
              src={ex.image_url}
              alt={`Drawing of exercise ${ex.number ?? ""}`}
              loading="lazy"
              onError={() => setImageOk(false)}
            />
          )}
        </summary>
        <div className="body">
          {tags.length > 0 && (
            <div className="meta">
              {tags.map((t, i) => <span className="tag" key={i}>{t}</span>)}
            </div>
          )}
          {ex.comment && <p className="comment">{ex.comment}</p>}
          {ex.name && ex.instructions && <p>{ex.instructions}</p>}
          {ex.source && <p className="source">Source: {ex.source}</p>}
        </div>
      </details>
    </li>
  );
}
