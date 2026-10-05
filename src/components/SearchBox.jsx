export default function SearchBox({ value, onChange }) {
  return (
    <>
      <input
        className="search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Try “knee or hip”"
        aria-label="Search exercises"
        autoComplete="off"
      />
      <p className="hint">
        Words together must all match. Use <b>or</b> to match either: <b>knee or hip</b>. Use
        quotes for an exact phrase and <b>#12</b> for one exercise number.
      </p>
    </>
  );
}
