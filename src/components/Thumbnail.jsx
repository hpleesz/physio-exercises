import { useRef, useState } from "react";

// The drawing itself; click to see it full size on top of the page. Hidden if the file can't be loaded.
export default function Thumbnail({ src, number, className = "thumb" }) {
  const [ok, setOk] = useState(true);
  const dialogRef = useRef(null);
  if (!src || !ok) return null;
  return (
    <>
      <button className="thumb-btn" onClick={() => dialogRef.current.showModal()}
              aria-label={`Show drawing of exercise ${number ?? ""} full size`}>
        <img className={className} src={src} alt="" loading="lazy" onError={() => setOk(false)} />
      </button>
      {/* Click anywhere or press Escape to close */}
      <dialog ref={dialogRef} className="lightbox" onClick={() => dialogRef.current.close()}>
        <img src={src} alt={`Drawing of exercise ${number ?? ""}`} />
      </dialog>
    </>
  );
}
