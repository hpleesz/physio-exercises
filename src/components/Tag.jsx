import { Fragment } from "react";
import { COLOURS, PALETTE, TABLE_MATCH_ALL, TABLE_SECONDARY } from "../config.js";
import { alternatives } from "../search.js";

// The colour set in config.js for one value of a list column, or null.
export function colourOf(column, value) {
  const c = COLOURS[column]?.[value];
  return c ? PALETTE[c] ?? c : null;
}

// A small tag, tinted with the value's colour. Alternatives ("Mat/Bed") become a group: Mat or Bed.
export default function Tag({ column, value }) {
  const alts = column in TABLE_MATCH_ALL ? alternatives(value) : [value];
  if (alts.length > 1) {
    return (
      <span className="tag-alt">
        {alts.map((v, i) => (
          <Fragment key={v}>
            {i > 0 && <span className="or">or</span>}
            <Tag column={column} value={v} />
          </Fragment>
        ))}
      </span>
    );
  }
  const c = colourOf(column, value);
  return <span className="tag" style={c ? { "--tag": c } : undefined}>{value}</span>;
}

// All of a list column's tags for one exercise. For e.g. body_part, the other body parts
// (TABLE_SECONDARY) follow the main ones as lighter, dashed tags.
export function ColumnTags({ ex, column }) {
  const main = Array.isArray(ex[column]) ? ex[column] : [];
  const other = TABLE_SECONDARY[column] && Array.isArray(ex[TABLE_SECONDARY[column]]) ? ex[TABLE_SECONDARY[column]] : [];
  if (!main.length && !other.length) return null;
  return (
    <div className="tags">
      {main.map((v) => <Tag key={v} column={column} value={v} />)}
      {other.length > 0 && (
        <span className="tags-other" title="Also involved">
          {other.map((v) => <Tag key={v} column={column} value={v} />)}
        </span>
      )}
    </div>
  );
}

// Just the coloured dot, for filter buttons and tick-box lists.
export function Dot({ column, value }) {
  const c = colourOf(column, value);
  return c ? <span className="dot" style={{ "--tag": c }} aria-hidden="true" /> : null;
}
