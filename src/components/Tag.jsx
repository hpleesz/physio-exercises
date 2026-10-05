import { COLOURS, PALETTE } from "../config.js";

// The colour set in config.js for one value of a list column, or null.
export function colourOf(column, value) {
  const c = COLOURS[column]?.[value];
  return c ? PALETTE[c] ?? c : null;
}

// A small tag, tinted with the value's colour.
export default function Tag({ column, value }) {
  const c = colourOf(column, value);
  return <span className="tag" style={c ? { "--tag": c } : undefined}>{value}</span>;
}

// Just the coloured dot, for filter buttons and tick-box lists.
export function Dot({ column, value }) {
  const c = colourOf(column, value);
  return c ? <span className="dot" style={{ "--tag": c }} aria-hidden="true" /> : null;
}
