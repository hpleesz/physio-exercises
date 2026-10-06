import { Fragment } from "react";
import { COLOURS, PALETTE, TABLE_MATCH_ALL } from "../config.js";
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

// Just the coloured dot, for filter buttons and tick-box lists.
export function Dot({ column, value }) {
  const c = colourOf(column, value);
  return c ? <span className="dot" style={{ "--tag": c }} aria-hidden="true" /> : null;
}
